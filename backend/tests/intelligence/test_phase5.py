import pytest
from uuid import uuid4
from intelligence.service import IntelligenceService
from intelligence.models.proposal import ProposalContext
from intelligence.exceptions import InvalidProposalError, MissingCompanyContextError
from intelligence.providers.mock import MockLLMProvider, MockEmbeddingProvider

def test_intelligence_service_valid_extraction():
    llm = MockLLMProvider()
    emb = MockEmbeddingProvider()
    service = IntelligenceService(llm_provider=llm, embedding_provider=emb)
    ctx = ProposalContext(proposal_id=str(uuid4()), company_id=str(uuid4()), subject="Sub", body="Body")
    result = service.analyze_proposal(ctx)
    assert len(result.requirements) > 0

def test_intelligence_service_empty_context():
    llm = MockLLMProvider()
    emb = MockEmbeddingProvider()
    service = IntelligenceService(llm_provider=llm, embedding_provider=emb)
    with pytest.raises(InvalidProposalError):
        service.analyze_proposal(ProposalContext(proposal_id="", company_id=str(uuid4()), subject="", body=""))
        
def test_intelligence_service_missing_company():
    llm = MockLLMProvider()
    emb = MockEmbeddingProvider()
    service = IntelligenceService(llm_provider=llm, embedding_provider=emb)
    with pytest.raises(MissingCompanyContextError):
        service.analyze_proposal(ProposalContext(proposal_id=str(uuid4()), company_id="", subject="", body=""))

def test_intelligence_service_provider_failure():
    llm = MockLLMProvider(simulate_error=Exception("Provider API Timeout"))
    emb = MockEmbeddingProvider()
    service = IntelligenceService(llm_provider=llm, embedding_provider=emb)
    ctx = ProposalContext(proposal_id=str(uuid4()), company_id=str(uuid4()), subject="Sub", body="Body")
    with pytest.raises(Exception, match="Provider API Timeout"):
        service.analyze_proposal(ctx)

def test_intelligence_service_malformed_llm_output():
    # MockLLMProvider returns valid structure by default. If we force it to return bad structure:
    llm = MockLLMProvider(default_structured_response={"invalid": "data"})
    emb = MockEmbeddingProvider()
    service = IntelligenceService(llm_provider=llm, embedding_provider=emb)
    ctx = ProposalContext(proposal_id=str(uuid4()), company_id=str(uuid4()), subject="Sub", body="Body")
    # Our Mock provider handles validation gracefully by returning empty models if validation fails,
    # or raises ValidationError. Let's see if it parses safely.
    result = service.analyze_proposal(ctx)
    assert result is not None

def test_intelligence_service_no_retrieval_results():
    from intelligence.interfaces.retriever import Retriever
    class EmptyRetriever(Retriever):
        def retrieve(self, requirements, company_id, top_k=None):
            return []
    
    llm = MockLLMProvider()
    emb = MockEmbeddingProvider()
    service = IntelligenceService(llm_provider=llm, embedding_provider=emb, retriever=EmptyRetriever())
    ctx = ProposalContext(proposal_id=str(uuid4()), company_id=str(uuid4()), subject="Sub", body="Body")
    result = service.analyze_proposal(ctx)
    assert len(result.retrieved_sources) == 0
    assert result.generated_response is not None
