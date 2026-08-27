from tests.conftest import AUTH
from tests.fixtures import make_pdf


def _ingest(client, **form):
    return client.post(
        "/api/v1/tenders/ingest",
        files={"file": ("ITT.pdf", make_pdf(), "application/pdf")},
        data=form,
        headers=AUTH,
    )


def test_requires_auth(client):
    resp = client.post("/api/v1/tenders/ingest", files={"file": ("a.pdf", b"%PDF", "application/pdf")})
    assert resp.status_code == 401


def test_requires_tenant(client):
    resp = client.post(
        "/api/v1/tenders/ingest",
        files={"file": ("a.pdf", b"%PDF-", "application/pdf")},
        headers={"Authorization": "Bearer test-token"},
    )
    assert resp.status_code == 400


def test_ingest_end_to_end_with_evidence(client):
    resp = _ingest(client, external_ref="platform-doc-1", tender_ref="tender-1")
    assert resp.status_code == 202
    job_id = resp.json()["id"]

    # TestClient runs background tasks before returning; job should be done.
    job = client.get(f"/api/v1/jobs/{job_id}", headers=AUTH).json()
    assert job["state"] == "succeeded", job.get("error")
    result = job["result"]
    assert result["kind"] == "pdf" and result["page_count"] == 2

    meta = result["metadata"]
    assert meta["tender_reference"]["value"] == "ITT-2026-0042"
    assert meta["submission_deadline"]["value"].startswith("15 October 2026")
    ev = meta["tender_reference"]["evidence"][0]
    assert ev["verified"] is True and ev["page"] == 1 and ev["block_id"]
    # Unknown fields are null + flagged, never guessed (PRODUCT_CONTRACT rule 1).
    assert meta["country"]["value"] is None and meta["country"]["needs_review"] is True

    # Evidence viewer: blocks endpoint returns the cited block.
    doc_id = result["document_id"]
    blocks = client.get(f"/api/v1/documents/{doc_id}/blocks", headers=AUTH).json()
    cited = next(b for b in blocks if b["id"] == ev["block_id"])
    assert "ITT-2026-0042" in cited["text"]


def test_tenant_isolation_on_jobs_and_documents(client):
    resp = _ingest(client)
    job_id = resp.json()["id"]
    other = {"Authorization": "Bearer test-token", "X-Tenant-ID": "tenant-b"}
    assert client.get(f"/api/v1/jobs/{job_id}", headers=other).status_code == 404
    doc_id = client.get(f"/api/v1/jobs/{job_id}", headers=AUTH).json()["result"]["document_id"]
    assert client.get(f"/api/v1/documents/{doc_id}/blocks", headers=other).status_code == 404


def test_idempotency_key_returns_same_job(client):
    first = _ingest(client, idempotency_key="abc").json()
    second = _ingest(client, idempotency_key="abc").json()
    assert first["id"] == second["id"]
