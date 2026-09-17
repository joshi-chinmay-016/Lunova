"""Configuration settings for the Lunova AI Intelligence module."""

from dataclasses import dataclass

# The planned embedding vector dimension is 3072 (e.g. OpenAI text-embedding-3-large).
# IMPORTANT: The configured dimension is currently 3072. Before production RAG/vector indexing,
# this value must match the output dimension of the selected embedding model.
DEFAULT_EMBEDDING_DIMENSION: int = 3072


@dataclass
class IntelligenceConfig:
    """Configurable settings for AI intelligence execution."""

    embedding_dimension: int = DEFAULT_EMBEDDING_DIMENSION
    default_top_k: int = 3
    require_tenant_isolation: bool = True
    default_llm_model: str = "mock-llm-v1"
    default_embedding_model: str = "mock-embedding-v1"


# Default module-level configuration instance
intelligence_config = IntelligenceConfig()
