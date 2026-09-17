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
