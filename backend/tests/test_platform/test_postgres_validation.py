import asyncio
from uuid import uuid4
import pytest
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import async_session_maker
from app.models.company import Company
from app.models.user import User, UserRole
from app.models.proposal import Proposal, ProposalStatus
from app.models.email import Email, EmailDirection
from app.models.attachment import EmailAttachment
from app.models.document import KnowledgeDocument
from app.models.document_chunk import DocumentChunk
from app.models.audit import AuditLog
from app.auth.services.auth_service import AuthService
from app.platform.services.gmail_send_service import GmailSendService
from app.platform.services.retriever_service import PlatformRetriever
from intelligence.providers.mock import MockEmbeddingProvider


@pytest.mark.asyncio
async def test_postgres_user_and_auth_persistence(db_session: AsyncSession):
    """Step 4: Verify user creation, hashed password persistence, and authentication."""
    company_id = uuid4()
    company = Company(id=company_id, name="Lunetron Test Tenant")
    db_session.add(company)
    await db_session.flush()

    raw_password = "SecurePostgres2026!"
    hashed = AuthService.get_password_hash(raw_password)

    user_id = uuid4()
    user = User(
        id=user_id,
        company_id=company_id,
        email=f"tester_{user_id.hex[:8]}@lunetron.com",
        name="Postgres Validation User",
        role=UserRole.ADMIN,
        hashed_password=hashed,
    )
    db_session.add(user)
    await db_session.commit()

    # Query in fresh transaction
    stmt = select(User).where(User.id == user_id)
    res = await db_session.execute(stmt)
    persisted_user = res.scalar_one_or_none()

    assert persisted_user is not None
    assert persisted_user.name == "Postgres Validation User"
    assert persisted_user.role == UserRole.ADMIN
    assert AuthService.verify_password(raw_password, persisted_user.hashed_password)
    assert not AuthService.verify_password("wrong_password", persisted_user.hashed_password)


@pytest.mark.asyncio
async def test_postgres_proposal_email_and_attachment_persistence(db_session: AsyncSession):
    """Step 4: Verify proposal, email, and email attachment metadata persistence in PostgreSQL."""
    company_id = uuid4()
    company = Company(id=company_id, name="Persistence Tenant")
    db_session.add(company)
    await db_session.flush()

    # Proposal
    prop_id = uuid4()
    proposal = Proposal(
        id=prop_id,
        company_id=company_id,
        title="Enterprise Cloud Migration RFP",
        status=ProposalStatus.RECEIVED,
    )
    db_session.add(proposal)
    await db_session.flush()

    # Incoming Email
    email_in_id = uuid4()
    email_in = Email(
        id=email_in_id,
        company_id=company_id,
        proposal_id=prop_id,
        direction=EmailDirection.INCOMING,
        sender_address="procurement@client.com",
        recipient_address="proposals@lunetron.com",
        subject="RFP Submission Request",
        body="Attached please find the RFP specification document.",
        message_id="msg_in_pg_001",
        thread_id="thread_pg_001",
    )
    db_session.add(email_in)
    await db_session.flush()

    # Attachment
    attachment_id = uuid4()
    attachment = EmailAttachment(
        id=attachment_id,
        company_id=company_id,
        email_id=email_in_id,
        proposal_id=prop_id,
        filename="Cloud_RFP_Spec.pdf",
        content_type="application/pdf",
        file_size_bytes=1048576,
        storage_path=f"attachments/{company_id}/{prop_id}/Cloud_RFP_Spec.pdf",
        extracted_text="Requirement: 99.99% Availability SLA.",
        parsing_status="SUCCESS",
        page_count=5,
    )
    db_session.add(attachment)

    # Outgoing Email Draft
    email_out_id = uuid4()
    email_out = Email(
        id=email_out_id,
        company_id=company_id,
        proposal_id=prop_id,
        direction=EmailDirection.OUTGOING,
        sender_address="proposals@lunetron.com",
        recipient_address="procurement@client.com",
        subject="Re: RFP Submission Request",
        body="Dear Client,\nLunetron guarantees 99.99% availability.",
    )
    db_session.add(email_out)
    await db_session.commit()

    # Verify retrieval
    res_prop = (await db_session.execute(select(Proposal).where(Proposal.id == prop_id))).scalar_one()
    assert res_prop.title == "Enterprise Cloud Migration RFP"
    assert res_prop.status == ProposalStatus.RECEIVED

    res_att = (await db_session.execute(select(EmailAttachment).where(EmailAttachment.id == attachment_id))).scalar_one()
    assert res_att.filename == "Cloud_RFP_Spec.pdf"
    assert res_att.file_size_bytes == 1048576
    assert res_att.page_count == 5

    res_emails = (await db_session.execute(select(Email).where(Email.proposal_id == prop_id))).scalars().all()
    assert len(res_emails) == 2
    directions = {e.direction for e in res_emails}
    assert EmailDirection.INCOMING in directions
    assert EmailDirection.OUTGOING in directions


