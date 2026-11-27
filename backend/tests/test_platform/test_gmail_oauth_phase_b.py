"""
Tests for Phase B: Real Gmail OAuth Integration & Centralized Token Lifecycle.
Verifies:
- Centralized token retrieval and automatic refresh via get_valid_access_token
- decrypt_token helper method
- Real token retrieval in GmailSyncService and GmailSendService
- Browser callback redirection vs API JSON content negotiation
- Safe error sanitization in browser redirects
- Backward-compatible environment variable aliases (GOOGLE_* and GMAIL_*)
- Custom OAuth scopes configuration
"""

import uuid
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import Response

from app.core.config import Settings
from app.core.database import get_db
from app.core.security import TokenEncryptionService
from app.main import app
from app.models.email import Email, EmailDirection
from app.models.email_account import EmailAccount, EmailProvider
from app.models.proposal import Proposal, ProposalStatus
from app.platform.integrations.gmail.client import GmailClient
from app.platform.services.gmail_oauth_service import GmailOAuthService
from app.platform.services.gmail_send_service import GmailSendService
from app.platform.services.gmail_sync_service import GmailSyncService


@pytest.fixture
def test_encryption_key():
    return TokenEncryptionService.generate_key()


@pytest.fixture(autouse=True)
def configure_test_settings(monkeypatch, test_encryption_key):
    monkeypatch.setattr("app.core.config.settings.GMAIL_CLIENT_ID", "mock-client-id-12345.apps.googleusercontent.com")
    monkeypatch.setattr("app.core.config.settings.GMAIL_CLIENT_SECRET", "mock-client-secret-xyz")
    monkeypatch.setattr("app.core.config.settings.GMAIL_REDIRECT_URI", "http://localhost:8000/api/v1/integrations/gmail/callback")
    monkeypatch.setattr("app.core.config.settings.FRONTEND_URL", "http://localhost:3000")
    monkeypatch.setattr("app.core.config.settings.GMAIL_TOKEN_ENCRYPTION_KEY", test_encryption_key)
    monkeypatch.setattr("app.core.security.settings.GMAIL_TOKEN_ENCRYPTION_KEY", test_encryption_key)


# ============================================================================
# 1. Token Retrieval & Decryption Tests
# ============================================================================

def test_decrypt_token_helper(test_encryption_key):
    """Verify GmailOAuthService.decrypt_token decrypts ciphertext accurately."""
    enc = TokenEncryptionService(test_encryption_key)
    plaintext = "ya29.sample_valid_access_token_12345"
    ciphertext = enc.encrypt(plaintext)

    decrypted = GmailOAuthService.decrypt_token(ciphertext, encryption_service=enc)
    assert decrypted == plaintext


@pytest.mark.asyncio
async def test_get_valid_access_token_not_expired(test_encryption_key):
    """Verify get_valid_access_token returns current token when still valid."""
    enc = TokenEncryptionService(test_encryption_key)
    plaintext = "ya29.fresh_access_token_999"
    ciphertext = enc.encrypt(plaintext)

    account = EmailAccount(
        company_id=uuid.uuid4(),
        email_address="ops@lunetron.com",
        encrypted_access_token=ciphertext,
        encrypted_refresh_token=enc.encrypt("1//refresh_token"),
        token_expiry=datetime.now(timezone.utc) + timedelta(hours=1),
        is_active=True,
    )

    mock_db = AsyncMock()
    mock_db.add = MagicMock()
    result = await GmailOAuthService.get_valid_access_token(mock_db, account, encryption_service=enc)
    assert result == plaintext


@pytest.mark.asyncio
async def test_get_valid_access_token_auto_refreshes_when_expired(test_encryption_key):
    """Verify get_valid_access_token auto-refreshes expired token and returns fresh plaintext."""
    enc = TokenEncryptionService(test_encryption_key)
    old_token = "ya29.expired_token_111"
    new_token = "ya29.refreshed_fresh_token_222"

    account = EmailAccount(
        id=uuid.uuid4(),
        company_id=uuid.uuid4(),
        email_address="ops@lunetron.com",
        encrypted_access_token=enc.encrypt(old_token),
        encrypted_refresh_token=enc.encrypt("1//refresh_token"),
        token_expiry=datetime.now(timezone.utc) - timedelta(minutes=10),  # expired
        is_active=True,
    )

    mock_db = AsyncMock()
    mock_db.add = MagicMock()
    mock_db.execute = AsyncMock(return_value=MagicMock(scalar_one_or_none=lambda: account))
    mock_db.commit = AsyncMock()
    mock_db.refresh = AsyncMock()

    mock_google_response = Response(
        status_code=200,
        json={"access_token": new_token, "expires_in": 3600, "token_type": "Bearer"},
        request=MagicMock(),
    )

    with patch("httpx.AsyncClient.post", return_value=mock_google_response):
        retrieved_token = await GmailOAuthService.get_valid_access_token(
            mock_db, account, encryption_service=enc
        )

    assert retrieved_token == new_token
    assert enc.decrypt(account.encrypted_access_token) == new_token


