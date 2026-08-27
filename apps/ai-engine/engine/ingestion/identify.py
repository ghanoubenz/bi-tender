from __future__ import annotations

from tender_contracts.v1 import DocumentKind

_MAGIC = [
    (b"%PDF", DocumentKind.PDF),
    (b"PK\x03\x04", None),  # zip container: docx/xlsx/zip — disambiguate by extension
]

_EXT = {
    "pdf": DocumentKind.PDF,
    "docx": DocumentKind.DOCX,
    "xlsx": DocumentKind.XLSX,
    "xlsm": DocumentKind.XLSX,
    "zip": DocumentKind.ZIP,
    "eml": DocumentKind.EMAIL,
    "msg": DocumentKind.EMAIL,
}


def identify(filename: str, head: bytes) -> DocumentKind:
    """Identify a document by magic bytes first, extension second."""
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if head.startswith(b"%PDF"):
        return DocumentKind.PDF
    if head.startswith(b"PK\x03\x04"):
        return _EXT.get(ext, DocumentKind.ZIP)
    return _EXT.get(ext, DocumentKind.UNKNOWN)
