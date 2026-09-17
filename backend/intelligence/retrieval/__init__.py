"""Tenant-scoped knowledge retrieval submodule."""

from typing import List, Optional, Union

from ..constants import DEFAULT_RETRIEVAL_TOP_K
from ..exceptions import MissingCompanyContextError
from ..interfaces.retriever import Retriever
from ..models.extraction import ExtractedRequirement
from ..models.retrieval import RetrievedSource


class KnowledgeRetriever(Retriever):
    """Concrete stub for retrieving company-scoped knowledge chunks."""

    def retrieve(
        self,
        requirements: Union[List[ExtractedRequirement], str],
        company_id: str,
        top_k: Optional[int] = None,
    ) -> List[RetrievedSource]:
        """Retrieve knowledge chunks strictly scoped to the specified tenant/company.

        Args:
            requirements: Extracted requirements or search query string.
            company_id: Target tenant identifier (mandatory tenant boundary).
            top_k: Maximum number of sources to return.

        Returns:
            List of company-isolated RetrievedSource instances.
        """
        if not company_id or not company_id.strip():
            raise MissingCompanyContextError(
                "company_id is mandatory for knowledge retrieval to enforce tenant isolation."
            )

        limit = top_k or DEFAULT_RETRIEVAL_TOP_K

        # Minimal deterministic mock retrieval for Phase 1 testing
        # Scoped strictly to company_id
        return [
            RetrievedSource(
                source_id=f"src-{company_id}-001",
                title=f"{company_id.capitalize()} Platform Specifications",
                section="Section 1.0 Architecture Overview",
                relevance_score=0.92,
            )
        ][:limit]


__all__ = ["KnowledgeRetriever"]
