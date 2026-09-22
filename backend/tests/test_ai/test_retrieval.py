import pytest
from unittest.mock import MagicMock, AsyncMock
from uuid import uuid4
from app.ai.contracts.retrieval import RetrievalInput
from app.ai.rag.retrieval import RetrievalService
from app.ai.providers.embeddings import FakeEmbeddingProvider
from app.models.document_chunk import DocumentChunk

@pytest.mark.asyncio
async def test_retrieval_service_basic():
    embedding_provider = FakeEmbeddingProvider()
    
    mock_db_session = AsyncMock()
    mock_result = MagicMock()
    
    chunk = DocumentChunk(
        id=uuid4(),
        company_id=uuid4(),
        document_id=uuid4(),
        content="Our SLA is 99.9%.",
        metadata_json={}
    )
    
    mock_result.scalars.return_value.all.return_value = [chunk]
    mock_db_session.execute.return_value = mock_result
    
    service = RetrievalService(db=mock_db_session, embedding_provider=embedding_provider)
    
    input_data = RetrievalInput(
        company_id=chunk.company_id,
        query="What is our SLA?",
        top_k=5
    )
    
    result = await service.retrieve(input_data)
    
    assert len(result.chunks) == 1
    assert result.chunks[0].chunk_id == chunk.id
    assert result.chunks[0].content == "Our SLA is 99.9%."
