from __future__ import annotations

import io

from docling.datamodel.base_models import DocumentStream
from docling.document_converter import DocumentConverter

from engine.parsing.base import ParsedBlock, ParseOutput

_converter: DocumentConverter | None = None


def parse_with_docling(data: bytes) -> ParseOutput:
    """Layout- and table-aware parsing (incl. OCR for scanned pages)."""
    global _converter
    if _converter is None:
        _converter = DocumentConverter()
    result = _converter.convert(DocumentStream(name="document.pdf", stream=io.BytesIO(data)))
    doc = result.document
    out = ParseOutput(page_count=len(doc.pages) if doc.pages else None)
    section: str | None = None
    for item, _level in doc.iterate_items():
        label = getattr(item, "label", "")
        page = None
        if getattr(item, "prov", None):
            page = item.prov[0].page_no
        if label in ("section_header", "title"):
            section = item.text
            out.blocks.append(ParsedBlock("heading", item.text, page=page, section_path=section))
        elif label == "table":
            grid = [
                [cell.text or "" for cell in row]
                for row in getattr(item.data, "grid", [])
            ]
            flat = "\n".join(" | ".join(r) for r in grid)
            out.blocks.append(
                ParsedBlock("table", flat, page=page, section_path=section, table_data=grid)
            )
        elif getattr(item, "text", "").strip():
            out.blocks.append(
                ParsedBlock("paragraph", item.text.strip(), page=page, section_path=section)
            )
    return out
