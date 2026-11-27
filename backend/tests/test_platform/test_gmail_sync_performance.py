import asyncio
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4
import httpx
import pytest

from app.models.attachment import EmailAttachment
from app.models.email import Email, EmailDirection
from app.models.email_account import EmailAccount, EmailProvider
from app.models.proposal import Proposal, ProposalStatus
from app.platform.integrations.gmail.client import MockGmailClient, GmailClient
from app.platform.services.attachment_storage import AttachmentStorageService
from app.platform.services.gmail_sync_service import GmailSyncService
from app.platform.services.proposal_service import ProposalService


@pytest.fixture
def company_a_id():
    return uuid4()


@pytest.fixture
def company_b_id():
    return uuid4()


@pytest.fixture
def mock_storage(tmp_path):
    return AttachmentStorageService(base_path=tmp_path)


@pytest.fixture
def active_account(company_a_id):
    return EmailAccount(
        company_id=company_a_id,
        provider=EmailProvider.GMAIL.value,
        email_address="proposals@lunetron.com",
        encrypted_access_token="enc_token",
        encrypted_refresh_token="enc_refresh",
        token_expiry=datetime.now(timezone.utc) + timedelta(hours=1),
        is_active=True,
        history_id=None,
    )


@pytest.mark.asyncio
async def test_sync_empty_inbox(company_a_id, active_account, mock_storage):
    """Scenario: Empty inbox returns 0 messages quickly with completed status."""
    mock_db = AsyncMock()
    mock_db.commit = AsyncMock()

    mock_client = MockGmailClient(initial_messages=[])

    with patch("app.platform.services.gmail_oauth_service.GmailOAuthService.get_company_email_account", return_value=active_account):
        result, created_ids = await GmailSyncService.sync_company_inbox(
            db=mock_db,
            company_id=company_a_id,
            custom_client=mock_client,
            attachment_storage=mock_storage,
        )

    assert result.new_emails_count == 0
    assert result.proposals_created_count == 0
    assert result.messages_examined == 0
    assert result.sync_status == "COMPLETED"
    assert len(created_ids) == 0
    assert result.durations is not None
    assert result.durations["total_duration_ms"] >= 0.0


@pytest.mark.asyncio
async def test_sync_small_inbox(company_a_id, active_account, mock_storage):
    """Scenario: Small inbox (3 new emails) accurately parsed and ingested."""
    mock_db = AsyncMock()
    mock_db.add = MagicMock()
    mock_db.commit = AsyncMock()
    mock_res = MagicMock()
    mock_res.scalars.return_value.first.return_value = None
    mock_db.execute.return_value = mock_res

    mock_res = MagicMock()
    mock_res.scalars.return_value.first.return_value = None
    mock_db.execute.return_value = mock_res

    mock_client = MockGmailClient()
    for i in range(1, 4):
        mock_client.add_message(
            message_id=f"msg_small_{i}",
            sender=f"client{i}@corp.com",
            subject=f"RFP Inquiry {i}",
            body_text=f"Please provide quotation and specifications for tier {i}.",
        )

    with patch("app.platform.services.gmail_oauth_service.GmailOAuthService.get_company_email_account", return_value=active_account):
        result, created_ids = await GmailSyncService.sync_company_inbox(
            db=mock_db,
            company_id=company_a_id,
            custom_client=mock_client,
            attachment_storage=mock_storage,
            max_messages=10,
        )

    assert result.messages_examined == 3
    assert result.new_emails_count == 3
    assert result.proposals_created_count == 3
    assert len(created_ids) == 3
    assert result.durations["gmail_api_fetch_ms"] >= 0.0
    assert result.durations["database_persistence_ms"] >= 0.0


