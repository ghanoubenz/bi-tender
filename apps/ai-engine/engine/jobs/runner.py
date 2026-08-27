"""Job execution.

V1 runs jobs in-process via FastAPI BackgroundTasks; the Job table is the
source of truth so this swaps to Celery workers without API changes.
"""

from __future__ import annotations

import logging

from tender_contracts.v1 import DocumentKind

from engine.db.base import session_scope
from engine.db.models import DocumentBlock, EngineDocument, ExtractedFact, Job, utcnow
from engine.extraction.metadata import extract_metadata
from engine.extraction.requirements import extract_requirements
from engine.ingestion.identify import identify
from engine.parsing.service import parse_document

log = logging.getLogger(__name__)


def run_ingest_job(job_id: str, document_id: str, data: bytes) -> None:
    try:
        _set_state(job_id, "running", progress=0.05)

        with session_scope() as db:
            doc = db.get(EngineDocument, document_id)
            tenant_id, filename = doc.tenant_id, doc.filename

        kind = identify(filename, data[:8])
        parsed = parse_document(kind, data)
        _set_state(job_id, "running", progress=0.5)

        with session_scope() as db:
            doc = db.get(EngineDocument, document_id)
            doc.kind = kind.value
            doc.page_count = parsed.page_count
            for order, blk in enumerate(parsed.blocks):
                db.add(
                    DocumentBlock(
                        tenant_id=tenant_id,
                        document_id=document_id,
                        page=blk.page,
                        order=order,
                        block_type=blk.block_type,
                        section_path=blk.section_path,
                        text=blk.text,
                        table_data=blk.table_data,
                    )
                )
            doc.status = "parsed"

        with session_scope() as db:
            blocks = (
                db.query(DocumentBlock)
                .filter_by(document_id=document_id)
                .order_by(DocumentBlock.order)
                .all()
            )
        metadata = extract_metadata(tenant_id, blocks, job_id=job_id)
        _set_state(job_id, "running", progress=0.9)

        with session_scope() as db:
            db.add(
                ExtractedFact(
                    tenant_id=tenant_id,
                    document_id=document_id,
                    kind="metadata",
                    payload=metadata.model_dump(mode="json"),
                    evidence=[],
                )
            )
            doc = db.get(EngineDocument, document_id)
            doc.status = "ingested"
            job = db.get(Job, job_id)
            job.state = "succeeded"
            job.progress = 1.0
            job.finished_at = utcnow()
            job.result = {
                "document_id": document_id,
                "kind": kind.value,
                "page_count": parsed.page_count,
                "block_count": len(parsed.blocks),
                "warnings": parsed.warnings,
                "metadata": metadata.model_dump(mode="json"),
            }
    except Exception as exc:  # noqa: BLE001 — job failures are recorded, not raised
        log.exception("ingest job %s failed", job_id)
        with session_scope() as db:
            job = db.get(Job, job_id)
            job.state = "failed"
            job.error = str(exc)
            job.finished_at = utcnow()
            doc = db.get(EngineDocument, document_id)
            if doc:
                doc.status = "failed"


def _set_state(job_id: str, state: str, progress: float) -> None:
    with session_scope() as db:
        job = db.get(Job, job_id)
        job.state = state
        job.progress = progress


def run_extract_requirements_job(job_id: str, document_ids: list[str]) -> None:
    """Extract requirements across one or more already-parsed documents."""
    try:
        _set_state(job_id, "running", progress=0.1)
        with session_scope() as db:
            tenant_id = db.get(Job, job_id).tenant_id
            blocks = (
                db.query(DocumentBlock)
                .filter(DocumentBlock.document_id.in_(document_ids))
                .order_by(DocumentBlock.document_id, DocumentBlock.order)
                .all()
            )

        requirements = extract_requirements(tenant_id, blocks, job_id=job_id)
        _set_state(job_id, "running", progress=0.8)

        with session_scope() as db:
            # Re-extraction replaces the previous requirement set for these documents.
            db.query(ExtractedFact).filter(
                ExtractedFact.kind == "requirement",
                ExtractedFact.tenant_id == tenant_id,
                ExtractedFact.document_id.in_(document_ids),
            ).delete(synchronize_session=False)
            for req in requirements:
                payload = req.model_dump(mode="json")
                db.add(
                    ExtractedFact(
                        id=req.id,
                        tenant_id=tenant_id,
                        document_id=req.evidence[0].document_id,
                        kind="requirement",
                        payload=payload,
                        evidence=payload["evidence"],
                        confidence=req.confidence,
                        needs_review=req.needs_review,
                    )
                )
            job = db.get(Job, job_id)
            job.state = "succeeded"
            job.progress = 1.0
            job.finished_at = utcnow()
            job.result = {
                "document_ids": document_ids,
                "requirement_count": len(requirements),
                "needs_review_count": sum(1 for r in requirements if r.needs_review),
                "requirements": [r.model_dump(mode="json") for r in requirements],
            }
    except Exception as exc:  # noqa: BLE001 — job failures are recorded, not raised
        log.exception("extract-requirements job %s failed", job_id)
        with session_scope() as db:
            job = db.get(Job, job_id)
            job.state = "failed"
            job.error = str(exc)
            job.finished_at = utcnow()
