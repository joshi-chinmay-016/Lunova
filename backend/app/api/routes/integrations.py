from typing import Optional
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies.auth import get_current_active_user, RoleChecker
from app.auth.schemas import AuthenticatedUser
from app.core.database import get_db
from app.core.security import MissingEncryptionKeyError, InvalidEncryptionKeyError
from app.models.user import UserRole
from app.platform.schemas.email_account import (
    EmailAccountResponse,
    GmailAuthUrlResponse,
    GmailConnectionStatusResponse,
)
from app.platform.services.gmail_oauth_service import GmailOAuthService
from app.platform.services.gmail_sync_service import GmailSyncService
from app.platform.services.proposal_service import ProposalService

router = APIRouter(prefix="/integrations/gmail", tags=["Integrations - Gmail"])


@router.get(
    "/authorize",
    response_model=GmailAuthUrlResponse,
    summary="Initiate Gmail OAuth authorization flow",
)
async def get_authorization_url(
    db: AsyncSession = Depends(get_db),
    current_user: AuthenticatedUser = Depends(RoleChecker([UserRole.ADMIN])),
):
    """
    Generates a Google OAuth authorization URL for the company admin
    with a durable, single-use, time-limited CSRF state token bound to the current company.
    """
    try:
        url, state = await GmailOAuthService.create_authorization_url(
            company_id=current_user.company_id,
            user_id=current_user.id,
            db=db,
        )
        return GmailAuthUrlResponse(authorization_url=url, state=state)
    except (MissingEncryptionKeyError, InvalidEncryptionKeyError, ValueError) as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Gmail integration configuration error: {str(exc)}",
        )


@router.get(
    "/callback",
    response_model=EmailAccountResponse,
    summary="Handle Gmail OAuth callback",
)
async def oauth_callback(
    code: Optional[str] = Query(None, description="Google OAuth authorization code"),
    state: Optional[str] = Query(None, description="CSRF state token"),
    error: Optional[str] = Query(None, description="OAuth error code from Google"),
    error_description: Optional[str] = Query(None, description="OAuth error description"),
    db: AsyncSession = Depends(get_db),
):
    """
    Handles Google OAuth redirect callback:
    - Validates provider errors and missing authorization codes safely.
    - Validates and atomically consumes single-use CSRF state to prevent replay attacks.
    - Verifies user and company authorization under the membership model.
    - Exchanges authorization code for tokens.
    - Saves encrypted tokens in the database with company tenant isolation.
    """
    if error:
        # Provider error from Google: fail safely without exchanging tokens
        safe_msg = error_description or error
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Google OAuth provider error: {safe_msg}",
        )

    if not code or not code.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Authorization code is missing from Google OAuth callback.",
        )

    # Validate and atomically consume single-use state
    try:
        state_data = await GmailOAuthService.validate_and_consume_oauth_state(db=db, state=state)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid OAuth state: {str(exc)}",
        )

    company_id = state_data["company_id"]

    # Exchange authorization code for tokens
    try:
        token_data = await GmailOAuthService.exchange_code_for_tokens(code)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Token exchange failed: {str(exc)}",
        )

    # Fetch verified user email from Google UserInfo
    try:
        user_email = await GmailOAuthService.fetch_user_email(token_data.get("access_token", ""))
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Could not identify Gmail account email: {str(exc)}",
        )

    # Persist or update account with encrypted tokens
    try:
        account = await GmailOAuthService.save_or_update_account(
            db=db,
            company_id=company_id,
            email_address=user_email,
            token_data=token_data,
        )
    except (MissingEncryptionKeyError, InvalidEncryptionKeyError) as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Token encryption configuration error: {str(exc)}",
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to persist email account credentials.",
        )

    return account


@router.get(
    "/status",
    response_model=GmailConnectionStatusResponse,
    summary="Get current company Gmail connection status",
)
async def get_connection_status(
    db: AsyncSession = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_active_user),
):
    """
    Returns the connection status and metadata for the current company's Gmail account.
    Secrets and tokens are strictly excluded from the response.
    """
    account = await GmailOAuthService.get_company_email_account(db, current_user.company_id)
    if not account:
        return GmailConnectionStatusResponse(connected=False, account=None)

    return GmailConnectionStatusResponse(
        connected=account.is_active,
        account=EmailAccountResponse.model_validate(account),
    )


@router.post(
    "/disconnect",
    summary="Disconnect the company's Gmail account",
)
async def disconnect_account(
    db: AsyncSession = Depends(get_db),
    current_user: AuthenticatedUser = Depends(RoleChecker([UserRole.ADMIN])),
):
    """
    Disconnects (deactivates) the connected Gmail account for the company tenant.
    Restricted to company administrators.
    """
    success = await GmailOAuthService.disconnect_account(db, current_user.company_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No Gmail account connected for this company.",
        )

    return {"detail": "Gmail account disconnected successfully."}


@router.post(
    "/refresh",
    response_model=EmailAccountResponse,
    summary="Refresh Gmail access token",
)
async def refresh_token(
    db: AsyncSession = Depends(get_db),
    current_user: AuthenticatedUser = Depends(RoleChecker([UserRole.ADMIN])),
):
    """
    Refreshes the OAuth access token using the stored encrypted refresh token.
    Updates the encrypted access token and expiry in the database.
    Restricted to company administrators.
    """
    account = await GmailOAuthService.get_company_email_account(db, current_user.company_id)
    if not account or not account.is_active:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No active Gmail account connected for this company.",
        )

    try:
        refreshed_account = await GmailOAuthService.refresh_access_token(db, account)
        return refreshed_account
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )
    except (MissingEncryptionKeyError, InvalidEncryptionKeyError) as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Token encryption configuration error: {str(exc)}",
        )


@router.post(
    "/sync",
    summary="Synchronize incoming emails from connected Gmail inbox",
)
async def sync_inbox(
    background_tasks: BackgroundTasks,
    max_messages: int = Query(10, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
    current_user: AuthenticatedUser = Depends(RoleChecker([UserRole.ADMIN, UserRole.MEMBER])),
):
    """
    Manually triggers inbox synchronization from the company's connected Gmail account:
    - Fetches unread/inbox messages
    - Extracts body text, HTML, and attachments
    - Creates Proposal records and schedules background AI analysis
    - Avoids importing duplicate messages
    """
    try:
        sync_result, created_ids = await GmailSyncService.sync_company_inbox(
            db=db,
            company_id=current_user.company_id,
            max_messages=max_messages,
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc))

    # Trigger background intelligence pipeline for each newly created proposal
    for proposal_id in created_ids:
        background_tasks.add_task(
            ProposalService.process_proposal_bg,
            proposal_id,
            current_user.company_id,
        )

    return sync_result
