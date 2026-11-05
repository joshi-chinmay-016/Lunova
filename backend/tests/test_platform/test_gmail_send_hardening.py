from datetime import datetime, timezone
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4
import pytest

from app.models.audit import AuditLog
from app.models.email import Email, EmailDirection
from app.models.email_account import EmailAccount, EmailProvider
from app.models.proposal import Proposal, ProposalStatus
from app.platform.integrations.gmail.client import BaseGmailClient, MockGmailClient
from app.platform.services.gmail_send_service import GmailSendService


@pytest.fixture
def company_id():
    return uuid4()


@pytest.fixture
def proposal_id():
    return uuid4()


@pytest.fixture
def connected_account(company_id):
    return EmailAccount(
        company_id=company_id,
        provider=EmailProvider.GMAIL.value,
        email_address="proposals@lunetron.com",
        encrypted_access_token="encrypted_token_data",
        is_active=True,
    )


@pytest.fixture
def outgoing_draft_email(company_id, proposal_id):
    return Email(
        company_id=company_id,
        proposal_id=proposal_id,
        direction=EmailDirection.OUTGOING,
        sender_address="proposals@lunetron.com",
        recipient_address="procurement@client.com",
        subject="Re: RFP Inquiry",
        body="Verified enterprise response text.",
    )


@pytest.fixture
def incoming_email(company_id, proposal_id):
    return Email(
        company_id=company_id,
        proposal_id=proposal_id,
        direction=EmailDirection.INCOMING,
        sender_address="procurement@client.com",
        recipient_address="proposals@lunetron.com",
        subject="RFP Inquiry",
        body="Client request.",
        message_id="msg_inc_001",
        thread_id="thread_001",
    )


@pytest.mark.asyncio
async def test_concurrent_duplicate_send_is_blocked(company_id, proposal_id):
    """Verify that a proposal currently in SENDING state cannot be concurrently sent again."""
    mock_db = AsyncMock()

    proposal = Proposal(
        id=proposal_id,
        company_id=company_id,
        title="Concurrent RFP",
        status=ProposalStatus.SENDING,
    )

    mock_res = MagicMock()
    mock_res.scalar_one_or_none.return_value = proposal
    mock_db.execute.return_value = mock_res

    with pytest.raises(ValueError, match="currently being dispatched"):
        await GmailSendService.send_approved_proposal(
            db=mock_db,
            proposal_id=proposal_id,
            company_id=company_id,
            custom_client=MockGmailClient(),
        )


@pytest.mark.asyncio
async def test_dispatch_uncertain_blocked_from_resend(company_id, proposal_id):
    """Verify that a proposal in DISPATCH_UNCERTAIN cannot be resent without reconciliation."""
    mock_db = AsyncMock()

    proposal = Proposal(
        id=proposal_id,
        company_id=company_id,
        title="Uncertain RFP",
        status=ProposalStatus.DISPATCH_UNCERTAIN,
    )

    mock_res = MagicMock()
    mock_res.scalar_one_or_none.return_value = proposal
    mock_db.execute.return_value = mock_res

    with pytest.raises(ValueError, match="Safe reconciliation is required"):
        await GmailSendService.send_approved_proposal(
            db=mock_db,
            proposal_id=proposal_id,
            company_id=company_id,
            custom_client=MockGmailClient(),
        )


