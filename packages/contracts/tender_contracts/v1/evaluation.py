from __future__ import annotations

from enum import Enum

from pydantic import Field

from tender_contracts.v1.common import ContractModel, EvidenceReference


class ComplianceStatus(str, Enum):
    COMPLIANT = "compliant"
    PARTIAL = "partial"
    GAP = "gap"
    UNKNOWN = "unknown"


class ComplianceItem(ContractModel):
    """Layer-2 judgement for one requirement. Must reference Layer-1 facts."""

    requirement_id: str
    status: ComplianceStatus
    matched_capability_ids: list[str] = Field(default_factory=list)
    rationale: str
    based_on_fact_ids: list[str] = Field(
        min_length=1, description="Layer-1 fact ids this judgement is derived from"
    )
    evidence: list[EvidenceReference] = Field(default_factory=list)


class ComplianceResult(ContractModel):
    tender_ref: str | None = None
    items: list[ComplianceItem]


class RiskSeverity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class RiskItem(ContractModel):
    id: str
    title: str
    severity: RiskSeverity
    category: str
    rationale: str
    based_on_fact_ids: list[str] = Field(min_length=1)


class RiskResult(ContractModel):
    tender_ref: str | None = None
    risks: list[RiskItem]


class ScoreResult(ContractModel):
    tender_ref: str | None = None
    fit_score: float = Field(ge=0.0, le=100.0)
    bid_readiness: float = Field(ge=0.0, le=100.0)
    components: dict[str, float] = Field(default_factory=dict)
    summary: str
    based_on_fact_ids: list[str] = Field(min_length=1)


class QuestionAnswerResult(ContractModel):
    question: str
    answer: str
    citations: list[EvidenceReference] = Field(default_factory=list)
    confidence: float = Field(ge=0.0, le=1.0)
    grounded: bool = Field(
        description="False when the engine could not ground the answer; the UI must flag it"
    )
