"""Unit tests for ResponseGenerator and GroundingEvaluator."""

from intelligence.evaluation.evaluator import GroundingEvaluator
from intelligence.generation.generator import ResponseGenerator
from intelligence.models.evaluation import ConfidenceMetrics
from intelligence.models.extraction import ExtractedRequirement
from intelligence.models.generation import GeneratedDraft
from intelligence.models.proposal import ProposalContext
from intelligence.models.retrieval import RetrievedSource
from intelligence.providers.mock import MockLLMProvider


def test_response_generator_with_sources():
    """Verify response generator produces grounded draft citing retrieved sources."""
    provider = MockLLMProvider()
    generator = ResponseGenerator(llm_provider=provider)

    context = ProposalContext(
        proposal_id="prop-01",
        company_id="lunetron",
        subject="Cloud Migration Proposal",
        body="We need automated container orchestration.",
    )

    requirements = [
        ExtractedRequirement(
            requirement_id="req-01",
            text="Automated container orchestration on AWS.",
            category="technical_requirement",
            priority="high",
        )
    ]

    sources = [
        RetrievedSource(
            source_id="src-cloud-01",
            title="Lunetron Cloud Architecture",
            section="Kubernetes",
            content="Lunetron provides production Kubernetes clusters on AWS and GCP.",
            company_id="lunetron",
            relevance_score=0.92,
        )
    ]

    draft = generator.generate(proposal=context, requirements=requirements, sources=sources)

    assert isinstance(draft, GeneratedDraft)
    assert "Lunetron" in draft.executive_summary
    assert len(draft.requirement_responses) == 1
    assert "src-cloud-01" in draft.requirement_responses[0]["grounded_in"]
    assert "Cloud Migration" in draft.draft_email_body or "Proposal" in draft.draft_email_body


def test_response_generator_unsupported_budget_requirement():
    """Verify generator flags unsupported pricing/budget requirement for human review."""
    provider = MockLLMProvider()
    generator = ResponseGenerator(llm_provider=provider)

    context = ProposalContext(
        proposal_id="prop-02",
        company_id="lunetron",
        subject="Pricing Inquiry",
        body="What is your hourly rate?",
    )

    requirements = [
        ExtractedRequirement(
            requirement_id="req-budget-01",
            text="Hourly rate for AI engineering.",
            category="budget",
            priority="high",
        )
    ]

    sources = [
        RetrievedSource(
            source_id="src-tech-01",
            title="Technical Overview",
            content="Technical architecture and security capabilities.",
            company_id="lunetron",
        )
    ]

    draft = generator.generate(proposal=context, requirements=requirements, sources=sources)

    # Budget requirement should be marked as unsupported with clarification question
    assert len(draft.unsupported_claims) > 0
    assert any("Pricing" in u["reason"] or "pricing" in u["reason"] for u in draft.unsupported_claims)
    assert len(draft.clarification_questions) > 0


def test_evaluator_fully_grounded_draft():
    """Verify GroundingEvaluator awards high confidence to well-grounded draft."""
    evaluator = GroundingEvaluator()

    draft = GeneratedDraft(
        executive_summary="Executive summary text.",
        draft_email_body="Dear Client, Lunetron supports this feature. Best regards.",
        requirement_responses=[
            {
                "requirement_id": "req-01",
                "response": "Supported feature.",
                "grounded_in": ["src-01"],
                "is_supported": True,
            }
        ],
    )

    reqs = [ExtractedRequirement(requirement_id="req-01", text="Feature X")]
    sources = [RetrievedSource(source_id="src-01", title="Doc 1", content="Feature X is supported.")]

    metrics = evaluator.evaluate(draft=draft, requirements=reqs, sources=sources)

    assert isinstance(metrics, ConfidenceMetrics)
    assert metrics.grounding_score == 1.0
    assert metrics.coverage_score == 1.0
    assert metrics.overall_score >= 0.85
    assert metrics.requires_human_attention is False
    assert metrics.confidence_level == "HIGH"


def test_evaluator_detects_fabricated_price():
    """Anti-hallucination check: detect invented price in email body not in evidence."""
    evaluator = GroundingEvaluator()

    draft = GeneratedDraft(
        executive_summary="Summary",
        draft_email_body="We can deliver this project for $45,000 within 2 weeks.",
        requirement_responses=[],
    )

    sources = [RetrievedSource(source_id="src-01", title="Technical Doc", content="Technical specs only.")]

    metrics = evaluator.evaluate(draft=draft, requirements=[], sources=sources)

    assert metrics.unsupported_claim_count > 0
    assert metrics.requires_human_attention is True
    assert any(f["type"] == "FABRICATED_PRICE_DETECTED" for f in metrics.validation_findings)


def test_evaluator_empty_sources_flags_human_attention():
    """Verify empty sources list caps grounding score and requires human review."""
    evaluator = GroundingEvaluator()

    draft = GeneratedDraft(
        executive_summary="Summary without sources.",
        draft_email_body="Email body.",
        requirement_responses=[],
    )

    metrics = evaluator.evaluate(draft=draft, requirements=[], sources=[])

    assert metrics.requires_human_attention is True
    assert any(f["type"] == "EMPTY_KNOWLEDGE_BASE" for f in metrics.validation_findings)
