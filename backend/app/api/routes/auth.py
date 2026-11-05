from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.auth.schemas import Token, UserLogin, LoginResponse, UserResponse, AuthenticatedUser
from app.auth.services.auth_service import AuthService
from app.auth.services.jwt_service import JWTService
from app.api.dependencies.auth import get_current_active_user
from app.models.user import User, UserRole
from app.models.company import Company

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.post("/token", response_model=Token, summary="OAuth2 password form login")
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


@router.post("/login", response_model=LoginResponse, summary="JSON email/password login")
async def login(
    data: UserLogin,
    db: AsyncSession = Depends(get_db)
):
    user = await AuthService.authenticate_user(db, str(data.email), data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = JWTService.create_access_token(
        subject=str(user.id),
        company_id=str(user.company_id),
        role=user.role.value
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user,
    }


@router.get("/me", response_model=UserResponse, summary="Current user profile")
async def get_current_user_profile(
    db: AsyncSession = Depends(get_db),
    current_user: AuthenticatedUser = Depends(get_current_active_user)
):
    stmt = select(User).where(User.id == current_user.id)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post("/bootstrap", response_model=LoginResponse, summary="Local development admin bootstrap")
async def bootstrap_local_admin(
    db: AsyncSession = Depends(get_db)
):
    """
    Development-only convenience route to ensure default tenant 'Lunetron' and
    admin user exist, returning a valid authenticated session for local UI development.
    Strictly disabled in production.
    """
    from app.core.config import settings
    if settings.ENVIRONMENT != "development":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bootstrap is only permitted in local development environment."
        )

    # 1. Check or create Company
    stmt = select(Company).where(Company.name == "Lunetron")
    result = await db.execute(stmt)
    company = result.scalar_one_or_none()
    if not company:
        company = Company(name="Lunetron")
        db.add(company)
        await db.flush()

    # 2. Check or create default Admin User
    admin_email = "admin@lunetron.com"
    stmt_user = select(User).where(User.email == admin_email)
    user_res = await db.execute(stmt_user)
    user = user_res.scalar_one_or_none()
    if not user:
        user = User(
            company_id=company.id,
            email=admin_email,
            name="Sarah Jenkins",
            role=UserRole.ADMIN,
            hashed_password=AuthService.get_password_hash("lunetron2026!"),
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
    else:
        # Ensure password is set for local dev login if previously null
        if not user.hashed_password:
            user.hashed_password = AuthService.get_password_hash("lunetron2026!")
            await db.commit()
            await db.refresh(user)

    access_token = JWTService.create_access_token(
        subject=str(user.id),
        company_id=str(user.company_id),
        role=user.role.value
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user,
    }