@pytest.mark.asyncio
async def test_get_valid_access_token_auto_refreshes_within_5_minutes(test_encryption_key):
    """Verify get_valid_access_token proactively refreshes tokens within 5 min threshold."""
    enc = TokenEncryptionService(test_encryption_key)
    old_token = "ya29.soon_to_expire_token"
    new_token = "ya29.brand_new_token"

    account = EmailAccount(
        id=uuid.uuid4(),
        company_id=uuid.uuid4(),
        email_address="ops@lunetron.com",
        encrypted_access_token=enc.encrypt(old_token),
        encrypted_refresh_token=enc.encrypt("1//refresh_token"),
        token_expiry=datetime.now(timezone.utc) + timedelta(minutes=2),  # within 5 min window
        is_active=True,
    )

    mock_db = AsyncMock()
    mock_db.add = MagicMock()
    mock_db.execute = AsyncMock(return_value=MagicMock(scalar_one_or_none=lambda: account))
    mock_db.commit = AsyncMock()
    mock_db.refresh = AsyncMock()

    mock_google_response = Response(
        status_code=200,
        json={"access_token": new_token, "expires_in": 3600, "token_type": "Bearer"},
        request=MagicMock(),
    )

    with patch("httpx.AsyncClient.post", return_value=mock_google_response):
        retrieved_token = await GmailOAuthService.get_valid_access_token(
            mock_db, account, encryption_service=enc
        )

    assert retrieved_token == new_token


# ============================================================================
# 2. Integration of Real Token Retrieval in Sync and Send Services
# ============================================================================

@pytest.mark.asyncio
async def test_sync_service_real_token_retrieval(test_encryption_key):
    """Verify GmailSyncService.get_authenticated_client uses get_valid_access_token and instantiates GmailClient."""
    enc = TokenEncryptionService(test_encryption_key)
    valid_token = "ya29.real_client_test_token"

    account = EmailAccount(
        id=uuid.uuid4(),
        company_id=uuid.uuid4(),
        email_address="sync@lunetron.com",
        encrypted_access_token=enc.encrypt(valid_token),
        encrypted_refresh_token=enc.encrypt("1//refresh"),
        token_expiry=datetime.now(timezone.utc) + timedelta(hours=1),
        is_active=True,
    )

    mock_db = AsyncMock()
    mock_db.add = MagicMock()

    with patch.object(GmailOAuthService, "get_valid_access_token", return_value=valid_token) as mock_get_token:
        client = await GmailSyncService.get_authenticated_client(mock_db, account)

    mock_get_token.assert_awaited_once_with(mock_db, account)
    assert isinstance(client, GmailClient)
    assert client.access_token == valid_token


@pytest.mark.asyncio
async def test_send_service_real_token_retrieval(test_encryption_key):
    """Verify GmailSendService resolves real GmailClient via get_valid_access_token when custom_client is None."""
    company_id = uuid.uuid4()
    proposal_id = uuid.uuid4()
    valid_token = "ya29.real_send_test_token"

    enc = TokenEncryptionService(test_encryption_key)
    account = EmailAccount(
        id=uuid.uuid4(),
        company_id=company_id,
        email_address="send@lunetron.com",
        encrypted_access_token=enc.encrypt(valid_token),
        encrypted_refresh_token=enc.encrypt("1//refresh"),
        token_expiry=datetime.now(timezone.utc) + timedelta(hours=1),
        is_active=True,
    )

    proposal = Proposal(
        id=proposal_id,
        company_id=company_id,
        title="RFP Response",
        status=ProposalStatus.APPROVED,
    )

    outgoing = Email(
        company_id=company_id,
        proposal_id=proposal_id,
        direction=EmailDirection.OUTGOING,
        sender_address="send@lunetron.com",
        recipient_address="client@enterprise.com",
        subject="Re: RFP Response",
        body="Grounded proposal draft content.",
    )

    mock_db = AsyncMock()
    mock_db.add = MagicMock()

    def mock_execute(stmt):
        stmt_str = str(stmt).lower()
        mock_result = MagicMock()
        if "from proposals" in stmt_str:
            mock_result.scalar_one_or_none.return_value = proposal
        elif "direction = :direction_1" in stmt_str or "outgoing" in stmt_str:
            mock_result.scalars.return_value.first.return_value = outgoing
        elif "direction = :direction_2" in stmt_str or "incoming" in stmt_str:
            mock_result.scalars.return_value.first.return_value = None
        return mock_result

    mock_db.execute = AsyncMock(side_effect=mock_execute)
    mock_db.commit = AsyncMock()
    mock_db.refresh = AsyncMock()

    mock_send_result = {"id": "gmail_msg_987", "threadId": "thread_987"}

    with patch.object(GmailOAuthService, "get_company_email_account", return_value=account), \
         patch.object(GmailOAuthService, "get_valid_access_token", return_value=valid_token) as mock_get_token, \
         patch.object(GmailClient, "send_message", return_value=mock_send_result) as mock_send_api:

        sent_proposal = await GmailSendService.send_approved_proposal(
            db=mock_db,
            proposal_id=proposal_id,
            company_id=company_id,
            custom_client=None,  # triggers real client branch
        )

    mock_get_token.assert_awaited_once_with(mock_db, account)
    mock_send_api.assert_called_once()
    assert sent_proposal.status == ProposalStatus.SENT


