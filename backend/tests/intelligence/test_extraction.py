"""Unit tests for Proposal Understanding & Requirement Extraction (Phase 2).

All tests execute completely offline without making external API calls.
"""

import json
from pathlib import Path
import sys
from typing import Any, Dict, List
import pytest

backend_dir = Path(__file__).resolve().parents[2]
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from intelligence import (
    Ambiguity,
    ExtractedRequirement,
    ExtractionError,
    ExtractionResult,
    IntelligenceError,
    IntelligenceResult,
    IntelligenceService,
    IntelligenceStatus,
    InvalidProposalError,
    MissingInformation,
    ProposalContext,
    ProviderError,
    RequirementCategory,
)
from intelligence.extraction import RequirementExtractor
from intelligence.prompts.extraction_v1 import (
    AmbiguityItem,
    ExtractedRequirementItem,
    MissingInformationItem,
    ProposalExtractionPayload,
)
from intelligence.providers.mock import MockLLMProvider

FIXTURES_DIR = Path(__file__).resolve().parents[3] / "fixtures" / "proposals"


def load_fixture_context(filename: str) -> ProposalContext:
    """Load a synthetic proposal fixture and return a normalized ProposalContext."""
    filepath = FIXTURES_DIR / filename
    with open(filepath, "r", encoding="utf-8") as f:
        data = json.load(f)

    attachments = [att.get("extracted_content", "") for att in data.get("attachments", [])]
    return ProposalContext(
        proposal_id=data["proposal_id"],
        company_id=data["company"]["company_id"],
        subject=data["email"]["subject"],
        body=data["email"]["body"],
        attachments_text=attachments,
    )


def test_extraction_with_valid_mock_payload():
    """Verify that RequirementExtractor maps ProposalExtractionPayload into ExtractionResult."""
    mock_payload = ProposalExtractionPayload(
        summary="Internal operations web application for 100 users.",
        requirements=[
            ExtractedRequirementItem(
                text="Web application for 100 internal users",
                category="functional_requirement",
                priority="high",
                explicit=True,
                evidence="We are looking for a web application for 100 internal users.",
                confidence=0.98,
            ),
            ExtractedRequirementItem(
                text="Delivery within 12 weeks",
                category="timeline",
                priority="medium",
                explicit=True,
                evidence="We expect delivery within 12 weeks.",
                confidence=0.95,
            ),
        ],
        missing_information=[
            MissingInformationItem(
                field="budget",
                reason="No project budget was specified.",
                importance="high",
            )
        ],
        ambiguities=[
            AmbiguityItem(
                text="Automated reporting",
                reason="Frequency and output format of reports is not specified.",
            )
        ],
    )

    mock_llm = MockLLMProvider(default_structured_response=mock_payload)
    extractor = RequirementExtractor(llm_provider=mock_llm)

    context = load_fixture_context("simple_rfp.json")
    result = extractor.extract(context)

    assert isinstance(result, ExtractionResult)
    assert result.proposal_id == "prop-simple-001"
    assert len(result.requirements) == 2
    assert result.requirements[0].requirement_id == "req-01"
    assert result.requirements[0].text == "Web application for 100 internal users"
    assert result.requirements[0].category == "functional_requirement"
    assert result.requirements[0].priority == "high"
    assert result.requirements[0].explicit is True
    assert result.requirements[0].evidence == "We are looking for a web application for 100 internal users."
    assert result.requirements[0].confidence == 0.98
    # Test backwards-compatible description alias
    assert result.requirements[0].description == "Web application for 100 internal users"

    # Missing information validation
    assert len(result.missing_information) == 1
    assert result.missing_information[0].field == "budget"
    assert result.missing_information[0].importance == "high"

    # Ambiguities validation
    assert len(result.ambiguities) == 1
    assert "Automated reporting" in result.ambiguities[0].text

    # Metadata
    assert result.metadata["requirement_count"] == 2
    assert result.metadata["missing_info_count"] == 1
    assert result.metadata["ambiguity_count"] == 1


def test_extraction_category_normalization():
    """Verify that unusual or unknown categories fall back to 'other'."""
    mock_payload = ProposalExtractionPayload(
        requirements=[
            ExtractedRequirementItem(
                text="Unusual requirement",
                category="NON_STANDARD_CATEGORY_NAME",
                priority="LOW",
                explicit=False,
                evidence="Some context",
                confidence=0.7,
            )
        ]
    )

    mock_llm = MockLLMProvider(default_structured_response=mock_payload)
    extractor = RequirementExtractor(llm_provider=mock_llm)

    context = ProposalContext(
        proposal_id="prop-norm-01",
        company_id="lunetron",
        subject="Test Norm",
        body="Unusual requirement.",
    )

    result = extractor.extract(context)
    assert result.requirements[0].category == RequirementCategory.OTHER.value
    assert result.requirements[0].priority == "low"
    assert result.requirements[0].explicit is False


def test_extraction_rejects_empty_proposal_context():
    """Verify that missing proposal context or proposal_id raises InvalidProposalError."""
    extractor = RequirementExtractor(llm_provider=MockLLMProvider())

    with pytest.raises(InvalidProposalError):
        extractor.extract(None)  # type: ignore

    with pytest.raises(InvalidProposalError):
        extractor.extract(
            ProposalContext(
                proposal_id="",
                company_id="lunetron",
                subject="Test",
                body="Body",
            )
        )


