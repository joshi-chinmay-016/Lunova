"""End-to-end integration tests for Lunetron enterprise knowledge and proposal intelligence pipeline."""

from pathlib import Path
import pytest

from intelligence import (
    IntelligenceResult,
    IntelligenceService,
    IntelligenceStatus,
    ProposalContext,
)
from intelligence.retrieval import KnowledgeRetriever, StructuralChunker


@pytest.fixture(scope="module")
def lunetron_intelligence_service():
    """Seed intelligence service with official Lunetron reference documentation."""
    fixtures_dir = Path(__file__).resolve().parents[3] / "fixtures" / "knowledge" / "lunetron"
    retriever = KnowledgeRetriever(enable_mock_fallback=False, relevance_threshold=0.25)
    chunker = StructuralChunker(chunk_size=400, chunk_overlap=80)

    doc_files = [
        "lunetron_company_overview.md",
        "lunetron_enterprise_cloud_capabilities.md",
        "lunetron_ai_and_automation.md",
        "lunetron_security_and_compliance.md",
        "lunetron_service_level_agreements.md",
        "lunetron_standard_pricing_models.md",
        "lunetron_implementation_methodology.md",
        "lunetron_case_studies_and_references.md",
    ]

    for df in doc_files:
        p = fixtures_dir / df
        assert p.exists(), f"File {p} does not exist"
        text = p.read_text(encoding="utf-8")
        doc_id = df.replace(".md", "")
        chunks = chunker.chunk_document(text, document_id=doc_id, source=df)
        for chk in chunks:
            retriever.index_chunk(
                company_id="lunetron",
                document_id=doc_id,
                title=f"Lunetron - {doc_id.replace('lunetron_', '').replace('_', ' ').title()}",
                section=chk.section_title,
                content=chk.content,
            )

    return IntelligenceService(retriever=retriever)


def test_lunetron_e2e_proposal_analysis_supported(lunetron_intelligence_service):
    """Verify end-to-end proposal analysis and grounded draft generation for Lunetron."""
    context = ProposalContext(
        proposal_id="prop-lunetron-rfp-001",
        company_id="lunetron",
        subject="RFP: Enterprise Cloud Modernization & AI Automation Architecture",
        body=(
            "Hello Lunetron Team,\n\n"
            "We are evaluating enterprise technology partners for our cloud infrastructure modernization. "
            "Our requirements are:\n"
            "1. The partner must hold active SOC 2 Type II and ISO 27001 certifications.\n"
            "2. We require multi-cloud Kubernetes deployment experience across AWS and GCP using Terraform.\n"
            "3. High-availability PostgreSQL with pgvector embedding support for sovereign RAG.\n"
            "4. A guaranteed 99.99% monthly uptime SLA with sub-15 minute response times for Severity 1 incidents.\n"
            "5. Please detail your standard Enterprise Core licensing tier and Discovery sprint timeline.\n\n"
            "Best regards,\nVP of Enterprise Technology"
        ),
    )

    result = lunetron_intelligence_service.analyze_proposal(context)

    assert isinstance(result, IntelligenceResult)
    assert result.proposal_id == "prop-lunetron-rfp-001"
    assert result.company_id == "lunetron"
    assert len(result.requirements) > 0
    assert len(result.retrieved_sources) > 0

    # Verify citations point to Lunetron knowledge
    for source in result.retrieved_sources:
        assert source.source_id.startswith("lunetron_")
        assert "Lunetron" in source.title

    assert result.generated_response is not None
    assert len(result.generated_response.draft_email_body) > 50
    assert result.confidence is not None


def test_lunetron_e2e_unsupported_domain_anti_hallucination(lunetron_intelligence_service):
    """Verify that requests outside Lunetron's domain flag lack of evidence and avoid fabrication."""
    context = ProposalContext(
        proposal_id="prop-lunetron-rfp-nuclear",
        company_id="lunetron",
        subject="RFP: Subsea Acoustic Seismic Drilling Sensor Firmware",
        body=(
            "Dear Vendor,\n\n"
            "We require custom low-level embedded C firmware for underwater seismic hydrophones operating at 4,000 meters ocean depth. "
            "Firmware must interface with analog transducers and survive 400 atmospheres of hydrostatic pressure.\n\n"
            "Please submit your technical bid.\n\n"
            "Regards,\nSubsea Procurement Team"
        ),
    )

    result = lunetron_intelligence_service.analyze_proposal(context)

    assert result.proposal_id == "prop-lunetron-rfp-nuclear"
    # Deep sea acoustics is not in Lunetron's knowledge base
    # Retrieved sources should be 0 or status should indicate insufficient evidence or requires human attention
    if len(result.retrieved_sources) == 0:
        assert result.status == IntelligenceStatus.INSUFFICIENT_EVIDENCE.value
    assert result.confidence.requires_human_attention is True


def test_lunetron_tenant_isolation_in_e2e_pipeline(lunetron_intelligence_service):
    """Verify that an inquiry for a different company_id cannot retrieve Lunetron documentation."""
    context = ProposalContext(
        proposal_id="prop-external-tenant-001",
        company_id="external_tenant_corp",
        subject="RFP: Request for SOC 2 Type II and AWS Architecture Details",
        body="We need details on your SOC 2 certification and multi-cloud capabilities.",
    )

    result = lunetron_intelligence_service.analyze_proposal(context)

    # external_tenant_corp has no knowledge indexed
    assert len(result.retrieved_sources) == 0
    assert result.status == IntelligenceStatus.INSUFFICIENT_EVIDENCE.value
