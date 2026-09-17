"""Grounding and evaluation metrics models."""

from dataclasses import dataclass


@dataclass
class ConfidenceMetrics:
    """Grounding and confidence metrics computed during evaluation."""

    overall_score: float
    grounding_score: float
    requires_human_attention: bool = False