def test_extraction_rejects_oversized_proposal():
    """Verify that proposals exceeding max_proposal_input_chars raise InvalidProposalError."""
    mock_llm = MockLLMProvider()
    extractor = RequirementExtractor(llm_provider=mock_llm)

    huge_body = "A" * 60000
    context = ProposalContext(
        proposal_id="prop-huge-001",
        company_id="lunetron",
        subject="Huge Proposal",
        body=huge_body,
    )

    with pytest.raises(InvalidProposalError, match="exceeds the maximum allowed limit"):
        extractor.extract(context)


def test_extraction_handles_provider_error():
    """Verify that LLMProvider errors propagate cleanly as ProviderError."""
    failing_llm = MockLLMProvider(simulate_error=ProviderError("Simulated LLM rate limit or timeout."))
    extractor = RequirementExtractor(llm_provider=failing_llm)

    context = load_fixture_context("simple_rfp.json")
    with pytest.raises(ProviderError, match="Simulated LLM rate limit"):
        extractor.extract(context)


def test_extraction_handles_malformed_llm_output():
    """Verify that unparseable non-dict/non-schema outputs raise ExtractionError."""
    mock_llm = MockLLMProvider(default_structured_response="NON_STRUCTURED_STRING")
    extractor = RequirementExtractor(llm_provider=mock_llm)

    context = load_fixture_context("simple_rfp.json")
    with pytest.raises(ExtractionError, match="Malformed structured extraction output"):
        extractor.extract(context)


def test_extraction_with_unicode_and_special_characters():
    """Verify that Unicode symbols, accents, and special characters are handled cleanly."""
    mock_payload = ProposalExtractionPayload(
        requirements=[
            ExtractedRequirementItem(
                text="Multi-lingual portal in Français, Español & 日本語 with € / ¥ pricing",
                category="functional_requirement",
                priority="high",
                explicit=True,
                evidence="Support for Français & 日本語",
                confidence=0.99,
            )
        ]
    )

    extractor = RequirementExtractor(llm_provider=MockLLMProvider(default_structured_response=mock_payload))
    context = ProposalContext(
        proposal_id="prop-unicode-01",
        company_id="lunetron",
        subject="RFP: Multi-lingual platform (€ / ¥ / £)",
        body="Client demands support for Français, Español, and 日本語 with emoji 🚀.",
    )

    result = extractor.extract(context)
    assert len(result.requirements) == 1
    assert "日本語" in result.requirements[0].text
    assert "€" in result.requirements[0].text


def test_all_five_fixtures_pass_through_extractor():
    """Verify that all 5 required fixture files load and process through the extractor cleanly."""
    fixtures = [
        "simple_rfp.json",
        "technical_rfp.json",
        "ambiguous_rfp.json",
        "incomplete_rfp.json",
        "multi_requirement_rfp.json",
    ]

    extractor = RequirementExtractor(llm_provider=MockLLMProvider())

    for fixture_name in fixtures:
        context = load_fixture_context(fixture_name)
        result = extractor.extract(context)

        assert isinstance(result, ExtractionResult)
        assert result.proposal_id == context.proposal_id
        assert len(result.requirements) > 0
        assert len(result.missing_information) > 0
        assert len(result.ambiguities) > 0


def test_intelligence_service_end_to_end_with_real_extractor():
    """Verify that IntelligenceService seamlessly incorporates ExtractionResult."""
    mock_payload = ProposalExtractionPayload(
        summary="Comprehensive healthcare system tender.",
        requirements=[
            ExtractedRequirementItem(
                text="Self-service appointment booking with SMS/email reminders",
                category="functional_requirement",
                priority="high",
                explicit=True,
                evidence="REQ-01: self-service patient appointment booking",
                confidence=0.97,
            ),
            ExtractedRequirementItem(
                text="Mandatory integration with HL7 FHIR APIs and Epic EHR",
                category="integration",
                priority="high",
                explicit=True,
                evidence="REQ-05: Mandatory integration with HL7 FHIR APIs",
                confidence=0.99,
            ),
        ],
        missing_information=[
            MissingInformationItem(
                field="cloud_hosting_provider",
                reason="Client requires cloud deployment but did not specify AWS, Azure, or GCP preference.",
                importance="medium",
            )
        ],
        ambiguities=[],
    )

    extractor = RequirementExtractor(llm_provider=MockLLMProvider(default_structured_response=mock_payload))
    service = IntelligenceService(extractor=extractor)

    context = load_fixture_context("multi_requirement_rfp.json")
    result = service.analyze_proposal(context)

    assert isinstance(result, IntelligenceResult)
    assert result.status == IntelligenceStatus.SUCCESS.value
    assert len(result.requirements) == 2
    assert result.requirements[0].text == "Self-service appointment booking with SMS/email reminders"
    assert result.requirements[1].category == "integration"

    # Verify missing information populated in IntelligenceResult
    assert len(result.missing_information) == 1
    assert result.missing_information[0]["field"] == "cloud_hosting_provider"

    # Verify downstream stages (retrieval, generation, evaluation) executed normally
    assert len(result.retrieved_sources) > 0
    assert result.generated_response is not None
    assert result.confidence is not None
