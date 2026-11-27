from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.auth.schemas import Token, UserLogin, UserRegister, LoginResponse, UserResponse, AuthenticatedUser
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


@router.post("/register", response_model=LoginResponse, summary="Register new enterprise account")
async def register(
    data: UserRegister,
    db: AsyncSession = Depends(get_db)
):
    # 1. Check if email already registered
    stmt = select(User).where(User.email == str(data.email))
    res = await db.execute(stmt)
    if res.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An enterprise account with this email already exists."
        )

    # 2. Check or create Company
    company_name = data.company_name or "Lunetron Technologies"
    stmt_co = select(Company).where(Company.name == company_name)
    res_co = await db.execute(stmt_co)
    company = res_co.scalar_one_or_none()
    if not company:
        company = Company(name=company_name)
        db.add(company)
        await db.flush()

    # 3. Hash password securely (never expose plaintext)
    hashed_pwd = AuthService.get_password_hash(data.password)

    # 4. Create new User
    new_user = User(
        company_id=company.id,
        email=str(data.email),
        name=data.name,
        role=UserRole.MEMBER,
        hashed_password=hashed_pwd,
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    access_token = JWTService.create_access_token(
        subject=str(new_user.id),
        company_id=str(new_user.company_id),
        role=new_user.role.value
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": new_user,
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
    from app.core.config import settings
    if settings.ENVIRONMENT != "development":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bootstrap is only permitted in local development environment."
        )

    stmt = select(Company).where(Company.name == "Lunetron")
    result = await db.execute(stmt)
    company = result.scalar_one_or_none()
    if not company:
        company = Company(name="Lunetron")
        db.add(company)
        await db.flush()

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
