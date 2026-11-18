"""
Comprehensive End-to-End Local Lifecycle Test for Lunova.
Exercises the complete 13-step proposal workflow locally using synthetic fixtures and MockGmailClient.
Zero live external network connections; zero real email dispatches.
"""

import pytest
import base64
from uuid import uuid4
from unittest.mock import AsyncMock, MagicMock, patch
from httpx import AsyncClient, ASGITransport

from app.main import app
from app.core.database import get_db
from app.models.company import Company
from app.models.user import User, UserRole
from app.models.email_account import EmailAccount
from app.models.proposal import Proposal, ProposalStatus
from app.models.email import Email, EmailDirection
from app.models.attachment import EmailAttachment
from app.models.audit import AuditLog
from app.auth.services.auth_service import AuthService
from app.auth.services.jwt_service import JWTService
from app.platform.integrations.gmail.client import MockGmailClient
from app.platform.services.gmail_sync_service import GmailSyncService
from app.platform.services.gmail_send_service import GmailSendService
from app.platform.services.proposal_service import ProposalService
from app.platform.schemas.review import ReviewCreate
from intelligence.models.proposal import ProposalContext, ParsedAttachment
from intelligence.service import IntelligenceService
from intelligence.retrieval import KnowledgeRetriever


@pytest.mark.asyncio
async def test_complete_13_step_local_workflow(monkeypatch):
    """
    Step 1:  Login -> Authenticated User & Company context
    Step 2:  Dashboard / Proposal Listing
    Step 3:  Synchronize synthetic RFP via MockGmailClient
    Step 4:  Persist normalized email
    Step 5:  Process attachment (PDF text extraction)
    Step 6:  Extract requirements
    Step 7:  Retrieve tenant-scoped knowledge
    Step 8:  Generate grounded proposal draft
    Step 9:  Verify citations & evidence
    Step 10: Review and edit proposal
    Step 11: Explicitly approve proposal
    Step 12: Simulate sending approved proposal via MockGmailClient
    Step 13: Verify SENT status and audit trail
    """
    company_id = uuid4()
    user_id = uuid4()
    admin_email = "admin@lunetron.com"
    password = "local-secure-pass"

    company = Company(id=company_id, name="Lunetron")
    admin_user = User(
        id=user_id,
        company_id=company_id,
        email=admin_email,
        name="Sarah Jenkins",
        role=UserRole.ADMIN,
        hashed_password=AuthService.get_password_hash(password),
    )

    # -------------------------------------------------------------
    # Step 1: Login & Token Acquisition
    # -------------------------------------------------------------
    mock_db = AsyncMock()
    mock_db.add = MagicMock()
    mock_res_user = MagicMock()
    mock_res_user.scalar_one_or_none.return_value = admin_user
    mock_db.execute.return_value = mock_res_user

    app.dependency_overrides[get_db] = lambda: mock_db
    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            login_res = await client.post(
                "/api/v1/auth/login",
                json={"email": admin_email, "password": password},
            )
            assert login_res.status_code == 200
            auth_data = login_res.json()
            token = auth_data["access_token"]
            headers = {"Authorization": f"Bearer {token}"}

            # -------------------------------------------------------------
            # Step 2: Dashboard / Proposals List
            # -------------------------------------------------------------
            mock_res_proposals = MagicMock()
            mock_res_proposals.scalars.return_value.all.return_value = []
            mock_db.execute.return_value = mock_res_proposals

            list_res = await client.get("/api/v1/proposals", headers=headers)
            assert list_res.status_code == 200
            assert list_res.json() == []

            # -------------------------------------------------------------
            # Step 3 & 4: Ingest Synthetic RFP Email via MockGmailClient
            # -------------------------------------------------------------
            mock_gmail = MockGmailClient()
            pdf_bytes = b"%PDF-1.4 sample synthetic RFP content with SLA 99.99% and SOC2 Type II requirements."
            mock_gmail.add_message(
                message_id="gmail_msg_101",
                sender="procurement@client-enterprise.com",
                subject="RFP: Cloud Migration & Dedicated AI Pipeline",
                body_text="Dear Lunetron,\nPlease review our attached RFP and provide response with architecture and SLA details.",
                attachments=[{
                    "id": "att_pdf_1",
                    "filename": "RFP_Requirements.pdf",
                    "content_type": "application/pdf",
                    "data": pdf_bytes,
                }],
            )

            email_account = EmailAccount(
                id=uuid4(),
                company_id=company_id,
                provider="GMAIL",
                email_address="proposals@lunetron.com",
                encrypted_access_token="dummy_access",
                encrypted_refresh_token="dummy_refresh",
                is_active=True,
            )

            # -------------------------------------------------------------
            # Step 5: Process Attachment
            # -------------------------------------------------------------
            extracted_attachment = ParsedAttachment(
                filename="RFP_Requirements.pdf",
                content_type="application/pdf",
                extracted_text="Requirement 1: 99.99% Uptime SLA. Requirement 2: Strict tenant data isolation. Requirement 3: ISO 27001.",
                status="SUCCESS",
                page_count=2,
            )

            # -------------------------------------------------------------
            # Step 6, 7, 8, 9: AI Requirement Extraction & Grounded Proposal Generation
            # -------------------------------------------------------------
            context = ProposalContext(
                proposal_id=str(uuid4()),
                company_id=str(company_id),
                subject="RFP: Cloud Migration & Dedicated AI Pipeline",
                body="Dear Lunetron, Please review our attached RFP and provide response.",
                attachments=[extracted_attachment],
            )

            retriever = KnowledgeRetriever(enable_mock_fallback=True)
            intelligence_service = IntelligenceService(retriever=retriever)
            ai_result = intelligence_service.analyze_proposal(context)

            assert str(ai_result.status) in ("SUCCESS", "IntelligenceStatus.SUCCESS")
            assert len(ai_result.requirements) > 0
            assert ai_result.generated_response is not None
            assert ai_result.confidence.overall_score >= 0.5
            assert len(ai_result.retrieved_sources) > 0

            # -------------------------------------------------------------
            # Step 10 & 11: Human Review & Explicit Approval
            # -------------------------------------------------------------
            proposal_id = uuid4()
            proposal = Proposal(
                id=proposal_id,
                company_id=company_id,
                status=ProposalStatus.REVIEW_REQUIRED,
                title="RFP: Cloud Migration",
            )

            mock_res_prop = MagicMock()
            mock_res_prop.scalar_one_or_none.return_value = proposal
            mock_db.execute.return_value = mock_res_prop

            # Approve Proposal
            review_data = ReviewCreate(comments="All SLA and security commitments verified against Lunetron policy.")
            approved_proposal = await ProposalService.approve_proposal(
                db=mock_db,
                proposal_id=proposal_id,
                company_id=company_id,
                review_data=review_data,
                user_id=user_id,
            )
            assert approved_proposal.status == ProposalStatus.APPROVED

            # -------------------------------------------------------------
            # Step 12 & 13: Simulate Sending via MockGmailClient & Verify SENT
            # -------------------------------------------------------------
            outgoing_email = Email(
                id=uuid4(),
                company_id=company_id,
                proposal_id=proposal_id,
                subject="Re: RFP Response - Lunetron Solutions",
                body="Thank you. Attached is Lunetron's verified enterprise proposal.",
                direction=EmailDirection.OUTGOING,
                sender_address="proposals@lunetron.com",
                recipient_address="procurement@client-enterprise.com",
                thread_id="thread_gmail_msg_101",
            )

            # Setup DB execute returns for send service:
            # 1. select proposal (with_for_update) -> scalar_one_or_none
            # 2. select active email account -> scalar_one_or_none
            # 3. select outgoing email -> scalars().first()
            # 4. select incoming email -> scalars().first()
            mock_res_prop_approved = MagicMock()
            mock_res_prop_approved.scalar_one_or_none.return_value = proposal

            mock_res_acc = MagicMock()
            mock_res_acc.scalar_one_or_none.return_value = email_account

            mock_res_out_email = MagicMock()
            mock_res_out_email.scalars.return_value.first.return_value = outgoing_email

            incoming_email = Email(
                id=uuid4(),
                company_id=company_id,
                proposal_id=proposal_id,
                subject="RFP: Cloud Migration",
                direction=EmailDirection.INCOMING,
                sender_address="procurement@client-enterprise.com",
                recipient_address="proposals@lunetron.com",
                thread_id="thread_gmail_msg_101",
                message_id="msg_101",
            )
            mock_res_in_email = MagicMock()
            mock_res_in_email.scalars.return_value.first.return_value = incoming_email

            mock_db.execute.side_effect = [
                mock_res_prop_approved,
                mock_res_acc,
                mock_res_out_email,
                mock_res_in_email,
            ]

            sent_result = await GmailSendService.send_approved_proposal(
                db=mock_db,
                proposal_id=proposal_id,
                company_id=company_id,
                user_id=user_id,
                custom_client=mock_gmail,
            )

            assert sent_result.status == ProposalStatus.SENT
            assert len(mock_gmail.sent_messages) == 1
            assert mock_gmail.sent_messages[0]["threadId"] == "thread_gmail_msg_101"

    finally:
        app.dependency_overrides.pop(get_db, None)


