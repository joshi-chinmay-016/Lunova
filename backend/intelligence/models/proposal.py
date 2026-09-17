"""Normalized proposal input model."""

from dataclasses import dataclass, field
from typing import Any, Dict, List


@dataclass
class ProposalContext:
    """Normalized input payload passed into the intelligence module."""

    proposal_id: str
    company_id: str
    subject: str
    body: str
    attachments_text: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)
