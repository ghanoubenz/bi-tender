from unittest.mock import patch

import pytest
from rest_framework.test import APIClient
from tender_contracts.v1 import JobState, JobStatus, JobType


def make_job(state="queued", result=None):
    return JobStatus(id="job-1", type=JobType.INGEST, state=JobState(state), tenant_id="t", result=result)


def test_unauthenticated_rejected(db):
    assert APIClient().get("/api/tenders/").status_code == 401


def test_create_and_list_tender(api):
    resp = api.post("/api/tenders/", {"title": "WTP Sohar", "reference": "ITT-42"}, format="json")
    assert resp.status_code == 201
    assert api.get("/api/tenders/").json()["results"][0]["title"] == "WTP Sohar"


def test_tenant_isolation(api, other_tenant):
    from core.models import User

    api.post("/api/tenders/", {"title": "Secret tender"}, format="json")
    outsider = User.objects.create_user(username="eve", password="x", tenant=other_tenant)
    other_client = APIClient()
    other_client.force_authenticate(outsider)
    assert other_client.get("/api/tenders/").json()["count"] == 0


@patch("tenders.views.EngineClient")
def test_upload_document_triggers_ingest(MockClient, api):
    MockClient.return_value.ingest.return_value = make_job("queued")
    tender_id = api.post("/api/tenders/", {"title": "T"}, format="json").json()["id"]
    from django.core.files.uploadedfile import SimpleUploadedFile

    f = SimpleUploadedFile("ITT.pdf", b"%PDF-1.7 fake", content_type="application/pdf")
    resp = api.post(f"/api/tenders/{tender_id}/documents/", {"file": f}, format="multipart")
    assert resp.status_code == 201
    assert resp.json()["ingestion_status"] == "processing"
    assert MockClient.return_value.ingest.called
    kwargs = MockClient.return_value.ingest.call_args.kwargs
    assert kwargs["filename"] == "ITT.pdf" and kwargs["tender_ref"] == tender_id


@patch("tenders.views.EngineClient")
def test_refresh_syncs_metadata(MockClient, api):
    MockClient.return_value.ingest.return_value = make_job("queued")
    tender_id = api.post("/api/tenders/", {"title": "T"}, format="json").json()["id"]
    from django.core.files.uploadedfile import SimpleUploadedFile

    api.post(
        f"/api/tenders/{tender_id}/documents/",
        {"file": SimpleUploadedFile("ITT.pdf", b"%PDF-1.7", content_type="application/pdf")},
        format="multipart",
    )
    metadata = {"client": {"value": "Ministry of Water", "evidence": [], "needs_review": False}}
    MockClient.return_value.get_job.return_value = make_job(
        "succeeded", result={"document_id": "eng-doc-1", "metadata": metadata}
    )
    resp = api.post(f"/api/tenders/{tender_id}/refresh/")
    body = resp.json()
    assert body["ai_metadata"]["client"]["value"] == "Ministry of Water"
    assert body["documents"][0]["ingestion_status"] == "ingested"
    assert body["status"] == "under_review"


def test_human_decision_is_recorded_and_audited(api):
    tender_id = api.post("/api/tenders/", {"title": "T"}, format="json").json()["id"]
    resp = api.post(
        f"/api/tenders/{tender_id}/decision/",
        {"decision": "no_bid", "reason": "Missing ISO 14001 certification"},
        format="json",
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["decision"] == "no_bid" and body["status"] == "decided"

    from tenders.models import Tender

    tender = Tender.objects.get(pk=tender_id)
    assert tender.decided_by is not None
    assert tender.history.count() >= 2  # audit trail exists


def test_decision_requires_reason(api):
    tender_id = api.post("/api/tenders/", {"title": "T"}, format="json").json()["id"]
    resp = api.post(f"/api/tenders/{tender_id}/decision/", {"decision": "bid", "reason": ""}, format="json")
    assert resp.status_code == 400
