from typing import Optional, List, Dict, Any
from uuid import UUID
from pydantic import BaseModel, Field

class RequirementExtractionInput(BaseModel):
    company_id: UUID = Field(..., description="The ID of the company this proposal belongs to")
    content: str = Field(..., description="The raw proposal/email content to extract requirements from")
    subject: Optional[str] = Field(None, description="Optional subject of the email/request")
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Optional metadata")

class ExtractedRequirements(BaseModel):
    summary: str = Field(..., description="A high-level summary of the request")
    requested_services: List[str] = Field(default_factory=list, description="Requested services or capabilities")
    deliverables: List[str] = Field(default_factory=list, description="Expected deliverables")
    technical_requirements: List[str] = Field(default_factory=list, description="Technical requirements identified")
    business_requirements: List[str] = Field(default_factory=list, description="Business requirements identified")
    constraints: List[str] = Field(default_factory=list, description="Any constraints mentioned (e.g., location, compliance)")
    timeline: Optional[str] = Field(None, description="Requested timeline or deadlines")
    budget: Optional[str] = Field(None, description="Budget constraints if present")
    assumptions_questions: List[str] = Field(default_factory=list, description="Assumptions made or questions to ask the client")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score in the extraction")
