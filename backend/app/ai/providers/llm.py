from typing import Protocol, Any, Dict, Optional

class LLMProvider(Protocol):
    async def generate(self, prompt: str, **kwargs) -> str:
        """Generate a response from the LLM based on the prompt."""
        ...


class FakeLLMProvider:
    """A fake LLM provider for testing."""
    def __init__(self, default_response: str = "Fake LLM response"):
        self.default_response = default_response
        self.last_prompt: Optional[str] = None
        self.last_kwargs: Dict[str, Any] = {}

    async def generate(self, prompt: str, **kwargs) -> str:
        self.last_prompt = prompt
        self.last_kwargs = kwargs
        
        # Simple heuristic to return valid JSON if the prompt looks like it expects JSON
        if "json" in prompt.lower() or "extract" in prompt.lower():
            # A fake JSON string that somewhat matches ExtractedRequirements
            return '''{
                "summary": "Fake summary",
                "requested_services": ["Fake Service"],
                "deliverables": ["Fake Deliverable"],
                "technical_requirements": [],
                "business_requirements": [],
                "constraints": [],
                "timeline": null,
                "budget": null,
                "assumptions_questions": [],
                "confidence": 0.95
            }'''
            
        return self.default_response
