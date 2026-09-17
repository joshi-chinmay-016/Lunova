"""Proposal understanding and requirement extraction submodule."""

from typing import List

from ..exceptions import InvalidProposalError
from ..interfaces.extractor import Extractor
from ..models.extraction import ExtractedRequirement
from ..models.proposal import ProposalContext


class RequirementExtractor(Extractor):
    """Concrete stub for requirement extraction from normalized proposal text."""

    def extract(self, context: ProposalContext) -> List[ExtractedRequirement]:
        """Phase 1 mock requirement extraction conforming to Extractor interface."""
        if not context or not context.proposal_id:
            raise InvalidProposalError("Cannot extract requirements from empty or unidentifiable proposal context.")

        return [
            ExtractedRequirement(
                requirement_id="req-mock-01",
                category="TECHNICAL",
                description=f"Automated requirement extracted from proposal: {context.subject}",
                priority="HIGH",
            )
        ]


__all__ = ["RequirementExtractor"]
