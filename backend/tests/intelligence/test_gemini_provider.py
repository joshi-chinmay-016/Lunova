"""Unit tests for GeminiProvider (Phase 2).

Verifies provider configuration, secret sanitization, error wrapping,
and structured generation with a mocked SDK client. Live API calls
are strictly opt-in and skipped by default.
"""

import os
from pathlib import Path
import sys
from unittest.mock import MagicMock
import pytest

backend_dir = Path(__file__).resolve().parents[2]
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from intelligence.exceptions import ProviderError
from intelligence.prompts.extraction_v1 import ProposalExtractionPayload
from intelligence.providers.gemini import GeminiProvider


def test_gemini_provider_properties():
    """Verify provider name and model name initialization."""
    provider = GeminiProvider(api_key="fake-test-key", model_name="gemini-2.5-pro")
    assert provider.provider_name == "gemini"
    assert provider.model_name == "gemini-2.5-pro"


def test_gemini_provider_missing_api_key_raises_provider_error():
    """Verify that calling Gemini without an API key raises ProviderError."""
    # Ensure environment does not supply key
    orig_key = os.environ.pop("GEMINI_API_KEY", None)
    try:
        provider = GeminiProvider(api_key="")
        with pytest.raises(ProviderError, match="Gemini API key is not configured"):
            provider.generate("Test prompt")
    finally:
        if orig_key is not None:
            os.environ["GEMINI_API_KEY"] = orig_key


def test_gemini_provider_sanitizes_api_key_in_errors():
    """Verify that API keys and common credential patterns are never leaked in error messages."""
    sensitive_key = "AIzaSyFakeSecretKeyForTesting12345"
    provider = GeminiProvider(api_key=sensitive_key)

    raw_error_message = f"Failed connecting to server with credentials {sensitive_key} and token AIzaSy999999999999999999999999999999999"
    sanitized = provider._sanitize_error(raw_error_message)

    assert sensitive_key not in sanitized
    assert "AIzaSy" not in sanitized
    assert "[REDACTED_API_KEY]" in sanitized


def test_gemini_provider_generate_with_mock_client():
    """Verify text generation using a mocked google-genai client."""
    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_response.text = "Grounded synthesized draft proposal text."
    mock_client.models.generate_content.return_value = mock_response

    provider = GeminiProvider(api_key="fake-key", client=mock_client)
    result = provider.generate("Test prompt", system_prompt="System instructions")

    assert result == "Grounded synthesized draft proposal text."
    mock_client.models.generate_content.assert_called_once()


def test_gemini_provider_generate_structured_with_mock_client():
    """Verify schema-constrained structured output generation using a mocked client."""
    mock_client = MagicMock()
    mock_response = MagicMock()

    # Simulate SDK returning structured JSON string in response.text
    mock_response.parsed = None
    mock_response.text = """
    {
        "summary": "Mock structured proposal output",
        "requirements": [
            {
                "text": "The platform must provide normalized REST APIs with OAuth2 authentication.",
                "category": "technical_requirement",
                "priority": "high",
                "explicit": true,
                "evidence": "Must provide normalized REST APIs with OAuth2 authentication.",
                "confidence": 0.98
            }
        ],
        "missing_information": [],
        "ambiguities": []
    }
    """
    mock_client.models.generate_content.return_value = mock_response

    provider = GeminiProvider(api_key="fake-key", client=mock_client)
    output = provider.generate_structured(
        prompt="Analyze proposal",
        response_schema=ProposalExtractionPayload,
        system_prompt="System instruction",
    )

    assert isinstance(output, ProposalExtractionPayload)
    assert output.summary == "Mock structured proposal output"
    assert len(output.requirements) == 1
    assert output.requirements[0].category == "technical_requirement"


def test_gemini_provider_empty_response_raises_provider_error():
    """Verify that empty responses from Gemini raise ProviderError."""
    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_response.text = ""
    mock_response.parsed = None
    mock_client.models.generate_content.return_value = mock_response

    provider = GeminiProvider(api_key="fake-key", client=mock_client)
    with pytest.raises(ProviderError, match="empty structured response"):
        provider.generate_structured(
            prompt="Analyze proposal",
            response_schema=ProposalExtractionPayload,
        )


@pytest.mark.skipif(
    os.getenv("RUN_LIVE_LLM_TESTS") != "1",
    reason="Live Gemini API tests are opt-in and disabled by default.",
)
def test_live_gemini_api_call():  # pragma: no cover
    """Opt-in live test verifying real Gemini API structured extraction if key is present."""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        pytest.skip("GEMINI_API_KEY environment variable not set.")

    provider = GeminiProvider(api_key=api_key)
    output = provider.generate_structured(
        prompt="Extract requirements: We require a secure web portal for 50 users delivered in 8 weeks.",
        response_schema=ProposalExtractionPayload,
    )

    assert isinstance(output, ProposalExtractionPayload)
    assert len(output.requirements) > 0
