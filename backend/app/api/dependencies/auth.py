from typing import Optional
from fastapi import Header, HTTPException, status
from uuid import UUID

async def get_current_company(x_company_id: Optional[str] = Header(None)) -> UUID:
    """
    Mock dependency to extract company_id from headers.
    In a real app, this would validate a JWT token and extract the company/tenant ID.
    """
    if not x_company_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="X-Company-ID header missing",
        )
    try:
        return UUID(x_company_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid X-Company-ID format",
        )

async def get_current_user(x_user_id: Optional[str] = Header(None)) -> Optional[UUID]:
    """
    Mock dependency to extract user_id from headers.
    """
    if not x_user_id:
        return None
    try:
        return UUID(x_user_id)
    except ValueError:
        return None
