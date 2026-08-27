from __future__ import annotations

from enum import Enum

from pydantic import Field

from tender_contracts.v1.common import ContractModel, EvidenceReference


class MetadataField(ContractModel):
    """A single Layer-1 metadata fact. Unknown => value None and needs_review True."""

    value: str | None = None
    evidence: list[EvidenceReference] = Field(default_factory=list)
    confidence: float | None = Field(default=None, ge=0.0, le=1.0)
    needs_review: bool = False


class TenderMetadata(ContractModel):
    """Layer-1 tender metadata. Every field is optional and evidence-backed."""

    client: MetadataField = Field(default_factory=MetadataField)
    project_title: MetadataField = Field(default_factory=MetadataField)
    tender_reference: MetadataField = Field(default_factory=MetadataField)
    country: MetadataField = Field(default_factory=MetadataField)
    submission_deadline: MetadataField = Field(default_factory=MetadataField)
    scope_summary: MetadataField = Field(default_factory=MetadataField)
    bid_validity: MetadataField = Field(default_factory=MetadataField)
    bid_bond: MetadataField = Field(default_factory=MetadataField)
    submission_method: MetadataField = Field(default_factory=MetadataField)
    contact: MetadataField = Field(default_factory=MetadataField)


class RequirementCategory(str, Enum):
    TECHNICAL = "technical"
    COMMERCIAL = "commercial"
    CONTRACTUAL = "contractual"
    QUALIFICATION = "qualification"
    CERTIFICATION = "certification"
    DOCUMENTATION = "documentation"
    SUBMISSION = "submission"
    SCHEDULE = "schedule"
    OTHER = "other"


class ExtractedRequirement(ContractModel):
    """A Layer-1 requirement fact with mandatory evidence."""

    id: str
    text: str = Field(description="Normalized requirement statement")
    category: RequirementCategory = RequirementCategory.OTHER
    mandatory: bool | None = Field(
        default=None, description="True=shall/must, False=should/preferred, None=unclear"
    )
    evidence: list[EvidenceReference] = Field(min_length=1)
    confidence: float = Field(ge=0.0, le=1.0)
    needs_review: bool = False
