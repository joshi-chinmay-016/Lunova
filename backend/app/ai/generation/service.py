from app.ai.contracts.generation import ProposalGenerationInput, ProposalGenerationResult, SourceReference
from app.ai.providers.llm import LLMProvider
from app.ai.generation.prompts import GENERATION_PROMPT_TEMPLATE
from app.ai.rag.context import ContextBuilder

class GenerationService:
    def __init__(self, llm_provider: LLMProvider):
        self.llm_provider = llm_provider

    async def generate_proposal(self, input_data: ProposalGenerationInput) -> ProposalGenerationResult:
        """
        Generates a proposal using the LLM, strictly adhering to the retrieved context.
        """
        context_str = ContextBuilder.build_context(input_data.retrieved_context)
        requirements_str = input_data.extracted_requirements.model_dump_json(indent=2)
        
        prompt = GENERATION_PROMPT_TEMPLATE.format(
            requirements=requirements_str,
            context=context_str
        )
        
        response_text = await self.llm_provider.generate(prompt)
        
        sources_used = [
            SourceReference(
                document_id=chunk.document_id,
                chunk_id=chunk.chunk_id,
                snippet=chunk.content[:100] + "..." if len(chunk.content) > 100 else chunk.content
            ) for chunk in input_data.retrieved_context
        ]
        
        return ProposalGenerationResult(
            content=response_text.strip(),
            sources_used=sources_used
        )
