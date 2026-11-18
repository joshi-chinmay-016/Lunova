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
