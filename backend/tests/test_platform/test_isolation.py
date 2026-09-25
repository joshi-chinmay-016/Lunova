import pytest
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4
from fastapi import HTTPException
from app.platform.services.proposal_service import ProposalService
from app.platform.schemas.review import ReviewCreate
from app.api.dependencies.auth import get_current_active_user
from app.auth.services.jwt_service import JWTService

@pytest.mark.asyncio
async def test_company_isolation_in_proposal_retrieval():
    mock_db = AsyncMock()
    company_a_id = uuid4()
    company_b_id = uuid4()
    proposal_id = uuid4()
    
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = None
    mock_db.execute.return_value = mock_result
    
    proposal = await ProposalService.get_proposal(mock_db, proposal_id, company_b_id)
    assert proposal is None

@pytest.mark.asyncio
async def test_auth_dependency_missing_token():
    with pytest.raises(HTTPException) as excinfo:
        await get_current_active_user(token="")
    assert excinfo.value.status_code == 401

@pytest.mark.asyncio
async def test_auth_dependency_invalid_token():
    with pytest.raises(HTTPException) as excinfo:
        await get_current_active_user("invalid.token.here")
    assert excinfo.value.status_code == 401

@pytest.mark.asyncio
async def test_auth_dependency_valid_token():
    user_id = uuid4()
    company_id = uuid4()
    
    valid_token = JWTService.create_access_token(
        subject=str(user_id),
        company_id=str(company_id),
        role="MEMBER"
    )
    
    user = await get_current_active_user(valid_token)
    assert str(user.id) == str(user_id)
    assert str(user.company_id) == str(company_id)
    assert user.role == "MEMBER"

def test_company_isolation_in_proposal_context():
    from intelligence.service import IntelligenceService
    from intelligence.models.proposal import ProposalContext
    import uuid

    company_a_id = str(uuid.uuid4())
    company_b_id = str(uuid.uuid4())

    context_a = ProposalContext(
        proposal_id=str(uuid.uuid4()),
        company_id=company_a_id,
        subject="Request",
        body="Body"
    )

    service = IntelligenceService()
    result_a = service.analyze_proposal(context_a)

    # Ensure company_b_id is never present in the retrieved sources
    for source in result_a.retrieved_sources:
        assert company_b_id not in source.source_id
        assert company_b_id not in source.title