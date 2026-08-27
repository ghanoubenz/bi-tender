from __future__ import annotations

from fastapi import APIRouter, BackgroundTasks, Depends, File, Form, HTTPException, UploadFile
from pydantic import BaseModel

from tender_contracts.v1 import ExtractedRequirement, JobState, JobStatus, JobType

from engine.api.deps import auth_tenant
from engine.config import get_settings
from engine.db.base import session_scope
from engine.db.models import EngineDocument, ExtractedFact, Job
from engine.jobs.runner import run_extract_requirements_job, run_ingest_job

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


class ExtractRequirementsRequest(BaseModel):
    """Extract requirements over already-ingested documents.

    Provide either explicit document_ids or a tender_ref (all its documents).
    """

    document_ids: list[str] | None = None
    tender_ref: str | None = None
    idempotency_key: str | None = None


@router.post("/extract-requirements", response_model=JobStatus, status_code=202)
def extract_requirements_endpoint(
    body: ExtractRequirementsRequest,
    background: BackgroundTasks,
    tenant_id: str = Depends(auth_tenant),
) -> JobStatus:
    with session_scope() as db:
        query = db.query(EngineDocument).filter_by(tenant_id=tenant_id, status="ingested")
        if body.document_ids:
            query = query.filter(EngineDocument.id.in_(body.document_ids))
        elif body.tender_ref:
            query = query.filter_by(tender_ref=body.tender_ref)
        else:
            raise HTTPException(
                400,
                detail={"code": "missing_target", "message": "document_ids or tender_ref required"},
            )
        document_ids = [d.id for d in query.all()]

    if not document_ids:
        raise HTTPException(
            404,
            detail={"code": "no_documents", "message": "no ingested documents match the request"},
        )

    if body.idempotency_key:
        with session_scope() as db:
            existing = (
                db.query(Job)
                .filter_by(
                    tenant_id=tenant_id,
                    idempotency_key=body.idempotency_key,
                    type="extract_requirements",
                )
                .first()
            )
            if existing:
                return _to_status(existing)

    with session_scope() as db:
        job = Job(
            tenant_id=tenant_id,
            type="extract_requirements",
            idempotency_key=body.idempotency_key,
            input={"document_ids": document_ids},
        )
        db.add(job)
        db.flush()
        job_id = job.id
        snapshot = _to_status(job)

    background.add_task(run_extract_requirements_job, job_id, document_ids)
    return snapshot


@router.get("/{tender_ref}/requirements", response_model=list[ExtractedRequirement])
def list_requirements(
    tender_ref: str,
    needs_review: bool | None = None,
    category: str | None = None,
    tenant_id: str = Depends(auth_tenant),
) -> list[ExtractedRequirement]:
    """Stored requirements for a tender, newest extraction, with filters."""
    with session_scope() as db:
        document_ids = [
            d.id
            for d in db.query(EngineDocument).filter_by(tenant_id=tenant_id, tender_ref=tender_ref).all()
        ]
        if not document_ids:
            return []
        query = db.query(ExtractedFact).filter(
            ExtractedFact.tenant_id == tenant_id,
            ExtractedFact.kind == "requirement",
            ExtractedFact.document_id.in_(document_ids),
        )
        if needs_review is not None:
            query = query.filter(ExtractedFact.needs_review == needs_review)
        facts = query.order_by(ExtractedFact.created_at).all()
        requirements = [ExtractedRequirement.model_validate(f.payload) for f in facts]
    if category:
        requirements = [r for r in requirements if r.category.value == category]
    return requirements
