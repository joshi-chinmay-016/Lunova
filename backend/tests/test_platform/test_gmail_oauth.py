import importlib
import uuid
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, patch, MagicMock

import httpx
import jwt
import pytest
from httpx import AsyncClient

from app.auth.services.jwt_service import JWTService
from app.core.config import settings
from app.core.database import get_db
from app.core.security import TokenEncryptionService
from app.main import app
from app.models.company import Company
from app.models.email_account import EmailAccount, EmailProvider
from app.models.oauth_state import OAuthState
from app.models.user import User, UserRole
from app.platform.services.gmail_oauth_service import GmailOAuthService


@pytest.fixture
def test_encryption_key():
    return TokenEncryptionService.generate_key()


@pytest.fixture(autouse=True)
def configure_test_settings(monkeypatch, test_encryption_key):
    """Ensure test environment has valid dummy OAuth configuration without real secrets."""
    monkeypatch.setattr("app.core.config.settings.GMAIL_CLIENT_ID", "mock-client-id-12345.apps.googleusercontent.com")
    monkeypatch.setattr("app.core.config.settings.GMAIL_CLIENT_SECRET", "mock-client-secret-xyz")
    monkeypatch.setattr("app.core.config.settings.GMAIL_REDIRECT_URI", "http://localhost:8000/api/v1/integrations/gmail/callback")
    monkeypatch.setattr("app.core.config.settings.GMAIL_TOKEN_ENCRYPTION_KEY", test_encryption_key)
    monkeypatch.setattr("app.core.security.settings.GMAIL_TOKEN_ENCRYPTION_KEY", test_encryption_key)


def create_auth_headers(user_id: uuid.UUID, company_id: uuid.UUID, role: UserRole) -> dict:
    """Creates Authorization header with a signed Lunova JWT."""
    token = JWTService.create_access_token(
        subject=str(user_id),
        company_id=str(company_id),
        role=role.value,
    )
    return {"Authorization": f"Bearer {token}"}


# ---------------------------------------------------------------------------
# Unit Tests: Service Layer & State / Configuration
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_create_authorization_url_structure():
    """Verify authorization URL parameters, scopes, signed state, and DB persistence."""
    company_id = uuid.uuid4()
    user_id = uuid.uuid4()

    mock_db = AsyncMock()
    mock_db.add = MagicMock()

    url, state = await GmailOAuthService.create_authorization_url(company_id, user_id, mock_db)

    assert "https://accounts.google.com/o/oauth2/v2/auth" in url
    assert f"client_id={settings.GMAIL_CLIENT_ID}" in url
    assert "access_type=offline" in url
    assert "prompt=consent" in url
    assert "response_type=code" in url
    assert f"state={state}" in url

    # Decrypt and verify state token claims
    decoded = GmailOAuthService.validate_oauth_state(state)
    assert decoded["company_id"] == company_id
    assert decoded["user_id"] == user_id
    assert decoded["nonce"] is not None

    mock_db.add.assert_called_once()
    mock_db.commit.assert_awaited_once()


def test_validate_oauth_state_tampered_fails():
    """Verify that tampering with state token fails validation."""
    company_id = uuid.uuid4()
    user_id = uuid.uuid4()
    state, _ = GmailOAuthService.create_oauth_state(company_id, user_id)

    tampered_state = state[:-5] + "XXXXX"
    with pytest.raises(ValueError, match="Invalid or tampered OAuth state parameter"):
        GmailOAuthService.validate_oauth_state(tampered_state)


def test_validate_oauth_state_expired_fails():
    """Verify that expired state tokens are rejected."""
    company_id = uuid.uuid4()
    user_id = uuid.uuid4()

    past = datetime.now(timezone.utc) - timedelta(minutes=1)
    payload = {
        "sub": str(user_id),
        "company_id": str(company_id),
        "nonce": "test_nonce",
        "purpose": "gmail_oauth",
        "exp": past,
    }
    expired_state = jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

    with pytest.raises(ValueError, match="OAuth state parameter has expired"):
        GmailOAuthService.validate_oauth_state(expired_state)


