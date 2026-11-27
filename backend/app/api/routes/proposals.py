from pydantic import BaseModel, Field
from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.api.dependencies.auth import get_current_active_user, RoleChecker
from app.auth.schemas import AuthenticatedUser
from app.models.user import UserRole
from app.platform.schemas.proposal import (
    ProposalCreate,
    ProposalResponse,
    ProposalDraftUpdate,
    ProposalDetailResponse,
    ResponseCenterMetrics,
)
from app.platform.schemas.review import ReviewCreate, ReviewResponse
from app.platform.services.proposal_service import ProposalService
from app.models.review import Review
from app.models.proposal import Proposal, ProposalStatus

router = APIRouter(prefix="/proposals", tags=["Proposals"])

@router.get("/metrics", response_model=ResponseCenterMetrics)
async def get_response_center_metrics(
    db: AsyncSession = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_active_user)
):
    """Returns aggregated summary metrics for the Email Response Center dashboard."""
    return await ProposalService.get_response_center_metrics(db, current_user.company_id)


@router.post("", response_model=ProposalResponse, status_code=status.HTTP_201_CREATED)
async def create_proposal(
    data: ProposalCreate,
    db: AsyncSession = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_active_user)
):
    return await ProposalService.create_proposal(db, data, current_user.company_id)


@router.get("", response_model=List[ProposalResponse])
async def list_proposals(
    db: AsyncSession = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_active_user)
):
    stmt = select(Proposal).filter(Proposal.company_id == current_user.company_id).order_by(Proposal.created_at.desc())
    result = await db.execute(stmt)
    proposals = result.scalars().all()
    return proposals


@router.get("/{proposal_id}", response_model=ProposalResponse)
async def get_proposal(
    proposal_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_active_user)
):
    proposal = await ProposalService.get_proposal(db, proposal_id, current_user.company_id)
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
    return proposal


@router.get("/{proposal_id}/detail", response_model=ProposalDetailResponse)
async def get_proposal_detail(
    proposal_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_active_user)
):
    try:
        return await ProposalService.get_proposal_detail(db, proposal_id, current_user.company_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.put("/{proposal_id}/draft", response_model=ProposalResponse)
async def update_proposal_draft(
    proposal_id: UUID,
    data: ProposalDraftUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: AuthenticatedUser = Depends(RoleChecker([UserRole.ADMIN, UserRole.MEMBER]))
):
    """
    Saves reviewer manual draft edits. If the proposal was previously approved,
    editing the draft automatically invalidates the approval and resets state to review.
    """
    try:
        return await ProposalService.update_proposal_draft(
            db=db,
            proposal_id=proposal_id,
            company_id=current_user.company_id,
            subject=data.subject,
            body=data.body,
            user_id=current_user.id,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{proposal_id}/regenerate", status_code=status.HTTP_202_ACCEPTED)
async def regenerate_proposal(
    proposal_id: UUID,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: AuthenticatedUser = Depends(RoleChecker([UserRole.ADMIN, UserRole.MEMBER]))
):
    proposal = await ProposalService.get_proposal(db, proposal_id, current_user.company_id)
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")

    proposal.status = ProposalStatus.PROCESSING
    await db.commit()

    background_tasks.add_task(ProposalService.process_proposal_bg, proposal_id, current_user.company_id)
    return {"detail": "Regeneration scheduled"}


@router.post("/{proposal_id}/process", status_code=status.HTTP_202_ACCEPTED)
async def process_proposal(
    proposal_id: UUID,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: AuthenticatedUser = Depends(RoleChecker([UserRole.ADMIN]))
):
    proposal = await ProposalService.get_proposal(db, proposal_id, current_user.company_id)
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")
    
    if proposal.status != "RECEIVED":
        raise HTTPException(status_code=400, detail="Proposal is already processing or processed")

    background_tasks.add_task(ProposalService.process_proposal_bg, proposal_id, current_user.company_id)
    return {"detail": "Processing started"}


@router.post("/{proposal_id}/approve", response_model=ProposalResponse)
async def approve_proposal(
    proposal_id: UUID,
    data: ReviewCreate,
    db: AsyncSession = Depends(get_db),
    current_user: AuthenticatedUser = Depends(RoleChecker([UserRole.ADMIN, UserRole.MEMBER]))
):
    try:
        return await ProposalService.approve_proposal(db, proposal_id, current_user.company_id, data, current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{proposal_id}/reject", response_model=ProposalResponse)
async def reject_proposal(
    proposal_id: UUID,
    data: ReviewCreate,
    db: AsyncSession = Depends(get_db),
    current_user: AuthenticatedUser = Depends(RoleChecker([UserRole.ADMIN, UserRole.MEMBER]))
):
    try:
        return await ProposalService.reject_proposal(db, proposal_id, current_user.company_id, data, current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/{proposal_id}/reviews", response_model=List[ReviewResponse])
async def get_proposal_reviews(
    proposal_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_active_user)
):
    proposal = await ProposalService.get_proposal(db, proposal_id, current_user.company_id)
    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")

    stmt = select(Review).filter(Review.proposal_id == proposal_id, Review.company_id == current_user.company_id).order_by(Review.created_at.desc())
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("/{proposal_id}/send", response_model=ProposalResponse)
async def send_proposal(
    proposal_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: AuthenticatedUser = Depends(RoleChecker([UserRole.ADMIN, UserRole.MEMBER]))
):
    """
    Dispatches the approved proposal draft email to the client via connected Gmail:
    - Strictly checks that proposal status is APPROVED
    - Sends through connected company Gmail account
    - Updates proposal status to SENT
    - Records immutable audit log
    """
    from app.platform.services.gmail_send_service import GmailSendService

    try:
        sent_proposal = await GmailSendService.send_approved_proposal(
            db=db,
            proposal_id=proposal_id,
            company_id=current_user.company_id,
            user_id=current_user.id,
        )
        return sent_proposal
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc))

class ReconcileDispatchPayload(BaseModel):
    action: str = Field(description="Reconciliation action: 'CONFIRM_DELIVERED' or 'RESET_FOR_RESEND'")
    notes: str = Field(description="Mandatory reviewer explanation of out-of-band verification")
    external_message_id: Optional[str] = Field(default=None, description="Optional Gmail Message ID if confirmed delivered")


@router.post("/{proposal_id}/reconcile", response_model=ProposalResponse)
async def reconcile_proposal_dispatch(
    proposal_id: UUID,
    data: ReconcileDispatchPayload,
    db: AsyncSession = Depends(get_db),
    current_user: AuthenticatedUser = Depends(RoleChecker([UserRole.ADMIN, UserRole.MEMBER])),
):
    """
    Reconciles a proposal stuck in DISPATCH_UNCERTAIN state after out-of-band confirmation:
    - 'CONFIRM_DELIVERED': marks as SENT and records reviewer notes.
    - 'RESET_FOR_RESEND': marks back as APPROVED so an authorized reviewer can re-attempt sending.
    """
    from app.platform.services.gmail_send_service import GmailSendService

    try:
        reconciled = await GmailSendService.reconcile_dispatch(
            db=db,
            proposal_id=proposal_id,
            company_id=current_user.company_id,
            action=data.action,
            notes=data.notes,
            user_id=current_user.id,
            external_message_id=data.external_message_id,
        )
        return reconciled
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc))

