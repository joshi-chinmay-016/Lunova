"""Unit tests for GeminiEmbeddingProvider and MockEmbeddingProvider."""

import os
from unittest.mock import MagicMock
import pytest

from intelligence.exceptions import ProviderError
from intelligence.providers.gemini_embedding import GeminiEmbeddingProvider
from intelligence.providers.mock import MockEmbeddingProvider


def test_gemini_embedding_provider_properties():
    """Verify Gemini embedding provider initialization with 768 dimensions."""
    provider = GeminiEmbeddingProvider(
        api_key="fake-test-key",
        model_name="text-embedding-004",
        dimension=768,
    )
    assert provider.provider_name == "gemini"
    assert provider.model_name == "text-embedding-004"
    assert provider.dimension == 768


def test_gemini_embedding_provider_missing_key_raises():
    """Verify that calling embeddings without API key raises ProviderError."""
    orig_key = os.environ.pop("GEMINI_API_KEY", None)
    try:
        provider = GeminiEmbeddingProvider(api_key="")
        with pytest.raises(ProviderError, match="Gemini API key is not configured"):
            provider.embed_query("test query")
    finally:
        if orig_key is not None:
            os.environ["GEMINI_API_KEY"] = orig_key


def test_gemini_embedding_provider_sanitizes_errors():
    """Verify that credentials are redacted in embedding error messages."""
    sensitive_key = "AIzaSyFakeSecretKeyForEmbedding123"
    provider = GeminiEmbeddingProvider(api_key=sensitive_key)
    sanitized = provider._sanitize_error(f"Failed with key {sensitive_key}")
    assert sensitive_key not in sanitized
    assert "[REDACTED_API_KEY]" in sanitized


def test_gemini_embedding_provider_embed_query_with_mock_client():
    """Verify embed_query using a mocked google-genai client."""
    mock_client = MagicMock()
    mock_resp = MagicMock()
    mock_emb = MagicMock()
    mock_emb.values = [0.1] * 768
    mock_resp.embeddings = [mock_emb]
    mock_client.models.embed_content.return_value = mock_resp

    provider = GeminiEmbeddingProvider(api_key="fake-key", client=mock_client, dimension=768)
    vector = provider.embed_query("OAuth2 architecture")

    assert len(vector) == 768
    assert vector[0] == 0.1
    mock_client.models.embed_content.assert_called_once()


def test_gemini_embedding_provider_dimension_mismatch_raises():
    """Verify that mismatched vector dimension from provider raises ProviderError."""
    mock_client = MagicMock()
    mock_resp = MagicMock()
    mock_emb = MagicMock()
    mock_emb.values = [0.1] * 1536  # Returned 1536 instead of expected 768
    mock_resp.embeddings = [mock_emb]
    mock_client.models.embed_content.return_value = mock_resp

    provider = GeminiEmbeddingProvider(api_key="fake-key", client=mock_client, dimension=768)
    with pytest.raises(ProviderError, match="expected 768"):
        provider.embed_query("OAuth2 architecture")


def test_gemini_embedding_provider_empty_query():
    """Verify empty query returns zero vector without external call."""
    mock_client = MagicMock()
    provider = GeminiEmbeddingProvider(api_key="fake-key", client=mock_client, dimension=768)
    vec = provider.embed_query("")
    assert len(vec) == 768
    assert all(v == 0.0 for v in vec)
    mock_client.models.embed_content.assert_not_called()
