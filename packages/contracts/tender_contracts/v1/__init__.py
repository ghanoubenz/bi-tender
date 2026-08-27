"""Contracts v1.

Rules (see PRODUCT_CONTRACT.md):
- Layer-1 facts (metadata fields, requirements) always carry EvidenceReference lists.
- Unknown values are None + flagged, never guessed.
- Layer-2 results (compliance, risk, score) reference the Layer-1 fact ids they used.
"""

from tender_contracts.v1.common import (
    ErrorResponse,
    EvidenceReference,
    ExtractionMethod,
    JobState,
    JobStatus,
    JobType,
)
from tender_contracts.v1.documents import DocumentBlockOut, DocumentKind, TenderDocumentInput
from tender_contracts.v1.evaluation import (
    ComplianceItem,
    ComplianceResult,
    ComplianceStatus,
    QuestionAnswerResult,
    RiskItem,
    RiskResult,
    RiskSeverity,
    ScoreResult,
)
from tender_contracts.v1.tender import (
    ExtractedRequirement,
    MetadataField,
    RequirementCategory,
    TenderMetadata,
)

__all__ = [
    "ComplianceItem",
    "ComplianceResult",
    "ComplianceStatus",
    "DocumentBlockOut",
    "DocumentKind",
    "ErrorResponse",
    "EvidenceReference",
    "ExtractedRequirement",
    "ExtractionMethod",
    "JobState",
    "JobStatus",
    "JobType",
    "MetadataField",
    "QuestionAnswerResult",
    "RequirementCategory",
    "RiskItem",
    "RiskResult",
    "RiskSeverity",
    "ScoreResult",
    "TenderDocumentInput",
    "TenderMetadata",
]
