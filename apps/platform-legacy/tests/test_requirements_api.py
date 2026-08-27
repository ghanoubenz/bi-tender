"""Platform-side requirement mirroring, review workflow, and isolation."""

from unittest.mock import patch

from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from tender_contracts.v1 import JobState, JobStatus, JobType


def job(state="queued", jtype=JobType.INGEST, result=None):
    return JobStatus(id="job-1", type=jtype, state=JobState(state), tenant_id="t", result=result)


REQ_PAYLOADS = [
    {
        "id": "eng-req-1",
        "text": "The Bidder shall have completed 3 similar projects.",
        "category": "qualification",
        "mandatory": True,
        "evidence": [
            {
                "document_id": "eng-doc-1",
                "filename": "ITT.pdf",
                "page": 42,
                "clause": "7.3.2",
                "block_id": "blk-9",
                "quote": "The Bidder shall have completed 3 similar projects.",
                "method": "rule",
                "confidence": 0.75,
                "verified": True,
            }
        ],
        "confidence": 0.75,
        "needs_review": False,
    },
    {
        "id": "eng-req-2",
        "text": "The Contractor must hold ISO 9001 certification.",
        "category": "certification",
        "mandatory": True,
        "evidence": [
            {
                "document_id": "eng-doc-1",
                "block_id": "blk-11",
                "quote": "The Contractor must hold ISO 9001 certification.",
                "method": "rule",
                "confidence": 0.4,
                "verified": False,
            }
        ],
        "confidence": 0.4,
        "needs_review": True,
    },
]


def _tender_with_requirements(api, MockClient):
    """Drive create → upload → ingest → extract-requirements through refresh()."""
    client = MockClient.return_value
    client.ingest.return_value = job("queued")
    tender_id = api.post("/api/tenders/", {"title": "T"}, format="json").json()["id"]
    api.post(
        f"/api/tenders/{tender_id}/documents/",
        {"file": SimpleUploadedFile("ITT.pdf", b"%PDF-1.7", content_type="application/pdf")},
        format="multipart",
    )
    # 1st refresh: ingestion completes, requirement extraction is kicked off.
    client.get_job.return_value = job("succeeded", result={"document_id": "eng-doc-1", "metadata": {}})
    client.extract_requirements.return_value = job("queued", jtype=JobType.EXTRACT_REQUIREMENTS)
    api.post(f"/api/tenders/{tender_id}/refresh/")
    # 2nd refresh: extraction job has finished.
    client.get_job.return_value = job(
        "succeeded", jtype=JobType.EXTRACT_REQUIREMENTS, result={"requirements": REQ_PAYLOADS}
    )
    resp = api.post(f"/api/tenders/{tender_id}/refresh/")
    return tender_id, resp


@patch("tenders.views.EngineClient")
def test_requirements_pipeline_advances_through_refresh(MockClient, api):
    tender_id, resp = _tender_with_requirements(api, MockClient)
    assert resp.json()["requirements_status"] == "ready"
    MockClient.return_value.extract_requirements.assert_called_once()

    reqs = api.get(f"/api/tenders/{tender_id}/requirements/").json()
    assert len(reqs) == 2
    qualification = next(r for r in reqs if r["category"] == "qualification")
    assert qualification["evidence"][0]["page"] == 42
    assert qualification["evidence"][0]["clause"] == "7.3.2"
    assert qualification["review_status"] == "pending"


@patch("tenders.views.EngineClient")
def test_requirement_filters_and_review_queue(MockClient, api):
    tender_id, _ = _tender_with_requirements(api, MockClient)
    certs = api.get(f"/api/tenders/{tender_id}/requirements/?category=certification").json()
    assert len(certs) == 1 and certs[0]["category"] == "certification"

    queue = api.get(f"/api/tenders/{tender_id}/requirements/?needs_review=true").json()
    assert len(queue) == 1 and queue[0]["evidence"][0]["verified"] is False