def test_validate_oauth_state_invalid_purpose_fails():
    """Verify that tokens with wrong purpose are rejected."""
    payload = {
        "sub": str(uuid.uuid4()),
        "company_id": str(uuid.uuid4()),
        "nonce": "test_nonce",
        "purpose": "user_auth",
        "exp": datetime.now(timezone.utc) + timedelta(minutes=15),
    }
    bad_purpose_state = jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

    with pytest.raises(ValueError, match="Invalid OAuth state purpose"):
        GmailOAuthService.validate_oauth_state(bad_purpose_state)


def test_validate_oauth_state_missing_fields_fails():
    """Verify that tokens missing required fields fail validation."""
    payload = {
        "sub": str(uuid.uuid4()),
        # missing company_id and nonce
        "purpose": "gmail_oauth",
        "exp": datetime.now(timezone.utc) + timedelta(minutes=15),
    }
    incomplete_state = jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

    with pytest.raises(ValueError, match="Invalid or tampered OAuth state parameter"):
        GmailOAuthService.validate_oauth_state(incomplete_state)


def test_missing_config_fails_safely(monkeypatch):
    """Verify that missing client credentials fail safely."""
    monkeypatch.setattr("app.platform.services.gmail_oauth_service.settings.GMAIL_CLIENT_ID", None)
    with pytest.raises(ValueError, match="GMAIL_CLIENT_ID"):
        GmailOAuthService.validate_configuration()


# ---------------------------------------------------------------------------
# Durable Single-Use State & Replay Prevention Tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_validate_and_consume_oauth_state_success():
    """Verify valid state is atomically consumed and user authorization checked."""
    company_id = uuid.uuid4()
    user_id = uuid.uuid4()
    state, nonce = GmailOAuthService.create_oauth_state(company_id, user_id)

    state_record = OAuthState(
        company_id=company_id,
        user_id=user_id,
        nonce=nonce,
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=15),
        consumed_at=None,
    )
    active_admin = User(
        id=user_id,
        company_id=company_id,
        email="admin@lunetron.ai",
        name="Admin User",
        role=UserRole.ADMIN,
    )

    mock_db = AsyncMock()
    mock_res_state = MagicMock()
    mock_res_state.scalar_one_or_none.return_value = state_record
    mock_res_user = MagicMock()
    mock_res_user.scalar_one_or_none.return_value = active_admin

    mock_db.execute.side_effect = [mock_res_state, mock_res_user]

    claims = await GmailOAuthService.validate_and_consume_oauth_state(mock_db, state)
    assert claims["company_id"] == company_id
    assert claims["user_id"] == user_id
    assert claims["nonce"] == nonce
    assert state_record.consumed_at is not None
    mock_db.commit.assert_awaited_once()


@pytest.mark.asyncio
async def test_validate_and_consume_oauth_state_replay_fails():
    """Verify that replaying a consumed state is rejected."""
    company_id = uuid.uuid4()
    user_id = uuid.uuid4()
    state, nonce = GmailOAuthService.create_oauth_state(company_id, user_id)

    # State already consumed previously
    state_record = OAuthState(
        company_id=company_id,
        user_id=user_id,
        nonce=nonce,
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=15),
        consumed_at=datetime.now(timezone.utc) - timedelta(seconds=30),
    )

    mock_db = AsyncMock()
    mock_res = MagicMock()
    mock_res.scalar_one_or_none.return_value = state_record
    mock_db.execute.return_value = mock_res

    with pytest.raises(ValueError, match="already been consumed"):
        await GmailOAuthService.validate_and_consume_oauth_state(mock_db, state)


@pytest.mark.asyncio
async def test_validate_and_consume_oauth_state_db_expired_fails():
    """Verify that state record expired in DB is rejected."""
    company_id = uuid.uuid4()
    user_id = uuid.uuid4()
    state, nonce = GmailOAuthService.create_oauth_state(company_id, user_id)

    state_record = OAuthState(
        company_id=company_id,
        user_id=user_id,
        nonce=nonce,
        expires_at=datetime.now(timezone.utc) - timedelta(seconds=5),
        consumed_at=None,
    )

    mock_db = AsyncMock()
    mock_res = MagicMock()
    mock_res.scalar_one_or_none.return_value = state_record
    mock_db.execute.return_value = mock_res

    with pytest.raises(ValueError, match="expired"):
        await GmailOAuthService.validate_and_consume_oauth_state(mock_db, state)


