from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException

from tender_contracts.v1 import DocumentBlockOut

from engine.api.deps import auth_tenant
from engine.db.base import session_scope
from engine.db.models import DocumentBlock, EngineDocument

router = APIRouter(prefix="/api/v1/documents", tags=["documents"])


@router.get("/{document_id}/blocks", response_model=list[DocumentBlockOut])
def get_blocks(document_id: str, tenant_id: str = Depends(auth_tenant)) -> list[DocumentBlockOut]:
    """Parsed structure of a document — powers the evidence viewer."""
    with session_scope() as db:
        doc = db.get(EngineDocument, document_id)
        if doc is None or doc.tenant_id != tenant_id:
            raise HTTPException(404, detail={"code": "not_found", "message": "document not found"})
        blocks = (
            db.query(DocumentBlock).filter_by(document_id=document_id).order_by(DocumentBlock.order).all()
        )
        return [
            DocumentBlockOut(
                id=b.id,
                document_id=b.document_id,
                page=b.page,
                order=b.order,
                block_type=b.block_type,
                section_path=b.section_path,
                text=b.text,
                table_data=b.table_data,
            )
            for b in blocks
        ]