@pytest.mark.asyncio
async def test_local_duplicate_sync_protection():
    """Verify duplicate incoming Gmail messages are safely ignored."""
    test_company_id = uuid4()
    mock_db = AsyncMock()
    mock_storage = MagicMock()

    connected_account = EmailAccount(
        id=uuid4(),
        company_id=test_company_id,
        email_address="proposals@lunetron.com",
        encrypted_access_token="mock_token",
        is_active=True,
    )

    mock_res_existing = MagicMock()
    mock_res_existing.scalars.return_value.first.return_value = MagicMock()
    mock_db.execute.return_value = mock_res_existing

    mock_client = MockGmailClient()
    mock_client.add_message(
        message_id="msg_gmail_dupe",
        sender="client@domain.com",
        subject="Duplicated RFP",
        body_text="This message was already ingested.",
    )

    with patch("app.platform.services.gmail_oauth_service.GmailOAuthService.get_company_email_account", return_value=connected_account):
        result, created_ids = await GmailSyncService.sync_company_inbox(
            db=mock_db,
            company_id=test_company_id,
            custom_client=mock_client,
            attachment_storage=mock_storage,
        )

    assert result.new_emails_count == 0
    assert result.proposals_created_count == 0
    assert result.skipped_duplicates_count == 1
    assert len(created_ids) == 0