@pytest.mark.asyncio
async def test_validate_and_consume_oauth_state_user_not_admin_fails():
    """Verify that if initiating user is demoted from ADMIN before callback, it fails."""
    company_id = uuid.uuid4()
    user_id = uuid.uuid4()
    state, nonce = GmailOAuthService.create_oauth_state(company_id, user_id)

    state_record = OAuthState(
        company_id=company_id,
        user_id=user_id,
        nonce=nonce,
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=15),
        consumed_at=None,
    )
    demoted_user = User(
        id=user_id,
        company_id=company_id,
        email="member@lunetron.ai",
        name="Member User",
        role=UserRole.MEMBER,
    )

    mock_db = AsyncMock()
    mock_res_state = MagicMock()
    mock_res_state.scalar_one_or_none.return_value = state_record
    mock_res_user = MagicMock()
    mock_res_user.scalar_one_or_none.return_value = demoted_user
    mock_db.execute.side_effect = [mock_res_state, mock_res_user]

    with pytest.raises(ValueError, match="no longer authorized as an administrator"):
        await GmailOAuthService.validate_and_consume_oauth_state(mock_db, state)


@pytest.mark.asyncio
async def test_validate_and_consume_oauth_state_user_missing_fails():
    """Verify that if initiating user is deactivated or deleted, callback fails."""
    company_id = uuid.uuid4()
    user_id = uuid.uuid4()
    state, nonce = GmailOAuthService.create_oauth_state(company_id, user_id)

    state_record = OAuthState(
        company_id=company_id,
        user_id=user_id,
        nonce=nonce,
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=15),
        consumed_at=None,
    )

    mock_db = AsyncMock()
    mock_res_state = MagicMock()
    mock_res_state.scalar_one_or_none.return_value = state_record
    mock_res_user = MagicMock()
    mock_res_user.scalar_one_or_none.return_value = None  # User deleted
    mock_db.execute.side_effect = [mock_res_state, mock_res_user]

    with pytest.raises(ValueError, match="no longer exists for this company"):
        await GmailOAuthService.validate_and_consume_oauth_state(mock_db, state)


# ---------------------------------------------------------------------------
# HTTP Error & Google Response Handling Tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_exchange_code_timeout_and_network_error():
    """Verify token exchange gracefully handles timeouts and network failures."""
    with patch("httpx.AsyncClient.post", side_effect=httpx.TimeoutException("Connection timed out")):
        with pytest.raises(ValueError, match="timed out"):
            await GmailOAuthService.exchange_code_for_tokens("code_123")

    with patch("httpx.AsyncClient.post", side_effect=httpx.RequestError("Network error")):
        with pytest.raises(ValueError, match="Network error"):
            await GmailOAuthService.exchange_code_for_tokens("code_123")


@pytest.mark.asyncio
async def test_exchange_code_provider_error_handling():
    """Verify provider error responses are mapped safely without leaking secrets."""
    mock_resp = MagicMock()
    mock_resp.status_code = 400
    mock_resp.json.return_value = {"error": "invalid_grant", "error_description": "Bad code"}

    with patch("httpx.AsyncClient.post", return_value=mock_resp):
        with pytest.raises(ValueError, match="invalid_grant"):
            await GmailOAuthService.exchange_code_for_tokens("bad_code")


@pytest.mark.asyncio
async def test_fetch_user_email_timeout_and_malformed():
    """Verify user profile lookup handles timeouts and invalid email structures."""
    with patch("httpx.AsyncClient.get", side_effect=httpx.TimeoutException("Timed out")):
        with pytest.raises(ValueError, match="timed out"):
            await GmailOAuthService.fetch_user_email("token_123")

    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {"email": "invalid-address-without-at"}
    with patch("httpx.AsyncClient.get", return_value=mock_resp):
        with pytest.raises(ValueError, match="Valid user email not found"):
            await GmailOAuthService.fetch_user_email("token_123")


