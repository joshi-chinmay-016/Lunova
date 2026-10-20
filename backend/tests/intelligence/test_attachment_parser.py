"""Unit tests for AttachmentParser (PDF, DOCX, TXT, error cases, edge cases)."""

import io
import os
from pathlib import Path
import pytest

from intelligence.document_processing import (
    AttachmentParser,
    DocumentParseStatus,
    ParsedDocument,
)
from intelligence.models.proposal import ParsedAttachment, ProposalContext


@pytest.fixture
def parser():
    return AttachmentParser(max_bytes=1024 * 1024)  # 1MB limit for tests


def test_txt_parsing_valid_utf8(parser):
    """Verify parsing of standard UTF-8 text."""
    content = "Lunetron Enterprise AI Proposal\nRequirement 1: SSO Authentication\nRequirement 2: Audit Logs"
    result = parser.parse(content.encode("utf-8"), filename="requirements.txt", content_type="text/plain")

    assert result.status == DocumentParseStatus.SUCCESS
    assert result.filename == "requirements.txt"
    assert "SSO Authentication" in result.text
    assert result.word_count == 12
    assert result.character_count == len(content)
    assert result.is_usable is True


def test_txt_parsing_line_ending_normalization(parser):
    """Verify that CRLF line endings are normalized to standard LF."""
    raw = b"Line 1\r\nLine 2\r\nLine 3"
    result = parser.parse(raw, filename="lines.txt", content_type="text/plain")

    assert result.status == DocumentParseStatus.SUCCESS
    assert "\r" not in result.text
    assert result.text == "Line 1\nLine 2\nLine 3"


def test_txt_parsing_latin1_encoding(parser):
    """Verify that text with Latin-1 specific characters is handled safely."""
    raw = "Société Générale & résumé".encode("latin-1")
    result = parser.parse(raw, filename="french.txt", content_type="text/plain")

    assert result.status == DocumentParseStatus.SUCCESS
    assert "Société" in result.text or "Générale" in result.text


def test_txt_parsing_empty(parser):
    """Verify that empty text files are flagged as EMPTY."""
    result = parser.parse(b"   \n\t  ", filename="empty.txt", content_type="text/plain")
    assert result.status == DocumentParseStatus.EMPTY
    assert result.is_usable is False
    assert result.error_message is not None


def test_pdf_parsing_valid(parser):
    """Verify that readable multi-page PDF extracts text and page metadata."""
    import pypdf

    # Create a real in-memory PDF using pypdf
    writer = pypdf.PdfWriter()
    page1 = writer.add_blank_page(width=200, height=200)
    # pypdf doesn't easily draw text without reportlab, but let's test extraction
    # Alternatively, create a PDF stream with basic text stream
    pdf_bytes = (
        b"%PDF-1.4\n"
        b"1 0 obj <</Type /Catalog /Pages 2 0 R>> endobj\n"
        b"2 0 obj <</Type /Pages /Kids [3 0 R] /Count 1>> endobj\n"
        b"3 0 obj <</Type /Page /Parent 2 0 R /MediaBox [0 0 300 144] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj\n"
        b"4 0 obj <</Length 55>> stream\n"
        b"BT /F1 12 Tf 50 100 Td (Lunetron Proposal Specifications) Tj ET\n"
        b"endstream endobj\n"
        b"5 0 obj <</Type /Font /Subtype /Type1 /BaseFont /Helvetica>> endobj\n"
        b"xref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000244 00000 n \n0000000350 00000 n \n"
        b"trailer <</Size 6 /Root 1 0 R>>\nstartxref\n424\n%%EOF\n"
    )

    result = parser.parse(pdf_bytes, filename="spec.pdf", content_type="application/pdf")
    assert result.status == DocumentParseStatus.SUCCESS
    assert "Lunetron Proposal Specifications" in result.text
    assert result.page_count == 1
    assert len(result.pages) == 1
    assert result.is_usable is True


