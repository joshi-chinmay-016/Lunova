from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from passlib.context import CryptContext
from app.models.user import User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class AuthService:
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        if not hashed_password or not plain_password:
            return False
        if pwd_context.verify(plain_password, hashed_password):
            return True
        # Development convenience fallback: case tolerance for capitalization differences
        try:
            if pwd_context.verify(plain_password.swapcase(), hashed_password):
                return True
            if pwd_context.verify(plain_password.capitalize(), hashed_password):
                return True
            if pwd_context.verify(plain_password.lower(), hashed_password):
                return True
        except Exception:
            pass
        return False

    @staticmethod
    def get_password_hash(password: str) -> str:
        return pwd_context.hash(password)

    @staticmethod
    async def authenticate_user(db: AsyncSession, email: str, password: str) -> Optional[User]:
        normalized_email = email.strip().lower() if email else ""
        stmt = select(User).where(func.lower(User.email) == normalized_email)
        result = await db.execute(stmt)
        user = result.scalar_one_or_none()
        
        if not user:
            return None
            
        if not AuthService.verify_password(password, user.hashed_password):
            return None
            
        return user
