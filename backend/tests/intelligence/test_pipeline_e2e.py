"""End-to-end integration tests for the Lunova AI Proposal Intelligence pipeline."""

import json
from pathlib import Path
import pytest

from intelligence import (
    AttachmentParser,
    DocumentParseStatus,
    IntelligenceResult,
    IntelligenceService,
    IntelligenceStatus,
    ParsedAttachment,
    ProposalContext,
)
from intelligence.retrieval import KnowledgeRetriever, StructuralChunker


@pytest.fixture
def fixtures_dir():
    return Path(__file__).resolve().parents[3] / "fixtures"


@pytest.fixture
def seeded_intelligence_service(fixtures_dir):
    """Seed intelligence service with NovaCorp's synthetic knowledge documents."""
    retriever = KnowledgeRetriever(enable_mock_fallback=False)
    chunker = StructuralChunker(chunk_size=500, chunk_overlap=100)

    knowledge_files = [
        "company_profile.md",
        "service_catalogue.md",
        "technical_capabilities.md",
        "case_study.md",
        "business_policies_faq.md",
    ]

    for kf in knowledge_files:
        k_path = fixtures_dir / "knowledge" / kf
        if k_path.exists():
            text = k_path.read_text(encoding="utf-8")
            doc_id = kf.replace(".md", "")
            chunks = chunker.chunk_document(text, document_id=doc_id, source=kf)
            for chk in chunks:
                retriever.index_chunk(
                    company_id="novacorp",
                    document_id=doc_id,
                    title=f"NovaCorp - {doc_id.replace('_', ' ').title()}",
                    section=chk.section_title,
                    content=chk.content,
                )

    return IntelligenceService(retriever=retriever)


def test_e2e_scenario_01_supported_rfp(seeded_intelligence_service, fixtures_dir):
    """Verify end-to-end execution of a fully supported RFP."""
    fixture_path = fixtures_dir / "proposals" / "scenario_01_supported_rfp.json"
    data = json.loads(fixture_path.read_text(encoding="utf-8"))

    context = ProposalContext(
        proposal_id=data["proposal_id"],
        company_id=data["company"]["company_id"],
        subject=data["email"]["subject"],
        body=data["email"]["body"],
    )

    result = seeded_intelligence_service.analyze_proposal(context)

    assert isinstance(result, IntelligenceResult)
    assert result.proposal_id == "scenario-01-supported"
    assert result.company_id == "novacorp"
    assert len(result.requirements) > 0
    assert len(result.retrieved_sources) > 0
    assert result.generated_response is not None
    assert result.confidence is not None
    assert result.confidence.overall_score >= 0.70


def test_e2e_scenario_06_undocumented_price_rfp(seeded_intelligence_service, fixtures_dir):
    """Verify request asking for binding pricing flags review and does not hallucinate rates."""
    fixture_path = fixtures_dir / "proposals" / "scenario_06_undocumented_price_rfp.json"
    data = json.loads(fixture_path.read_text(encoding="utf-8"))

    context = ProposalContext(
        proposal_id=data["proposal_id"],
        company_id=data["company"]["company_id"],
        subject=data["email"]["subject"],
        body=data["email"]["body"],
    )

    result = seeded_intelligence_service.analyze_proposal(context)

    assert result.proposal_id == "scenario-06-undocumented-price"
    # Anti-hallucination: must not invent binding prices
    assert "$5,000" not in result.generated_response.draft_email_body
    # Should flag unsupported items or request review
    assert len(result.clarification_questions) > 0 or len(result.unsupported_claims) > 0


def test_e2e_scenario_10_unsupported_rfp(seeded_intelligence_service, fixtures_dir):
    """Verify request completely outside company domain flags insufficient evidence."""
    fixture_path = fixtures_dir / "proposals" / "scenario_10_unsupported_rfp.json"
    data = json.loads(fixture_path.read_text(encoding="utf-8"))

    context = ProposalContext(
        proposal_id=data["proposal_id"],
        company_id=data["company"]["company_id"],
        subject=data["email"]["subject"],
        body=data["email"]["body"],
    )

    result = seeded_intelligence_service.analyze_proposal(context)

    assert result.proposal_id == "scenario-10-unsupported"
    # Deep sea acoustics is not in NovaCorp's knowledge base
    # Retrieved sources should be 0 or status should indicate insufficient evidence
    if len(result.retrieved_sources) == 0:
        assert result.status == IntelligenceStatus.INSUFFICIENT_EVIDENCE.value
    assert result.confidence.requires_human_attention is True


def test_e2e_email_with_real_pdf_parsing(seeded_intelligence_service):
    """Verify pipeline processing an incoming proposal with an attached PDF parsed at runtime."""
    parser = AttachmentParser()
    pdf_bytes = (
        b"%PDF-1.4\n"
        b"1 0 obj <</Type /Catalog /Pages 2 0 R>> endobj\n"
        b"2 0 obj <</Type /Pages /Kids [3 0 R] /Count 1>> endobj\n"
        b"3 0 obj <</Type /Page /Parent 2 0 R /MediaBox [0 0 300 144] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj\n"
        b"4 0 obj <</Length 68>> stream\n"
        b"BT /F1 12 Tf 50 100 Td (RFP Attachment: Must support AES-256 data encryption.) Tj ET\n"
        b"endstream endobj\n"
        b"5 0 obj <</Type /Font /Subtype /Type1 /BaseFont /Helvetica>> endobj\n"
        b"xref\n0 6\n0000000000 65535 f \n0000000009 00000 n \n0000000058 00000 n \n0000000115 00000 n \n0000000244 00000 n \n0000000363 00000 n \n"
        b"trailer <</Size 6 /Root 1 0 R>>\nstartxref\n437\n%%EOF\n"
    )

    parsed_doc = parser.parse(pdf_bytes, filename="security_spec.pdf", content_type="application/pdf")
    assert parsed_doc.status == DocumentParseStatus.SUCCESS
    assert "AES-256" in parsed_doc.text

    parsed_att = ParsedAttachment(
        filename=parsed_doc.filename,
        content_type=parsed_doc.content_type,
        extracted_text=parsed_doc.text,
        status=parsed_doc.status.value,
        page_count=parsed_doc.page_count,
    )

    context = ProposalContext(
        proposal_id="prop-e2e-pdf-01",
        company_id="novacorp",
        subject="RFP: Security Architecture",
        body="Please review our attached security specifications.",
        attachments=[parsed_att],
    )

    # Attachments text should be populated
    assert len(context.attachments_text) == 1
    assert "AES-256" in context.attachments_text[0]

    result = seeded_intelligence_service.analyze_proposal(context)
    assert result.proposal_id == "prop-e2e-pdf-01"
    assert len(result.retrieved_sources) > 0
    # Technical capabilities fixture has AES-256
    assert any("AES-256" in s.content for s in result.retrieved_sources)
