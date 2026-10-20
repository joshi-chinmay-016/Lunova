"""Draft generation models."""

from dataclasses import dataclass, field
from typing import Any, Dict, List


@dataclass
class GeneratedDraft:
    """Draft proposal response formulated by the generation stage."""

    executive_summary: str
    draft_email_body: str
    requirement_responses: List[Dict[str, Any]] = field(default_factory=list)
    clarification_questions: List[Dict[str, str]] = field(default_factory=list)
    unsupported_claims: List[Dict[str, str]] = field(default_factory=list)
    evidence_citations: List[str] = field(default_factory=list)
    subject_line: str = ""
    metadata: Dict[str, Any] = field(default_factory=dict)
