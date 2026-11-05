from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4
import pytest

from app.models.audit import AuditLog
from app.models.email import Email, EmailDirection
from app.models.email_account import EmailAccount, EmailProvider
from app.models.proposal import Proposal, ProposalStatus
from app.platform.integrations.gmail.client import MockGmailClient
from app.platform.services.gmail_send_service import GmailSendService


@pytest.fixture
def test_company_id():
    return uuid4()


@pytest.fixture
def test_proposal_id():
    return uuid4()


@pytest.fixture
def connected_account(test_company_id):
    return EmailAccount(
        company_id=test_company_id,
        provider=EmailProvider.GMAIL.value,
        email_address="proposals@lunetron.com",
        encrypted_access_token="encrypted_token_data",
        is_active=True,
    )


@pytest.fixture
def incoming_email(test_company_id, test_proposal_id):
    return Email(
        company_id=test_company_id,
        proposal_id=test_proposal_id,
        direction=EmailDirection.INCOMING,
        sender_address="client@enterprise.com",
        recipient_address="proposals@lunetron.com",
        subject="RFP Submission Inquiry",
        body="Initial RFP request body",
        message_id="msg_incoming_001",
        thread_id="thread_inquiry_001",
    )


@pytest.fixture
def outgoing_draft_email(test_company_id, test_proposal_id):
    return Email(
        company_id=test_company_id,
        proposal_id=test_proposal_id,
        direction=EmailDirection.OUTGOING,
        sender_address="proposals@lunetron.com",
        recipient_address="client@enterprise.com",
        subject="Re: RFP Submission Inquiry",
        body="Dear Client, please find our verified proposal response below...",
    )


@pytest.mark.asyncio
async def test_send_approved_proposal_success(
    test_company_id,
    test_proposal_id,
    connected_account,
    incoming_email,
    outgoing_draft_email,
):
    mock_db = AsyncMock()
    mock_db.add = MagicMock()

    proposal = Proposal(
        id=test_proposal_id,
        company_id=test_company_id,
        title="RFP Submission Inquiry",
        status=ProposalStatus.APPROVED,
    )

    # 1. Proposal lookup returns approved proposal
    mock_p_res = MagicMock()
    mock_p_res.scalar_one_or_none.return_value = proposal

    # 2. Outgoing draft lookup
    mock_out_res = MagicMock()
    mock_out_res.scalars.return_value.first.return_value = outgoing_draft_email

    # 3. Incoming email lookup
    mock_in_res = MagicMock()
    mock_in_res.scalars.return_value.first.return_value = incoming_email

    mock_db.execute.side_effect = [mock_p_res, mock_out_res, mock_in_res]

    mock_client = MockGmailClient()

    with patch(
        "app.platform.services.gmail_oauth_service.GmailOAuthService.get_company_email_account",
        return_value=connected_account,
    ):
        updated_proposal = await GmailSendService.send_approved_proposal(
            db=mock_db,
            proposal_id=test_proposal_id,
            company_id=test_company_id,
            custom_client=mock_client,
        )

    # Verify status changed to SENT
    assert updated_proposal.status == ProposalStatus.SENT

    # Verify message was sent via client
    assert len(mock_client.sent_messages) == 1
    sent_record = mock_client.sent_messages[0]
    assert sent_record["threadId"] == "thread_inquiry_001"

    # Verify outgoing email record was updated with sent message id
    assert outgoing_draft_email.message_id is not None
    assert outgoing_draft_email.message_id.startswith("sent_")

    # Verify audit log recorded
    added_objs = [call[0][0] for call in mock_db.add.call_args_list]
    audit_logs = [obj for obj in added_objs if isinstance(obj, AuditLog)]
    assert any(obj.action == "DISPATCHED" for obj in audit_logs)

    assert mock_db.commit.called


@pytest.mark.asyncio
async def test_send_unapproved_proposal_is_blocked(test_company_id, test_proposal_id):
    mock_db = AsyncMock()

    # Proposal is in REVIEW_REQUIRED state (not yet approved!)
    proposal = Proposal(
        id=test_proposal_id,
        company_id=test_company_id,
        status=ProposalStatus.REVIEW_REQUIRED,
    )

    mock_p_res = MagicMock()
    mock_p_res.scalar_one_or_none.return_value = proposal
    mock_db.execute.return_value = mock_p_res

    with pytest.raises(ValueError, match="Only 'APPROVED' proposals can be sent"):
        await GmailSendService.send_approved_proposal(
            db=mock_db,
            proposal_id=test_proposal_id,
            company_id=test_company_id,
            custom_client=MockGmailClient(),
        )


@pytest.mark.asyncio
async def test_duplicate_send_protection(test_company_id, test_proposal_id):
    mock_db = AsyncMock()

    # Proposal has ALREADY been sent
    proposal = Proposal(
        id=test_proposal_id,
        company_id=test_company_id,
        status=ProposalStatus.SENT,
    )

    mock_p_res = MagicMock()
    mock_p_res.scalar_one_or_none.return_value = proposal
    mock_db.execute.return_value = mock_p_res

    with pytest.raises(ValueError, match="Proposal has already been dispatched"):
        await GmailSendService.send_approved_proposal(
            db=mock_db,
            proposal_id=test_proposal_id,
            company_id=test_company_id,
            custom_client=MockGmailClient(),
        )


@pytest.mark.asyncio
async def test_send_fails_safely_on_api_error(
    test_company_id,
    test_proposal_id,
    connected_account,
    incoming_email,
    outgoing_draft_email,
):
    mock_db = AsyncMock()
    mock_db.add = MagicMock()

    proposal = Proposal(
        id=test_proposal_id,
        company_id=test_company_id,
        status=ProposalStatus.APPROVED,
    )

    mock_p_res = MagicMock()
    mock_p_res.scalar_one_or_none.return_value = proposal
    mock_out_res = MagicMock()
    mock_out_res.scalars.return_value.first.return_value = outgoing_draft_email
    mock_in_res = MagicMock()
    mock_in_res.scalars.return_value.first.return_value = incoming_email

    mock_db.execute.side_effect = [mock_p_res, mock_out_res, mock_in_res]

    # Faulty client that raises error
    failing_client = MagicMock()
    failing_client.send_message.side_effect = RuntimeError("Google API 400 Invalid Recipient")

    with patch(
        "app.platform.services.gmail_oauth_service.GmailOAuthService.get_company_email_account",
        return_value=connected_account,
    ):
        with pytest.raises(RuntimeError, match="Gmail send failed"):
            await GmailSendService.send_approved_proposal(
                db=mock_db,
                proposal_id=test_proposal_id,
                company_id=test_company_id,
                custom_client=failing_client,
            )

    # Verify failure audit log was committed
    added_objs = [call[0][0] for call in mock_db.add.call_args_list]
    audit_logs = [obj for obj in added_objs if isinstance(obj, AuditLog)]
    assert any(obj.action == "DISPATCH_FAILED" for obj in audit_logs)
    assert mock_db.commit.called
