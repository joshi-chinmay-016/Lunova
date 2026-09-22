from typing import Protocol, List
import random

class EmbeddingProvider(Protocol):
    async def embed_text(self, text: str) -> List[float]:
        """Generate embeddings for a single text."""
        ...

    async def embed_texts(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for multiple texts."""
        ...


class FakeEmbeddingProvider:
    """A fake embedding provider for testing."""
    def __init__(self, dimension: int = 1536):
        self.dimension = dimension

    async def embed_text(self, text: str) -> List[float]:
        # Return deterministic but "random-looking" embeddings based on string length to simulate real embeddings somewhat
        seed = len(text)
        rng = random.Random(seed)
        return [rng.uniform(-1.0, 1.0) for _ in range(self.dimension)]

    async def embed_texts(self, texts: List[str]) -> List[List[float]]:
        return [await self.embed_text(t) for t in texts]
