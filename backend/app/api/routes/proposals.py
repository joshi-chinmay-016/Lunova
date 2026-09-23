from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.api.dependencies.auth import get_current_company, get_current_user
from app.platform.schemas.proposal import ProposalCreate, ProposalResponse
from app.platform.schemas.review import ReviewCreate, ReviewResponse
from app.platform.services.proposal_service import ProposalService
from app.models.review import Review
from app.models.proposal import Proposal
from app.models.proposal import Proposal

router = APIRouter(prefix="/proposals", tags=["Proposals"])

@router.post("", response_model=ProposalResponse, status_code=status.HTTP_201_CREATED)
async def create_proposal(
    data: ProposalCreate,
    db: AsyncSession = Depends(get_db),
    company_id: UUID = Depends(get_current_company)
):
    return await ProposalService.create_proposal(db, data, company_id)


@router.get("", response_model=List[ProposalResponse])
async def list_proposals(
    db: AsyncSession = Depends(get_db),
    company_id: UUID = Depends(get_current_company)
):
    stmt = select(Proposal).filter(Proposal.company_id == company_id).order_by(Proposal.created_at.desc())
    result = await db.execute(stmt)
    proposals = result.scalars().all()
    return proposals


@router.get("/{proposal_id}", response_model=ProposalResponse)
async def get_proposal(
    proposal_id: UUID,
    db: AsyncSession = Depends(get_db),
    company_id: UUID = Depends(get_current_company)
):
    proposal = await ProposalService.get_proposal(db, proposal_id, company_id)
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
    return proposal


@router.post("/{proposal_id}/process", status_code=status.HTTP_202_ACCEPTED)
async def process_proposal(
    proposal_id: UUID,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    company_id: UUID = Depends(get_current_company)
):
    proposal = await ProposalService.get_proposal(db, proposal_id, company_id)
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
    
    if proposal.status != "RECEIVED":
        raise HTTPException(status_code=400, detail="Proposal is already processing or processed")

    background_tasks.add_task(ProposalService.process_proposal_bg, proposal_id, company_id)
    return {"detail": "Processing started"}


@router.post("/{proposal_id}/approve", response_model=ProposalResponse)
async def approve_proposal(
    proposal_id: UUID,
    data: ReviewCreate,
    db: AsyncSession = Depends(get_db),
    company_id: UUID = Depends(get_current_company),
    user_id: UUID = Depends(get_current_user)
):
    try:
        return await ProposalService.approve_proposal(db, proposal_id, company_id, data, user_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{proposal_id}/reject", response_model=ProposalResponse)
async def reject_proposal(
    proposal_id: UUID,
    data: ReviewCreate,
    db: AsyncSession = Depends(get_db),
    company_id: UUID = Depends(get_current_company),
    user_id: UUID = Depends(get_current_user)
):
    try:
        return await ProposalService.reject_proposal(db, proposal_id, company_id, data, user_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{proposal_id}/reviews", response_model=List[ReviewResponse])
async def get_proposal_reviews(
    proposal_id: UUID,
    db: AsyncSession = Depends(get_db),
    company_id: UUID = Depends(get_current_company)
):
    proposal = await ProposalService.get_proposal(db, proposal_id, company_id)
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")

    stmt = select(Review).filter(Review.proposal_id == proposal_id, Review.company_id == company_id).order_by(Review.created_at.desc())
    result = await db.execute(stmt)
    return result.scalars().all()
