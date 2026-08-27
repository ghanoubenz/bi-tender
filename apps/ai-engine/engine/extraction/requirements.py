"""Layer-1 requirement extraction.

Same two-backend shape as metadata extraction:
- mock/dev: deterministic modal-verb detection over parsed blocks (method=rule)
- live:     structured LLM extraction via the AI Gateway (method=llm)

PRODUCT_CONTRACT: every requirement carries at least one evidence reference
pointing at a real DocumentBlock, quotes are validated against source text, and
anything unverifiable is flagged needs_review rather than dropped or invented.
"""

from __future__ import annotations

import json
import logging
import re

from tender_contracts.v1 import (
    EvidenceReference,
    ExtractedRequirement,
    ExtractionMethod,
    RequirementCategory,
)

from engine.config import get_settings
from engine.db.models import DocumentBlock, new_id
from engine.evidence.validate import validate_evidence
from engine.gateway.client import GatewayError, structured_completion
from engine.gateway.router import Task

log = logging.getLogger(__name__)

# Sentence splitting that tolerates clause numbers ("7.3.2 The bidder shall...").
_SENTENCE_SPLIT = re.compile(r"(?<=[.;:])\s+(?=[A-Z0-9])")

# Modal strength → (mandatory, base confidence).
_MANDATORY = re.compile(
    r"\b(shall|must|is\s+required\s+to|are\s+required\s+to|will\s+be\s+required\s+to|"
    r"has\s+to|have\s+to|is\s+mandatory|are\s+mandatory|no\s+later\s+than)\b",
    re.I,
)
_OPTIONAL = re.compile(r"\b(should|may|is\s+preferred|are\s+preferred|desirable|optional)\b", re.I)

# Clause number at the start of a sentence, e.g. "7.3.2 ..." or "(c) ...".
_CLAUSE = re.compile(r"^\(?(\d+(?:\.\d+)+|[a-z]\)|\d+\))\s+")

# Category keyword rules, evaluated in order — first match wins.
_CATEGORY_RULES: list[tuple[RequirementCategory, re.Pattern]] = [
    (
        RequirementCategory.CERTIFICATION,
        re.compile(r"\b(iso\s?\d+|certificat\w+|accredit\w+|approval\s+certificate|api\s+\d+q)\b", re.I),
    ),
    (
        RequirementCategory.QUALIFICATION,
        re.compile(
            r"\b(similar\s+projects?|track\s+record|years?\s+of\s+experience|annual\s+turnover|"
            r"financial\s+standing|pre-?qualif\w+|references?\s+from|previous\s+contracts?)\b",
            re.I,
        ),
    ),
    (
        RequirementCategory.SUBMISSION,
        re.compile(
            r"\b(sealed\s+envelope|submission\s+deadline|submitted\s+(?:electronically|via|through)|"
            r"bid\s+submission|tender\s+box|e-?procurement\s+portal|closing\s+(?:date|time))\b",
            re.I,
        ),
    ),
    (
        RequirementCategory.DOCUMENTATION,
        re.compile(
            r"\b(shall\s+submit|must\s+submit|"
            r"(?:provide|furnish|supply)\s+(?:\w+\s+){0,4}?"
            r"(?:copy|copies|documentation|licen[cs]e|permit|registration|statements?)|"
            r"attach\w*|enclose\w*|duly\s+(?:signed|completed)|supporting\s+documents?)\b",
            re.I,
        ),
    ),
    (
        RequirementCategory.SCHEDULE,
        re.compile(
            r"\b(within\s+\d+\s+(?:calendar\s+)?(?:days|weeks|months)|mobiliz\w+|delivery\s+period|"
            r"completion\s+(?:date|period)|programme\s+of\s+works?|lead\s+time)\b",
            re.I,
        ),
    ),
    (
        RequirementCategory.CONTRACTUAL,
        re.compile(
            r"\b(liquidated\s+damages|penalt\w+|indemnif\w+|liabilit\w+|warrant\w+|guarantee\s+period|"
            r"terminat\w+|governing\s+law|jurisdiction|force\s+majeure|retention)\b",
            re.I,
        ),
    ),
    (
        RequirementCategory.COMMERCIAL,
        re.compile(
            r"\b(price[sd]?\b|pricing|payment\s+terms?|invoic\w+|currency|unit\s+rates?|"
            r"bill\s+of\s+quantit\w+|discount|cost\s+breakdown)\b",
            re.I,
        ),
    ),
    (
        RequirementCategory.TECHNICAL,
        re.compile(
            r"\b(specification|technical|capacity|design|material|equipment|standard\s+[A-Z]{2,}|"
            r"performance|test(?:ing|s)?\b|comply\s+with\s+[A-Z])\b",
            re.I,
        ),
    ),
]

MIN_LENGTH = 25
MAX_LENGTH = 1200


def extract_requirements(
    tenant_id: str, blocks: list[DocumentBlock], job_id: str | None = None
) -> list[ExtractedRequirement]:
    if get_settings().gateway_mode == "live":
        try:
            return _extract_llm(tenant_id, blocks, job_id)
        except GatewayError as exc:
            log.warning("live requirement extraction failed, falling back to rules: %s", exc)
    return _extract_rules(blocks)


def categorize(text: str) -> RequirementCategory:
    for category, pattern in _CATEGORY_RULES:
        if pattern.search(text):
            return category
    return RequirementCategory.OTHER


def _mandatory_of(text: str) -> tuple[bool | None, float]:
    if _MANDATORY.search(text):
        return True, 0.75
    if _OPTIONAL.search(text):
        return False, 0.6
    return None, 0.45


# A short leading table cell is a reference/item number, not requirement text.
_REF_CELL = re.compile(r"^\(?\d+(?:\.\d+)*[.)]?$|^[a-z][.)]$", re.I)


