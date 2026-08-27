import pytest
from pydantic import ValidationError

from tender_contracts.v1 import (
    ComplianceItem,
    ComplianceStatus,
    EvidenceReference,
    ExtractedRequirement,
    JobState,
    JobStatus,
    JobType,
    MetadataField,
    RequirementCategory,
    TenderMetadata,
)


def make_evidence(**over):
    base = dict(
        document_id="doc-1",
        filename="ITT.pdf",
        page=42,
        clause="7.3.2",
        quote="Bidder must have completed 3 similar projects",
        confidence=0.94,
    )
    base.update(over)
    return EvidenceReference(**base)


def test_requirement_requires_evidence():
    with pytest.raises(ValidationError):
        ExtractedRequirement(
            id="r1", text="x", category=RequirementCategory.QUALIFICATION, evidence=[], confidence=0.9
        )


def test_requirement_round_trip():
    req = ExtractedRequirement(
        id="r1",
        text="Bidder must have completed 3 similar projects",
        category=RequirementCategory.QUALIFICATION,
        mandatory=True,
        evidence=[make_evidence()],
        confidence=0.94,
    )
    again = ExtractedRequirement.model_validate_json(req.model_dump_json())
    assert again == req
    assert again.evidence[0].page == 42


def test_metadata_defaults_to_unknown_not_guessed():
    meta = TenderMetadata()
    assert meta.client.value is None
    assert meta.client.evidence == []


def test_metadata_field_with_evidence():
    field = MetadataField(value="Ministry of Water", evidence=[make_evidence()], confidence=0.9)
    assert field.evidence[0].verified is False


def test_layer2_must_reference_layer1_facts():
    with pytest.raises(ValidationError):
        ComplianceItem(
            requirement_id="r1",
            status=ComplianceStatus.GAP,
            rationale="no cert on file",
            based_on_fact_ids=[],
        )


def test_job_status_forward_compat_ignores_unknown_fields():
    js = JobStatus.model_validate(
        {
            "id": "j1",
            "type": "ingest",
            "state": "queued",
            "tenant_id": "t1",
            "some_future_field": 123,
        }
    )
    assert js.type is JobType.INGEST and js.state is JobState.QUEUED


def test_confidence_bounds():
    with pytest.raises(ValidationError):
        make_evidence(confidence=1.5)
