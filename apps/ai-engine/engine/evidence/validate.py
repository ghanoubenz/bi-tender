from __future__ import annotations

import re

from tender_contracts.v1 import EvidenceReference

from engine.db.models import DocumentBlock

_WS = re.compile(r"\s+")


def _norm(s: str) -> str:
    return _WS.sub(" ", s).strip().lower()


def validate_evidence(ev: EvidenceReference, blocks_by_id: dict[str, DocumentBlock]) -> EvidenceReference:
    """PRODUCT_CONTRACT rule 2: a quote must actually exist in its source block.

    Verified quotes get `verified=True`; unverifiable ones keep verified=False
    and the caller must set needs_review on the owning fact.
    """
    block = blocks_by_id.get(ev.block_id or "")
    if block is not None and _norm(ev.quote) in _norm(block.text):
        return ev.model_copy(update={"verified": True, "page": ev.page or block.page})
    return ev.model_copy(update={"verified": False})


def all_verified(evidence: list[EvidenceReference]) -> bool:
    return bool(evidence) and all(e.verified for e in evidence)
