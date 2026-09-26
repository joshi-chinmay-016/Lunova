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

from intelligence.service import IntelligenceService
from intelligence.models.proposal import ProposalContext
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
            direction="INCOMING",
            sender_address=data.sender_address,
            recipient_address=data.recipient_address
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

                # 1. Integration with Intelligence Layer
                context = ProposalContext(
                    proposal_id=str(proposal_id),
                    company_id=str(company_id),
                    subject=subject or "",
                    body=content or ""
                )
                
                from app.core.config import settings
                if settings.LLM_PROVIDER == "gemini":
                    from intelligence.providers.gemini import GeminiProvider
                    llm = GeminiProvider()
                elif settings.LLM_PROVIDER == "mock" and settings.ENVIRONMENT != "production":
                    from intelligence.providers.mock import MockLLMProvider
                    llm = MockLLMProvider()
                else:
                    raise ValueError(f"Unsupported or missing LLM_PROVIDER: {settings.LLM_PROVIDER}")

                if settings.EMBEDDING_PROVIDER == "gemini":
                    from intelligence.providers.gemini_embedding import GeminiEmbeddingProvider
                    emb = GeminiEmbeddingProvider()
                elif settings.EMBEDDING_PROVIDER == "mock" and settings.ENVIRONMENT != "production":
                    from intelligence.providers.mock import MockEmbeddingProvider
                    emb = MockEmbeddingProvider()
                else:
                    raise ValueError(f"Unsupported or missing EMBEDDING_PROVIDER: {settings.EMBEDDING_PROVIDER}")

                from app.platform.services.retriever_service import PlatformRetriever
                platform_retriever = PlatformRetriever(embedding_provider=emb, top_k=settings.RETRIEVAL_TOP_K)

                intelligence_service = IntelligenceService(
                    llm_provider=llm,
                    embedding_provider=emb,
                    retriever=platform_retriever
                )
                result = intelligence_service.analyze_proposal(context)

                proposal.status = ProposalStatus.ANALYZED
                db.add(AuditLog(company_id=company_id, proposal_id=proposal_id, action="ANALYZED", details=f"Confidence: {result.confidence.overall_score}"))

                # Save generated proposal as an outgoing email (draft)
                outgoing_email = Email(
                    company_id=company_id,
                    proposal_id=proposal_id,
                    subject=f"Re: {subject}" if subject else "Proposal Response",
                    body=result.generated_response,
                    direction="OUTGOING",
                    sender_address=email.recipient_address,
                    recipient_address=email.sender_address
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