# ============================================================================
# 3. Browser Redirection & Content Negotiation Tests
# ============================================================================

@pytest.mark.asyncio
async def test_callback_browser_redirect_success(async_client, test_encryption_key):
    """Verify that browser requests with Accept: text/html redirect to {FRONTEND_URL}/settings?tab=integrations&connected=gmail."""
    company_id = uuid.uuid4()
    user_id = uuid.uuid4()
    state, nonce = GmailOAuthService.create_oauth_state(company_id, user_id)

    mock_db = AsyncMock()
    mock_db.add = MagicMock()
    app.dependency_overrides[get_db] = lambda: mock_db

    try:
        mock_token_data = {
            "access_token": "ya29.browser_redirect_token",
            "refresh_token": "1//browser_refresh",
            "expires_in": 3600,
        }

        mock_saved_account = EmailAccount(
            id=uuid.uuid4(),
            company_id=company_id,
            email_address="browser@lunetron.ai",
            provider=EmailProvider.GMAIL.value,
            encrypted_access_token="ciphertext",
            token_expiry=datetime.now(timezone.utc) + timedelta(hours=1),
            is_active=True,
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
            return_value="browser@lunetron.ai",
        ), patch.object(
            GmailOAuthService,
            "save_or_update_account",
            return_value=mock_saved_account,
        ):

            resp = await async_client.get(
                "/api/v1/integrations/gmail/callback",
                params={"code": "mock_code", "state": state},
                headers={"Accept": "text/html,application/xhtml+xml"},
                follow_redirects=False,
            )

        assert resp.status_code == 302
        assert resp.headers["location"] == "http://localhost:3000/settings?tab=integrations&connected=gmail"
    finally:
        app.dependency_overrides.pop(get_db, None)


@pytest.mark.asyncio
async def test_callback_browser_redirect_on_google_error(async_client):
    """Verify browser redirect on Google provider error (access_denied) without leaking sensitive info."""
    resp = await async_client.get(
        "/api/v1/integrations/gmail/callback",
        params={"error": "access_denied", "error_description": "User denied consent"},
        headers={"Accept": "text/html"},
        follow_redirects=False,
    )
    assert resp.status_code == 302
    assert resp.headers["location"] == "http://localhost:3000/settings?tab=integrations&error=access_denied"


@pytest.mark.asyncio
async def test_callback_browser_redirect_on_invalid_state(async_client):
    """Verify browser redirect when state parameter is invalid or missing."""
    resp = await async_client.get(
        "/api/v1/integrations/gmail/callback",
        params={"code": "some_code", "state": "tampered_or_invalid_state"},
        headers={"Accept": "text/html"},
        follow_redirects=False,
    )
    assert resp.status_code == 302
    assert resp.headers["location"] == "http://localhost:3000/settings?tab=integrations&error=invalid_state"


@pytest.mark.asyncio
async def test_callback_browser_redirect_on_missing_code(async_client):
    """Verify browser redirect when authorization code is missing."""
    resp = await async_client.get(
        "/api/v1/integrations/gmail/callback",
        params={"state": "some_state"},
        headers={"Accept": "text/html"},
        follow_redirects=False,
    )
    assert resp.status_code == 302
    assert resp.headers["location"] == "http://localhost:3000/settings?tab=integrations&error=missing_code"