@pytest.mark.asyncio
async def test_sync_large_inbox_pagination(company_a_id, active_account, mock_storage):
    """Scenario: Large inbox honors max_messages slice and captures correct counts."""
    mock_db = AsyncMock()
    mock_db.add = MagicMock()
    mock_db.commit = AsyncMock()
    mock_res = MagicMock()
    mock_res.scalars.return_value.first.return_value = None
    mock_db.execute.return_value = mock_res

    mock_res = MagicMock()
    mock_res.scalars.return_value.first.return_value = None
    mock_db.execute.return_value = mock_res

    mock_client = MockGmailClient()
    for i in range(1, 26):
        mock_client.add_message(
            message_id=f"msg_large_{i}",
            sender=f"vendor{i}@enterprise.com",
            subject=f"Enterprise RFP Batch {i}",
            body_text=f"Requesting RFP processing for volume shipment {i}.",
        )

    with patch("app.platform.services.gmail_oauth_service.GmailOAuthService.get_company_email_account", return_value=active_account):
        result, created_ids = await GmailSyncService.sync_company_inbox(
            db=mock_db,
            company_id=company_a_id,
            custom_client=mock_client,
            attachment_storage=mock_storage,
            max_messages=15,
        )

    assert result.messages_examined == 15
    assert result.new_emails_count == 15
    assert len(created_ids) == 15


@pytest.mark.asyncio
async def test_sync_incremental_history(company_a_id, active_account, mock_storage):
    """Scenario: When account has history_id, incremental history sync is invoked."""
    active_account.history_id = "10001"

    mock_db = AsyncMock()
    mock_db.add = MagicMock()
    mock_db.commit = AsyncMock()
    mock_res = MagicMock()
    mock_res.scalars.return_value.first.return_value = None
    mock_db.execute.return_value = mock_res

    mock_res = MagicMock()
    mock_res.scalars.return_value.first.return_value = None
    mock_db.execute.return_value = mock_res

    mock_client = MockGmailClient()
    mock_client.add_message(
        message_id="msg_hist_1",
        sender="partner@vendor.org",
        subject="Delta History Notification",
        body_text="New inquiry delivered via history incremental cursor.",
        history_id="10050",
    )

    with patch("app.platform.services.gmail_oauth_service.GmailOAuthService.get_company_email_account", return_value=active_account):
        result, created_ids = await GmailSyncService.sync_company_inbox(
            db=mock_db,
            company_id=company_a_id,
            custom_client=mock_client,
            attachment_storage=mock_storage,
        )

    assert result.sync_strategy == "history"
    assert result.new_emails_count == 1
    assert result.history_id == "10050"
    assert active_account.history_id == "10050"


@pytest.mark.asyncio
async def test_sync_history_expired_fallback_to_full_scan(company_a_id, active_account, mock_storage):
    """Scenario: When history_id is expired (raises ValueError), sync safely falls back to full scan."""
    active_account.history_id = "expired"

    mock_db = AsyncMock()
    mock_db.add = MagicMock()
    mock_db.commit = AsyncMock()
    mock_res = MagicMock()
    mock_res.scalars.return_value.first.return_value = None
    mock_db.execute.return_value = mock_res

    mock_res = MagicMock()
    mock_res.scalars.return_value.first.return_value = None
    mock_db.execute.return_value = mock_res

    mock_client = MockGmailClient()
    mock_client.add_message(
        message_id="msg_fallback_1",
        sender="lead@client.com",
        subject="Fallback Inquiry",
        body_text="Message ingested after history expiration fallback.",
    )

    with patch("app.platform.services.gmail_oauth_service.GmailOAuthService.get_company_email_account", return_value=active_account):
        result, created_ids = await GmailSyncService.sync_company_inbox(
            db=mock_db,
            company_id=company_a_id,
            custom_client=mock_client,
            attachment_storage=mock_storage,
        )

    assert result.sync_strategy == "fallback_full_scan"
    assert result.new_emails_count == 1


@pytest.mark.asyncio
async def test_sync_concurrent_duplicate_requests_rejected(company_a_id, active_account, mock_storage):
    """Scenario: Concurrent sync request for the same company is rejected with ValueError/409 guard."""
    mock_db = AsyncMock()
    mock_client = MockGmailClient()

    # Artificially acquire the company's sync lock
    lock = GmailSyncService._sync_locks.setdefault(company_a_id, asyncio.Lock())
    await lock.acquire()

    try:
        with patch("app.platform.services.gmail_oauth_service.GmailOAuthService.get_company_email_account", return_value=active_account):
            with pytest.raises(ValueError, match="already in progress"):
                await GmailSyncService.sync_company_inbox(
                    db=mock_db,
                    company_id=company_a_id,
                    custom_client=mock_client,
                    attachment_storage=mock_storage,
                )
    finally:
        lock.release()


