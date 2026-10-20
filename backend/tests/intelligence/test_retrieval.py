"""Unit tests for KnowledgeRetriever and mandatory multi-tenant isolation."""

import pytest

from intelligence.exceptions import MissingCompanyContextError
from intelligence.models.extraction import ExtractedRequirement
from intelligence.models.retrieval import RetrievedSource
from intelligence.providers.mock import MockEmbeddingProvider
from intelligence.retrieval.retriever import KnowledgeRetriever, cosine_similarity


def test_cosine_similarity_edge_cases():
    """Verify vector cosine similarity calculation and edge cases."""
    v1 = [1.0, 0.0, 0.0]
    v2 = [1.0, 0.0, 0.0]
    assert cosine_similarity(v1, v2) == 1.0

    v3 = [0.0, 1.0, 0.0]
    assert cosine_similarity(v1, v3) == 0.0

    # Zero vectors
    assert cosine_similarity([0.0, 0.0], [0.0, 0.0]) == 0.0
    # Length mismatch
    assert cosine_similarity([1.0], [1.0, 2.0]) == 0.0


def test_retriever_rejects_missing_or_blank_company_id():
    """Verify retriever strictly enforces mandatory tenant boundary."""
    retriever = KnowledgeRetriever()

    with pytest.raises(MissingCompanyContextError, match="company_id is mandatory"):
        retriever.retrieve(requirements="Any query", company_id=None)  # type: ignore

    with pytest.raises(MissingCompanyContextError, match="cannot be blank"):
        retriever.retrieve(requirements="Any query", company_id="")

    with pytest.raises(MissingCompanyContextError, match="cannot be blank"):
        retriever.retrieve(requirements="Any query", company_id="   ")


def test_strict_multi_tenant_isolation_company_a_vs_company_b():
    """Security Requirement: Company A must never retrieve Company B's chunks.

    Scenario:
    - Company A (AtlasCorp) has service 'Project Atlas'.
    - Company B (BeaconCorp) has service 'Project Beacon'.
    - Querying Company A for 'Project Beacon' MUST NOT return Company B's knowledge.
    """
    embedder = MockEmbeddingProvider()
    retriever = KnowledgeRetriever(embedding_provider=embedder, enable_mock_fallback=False)

    # Index Company A's knowledge
    retriever.index_chunk(
        company_id="company_a",
        document_id="doc-a-01",
        title="Atlas Platform Documentation",
        section="Services",
        content="AtlasCorp provides Project Atlas, an automated logistics intelligence system.",
    )

    # Index Company B's knowledge
    retriever.index_chunk(
        company_id="company_b",
        document_id="doc-b-01",
        title="Beacon Platform Documentation",
        section="Services",
        content="BeaconCorp provides Project Beacon, an ultra-low-latency IoT telemetry gateway.",
    )

    # 1. Company A queries for 'Project Atlas' -> returns only Company A
    results_a = retriever.retrieve(requirements="Tell me about Project Atlas", company_id="company_a")
    assert len(results_a) == 1
    assert results_a[0].company_id == "company_a"
    assert "Project Atlas" in results_a[0].content

    # 2. Company A queries for 'Project Beacon' -> must NEVER return Company B's chunks!
    results_a_cross = retriever.retrieve(requirements="Tell me about Project Beacon", company_id="company_a")
    # Even though query mentions Beacon, Company B chunks must NOT be returned
    assert not any(r.company_id == "company_b" for r in results_a_cross)
    assert not any("Project Beacon" in r.content for r in results_a_cross)

    # 3. Company B queries for 'Project Beacon' -> returns Company B
    results_b = retriever.retrieve(requirements="Tell me about Project Beacon", company_id="company_b")
    assert len(results_b) == 1
    assert results_b[0].company_id == "company_b"
    assert "Project Beacon" in results_b[0].content


def test_retriever_empty_knowledge_base():
    """Verify empty tenant knowledge base returns clean empty result without crashing."""
    retriever = KnowledgeRetriever(enable_mock_fallback=False)
    results = retriever.retrieve(requirements="Any requirement", company_id="empty_tenant_xyz")
    assert results == []


def test_retriever_with_extracted_requirements():
    """Verify retrieval using List[ExtractedRequirement] objects."""
    retriever = KnowledgeRetriever(enable_mock_fallback=False)

    retriever.index_chunk(
        company_id="lunetron",
        document_id="doc-security",
        title="Security Whitepaper",
        section="Authentication",
        content="Lunetron supports OAuth2 with OpenID Connect and role-based access control.",
    )

    reqs = [
        ExtractedRequirement(
            requirement_id="req-01",
            text="Solution must support OAuth2 authentication and SSO.",
            category="security",
            priority="high",
        )
    ]

    results = retriever.retrieve(requirements=reqs, company_id="lunetron")
    assert len(results) >= 1
    assert results[0].company_id == "lunetron"
    assert "OAuth2" in results[0].content


def test_retriever_relevance_threshold_filtering():
    """Verify chunks below relevance threshold are filtered out."""
    embedder = MockEmbeddingProvider()
    retriever = KnowledgeRetriever(
        embedding_provider=embedder,
        relevance_threshold=0.9999,  # Impossibly high threshold
        enable_mock_fallback=False,
    )

    retriever.index_chunk(
        company_id="lunetron",
        content="General company information.",
    )

    results = retriever.retrieve(requirements="Something slightly different", company_id="lunetron")
    assert len(results) == 0


def test_retriever_source_deduplication():
    """Verify duplicate chunks from the same document section are deduplicated."""
    retriever = KnowledgeRetriever(enable_mock_fallback=False)

    # Index identical content twice
    retriever.index_chunk(
        company_id="lunetron",
        document_id="doc-dup",
        title="Duplicate Doc",
        content="Exact duplicate paragraph text about enterprise features.",
    )
    retriever.index_chunk(
        company_id="lunetron",
        document_id="doc-dup",
        title="Duplicate Doc",
        content="Exact duplicate paragraph text about enterprise features.",
    )

    results = retriever.retrieve(requirements="enterprise features", company_id="lunetron")
    assert len(results) == 1
