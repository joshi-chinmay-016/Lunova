"""Retrieval evaluation benchmark suite measuring Hit@1, Hit@3, and Recall@K.

Evaluates KnowledgeRetriever against synthetic company knowledge fixtures
with known ground truth document relevance.
"""

from pathlib import Path
from typing import Any, Dict, List, Set
import pytest

from intelligence.models.extraction import ExtractedRequirement
from intelligence.providers.mock import MockEmbeddingProvider
from intelligence.retrieval.chunker import StructuralChunker
from intelligence.retrieval.retriever import KnowledgeRetriever


@pytest.fixture(scope="module")
def indexed_novacorp_retriever():
    """Load and index all 5 synthetic knowledge documents for NovaCorp."""
    fixtures_dir = Path(__file__).resolve().parents[3] / "fixtures" / "knowledge"
    knowledge_files = [
        "company_profile.md",
        "service_catalogue.md",
        "technical_capabilities.md",
        "case_study.md",
        "business_policies_faq.md",
    ]

    embedder = MockEmbeddingProvider()
    retriever = KnowledgeRetriever(embedding_provider=embedder, enable_mock_fallback=False)
    chunker = StructuralChunker(chunk_size=400, chunk_overlap=80)

    for filename in knowledge_files:
        file_path = fixtures_dir / filename
        if not file_path.exists():
            continue
        text = file_path.read_text(encoding="utf-8")
        doc_id = filename.replace(".md", "")
        chunks = chunker.chunk_document(text, document_id=doc_id, source=filename)
        for chk in chunks:
            retriever.index_chunk(
                company_id="novacorp",
                document_id=doc_id,
                title=f"NovaCorp - {doc_id.replace('_', ' ').title()}",
                section=chk.section_title,
                content=chk.content,
            )

    return retriever


def test_retrieval_benchmark_hit_and_recall_metrics(indexed_novacorp_retriever, capsys):
    """Run deterministic benchmark queries and calculate actual Hit@1, Hit@3, and Recall@3."""
    retriever = indexed_novacorp_retriever

    # Benchmark queries with ground truth relevant document IDs
    benchmark_queries: List[Dict[str, Any]] = [
        {
            "query_id": "Q1",
            "query": "Sovereign knowledge retrieval and pgvector database search multi-tenant",
            "ground_truth_docs": {"service_catalogue", "technical_capabilities"},
        },
        {
            "query_id": "Q2",
            "query": "OAuth 2.0 with PKCE identity and JWT token specifications SAML",
            "ground_truth_docs": {"technical_capabilities"},
        },
        {
            "query_id": "Q3",
            "query": "Commercial pricing policy and fixed rate quotes assessment",
            "ground_truth_docs": {"business_policies_faq"},
        },
        {
            "query_id": "Q4",
            "query": "Project Beacon logistics bidding email turnaround case study Apex",
            "ground_truth_docs": {"case_study"},
        },
        {
            "query_id": "Q5",
            "query": "Cloud infrastructure container modernization Prometheus OpenTelemetry",
            "ground_truth_docs": {"service_catalogue", "technical_capabilities"},
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
            company_id="novacorp",
            top_k=3,
            relevance_threshold=0.0,  # Evaluate ranking across top 3
        )

        retrieved_doc_ids = [r.source_id for r in results]

        # Hit@1
        if retrieved_doc_ids and retrieved_doc_ids[0] in ground_truth:
            hit_at_1_count += 1

        # Hit@3
        hits_in_top_3 = set(retrieved_doc_ids[:3]).intersection(ground_truth)
        if len(hits_in_top_3) > 0:
            hit_at_3_count += 1

        # Recall@3: (hits in top 3) / (total ground truth documents)
        recall = len(hits_in_top_3) / len(ground_truth)
        recalls_at_3.append(recall)

    total_queries = len(benchmark_queries)
    hit_at_1 = hit_at_1_count / total_queries
    hit_at_3 = hit_at_3_count / total_queries
    mean_recall_at_3 = sum(recalls_at_3) / total_queries

    # Print actual measurement report
    print("\n--- RETRIEVAL EVALUATION BENCHMARK REPORT ---")
    print(f"Total Evaluated Queries: {total_queries}")
    print(f"Hit@1:  {hit_at_1:.2%} ({hit_at_1_count}/{total_queries})")
    print(f"Hit@3:  {hit_at_3:.2%} ({hit_at_3_count}/{total_queries})")
    print(f"Mean Recall@3: {mean_recall_at_3:.2%}")
    print("---------------------------------------------")

    # Assertions for reproducible quality
    assert hit_at_3 >= 0.80, f"Hit@3 was {hit_at_3:.2%}, expected at least 80%"
    assert mean_recall_at_3 >= 0.60, f"Mean Recall@3 was {mean_recall_at_3:.2%}, expected at least 60%"