# ---------------------------------------------------------------------------
# Account Persistence & Duplicate Handling Unit Tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_save_or_update_account_new_account(test_encryption_key):
    """Verify first-time account persistence encrypts tokens and sets is_active."""
    enc = TokenEncryptionService(test_encryption_key)
    company_id = uuid.uuid4()
    email = "proposals@lunetron.ai"

    token_data = {
        "access_token": "ya29.mock_initial_access_token",
        "refresh_token": "1//mock_initial_refresh_token",
        "expires_in": 3600,
    }

    mock_db = AsyncMock()
    mock_db.add = MagicMock()
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = None  # No existing account
    mock_db.execute.return_value = mock_result

    account = await GmailOAuthService.save_or_update_account(
        db=mock_db,
        company_id=company_id,
        email_address=email,
        token_data=token_data,
        encryption_service=enc,
    )

    assert account.email_address == email
    assert account.company_id == company_id
    assert account.is_active is True
    # Tokens in DB must be encrypted
    assert account.encrypted_access_token != "ya29.mock_initial_access_token"
    assert account.encrypted_refresh_token != "1//mock_initial_refresh_token"
    assert enc.decrypt(account.encrypted_access_token) == "ya29.mock_initial_access_token"
    assert enc.decrypt(account.encrypted_refresh_token) == "1//mock_initial_refresh_token"
    assert account.token_expiry is not None

    mock_db.add.assert_called_once()
    mock_db.commit.assert_awaited_once()


@pytest.mark.asyncio
async def test_save_or_update_account_preserves_existing_refresh_token(test_encryption_key):
    """
    Verify that when Google omits refresh_token on re-authorization,
    the previously saved encrypted_refresh_token is preserved.
    """
    enc = TokenEncryptionService(test_encryption_key)
    company_id = uuid.uuid4()
    email = "proposals@lunetron.ai"

    existing_refresh_ciphertext = enc.encrypt("existing_valid_refresh_token_777")
    existing_account = EmailAccount(
        company_id=company_id,
        email_address=email,
        encrypted_access_token=enc.encrypt("old_access_token"),
        encrypted_refresh_token=existing_refresh_ciphertext,
        is_active=False,
    )

    # Re-consent payload missing refresh_token
    token_data = {
        "access_token": "ya29.new_access_token_999",
        # "refresh_token" omitted by Google!
        "expires_in": 3600,
    }

    mock_db = AsyncMock()
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = existing_account
    mock_db.execute.return_value = mock_result

    updated = await GmailOAuthService.save_or_update_account(
        db=mock_db,
        company_id=company_id,
        email_address=email,
        token_data=token_data,
        encryption_service=enc,
    )

    # Existing refresh token MUST be preserved
    assert updated.encrypted_refresh_token == existing_refresh_ciphertext
    assert enc.decrypt(updated.encrypted_refresh_token) == "existing_valid_refresh_token_777"
    # Access token updated
    assert enc.decrypt(updated.encrypted_access_token) == "ya29.new_access_token_999"
    assert updated.is_active is True


# ---------------------------------------------------------------------------
# Token Refresh Unit Tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_refresh_access_token_success(test_encryption_key):
    """Verify refreshing access token re-encrypts new token and updates expiry."""
    enc = TokenEncryptionService(test_encryption_key)
    company_id = uuid.uuid4()
    account = EmailAccount(
        id=uuid.uuid4(),
        company_id=company_id,
        email_address="proposals@lunetron.ai",
        encrypted_access_token=enc.encrypt("old_expired_access_token"),
        encrypted_refresh_token=enc.encrypt("valid_refresh_token_abc"),
        token_expiry=datetime.now(timezone.utc) - timedelta(hours=1),
        is_active=True,
    )

    mock_db = AsyncMock()
    mock_res = MagicMock()
    mock_res.scalar_one_or_none.return_value = account
    mock_db.execute.return_value = mock_res

    mock_response = MagicMock()
    mock_response.status_code = 200
    mock_response.json.return_value = {
        "access_token": "ya29.fresh_new_access_token",
        "expires_in": 3600,
    }

    with patch("httpx.AsyncClient.post", return_value=mock_response):
        refreshed = await GmailOAuthService.refresh_access_token(
            db=mock_db, account=account, encryption_service=enc
        )

    assert enc.decrypt(refreshed.encrypted_access_token) == "ya29.fresh_new_access_token"
    assert refreshed.is_active is True
    assert refreshed.token_expiry > datetime.now(timezone.utc)
    mock_db.commit.assert_awaited_once()


