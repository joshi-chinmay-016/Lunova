"""Intelligence service orchestrator for Lunova AI Proposal Intelligence."""

import time
from typing import Optional

from .constants import IntelligenceStatus
from .evaluation import GroundingEvaluator
from .exceptions import InvalidProposalError, MissingCompanyContextError
from .extraction import RequirementExtractor
from .generation import ResponseGenerator
from .interfaces.evaluator import Evaluator
from .interfaces.extractor import Extractor
from .interfaces.generator import Generator
from .interfaces.retriever import Retriever
from .logger import (
    log_evaluation_completed,
    log_pipeline_started,
    log_retrieval_attempted,
    log_stage_completed,
)
from .models.extraction import ExtractionResult
from .models.proposal import ProposalContext
from .models.result import IntelligenceResult
from .providers.embedding import EmbeddingProvider
from .providers.llm import LLMProvider
from .providers.mock import MockEmbeddingProvider, MockLLMProvider
from .retrieval import KnowledgeRetriever


class IntelligenceService:
    """Orchestrates the modular AI proposal intelligence pipeline.

    Decoupled via stage interfaces: Extractor, Retriever, Generator, Evaluator.
    """

    def __init__(
        self,
        extractor: Optional[Extractor] = None,
        retriever: Optional[Retriever] = None,
        generator: Optional[Generator] = None,
        evaluator: Optional[Evaluator] = None,
        llm_provider: Optional[LLMProvider] = None,
        embedding_provider: Optional[EmbeddingProvider] = None,
    ) -> None:
        self.llm_provider = llm_provider or MockLLMProvider()
        self.embedding_provider = embedding_provider or MockEmbeddingProvider()

        # Stage interfaces with sensible defaults
        self.extractor: Extractor = extractor or RequirementExtractor(llm_provider=self.llm_provider)
        self.retriever: Retriever = retriever or KnowledgeRetriever()
        self.generator: Generator = generator or ResponseGenerator(llm_provider=self.llm_provider)
        self.evaluator: Evaluator = evaluator or GroundingEvaluator()


    def analyze_proposal(self, context: ProposalContext) -> IntelligenceResult:
        """Execute the end-to-end intelligence pipeline on a normalized proposal.

        Deterministic before Generative:
        1. Validation: Verify proposal and mandatory tenant boundary (company_id).
        2. Extraction: Extract discrete requirements from proposal context.
        3. Retrieval: Search company-scoped knowledge sources.
        4. Generation: Draft grounded proposal response citing sources.
        5. Evaluation: Evaluate grounding, confidence, and human attention requirements.
        """
        if not context or not context.proposal_id:
            raise InvalidProposalError("Proposal context must contain a valid proposal_id.")

        if not context.company_id or not context.company_id.strip():
            raise MissingCompanyContextError("Proposal context must contain a valid company_id for tenant isolation.")

        start_time = time.perf_counter()
        log_pipeline_started(context.proposal_id, context.company_id)

        # Stage 1: Extraction
        stage_start = time.perf_counter()
        extraction_output = self.extractor.extract(context)
        if isinstance(extraction_output, ExtractionResult):
            requirements = extraction_output.requirements
            missing_info = [
                {"field": m.field, "reason": m.reason, "importance": m.importance}
                for m in extraction_output.missing_information
            ]
            clarifications = [
                {"text": a.text, "reason": a.reason}
                for a in extraction_output.ambiguities
            ]
            extraction_metadata = extraction_output.metadata
        else:
            requirements = extraction_output
            missing_info = []
            clarifications = []
            extraction_metadata = {}

        log_stage_completed("extraction", context.proposal_id, (time.perf_counter() - stage_start) * 1000)

        # Stage 2: Tenant-Scoped Knowledge Retrieval
        stage_start = time.perf_counter()
        sources = self.retriever.retrieve(
            requirements=requirements,
            company_id=context.company_id,
        )
        log_retrieval_attempted(context.company_id, len(sources))
        log_stage_completed("retrieval", context.proposal_id, (time.perf_counter() - stage_start) * 1000)

        # Stage 3: Generation
        stage_start = time.perf_counter()
        draft = self.generator.generate(
            proposal=context,
            requirements=requirements,
            sources=sources,
        )
        log_stage_completed("generation", context.proposal_id, (time.perf_counter() - stage_start) * 1000)

        # Stage 4: Grounding & Quality Evaluation
        stage_start = time.perf_counter()
        confidence = self.evaluator.evaluate(
            draft=draft,
            requirements=requirements,
            sources=sources,
        )
        log_evaluation_completed(
            context.proposal_id,
            confidence.overall_score,
            confidence.requires_human_attention,
        )
        log_stage_completed("evaluation", context.proposal_id, (time.perf_counter() - stage_start) * 1000)

        total_duration_ms = int((time.perf_counter() - start_time) * 1000)

        return IntelligenceResult(
            proposal_id=context.proposal_id,
            company_id=context.company_id,
            status=IntelligenceStatus.SUCCESS.value,
            requirements=requirements,
            missing_information=missing_info,
            retrieved_sources=sources,
            generated_response=draft,
            clarification_questions=clarifications,
            confidence=confidence,
            warnings=[],
            processing_metadata={
                "duration_ms": total_duration_ms,
                "provider": self.llm_provider.provider_name,
                "model": self.llm_provider.model_name,
                **extraction_metadata,
            },
        )
