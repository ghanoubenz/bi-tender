from tests.conftest import AUTH
from tests.fixtures import make_requirements_docx

DOCX_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"


def _ingest(client, tender_ref="tender-1"):
    resp = client.post(
        "/api/v1/tenders/ingest",
        files={"file": ("ITT.docx", make_requirements_docx(), DOCX_TYPE)},
        data={"tender_ref": tender_ref},
        headers=AUTH,
    )
    job = client.get(f"/api/v1/jobs/{resp.json()['id']}", headers=AUTH).json()
    assert job["state"] == "succeeded", job.get("error")
    return job["result"]["document_id"]


def test_extract_requirements_end_to_end(client):
    _ingest(client)
    resp = client.post(
        "/api/v1/tenders/extract-requirements", json={"tender_ref": "tender-1"}, headers=AUTH
    )
    assert resp.status_code == 202
    job = client.get(f"/api/v1/jobs/{resp.json()['id']}", headers=AUTH).json()
    assert job["state"] == "succeeded", job.get("error")

    result = job["result"]
    assert result["requirement_count"] >= 5
    assert result["needs_review_count"] == 0
    categories = {r["category"] for r in result["requirements"]}
    assert {"qualification", "certification", "schedule"} <= categories
    for req in result["requirements"]:
        assert req["evidence"] and req["evidence"][0]["verified"] is True
        assert req["evidence"][0]["block_id"]


def test_requirements_are_listable_and_filterable(client):
    _ingest(client)
    client.post("/api/v1/tenders/extract-requirements", json={"tender_ref": "tender-1"}, headers=AUTH)

    all_reqs = client.get("/api/v1/tenders/tender-1/requirements", headers=AUTH).json()
    assert len(all_reqs) >= 5

    certs = client.get(
        "/api/v1/tenders/tender-1/requirements", params={"category": "certification"}, headers=AUTH
    ).json()
    assert certs and all(r["category"] == "certification" for r in certs)

    review_queue = client.get(
        "/api/v1/tenders/tender-1/requirements", params={"needs_review": "true"}, headers=AUTH
    ).json()
    assert review_queue == []


def test_re_extraction_replaces_previous_set(client):
    _ingest(client)
    for _ in range(2):
        client.post(
            "/api/v1/tenders/extract-requirements", json={"tender_ref": "tender-1"}, headers=AUTH
        )
    reqs = client.get("/api/v1/tenders/tender-1/requirements", headers=AUTH).json()
    texts = [r["text"] for r in reqs]
    assert len(texts) == len(set(texts)), "re-extraction duplicated requirements"


def test_tenant_isolation_on_requirements(client):
    _ingest(client)
    client.post("/api/v1/tenders/extract-requirements", json={"tender_ref": "tender-1"}, headers=AUTH)
    other = {"Authorization": "Bearer test-token", "X-Tenant-ID": "tenant-b"}
    assert client.get("/api/v1/tenders/tender-1/requirements", headers=other).json() == []
    assert (
        client.post(
            "/api/v1/tenders/extract-requirements", json={"tender_ref": "tender-1"}, headers=other
        ).status_code
        == 404
    )


def test_requires_target(client):
    resp = client.post("/api/v1/tenders/extract-requirements", json={}, headers=AUTH)
    assert resp.status_code == 400
