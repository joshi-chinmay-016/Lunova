"""Stage interface for proposal requirement extraction."""

from abc import ABC, abstractmethod
from typing import List

from ..models.extraction import ExtractedRequirement
from ..models.proposal import ProposalContext


class Extractor(ABC):
    """Abstract interface for requirement extraction from proposal context."""

    @abstractmethod
    def extract(self, context: ProposalContext) -> List[ExtractedRequirement]:
        """Extract structured requirements from normalized proposal input."""
        pass