@pytest.mark.asyncio
async def test_callback_explicit_redirect_param_overrides(async_client, test_encryption_key):
    """Verify explicit redirect=false query param returns JSON even with text/html Accept header."""
    company_id = uuid.uuid4()
    user_id = uuid.uuid4()
    state, nonce = GmailOAuthService.create_oauth_state(company_id, user_id)

    mock_db = AsyncMock()
    mock_db.add = MagicMock()
    app.dependency_overrides[get_db] = lambda: mock_db

    try:
        mock_saved_account = EmailAccount(
            id=uuid.uuid4(),
            company_id=company_id,
            email_address="explicit@lunetron.ai",
            provider=EmailProvider.GMAIL.value,
            encrypted_access_token="ciphertext",
            token_expiry=datetime.now(timezone.utc) + timedelta(hours=1),
            is_active=True,
        )

        with patch.object(
            GmailOAuthService,
            "validate_and_consume_oauth_state",
            return_value={"company_id": company_id, "user_id": user_id, "nonce": nonce},
        ), patch.object(
            GmailOAuthService,
            "exchange_code_for_tokens",
            return_value={"access_token": "ya29.token", "expires_in": 3600},
        ), patch.object(
            GmailOAuthService,
            "fetch_user_email",
            return_value="explicit@lunetron.ai",
        ), patch.object(
            GmailOAuthService,
            "save_or_update_account",
            return_value=mock_saved_account,
        ):

            resp = await async_client.get(
                "/api/v1/integrations/gmail/callback",
                params={"code": "mock_code", "state": state, "redirect": "false"},
                headers={"Accept": "text/html"},
            )

        assert resp.status_code == 200
        assert resp.json()["email_address"] == "explicit@lunetron.ai"
    finally:
        app.dependency_overrides.pop(get_db, None)


# ============================================================================
# 4. Configuration Compatibility & Scope Aliasing Tests
# ============================================================================

def test_configuration_aliases_compatibility(monkeypatch):
    """Verify that GOOGLE_* aliases populate GMAIL_* and vice versa."""
    monkeypatch.delenv("GMAIL_CLIENT_ID", raising=False)
    monkeypatch.delenv("GOOGLE_CLIENT_ID", raising=False)
    monkeypatch.delenv("GMAIL_CLIENT_SECRET", raising=False)
    monkeypatch.delenv("GOOGLE_CLIENT_SECRET", raising=False)
    monkeypatch.delenv("GMAIL_REDIRECT_URI", raising=False)
    monkeypatch.delenv("GOOGLE_REDIRECT_URI", raising=False)

    # Test setting GOOGLE_* populates GMAIL_*
    s1 = Settings(
        GOOGLE_CLIENT_ID="google-client-alias.apps.googleusercontent.com",
        GOOGLE_CLIENT_SECRET="google-secret-alias",
        GOOGLE_REDIRECT_URI="http://localhost:8000/callback-google",
        _env_file=None,
    )
    assert s1.GMAIL_CLIENT_ID == "google-client-alias.apps.googleusercontent.com"
    assert s1.GMAIL_CLIENT_SECRET == "google-secret-alias"
    assert s1.GMAIL_REDIRECT_URI == "http://localhost:8000/callback-google"
    assert s1.google_client_id == "google-client-alias.apps.googleusercontent.com"
    assert s1.google_client_secret == "google-secret-alias"
    assert s1.google_redirect_uri == "http://localhost:8000/callback-google"

    # Test setting GMAIL_* populates GOOGLE_*
    s2 = Settings(
        GMAIL_CLIENT_ID="gmail-client.apps.googleusercontent.com",
        GMAIL_CLIENT_SECRET="gmail-secret",
        _env_file=None,
    )
    assert s2.GOOGLE_CLIENT_ID == "gmail-client.apps.googleusercontent.com"
    assert s2.GOOGLE_CLIENT_SECRET == "gmail-secret"
    assert s2.google_client_id == "gmail-client.apps.googleusercontent.com"


def test_custom_oauth_scopes_resolution():
    """Verify custom GOOGLE_OAUTH_SCOPES resolves correctly to list of scopes."""
    custom_scopes_str = "https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send"
    s = Settings(GOOGLE_OAUTH_SCOPES=custom_scopes_str, _env_file=None)
    assert s.oauth_scopes == [
        "https://www.googleapis.com/auth/gmail.readonly",
        "https://www.googleapis.com/auth/gmail.send",
    ]

    # Test default scopes when GOOGLE_OAUTH_SCOPES is None
    s_default = Settings(_env_file=None)
    assert "https://www.googleapis.com/auth/gmail.readonly" in s_default.oauth_scopes
    assert "https://www.googleapis.com/auth/gmail.send" in s_default.oauth_scopes
    assert "https://www.googleapis.com/auth/userinfo.email" in s_default.oauth_scopes
