import asyncio
import logging
import time
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.proposal import Proposal, ProposalStatus
from app.models.email import Email, EmailDirection
from app.models.review import Review
from app.models.audit import AuditLog
from app.models.attachment import EmailAttachment
from app.platform.schemas.proposal import ProposalCreate
from app.platform.schemas.review import ReviewCreate
from app.core.database import async_session_maker
from app.core.config import settings

from intelligence.service import IntelligenceService
from intelligence.models.proposal import ProposalContext, ParsedAttachment

logger = logging.getLogger(__name__)


def serialize_for_json(val):
    if val is None:
        return None
    if isinstance(val, (int, float, str, bool)):
        return val
    if isinstance(val, list):
        return [serialize_for_json(x) for x in val]
    if isinstance(val, dict):
        return {k: serialize_for_json(v) for k, v in val.items()}
    if hasattr(val, "model_dump"):
        return serialize_for_json(val.model_dump())
    if hasattr(val, "to_dict"):
        return serialize_for_json(val.to_dict())
    if hasattr(val, "__dict__"):
        return {k: serialize_for_json(v) for k, v in val.__dict__.items() if not k.startswith("_")}
    return str(val)


VALID_REVIEW_STATUSES = (
    ProposalStatus.REVIEW_REQUIRED,
    ProposalStatus.NEEDS_ADMIN_REVIEW,
    ProposalStatus.DRAFT_GENERATED,
    ProposalStatus.NEEDS_INFORMATION,
    ProposalStatus.ANALYZED,
    ProposalStatus.FAILED,
)


