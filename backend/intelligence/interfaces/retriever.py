"""Stage interface for company-scoped knowledge retrieval."""

from abc import ABC, abstractmethod
from typing import List, Optional, Union

from ..models.extraction import ExtractedRequirement
from ..models.retrieval import RetrievedSource


class Retriever(ABC):
    """Abstract interface for retrieving tenant-isolated knowledge sources."""

    @abstractmethod
    def retrieve(
        self,
        requirements: Union[List[ExtractedRequirement], str],
        company_id: str,
        top_k: Optional[int] = None,
    ) -> List[RetrievedSource]:
        """Retrieve knowledge chunks strictly scoped to the specified company_id.

        Args:
            requirements: Extracted requirements or formulated search query.
            company_id: Mandatory tenant identifier for isolation.
            top_k: Optional max count of retrieved sources.
        """
        pass