def test_pdf_parsing_image_only_or_empty(parser):
    """Verify that an empty or image-only PDF reports EMPTY status instead of silent empty string."""
    import pypdf

    # Blank page PDF
    writer = pypdf.PdfWriter()
    writer.add_blank_page(width=200, height=200)
    stream = io.BytesIO()
    writer.write(stream)
    pdf_bytes = stream.getvalue()

    result = parser.parse(pdf_bytes, filename="scanned.pdf", content_type="application/pdf")
    assert result.status == DocumentParseStatus.EMPTY
    assert result.is_usable is False
    assert "no extractable text was found" in result.error_message


def test_pdf_parsing_corrupted(parser):
    """Verify that a corrupted PDF bytes payload produces CORRUPTED status without crashing."""
    corrupted_pdf = b"%PDF-1.4\nINVALID_GARBAGE_BYTES_THAT_BREAK_READER"
    result = parser.parse(corrupted_pdf, filename="corrupted.pdf", content_type="application/pdf")

    assert result.status == DocumentParseStatus.CORRUPTED
    assert result.is_usable is False
    assert result.error_message is not None


def test_docx_parsing_valid(parser):
    """Verify that a valid DOCX extracts paragraph and table text."""
    import docx

    doc = docx.Document()
    doc.add_heading("Project Overview", level=1)
    doc.add_paragraph("Lunetron provides enterprise AI agent automation.")

    table = doc.add_table(rows=2, cols=2)
    table.cell(0, 0).text = "Feature"
    table.cell(0, 1).text = "Status"
    table.cell(1, 0).text = "Tenant Isolation"
    table.cell(1, 1).text = "Supported"

    stream = io.BytesIO()
    doc.save(stream)
    docx_bytes = stream.getvalue()

    result = parser.parse(docx_bytes, filename="specs.docx")
    assert result.status == DocumentParseStatus.SUCCESS
    assert "Project Overview" in result.text
    assert "enterprise AI agent automation" in result.text
    assert "Tenant Isolation" in result.text
    assert "Supported" in result.text
    assert result.is_usable is True


def test_docx_parsing_corrupted(parser):
    """Verify that corrupt DOCX archive produces CORRUPTED status safely."""
    # PK zip header followed by garbage
    corrupted_docx = b"PK\x03\x04\x00\x00\x00\x00NotARealZipArchive"
    result = parser.parse(corrupted_docx, filename="broken.docx")

    assert result.status == DocumentParseStatus.CORRUPTED
    assert result.is_usable is False


def test_oversized_file_rejected(parser):
    """Verify that files exceeding the size limit are rejected as OVERSIZED."""
    # Parser fixture has 1MB limit
    oversized = b"A" * (1024 * 1024 + 50)
    result = parser.parse(oversized, filename="large.txt", content_type="text/plain")

    assert result.status == DocumentParseStatus.OVERSIZED
    assert result.is_usable is False
    assert "exceeds configured limit" in result.error_message


def test_unsupported_binary_file(parser):
    """Verify that arbitrary binary files are flagged as UNSUPPORTED."""
    exe_bytes = b"MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00\xff\xff\x00\x00"
    result = parser.parse(exe_bytes, filename="program.exe", content_type="application/octet-stream")

    assert result.status == DocumentParseStatus.UNSUPPORTED
    assert result.is_usable is False
    assert "Unsupported document format" in result.error_message


def test_attachment_integration_with_proposal_context(parser):
    """Verify parsed attachments map cleanly into ProposalContext maintaining backwards compatibility."""
    parsed_doc = ParsedDocument(
        filename="rfp_attachment.pdf",
        content_type="application/pdf",
        text="The system must support automated email ingestion and pgvector retrieval.",
        status=DocumentParseStatus.SUCCESS,
        page_count=1,
    )

    parsed_att = ParsedAttachment(
        filename=parsed_doc.filename,
        content_type=parsed_doc.content_type,
        extracted_text=parsed_doc.text,
        status=parsed_doc.status.value,
        page_count=parsed_doc.page_count,
    )

    context = ProposalContext(
        proposal_id="prop-with-att-001",
        company_id="lunetron",
        subject="RFP with Attachment",
        body="Please see attached requirements document.",
        attachments=[parsed_att],
    )

    # Verify that attachments_text is automatically synced
    assert len(context.attachments_text) == 1
    assert "automated email ingestion" in context.attachments_text[0]
    assert context.attachments[0].filename == "rfp_attachment.pdf"