class ProposalService:
    @staticmethod
    def get_llm_provider():
        from app.core.config import settings
        name = (settings.LLM_PROVIDER or "").strip().lower()
        if name == "gemini":
            from intelligence.providers.gemini import GeminiProvider
            return GeminiProvider()
        elif name in ("mock", "fake"):
            if settings.ENVIRONMENT == "production":
                raise ValueError(f"Mock provider '{settings.LLM_PROVIDER}' is not permitted in production environment.")
            from intelligence.providers.mock import MockLLMProvider
            return MockLLMProvider()
        else:
            raise ValueError(f"Unsupported or missing LLM_PROVIDER: {settings.LLM_PROVIDER}")

    @staticmethod
    def get_embedding_provider():
        from app.core.config import settings
        name = (settings.EMBEDDING_PROVIDER or "").strip().lower()
        if name == "gemini":
            from intelligence.providers.gemini_embedding import GeminiEmbeddingProvider
            return GeminiEmbeddingProvider()
        elif name in ("mock", "fake"):
            if settings.ENVIRONMENT == "production":
                raise ValueError(f"Mock provider '{settings.EMBEDDING_PROVIDER}' is not permitted in production environment.")
            from intelligence.providers.mock import MockEmbeddingProvider
            return MockEmbeddingProvider()
        else:
            raise ValueError(f"Unsupported or missing EMBEDDING_PROVIDER: {settings.EMBEDDING_PROVIDER}")

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
            status=ProposalStatus.RECEIVED,
        )
        db.add(proposal)
        await db.flush()

        # Create incoming Email record
        email = Email(
            company_id=company_id,
            proposal_id=proposal.id,
            subject=data.subject,
            body=data.content,
            direction=EmailDirection.INCOMING,
            sender_address=data.sender_address,
            recipient_address=data.recipient_address,
        )
        db.add(email)

        # Audit log
        audit = AuditLog(
            company_id=company_id,
            proposal_id=proposal.id,
            action="CREATED",
            details="Proposal created from input",
        )
        db.add(audit)

        await db.commit()
        await db.refresh(proposal)
        return proposal

    @staticmethod
    async def process_proposal_bg(proposal_id: UUID, company_id: UUID):
        async with async_session_maker() as db:
            proposal = await ProposalService.get_proposal(db, proposal_id, company_id)
            if not proposal or proposal.status not in (ProposalStatus.RECEIVED, ProposalStatus.PROCESSING):
                return

            try:
                # Update status
                proposal.status = ProposalStatus.PROCESSING
                db.add(AuditLog(company_id=company_id, proposal_id=proposal_id, action="PROCESSING_STARTED"))
                await db.commit()

                # Gather incoming email content and thread history
                stmt = select(Email).filter(
                    Email.proposal_id == proposal_id,
                    Email.direction == EmailDirection.INCOMING,
                ).order_by(Email.created_at.asc())
                result = await db.execute(stmt)
                scalars_res = result.scalars()

                # Handle test mocks where scalars() returns either first() or all()
                email_list = []
                if hasattr(scalars_res, "all"):
                    try:
                        email_list = list(scalars_res.all())
                    except Exception:
                        email_list = []
                if not email_list and hasattr(scalars_res, "first"):
                    single_email = scalars_res.first()
                    if single_email:
                        email_list = [single_email]

                if not email_list:
                    raise Exception("No incoming email found for proposal")

                latest_email = email_list[-1]
                if len(email_list) > 1:
                    thread_parts = []
                    for idx, em in enumerate(email_list, 1):
                        thread_parts.append(
                            f"[Thread Message {idx} from {em.sender_address} at {em.created_at}]:\n{em.body or ''}"
                        )
                    content = "\n\n".join(thread_parts)
                else:
                    content = latest_email.body or ""

                subject = latest_email.subject

                # Load attachments for this proposal
                stmt_att = select(EmailAttachment).filter(
                    EmailAttachment.proposal_id == proposal_id,
                    EmailAttachment.company_id == company_id,
                )
                att_results = (await db.execute(stmt_att)).scalars().all()
                parsed_attachments = []
                for att in att_results:
                    if att.parsing_status == "SUCCESS" and att.extracted_text:
                        parsed_attachments.append(
                            ParsedAttachment(
                                filename=att.filename,
                                content_type=att.content_type,
                                extracted_text=att.extracted_text,
                                status=att.parsing_status,
                                page_count=att.page_count,
                            )
                        )

                # 1. Integration with Intelligence Layer
                context = ProposalContext(
                    proposal_id=str(proposal_id),
                    company_id=str(company_id),
                    subject=subject or "",
                    body=content or "",
                    attachments=parsed_attachments,
                )

                llm = ProposalService.get_llm_provider()
                emb = ProposalService.get_embedding_provider()

                from app.platform.services.retriever_service import PlatformRetriever
                platform_retriever = PlatformRetriever(embedding_provider=emb, top_k=settings.RETRIEVAL_TOP_K)

                intelligence_service = IntelligenceService(
                    llm_provider=llm,
                    embedding_provider=emb,
                    retriever=platform_retriever,
                )
                ai_start = time.perf_counter()
                result = await asyncio.to_thread(intelligence_service.analyze_proposal, context)
                ai_duration_ms = (time.perf_counter() - ai_start) * 1000

                logger.info(
                    "Stage B Request Processing Completed: proposal_id=%s, company_id=%s, "
                    "requirements=%d, sources=%d, confidence=%s, duration_ms=%.1f",
                    proposal_id,
                    company_id,
                    len(result.requirements),
                    len(result.retrieved_sources),
                    getattr(result.confidence, "overall_score", "N/A"),
                    ai_duration_ms,
                )

                # 2. Persist full intelligence results to Proposal model
                proposal.requirements = serialize_for_json(result.requirements)
                proposal.sources = serialize_for_json(result.retrieved_sources)
                proposal.generated_response = serialize_for_json(result.generated_response)
                proposal.confidence = serialize_for_json(result.confidence)
                proposal.missing_information = serialize_for_json(result.missing_information)
                proposal.clarification_questions = serialize_for_json(result.clarification_questions)

                # 3. Save or update generated proposal as an outgoing email (draft)
                draft_body = ""
                draft_subject = f"Re: {subject}" if subject else "Proposal Response"
                if result.generated_response:
                    if hasattr(result.generated_response, "draft_email_body"):
                        draft_body = result.generated_response.draft_email_body or ""
                    elif isinstance(result.generated_response, str):
                        draft_body = result.generated_response
                    if getattr(result.generated_response, "subject_line", None):
                        draft_subject = result.generated_response.subject_line

                stmt_draft = select(Email).filter(
                    Email.proposal_id == proposal_id,
                    Email.direction == EmailDirection.OUTGOING,
                )
                existing_draft = (await db.execute(stmt_draft)).scalars().first()
                if existing_draft:
                    existing_draft.subject = draft_subject
                    existing_draft.body = draft_body
                else:
                    outgoing_email = Email(
                        company_id=company_id,
                        proposal_id=proposal_id,
                        email_account_id=latest_email.email_account_id,
                        thread_id=latest_email.thread_id,
                        subject=draft_subject,
                        body=draft_body,
                        direction=EmailDirection.OUTGOING,
                        sender_address=latest_email.recipient_address,
                        recipient_address=latest_email.sender_address,
                    )
                    db.add(outgoing_email)

                # 4. Set status for human review
                proposal.status = ProposalStatus.REVIEW_REQUIRED

                db.add(AuditLog(
                    company_id=company_id,
                    proposal_id=proposal_id,
                    action="GENERATED",
                    details=f"Proposal draft generated in {round(ai_duration_ms, 1)}ms. Confidence: {result.confidence.overall_score if result.confidence else 'N/A'}"
                ))
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
        # Idempotent approval: if already approved, return without error
        if proposal.status == ProposalStatus.APPROVED:
            return proposal
        if proposal.status not in VALID_REVIEW_STATUSES:
            raise ValueError(f"Proposal is in state {proposal.status}, cannot approve.")

        # Create review
        review = Review(
            company_id=company_id,
            proposal_id=proposal_id,
            reviewer_id=user_id,
            comments=review_data.comments,
            status="APPROVED",
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
        if proposal.status not in VALID_REVIEW_STATUSES:
            raise ValueError(f"Proposal is in state {proposal.status}, cannot reject.")

        review = Review(
            company_id=company_id,
            proposal_id=proposal_id,
            reviewer_id=user_id,
            comments=review_data.comments,
            status="REJECTED",
        )
        db.add(review)

        proposal.status = ProposalStatus.REJECTED
        db.add(AuditLog(company_id=company_id, proposal_id=proposal_id, user_id=user_id, action="REJECTED"))
        await db.commit()
        await db.refresh(proposal)
        return proposal

    @staticmethod
    async def update_proposal_draft(
        db: AsyncSession,
        proposal_id: UUID,
        company_id: UUID,
        subject: Optional[str],
        body: str,
        user_id: Optional[UUID] = None,
    ) -> Proposal:
        proposal = await ProposalService.get_proposal(db, proposal_id, company_id)
        if not proposal:
            raise ValueError("Proposal not found")

        stmt_out = select(Email).filter(
            Email.proposal_id == proposal_id,
            Email.direction == EmailDirection.OUTGOING,
        )
        outgoing_email = (await db.execute(stmt_out)).scalars().first()
        if not outgoing_email:
            stmt_in = select(Email).filter(
                Email.proposal_id == proposal_id,
                Email.direction == EmailDirection.INCOMING,
            ).order_by(Email.created_at.asc())
            incoming = (await db.execute(stmt_in)).scalars().first()
            outgoing_email = Email(
                company_id=company_id,
                proposal_id=proposal_id,
                email_account_id=incoming.email_account_id if incoming else None,
                thread_id=incoming.thread_id if incoming else None,
                subject=subject or (f"Re: {incoming.subject}" if incoming else "Proposal Response"),
                body=body,
                direction=EmailDirection.OUTGOING,
                sender_address=incoming.recipient_address if incoming else "",
                recipient_address=incoming.sender_address if incoming else "",
            )
            db.add(outgoing_email)
        else:
            if subject is not None:
                outgoing_email.subject = subject
            outgoing_email.body = body

        # Update stored draft in generated_response
        gen_resp = proposal.generated_response or {}
        if isinstance(gen_resp, dict):
            gen_resp["draft_email_body"] = body
            if subject:
                gen_resp["subject_line"] = subject
            proposal.generated_response = gen_resp

        # IMPORTANT: If proposal was previously APPROVED, editing resets approval to review state
        was_approved = proposal.status == ProposalStatus.APPROVED
        proposal.status = ProposalStatus.REVIEW_REQUIRED
        proposal.updated_at = datetime.now(timezone.utc)

        audit_msg = "Draft updated by reviewer."
        if was_approved:
            audit_msg += " Prior approval was invalidated due to manual draft modifications."

        db.add(AuditLog(
            company_id=company_id,
            proposal_id=proposal_id,
            user_id=user_id,
            action="DRAFT_EDITED",
            details=audit_msg,
        ))

        await db.commit()
        await db.refresh(proposal)
        return proposal

    @staticmethod
    async def get_proposal_detail(
        db: AsyncSession,
        proposal_id: UUID,
        company_id: UUID,
    ) -> dict:
        proposal = await ProposalService.get_proposal(db, proposal_id, company_id)
        if not proposal:
            raise ValueError("Proposal not found")

        # Incoming email
        stmt_in = select(Email).filter(
            Email.proposal_id == proposal_id,
            Email.direction == EmailDirection.INCOMING,
        ).order_by(Email.created_at.asc())
        incoming_emails = (await db.execute(stmt_in)).scalars().all()
        incoming = incoming_emails[0] if incoming_emails else None

        # Outgoing draft email
        stmt_out = select(Email).filter(
            Email.proposal_id == proposal_id,
            Email.direction == EmailDirection.OUTGOING,
        ).order_by(Email.created_at.desc())
        outgoing = (await db.execute(stmt_out)).scalars().first()

        # Attachments
        stmt_att = select(EmailAttachment).filter(
            EmailAttachment.proposal_id == proposal_id,
            EmailAttachment.company_id == company_id,
        )
        attachments = (await db.execute(stmt_att)).scalars().all()

        return {
            "id": proposal.id,
            "company_id": proposal.company_id,
            "title": proposal.title,
            "status": proposal.status,
            "classification": proposal.classification or "CUSTOMER_REQUEST",
            "requirements": proposal.requirements,
            "sources": proposal.sources,
            "generated_response": proposal.generated_response,
            "confidence": proposal.confidence,
            "missing_information": proposal.missing_information,
            "clarification_questions": proposal.clarification_questions,
            "created_at": proposal.created_at,
            "updated_at": proposal.updated_at,
            "incoming_email": incoming,
            "outgoing_email": outgoing,
            "attachments": attachments,
        }

    @staticmethod
    async def get_response_center_metrics(
        db: AsyncSession,
        company_id: UUID,
    ) -> dict:
        stmt_proposals = select(Proposal).filter(Proposal.company_id == company_id)
        proposals = (await db.execute(stmt_proposals)).scalars().all()

        stmt_emails = select(Email).filter(
            Email.company_id == company_id,
            Email.direction == EmailDirection.INCOMING,
        )
        emails = (await db.execute(stmt_emails)).scalars().all()

        total_inbox = len(emails)
        customer_requests = sum(1 for p in proposals if p.classification in ("CUSTOMER_REQUEST", "GENERAL_INQUIRY", "FOLLOW_UP"))
        drafts_generated = sum(1 for p in proposals if p.generated_response is not None)
        awaiting_review = sum(1 for p in proposals if p.status in (ProposalStatus.REVIEW_REQUIRED, ProposalStatus.NEEDS_ADMIN_REVIEW, ProposalStatus.DRAFT_GENERATED))
        approved = sum(1 for p in proposals if p.status == ProposalStatus.APPROVED)
        sent = sum(1 for p in proposals if p.status == ProposalStatus.SENT)
        needs_info = sum(1 for p in proposals if p.status == ProposalStatus.NEEDS_INFORMATION or (p.missing_information and len(p.missing_information) > 0))

        return {
            "total_inbox": total_inbox,
            "customer_requests": customer_requests,
            "drafts_generated": drafts_generated,
            "awaiting_review": awaiting_review,
            "approved": approved,
            "sent": sent,
            "needs_info": needs_info,
        }
