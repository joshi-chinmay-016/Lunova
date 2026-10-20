"""Knowledge retrieval models."""

from dataclasses import dataclass, field
from typing import Any, Dict, Optional


@dataclass
class RetrievedSource:
    """A cited knowledge chunk retrieved from the tenant-scoped knowledge base."""

    source_id: str
    title: str
    section: str = ""
    relevance_score: float = 0.0
    content: str = ""
    chunk_id: Optional[str] = None
    company_id: Optional[str] = None
    page: Optional[int] = None
    similarity_score: Optional[float] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
