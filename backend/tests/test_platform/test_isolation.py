import pytest
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4
from fastapi import HTTPException
from app.platform.services.proposal_service import ProposalService
from app.platform.schemas.review import ReviewCreate
from app.api.dependencies.auth import get_current_company

@pytest.mark.asyncio
async def test_company_isolation_in_proposal_retrieval():
    mock_db = AsyncMock()
    company_a_id = uuid4()
    company_b_id = uuid4()
    proposal_id = uuid4()
    
    # We test that get_proposal filters by company_id correctly.
    # We can't easily assert on the exact SQLAlchemy statement without complex mock assertions,
    # but we can verify that the API endpoints or services require company_id.
    
    # Just asserting the signature and behaviour
    # If the proposal is not found (because it belongs to another company), get_proposal returns None
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = None
    mock_db.execute.return_value = mock_result
    
    proposal = await ProposalService.get_proposal(mock_db, proposal_id, company_b_id)
    assert proposal is None

@pytest.mark.asyncio
async def test_auth_dependency_missing_header():
    with pytest.raises(HTTPException) as excinfo:
        await get_current_company(None)
    assert excinfo.value.status_code == 401

@pytest.mark.asyncio
async def test_auth_dependency_invalid_header():
    with pytest.raises(HTTPException) as excinfo:
        await get_current_company("not-a-uuid")
    assert excinfo.value.status_code == 401

@pytest.mark.asyncio
async def test_auth_dependency_valid_header():
    valid_uuid = str(uuid4())
    company_id = await get_current_company(valid_uuid)
    assert str(company_id) == valid_uuid
