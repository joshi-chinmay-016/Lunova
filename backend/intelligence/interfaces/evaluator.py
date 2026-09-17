"""Stage interface for grounding and quality evaluation."""

from abc import ABC, abstractmethod
from typing import List

from ..models.evaluation import ConfidenceMetrics
from ..models.extraction import ExtractedRequirement
from ..models.generation import GeneratedDraft
from ..models.retrieval import RetrievedSource


class Evaluator(ABC):
    """Abstract interface for assessing response grounding, confidence, and quality."""

    @abstractmethod
    def evaluate(
        self,
        draft: GeneratedDraft,
        requirements: List[ExtractedRequirement],
        sources: List[RetrievedSource],
    ) -> ConfidenceMetrics:
        """Evaluate grounding against retrieved knowledge sources and extracted requirements."""
        pass
