"""Requirement extraction engine for Lunova AI Proposal Intelligence.

Provider-agnostic implementation conforming to Extractor stage interface.
Builds structured extraction prompts, delegates to LLMProvider, and validates
structured outputs into domain ExtractionResult.
"""

from typing import Any, Dict, List, Optional, Union

from ..config import intelligence_config
from ..constants import RequirementCategory
from ..exceptions import ExtractionError, InvalidProposalError, ProviderError
from ..interfaces.extractor import Extractor
from ..models.extraction import (
    Ambiguity,
    ExtractedRequirement,
    ExtractionResult,
    MissingInformation,
)
from ..models.proposal import ProposalContext
from ..prompts.extraction_v1 import (
    SYSTEM_PROMPT,
    ProposalExtractionPayload,
    build_extraction_user_prompt,
)
from ..providers.llm import LLMProvider
from ..providers.mock import MockLLMProvider


class RequirementExtractor(Extractor):
    """Concrete provider-agnostic extractor for proposal requirements, gaps, and ambiguities."""

    def __init__(self, llm_provider: Optional[LLMProvider] = None) -> None:
        if llm_provider is not None:
            self.llm_provider = llm_provider
        elif intelligence_config.llm_provider == "gemini":
            from ..providers.gemini import GeminiProvider

            self.llm_provider = GeminiProvider()
        else:
            self.llm_provider = MockLLMProvider()

    def _validate_input(self, context: ProposalContext) -> None:
        """Validate input integrity and proposal length limits."""
        if not context or not context.proposal_id or not context.proposal_id.strip():
            raise InvalidProposalError("Cannot extract requirements from empty or unidentifiable proposal context.")

        # Calculate character count across subject, body, and attachments
        total_chars = len(context.subject or "") + len(context.body or "")
        if context.attachments_text:
            total_chars += sum(len(att) for att in context.attachments_text if att)

        max_allowed = intelligence_config.max_proposal_input_chars
        if total_chars > max_allowed:
            raise InvalidProposalError(
                f"Proposal content size ({total_chars} chars) exceeds the maximum allowed limit of {max_allowed} chars."
            )

    def extract(self, context: ProposalContext) -> ExtractionResult:
        """Extract structured requirements, missing details, and ambiguities from proposal context."""
        self._validate_input(context)

        prompt = build_extraction_user_prompt(context)

        try:
            raw_payload = self.llm_provider.generate_structured(
                prompt=prompt,
                response_schema=ProposalExtractionPayload,
                system_prompt=SYSTEM_PROMPT,
            )
        except ProviderError:
            raise
        except Exception as exc:
            raise ExtractionError(f"LLM provider failed during structured extraction: {exc}") from exc

        # Validate that the returned object conforms to ProposalExtractionPayload
        if not isinstance(raw_payload, ProposalExtractionPayload):
            try:
                if hasattr(ProposalExtractionPayload, "model_validate"):
                    raw_payload = ProposalExtractionPayload.model_validate(raw_payload)
                else:
                    raw_payload = ProposalExtractionPayload(**dict(raw_payload))
            except Exception as parse_err:
                raise ExtractionError(
                    f"Malformed structured extraction output: {parse_err}"
                ) from parse_err

        # Convert payload into domain ExtractionResult with deterministic requirement IDs
        requirements: List[ExtractedRequirement] = []
        for idx, item in enumerate(raw_payload.requirements, 1):
            category = item.category.lower().strip()
            # Normalize category if slightly off
            valid_categories = {c.value for c in RequirementCategory}
            if category not in valid_categories:
                category = RequirementCategory.OTHER.value

            req = ExtractedRequirement(
                requirement_id=f"req-{idx:02d}",
                text=item.text,
                category=category,
                priority=item.priority.lower() if item.priority else "medium",
                explicit=item.explicit,
                evidence=item.evidence,
                confidence=item.confidence,
                description=item.text,
            )
            requirements.append(req)

        missing_info: List[MissingInformation] = [
            MissingInformation(
                field=m.field.strip().lower(),
                reason=m.reason.strip(),
                importance=m.importance.lower() if m.importance else "medium",
            )
            for m in raw_payload.missing_information
        ]

        ambiguities: List[Ambiguity] = [
            Ambiguity(
                text=a.text.strip(),
                reason=a.reason.strip(),
            )
            for a in raw_payload.ambiguities
        ]

        return ExtractionResult(
            proposal_id=context.proposal_id,
            requirements=requirements,
            missing_information=missing_info,
            ambiguities=ambiguities,
            raw_summary=raw_payload.summary,
            metadata={
                "provider": self.llm_provider.provider_name,
                "model": self.llm_provider.model_name,
                "requirement_count": len(requirements),
                "missing_info_count": len(missing_info),
                "ambiguity_count": len(ambiguities),
            },
        )
