"""Grounding, confidence scoring, and evaluation submodule."""

from typing import List, Optional

from ..constants import CONFIDENCE_THRESHOLD_MEDIUM
from ..interfaces.evaluator import Evaluator
from ..models.evaluation import ConfidenceMetrics
from ..models.extraction import ExtractedRequirement
from ..models.generation import GeneratedDraft
from ..models.retrieval import RetrievedSource


class GroundingEvaluator(Evaluator):
    """Concrete stub for assessing response grounding, confidence, and quality."""

    def evaluate(
        self,
        draft: GeneratedDraft,
        requirements: Optional[List[ExtractedRequirement]] = None,
        sources: Optional[List[RetrievedSource]] = None,
    ) -> ConfidenceMetrics:
        """Evaluate grounding against retrieved knowledge sources and extracted requirements."""
        retrieved = sources or []
        has_sources = len(retrieved) > 0

        grounding_score = 0.95 if has_sources else 0.50
        overall_score = 0.92 if has_sources else 0.40
        requires_human = overall_score < CONFIDENCE_THRESHOLD_MEDIUM or not has_sources

        return ConfidenceMetrics(
            overall_score=overall_score,
            grounding_score=grounding_score,
            requires_human_attention=requires_human,
        )


__all__ = ["GroundingEvaluator"]
