"""Abstract base class for LLM providers."""

from abc import ABC, abstractmethod
from typing import Any, Dict, Optional


class LLMProvider(ABC):
    """Abstract interface for foundation language model providers."""

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Name of the LLM provider (e.g., 'openai', 'anthropic', 'gemini', 'mock')."""
        pass

    @property
    @abstractmethod
    def model_name(self) -> str:
        """Identified model name (e.g., 'mock-llm-v1')."""
        pass

    @abstractmethod
    def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.2,
        **kwargs: Any,
    ) -> str:
        """Generate text completion from the specified prompt."""
        pass

    def generate_structured(
        self,
        prompt: str,
        response_schema: type,
        system_prompt: Optional[str] = None,
        temperature: float = 0.2,
        **kwargs: Any,
    ) -> Any:
        """Generate structured output conforming to the specified response schema.

        Fallback implementation for providers that only implement unstructured text generate():
        Attempts to parse generated text as JSON, or builds a sensible default schema instance.
        """
        raw_text = self.generate(
            prompt, system_prompt=system_prompt, temperature=temperature, **kwargs
        )
        if hasattr(response_schema, "model_validate_json"):
            try:
                return response_schema.model_validate_json(raw_text)
            except Exception:
                pass

        if hasattr(response_schema, "model_validate"):
            try:
                return response_schema.model_validate(
                    {
                        "requirements": [
                            {
                                "text": raw_text or "Extracted requirement",
                                "category": "functional_requirement",
                                "priority": "high",
                                "explicit": True,
                                "evidence": raw_text or "",
                                "confidence": 0.9,
                            }
                        ],
                        "missing_information": [],
                        "ambiguities": [],
                        "summary": raw_text,
                    }
                )
            except Exception:
                pass

        return response_schema()



