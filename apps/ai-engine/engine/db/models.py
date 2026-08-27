from __future__ import annotations

import uuid
from datetime import datetime, timezone

from sqlalchemy import JSON, Boolean, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from engine.db.base import Base


def new_id() -> str:
    return uuid.uuid4().hex


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class EngineDocument(Base):
    __tablename__ = "engine_documents"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=new_id)
    tenant_id: Mapped[str] = mapped_column(String(64), index=True)
    external_ref: Mapped[str | None] = mapped_column(String(128), index=True)
    tender_ref: Mapped[str | None] = mapped_column(String(128), index=True)
    filename: Mapped[str] = mapped_column(String(512))
    content_type: Mapped[str | None] = mapped_column(String(128))
    kind: Mapped[str] = mapped_column(String(32), default="unknown")
    storage_key: Mapped[str | None] = mapped_column(String(1024))
    status: Mapped[str] = mapped_column(String(32), default="received", index=True)
    page_count: Mapped[int | None] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(default=utcnow)

    blocks: Mapped[list["DocumentBlock"]] = relationship(
        back_populates="document", cascade="all, delete-orphan", order_by="DocumentBlock.order"
    )


class DocumentBlock(Base):
    __tablename__ = "document_blocks"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=new_id)
    tenant_id: Mapped[str] = mapped_column(String(64), index=True)
    document_id: Mapped[str] = mapped_column(ForeignKey("engine_documents.id"), index=True)
    page: Mapped[int | None] = mapped_column(Integer)
    order: Mapped[int] = mapped_column(Integer)
    block_type: Mapped[str] = mapped_column(String(32))
    section_path: Mapped[str | None] = mapped_column(String(1024))
    text: Mapped[str] = mapped_column(Text)
    table_data: Mapped[list | None] = mapped_column(JSON)

    document: Mapped[EngineDocument] = relationship(back_populates="blocks")


class ExtractedFact(Base):
    __tablename__ = "extracted_facts"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=new_id)
    tenant_id: Mapped[str] = mapped_column(String(64), index=True)
    document_id: Mapped[str] = mapped_column(ForeignKey("engine_documents.id"), index=True)
    kind: Mapped[str] = mapped_column(String(32), index=True)  # metadata | requirement
    payload: Mapped[dict] = mapped_column(JSON)
    evidence: Mapped[list] = mapped_column(JSON, default=list)
    confidence: Mapped[float | None] = mapped_column(Float)
    needs_review: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(default=utcnow)


class Job(Base):
    __tablename__ = "jobs"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=new_id)
    tenant_id: Mapped[str] = mapped_column(String(64), index=True)
    type: Mapped[str] = mapped_column(String(32))
    state: Mapped[str] = mapped_column(String(16), default="queued", index=True)
    progress: Mapped[float] = mapped_column(Float, default=0.0)
    idempotency_key: Mapped[str | None] = mapped_column(String(128), index=True)
    input: Mapped[dict | None] = mapped_column(JSON)
    result: Mapped[dict | None] = mapped_column(JSON)
    error: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(default=utcnow)
    finished_at: Mapped[datetime | None] = mapped_column(default=None)


class UsageRecord(Base):
    __tablename__ = "usage_records"

    id: Mapped[str] = mapped_column(String(32), primary_key=True, default=new_id)
    tenant_id: Mapped[str] = mapped_column(String(64), index=True)
    job_id: Mapped[str | None] = mapped_column(String(32), index=True)
    task: Mapped[str] = mapped_column(String(64))
    model: Mapped[str] = mapped_column(String(128))
    input_tokens: Mapped[int] = mapped_column(Integer, default=0)
    output_tokens: Mapped[int] = mapped_column(Integer, default=0)
    cost_usd: Mapped[float] = mapped_column(Float, default=0.0)
    created_at: Mapped[datetime] = mapped_column(default=utcnow)
