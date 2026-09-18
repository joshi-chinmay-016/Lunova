import os
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

try:
    from dotenv import load_dotenv

    load_dotenv()
    _repo_root = Path(__file__).resolve().parents[2]
    load_dotenv(_repo_root / ".env")
    load_dotenv(_repo_root / "backend" / ".env")
except ImportError:
    pass

from .constants import DEFAULT_MAX_PROPOSAL_CHARS


# The planned embedding vector dimension is 3072 (e.g. OpenAI text-embedding-3-large).
# IMPORTANT: The configured dimension is currently 3072. Before production RAG/vector indexing,
# this value must match the output dimension of the selected embedding model.
# NOTE for Phase 3: Do NOT assume future Gemini embedding models output 3072.
# Verify and align with actual Gemini embedding model specs during Phase 3.
DEFAULT_EMBEDDING_DIMENSION: int = 3072


@dataclass
class IntelligenceConfig:
    """Configurable settings for AI intelligence execution."""

    embedding_dimension: int = DEFAULT_EMBEDDING_DIMENSION
    default_top_k: int = 3
    require_tenant_isolation: bool = True
    default_llm_model: str = "mock-llm-v1"
    default_embedding_model: str = "mock-embedding-v1"

    # Phase 2 Gemini / LLM Provider settings
    llm_provider: str = os.getenv("LLM_PROVIDER", "mock")
    gemini_api_key: Optional[str] = os.getenv("GEMINI_API_KEY", None)
    gemini_model: str = os.getenv("GEMINI_MODEL", "gemini-3.6-flash")
    max_proposal_input_chars: int = int(os.getenv("MAX_PROPOSAL_INPUT_CHARS", str(DEFAULT_MAX_PROPOSAL_CHARS)))



# Default module-level configuration instance
intelligence_config = IntelligenceConfig()

