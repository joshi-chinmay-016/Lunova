import pytest
from uuid import uuid4
from app.ai.contracts.requirements import ExtractedRequirements
from app.ai.contracts.retrieval import RetrievedChunk
from app.ai.contracts.generation import ProposalGenerationInput
from app.ai.generation.service import GenerationService
from app.ai.providers.llm import FakeLLMProvider

@pytest.mark.asyncio
async def test_generation_service():
    llm = FakeLLMProvider(default_response="Generated proposal content here.")
    service = GenerationService(llm_provider=llm)
    
    requirements = ExtractedRequirements(
        summary="Test summary",
        requested_services=[],
        deliverables=[],
        technical_requirements=[],
        business_requirements=[],
        constraints=[],
        confidence=0.9
    )
    
    chunk = RetrievedChunk(
        chunk_id=uuid4(),
        document_id=uuid4(),
        content="Our company has 10 years of experience.",
        score=0.9,
        metadata={}
    )
    
    input_data = ProposalGenerationInput(
        company_id=uuid4(),
        extracted_requirements=requirements,
        retrieved_context=[chunk]
    )
    
    result = await service.generate_proposal(input_data)
    
    assert result.content == "Generated proposal content here."
    assert len(result.sources_used) == 1
    assert result.sources_used[0].chunk_id == chunk.chunk_id
    
    # Verify prompt contains context and requirements
    assert "Our company has 10 years of experience" in llm.last_prompt
    assert "Test summary" in llm.last_prompt
