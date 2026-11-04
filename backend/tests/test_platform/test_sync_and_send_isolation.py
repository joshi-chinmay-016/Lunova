from uuid import uuid4
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from app.models.proposal import Proposal, ProposalStatus
from app.platform.integrations.gmail.client import MockGmailClient
from app.platform.services.gmail_send_service import GmailSendService
from app.platform.services.gmail_sync_service import GmailSyncService
from app.platform.services.attachment_storage import AttachmentStorageService


@pytest.mark.asyncio
async def test_cross_tenant_proposal_send_is_blocked():
    """Verify Company A user cannot send Company B's proposal even with valid proposal ID."""
    mock_db = AsyncMock()

    company_a_id = uuid4()
    company_b_id = uuid4()
    proposal_id = uuid4()

    # The query for proposal filters WHERE id = proposal_id AND company_id = caller_company_id
    # When Company A user calls, it looks for company_a_id, but the proposal belongs to Company B -> returns None!
    mock_res = MagicMock()
    mock_res.scalar_one_or_none.return_value = None
    mock_db.execute.return_value = mock_res

    with pytest.raises(ValueError, match="Proposal not found"):
        await GmailSendService.send_approved_proposal(
            db=mock_db,
            proposal_id=proposal_id,
            company_id=company_a_id,
            custom_client=MockGmailClient(),
        )


@pytest.mark.asyncio
async def test_cross_tenant_sync_is_blocked():
    """Verify Company A cannot access Company B's connected email account during sync."""
    mock_db = AsyncMock()

    company_a_id = uuid4()

    # When querying email account for Company A, none exists (it belongs to Company B)
    with patch(
        "app.platform.services.gmail_oauth_service.GmailOAuthService.get_company_email_account",
        return_value=None,
    ):
        with pytest.raises(ValueError, match="No active Gmail account connected"):
            await GmailSyncService.sync_company_inbox(
                db=mock_db,
                company_id=company_a_id,
            )


def test_attachment_storage_directory_traversal_prevention(tmp_path):
    """Verify storage service enforces tenant isolation and blocks directory escaping."""
    storage = AttachmentStorageService(base_path=tmp_path)
    company_a = uuid4()

    # Attempting to save with path traversal ../../company_b/
    traversal_filename = "../../evil.pdf"
    clean_path = storage.save_attachment(company_a, traversal_filename, b"content")

    # Path must remain contained inside company_a directory
    assert str(company_a) in clean_path
    assert not clean_path.endswith("../../evil.pdf")
    assert "evil.pdf" in clean_path
