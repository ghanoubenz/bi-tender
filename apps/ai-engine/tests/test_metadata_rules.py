"""Rule-based extraction quality on the fixture ITT. These pin the mock/dev
backend's behavior; live-LLM quality gets its own eval fixtures later."""

from tender_contracts.v1 import DocumentKind

from engine.db.models import DocumentBlock
from engine.extraction.metadata import _extract_rules
from engine.parsing.service import parse_document
from tests.fixtures import make_pdf


def _blocks():
    parsed = parse_document(DocumentKind.PDF, make_pdf())
    return [
        DocumentBlock(
            id=f"b{i}",
            tenant_id="t",
            document_id="d",
            page=b.page,
            order=i,
            block_type=b.block_type,
            section_path=b.section_path,
            text=b.text,
        )
        for i, b in enumerate(parsed.blocks)
    ]


def test_rules_extract_expected_fields_with_verified_evidence():
    meta = _extract_rules(_blocks())
    assert meta.tender_reference.value == "ITT-2026-0042"
    assert meta.client.value == "Ministry of Water Resources"
    assert meta.submission_deadline.value.startswith("15 October 2026")
    assert meta.bid_validity.value == "120 days"
    assert meta.bid_bond.value == "OMR 50,000"
    for field in (meta.tender_reference, meta.client, meta.submission_deadline, meta.bid_bond):
        assert field.evidence and field.evidence[0].verified
        assert field.needs_review is False


def test_rules_never_guess_unknown_fields():
    meta = _extract_rules(_blocks())
    assert meta.country.value is None and meta.country.needs_review is True
    assert meta.scope_summary.value is None and meta.scope_summary.needs_review is True