@patch("tenders.views.EngineClient")
def test_human_review_clears_the_queue_and_is_audited(MockClient, api):
    tender_id, _ = _tender_with_requirements(api, MockClient)
    queue = api.get(f"/api/tenders/{tender_id}/requirements/?needs_review=true").json()
    req_id = queue[0]["id"]

    resp = api.post(
        f"/api/requirements/{req_id}/review/",
        {"review_status": "accepted", "note": "Checked against clause 4.1"},
        format="json",
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["review_status"] == "accepted" and body["needs_review"] is False

    assert api.get(f"/api/tenders/{tender_id}/requirements/?needs_review=true").json() == []

    from tenders.models import Requirement

    requirement = Requirement.objects.get(pk=req_id)
    assert requirement.reviewed_by is not None and requirement.reviewed_at is not None
    assert requirement.history.count() >= 2


@patch("tenders.views.EngineClient")
def test_re_extraction_preserves_human_review_state(MockClient, api):
    tender_id, _ = _tender_with_requirements(api, MockClient)
    req_id = api.get(f"/api/tenders/{tender_id}/requirements/?needs_review=true").json()[0]["id"]
    api.post(f"/api/requirements/{req_id}/review/", {"review_status": "rejected"}, format="json")

    # Re-upload triggers a fresh extraction returning the same requirement texts.
    client = MockClient.return_value
    client.ingest.return_value = job("queued")
    api.post(
        f"/api/tenders/{tender_id}/documents/",
        {"file": SimpleUploadedFile("Addendum.pdf", b"%PDF-1.7", content_type="application/pdf")},
        format="multipart",
    )
    client.get_job.return_value = job("succeeded", result={"document_id": "eng-doc-2", "metadata": {}})
    api.post(f"/api/tenders/{tender_id}/refresh/")
    client.get_job.return_value = job(
        "succeeded", jtype=JobType.EXTRACT_REQUIREMENTS, result={"requirements": REQ_PAYLOADS}
    )
    api.post(f"/api/tenders/{tender_id}/refresh/")

    reqs = api.get(f"/api/tenders/{tender_id}/requirements/").json()
    rejected = [r for r in reqs if r["review_status"] == "rejected"]
    assert len(rejected) == 1, "human review state was lost on re-extraction"


@patch("tenders.views.EngineClient")
def test_requirement_review_is_tenant_isolated(MockClient, api, other_tenant):
    tender_id, _ = _tender_with_requirements(api, MockClient)
    req_id = api.get(f"/api/tenders/{tender_id}/requirements/").json()[0]["id"]

    from core.models import User

    outsider = User.objects.create_user(username="eve", password="x", tenant=other_tenant)
    other = APIClient()
    other.force_authenticate(outsider)
    assert other.get(f"/api/requirements/{req_id}/").status_code == 404
    assert (
        other.post(f"/api/requirements/{req_id}/review/", {"review_status": "accepted"}, format="json").status_code
        == 404
    )


@patch("tenders.views.EngineClient")
def test_extraction_not_triggered_while_a_document_is_still_processing(MockClient, api):
    client = MockClient.return_value
    client.ingest.return_value = job("queued")
    tender_id = api.post("/api/tenders/", {"title": "T"}, format="json").json()["id"]
    for name in ("a.pdf", "b.pdf"):
        api.post(
            f"/api/tenders/{tender_id}/documents/",
            {"file": SimpleUploadedFile(name, b"%PDF-1.7", content_type="application/pdf")},
            format="multipart",
        )
    # Only the first document finishes; the second stays in flight.
    calls = {"n": 0}

    def get_job(**kwargs):
        calls["n"] += 1
        return job("succeeded", result={"document_id": "d1", "metadata": {}}) if calls["n"] == 1 else job("running")

    client.get_job.side_effect = get_job
    api.post(f"/api/tenders/{tender_id}/refresh/")
    client.extract_requirements.assert_not_called()
