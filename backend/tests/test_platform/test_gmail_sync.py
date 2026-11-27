from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4
import pytest

from app.models.attachment import EmailAttachment
from app.models.email import Email, EmailDirection
from app.models.email_account import EmailAccount, EmailProvider
from app.models.proposal import Proposal, ProposalStatus
from app.platform.integrations.gmail.client import MockGmailClient
from app.platform.services.attachment_storage import AttachmentStorageService
from app.platform.services.gmail_sync_service import GmailSyncService


@pytest.fixture
def test_company_id():
    return uuid4()


@pytest.fixture
def mock_storage(tmp_path):
    return AttachmentStorageService(base_path=tmp_path)


@pytest.fixture
def connected_account(test_company_id):
    return EmailAccount(
        company_id=test_company_id,
        provider=EmailProvider.GMAIL.value,
        email_address="proposals@lunetron.com",
        encrypted_access_token="encrypted_token_data",
        encrypted_refresh_token="encrypted_refresh_data",
        token_expiry=datetime.now(timezone.utc) + timedelta(hours=1),
        is_active=True,
    )


@pytest.mark.asyncio
async def test_sync_new_inbox_messages(test_company_id, connected_account, mock_storage):
    mock_db = AsyncMock()
    mock_db.add = MagicMock()

    # Mock finding connected account
    mock_acc_result = MagicMock()
    mock_acc_result.scalar_one_or_none.return_value = connected_account

    # Mock finding existing message (returns None -> no duplicate)
    mock_msg_result = MagicMock()
    mock_msg_result.scalars.return_value.first.return_value = None

    mock_db.execute.return_value = mock_msg_result

    mock_client = MockGmailClient()
    mock_client.add_message(
        message_id="msg_gmail_100",
        sender="procurement@acme.org",
        subject="Request for Cloud Migration Proposal",
        body_text="We need pricing and architectural plans for a multi-cloud migration.",
    )

    with patch("app.platform.services.gmail_oauth_service.GmailOAuthService.get_company_email_account", return_value=connected_account):
        result, created_ids = await GmailSyncService.sync_company_inbox(
            db=mock_db,
            company_id=test_company_id,
            custom_client=mock_client,
            attachment_storage=mock_storage,
        )

    assert result.new_emails_count == 1
    assert result.proposals_created_count == 1
    assert result.skipped_duplicates_count == 0
    assert len(created_ids) == 1

    # Verify db.commit was called
    mock_db.commit.assert_awaited_once()


@pytest.mark.asyncio
async def test_sync_skips_duplicate_messages(test_company_id, connected_account, mock_storage):
    mock_db = AsyncMock()
    mock_db.add = MagicMock()

    # Mock message already exists in database
    existing_email = Email(
        company_id=test_company_id,
        message_id="msg_gmail_dupe",
        direction=EmailDirection.INCOMING,
        sender_address="client@domain.com",
        recipient_address="proposals@lunetron.com",
    )

    mock_db_res = MagicMock()
    mock_db_res.scalars.return_value.first.return_value = existing_email
    mock_db.execute.return_value = mock_db_res

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
async def test_sync_with_attachment_download_and_parsing(test_company_id, connected_account, mock_storage):
    mock_db = AsyncMock()
    mock_db.add = MagicMock()

    # Message does not exist yet
    mock_res = MagicMock()
    mock_res.scalars.return_value.first.return_value = None
    mock_db.execute.return_value = mock_res

    mock_client = MockGmailClient()
    att_bytes = b"Sample plain text RFP requirements specification document."
    mock_client.add_message(
        message_id="msg_with_att",
        sender="rfp-desk@enterprise.com",
        subject="RFP with Attachment",
        body_text="Please find the attached specification.",
        attachments=[
            {
                "id": "att_txt_01",
                "filename": "specs.txt",
                "content_type": "text/plain",
                "data": att_bytes,
            }
        ],
    )

    with patch("app.platform.services.gmail_oauth_service.GmailOAuthService.get_company_email_account", return_value=connected_account):
        result, created_ids = await GmailSyncService.sync_company_inbox(
            db=mock_db,
            company_id=test_company_id,
            custom_client=mock_client,
            attachment_storage=mock_storage,
        )

    assert result.new_emails_count == 1
    assert result.proposals_created_count == 1

    # Verify attachment record was added to db
    added_objects = [call[0][0] for call in mock_db.add.call_args_list]
    att_records = [obj for obj in added_objects if isinstance(obj, EmailAttachment)]
    assert len(att_records) == 1
    assert att_records[0].filename == "specs.txt"
    assert att_records[0].parsing_status == "SUCCESS"
    assert "Sample plain text" in att_records[0].extracted_text


