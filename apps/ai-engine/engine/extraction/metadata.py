"""Layer-1 tender metadata extraction.

Two backends behind one interface:
- mock/dev: deterministic rule-based extraction (real evidence, method=rule)
- live:     structured LLM extraction via the AI Gateway (method=llm)

Both obey PRODUCT_CONTRACT: unknown => None + needs_review, every value carries
evidence pointing at a real DocumentBlock, and quotes are validated on write.
"""

from __future__ import annotations

import json
import logging
import re

from tender_contracts.v1 import EvidenceReference, ExtractionMethod, MetadataField, TenderMetadata

from engine.config import get_settings
from engine.db.models import DocumentBlock
from engine.evidence.validate import validate_evidence
from engine.gateway.client import GatewayError, structured_completion
from engine.gateway.router import Task

log = logging.getLogger(__name__)

FIELDS = list(TenderMetadata.model_fields.keys())

# Deliberately conservative patterns: better null+review than a guess.
_RULES: dict[str, re.Pattern] = {
    "submission_deadline": re.compile(
        r"(?:submission\s+deadline|closing\s+date|deadline\s+for\s+submission|bids?\s+(?:must\s+be|shall\s+be)\s+submitted\s+(?:no\s+later\s+than|by|before))"
        r"[:\s]*([A-Za-z0-9,:\-/ ]{4,60}?\d{4}|\d{1,2}[:/.\-]\d{1,2}[:/.\-]\d{2,4})",
        re.I,
    ),
    "tender_reference": re.compile(
        r"(?:tender|itt|rfp|rfq|bid)\s*(?:no\.?|number|ref\.?|reference)[:\s#]*([A-Z0-9][A-Z0-9\-/_.]{2,40})",
        re.I,
    ),
    "client": re.compile(
        r"(?i:issued\s+by|employer|client|purchaser|contracting\s+authority|procuring\s+entity)[:\s]+"
        r"([A-Z][A-Za-z0-9&,.'()\- ]{3,80}?)(?=\s+(?:[A-Z][a-z]+:|Project:|Tender)|[.;\n]|$)",
    ),
    "bid_validity": re.compile(
        r"(?:bid|tender|offer)s?\s+(?:shall\s+)?(?:remain\s+)?valid(?:ity)?"
        r"(?:\s+(?:for|of|:))?(?:\s+a)?(?:\s+period)?(?:\s+of)?\s*((?:\d{1,3})\s*(?:calendar\s+)?days)",
        re.I,
    ),
    "bid_bond": re.compile(
        r"(?i:(?:bid|tender)\s+(?:bond|security|guarantee)\s+(?:of|in\s+the\s+amount\s+of|:)?)\s*"
        r"([A-Z]{0,3}\s?[\d][\d,.]*(?:\s?%| percent)?(?:\s+[A-Z]{3})?)",
    ),
}


def extract_metadata(tenant_id: str, blocks: list[DocumentBlock], job_id: str | None = None) -> TenderMetadata:
    if get_settings().gateway_mode == "live":
        try:
            return _extract_llm(tenant_id, blocks, job_id)
        except GatewayError as exc:
            log.warning("live extraction failed, falling back to rules: %s", exc)
    return _extract_rules(blocks)


# --- rule-based backend -----------------------------------------------------

def _extract_rules(blocks: list[DocumentBlock]) -> TenderMetadata:
    by_id = {b.id: b for b in blocks}
    fields: dict[str, MetadataField] = {}
    for name, pattern in _RULES.items():
        found = None
        for block in blocks:
            m = pattern.search(block.text)
            if m:
                quote = block.text[max(0, m.start() - 20) : m.end() + 20].strip()
                ev = validate_evidence(
                    EvidenceReference(
                        document_id=block.document_id,
                        page=block.page,
                        section_path=block.section_path,
                        block_id=block.id,
                        quote=quote,
                        method=ExtractionMethod.RULE,
                        confidence=0.7,
                    ),
                    by_id,
                )
                found = MetadataField(
                    value=m.group(1).strip().rstrip(".,;"),
                    evidence=[ev],
                    confidence=0.7 if ev.verified else 0.4,
                    needs_review=not ev.verified,
                )
                break
        fields[name] = found or MetadataField(needs_review=True)
    # Fields with no rule stay unknown + flagged (never guessed).
    for name in FIELDS:
        fields.setdefault(name, MetadataField(needs_review=True))
    return TenderMetadata(**fields)


# --- LLM backend ------------------------------------------------------------

_LLM_SYSTEM = """You extract tender metadata from tender document excerpts.
Rules you must never break:
- Only report values literally supported by the provided blocks.
- For each value, cite the block_id and copy the exact supporting quote verbatim.
- If a field is not clearly stated, return null for it. Never guess.
Return JSON matching the schema."""


def _llm_schema() -> dict:
    field_schema = {
        "type": ["object", "null"],
        "properties": {
            "value": {"type": "string"},
            "block_id": {"type": "string"},
            "quote": {"type": "string"},
            "confidence": {"type": "number"},
        },
        "required": ["value", "block_id", "quote", "confidence"],
        "additionalProperties": False,
    }
    return {
        "type": "object",
        "properties": {name: field_schema for name in FIELDS},
        "required": FIELDS,
        "additionalProperties": False,
    }


def _extract_llm(tenant_id: str, blocks: list[DocumentBlock], job_id: str | None) -> TenderMetadata:
    by_id = {b.id: b for b in blocks}
    # V1: front-load — metadata overwhelmingly lives early; cap prompt size.
    corpus, budget = [], 60_000
    for b in blocks:
        entry = json.dumps({"block_id": b.id, "page": b.page, "text": b.text[:2000]})
        budget -= len(entry)
        if budget < 0:
            break
        corpus.append(entry)
    raw = structured_completion(
        task=Task.EXTRACTION,
        system=_LLM_SYSTEM,
        user="Blocks:\n" + "\n".join(corpus),
        json_schema=_llm_schema(),
        tenant_id=tenant_id,
        job_id=job_id,
    )
    fields: dict[str, MetadataField] = {}
    for name in FIELDS:
        item = raw.get(name)
        if not item or not item.get("value"):
            fields[name] = MetadataField(needs_review=True)
            continue
        ev = validate_evidence(
            EvidenceReference(
                document_id=by_id.get(item.get("block_id", ""), blocks[0]).document_id if blocks else "",
                block_id=item.get("block_id"),
                quote=item.get("quote", ""),
                method=ExtractionMethod.LLM,
                confidence=min(max(float(item.get("confidence", 0.5)), 0.0), 1.0),
            ),
            by_id,
        )
        fields[name] = MetadataField(
            value=item["value"],
            evidence=[ev],
            confidence=ev.confidence if ev.verified else min(ev.confidence, 0.4),
            needs_review=not ev.verified,
        )
    return TenderMetadata(**fields)
