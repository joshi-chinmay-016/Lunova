"""Stage interface for proposal response generation."""

from abc import ABC, abstractmethod
from typing import List

from ..models.extraction import ExtractedRequirement
from ..models.generation import GeneratedDraft
from ..models.proposal import ProposalContext
from ..models.retrieval import RetrievedSource


class Generator(ABC):
    """Abstract interface for generating grounded proposal drafts and responses."""

    @abstractmethod
    def generate(
        self,
        proposal: ProposalContext,
        requirements: List[ExtractedRequirement],
        sources: List[RetrievedSource],
    ) -> GeneratedDraft:
        """Generate a grounded proposal response based on extracted requirements and retrieved sources."""
        pass