@pytest.mark.asyncio
async def test_network_timeout_transitions_to_dispatch_uncertain(
    company_id,
    proposal_id,
    connected_account,
    incoming_email,
    outgoing_draft_email,
):
    """Verify that a network timeout during dispatch sets status to DISPATCH_UNCERTAIN and does NOT auto-retry."""
    mock_db = AsyncMock()
    mock_db.add = MagicMock()

    proposal = Proposal(
        id=proposal_id,
        company_id=company_id,
        title="Timeout RFP",
        status=ProposalStatus.APPROVED,
    )

    mock_p_res = MagicMock()
    mock_p_res.scalar_one_or_none.return_value = proposal

    mock_out_res = MagicMock()
    mock_out_res.scalars.return_value.first.return_value = outgoing_draft_email

    mock_in_res = MagicMock()
    mock_in_res.scalars.return_value.first.return_value = incoming_email

    mock_db.execute.side_effect = [mock_p_res, mock_out_res, mock_in_res]

    # Create a mock client that raises a socket/HTTP timeout
    timing_out_client = MagicMock(spec=BaseGmailClient)
    timing_out_client.send_message.side_effect = TimeoutError("Connection to accounts.google.com timed out after 15s")

    with patch(
        "app.platform.services.gmail_oauth_service.GmailOAuthService.get_company_email_account",
        return_value=connected_account,
    ):
        with pytest.raises(RuntimeError, match="Dispatch outcome uncertain"):
            await GmailSendService.send_approved_proposal(
                db=mock_db,
                proposal_id=proposal_id,
                company_id=company_id,
                custom_client=timing_out_client,
            )

    # Must be marked DISPATCH_UNCERTAIN
    assert proposal.status == ProposalStatus.DISPATCH_UNCERTAIN

    # Verify audit log of DISPATCH_UNCERTAIN was added
    audit_calls = [c[0][0] for c in mock_db.add.call_args_list if isinstance(c[0][0], AuditLog)]
    uncertain_audits = [a for a in audit_calls if a.action == "DISPATCH_UNCERTAIN"]
    assert len(uncertain_audits) == 1
    assert "timeout" in uncertain_audits[0].details.lower()


@pytest.mark.asyncio
async def test_explicit_api_failure_resets_to_approved_for_correction(
    company_id,
    proposal_id,
    connected_account,
    incoming_email,
    outgoing_draft_email,
):
    """Verify non-timeout API errors reset status to APPROVED so reviewer can fix and re-attempt."""
    mock_db = AsyncMock()
    mock_db.add = MagicMock()

    proposal = Proposal(
        id=proposal_id,
        company_id=company_id,
        title="API Error RFP",
        status=ProposalStatus.APPROVED,
    )

    mock_p_res = MagicMock()
    mock_p_res.scalar_one_or_none.return_value = proposal
    mock_out_res = MagicMock()
    mock_out_res.scalars.return_value.first.return_value = outgoing_draft_email
    mock_in_res = MagicMock()
    mock_in_res.scalars.return_value.first.return_value = incoming_email

    mock_db.execute.side_effect = [mock_p_res, mock_out_res, mock_in_res]

    failing_client = MagicMock(spec=BaseGmailClient)
    failing_client.send_message.side_effect = Exception("400 Bad Request: Recipient address rejected")

    with patch(
        "app.platform.services.gmail_oauth_service.GmailOAuthService.get_company_email_account",
        return_value=connected_account,
    ):
        with pytest.raises(RuntimeError, match="Gmail send failed"):
            await GmailSendService.send_approved_proposal(
                db=mock_db,
                proposal_id=proposal_id,
                company_id=company_id,
                custom_client=failing_client,
            )

    # Status must be reset to APPROVED so user can fix recipient and retry
    assert proposal.status == ProposalStatus.APPROVED

    audit_calls = [c[0][0] for c in mock_db.add.call_args_list if isinstance(c[0][0], AuditLog)]
    failed_audits = [a for a in audit_calls if a.action == "DISPATCH_FAILED"]
    assert len(failed_audits) == 1


@pytest.mark.asyncio
async def test_reconciliation_confirm_delivered(company_id, proposal_id, outgoing_draft_email):
    """Verify reconciliation with CONFIRM_DELIVERED marks status as SENT and updates message ID."""
    mock_db = AsyncMock()
    mock_db.add = MagicMock()

    proposal = Proposal(
        id=proposal_id,
        company_id=company_id,
        title="Reconciled RFP",
        status=ProposalStatus.DISPATCH_UNCERTAIN,
    )

    mock_p_res = MagicMock()
    mock_p_res.scalar_one_or_none.return_value = proposal
    mock_email_res = MagicMock()
    mock_email_res.scalars.return_value.first.return_value = outgoing_draft_email

    mock_db.execute.side_effect = [mock_p_res, mock_email_res]

    reconciled = await GmailSendService.reconcile_dispatch(
        db=mock_db,
        proposal_id=proposal_id,
        company_id=company_id,
        action="CONFIRM_DELIVERED",
        notes="Checked Gmail sent box manually, email was delivered at 22:15 UTC.",
        external_message_id="msg_verified_in_sent_folder",
    )

    assert reconciled.status == ProposalStatus.SENT
    assert outgoing_draft_email.message_id == "msg_verified_in_sent_folder"
    assert mock_db.commit.called