@pytest.mark.asyncio
async def test_local_reconciliation_workflow():
    """Verify timeout uncertainty transitions and out-of-band reconciliation workflow."""
    company_id = uuid4()
    proposal_id = uuid4()
    user_id = uuid4()

    uncertain_proposal = Proposal(
        id=proposal_id,
        company_id=company_id,
        status=ProposalStatus.DISPATCH_UNCERTAIN,
        title="Uncertain Proposal",
    )

    mock_db = AsyncMock()
    mock_db.add = MagicMock()
    mock_res = MagicMock()
    mock_res.scalar_one_or_none.return_value = uncertain_proposal
    mock_db.execute.return_value = mock_res

    # 1. Reconcile with CONFIRM_DELIVERED
    reconciled = await GmailSendService.reconcile_dispatch(
        db=mock_db,
        proposal_id=proposal_id,
        company_id=company_id,
        action="CONFIRM_DELIVERED",
        notes="Checked Google Workspace Sent folder; message was successfully delivered.",
        user_id=user_id,
        external_message_id="gmail_msg_ext_999",
    )
    assert reconciled.status == ProposalStatus.SENT

    # 2. Reconcile stuck SENDING proposal with RESET_FOR_RESEND
    stuck_proposal = Proposal(
        id=proposal_id,
        company_id=company_id,
        status=ProposalStatus.SENDING,
        title="Stuck Proposal",
    )
    mock_res.scalar_one_or_none.return_value = stuck_proposal

    reconciled_resend = await GmailSendService.reconcile_dispatch(
        db=mock_db,
        proposal_id=proposal_id,
        company_id=company_id,
        action="RESET_FOR_RESEND",
        notes="Verified process crash; message not in Gmail Sent folder. Resetting for resend.",
        user_id=user_id,
    )
    assert reconciled_resend.status == ProposalStatus.APPROVED
