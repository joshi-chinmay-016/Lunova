"""Lunetron Enterprise Knowledge Base Retrieval and Multi-Tenancy Benchmark Suite.

Evaluates KnowledgeRetriever against official Lunetron reference documentation across:
1. Retrieval Precision & Hit/Recall Metrics (Hit@1, Hit@3, Recall@3)
2. Citation Accuracy & Source Attribution
3. Strict Multi-Tenancy Enforcement (Tenant isolation between lunetron and other tenants)
4. Query Performance & Latency Budgets (< 200ms)
"""

import time
from pathlib import Path
from typing import Any, Dict, List, Set
import pytest

from intelligence.models.retrieval import RetrievedSource
from intelligence.providers.mock import MockEmbeddingProvider
from intelligence.retrieval.chunker import StructuralChunker
from intelligence.retrieval.retriever import KnowledgeRetriever


@pytest.fixture(scope="module")
def indexed_lunetron_retriever():
    """Load and index all 8 official Lunetron reference documents."""
    fixtures_dir = Path(__file__).resolve().parents[3] / "fixtures" / "knowledge" / "lunetron"
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

    embedder = MockEmbeddingProvider()
    retriever = KnowledgeRetriever(embedding_provider=embedder, enable_mock_fallback=False)
    chunker = StructuralChunker(chunk_size=400, chunk_overlap=80)

    for filename in doc_files:
        file_path = fixtures_dir / filename
        assert file_path.exists(), f"Lunetron document {filename} not found at {file_path}"
        text = file_path.read_text(encoding="utf-8")
        doc_id = filename.replace(".md", "")
        chunks = chunker.chunk_document(text, document_id=doc_id, source=filename)
        for chk in chunks:
            retriever.index_chunk(
                company_id="lunetron",
                document_id=doc_id,
                title=f"Lunetron - {doc_id.replace('lunetron_', '').replace('_', ' ').title()}",
                section=chk.section_title,
                content=chk.content,
            )

    # Also index a decoy competitor chunk to test multi-tenancy enforcement
    retriever.index_chunk(
        company_id="competitor_corp",
        document_id="competitor_overview",
        title="Competitor Systems Overview",
        section="Architecture",
        content="Competitor Corp provides legacy monolithic software with no SOC 2 certification.",
    )

    return retriever


