"""Stage interface for proposal requirement extraction."""

from abc import ABC, abstractmethod
from typing import List, Union

from ..models.extraction import ExtractedRequirement, ExtractionResult
from ..models.proposal import ProposalContext


class Extractor(ABC):
    """Abstract interface for requirement extraction from proposal context."""

    @abstractmethod
    def extract(self, context: ProposalContext) -> Union[ExtractionResult, List[ExtractedRequirement]]:
        """Extract structured requirements from normalized proposal input."""
        pass