@pytest.mark.asyncio
async def test_refresh_access_token_concurrency_guard(test_encryption_key):
    """Verify that if token was already refreshed by concurrent process, Google is not called."""
    enc = TokenEncryptionService(test_encryption_key)
    account = EmailAccount(
        id=uuid.uuid4(),
        company_id=uuid.uuid4(),
        email_address="proposals@lunetron.ai",
        encrypted_access_token=enc.encrypt("fresh_token"),
        encrypted_refresh_token=enc.encrypt("refresh_token"),
        token_expiry=datetime.now(timezone.utc) + timedelta(minutes=45),
        is_active=True,
    )
    mock_db = AsyncMock()
    mock_res = MagicMock()
    mock_res.scalar_one_or_none.return_value = account
    mock_db.execute.return_value = mock_res

    with patch("httpx.AsyncClient.post") as mock_post:
        refreshed = await GmailOAuthService.refresh_access_token(
            db=mock_db, account=account, encryption_service=enc
        )
        mock_post.assert_not_called()
        assert refreshed == account


@pytest.mark.asyncio
async def test_refresh_access_token_revoked_credentials(test_encryption_key):
    """Verify that revoked credentials (invalid_grant) mark the account as inactive."""
    enc = TokenEncryptionService(test_encryption_key)
    company_id = uuid.uuid4()
    account = EmailAccount(
        id=uuid.uuid4(),
        company_id=company_id,
        email_address="proposals@lunetron.ai",
        encrypted_access_token=enc.encrypt("access_token"),
        encrypted_refresh_token=enc.encrypt("revoked_refresh_token"),
        token_expiry=datetime.now(timezone.utc) - timedelta(hours=1),
        is_active=True,
    )

    mock_db = AsyncMock()
    mock_res = MagicMock()
    mock_res.scalar_one_or_none.return_value = account
    mock_db.execute.return_value = mock_res

    mock_response = MagicMock()
    mock_response.status_code = 400
    mock_response.json.return_value = {"error": "invalid_grant", "error_description": "Token has been expired or revoked."}

    with patch("httpx.AsyncClient.post", return_value=mock_response):
        with pytest.raises(ValueError, match="revoked or expired"):
            await GmailOAuthService.refresh_access_token(
                db=mock_db, account=account, encryption_service=enc
            )

    # Account must be marked inactive
    assert account.is_active is False
    mock_db.commit.assert_awaited_once()


@pytest.mark.asyncio
async def test_refresh_access_token_temporary_timeout_preserves_active(test_encryption_key):
    """Verify that network timeout during refresh raises error but keeps account active."""
    enc = TokenEncryptionService(test_encryption_key)
    account = EmailAccount(
        id=uuid.uuid4(),
        company_id=uuid.uuid4(),
        email_address="proposals@lunetron.ai",
        encrypted_access_token=enc.encrypt("old_token"),
        encrypted_refresh_token=enc.encrypt("valid_refresh"),
        token_expiry=datetime.now(timezone.utc) - timedelta(minutes=10),
        is_active=True,
    )
    mock_db = AsyncMock()
    mock_res = MagicMock()
    mock_res.scalar_one_or_none.return_value = account
    mock_db.execute.return_value = mock_res

    with patch("httpx.AsyncClient.post", side_effect=httpx.TimeoutException("Timeout")):
        with pytest.raises(ValueError, match="timed out. The account remains active"):
            await GmailOAuthService.refresh_access_token(db=mock_db, account=account, encryption_service=enc)

    assert account.is_active is True


@pytest.mark.asyncio
async def test_refresh_access_token_temporary_500_preserves_active(test_encryption_key):
    """Verify that 500 error from Google leaves account active."""
    enc = TokenEncryptionService(test_encryption_key)
    account = EmailAccount(
        id=uuid.uuid4(),
        company_id=uuid.uuid4(),
        email_address="proposals@lunetron.ai",
        encrypted_access_token=enc.encrypt("old_token"),
        encrypted_refresh_token=enc.encrypt("valid_refresh"),
        token_expiry=datetime.now(timezone.utc) - timedelta(minutes=10),
        is_active=True,
    )
    mock_db = AsyncMock()
    mock_res = MagicMock()
    mock_res.scalar_one_or_none.return_value = account
    mock_db.execute.return_value = mock_res

    mock_resp = MagicMock()
    mock_resp.status_code = 503
    with patch("httpx.AsyncClient.post", return_value=mock_resp):
        with pytest.raises(ValueError, match="temporarily unavailable. The account remains active"):
            await GmailOAuthService.refresh_access_token(db=mock_db, account=account, encryption_service=enc)

    assert account.is_active is True


