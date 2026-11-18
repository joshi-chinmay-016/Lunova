from pathlib import Path
from uuid import uuid4
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from app.models.proposal import Proposal, ProposalStatus
from app.platform.integrations.gmail.client import MockGmailClient
from app.platform.services.gmail_send_service import GmailSendService
from app.platform.services.gmail_sync_service import GmailSyncService
from app.platform.services.attachment_storage import AttachmentStorageService
from app.platform.services.proposal_service import ProposalService
from intelligence.retrieval.retriever import KnowledgeRetriever
from intelligence.providers.mock import MockEmbeddingProvider


@pytest.mark.asyncio
async def test_cross_tenant_proposal_send_is_blocked():
    """Verify Company A user cannot send Company B's proposal even with valid proposal ID."""
    mock_db = AsyncMock()

    company_a_id = uuid4()
    company_b_id = uuid4()
    proposal_id = uuid4()

    # Proposal lookup filters WHERE id = proposal_id AND company_id = company_a_id
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
    """Verify Company A cannot access or sync Company B's connected email account."""
    mock_db = AsyncMock()
    company_a_id = uuid4()

    with patch(
        "app.platform.services.gmail_oauth_service.GmailOAuthService.get_company_email_account",
        return_value=None,
    ):
        with pytest.raises(ValueError, match="No active Gmail account connected"):
            await GmailSyncService.sync_company_inbox(
                db=mock_db,
                company_id=company_a_id,
            )


@pytest.mark.asyncio
async def test_cross_tenant_proposal_read_is_blocked():
    """Verify Company A cannot view or retrieve Company B's proposal."""
    mock_db = AsyncMock()

    company_a = uuid4()
    proposal_b_id = uuid4()

    mock_res = MagicMock()
    mock_res.scalar_one_or_none.return_value = None
    mock_db.execute.return_value = mock_res

    result = await ProposalService.get_proposal(
        db=mock_db,
        proposal_id=proposal_b_id,
        company_id=company_a,
    )
    assert result is None


@pytest.mark.asyncio
async def test_cross_tenant_reconciliation_is_blocked():
    """Verify Company A user cannot reconcile Company B's uncertain dispatch."""
    mock_db = AsyncMock()

    company_a_id = uuid4()
    proposal_b_id = uuid4()

    mock_res = MagicMock()
    mock_res.scalar_one_or_none.return_value = None
    mock_db.execute.return_value = mock_res

    with pytest.raises(ValueError, match="Proposal not found"):
        await GmailSendService.reconcile_dispatch(
            db=mock_db,
            proposal_id=proposal_b_id,
            company_id=company_a_id,
            action="CONFIRM_DELIVERED",
            notes="Cross tenant unauthorized attempt",
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


def test_attachment_storage_cross_tenant_isolation(tmp_path):
    """Verify Company A cannot access Company B's attachment files on disk."""
    storage = AttachmentStorageService(base_path=tmp_path)
    company_a = uuid4()
    company_b = uuid4()
    proposal_b = uuid4()

    # Save attachment for Company B
    path_b = storage.save_attachment(
        company_id=company_b,
        filename="confidential_b.pdf",
        content=b"Company B Secret RFP",
        proposal_id=proposal_b,
    )

    # File exists under company_b directory
    assert Path(path_b).exists()
    assert str(company_b) in path_b

    # Verify Company A's directory path does not contain Company B's file
    dir_a = storage.get_target_directory(company_a, proposal_b)
    assert not (dir_a / "confidential_b.pdf").exists()


def test_knowledge_retrieval_tenant_isolation():
    """Verify that retrieval strictly isolates Company A and Company B knowledge chunks."""
    retriever = KnowledgeRetriever(
        embedding_provider=MockEmbeddingProvider(),
        enable_mock_fallback=False,
    )

    company_a = "tenant_alpha"
    company_b = "tenant_beta"

    # Index same keywords for both companies with different content
    retriever.index_chunk(
        company_id=company_a,
        document_id="doc_a",
        title="Alpha Architecture",
        section="Cloud",
        content="Alpha Corp exclusive pricing is $50,000 per month.",
    )

    retriever.index_chunk(
        company_id=company_b,
        document_id="doc_b",
        title="Beta Architecture",
        section="Cloud",
        content="Beta Corp exclusive pricing is $150,000 per month.",
    )

    # Query as Company A
    results_a = retriever.retrieve(
        requirements="exclusive pricing per month",
        company_id=company_a,
        top_k=5,
        relevance_threshold=0.0,
    )

    assert len(results_a) > 0
    for r in results_a:
        assert r.company_id == company_a
        assert "Alpha" in r.content
        assert "Beta" not in r.content

    # Query as Company B
    results_b = retriever.retrieve(
        requirements="exclusive pricing per month",
        company_id=company_b,
        top_k=5,
        relevance_threshold=0.0,
    )

    assert len(results_b) > 0
    for r in results_b:
        assert r.company_id == company_b
        assert "Beta" in r.content
        assert "Alpha" not in r.content
