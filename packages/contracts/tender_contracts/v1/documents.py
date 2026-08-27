from __future__ import annotations

from enum import Enum

from pydantic import Field

from tender_contracts.v1.common import ContractModel


class DocumentKind(str, Enum):
    PDF = "pdf"
    SCANNED_PDF = "scanned_pdf"
    DOCX = "docx"
    XLSX = "xlsx"
    EMAIL = "email"
    ZIP = "zip"
    UNKNOWN = "unknown"


class TenderDocumentInput(ContractModel):
    """How a caller hands a document to the engine.

    Exactly one of `storage_key` (shared object storage) or multipart upload
    (engine's /ingest endpoint) is used. `external_ref` is the caller's own id
    (e.g. platform TenderDocument id, or a Salesforce record id).
    """

    filename: str
    content_type: str | None = None
    storage_key: str | None = None
    external_ref: str | None = None
    tender_ref: str | None = Field(
        default=None, description="Caller's tender identifier, groups documents of one tender"
    )
    language_hint: str | None = None


class DocumentBlockOut(ContractModel):
    """A structural unit of a parsed document. Tenders are never one big string."""

    id: str
    document_id: str
    page: int | None = None
    order: int
    block_type: str = Field(description="paragraph | heading | table | row | cell | list_item")
    section_path: str | None = None
    text: str
    table_data: list[list[str]] | None = Field(
        default=None, description="For table blocks: rows of cell texts"
    )
