from tender_contracts.v1 import DocumentKind

from engine.ingestion.identify import identify
from engine.parsing.service import parse_document
from tests.fixtures import make_docx, make_pdf, make_xlsx


def test_identify_pdf():
    assert identify("ITT.pdf", b"%PDF-1.7") is DocumentKind.PDF


def test_identify_office_by_extension():
    assert identify("boq.xlsx", b"PK\x03\x04rest") is DocumentKind.XLSX
    assert identify("spec.docx", b"PK\x03\x04rest") is DocumentKind.DOCX
    assert identify("package.zip", b"PK\x03\x04rest") is DocumentKind.ZIP


def test_parse_pdf_preserves_pages_and_blocks():
    out = parse_document(DocumentKind.PDF, make_pdf())
    assert out.page_count == 2
    assert len(out.blocks) >= 4
    pages = {b.page for b in out.blocks}
    assert pages == {1, 2}
    all_text = " ".join(b.text for b in out.blocks)
    assert "ITT-2026-0042" in all_text
    assert "15 October 2026" in all_text


def test_parse_docx_preserves_tables():
    out = parse_document(DocumentKind.DOCX, make_docx())
    tables = [b for b in out.blocks if b.block_type == "table"]
    assert tables and tables[0].table_data[1] == ["Bid validity", "120 days"]
    headings = [b for b in out.blocks if b.block_type == "heading"]
    assert any("Invitation to Tender" in h.text for h in headings)


def test_parse_xlsx_rows_and_cells():
    out = parse_document(DocumentKind.XLSX, make_xlsx())
    assert len(out.blocks) == 1
    table = out.blocks[0]
    assert table.block_type == "table"
    assert table.table_data[0] == ["Item", "Description", "Qty", "Unit"]
    assert table.section_path == "Sheet: BoQ"
