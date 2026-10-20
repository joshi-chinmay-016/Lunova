import pytest
from unittest.mock import MagicMock
from intelligence.providers.gemini_embedding import GeminiEmbeddingProvider

def test_gemini_embedding_provider_configuration(monkeypatch):
    """Test that the Gemini embedding provider requests exactly 1536 dimensions and uses the correct task types."""
    
    # Create a mock client
    mock_client = MagicMock()
    mock_response = MagicMock()
    
    # Mock the embedding object returned by the API
    mock_embedding_obj = MagicMock()
    # The SDK usually returns a list of 1536 floats for .values
    mock_embedding_obj.values = [0.1] * 1536
    mock_response.embeddings = [mock_embedding_obj]
    
    mock_client.models.embed_content.return_value = mock_response
    
    # Initialize the provider with a dummy API key and the mock client
    provider = GeminiEmbeddingProvider(api_key="dummy_key", client=mock_client)
    
    # Assert dimension property is explicitly 1536
    assert provider.dimension == 1536
    
    # Test document embedding (embed_texts)
    texts = ["Test document content"]
    result_docs = provider.embed_texts(texts)
    
    # Assert result length
    assert len(result_docs) == 1
    assert len(result_docs[0]) == 1536
    
    # Assert the API was called correctly for documents
    call_args = mock_client.models.embed_content.call_args
    assert call_args is not None
    kwargs = call_args[1]
    
    assert kwargs["model"] == "gemini-embedding-001"
    assert kwargs["contents"] == texts
    config = kwargs["config"]
    assert config.task_type == "RETRIEVAL_DOCUMENT"
    assert config.output_dimensionality == 1536
    
    # Test query embedding (embed_query)
    query_text = "Test query"
    result_query = provider.embed_query(query_text)
    
    # Assert result length
    assert len(result_query) == 1536
    
    # Assert the API was called correctly for queries
    call_args_query = mock_client.models.embed_content.call_args
    assert call_args_query is not None
    kwargs_query = call_args_query[1]
    
    assert kwargs_query["model"] == "gemini-embedding-001"
    assert kwargs_query["contents"] == query_text
    config_query = kwargs_query["config"]
    assert config_query.task_type == "RETRIEVAL_QUERY"
    assert config_query.output_dimensionality == 1536