@pytest.mark.asyncio
async def test_sync_raises_error_if_no_connected_account(test_company_id):
    mock_db = AsyncMock()

    with patch("app.platform.services.gmail_oauth_service.GmailOAuthService.get_company_email_account", return_value=None):
        with pytest.raises(ValueError, match="No active Gmail account connected"):
            await GmailSyncService.sync_company_inbox(
                db=mock_db,
                company_id=test_company_id,
            )


@pytest.mark.asyncio
async def test_sync_filters_automated_noise(test_company_id, connected_account, mock_storage):
    """Phase E: Automated notification / bounce / invite filtering."""
    mock_db = AsyncMock()
    mock_db.add = MagicMock()

    mock_res = MagicMock()
    mock_res.scalars.return_value.first.return_value = None
    mock_db.execute.return_value = mock_res

    mock_client = MockGmailClient()
    mock_client.add_message(
        message_id="msg_automated_1",
        sender="no-reply@service.com",
        subject="Automatic reply: Out of Office",
        body_text="I am currently away with no email access.",
    )

    with patch("app.platform.services.gmail_oauth_service.GmailOAuthService.get_company_email_account", return_value=connected_account):
        result, created_ids = await GmailSyncService.sync_company_inbox(
            db=mock_db,
            company_id=test_company_id,
            custom_client=mock_client,
            attachment_storage=mock_storage,
        )

    # Email ingested for audit/tracking, but no proposal created
    assert result.new_emails_count == 1
    assert result.proposals_created_count == 0
    assert len(created_ids) == 0

    added_objects = [call[0][0] for call in mock_db.add.call_args_list]
    proposals = [obj for obj in added_objects if isinstance(obj, Proposal)]
    assert len(proposals) == 0


@pytest.mark.asyncio
async def test_sync_thread_association_reuses_existing_proposal(test_company_id, connected_account, mock_storage):
    """Phase E: Ongoing thread messages are appended to the existing proposal instead of creating duplicates."""
    mock_db = AsyncMock()
    mock_db.add = MagicMock()

    existing_prop_id = uuid4()

    def mock_db_execute(stmt):
        mock_result = MagicMock()
        where_str = str(getattr(stmt, "whereclause", "")).lower()
        if "thread_id" in where_str:
            # Found existing proposal for thread
            mock_result.scalars.return_value.first.return_value = existing_prop_id
        else:
            # No existing email by message_id
            mock_result.scalars.return_value.first.return_value = None
        return mock_result

    mock_db.execute.side_effect = mock_db_execute

    mock_client = MockGmailClient()
    mock_client.add_message(
        message_id="msg_thread_reply_10",
        sender="client@enterprise.com",
        subject="Re: RFP Clarification",
        body_text="Here is our addendum regarding timeline and deliverables.",
        thread_id="thread_shared_001",
    )

    with patch("app.platform.services.gmail_oauth_service.GmailOAuthService.get_company_email_account", return_value=connected_account):
        result, created_ids = await GmailSyncService.sync_company_inbox(
            db=mock_db,
            company_id=test_company_id,
            custom_client=mock_client,
            attachment_storage=mock_storage,
        )

    assert result.new_emails_count == 1
    assert result.proposals_created_count == 0  # Reused existing proposal, didn't create new one
    assert len(created_ids) == 0

    added_emails = [call[0][0] for call in mock_db.add.call_args_list if isinstance(call[0][0], Email)]
    assert len(added_emails) == 1
    assert added_emails[0].proposal_id == existing_prop_id


