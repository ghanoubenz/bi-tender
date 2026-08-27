from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from tender_contracts.v1 import JobStatus

from engine.api.deps import auth_tenant
from engine.api.tenders import _to_status
from engine.db.base import session_scope
from engine.db.models import Job

router = APIRouter(prefix="/api/v1/jobs", tags=["jobs"])


@router.get("/{job_id}", response_model=JobStatus)
def get_job(job_id: str, tenant_id: str = Depends(auth_tenant)) -> JobStatus:
    with session_scope() as db:
        job = db.get(Job, job_id)
        if job is None or job.tenant_id != tenant_id:
            raise HTTPException(404, detail={"code": "not_found", "message": "job not found"})
        return _to_status(job)
