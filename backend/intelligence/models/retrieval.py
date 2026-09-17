"""Knowledge retrieval models."""

from dataclasses import dataclass


@dataclass
class RetrievedSource:
    """A cited knowledge chunk retrieved from the tenant-scoped knowledge base."""

    source_id: str
    title: str
    section: str
    relevance_score: float