@pytest.mark.asyncio
async def test_sync_tenant_isolation(company_a_id, company_b_id, active_account, mock_storage):
    """Scenario: Sync operates strictly under the caller's company_id boundary."""
    account_b = EmailAccount(
        company_id=company_b_id,
        provider=EmailProvider.GMAIL.value,
        email_address="proposals@tenant-b.com",
        encrypted_access_token="enc_b",
        is_active=True,
    )

    mock_db = AsyncMock()
    mock_db.add = MagicMock()
    mock_db.commit = AsyncMock()
    mock_res = MagicMock()
    mock_res.scalars.return_value.first.return_value = None
    mock_db.execute.return_value = mock_res

    mock_client = MockGmailClient()
    mock_client.add_message(
        message_id="msg_tenant_a",
        sender="a@domain.com",
        subject="Tenant A Inquiry",
        body_text="Tenant A requirements.",
    )

    # When querying account for Company A, account B must never be returned
    async def mock_get_account(db, c_id):
        if c_id == company_a_id:
            return active_account
        elif c_id == company_b_id:
            return account_b
        return None

    with patch("app.platform.services.gmail_oauth_service.GmailOAuthService.get_company_email_account", side_effect=mock_get_account):
        result_a, _ = await GmailSyncService.sync_company_inbox(
            db=mock_db,
            company_id=company_a_id,
            custom_client=mock_client,
            attachment_storage=mock_storage,
        )

        assert result_a.account_id == str(active_account.id)
        assert result_a.email_address == "proposals@lunetron.com"


@pytest.mark.asyncio
async def test_stage_b_gemini_timeout_handling(company_a_id):
    """Scenario: In Stage B, if Gemini or Intelligence raises a timeout, status transitions safely to FAILED."""
    proposal_id = uuid4()
    proposal = Proposal(
        id=proposal_id,
        company_id=company_a_id,
        title="Test Proposal",
        status=ProposalStatus.RECEIVED,
    )
    incoming_email = Email(
        company_id=company_a_id,
        proposal_id=proposal_id,
        direction=EmailDirection.INCOMING,
        sender_address="client@domain.com",
        recipient_address="proposals@lunetron.com",
        subject="RFP with Gemini Timeout",
        body="Requires heavy computation.",
    )

    mock_db = AsyncMock()
    mock_db.add = MagicMock()
    mock_db.commit = AsyncMock()
    mock_res = MagicMock()
    mock_res.scalars.return_value.first.return_value = None
    mock_db.execute.return_value = mock_res

    def mock_db_execute(stmt):
        mock_result = MagicMock()
        stmt_str = str(getattr(stmt, "whereclause", "")).lower()
        if "proposals.id" in stmt_str or "id =" in stmt_str:
            mock_result.scalar_one_or_none.return_value = proposal
        else:
            mock_result.scalars.return_value.all.return_value = [incoming_email]
        return mock_result

    mock_db.execute.side_effect = mock_db_execute

    with patch("app.platform.services.proposal_service.async_session_maker") as mock_session_maker, \
         patch("app.platform.services.proposal_service.ProposalService.get_proposal", return_value=proposal), \
         patch("app.platform.services.proposal_service.IntelligenceService") as mock_intel:

        mock_session_maker.return_value.__aenter__.return_value = mock_db
        # Simulate LLM / Gemini Timeout
        mock_intel.return_value.analyze_proposal.side_effect = TimeoutError("Gemini API request timed out after 30s")

        await ProposalService.process_proposal_bg(proposal_id, company_a_id)

    assert proposal.status == ProposalStatus.FAILED
    mock_db.commit.assert_awaited()
