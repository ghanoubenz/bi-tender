"""HTTP client for the Tender AI Engine.

This module is the ONLY place the platform talks to the engine. It speaks
contracts over HTTP — no shared code beyond tender-contracts, ever.
"""

from __future__ import annotations

import httpx
from django.conf import settings
from tender_contracts.v1 import JobStatus


class EngineClient:
    def __init__(self, base_url: str | None = None, token: str | None = None):
        self.base_url = (base_url or settings.ENGINE_BASE_URL).rstrip("/")
        self.token = token or settings.ENGINE_SERVICE_TOKEN

    def _headers(self, tenant_id: str) -> dict:
        return {"Authorization": f"Bearer {self.token}", "X-Tenant-ID": str(tenant_id)}

    def ingest(
        self,
        *,
        tenant_id: str,
        filename: str,
        content: bytes,
        content_type: str | None,
        external_ref: str,
        tender_ref: str,
    ) -> JobStatus:
        resp = httpx.post(
            f"{self.base_url}/api/v1/tenders/ingest",
            headers=self._headers(tenant_id),
            files={"file": (filename, content, content_type or "application/octet-stream")},
            data={
                "external_ref": external_ref,
                "tender_ref": tender_ref,
                "idempotency_key": external_ref,
            },
            timeout=120,
        )
        resp.raise_for_status()
        return JobStatus.model_validate(resp.json())

    def get_job(self, *, tenant_id: str, job_id: str) -> JobStatus:
        resp = httpx.get(
            f"{self.base_url}/api/v1/jobs/{job_id}", headers=self._headers(tenant_id), timeout=30
        )
        resp.raise_for_status()
        return JobStatus.model_validate(resp.json())

    def get_blocks(self, *, tenant_id: str, document_id: str) -> list[dict]:
        resp = httpx.get(
            f"{self.base_url}/api/v1/documents/{document_id}/blocks",
            headers=self._headers(tenant_id),
            timeout=60,
        )
        resp.raise_for_status()
        return resp.json()

    def extract_requirements(self, *, tenant_id: str, tender_ref: str) -> JobStatus:
        resp = httpx.post(
            f"{self.base_url}/api/v1/tenders/extract-requirements",
            headers=self._headers(tenant_id),
            json={"tender_ref": tender_ref, "idempotency_key": None},
            timeout=120,
        )
        resp.raise_for_status()
        return JobStatus.model_validate(resp.json())

    def list_requirements(self, *, tenant_id: str, tender_ref: str) -> list[dict]:
        resp = httpx.get(
            f"{self.base_url}/api/v1/tenders/{tender_ref}/requirements",
            headers=self._headers(tenant_id),
            timeout=60,
        )
        resp.raise_for_status()
        return resp.json()