def test_lunetron_retrieval_benchmark_precision(indexed_lunetron_retriever):
    """Verify retrieval precision and recall against official Lunetron knowledge."""
    retriever = indexed_lunetron_retriever

    benchmark_queries: List[Dict[str, Any]] = [
        {
            "query_id": "LQ1_Security",
            "query": "SOC 2 Type II compliance audit, ISO 27001, GDPR encryption AES-256",
            "ground_truth_docs": {"lunetron_security_and_compliance", "lunetron_case_studies_and_references"},
        },
        {
            "query_id": "LQ2_Cloud_Infra",
            "query": "Multi-cloud Kubernetes EKS GKE Terraform automated disaster recovery RPO RTO",
            "ground_truth_docs": {"lunetron_enterprise_cloud_capabilities"},
        },
        {
            "query_id": "LQ3_AI_RAG",
            "query": "Retrieval Augmented Generation pgvector 768 dimensions hallucination guardrails",
            "ground_truth_docs": {"lunetron_ai_and_automation", "lunetron_enterprise_cloud_capabilities"},
        },
        {
            "query_id": "LQ4_SLAs",
            "query": "99.99% monthly uptime guarantee Severity 1 incident response 15 minutes",
            "ground_truth_docs": {"lunetron_service_level_agreements"},
        },
        {
            "query_id": "LQ5_Pricing",
            "query": "Enterprise Core licensing pricing $12000 month Discovery sprint $45000",
            "ground_truth_docs": {"lunetron_standard_pricing_models"},
        },
        {
            "query_id": "LQ6_Implementation",
            "query": "12-week deployment methodology Phase 1 discovery UAT cutover hypercare",
            "ground_truth_docs": {"lunetron_implementation_methodology"},
        },
        {
            "query_id": "LQ7_Case_Studies",
            "query": "Investment bank and healthcare network clinical records case study",
            "ground_truth_docs": {"lunetron_case_studies_and_references"},
        },
    ]

    hit_at_1_count = 0
    hit_at_3_count = 0
    recalls_at_3: List[float] = []

    for bq in benchmark_queries:
        query_text = bq["query"]
        ground_truth: Set[str] = bq["ground_truth_docs"]

        results = retriever.retrieve(
            requirements=query_text,
            company_id="lunetron",
            top_k=3,
            relevance_threshold=0.0,
        )

        retrieved_doc_ids = [r.source_id for r in results]

        if retrieved_doc_ids and retrieved_doc_ids[0] in ground_truth:
            hit_at_1_count += 1

        hits_in_top_3 = set(retrieved_doc_ids[:3]).intersection(ground_truth)
        if len(hits_in_top_3) > 0:
            hit_at_3_count += 1

        recall = len(hits_in_top_3) / len(ground_truth)
        recalls_at_3.append(recall)

        print(f"\n[{bq['query_id']}] retrieved: {retrieved_doc_ids} | ground_truth: {ground_truth}")

    total_queries = len(benchmark_queries)
    hit_at_1 = hit_at_1_count / total_queries
    hit_at_3 = hit_at_3_count / total_queries
    mean_recall = sum(recalls_at_3) / total_queries

    print(f"\nLUNETRON BENCHMARK: Hit@1={hit_at_1:.2%}, Hit@3={hit_at_3:.2%}, Recall@3={mean_recall:.2%}")

    assert hit_at_3 >= 0.80, f"Hit@3 was {hit_at_3:.2%}, expected >= 80%"
    assert mean_recall >= 0.70, f"Mean Recall@3 was {mean_recall:.2%}, expected >= 70%"


def test_lunetron_citation_accuracy(indexed_lunetron_retriever):
    """Verify that retrieved contexts provide precise citations with valid doc IDs and sections."""
    retriever = indexed_lunetron_retriever

    results: List[RetrievedSource] = retriever.retrieve(
        requirements="SOC 2 Type II and ISO 27001 data protection",
        company_id="lunetron",
        top_k=2,
    )

    assert len(results) > 0
    for r in results:
        assert r.source_id.startswith("lunetron_")
        assert len(r.content) > 20
        assert r.title != ""
        assert r.section != ""


def test_lunetron_strict_multi_tenancy_enforcement(indexed_lunetron_retriever):
    """Verify that Lunetron queries NEVER return other tenant data, and vice versa."""
    retriever = indexed_lunetron_retriever

    # Query as competitor_corp: should NEVER see lunetron documents
    competitor_results = retriever.retrieve(
        requirements="SOC 2 enterprise cloud architecture",
        company_id="competitor_corp",
        top_k=5,
    )
    for r in competitor_results:
        assert "lunetron" not in r.source_id
        assert r.title.startswith("Competitor")

    # Query as lunetron: should NEVER see competitor data
    lunetron_results = retriever.retrieve(
        requirements="legacy monolithic software without SOC 2",
        company_id="lunetron",
        top_k=5,
    )
    for r in lunetron_results:
        assert r.source_id.startswith("lunetron_")
        assert "competitor" not in r.source_id


def test_lunetron_retrieval_query_performance(indexed_lunetron_retriever):
    """Verify that retrieval operations complete well within the 200ms latency budget."""
    retriever = indexed_lunetron_retriever

    start_time = time.perf_counter()
    for _ in range(10):
        retriever.retrieve(
            requirements="PostgreSQL high availability pgvector embedding disaster recovery",
            company_id="lunetron",
            top_k=3,
        )
    elapsed_ms = (time.perf_counter() - start_time) * 1000 / 10

    # Retrieval should be very fast (< 100ms per query in-memory)
    assert elapsed_ms < 100, f"Average retrieval latency was {elapsed_ms:.2f}ms, expected < 100ms"
