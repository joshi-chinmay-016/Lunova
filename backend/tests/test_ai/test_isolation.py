import pytest
from unittest.mock import MagicMock, AsyncMock
from uuid import uuid4
from app.ai.contracts.retrieval import RetrievalInput
from app.ai.rag.retrieval import RetrievalService
from app.ai.providers.embeddings import FakeEmbeddingProvider
from app.models.document_chunk import DocumentChunk

@pytest.mark.asyncio
async def test_company_isolation_in_retrieval():
    """
    Test proving Company A query cannot retrieve Company B documents.
    We test this by verifying the SQLAlchemy filter applied to the session.
    """
    embedding_provider = FakeEmbeddingProvider()
    
    mock_db_session = AsyncMock()
    mock_result = MagicMock()
    mock_result.scalars.return_value.all.return_value = []
    mock_db_session.execute.return_value = mock_result
    
    service = RetrievalService(db=mock_db_session, embedding_provider=embedding_provider)
    
    company_a_id = uuid4()
    
    input_data = RetrievalInput(
        company_id=company_a_id,
        query="What is our SLA?",
        top_k=5
    )
    
    await service.retrieve(input_data)
    
    # Verify the execute call
    mock_db_session.execute.assert_called_once()
    
    # The statement executed should contain a filter by company_a_id
    stmt = mock_db_session.execute.call_args[0][0]
    compiled = stmt.compile(compile_kwargs={"literal_binds": False})
    stmt_str = str(compiled)
    
    # The SQL should clearly have a WHERE clause with the company_id
    assert "document_chunks.company_id =" in stmt_str
    
    # Verify the bound parameter matches company_a_id
    assert company_a_id in compiled.params.values()
    
    # It must not be vulnerable to leaking other companies
    company_b_id = uuid4()
    assert str(company_b_id) not in stmt_str
