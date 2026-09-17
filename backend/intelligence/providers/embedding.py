"""Abstract base class for embedding providers."""

from abc import ABC, abstractmethod
from typing import Any, List


class EmbeddingProvider(ABC):
    """Abstract interface for text embedding providers."""

    @property
    @abstractmethod
    def provider_name(self) -> str:
        """Name of the embedding provider (e.g., 'openai', 'gemini', 'mock')."""
        pass

    @property
    @abstractmethod
    def dimension(self) -> int:
        """Vector embedding dimensionality (e.g., 1536)."""
        pass

    @abstractmethod
    def embed_texts(self, texts: List[str], **kwargs: Any) -> List[List[float]]:
        """Compute vector embeddings for a list of document texts."""
        pass

    @abstractmethod
    def embed_query(self, text: str, **kwargs: Any) -> List[float]:
        """Compute vector embedding for a single search query."""
        pass
