from pydantic import BaseModel, EmailStr
from typing import Optional
from uuid import UUID
from app.models.user import UserRole

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class TokenPayload(BaseModel):
    sub: Optional[str] = None
    company_id: Optional[str] = None
    role: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class AuthenticatedUser(BaseModel):
    id: UUID
    company_id: UUID
    role: UserRole
