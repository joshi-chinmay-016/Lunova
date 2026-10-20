"""Normalized internal models for the AI Intelligence module."""

from .evaluation import ConfidenceMetrics
from .extraction import (
    Ambiguity,
    ExtractedRequirement,
    ExtractionResult,
    MissingInformation,
)
from .generation import GeneratedDraft
from .proposal import AttachmentMetadata, ParsedAttachment, ProposalContext
from .result import IntelligenceResult
from .retrieval import RetrievedSource

__all__ = [
    "AttachmentMetadata",
    "ParsedAttachment",
    "ProposalContext",
    "ExtractedRequirement",
    "MissingInformation",
    "Ambiguity",
    "ExtractionResult",
    "RetrievedSource",
    "GeneratedDraft",
    "ConfidenceMetrics",
    "IntelligenceResult",
]

