import jwt
from datetime import datetime, timedelta, timezone
from typing import Optional
from app.core.config import settings
from app.auth.schemas import TokenPayload

class JWTService:
    @staticmethod
    def create_access_token(subject: str, company_id: str, role: str, expires_delta: Optional[timedelta] = None) -> str:
        if expires_delta:
            expire = datetime.now(timezone.utc) + expires_delta
        else:
            expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
            
        to_encode = {
            "exp": expire,
            "sub": str(subject),
            "company_id": str(company_id),
            "role": str(role)
        }
        
        encoded_jwt = jwt.encode(
            to_encode, 
            settings.JWT_SECRET_KEY, 
            algorithm=settings.JWT_ALGORITHM
        )
        return encoded_jwt

    @staticmethod
    def decode_token(token: str) -> TokenPayload:
        try:
            payload = jwt.decode(
                token, 
                settings.JWT_SECRET_KEY, 
                algorithms=[settings.JWT_ALGORITHM]
            )
            return TokenPayload(**payload)
        except jwt.PyJWTError:
            return None