@pytest.mark.asyncio
async def test_refresh_access_token_decryption_failure_deactivates(test_encryption_key):
    """Verify that undecryptable stored refresh token deactivates account."""
    enc = TokenEncryptionService(test_encryption_key)
    account = EmailAccount(
        id=uuid.uuid4(),
        company_id=uuid.uuid4(),
        email_address="proposals@lunetron.ai",
        encrypted_access_token=enc.encrypt("token"),
        encrypted_refresh_token="corrupted_not_valid_fernet",
        token_expiry=datetime.now(timezone.utc) - timedelta(minutes=10),
        is_active=True,
    )
    mock_db = AsyncMock()
    mock_res = MagicMock()
    mock_res.scalar_one_or_none.return_value = account
    mock_db.execute.return_value = mock_res

    with pytest.raises(ValueError, match="could not be decrypted"):
        await GmailOAuthService.refresh_access_token(db=mock_db, account=account, encryption_service=enc)

    assert account.is_active is False
    mock_db.commit.assert_awaited_once()


# ---------------------------------------------------------------------------
# API Integration & Tenant Isolation Tests
# ---------------------------------------------------------------------------


@pytest.mark.asyncio
async def test_authorize_endpoint_requires_admin(async_client):
    """Verify that only users with ADMIN role can initiate Gmail OAuth."""
    company_id = uuid.uuid4()
    admin_id = uuid.uuid4()
    member_id = uuid.uuid4()

    mock_db = AsyncMock()
    mock_db.add = MagicMock()
    app.dependency_overrides[get_db] = lambda: mock_db

    try:
        # Member user should be forbidden (403)
        member_headers = create_auth_headers(member_id, company_id, UserRole.MEMBER)
        resp = await async_client.get("/api/v1/integrations/gmail/authorize", headers=member_headers)
        assert resp.status_code == 403

        # Admin user should succeed (200)
        admin_headers = create_auth_headers(admin_id, company_id, UserRole.ADMIN)
        resp = await async_client.get("/api/v1/integrations/gmail/authorize", headers=admin_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "authorization_url" in data
        assert "state" in data
        assert "accounts.google.com" in data["authorization_url"]
    finally:
        app.dependency_overrides.pop(get_db, None)


@pytest.mark.asyncio
async def test_callback_handles_google_error(async_client):
    """Verify callback handles access_denied error cleanly without token exchange."""
    resp = await async_client.get(
        "/api/v1/integrations/gmail/callback",
        params={"error": "access_denied", "error_description": "User denied consent"},
    )
    assert resp.status_code == 400
    assert "User denied consent" in resp.json()["detail"]


@pytest.mark.asyncio
async def test_callback_missing_code_or_state(async_client):
    """Verify callback validates missing authorization code or state."""
    # Missing code
    resp1 = await async_client.get("/api/v1/integrations/gmail/callback", params={"state": "abc"})
    assert resp1.status_code == 400
    assert "code is missing" in resp1.json()["detail"].lower()

    # Missing state
    resp2 = await async_client.get("/api/v1/integrations/gmail/callback", params={"code": "123"})
    assert resp2.status_code == 400
    assert "state" in resp2.json()["detail"].lower()


@pytest.mark.asyncio
async def test_callback_successful_connection(async_client, test_encryption_key):
    """
    Verify full OAuth callback flow:
    - State is validated and consumed
    - Code is exchanged for tokens via mocked Google endpoint
    - User profile is fetched via mocked Google endpoint
    - Account is saved with encrypted tokens
    - Response contains clean metadata with NO tokens or client secrets
    """
    company_id = uuid.uuid4()
    user_id = uuid.uuid4()
    state, nonce = GmailOAuthService.create_oauth_state(company_id, user_id)

    mock_db = AsyncMock()
    mock_db.add = MagicMock()

    app.dependency_overrides[get_db] = lambda: mock_db

    try:
        mock_token_data = {
            "access_token": "ya29.mock_google_access_token_val",
            "refresh_token": "1//mock_google_refresh_token_val",
            "expires_in": 3600,
            "scope": "https://www.googleapis.com/auth/gmail.readonly",
        }

        mock_saved_account = EmailAccount(
            id=uuid.uuid4(),
            company_id=company_id,
            email_address="proposals@lunetron.ai",
            provider=EmailProvider.GMAIL.value,
            encrypted_access_token="ciphertext_access",
            encrypted_refresh_token="ciphertext_refresh",
            token_expiry=datetime.now(timezone.utc) + timedelta(hours=1),
            is_active=True,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )

        with patch.object(
            GmailOAuthService,
            "validate_and_consume_oauth_state",
            return_value={"company_id": company_id, "user_id": user_id, "nonce": nonce},
        ), patch.object(
            GmailOAuthService,
            "exchange_code_for_tokens",
            return_value=mock_token_data,
        ), patch.object(
            GmailOAuthService,
            "fetch_user_email",
            return_value="proposals@lunetron.ai",
        ), patch.object(
            GmailOAuthService,
            "save_or_update_account",
            return_value=mock_saved_account,
        ):

            resp = await async_client.get(
                "/api/v1/integrations/gmail/callback",
                params={"code": "mock_auth_code_from_google", "state": state},
            )

        assert resp.status_code == 200
        data = resp.json()

        # Check clean metadata response
        assert data["email_address"] == "proposals@lunetron.ai"
        assert data["company_id"] == str(company_id)
        assert data["is_active"] is True
        assert data["provider"] == "GMAIL"
        assert "token_expiry" in data

        # Security check: verify NO secrets or tokens leaked in response
        assert "access_token" not in data
        assert "refresh_token" not in data
        assert "encrypted_access_token" not in data
        assert "encrypted_refresh_token" not in data
        assert "client_secret" not in data
    finally:
        app.dependency_overrides.pop(get_db, None)


@pytest.mark.asyncio
async def test_tenant_isolation_connection_status(async_client, test_encryption_key):
    """Verify that Company A cannot see Company B's connected Gmail account."""
    enc = TokenEncryptionService(test_encryption_key)
    company_a_id = uuid.uuid4()
    company_b_id = uuid.uuid4()

    user_a = uuid.uuid4()
    user_b = uuid.uuid4()

    account_a = EmailAccount(
        company_id=company_a_id,
        email_address="proposals@companya.com",
        encrypted_access_token=enc.encrypt("token_a"),
        is_active=True,
    )

    mock_db = AsyncMock()

    def mock_execute(stmt):
        params = stmt.compile().params
        matching = any(str(v) == str(company_a_id) or v == company_a_id for v in params.values())
        res = MagicMock()
        if matching:
            res.scalars.return_value.first.return_value = account_a
        else:
            res.scalars.return_value.first.return_value = None
        return res

    mock_db.execute.side_effect = mock_execute
    app.dependency_overrides[get_db] = lambda: mock_db

    try:
        # User from Company A sees their connected account
        headers_a = create_auth_headers(user_a, company_a_id, UserRole.ADMIN)
        resp_a = await async_client.get("/api/v1/integrations/gmail/status", headers=headers_a)
        assert resp_a.status_code == 200
        assert resp_a.json()["connected"] is True
        assert resp_a.json()["account"]["email_address"] == "proposals@companya.com"

        # User from Company B gets connected: False (tenant isolated)
        headers_b = create_auth_headers(user_b, company_b_id, UserRole.ADMIN)
        resp_b = await async_client.get("/api/v1/integrations/gmail/status", headers=headers_b)
        assert resp_b.status_code == 200
        assert resp_b.json()["connected"] is False
        assert resp_b.json()["account"] is None
    finally:
        app.dependency_overrides.pop(get_db, None)


@pytest.mark.asyncio
async def test_status_endpoint_never_exposes_tokens(async_client, test_encryption_key):
    """Verify that status response schema never exposes stored token ciphertexts."""
    enc = TokenEncryptionService(test_encryption_key)
    company_id = uuid.uuid4()
    user_id = uuid.uuid4()

    account = EmailAccount(
        company_id=company_id,
        email_address="proposals@lunetron.ai",
        encrypted_access_token=enc.encrypt("secret_access"),
        encrypted_refresh_token=enc.encrypt("secret_refresh"),
        is_active=True,
    )

    mock_db = AsyncMock()
    mock_res = MagicMock()
    mock_res.scalars.return_value.first.return_value = account
    mock_db.execute.return_value = mock_res
    app.dependency_overrides[get_db] = lambda: mock_db

    try:
        headers = create_auth_headers(user_id, company_id, UserRole.MEMBER)
        resp = await async_client.get("/api/v1/integrations/gmail/status", headers=headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["connected"] is True
        acc_data = data["account"]
        assert "access_token" not in acc_data
        assert "refresh_token" not in acc_data
        assert "encrypted_access_token" not in acc_data
        assert "encrypted_refresh_token" not in acc_data
    finally:
        app.dependency_overrides.pop(get_db, None)


@pytest.mark.asyncio
async def test_disconnect_endpoint(async_client):
    """Verify that company admin can disconnect their Gmail account."""
    company_id = uuid.uuid4()
    admin_id = uuid.uuid4()

    mock_db = AsyncMock()
    account = EmailAccount(
        company_id=company_id,
        email_address="proposals@lunetron.ai",
        encrypted_access_token="enc_token",
        is_active=True,
    )

    mock_result = MagicMock()
    mock_result.scalars.return_value.first.return_value = account
    mock_db.execute.return_value = mock_result

    app.dependency_overrides[get_db] = lambda: mock_db

    try:
        headers = create_auth_headers(admin_id, company_id, UserRole.ADMIN)
        resp = await async_client.post("/api/v1/integrations/gmail/disconnect", headers=headers)
        assert resp.status_code == 200
        assert resp.json()["detail"] == "Gmail account disconnected successfully."
        assert account.is_active is False
        mock_db.commit.assert_awaited_once()
    finally:
        app.dependency_overrides.pop(get_db, None)


@pytest.mark.asyncio
async def test_refresh_endpoint_admin_only_and_safe_response(async_client, test_encryption_key):
    """Verify refresh endpoint enforces ADMIN role and does not expose secrets."""
    enc = TokenEncryptionService(test_encryption_key)
    company_id = uuid.uuid4()
    admin_id = uuid.uuid4()
    member_id = uuid.uuid4()

    account = EmailAccount(
        id=uuid.uuid4(),
        company_id=company_id,
        email_address="proposals@lunetron.ai",
        encrypted_access_token=enc.encrypt("old_token"),
        encrypted_refresh_token=enc.encrypt("refresh_token"),
        token_expiry=datetime.now(timezone.utc) - timedelta(minutes=10),
        is_active=True,
    )

    mock_db = AsyncMock()
    mock_res = MagicMock()
    mock_res.scalars.return_value.first.return_value = account
    mock_res.scalar_one_or_none.return_value = account
    mock_db.execute.return_value = mock_res
    app.dependency_overrides[get_db] = lambda: mock_db

    try:
        # Member receives 403
        member_headers = create_auth_headers(member_id, company_id, UserRole.MEMBER)
        resp_mem = await async_client.post("/api/v1/integrations/gmail/refresh", headers=member_headers)
        assert resp_mem.status_code == 403

        # Admin receives 200 with refreshed account
        account.token_expiry = datetime.now(timezone.utc) + timedelta(hours=1)
        with patch.object(GmailOAuthService, "refresh_access_token", return_value=account):
            admin_headers = create_auth_headers(admin_id, company_id, UserRole.ADMIN)
            resp = await async_client.post("/api/v1/integrations/gmail/refresh", headers=admin_headers)

        assert resp.status_code == 200
        data = resp.json()
        assert data["email_address"] == "proposals@lunetron.ai"
        assert data["is_active"] is True
        assert "access_token" not in data
        assert "refresh_token" not in data
        assert "encrypted_access_token" not in data
        assert "encrypted_refresh_token" not in data
    finally:
        app.dependency_overrides.pop(get_db, None)


# ---------------------------------------------------------------------------
# Migration Chain Compatibility Test
# ---------------------------------------------------------------------------


def test_migration_006_metadata():
    """Verify that migration 006 links directly to 005_add_email_accounts and defines required hooks."""
    mig = importlib.import_module("migrations.versions.006_add_oauth_states")
    assert mig.revision == "006_add_oauth_states"
    assert mig.down_revision == "005_add_email_accounts"
    assert callable(mig.upgrade)
    assert callable(mig.downgrade)
