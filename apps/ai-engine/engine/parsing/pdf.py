from __future__ import annotations

import io
import re

from pypdf import PdfReader

from engine.parsing.base import ParsedBlock, ParseOutput

_HEADING_RE = re.compile(r"^(?:(?:\d+\.)+\d*|[A-Z][A-Z \-/&]{6,})\s+\S|^(?:SECTION|PART|APPENDIX|ANNEX)\b", re.I)


def parse_pdf(data: bytes) -> ParseOutput:
    """Baseline born-digital PDF parser (pypdf). Docling adapter supersedes this
    when installed; scanned pages produce a warning for the OCR path."""
    reader = PdfReader(io.BytesIO(data))
    out = ParseOutput(page_count=len(reader.pages))
    section: str | None = None
    for page_no, page in enumerate(reader.pages, start=1):
        text = page.extract_text() or ""
        if not text.strip():
            out.warnings.append(f"page {page_no}: no extractable text (scanned? OCR needed)")
            continue

        para: list[str] = []

        def flush() -> None:
            if para:
                out.blocks.append(
                    ParsedBlock("paragraph", " ".join(para), page=page_no, section_path=section)
                )
                para.clear()

        # Line-based grouping: blank lines and headings break paragraphs; long
        # runs are capped so evidence stays granular on dense pages.
        for line in text.splitlines():
            line = line.strip()
            if not line:
                flush()
                continue
            if _HEADING_RE.match(line) and len(line) < 120:
                flush()
                section = line
                out.blocks.append(ParsedBlock("heading", line, page=page_no, section_path=section))
                continue
            para.append(line)
            if sum(len(p) for p in para) > 800:
                flush()
        flush()
    return out
