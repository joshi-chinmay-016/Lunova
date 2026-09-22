import pytest
from uuid import uuid4
from app.ai.contracts.requirements import RequirementExtractionInput
from app.ai.extraction.service import ExtractionService
from app.ai.providers.llm import FakeLLMProvider

@pytest.mark.asyncio
async def test_extraction_service():
    llm = FakeLLMProvider()
    service = ExtractionService(llm_provider=llm)
    
    input_data = RequirementExtractionInput(
        company_id=uuid4(),
        content="Please provide a proposal for building a data center. Budget is $1M.",
        subject="RFP: Data Center"
    )
    
    result = await service.extract_requirements(input_data)
    
    # We used FakeLLMProvider which returns a hardcoded JSON string for extraction
    assert result.summary == "Fake summary"
    assert result.confidence == 0.95
    assert len(result.requested_services) == 1
    assert result.requested_services[0] == "Fake Service"
    
    # Verify the prompt passed to LLM contains the input text
    assert "Please provide a proposal for building a data center" in llm.last_prompt
    assert "Subject: RFP: Data Center" in llm.last_prompt
