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


# Reconciled Embedding Dimension:
# Previously 1536 (OpenAI text-embedding-3-small) in DB and 3072 in Phase 1 stub config.
# For production Gemini RAG, Google's official text-embedding-004 produces 768 dimensions.
# Made configurable via EMBEDDING_DIMENSION with 768 as the production Gemini default.
DEFAULT_EMBEDDING_DIMENSION: int = int(os.getenv("EMBEDDING_DIMENSION", "768"))


@dataclass
class IntelligenceConfig:
    """Configurable settings for AI intelligence execution."""

    embedding_dimension: int = DEFAULT_EMBEDDING_DIMENSION
    default_top_k: int = 3
    require_tenant_isolation: bool = True
    default_llm_model: str = "mock-llm-v1"
    default_embedding_model: str = "mock-embedding-v1"

    # LLM & Embedding Provider settings
    llm_provider: str = os.getenv("LLM_PROVIDER", "mock")
    gemini_api_key: Optional[str] = os.getenv("GEMINI_API_KEY", None)
    gemini_model: str = os.getenv("GEMINI_MODEL", "gemini-3.6-flash")
    gemini_embedding_model: str = os.getenv("GEMINI_EMBEDDING_MODEL", "text-embedding-004")
    embedding_provider: str = os.getenv("EMBEDDING_PROVIDER", "mock")
    max_proposal_input_chars: int = int(os.getenv("MAX_PROPOSAL_INPUT_CHARS", str(DEFAULT_MAX_PROPOSAL_CHARS)))



# Default module-level configuration instance
intelligence_config = IntelligenceConfig()

