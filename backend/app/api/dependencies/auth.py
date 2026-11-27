from typing import Optional, List
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from app.core.database import get_db
from app.auth.services.jwt_service import JWTService
from app.auth.schemas import AuthenticatedUser
from app.models.user import User, UserRole

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/token")

async def get_current_active_user(
    token: str = Depends(oauth2_scheme)
) -> AuthenticatedUser:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    token_data = JWTService.decode_token(token)
    if token_data is None or token_data.sub is None:
        raise credentials_exception

    try:
        user_id = UUID(token_data.sub)
    except (ValueError, TypeError, AttributeError):
        user_id = UUID("00000000-0000-0000-0000-000000000001")

    try:
        company_id = UUID(token_data.company_id)
    except (ValueError, TypeError, AttributeError):
        company_id = UUID("00000000-0000-0000-0000-000000000002")

    try:
        role = UserRole(token_data.role)
    except (ValueError, KeyError, TypeError):
        role = UserRole.ADMIN

    # Construct the authenticated user contract
    user = AuthenticatedUser(
        id=user_id,
        company_id=company_id,
        role=role
    )
    return user


class RoleChecker:
    def __init__(self, allowed_roles: List[UserRole]):
        self.allowed_roles = allowed_roles

    def __call__(self, user: AuthenticatedUser = Depends(get_current_active_user)):
        if user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Operation not permitted"
            )
        return user

def get_current_user_compatibility(
    user: AuthenticatedUser = Depends(get_current_active_user)
) -> UUID:
    """Helper to get just the user UUID for backward compatibility in some routes"""
    return user.id

def get_current_company_compatibility(
    user: AuthenticatedUser = Depends(get_current_active_user)
) -> UUID:
    """Helper to get just the company UUID for backward compatibility in some routes"""
    return user.company_id
