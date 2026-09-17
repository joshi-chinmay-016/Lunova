"""Mock implementations of LLM and embedding providers for testing and Phase 1 foundation."""

from typing import Any, List, Optional

from ..config import DEFAULT_EMBEDDING_DIMENSION
from .embedding import EmbeddingProvider
from .llm import LLMProvider


class MockLLMProvider(LLMProvider):
    """Deterministic mock LLM provider for local testing without external API calls."""

    def __init__(
        self,
        default_response: Optional[str] = None,
        model_name: str = "mock-llm-v1",
    ) -> None:
        self._default_response = default_response or "Mock generated response text."
        self._model_name = model_name
        self.call_history: List[str] = []

    @property
    def provider_name(self) -> str:
        return "mock"

    @property
    def model_name(self) -> str:
        return self._model_name

    def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.2,
        **kwargs: Any,
    ) -> str:
        self.call_history.append(prompt)
        return self._default_response


class MockEmbeddingProvider(EmbeddingProvider):
    """Deterministic mock embedding provider returning fixed-dimension vector floats.

    Defaults to configured DEFAULT_EMBEDDING_DIMENSION (3072).
    """

    def __init__(self, dimension: Optional[int] = None) -> None:
        self._dimension = dimension if dimension is not None else DEFAULT_EMBEDDING_DIMENSION
        self.call_history: List[str] = []

    @property
    def provider_name(self) -> str:
        return "mock"

    @property
    def dimension(self) -> int:
        return self._dimension

    def _generate_vector(self, text: str) -> List[float]:
        # Generate deterministic float vector based on length and char codes
        base = float(len(text) % 100) / 100.0
        return [base] * self._dimension

    def embed_texts(self, texts: List[str], **kwargs: Any) -> List[List[float]]:
        for text in texts:
            self.call_history.append(text)
        return [self._generate_vector(t) for t in texts]

    def embed_query(self, text: str, **kwargs: Any) -> List[float]:
        self.call_history.append(text)
        return self._generate_vector(text)
