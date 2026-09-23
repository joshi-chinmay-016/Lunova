import logging
from uuid import UUID
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.proposal import Proposal, ProposalStatus
from app.models.email import Email
from app.models.review import Review
from app.models.audit import AuditLog
from app.platform.schemas.proposal import ProposalCreate
from app.platform.schemas.review import ReviewCreate
from app.core.database import async_session_maker

from app.ai.providers.llm import FakeLLMProvider
from app.ai.providers.embeddings import FakeEmbeddingProvider
from app.ai.extraction.service import ExtractionService
from app.ai.generation.service import GenerationService
from app.ai.rag.retrieval import RetrievalService
from app.ai.contracts.requirements import RequirementExtractionInput
from app.ai.contracts.generation import ProposalGenerationInput
from app.ai.contracts.retrieval import RetrievalInput

logger = logging.getLogger(__name__)

class ProposalService:
    @staticmethod
    async def get_proposal(db: AsyncSession, proposal_id: UUID, company_id: UUID) -> Proposal:
        stmt = select(Proposal).filter(Proposal.id == proposal_id, Proposal.company_id == company_id)
        result = await db.execute(stmt)
        proposal = result.scalar_one_or_none()
        return proposal

    @staticmethod
    async def create_proposal(db: AsyncSession, data: ProposalCreate, company_id: UUID) -> Proposal:
        # Create Proposal
        proposal = Proposal(
            company_id=company_id,
            title=data.title or "Untitled Proposal",
            status=ProposalStatus.RECEIVED
        )
        db.add(proposal)
        await db.flush()

        # Create incoming Email record
        email = Email(
            company_id=company_id,
            proposal_id=proposal.id,
            subject=data.subject,
            body=data.content,
            direction="INCOMING"
        )
        db.add(email)

        # Audit log
        audit = AuditLog(
            company_id=company_id,
            proposal_id=proposal.id,
            action="CREATED",
            details="Proposal created from input"
        )
        db.add(audit)

        await db.commit()
        await db.refresh(proposal)
        return proposal

    @staticmethod
    async def process_proposal_bg(proposal_id: UUID, company_id: UUID):
        async with async_session_maker() as db:
            proposal = await ProposalService.get_proposal(db, proposal_id, company_id)
            if not proposal or proposal.status != ProposalStatus.RECEIVED:
                return

            try:
                # Update status
                proposal.status = ProposalStatus.PROCESSING
                db.add(AuditLog(company_id=company_id, proposal_id=proposal_id, action="PROCESSING_STARTED"))
                await db.commit()

                # Get the initial email content
                stmt = select(Email).filter(Email.proposal_id == proposal_id, Email.direction == "INCOMING").order_by(Email.created_at.asc())
                result = await db.execute(stmt)
                email = result.scalars().first()
                if not email:
                    raise Exception("No incoming email found for proposal")

                content = email.body
                subject = email.subject

                # 1. Extraction
                llm = FakeLLMProvider()
                extraction_service = ExtractionService(llm_provider=llm)
                extraction_input = RequirementExtractionInput(
                    company_id=company_id,
                    content=content,
                    subject=subject
                )
                requirements = await extraction_service.extract_requirements(extraction_input)
                
                proposal.status = ProposalStatus.ANALYZED
                db.add(AuditLog(company_id=company_id, proposal_id=proposal_id, action="ANALYZED", details=f"Confidence: {requirements.confidence}"))
                await db.commit()

                # 2. RAG Retrieval
                embeddings = FakeEmbeddingProvider()
                retrieval_service = RetrievalService(db, embedding_provider=embeddings)
                retrieval_input = RetrievalInput(company_id=company_id, query=requirements.summary, top_k=3)
                retrieval_result = await retrieval_service.retrieve(retrieval_input)

                # 3. Generation
                generation_service = GenerationService(llm_provider=llm)
                gen_input = ProposalGenerationInput(
                    company_id=company_id,
                    extracted_requirements=requirements,
                    retrieved_context=retrieval_result.chunks
                )
                gen_result = await generation_service.generate_proposal(gen_input)

                # Save generated proposal as an outgoing email (draft)
                outgoing_email = Email(
                    company_id=company_id,
                    proposal_id=proposal_id,
                    subject=f"Re: {subject}" if subject else "Proposal Response",
                    body=gen_result.content,
                    direction="OUTGOING"
                )
                db.add(outgoing_email)

                proposal.status = ProposalStatus.REVIEW_REQUIRED
                db.add(AuditLog(company_id=company_id, proposal_id=proposal_id, action="GENERATED", details="Proposal draft generated and requires review"))
                await db.commit()

            except Exception as e:
                logger.error(f"Error processing proposal {proposal_id}: {e}")
                proposal.status = ProposalStatus.FAILED
                db.add(AuditLog(company_id=company_id, proposal_id=proposal_id, action="FAILED", details=str(e)))
                await db.commit()

    @staticmethod
    async def approve_proposal(db: AsyncSession, proposal_id: UUID, company_id: UUID, review_data: ReviewCreate, user_id: UUID = None) -> Proposal:
        proposal = await ProposalService.get_proposal(db, proposal_id, company_id)
        if not proposal:
            raise ValueError("Proposal not found")
        if proposal.status != ProposalStatus.REVIEW_REQUIRED:
            raise ValueError(f"Proposal is in state {proposal.status}, cannot approve.")

        # Create review
        review = Review(
            company_id=company_id,
            proposal_id=proposal_id,
            reviewer_id=user_id,
            comments=review_data.comments,
            status="APPROVED"
        )
        db.add(review)

        proposal.status = ProposalStatus.APPROVED
        db.add(AuditLog(company_id=company_id, proposal_id=proposal_id, user_id=user_id, action="APPROVED"))
        await db.commit()
        await db.refresh(proposal)
        return proposal

    @staticmethod
    async def reject_proposal(db: AsyncSession, proposal_id: UUID, company_id: UUID, review_data: ReviewCreate, user_id: UUID = None) -> Proposal:
        proposal = await ProposalService.get_proposal(db, proposal_id, company_id)
        if not proposal:
            raise ValueError("Proposal not found")
        if proposal.status != ProposalStatus.REVIEW_REQUIRED:
            raise ValueError(f"Proposal is in state {proposal.status}, cannot reject.")

        review = Review(
            company_id=company_id,
            proposal_id=proposal_id,
            reviewer_id=user_id,
            comments=review_data.comments,
            status="REJECTED"
        )
        db.add(review)

        proposal.status = ProposalStatus.REJECTED
        db.add(AuditLog(company_id=company_id, proposal_id=proposal_id, user_id=user_id, action="REJECTED"))
        await db.commit()
        await db.refresh(proposal)
        return proposal
