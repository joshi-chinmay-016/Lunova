"""Proposal response generation submodule."""

from typing import Any, Dict, List

from ..interfaces.generator import Generator
from ..models.extraction import ExtractedRequirement
from ..models.generation import GeneratedDraft
from ..models.proposal import ProposalContext
from ..models.retrieval import RetrievedSource
from ..providers.llm import LLMProvider


class ResponseGenerator(Generator):
    """Concrete stub for drafting grounded proposal responses."""

    def __init__(self, llm_provider: LLMProvider) -> None:
        self.llm_provider = llm_provider

    def generate(
        self,
        proposal: ProposalContext,
        requirements: List[ExtractedRequirement],
        sources: List[RetrievedSource],
    ) -> GeneratedDraft:
        """Generate draft response based on extracted requirements and retrieved sources."""
        prompt = f"Draft response for {proposal.subject} addressing {len(requirements)} requirements."
        llm_response = self.llm_provider.generate(prompt)

        req_responses: List[Dict[str, Any]] = [
            {
                "requirement_id": req.requirement_id,
                "response": f"Acknowledged requirement: {req.description}",
                "grounded_in": [s.source_id for s in sources],
            }
            for req in requirements
        ]

        return GeneratedDraft(
            executive_summary=f"Proposal response draft for {proposal.company_id.capitalize()}: {llm_response}",
            draft_email_body=f"Dear Client,\n\nThank you for your proposal regarding '{proposal.subject}'.\n\n{llm_response}",
            requirement_responses=req_responses,
        )

    def generate_draft(
        self,
        context: ProposalContext,
        requirements: List[ExtractedRequirement],
        sources: List[RetrievedSource],
    ) -> GeneratedDraft:
        """Compatibility alias for generate()."""
        return self.generate(proposal=context, requirements=requirements, sources=sources)


__all__ = ["ResponseGenerator"]
