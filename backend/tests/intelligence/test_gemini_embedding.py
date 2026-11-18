from unittest.mock import MagicMock
import pytest

from intelligence.exceptions import ProviderError
from intelligence.providers.gemini_embedding import GeminiEmbeddingProvider


def test_gemini_embedding_provider_properties():
    """Verify provider name, configured model name, and explicit dimension properties."""
    mock_client = MagicMock()
    provider = GeminiEmbeddingProvider(
        api_key="dummy_key",
        model_name="text-embedding-004",
        dimension=768,
        client=mock_client,
    )

    assert provider.provider_name == "gemini"
    assert provider.model_name == "text-embedding-004"
    assert provider.dimension == 768


def test_gemini_embedding_document_embedding():
    """Verify document embedding output and that the SDK is called with 768 dimensions and text-embedding-004."""
    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_embedding_obj = MagicMock()
    mock_embedding_obj.values = [0.1] * 768
    mock_response.embeddings = [mock_embedding_obj]
    mock_client.models.embed_content.return_value = mock_response

    provider = GeminiEmbeddingProvider(
        api_key="dummy_key",
        model_name="text-embedding-004",
        dimension=768,
        client=mock_client,
    )

    texts = ["Test document content"]
    result_docs = provider.embed_texts(texts)

    assert len(result_docs) == 1
    assert len(result_docs[0]) == 768

    # Assert SDK call arguments match actual implementation
    call_args = mock_client.models.embed_content.call_args
    assert call_args is not None
    kwargs = call_args[1]

    assert kwargs["model"] == "text-embedding-004"
    assert kwargs["contents"] == texts
    config = kwargs["config"]
    assert config.output_dimensionality == 768


def test_gemini_embedding_query_embedding():
    """Verify query embedding output and how the provider forwards single query text to SDK."""
    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_embedding_obj = MagicMock()
    mock_embedding_obj.values = [0.1] * 768
    mock_response.embeddings = [mock_embedding_obj]
    mock_client.models.embed_content.return_value = mock_response

    provider = GeminiEmbeddingProvider(
        api_key="dummy_key",
        model_name="text-embedding-004",
        dimension=768,
        client=mock_client,
    )

    query_text = "Test query"
    result_query = provider.embed_query(query_text)

    assert len(result_query) == 768

    # Assert SDK call receives query wrapped in list and requests 768 dimensions
    call_args = mock_client.models.embed_content.call_args
    assert call_args is not None
    kwargs = call_args[1]

    assert kwargs["model"] == "text-embedding-004"
    assert kwargs["contents"] == [query_text]
    config = kwargs["config"]
    assert config.output_dimensionality == 768


def test_gemini_embedding_dimension_mismatch_raises_error():
    """Verify ProviderError is raised when the upstream API returns an unexpected vector length."""
    mock_client = MagicMock()
    mock_response = MagicMock()
    mock_embedding_obj = MagicMock()
    # Return 512 dimensions instead of the configured 768
    mock_embedding_obj.values = [0.1] * 512
    mock_response.embeddings = [mock_embedding_obj]
    mock_client.models.embed_content.return_value = mock_response

    provider = GeminiEmbeddingProvider(
        api_key="dummy_key",
        dimension=768,
        client=mock_client,
    )

    with pytest.raises(ProviderError, match="expected 768"):
        provider.embed_texts(["Some text to embed"])
