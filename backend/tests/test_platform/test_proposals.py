import pytest
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4
from app.platform.services.proposal_service import ProposalService
from app.platform.schemas.proposal import ProposalCreate
from app.platform.schemas.review import ReviewCreate
from app.models.proposal import Proposal, ProposalStatus

@pytest.mark.asyncio
async def test_create_proposal():
    mock_db = AsyncMock()
    mock_db.add = MagicMock()
    company_id = uuid4()
    
    data = ProposalCreate(
        title="Test Proposal",
        content="We need a CRM.",
        subject="Request for Proposal",
        sender_address="client@example.com",
        recipient_address="vendor@lunova.ai"
    )
    
    proposal = await ProposalService.create_proposal(mock_db, data, company_id)
    
    assert proposal.title == "Test Proposal"
    assert proposal.company_id == company_id
    assert proposal.status == ProposalStatus.RECEIVED
    
    assert mock_db.add.call_count == 3  # Proposal, Email, AuditLog
    mock_db.commit.assert_awaited_once()
    mock_db.refresh.assert_awaited_once_with(proposal)

@pytest.mark.asyncio
async def test_approve_proposal():
    mock_db = AsyncMock()
    mock_db.add = MagicMock()
    company_id = uuid4()
    proposal_id = uuid4()
    user_id = uuid4()
    
    # Mock get_proposal
    proposal = Proposal(id=proposal_id, company_id=company_id, status=ProposalStatus.REVIEW_REQUIRED)
    
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = proposal
    mock_db.execute.return_value = mock_result
    
    review_data = ReviewCreate(comments="Looks good!")
    
    approved = await ProposalService.approve_proposal(mock_db, proposal_id, company_id, review_data, user_id)
    
    assert approved.status == ProposalStatus.APPROVED
    assert mock_db.add.call_count == 2  # Review, AuditLog
    mock_db.commit.assert_awaited_once()

@pytest.mark.asyncio
async def test_reject_proposal():
    mock_db = AsyncMock()
    mock_db.add = MagicMock()
    company_id = uuid4()
    proposal_id = uuid4()
    user_id = uuid4()
    
    # Mock get_proposal
    proposal = Proposal(id=proposal_id, company_id=company_id, status=ProposalStatus.REVIEW_REQUIRED)
    
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = proposal
    mock_db.execute.return_value = mock_result
    
    review_data = ReviewCreate(comments="Needs rework.")
    
    rejected = await ProposalService.reject_proposal(mock_db, proposal_id, company_id, review_data, user_id)
    
    assert rejected.status == ProposalStatus.REJECTED
    assert mock_db.add.call_count == 2  # Review, AuditLog
    mock_db.commit.assert_awaited_once()

@pytest.mark.asyncio
async def test_approve_proposal_invalid_state():
    mock_db = AsyncMock()
    company_id = uuid4()
    proposal_id = uuid4()
    user_id = uuid4()
    
    # Mock get_proposal in WRONG state
    proposal = Proposal(id=proposal_id, company_id=company_id, status=ProposalStatus.RECEIVED)
    
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = proposal
    mock_db.execute.return_value = mock_result
    
    review_data = ReviewCreate(comments="Looks good!")
    
    with pytest.raises(ValueError, match="cannot approve"):
        await ProposalService.approve_proposal(mock_db, proposal_id, company_id, review_data, user_id)
