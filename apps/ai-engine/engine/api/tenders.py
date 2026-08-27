from __future__ import annotations

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, UploadFile

from tender_contracts.v1 import JobState, JobStatus, JobType

from engine.api.deps import auth_tenant
from engine.config import get_settings
from engine.db.base import session_scope
from engine.db.models import EngineDocument, Job
from engine.jobs.runner import run_ingest_job

router = APIRouter(prefix="/api/v1/tenders", tags=["tenders"])


@router.post("/ingest", response_model=JobStatus, status_code=202)
async def ingest(
    background: BackgroundTasks,
    file: UploadFile = File(...),
    external_ref: str | None = Form(default=None),
    tender_ref: str | None = Form(default=None),
    idempotency_key: str | None = Form(default=None),
    tenant_id: str = Depends(auth_tenant),
) -> JobStatus:
    """Ingest one tender document: identify → parse to blocks → extract metadata.

    Multipart upload keeps the engine callable by any external system without
    shared object storage; storage_key-based ingest is added alongside later.
    """
    data = await file.read()
    max_bytes = get_settings().max_upload_mb * 1024 * 1024
    if len(data) > max_bytes:
        raise HTTPException(413, detail={"code": "too_large", "message": f"max {get_settings().max_upload_mb}MB"})
    if not data:
        raise HTTPException(400, detail={"code": "empty_file", "message": "file is empty"})

    if idempotency_key:
        with session_scope() as db:
            existing = (
                db.query(Job)
                .filter_by(tenant_id=tenant_id, idempotency_key=idempotency_key, type="ingest")
                .first()
            )
        if existing:
            return _to_status(existing)

    with session_scope() as db:
        doc = EngineDocument(
            tenant_id=tenant_id,
            filename=file.filename or "unnamed",
            content_type=file.content_type,
            external_ref=external_ref,
            tender_ref=tender_ref,
        )
        db.add(doc)
        db.flush()
        job = Job(
            tenant_id=tenant_id,
            type="ingest",
            idempotency_key=idempotency_key,
            input={"document_id": doc.id, "filename": doc.filename},
        )
        db.add(job)
        db.flush()
        job_id, doc_id = job.id, doc.id
        job_snapshot = _to_status(job)

    background.add_task(run_ingest_job, job_id, doc_id, data)
    return job_snapshot


def _to_status(job: Job) -> JobStatus:
    return JobStatus(
        id=job.id,
        type=JobType(job.type),
        state=JobState(job.state),
        tenant_id=job.tenant_id,
        progress=job.progress,
        created_at=job.created_at,
        finished_at=job.finished_at,
        error=job.error,
        result=job.result,
    )
