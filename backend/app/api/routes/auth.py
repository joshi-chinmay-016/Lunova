from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.auth.schemas import Token
from app.auth.services.auth_service import AuthService
from app.auth.services.jwt_service import JWTService

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: AsyncSession = Depends(get_db)
):
    user = await AuthService.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = JWTService.create_access_token(
        subject=str(user.id),
        company_id=str(user.company_id),
        role=user.role.value
    )
    
    return {"access_token": access_token, "token_type": "bearer"}