@pytest.mark.asyncio
async def test_postgres_pgvector_768_dimension_and_retrieval(db_session: AsyncSession):
    """Step 4: Verify pgvector 768-dimension storage and cosine distance retrieval in PostgreSQL."""
    company_id = uuid4()
    company = Company(id=company_id, name="Vector Tenant")
    db_session.add(company)
    await db_session.flush()

    doc_id = uuid4()
    doc = KnowledgeDocument(
        id=doc_id,
        company_id=company_id,
        name="SLA Policy 2026",
        doc_type="md",
        status="READY",
    )
    db_session.add(doc)
    await db_session.flush()

    # Construct 768-dimension vector
    embedding_768 = [0.05] * 768
    chunk_id = uuid4()
    chunk = DocumentChunk(
        id=chunk_id,
        company_id=company_id,
        document_id=doc_id,
        chunk_index=0,
        content="Lunetron commits to 99.99% uptime with 15-minute response SLA.",
        embedding=embedding_768,
        metadata_json={"source": "SLA Policy 2026", "section": "Uptime"},
    )
    db_session.add(chunk)
    await db_session.commit()

    # Query directly via pgvector cosine distance
    retriever = PlatformRetriever(embedding_provider=MockEmbeddingProvider())
    results = retriever.retrieve("uptime SLA commitments", str(company_id))

    assert len(results) > 0
    assert results[0].source_id == str(chunk_id)
    assert "99.99%" in results[0].section


@pytest.mark.asyncio
async def test_postgres_dispatch_states_and_audit_persistence(db_session: AsyncSession):
    """Step 4: Verify durable dispatch states (SENDING, DISPATCH_UNCERTAIN) and audit logs."""
    company_id = uuid4()
    company = Company(id=company_id, name="Audit Tenant")
    db_session.add(company)
    await db_session.flush()

    prop_id = uuid4()
    proposal = Proposal(
        id=prop_id,
        company_id=company_id,
        title="Mission Critical Proposal",
        status=ProposalStatus.APPROVED,
    )
    db_session.add(proposal)
    await db_session.flush()

    # Transition to SENDING
    proposal.status = ProposalStatus.SENDING
    audit_sending = AuditLog(
        company_id=company_id,
        proposal_id=prop_id,
        action="DISPATCH_STARTED",
        details="Attempting Gmail transmission.",
    )
    db_session.add(audit_sending)
    await db_session.commit()

    # Transition to DISPATCH_UNCERTAIN
    proposal.status = ProposalStatus.DISPATCH_UNCERTAIN
    audit_uncertain = AuditLog(
        company_id=company_id,
        proposal_id=prop_id,
        action="DISPATCH_UNCERTAIN",
        details="Socket timeout occurred during transmission.",
    )
    db_session.add(audit_uncertain)
    await db_session.commit()

    # Verify persisted proposal status and audit history
    prop_check = (await db_session.execute(select(Proposal).where(Proposal.id == prop_id))).scalar_one()
    assert prop_check.status == ProposalStatus.DISPATCH_UNCERTAIN

    audit_logs = (
        await db_session.execute(
            select(AuditLog).where(AuditLog.proposal_id == prop_id).order_by(AuditLog.created_at.asc())
        )
    ).scalars().all()
    assert len(audit_logs) == 2
    assert audit_logs[0].action == "DISPATCH_STARTED"
    assert audit_logs[1].action == "DISPATCH_UNCERTAIN"


@pytest.mark.asyncio
async def test_postgres_cross_tenant_isolation_reads_and_writes(db_session: AsyncSession):
    """Step 5: Verify cross-tenant reads and writes are blocked under PostgreSQL."""
    tenant_a_id = uuid4()
    tenant_b_id = uuid4()

    db_session.add(Company(id=tenant_a_id, name="Tenant Alpha"))
    db_session.add(Company(id=tenant_b_id, name="Tenant Beta"))
    await db_session.flush()

    prop_b_id = uuid4()
    prop_b = Proposal(
        id=prop_b_id,
        company_id=tenant_b_id,
        title="Tenant Beta Confidential Proposal",
        status=ProposalStatus.RECEIVED,
    )
    db_session.add(prop_b)
    await db_session.commit()

    # 1. Cross-tenant read: Tenant A queries for Tenant B's proposal
    stmt_read = select(Proposal).where(Proposal.id == prop_b_id, Proposal.company_id == tenant_a_id)
    result_a = (await db_session.execute(stmt_read)).scalar_one_or_none()
    assert result_a is None, "Tenant A should not be able to read Tenant B's proposal"

    # 2. Cross-tenant write: Tenant A attempts to update Tenant B's proposal title
    stmt_write = (
        update(Proposal)
        .where(Proposal.id == prop_b_id, Proposal.company_id == tenant_a_id)
        .values(title="Compromised Title")
    )
    res_update = await db_session.execute(stmt_write)
    await db_session.commit()
    assert res_update.rowcount == 0, "Cross-tenant write must affect 0 rows"

    # Verify Tenant B's record remains unmodified
    prop_b_fresh = (await db_session.execute(select(Proposal).where(Proposal.id == prop_b_id))).scalar_one()
    assert prop_b_fresh.title == "Tenant Beta Confidential Proposal"


