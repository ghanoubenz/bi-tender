from __future__ import annotations

from tender_contracts.v1 import DocumentKind

from engine.parsing.base import ParseOutput


def parse_document(kind: DocumentKind, data: bytes) -> ParseOutput:
    """Dispatch to the right parser backend.

    Docling (optional extra) is preferred for PDF/DOCX when installed — it adds
    layout-aware tables and OCR for scans. The lightweight backends below keep
    dev/test environments dependency-light and act as fallbacks.
    """
    if kind is DocumentKind.PDF:
        docling = _try_docling(data)
        if docling is not None:
            return docling
        from engine.parsing.pdf import parse_pdf

        return parse_pdf(data)
    if kind is DocumentKind.DOCX:
        from engine.parsing.docx import parse_docx

        return parse_docx(data)
    if kind is DocumentKind.XLSX:
        from engine.parsing.xlsx import parse_xlsx

        return parse_xlsx(data)
    out = ParseOutput()
    out.warnings.append(f"unsupported document kind: {kind.value}")
    return out


def _try_docling(data: bytes) -> ParseOutput | None:
    try:
        from engine.parsing.docling_adapter import parse_with_docling
    except ImportError:
        return None
    try:
        return parse_with_docling(data)
    except Exception:  # docling failure falls back to baseline parser
        return None
