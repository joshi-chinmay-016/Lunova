import pytest
import pytest_asyncio
from uuid import uuid4
from unittest.mock import AsyncMock
from app.models.proposal import Proposal, ProposalStatus
from app.platform.schemas.proposal import ProposalCreate
from app.platform.services.proposal_service import ProposalService
from app.core.config import settings

@pytest.mark.asyncio
async def test_service_orchestration_flow(monkeypatch):
    monkeypatch.setattr(settings, "LLM_PROVIDER", "mock")
    monkeypatch.setattr(settings, "EMBEDDING_PROVIDER", "mock")
    monkeypatch.setattr(settings, "ENVIRONMENT", "development")

    company_id = uuid4()
    prop_id = uuid4()
    
    # Mocking DB because SQLite cannot handle pgvector/JSONB columns out of the box in SQLAlchemy
    class MockSession:
        async def __aenter__(self): return self
        async def __aexit__(self, *args): pass
        async def commit(self): pass
        async def refresh(self, obj): pass
        def add(self, obj): pass
        async def execute(self, stmt):
            class MockResult:
                def scalars(self):
                    class MockScalars:
                        def first(self):
                            from app.models.email import Email
                            return Email(subject="Integration Request", body="We need a CRM.", direction="INCOMING")
                        def all(self): return []
                    return MockScalars()
            return MockResult()
        
    mock_db = MockSession()
    
    proposal = Proposal(id=prop_id, company_id=company_id, status=ProposalStatus.RECEIVED)
    
    async def mock_get_proposal(db, p_id, c_id):
        return proposal
        
    monkeypatch.setattr(ProposalService, "get_proposal", mock_get_proposal)
    monkeypatch.setattr("app.platform.services.proposal_service.async_session_maker", lambda: MockSession())
    
    class SyncMockSession:
        def __enter__(self): return self
        def __exit__(self, *args): pass
        def execute(self, stmt):
            class MockResult:
                def scalars(self):
                    class MockScalars:
                        def first(self): return None
                        def all(self): return []
                    return MockScalars()
            return MockResult()
            
    monkeypatch.setattr("app.platform.services.retriever_service.sync_session_maker", lambda: SyncMockSession())
    
    # 3. Process Proposal
    await ProposalService.process_proposal_bg(prop_id, company_id)
    
    # 4. Verify intelligence pipeline altered state
    assert proposal.status == ProposalStatus.ANALYZED or proposal.status == ProposalStatus.REVIEW_REQUIRED
