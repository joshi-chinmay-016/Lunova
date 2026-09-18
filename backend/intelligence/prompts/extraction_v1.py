"""Extraction Prompt Version 1.0 (extraction_v1).

Defines the system prompt, user prompt builder, and structured extraction schema
for Gemini-powered proposal understanding. Enforces strict anti-hallucination
rules and evidence preservation without performing RAG or generating vendor claims.
"""

from typing import List, Optional
from pydantic import BaseModel, Field

from ..models.proposal import ProposalContext

EXTRACTION_PROMPT_VERSION: str = "v1.0"

SYSTEM_PROMPT: str = """You are an expert Proposal Intelligence Agent specializing in proposal understanding, requirement extraction, and gap analysis for RFP/RFI submissions.

YOUR OBJECTIVE:
Analyze the inbound proposal or RFP text and extract structured requirements, identify critical missing information, and flag ambiguous statements.

STRICT ANTI-HALLUCINATION & INTEGRITY RULES:
1. USE ONLY THE PROVIDED PROPOSAL CONTENT. Never invent or assume facts, requirements, numbers, dates, or specifications not directly grounded in the text.
2. DO NOT INVENT VENDOR CAPABILITIES. Do not answer the proposal. Do not make claims about Lunetron, our capabilities, team size, past clients, pricing, or certifications.
3. PRESERVE EVIDENCE. For every requirement, quote the exact verbatim text or key phrases from the proposal as 'evidence'.
4. EXPLICIT VS INFERRED:
   - Mark `explicit = true` when the client explicitly stated the requirement.
   - Mark `explicit = false` when the requirement is a necessary logical inference. NEVER represent inferences as explicit statements.
5. NO NUMBER FABRICATION. If the client states "deploy quickly" or "must be highly scalable", do NOT invent a concrete timeline (e.g. "2 weeks") or numeric capacity (e.g. "1 million users"). Instead, flag the statement in `ambiguities` explaining what concrete specification is missing.
6. MISSING INFORMATION: Identify only relevant, actionable missing details necessary to prepare a valid proposal response (e.g., submission_deadline, budget, expected_users, deployment_environment, security_requirements, timeline). Do not label every absent fact as missing.
7. CATEGORIZATION: Assign each requirement to one of:
   - functional_requirement
   - technical_requirement
   - business_requirement
   - deliverable
   - timeline
   - budget
   - compliance
   - security
   - integration
   - support
   - team_requirement
   - qualification
   - other
8. PRIORITY: Assign priority as 'high', 'medium', or 'low' based on client emphasis (e.g., 'must', 'shall', 'mandatory' = high).
9. RETURN ONLY THE STRUCTURED JSON SCHEMA. Do not include extraneous markdown commentary or conversational text.
"""


class ExtractedRequirementItem(BaseModel):
    """A discrete requirement extracted from proposal content."""

    text: str = Field(description="Normalized statement of the requirement")
    category: str = Field(description="Category of the requirement (e.g. functional_requirement, technical_requirement, security, integration, etc.)")
    priority: str = Field(default="medium", description="Priority level: high, medium, or low")
    explicit: bool = Field(default=True, description="True if explicitly stated by the client, False if logically inferred")
    evidence: str = Field(default="", description="Verbatim quote or source sentence from the proposal text")
    confidence: float = Field(default=1.0, ge=0.0, le=1.0, description="Confidence score between 0.0 and 1.0")


class MissingInformationItem(BaseModel):
    """Critical parameter or detail missing from the proposal."""

    field: str = Field(description="Missing parameter (e.g. submission_deadline, budget, timeline, expected_users, integration_details)")
    reason: str = Field(description="Explanation of why this information is missing and necessary")
    importance: str = Field(default="medium", description="Importance level: high, medium, or low")


class AmbiguityItem(BaseModel):
    """Vague or ambiguous requirement requiring clarification."""

    text: str = Field(description="The ambiguous sentence or phrasing from the proposal")
    reason: str = Field(description="Why this is ambiguous and what specific clarification is needed")


class ProposalExtractionPayload(BaseModel):
    """Root structured schema returned by the LLM for proposal extraction."""

    summary: Optional[str] = Field(default=None, description="Brief 1-2 sentence executive summary of the proposal request")
    requirements: List[ExtractedRequirementItem] = Field(default_factory=list, description="List of discrete requirements")
    missing_information: List[MissingInformationItem] = Field(default_factory=list, description="List of relevant missing fields")
    ambiguities: List[AmbiguityItem] = Field(default_factory=list, description="List of detected ambiguities")


def build_extraction_user_prompt(context: ProposalContext) -> str:
    """Format normalized ProposalContext into a structured extraction prompt."""
    sections = [
        "Please analyze the following inbound proposal content and extract structured requirements, missing information, and ambiguities.",
        "",
        f"PROPOSAL SUBJECT: {context.subject}",
        "",
        "PROPOSAL BODY:",
        context.body.strip() if context.body else "[No body text provided]",
    ]

    if context.attachments_text:
        sections.append("")
        sections.append("ATTACHMENT CONTENTS:")
        for idx, att_text in enumerate(context.attachments_text, 1):
            sections.append(f"--- Attachment {idx} ---")
            sections.append(att_text.strip())

    return "\n".join(sections)
