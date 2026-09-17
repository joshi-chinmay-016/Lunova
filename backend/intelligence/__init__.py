"""Lunova AI Proposal Intelligence Engine.

Owner: Chinmay

Submodules:
- models: Normalized stage data structures
- interfaces: Stage abstractions (Extractor, Retriever, Generator, Evaluator)
- extraction: Requirement parsing & missing information detection
- retrieval: Tenant-scoped company knowledge search (pgvector)
- generation: Grounded proposal responses & clarification questions
- evaluation: Grounding evaluation, confidence scoring & warnings
- providers: Pluggable LLM and embedding interfaces
"""

from .config import DEFAULT_EMBEDDING_DIMENSION, IntelligenceConfig, intelligence_config
from .constants import (
    CONFIDENCE_THRESHOLD_HIGH,
    CONFIDENCE_THRESHOLD_MEDIUM,
    ConfidenceLevel,
    IntelligenceStatus,
)
from .exceptions import (
    EvaluationError,
    ExtractionError,
    GenerationError,
    IntelligenceError,
    InvalidProposalError,
    MissingCompanyContextError,
    ProviderError,
    RetrievalError,
)
from .interfaces import Evaluator, Extractor, Generator, Retriever
from .models import (
    ConfidenceMetrics,
    ExtractedRequirement,
    GeneratedDraft,
    IntelligenceResult,
    ProposalContext,
    RetrievedSource,
)
from .service import IntelligenceService

__all__ = [
    "IntelligenceService",
    "ProposalContext",
    "ExtractedRequirement",
    "RetrievedSource",
    "GeneratedDraft",
    "ConfidenceMetrics",
    "IntelligenceResult",
    "Extractor",
    "Retriever",
    "Generator",
    "Evaluator",
    "IntelligenceConfig",
    "DEFAULT_EMBEDDING_DIMENSION",
    "intelligence_config",
    "IntelligenceStatus",
    "ConfidenceLevel",
    "CONFIDENCE_THRESHOLD_HIGH",
    "CONFIDENCE_THRESHOLD_MEDIUM",
    "IntelligenceError",
    "InvalidProposalError",
    "MissingCompanyContextError",
    "ExtractionError",
    "RetrievalError",
    "GenerationError",
    "EvaluationError",
    "ProviderError",
]
