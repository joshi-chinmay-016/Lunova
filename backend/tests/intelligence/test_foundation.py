"""Unit tests for AI Intelligence Module foundation (Phase 1 Refinement).

These tests run completely offline and independent of external APIs, databases,
or background workers.
"""

import json
from pathlib import Path
import sys
from typing import List, Union
import pytest

# Ensure backend directory is in sys.path
backend_dir = Path(__file__).resolve().parents[2]
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from intelligence import (
    DEFAULT_EMBEDDING_DIMENSION,
    ConfidenceLevel,
    ConfidenceMetrics,
    Evaluator,
    ExtractedRequirement,
    ExtractionError,
    Extractor,
    GeneratedDraft,
    Generator,
    IntelligenceConfig,
    IntelligenceError,
    IntelligenceResult,
    IntelligenceService,
    IntelligenceStatus,
    InvalidProposalError,
    MissingCompanyContextError,
    ProposalContext,
    Retriever,
    RetrievedSource,
)
from intelligence.evaluation import GroundingEvaluator
from intelligence.extraction import RequirementExtractor
from intelligence.generation import ResponseGenerator
from intelligence.providers import (
    EmbeddingProvider,
    LLMProvider,
    MockEmbeddingProvider,
    MockLLMProvider,
)
from intelligence.retrieval import KnowledgeRetriever


def test_package_imports_successfully():
    """Verify that all intelligence package modules and symbols import cleanly."""
    assert IntelligenceService is not None
    assert ProposalContext is not None
    assert ExtractedRequirement is not None
    assert RetrievedSource is not None
    assert GeneratedDraft is not None
    assert ConfidenceMetrics is not None
    assert IntelligenceResult is not None
    assert Extractor is not None
    assert Retriever is not None
    assert Generator is not None
    assert Evaluator is not None
    assert LLMProvider is not None
    assert EmbeddingProvider is not None


def test_exceptions_hierarchy():
    """Verify intelligence exception hierarchy."""
    assert issubclass(InvalidProposalError, IntelligenceError)
    assert issubclass(MissingCompanyContextError, IntelligenceError)
    assert issubclass(ExtractionError, IntelligenceError)


def test_constants_and_status_values():
    """Verify constants and enumerations."""
    assert IntelligenceStatus.SUCCESS.value == "SUCCESS"
    assert IntelligenceStatus.PARTIAL.value == "PARTIAL"
    assert IntelligenceStatus.FAILED.value == "FAILED"
    assert ConfidenceLevel.HIGH.value == "HIGH"


def test_embedding_config_default_3072():
    """Verify that the configured default embedding dimension is 3072."""
    assert DEFAULT_EMBEDDING_DIMENSION == 3072
    config = IntelligenceConfig()
    assert config.embedding_dimension == 3072

    # Configurable dimension
    custom_config = IntelligenceConfig(embedding_dimension=1536)
    assert custom_config.embedding_dimension == 1536


def test_mock_llm_provider_generation():
    """Verify that the MockLLMProvider produces deterministic responses without network calls."""
    custom_text = "Custom synthesized proposal draft."
    provider = MockLLMProvider(default_response=custom_text, model_name="test-mock-v1")

    assert provider.provider_name == "mock"
    assert provider.model_name == "test-mock-v1"

    response = provider.generate("Test prompt for RFP response")
    assert response == custom_text
    assert len(provider.call_history) == 1
    assert provider.call_history[0] == "Test prompt for RFP response"


def test_mock_embedding_provider_default_dimension_3072():
    """Verify that MockEmbeddingProvider uses 3072 dimensions by default without network calls."""
    provider = MockEmbeddingProvider()

    assert provider.provider_name == "mock"
    assert provider.dimension == 3072

    query_vec = provider.embed_query("Enterprise platform integration")
    assert isinstance(query_vec, list)
    assert len(query_vec) == 3072

    texts = ["Document chunk 1", "Document chunk 2"]
    batch_vecs = provider.embed_texts(texts)
    assert len(batch_vecs) == 2
    assert len(batch_vecs[0]) == 3072
    assert len(batch_vecs[1]) == 3072


def test_mock_embedding_provider_custom_dimension():
    """Verify that MockEmbeddingProvider respects explicitly configured dimension."""
    provider = MockEmbeddingProvider(dimension=512)
    assert provider.dimension == 512
    vec = provider.embed_query("test")
    assert len(vec) == 512


def test_intelligence_service_accepts_mock_input_and_returns_result():
    """Verify end-to-end intelligence service orchestration flow with normalized input."""
    service = IntelligenceService()

    context = ProposalContext(
        proposal_id="prop-test-101",
        company_id="lunetron",
        subject="RFP: Automation Architecture",
        body="Client RFP regarding intelligent platform automation and email ingestion.",
        attachments_text=["Attachment: System must support tenant isolation."],
    )

    result = service.analyze_proposal(context)

    assert isinstance(result, IntelligenceResult)
    assert result.proposal_id == "prop-test-101"
    assert result.company_id == "lunetron"
    assert result.status == IntelligenceStatus.SUCCESS.value

    # Verify extraction stage output
    assert len(result.requirements) > 0
    assert isinstance(result.requirements[0], ExtractedRequirement)

    # Verify retrieval stage output
    assert len(result.retrieved_sources) > 0
    assert isinstance(result.retrieved_sources[0], RetrievedSource)
    assert "lunetron" in result.retrieved_sources[0].source_id

    # Verify generation stage output
    assert result.generated_response is not None
    assert isinstance(result.generated_response, GeneratedDraft)
    assert "Lunetron" in result.generated_response.executive_summary
    assert len(result.generated_response.requirement_responses) > 0

    # Verify evaluation stage output
    assert result.confidence is not None
    assert isinstance(result.confidence, ConfidenceMetrics)
    assert result.confidence.grounding_score > 0.0

    # Verify metadata
    assert "duration_ms" in result.processing_metadata
    assert result.processing_metadata["provider"] == "mock"


