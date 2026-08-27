from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class ParsedBlock:
    """Normalized structural unit produced by every parser backend.

    Structure preservation is a product rule: a 300-page tender must never
    become one giant string. Tables keep their rows/cells in `table_data`.
    """

    block_type: str  # paragraph | heading | table | list_item
    text: str
    page: int | None = None
    section_path: str | None = None
    table_data: list[list[str]] | None = None


@dataclass
class ParseOutput:
    blocks: list[ParsedBlock] = field(default_factory=list)
    page_count: int | None = None
    warnings: list[str] = field(default_factory=list)
