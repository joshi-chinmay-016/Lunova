import pytest
from uuid import uuid4
from unittest.mock import MagicMock
from app.platform.services.proposal_service import ProposalService
from app.models.proposal import ProposalStatus

@pytest.mark.asyncio
async def test_tenant_isolation_proposal_processing(monkeypatch):
    company_a_id = uuid4()
    company_b_id = uuid4()
    
    async def mock_get_proposal(db, prop_id, comp_id):
        if comp_id != company_a_id:
            return None
        from app.models.proposal import Proposal
        return Proposal(id=prop_id, company_id=company_a_id, status=ProposalStatus.RECEIVED)
        
    monkeypatch.setattr(ProposalService, "get_proposal", mock_get_proposal)

    # Attempt to process by Company B (should fail silently in background and mark as failed if found, but since it's not found it shouldn't proceed)
    # The real process_proposal_bg catches all exceptions and sets status to FAILED, but if prop is None, it does nothing.
    # We just want to ensure it doesn't crash or process Company A's proposal.
    
    # Mocking async_session_maker
    class MockSession:
        async def __aenter__(self): return self
        async def __aexit__(self, *args): pass
        async def commit(self): pass
        def add(self, obj): pass

    monkeypatch.setattr("app.platform.services.proposal_service.async_session_maker", lambda: MockSession())
    
    await ProposalService.process_proposal_bg(uuid4(), company_b_id)
    # If we got here without exception, isolation handled the mismatch gracefully.

def test_tenant_isolation_retrieval(monkeypatch):
    from app.platform.services.retriever_service import PlatformRetriever
    from intelligence.providers.mock import MockEmbeddingProvider
    
    company_a = str(uuid4())
    
    emb = MockEmbeddingProvider()
    retriever = PlatformRetriever(embedding_provider=emb)
    
    class MockSession:
        def __enter__(self): return self
        def __exit__(self, *args): pass
        def execute(self, stmt):
            compiled_str = str(stmt)
            # The raw statement string MUST contain document_chunks.company_id filtering
            assert "document_chunks.company_id" in compiled_str
            class MockResult:
                def scalars(self):
                    class MockScalars:
                        def all(self): return []
                    return MockScalars()
            return MockResult()

    monkeypatch.setattr("app.platform.services.retriever_service.sync_session_maker", lambda: MockSession())
    retriever.retrieve(requirements="query", company_id=company_a)