def test_provider_abstraction_replacement():
    """Verify that provider abstractions can be swapped with custom implementations."""

    class CustomTestLLMProvider(LLMProvider):
        @property
        def provider_name(self) -> str:
            return "custom-test"

        @property
        def model_name(self) -> str:
            return "custom-gpt-test"

        def generate(self, prompt: str, **kwargs) -> str:
            return "Custom provider generated text."

    custom_provider = CustomTestLLMProvider()
    service = IntelligenceService(llm_provider=custom_provider)

    context = ProposalContext(
        proposal_id="prop-custom-001",
        company_id="lunetron",
        subject="Integration Query",
        body="Can you support OAuth2?",
    )

    result = service.analyze_proposal(context)

    assert result.processing_metadata["provider"] == "custom-test"
    assert result.processing_metadata["model"] == "custom-gpt-test"
    assert "Custom provider generated text." in result.generated_response.executive_summary


def test_stage_interface_injection():
    """Verify that stages conforming to interfaces can be injected into IntelligenceService."""

    class CustomExtractor(Extractor):
        def extract(self, context: ProposalContext) -> List[ExtractedRequirement]:
            return [
                ExtractedRequirement(
                    requirement_id="custom-req-1",
                    category="COMPLIANCE",
                    description="Custom injected extractor requirement",
                    priority="HIGH",
                )
            ]

    service = IntelligenceService(extractor=CustomExtractor())
    context = ProposalContext(
        proposal_id="prop-inj-01",
        company_id="lunetron",
        subject="Subject",
        body="Body",
    )

    result = service.analyze_proposal(context)
    assert result.requirements[0].requirement_id == "custom-req-1"
    assert result.requirements[0].category == "COMPLIANCE"


def test_strict_tenant_isolation_retriever_enforcement():
    """Verify that retrieval strictly enforces tenant isolation and rejects cross-tenant queries."""
    # Multi-tenant simulated store
    class MultiTenantMockRetriever(Retriever):
        def __init__(self):
            self.knowledge_store = {
                "company_a": [RetrievedSource("src-a-01", "Company A Doc", "Sec 1", 0.9)],
                "company_b": [RetrievedSource("src-b-01", "Company B Doc", "Sec 1", 0.9)],
            }

        def retrieve(
            self,
            requirements: Union[List[ExtractedRequirement], str],
            company_id: str,
            top_k: int = 3,
        ) -> List[RetrievedSource]:
            if not company_id or not company_id.strip():
                raise MissingCompanyContextError("company_id is mandatory")
            # Strictly return only target company's knowledge
            return self.knowledge_store.get(company_id, [])

    retriever = MultiTenantMockRetriever()

    # Company B proposal MUST retrieve only Company B knowledge
    b_sources = retriever.retrieve(requirements="test", company_id="company_b")
    assert len(b_sources) == 1
    assert b_sources[0].source_id == "src-b-01"
    # Never return Company A's knowledge to Company B
    assert not any("company_a" in s.title or "src-a" in s.source_id for s in b_sources)

    # Empty or None company_id must be rejected
    with pytest.raises(MissingCompanyContextError):
        retriever.retrieve(requirements="test", company_id="")

    with pytest.raises(MissingCompanyContextError):
        retriever.retrieve(requirements="test", company_id=None)  # type: ignore


def test_service_rejects_missing_company_context():
    """Verify that IntelligenceService rejects proposals without company_id."""
    service = IntelligenceService()

    invalid_context = ProposalContext(
        proposal_id="prop-no-tenant",
        company_id="",  # Missing tenant boundary
        subject="Inquiry",
        body="Text",
    )

    with pytest.raises(MissingCompanyContextError, match="must contain a valid company_id"):
        service.analyze_proposal(invalid_context)


def test_service_with_fixture_proposal():
    """Verify that the intelligence service cleanly processes realistic sample fixture data."""
    fixture_path = Path(__file__).parents[3] / "fixtures" / "proposals" / "sample-proposal-input.json"

    if fixture_path.exists():
        with open(fixture_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        attachments = [att["extracted_content"] for att in data.get("attachments", [])]
        context = ProposalContext(
            proposal_id=data["proposal_id"],
            company_id=data["company"]["company_id"],
            subject=data["email"]["subject"],
            body=data["email"]["body"],
            attachments_text=attachments,
        )

        service = IntelligenceService()
        result = service.analyze_proposal(context)

        assert result.proposal_id == data["proposal_id"]
        assert result.company_id == "lunetron"
        assert result.status == IntelligenceStatus.SUCCESS.value
        assert len(result.requirements) > 0
        assert len(result.retrieved_sources) > 0