def _candidate_sentences(block: DocumentBlock) -> list[tuple[str, str | None]]:
    """Split a block into (candidate text, clause hint) pairs.

    Table blocks are split per row so a requirements matrix or BoQ yields one
    candidate per row instead of one giant blob. Requirement tables almost
    always lead with a ref column ("1", "7.3.2", "a)") — that belongs in the
    clause field, not in the requirement text.
    """
    if block.block_type == "table" and block.table_data:
        rows = []
        for row in block.table_data:
            cells = [str(c).strip() for c in row if str(c).strip()]
            if not cells:
                continue
            clause = None
            if len(cells) > 1 and _REF_CELL.match(cells[0]):
                clause = cells[0].strip("().")
                cells = cells[1:]
            rows.append((" | ".join(cells), clause))
        return rows
    return [(sentence, None) for sentence in _SENTENCE_SPLIT.split(block.text)]


# --- rule-based backend -----------------------------------------------------


def _extract_rules(blocks: list[DocumentBlock]) -> list[ExtractedRequirement]:
    by_id = {b.id: b for b in blocks}
    out: list[ExtractedRequirement] = []
    seen: set[str] = set()
    for block in blocks:
        for raw, clause_hint in _candidate_sentences(block):
            sentence = " ".join(raw.split())
            if not (MIN_LENGTH <= len(sentence) <= MAX_LENGTH):
                continue
            mandatory, confidence = _mandatory_of(sentence)
            if mandatory is None:
                continue  # no modal verb => not a requirement statement
            key = sentence.lower()
            if key in seen:
                continue
            seen.add(key)
            clause_match = _CLAUSE.match(sentence)
            clause = clause_hint or (clause_match.group(1).rstrip(")") if clause_match else None)
            ev = validate_evidence(
                EvidenceReference(
                    document_id=block.document_id,
                    page=block.page,
                    section_path=block.section_path,
                    clause=clause,
                    block_id=block.id,
                    quote=sentence,
                    method=ExtractionMethod.RULE,
                    confidence=confidence,
                ),
                by_id,
            )
            out.append(
                ExtractedRequirement(
                    id=new_id(),
                    text=sentence,
                    category=categorize(sentence),
                    mandatory=mandatory,
                    evidence=[ev],
                    confidence=confidence if ev.verified else min(confidence, 0.4),
                    needs_review=not ev.verified,
                )
            )
    return out


# --- LLM backend ------------------------------------------------------------

_LLM_SYSTEM = """You extract individual requirements from tender document blocks.
A requirement is an obligation, condition, or qualification placed on the bidder.
Rules you must never break:
- Only report requirements literally present in the provided blocks.
- For each requirement cite the block_id and copy the exact supporting quote verbatim.
- Never merge two unrelated obligations into one requirement.
- If a block contains no requirement, produce nothing for it. Never invent.
Return JSON matching the schema."""

_LLM_SCHEMA = {
    "type": "object",
    "properties": {
        "requirements": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "text": {"type": "string"},
                    "category": {"type": "string", "enum": [c.value for c in RequirementCategory]},
                    "mandatory": {"type": ["boolean", "null"]},
                    "block_id": {"type": "string"},
                    "quote": {"type": "string"},
                    "clause": {"type": ["string", "null"]},
                    "confidence": {"type": "number"},
                },
                "required": ["text", "category", "mandatory", "block_id", "quote", "clause", "confidence"],
                "additionalProperties": False,
            },
        }
    },
    "required": ["requirements"],
    "additionalProperties": False,
}

BATCH_CHARS = 40_000


def _batches(blocks: list[DocumentBlock]) -> list[list[DocumentBlock]]:
    batch: list[DocumentBlock] = []
    size = 0
    out: list[list[DocumentBlock]] = []
    for block in blocks:
        length = len(block.text)
        if batch and size + length > BATCH_CHARS:
            out.append(batch)
            batch, size = [], 0
        batch.append(block)
        size += length
    if batch:
        out.append(batch)
    return out


def _extract_llm(
    tenant_id: str, blocks: list[DocumentBlock], job_id: str | None
) -> list[ExtractedRequirement]:
    by_id = {b.id: b for b in blocks}
    out: list[ExtractedRequirement] = []
    for batch in _batches(blocks):
        payload = "\n".join(
            json.dumps({"block_id": b.id, "page": b.page, "section": b.section_path, "text": b.text[:4000]})
            for b in batch
        )
        raw = structured_completion(
            task=Task.EXTRACTION,
            system=_LLM_SYSTEM,
            user="Blocks:\n" + payload,
            json_schema=_LLM_SCHEMA,
            tenant_id=tenant_id,
            job_id=job_id,
        )
        for item in raw.get("requirements", []):
            block = by_id.get(item.get("block_id", ""))
            if block is None:
                continue  # cited a block that does not exist => discard, never invent
            confidence = min(max(float(item.get("confidence", 0.5)), 0.0), 1.0)
            ev = validate_evidence(
                EvidenceReference(
                    document_id=block.document_id,
                    page=block.page,
                    section_path=block.section_path,
                    clause=item.get("clause"),
                    block_id=block.id,
                    quote=item.get("quote", ""),
                    method=ExtractionMethod.LLM,
                    confidence=confidence,
                ),
                by_id,
            )
            out.append(
                ExtractedRequirement(
                    id=new_id(),
                    text=item["text"],
                    category=RequirementCategory(item.get("category", "other")),
                    mandatory=item.get("mandatory"),
                    evidence=[ev],
                    confidence=confidence if ev.verified else min(confidence, 0.4),
                    needs_review=not ev.verified,
                )
            )
    return out
