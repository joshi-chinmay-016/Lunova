"""Requirement extraction models."""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field, model_validator

from ..constants import RequirementCategory


class ExtractedRequirement(BaseModel):
    """A discrete requirement extracted from proposal content."""

    requirement_id: str = Field(default="", description="Unique identifier for the requirement (e.g., req-1)")
    text: str = Field(default="", description="Cleaned requirement statement")
    category: str = Field(
        default=RequirementCategory.FUNCTIONAL_REQUIREMENT.value,
        description="Category such as functional_requirement, technical_requirement, etc.",
    )
    priority: str = Field(default="medium", description="Priority level: high, medium, low")
    explicit: bool = Field(default=True, description="True if explicitly stated by client, False if inferred")
    evidence: str = Field(default="", description="Verbatim quote or source text from proposal")
    confidence: float = Field(default=1.0, ge=0.0, le=1.0, description="Confidence score from 0.0 to 1.0")
    description: Optional[str] = Field(
        default=None,
        description="Backwards-compatible alias for text",
    )

    @model_validator(mode="before")
    @classmethod
    def _sync_text_and_description(cls, data: Any) -> Any:
        if isinstance(data, dict):
            desc = data.get("description")
            txt = data.get("text")
            if desc and not txt:
                data["text"] = desc
            elif txt and not desc:
                data["description"] = txt
        return data


class MissingInformation(BaseModel):
    """Relevant missing specification or unaddressed client information."""

    field: str = Field(description="Missing parameter or category (e.g. submission_deadline, budget, timeline)")
    reason: str = Field(description="Explanation of why this field is missing or underspecified")
    importance: str = Field(default="medium", description="Importance level: high, medium, low")


class Ambiguity(BaseModel):
    """Ambiguous or vague statement detected in the proposal."""

    text: str = Field(description="The ambiguous phrasing or requirement from the proposal")
    reason: str = Field(description="Why this statement is ambiguous and what clarification is required")


class ExtractionResult(BaseModel):
    """Consolidated result of proposal understanding and requirement extraction."""

    proposal_id: str
    requirements: List[ExtractedRequirement] = Field(default_factory=list)
    missing_information: List[MissingInformation] = Field(default_factory=list)
    ambiguities: List[Ambiguity] = Field(default_factory=list)
    raw_summary: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