@pytest.mark.asyncio
async def test_sync_handles_oversized_attachments(test_company_id, connected_account, mock_storage):
    """Phase D: Attachments exceeding 25MB are marked OVERSIZED without crashing sync."""
    mock_db = AsyncMock()
    mock_db.add = MagicMock()

    mock_res = MagicMock()
    mock_res.scalars.return_value.first.return_value = None
    mock_db.execute.return_value = mock_res

    mock_client = MockGmailClient()
    mock_client.add_message(
        message_id="msg_oversized",
        sender="heavy-data@client.com",
        subject="Large Dataset RFP",
        body_text="Huge attachment included.",
        attachments=[
            {
                "id": "att_huge",
                "filename": "massive_archive.zip",
                "content_type": "application/zip",
                "data": b"X" * (26 * 1024 * 1024),  # 26MB
            }
        ],
    )

    with patch("app.platform.services.gmail_oauth_service.GmailOAuthService.get_company_email_account", return_value=connected_account):
        result, created_ids = await GmailSyncService.sync_company_inbox(
            db=mock_db,
            company_id=test_company_id,
            custom_client=mock_client,
            attachment_storage=mock_storage,
        )

    assert result.new_emails_count == 1
    assert result.attachments_discovered_count == 1

    added_objects = [call[0][0] for call in mock_db.add.call_args_list]
    att_records = [obj for obj in added_objects if isinstance(obj, EmailAttachment)]
    assert len(att_records) == 1
    assert att_records[0].parsing_status == "OVERSIZED"
    assert "25MB" in (att_records[0].error_message or "")


def test_gmail_client_pagination_and_history():
    """Phase C: Pagination support and history endpoint."""
    mock_client = MockGmailClient()
    for i in range(15):
        mock_client.add_message(
            message_id=f"msg_p_{i}",
            sender=f"sender{i}@test.com",
            subject=f"Subject {i}",
            body_text=f"Body {i}",
        )

    # Page 1
    page1 = mock_client.list_messages(max_results=5)
    assert len(page1) == 5
    assert mock_client.next_page_token == "page_5"

    # Page 2
    page2 = mock_client.list_messages(max_results=5, page_token=mock_client.next_page_token)
    assert len(page2) == 5
    assert mock_client.next_page_token == "page_10"

    # History API
    hist = mock_client.list_history(start_history_id="10001")
    assert "history" in hist
    assert hist["historyId"] == "10050"

    # Expired history raises ValueError
    with pytest.raises(ValueError, match="expired or invalid"):
        mock_client.list_history(start_history_id="expired")


def test_gmail_client_retry_on_429_and_503():
    """Phase C: Backoff and retry on HTTP 429 and 503."""
    import httpx
    from app.platform.integrations.gmail.client import GmailClient

    mock_http_client = MagicMock()
    # First call 429, second call 503, third call 200 OK
    res_429 = httpx.Response(429, request=httpx.Request("GET", "https://test.com"), headers={"Retry-After": "0"})
    res_503 = httpx.Response(503, request=httpx.Request("GET", "https://test.com"))
    res_200 = httpx.Response(200, json={"messages": [{"id": "m1"}]}, request=httpx.Request("GET", "https://test.com"))
    mock_http_client.request.side_effect = [res_429, res_503, res_200]

    client = GmailClient(access_token="fake_token", client=mock_http_client)
    with patch("time.sleep") as mock_sleep:
        messages = client.list_messages()

    assert len(messages) == 1
    assert messages[0]["id"] == "m1"
    assert mock_http_client.request.call_count == 3
    assert mock_sleep.call_count == 2
