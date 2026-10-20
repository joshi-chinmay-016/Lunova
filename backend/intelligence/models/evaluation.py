"""Grounding and evaluation metrics models."""

from dataclasses import dataclass, field
from typing import Any, Dict, List


@dataclass
class ConfidenceMetrics:
    """Grounding and confidence metrics computed during evaluation."""

    overall_score: float
    grounding_score: float
    requires_human_attention: bool = False
    coverage_score: float = 1.0
    unsupported_claim_count: int = 0
    validation_findings: List[Dict[str, Any]] = field(default_factory=list)
    confidence_level: str = "HIGH"  # HIGH, MEDIUM, LOW
