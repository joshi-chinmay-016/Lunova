import pytest
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.config import settings
from app.core.database import get_db
from app.models.company import Company
from app.models.user import User, UserRole
from app.auth.services.auth_service import AuthService
from app.auth.services.jwt_service import JWTService


@pytest.mark.asyncio
async def test_auth_login_json_success_and_failure():
    """Verify POST /api/v1/auth/login validates credentials and returns token."""
    company_id = uuid4()
    user_id = uuid4()
    test_email = "admin@lunetron.com"
    test_password = "SecurePassword123!"

    user = User(
        id=user_id,
        company_id=company_id,
        email=test_email,
        name="Test Admin",
        role=UserRole.ADMIN,
        hashed_password=AuthService.get_password_hash(test_password),
    )

    mock_db = AsyncMock()
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = user
    mock_db.execute.return_value = mock_result

    app.dependency_overrides[get_db] = lambda: mock_db
    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            # 1. Invalid password -> 401
            res_fail = await client.post("/api/v1/auth/login", json={"email": test_email, "password": "wrong"})
            assert res_fail.status_code == 401
            assert "Incorrect email or password" in res_fail.json()["detail"]

            # 2. Correct password -> 200 + token + user
            res_ok = await client.post("/api/v1/auth/login", json={"email": test_email, "password": test_password})
            assert res_ok.status_code == 200
            data = res_ok.json()
            assert "access_token" in data
            assert data["token_type"] == "bearer"
            assert data["user"]["email"] == test_email
            assert data["user"]["role"] == "ADMIN"
    finally:
        app.dependency_overrides.pop(get_db, None)


@pytest.mark.asyncio
async def test_auth_me_endpoint():
    """Verify GET /api/v1/auth/me returns current user profile."""
    company_id = uuid4()
    user_id = uuid4()
    test_email = "member@lunetron.com"

    user = User(
        id=user_id,
        company_id=company_id,
        email=test_email,
        name="Profile Member",
        role=UserRole.MEMBER,
    )

    mock_db = AsyncMock()
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = user
    mock_db.execute.return_value = mock_result

    app.dependency_overrides[get_db] = lambda: mock_db
    try:
        token = JWTService.create_access_token(
            subject=str(user_id),
            company_id=str(company_id),
            role=UserRole.MEMBER.value,
        )

        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            # Without token -> 401
            res_unauth = await client.get("/api/v1/auth/me")
            assert res_unauth.status_code == 401

            # With valid token -> 200
            res_auth = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
            assert res_auth.status_code == 200
            profile = res_auth.json()
            assert profile["id"] == str(user_id)
            assert profile["email"] == test_email
            assert profile["role"] == "MEMBER"
    finally:
        app.dependency_overrides.pop(get_db, None)


@pytest.mark.asyncio
async def test_auth_bootstrap_in_development_and_production(monkeypatch):
    """Verify POST /api/v1/auth/bootstrap is allowed in development but strictly blocked in production."""
    company_id = uuid4()
    user_id = uuid4()

    company = Company(id=company_id, name="Lunetron")
    user = User(
        id=user_id,
        company_id=company_id,
        email="admin@lunetron.com",
        name="Sarah Jenkins",
        role=UserRole.ADMIN,
        hashed_password=AuthService.get_password_hash("lunetron2026!"),
    )

    mock_db = AsyncMock()
    mock_db.add = MagicMock()

    # Simulate queries: first company query returns company, user query returns user
    mock_res_company = MagicMock()
    mock_res_company.scalar_one_or_none.return_value = company

    mock_res_user = MagicMock()
    mock_res_user.scalar_one_or_none.return_value = user

    mock_db.execute.side_effect = [mock_res_company, mock_res_user]

    app.dependency_overrides[get_db] = lambda: mock_db
    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            # 1. Development bootstrap
            monkeypatch.setattr(settings, "ENVIRONMENT", "development")
            res_dev = await client.post("/api/v1/auth/bootstrap")
            assert res_dev.status_code == 200
            data = res_dev.json()
            assert "access_token" in data
            assert data["user"]["email"] == "admin@lunetron.com"
            assert data["user"]["role"] == "ADMIN"

            # 2. Production rejection
            monkeypatch.setattr(settings, "ENVIRONMENT", "production")
            res_prod = await client.post("/api/v1/auth/bootstrap")
            assert res_prod.status_code == 403
            assert "only permitted in local development" in res_prod.json()["detail"]

            # 3. Staging rejection
            monkeypatch.setattr(settings, "ENVIRONMENT", "staging")
            res_staging = await client.post("/api/v1/auth/bootstrap")
            assert res_staging.status_code == 403
            assert "only permitted in local development" in res_staging.json()["detail"]
    finally:
        app.dependency_overrides.pop(get_db, None)


@pytest.mark.asyncio
async def test_auth_bootstrap_security_controls(monkeypatch):
    """Verify secure bootstrap: secret validation, disabled flag, and preserving existing passwords."""
    company_id = uuid4()
    user_id = uuid4()
    existing_hash = AuthService.get_password_hash("OriginalPreexistingPassword123!")

    company = Company(id=company_id, name="Lunetron")
    user = User(
        id=user_id,
        company_id=company_id,
        email="admin@lunetron.com",
        name="Administrator",
        role=UserRole.ADMIN,
        hashed_password=existing_hash,
    )

    mock_db = AsyncMock()
    mock_db.add = MagicMock()
    mock_db.commit = AsyncMock()
    mock_db.refresh = AsyncMock()

    mock_res_company = MagicMock()
    mock_res_company.scalar_one_or_none.return_value = company

    mock_res_user = MagicMock()
    mock_res_user.scalar_one_or_none.return_value = user

    mock_db.execute.side_effect = [
        mock_res_company, mock_res_user,  # call 1
        mock_res_company, mock_res_user,  # call 2
        mock_res_company, mock_res_user,  # call 3
    ]

    app.dependency_overrides[get_db] = lambda: mock_db
    try:
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
            monkeypatch.setattr(settings, "ENVIRONMENT", "development")

            # 1. Blocked when DEV_BOOTSTRAP_ENABLED is False
            monkeypatch.setattr(settings, "DEV_BOOTSTRAP_ENABLED", False)
            res_disabled = await client.post("/api/v1/auth/bootstrap")
            assert res_disabled.status_code == 403
            assert "explicitly enabled" in res_disabled.json()["detail"]

            # 2. Blocked when DEV_BOOTSTRAP_SECRET mismatch
            monkeypatch.setattr(settings, "DEV_BOOTSTRAP_ENABLED", True)
            monkeypatch.setattr(settings, "DEV_BOOTSTRAP_SECRET", "super-secret-bootstrap-key")

            res_unauth = await client.post(
                "/api/v1/auth/bootstrap",
                json={"bootstrap_secret": "wrong-secret"}
            )
            assert res_unauth.status_code == 401
            assert "Invalid or missing" in res_unauth.json()["detail"]

            # 3. Allowed when valid secret provided via header and does NOT overwrite existing password
            res_valid = await client.post(
                "/api/v1/auth/bootstrap",
                headers={"X-Dev-Bootstrap-Secret": "super-secret-bootstrap-key"},
                json={"admin_password": "NewAttemptedPassword123!"}
            )
            assert res_valid.status_code == 200
            assert "access_token" in res_valid.json()
            # Verified: existing password was NOT modified
            assert user.hashed_password == existing_hash
    finally:
        app.dependency_overrides.pop(get_db, None)
