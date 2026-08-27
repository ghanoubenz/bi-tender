from __future__ import annotations

from datetime import datetime
from enum import Enum
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class ContractModel(BaseModel):
    """Base for all contract models: strict-ish, forward-compatible on read."""

    model_config = ConfigDict(extra="ignore", str_strip_whitespace=True)


class ExtractionMethod(str, Enum):
    LLM = "llm"
    RULE = "rule"
    OCR_LLM = "ocr_llm"
    HUMAN = "human"


class EvidenceReference(ContractModel):
    """Pointer from a fact to the exact place in a source document it came from."""

    document_id: str
    filename: str | None = None
    page: int | None = Field(default=None, ge=1)
    section_path: str | None = Field(
        default=None, description="Heading trail, e.g. 'Section 7 > 7.3 Qualification'"
    )
    clause: str | None = Field(default=None, description="Clause number, e.g. '7.3.2'")
    block_id: str | None = Field(default=None, description="Id of the parsed DocumentBlock")
    quote: str = Field(description="Verbatim quote from the source supporting the fact")
    method: ExtractionMethod = ExtractionMethod.LLM
    confidence: float = Field(ge=0.0, le=1.0)
    verified: bool = Field(
        default=False, description="True if the quote was substring-validated against the source block"
    )


class JobType(str, Enum):
    INGEST = "ingest"
    EXTRACT_METADATA = "extract_metadata"
    EXTRACT_REQUIREMENTS = "extract_requirements"
    COMPLIANCE = "compliance"
    SCORE = "score"


class JobState(str, Enum):
    QUEUED = "queued"
    RUNNING = "running"
    SUCCEEDED = "succeeded"
    FAILED = "failed"


class JobStatus(ContractModel):
    id: str
    type: JobType
    state: JobState
    tenant_id: str
    progress: float = Field(default=0.0, ge=0.0, le=1.0)
    created_at: datetime | None = None
    finished_at: datetime | None = None
    error: str | None = None
    result: dict[str, Any] | None = Field(
        default=None, description="Contract payload for the job type, present when succeeded"
    )


class ErrorResponse(ContractModel):
    code: str
    message: str
    details: dict[str, Any] | None = None
