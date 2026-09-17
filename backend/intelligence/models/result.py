"""Consolidated intelligence result model."""

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional

from .evaluation import ConfidenceMetrics
from .extraction import ExtractedRequirement
from .generation import GeneratedDraft
from .retrieval import RetrievedSource


@dataclass
class IntelligenceResult:
    """Consolidated analysis result returned by the IntelligenceService."""

    proposal_id: str
    company_id: str
    status: str  # "SUCCESS", "PARTIAL", "FAILED"
    requirements: List[ExtractedRequirement] = field(default_factory=list)
    missing_information: List[Dict[str, str]] = field(default_factory=list)
    retrieved_sources: List[RetrievedSource] = field(default_factory=list)
    generated_response: Optional[GeneratedDraft] = None
    clarification_questions: List[Dict[str, str]] = field(default_factory=list)
    confidence: Optional[ConfidenceMetrics] = None
    warnings: List[str] = field(default_factory=list)
    processing_metadata: Dict[str, Any] = field(default_factory=dict)
