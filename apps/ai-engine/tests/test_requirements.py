"""Requirement extraction: rule backend quality + the never-invent guarantees."""

from tender_contracts.v1 import DocumentKind, RequirementCategory

from engine.db.models import DocumentBlock
from engine.extraction.requirements import _extract_rules, categorize
from engine.parsing.service import parse_document
from tests.fixtures import make_docx

REQUIREMENT_TEXT = [
    "7.3.2 The Bidder shall have completed 3 similar projects in the last 5 years.",
    "The Contractor must hold a valid ISO 9001 certification at the time of submission.",
    "Bidders should provide a cost breakdown for all unit rates.",
    "Mobilization shall be completed within 21 calendar days of contract award.",
    "Liquidated damages shall apply at 0.5% per week of delay.",
    "This paragraph is purely descriptive background about the region.",
]


def _blocks(texts, block_type="paragraph", table_data=None):
    return [
        DocumentBlock(
            id=f"b{i}",
            tenant_id="t",
            document_id="d",
            page=1,
            order=i,
            block_type=block_type,
            section_path="Section 7",
            text=text,
            table_data=table_data,
        )
        for i, text in enumerate(texts)
    ]


def test_extracts_only_modal_statements():
    reqs = _extract_rules(_blocks(REQUIREMENT_TEXT))
    texts = [r.text for r in reqs]
    assert len(reqs) == 5  # the descriptive paragraph is not a requirement
    assert not any("purely descriptive" in t for t in texts)


def test_every_requirement_has_verified_evidence():
    reqs = _extract_rules(_blocks(REQUIREMENT_TEXT))
    for req in reqs:
        assert req.evidence, f"no evidence for {req.text!r}"
        ev = req.evidence[0]
        assert ev.verified is True
        assert ev.quote in req.text or req.text in ev.quote
        assert ev.page == 1 and ev.block_id
        assert req.needs_review is False


def test_mandatory_flag_follows_modal_strength():
    reqs = {r.text: r for r in _extract_rules(_blocks(REQUIREMENT_TEXT))}
    assert reqs["7.3.2 The Bidder shall have completed 3 similar projects in the last 5 years."].mandatory is True
    assert reqs["Bidders should provide a cost breakdown for all unit rates."].mandatory is False


def test_clause_number_captured_in_evidence():
    reqs = _extract_rules(_blocks([REQUIREMENT_TEXT[0]]))
    assert reqs[0].evidence[0].clause == "7.3.2"


def test_categorisation():
    assert categorize("The Bidder shall have completed 3 similar projects") is RequirementCategory.QUALIFICATION
    assert categorize("must hold a valid ISO 9001 certification") is RequirementCategory.CERTIFICATION
    assert categorize("Mobilization shall be completed within 21 calendar days") is RequirementCategory.SCHEDULE
    assert categorize("Liquidated damages shall apply at 0.5% per week") is RequirementCategory.CONTRACTUAL
    assert categorize("shall provide a cost breakdown for all unit rates") is RequirementCategory.COMMERCIAL
    assert categorize("Bids shall be submitted in a sealed envelope") is RequirementCategory.SUBMISSION


def test_table_rows_become_separate_requirements():
    rows = [
        ["Ref", "Requirement"],
        ["1", "The bidder shall provide a valid trade licence copy with the bid."],
        ["2", "The bidder must supply pumps with a capacity of 500 m3/h per specification."],
    ]
    blocks = _blocks(["\n".join(" | ".join(r) for r in rows)], block_type="table", table_data=rows)
    reqs = _extract_rules(blocks)
    assert len(reqs) == 2
    assert all(r.evidence[0].verified for r in reqs)


def test_duplicate_sentences_deduplicated():
    reqs = _extract_rules(_blocks([REQUIREMENT_TEXT[1], REQUIREMENT_TEXT[1]]))
    assert len(reqs) == 1


def test_runs_over_real_parsed_document():
    parsed = parse_document(DocumentKind.DOCX, make_docx())
    blocks = _blocks([b.text for b in parsed.blocks])
    reqs = _extract_rules(blocks)
    # The fixture has no obligations; the extractor must return nothing, not guesses.
    assert reqs == []


def test_table_ref_column_becomes_clause_not_requirement_text():
    rows = [
        ["Ref", "Requirement"],
        ["1", "The bidder shall provide a valid trade licence copy with the bid."],
        ["7.3.2", "The contractor must mobilize within 21 calendar days of award."],
    ]
    blocks = _blocks(["\n".join(" | ".join(r) for r in rows)], block_type="table", table_data=rows)
    reqs = {r.evidence[0].clause: r for r in _extract_rules(blocks)}
    assert set(reqs) == {"1", "7.3.2"}
    for req in reqs.values():
        assert not req.text.startswith(("1 |", "7.3.2 |")), "ref column leaked into requirement text"
        assert req.evidence[0].verified is True


def test_provide_a_copy_is_documentation():
    assert (
        categorize("The bidder shall provide a valid trade licence copy with the bid.")
        is RequirementCategory.DOCUMENTATION
    )
