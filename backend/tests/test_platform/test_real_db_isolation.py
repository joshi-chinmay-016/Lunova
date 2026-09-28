import pytest
import os
from uuid import uuid4
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.company import Company
from app.models.document import KnowledgeDocument
from app.models.document_chunk import DocumentChunk

@pytest.mark.skip(reason="Environment-unverified: PostgreSQL not available locally")
@pytest.mark.asyncio
async def test_real_db_isolation(db_session: AsyncSession):
    """
    Real PostgreSQL integration test for tenant isolation.
    Creates chunks for Company A and Company B, performs retrieval for Company A,
    and asserts only Company A chunks are returned.
    """
    # 1. Setup companies
    company_a_id = uuid4()
    company_b_id = uuid4()
    
    db_session.add(Company(id=company_a_id, name="Company A", slug="a", is_active=True))
    db_session.add(Company(id=company_b_id, name="Company B", slug="b", is_active=True))
    await db_session.commit()
    
    # 2. Insert documents and chunks
    doc_a = KnowledgeDocument(id=uuid4(), company_id=company_a_id, name="Doc A", status="READY")
    doc_b = KnowledgeDocument(id=uuid4(), company_id=company_b_id, name="Doc B", status="READY")
    db_session.add_all([doc_a, doc_b])
    await db_session.commit()
    
    # Create fake embedding (1536 dim)
    fake_embedding = [0.1] * 1536
    
    chunk_a = DocumentChunk(
        document_id=doc_a.id,
        company_id=company_a_id,
        content="Company A Content",
        chunk_index=0,
        embedding=fake_embedding
    )
    chunk_b = DocumentChunk(
        document_id=doc_b.id,
        company_id=company_b_id,
        content="Company B Content",
        chunk_index=0,
        embedding=fake_embedding
    )
    db_session.add_all([chunk_a, chunk_b])
    await db_session.commit()
    
    # 3. Perform retrieval (Requires real Intelligence Service + Platform Retriever flow)
    from app.platform.services.retriever_service import PlatformRetriever
    from intelligence.providers.mock import MockEmbeddingProvider
    
    retriever = PlatformRetriever(embedding_provider=MockEmbeddingProvider())
    # PlatformRetriever uses sync_session_maker internally, so it relies on the real engine running
    results = retriever.retrieve("Content", str(company_a_id))
    
    # 4. Assert isolation
    assert len(results) == 1
    assert results[0].source_id == str(chunk_a.id)
    assert "Company A" in results[0].section