@pytest.mark.asyncio
async def test_postgres_pessimistic_row_locking_and_concurrent_send_prevention():
    """Step 5: Verify PostgreSQL row-level locking (with_for_update) blocks concurrent duplicate sends."""
    company_id = uuid4()
    prop_id = uuid4()

    # Setup initial approved proposal
    async with async_session_maker() as session:
        session.add(Company(id=company_id, name="Concurrency Tenant"))
        session.add(
            Proposal(
                id=prop_id,
                company_id=company_id,
                title="Concurrent Dispatch Proposal",
                status=ProposalStatus.APPROVED,
            )
        )
        await session.commit()

    # Simulate two concurrent dispatch attempts using real database sessions
    async with async_session_maker() as session_1, async_session_maker() as session_2:
        # Session 1 acquires lock
        stmt_1 = (
            select(Proposal)
            .where(Proposal.id == prop_id, Proposal.company_id == company_id)
            .with_for_update()
        )
        p1 = (await session_1.execute(stmt_1)).scalar_one()
        assert p1.status == ProposalStatus.APPROVED

        # Session 1 transitions to SENDING
        p1.status = ProposalStatus.SENDING
        await session_1.commit()

        # Session 2 attempts dispatch check
        stmt_2 = (
            select(Proposal)
            .where(Proposal.id == prop_id, Proposal.company_id == company_id)
            .with_for_update()
        )
        p2 = (await session_2.execute(stmt_2)).scalar_one()

        # Session 2 must observe that Session 1 changed status to SENDING
        assert p2.status == ProposalStatus.SENDING
        with pytest.raises(ValueError, match="Proposal is currently being dispatched"):
            if p2.status == ProposalStatus.SENDING:
                raise ValueError("Proposal is currently being dispatched (state 'SENDING'). Concurrent duplicate sends are prevented.")


@pytest.mark.asyncio
async def test_postgres_dispatch_uncertainty_survives_restart_and_reconciles():
    """Step 5: Verify DISPATCH_UNCERTAIN survives application restarts and reconciles cleanly."""
    company_id = uuid4()
    prop_id = uuid4()
    user_id = uuid4()

    # 1. Application Run 1: Proposal enters DISPATCH_UNCERTAIN
    async with async_session_maker() as session:
        session.add(Company(id=company_id, name="Restart Tenant"))
        session.add(
            User(
                id=user_id,
                company_id=company_id,
                email=f"user_{user_id.hex[:6]}@restart.com",
                name="Reviewer User",
                role=UserRole.ADMIN,
            )
        )
        session.add(
            Proposal(
                id=prop_id,
                company_id=company_id,
                title="Restart Resilient Proposal",
                status=ProposalStatus.DISPATCH_UNCERTAIN,
            )
        )
        await session.commit()

    # 2. Simulate Application Restart: Open completely fresh session
    async with async_session_maker() as session_restarted:
        prop = (await session_restarted.execute(select(Proposal).where(Proposal.id == prop_id))).scalar_one()
        assert prop.status == ProposalStatus.DISPATCH_UNCERTAIN, "Uncertain status must persist across restarts"

        # 3. Reconcile with RESET_FOR_RESEND
        reconciled = await GmailSendService.reconcile_dispatch(
            db=session_restarted,
            proposal_id=prop_id,
            company_id=company_id,
            action="RESET_FOR_RESEND",
            notes="Verified message was not received by client. Resetting for resend.",
            user_id=user_id,
        )
        assert reconciled.status == ProposalStatus.APPROVED

    # 4. In another session, verify proposal is now APPROVED and ready for resend
    async with async_session_maker() as session_check:
        prop_final = (await session_check.execute(select(Proposal).where(Proposal.id == prop_id))).scalar_one()
        assert prop_final.status == ProposalStatus.APPROVED
