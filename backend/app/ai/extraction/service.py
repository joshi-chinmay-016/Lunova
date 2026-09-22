import json
from app.ai.contracts.requirements import RequirementExtractionInput, ExtractedRequirements
from app.ai.providers.llm import LLMProvider
from app.ai.extraction.prompts import EXTRACTION_PROMPT_TEMPLATE

class ExtractionService:
    def __init__(self, llm_provider: LLMProvider):
        self.llm_provider = llm_provider

    async def extract_requirements(self, input_data: RequirementExtractionInput) -> ExtractedRequirements:
        """
        Extract requirements from a proposal request using the LLM.
        """
        metadata_str = f"Subject: {input_data.subject}\n" if input_data.subject else ""
        if input_data.metadata:
            metadata_str += json.dumps(input_data.metadata)
            
        prompt = EXTRACTION_PROMPT_TEMPLATE.format(
            content=input_data.content,
            metadata=metadata_str
        )
        
        response_text = await self.llm_provider.generate(prompt)
        
        # In a real implementation, we would robustly parse the JSON response
        # Here we do a basic parse or use pydantic's model_validate_json
        try:
            # Clean up markdown formatting if present
            clean_json = response_text.replace("```json", "").replace("```", "").strip()
            return ExtractedRequirements.model_validate_json(clean_json)
        except Exception as e:
            # Fallback or error handling
            raise ValueError(f"Failed to parse LLM extraction response: {e}")