@pytest.mark.asyncio
async def test_reconciliation_reset_for_resend(company_id, proposal_id):
    """Verify reconciliation with RESET_FOR_RESEND resets status to APPROVED for retry."""
    mock_db = AsyncMock()
    mock_db.add = MagicMock()

    proposal = Proposal(
        id=proposal_id,
        company_id=company_id,
        title="Reset RFP",
        status=ProposalStatus.DISPATCH_UNCERTAIN,
    )

    mock_p_res = MagicMock()
    mock_p_res.scalar_one_or_none.return_value = proposal
    mock_db.execute.return_value = mock_p_res

    reconciled = await GmailSendService.reconcile_dispatch(
        db=mock_db,
        proposal_id=proposal_id,
        company_id=company_id,
        action="RESET_FOR_RESEND",
        notes="Checked sent box, email was never delivered. Safe to resend.",
    )

    assert reconciled.status == ProposalStatus.APPROVED
    assert mock_db.commit.called


@pytest.mark.asyncio
async def test_reconciliation_requires_uncertain_state_and_notes(company_id, proposal_id):
    """Verify reconciliation is rejected if proposal is not DISPATCH_UNCERTAIN or if notes are missing."""
    mock_db = AsyncMock()

    proposal = Proposal(
        id=proposal_id,
        company_id=company_id,
        title="Regular RFP",
        status=ProposalStatus.APPROVED,  # Not DISPATCH_UNCERTAIN
    )

    mock_p_res = MagicMock()
    mock_p_res.scalar_one_or_none.return_value = proposal
    mock_db.execute.return_value = mock_p_res

    # Should reject because status is APPROVED, not DISPATCH_UNCERTAIN
    with pytest.raises(ValueError, match="Only proposals in 'DISPATCH_UNCERTAIN' or stuck in 'SENDING' can be reconciled"):
        await GmailSendService.reconcile_dispatch(
            db=mock_db,
            proposal_id=proposal_id,
            company_id=company_id,
            action="CONFIRM_DELIVERED",
            notes="Valid note",
        )

    # Should reject if notes are missing
    proposal.status = ProposalStatus.DISPATCH_UNCERTAIN
    with pytest.raises(ValueError, match="Reviewer notes are mandatory"):
        await GmailSendService.reconcile_dispatch(
            db=mock_db,
            proposal_id=proposal_id,
            company_id=company_id,
            action="CONFIRM_DELIVERED",
            notes="",
        )

@pytest.mark.asyncio
async def test_reconciliation_recovers_proposal_stuck_in_sending(company_id, proposal_id):
    """Verify that a proposal left in SENDING due to a process crash can be safely reconciled."""
    mock_db = AsyncMock()
    mock_db.add = MagicMock()

    proposal = Proposal(
        id=proposal_id,
        company_id=company_id,
        title="Crashed Worker RFP",
        status=ProposalStatus.SENDING,  # Stuck in SENDING
    )

    mock_p_res = MagicMock()
    mock_p_res.scalar_one_or_none.return_value = proposal
    mock_db.execute.return_value = mock_p_res

    reconciled = await GmailSendService.reconcile_dispatch(
        db=mock_db,
        proposal_id=proposal_id,
        company_id=company_id,
        action="RESET_FOR_RESEND",
        notes="Worker process crashed during dispatch; verified email was not sent in Gmail sent box.",
    )

    assert reconciled.status == ProposalStatus.APPROVED
    assert mock_db.commit.called

