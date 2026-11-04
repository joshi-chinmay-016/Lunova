import secrets
import urllib.parse
from datetime import datetime, timedelta, timezone
from typing import Optional
from uuid import UUID

import httpx
import jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.security import (
    TokenEncryptionService,
    MissingEncryptionKeyError,
    InvalidEncryptionKeyError,
    TokenDecryptionError,
    get_encryption_service,
)
from app.models.email_account import EmailAccount, EmailProvider
from app.models.oauth_state import OAuthState
from app.models.user import User, UserRole

GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"

# Minimal scopes required for Lunova MVP (inbound RFP reading, outbound proposal sending, email identity)
GMAIL_SCOPES = [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/userinfo.email",
]

# Standard HTTP timeout configuration (5s connect, 15s read)
HTTP_TIMEOUT = httpx.Timeout(15.0, connect=5.0)


class GmailOAuthService:
    """
    Handles secure Google OAuth2 operations, durable state verification, token exchange,
    encrypted token persistence, and concurrency-safe token refresh for multi-tenant Gmail integration.
    """

    @classmethod
    def validate_configuration(cls) -> None:
        """
        Validates that required Gmail OAuth client credentials and encryption key
        are configured in application settings.
        """
        if not settings.GMAIL_CLIENT_ID or not settings.GMAIL_CLIENT_ID.strip():
            raise ValueError("Gmail client ID (GMAIL_CLIENT_ID) is not configured.")

        if not settings.GMAIL_CLIENT_SECRET or not settings.GMAIL_CLIENT_SECRET.strip():
            raise ValueError("Gmail client secret (GMAIL_CLIENT_SECRET) is not configured.")

        # Validate encryption key configuration by instantiating the service
        TokenEncryptionService()

    @classmethod
    def create_oauth_state(
        cls, company_id: UUID, user_id: UUID, nonce: Optional[str] = None
    ) -> tuple[str, str]:
        """
        Creates a signed JWT state token for Gmail OAuth.
        Returns (state_jwt, nonce).
        """
        now = datetime.now(timezone.utc)
        expires_at = now + timedelta(minutes=15)
        nonce_str = nonce or secrets.token_urlsafe(32)
        payload = {
            "sub": str(user_id),
            "company_id": str(company_id),
            "nonce": nonce_str,
            "purpose": "gmail_oauth",
            "exp": expires_at,
            "iat": now,
        }
        state = jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
        return state, nonce_str

    @classmethod
    def validate_oauth_state(cls, state: Optional[str]) -> dict:
        """
        Decodes and validates cryptographic signature, algorithm, expiration,
        purpose, and expected claims of an OAuth state token.
        Does not consume the state from database.
        """
        if not state or not isinstance(state, str) or not state.strip():
            raise ValueError("OAuth state parameter is missing.")

        try:
            payload = jwt.decode(
                state.strip(),
                settings.JWT_SECRET_KEY,
                algorithms=[settings.JWT_ALGORITHM],
                options={"require": ["exp", "sub", "company_id", "nonce", "purpose"]},
            )
        except jwt.ExpiredSignatureError as exc:
            raise ValueError("OAuth state parameter has expired.") from exc
        except jwt.InvalidAlgorithmError as exc:
            raise ValueError("Invalid OAuth state signing algorithm.") from exc
        except jwt.PyJWTError as exc:
            raise ValueError("Invalid or tampered OAuth state parameter.") from exc

        if payload.get("purpose") != "gmail_oauth":
            raise ValueError("Invalid OAuth state purpose.")

        try:
            company_id = UUID(payload["company_id"])
            user_id = UUID(payload["sub"])
            nonce = str(payload["nonce"])
        except (KeyError, ValueError, TypeError) as exc:
            raise ValueError("Corrupted OAuth state payload.") from exc

        return {
            "company_id": company_id,
            "user_id": user_id,
            "nonce": nonce,
            "exp": payload.get("exp"),
        }

    @classmethod
    async def create_authorization_url(
        cls, company_id: UUID, user_id: UUID, db: AsyncSession
    ) -> tuple[str, str]:
        """
        Builds the Google OAuth authorization URL requesting offline access (refresh token)
        and consent prompt with durable single-use CSRF state tracked in the database.
        """
        cls.validate_configuration()

        state, nonce = cls.create_oauth_state(company_id=company_id, user_id=user_id)
        now = datetime.now(timezone.utc)
        expires_at = now + timedelta(minutes=15)

        # Durably record the outstanding authorization attempt in the database
        state_record = OAuthState(
            company_id=company_id,
            user_id=user_id,
            nonce=nonce,
            expires_at=expires_at,
            created_at=now,
        )
        db.add(state_record)
        await db.commit()

        params = {
            "client_id": settings.GMAIL_CLIENT_ID,
            "redirect_uri": settings.GMAIL_REDIRECT_URI,
            "response_type": "code",
            "scope": " ".join(GMAIL_SCOPES),
            "access_type": "offline",
            "prompt": "consent",
            "state": state,
            "include_granted_scopes": "true",
        }

        url = f"{GOOGLE_AUTH_URL}?{urllib.parse.urlencode(params)}"
        return url, state

    @classmethod
    async def validate_and_consume_oauth_state(
        cls, db: AsyncSession, state: Optional[str]
    ) -> dict:
        """
        Validates the OAuth state parameter and atomically consumes the single-use nonce:
        1. Validates JWT signature, expected algorithm, expiration, and payload structure.
        2. Validates 'gmail_oauth' purpose and extracts company_id, user_id, and nonce.
        3. Atomically checks and burns the database nonce using row-locking (with_for_update).
        4. Rejects expired, tampered, missing, or already-consumed states.
        5. Verifies that the user still exists, is active, and retains the ADMIN role.
        """
        claims = cls.validate_oauth_state(state)
        company_id = claims["company_id"]
        user_id = claims["user_id"]
        nonce = claims["nonce"]

        now = datetime.now(timezone.utc)

        # Atomically check and consume outstanding nonce with row-level locking
        stmt = (
            select(OAuthState)
            .filter(
                OAuthState.nonce == nonce,
                OAuthState.company_id == company_id,
                OAuthState.user_id == user_id,
            )
            .with_for_update()
        )
        result = await db.execute(stmt)
        record = result.scalar_one_or_none()

        if not record:
            raise ValueError("OAuth state nonce not found or unauthorized.")

        if record.consumed_at is not None:
            raise ValueError("OAuth state has already been consumed (replay detected).")

        if record.expires_at <= now:
            raise ValueError("OAuth state has expired.")

        # Mark state consumed immediately
        record.consumed_at = now
        await db.flush()

        # Verify that initiating user is still authorized under the membership model
        user_stmt = select(User).filter(
            User.id == user_id,
            User.company_id == company_id,
        )
        user_result = await db.execute(user_stmt)
        user = user_result.scalar_one_or_none()

        if not user:
            raise ValueError("User associated with this authorization attempt no longer exists for this company.")

        if user.role != UserRole.ADMIN:
            raise ValueError("User is no longer authorized as an administrator for this company.")

        await db.commit()

        return {
            "company_id": company_id,
            "user_id": user_id,
            "nonce": nonce,
        }

    @classmethod
    async def exchange_code_for_tokens(cls, code: str) -> dict:
        """
        Exchanges the authorization code for access and refresh tokens.
        Handles connection timeouts, request failures, and sanitizes error responses.
        """
        if not code or not isinstance(code, str) or not code.strip():
            raise ValueError("Authorization code is missing.")

        cls.validate_configuration()

        data = {
            "code": code.strip(),
            "client_id": settings.GMAIL_CLIENT_ID,
            "client_secret": settings.GMAIL_CLIENT_SECRET,
            "redirect_uri": settings.GMAIL_REDIRECT_URI,
            "grant_type": "authorization_code",
        }

        try:
            async with httpx.AsyncClient(timeout=HTTP_TIMEOUT) as client:
                response = await client.post(GOOGLE_TOKEN_URL, data=data)
        except httpx.TimeoutException as exc:
            raise ValueError("Google OAuth token exchange timed out. Please try again.") from exc
        except httpx.RequestError as exc:
            raise ValueError("Network error communicating with Google OAuth service.") from exc

        if response.status_code != 200:
            try:
                err_json = response.json()
                err_code = err_json.get("error", "token_exchange_failed")
            except Exception:
                err_code = "token_exchange_failed"
            raise ValueError(f"Google token exchange failed ({err_code}).")

        try:
            token_payload = response.json()
        except Exception as exc:
            raise ValueError("Google returned a malformed response.") from exc

        if not isinstance(token_payload, dict) or not token_payload.get("access_token"):
            raise ValueError("Google response missing valid access token.")

        return token_payload

    @classmethod
    async def fetch_user_email(cls, access_token: str) -> str:
        """
        Fetches the primary email address for the authenticated Google account.
        Validates email format and handles network timeouts safely.
        """
        if not access_token or not isinstance(access_token, str):
            raise ValueError("Access token required to fetch user profile.")

        headers = {"Authorization": f"Bearer {access_token}"}
        try:
            async with httpx.AsyncClient(timeout=HTTP_TIMEOUT) as client:
                response = await client.get(GOOGLE_USERINFO_URL, headers=headers)
        except httpx.TimeoutException as exc:
            raise ValueError("Google UserInfo request timed out.") from exc
        except httpx.RequestError as exc:
            raise ValueError("Network error contacting Google UserInfo service.") from exc

        if response.status_code != 200:
            raise ValueError("Failed to retrieve user profile from Google.")

        try:
            profile_data = response.json()
        except Exception as exc:
            raise ValueError("Malformed Google profile response.") from exc

        email = profile_data.get("email")
        if not email or not isinstance(email, str) or "@" not in email:
            raise ValueError("Valid user email not found in Google profile response.")

        return email.lower().strip()

    @classmethod
    async def save_or_update_account(
        cls,
        db: AsyncSession,
        company_id: UUID,
        email_address: str,
        token_data: dict,
        encryption_service: Optional[TokenEncryptionService] = None,
    ) -> EmailAccount:
        """
        Persists or updates an EmailAccount record with encrypted tokens.
        - Enforces tenant isolation using company_id.
        - Preserves existing refresh tokens if Google does not return a new one on re-consent.
        - Accurately computes token expiry using timezone-aware datetimes.
        - Sets is_active = True only after successful token encryption and persistence.
        - Employs row-locking to prevent concurrent creation race conditions.
        """
        enc = encryption_service or get_encryption_service()
        normalized_email = email_address.lower().strip()

        raw_access_token = token_data.get("access_token")
        if not raw_access_token or not isinstance(raw_access_token, str):
            raise ValueError("Access token missing in Google token response.")

        encrypted_access_token = enc.encrypt(raw_access_token)

        raw_refresh_token = token_data.get("refresh_token")
        encrypted_new_refresh_token = (
            enc.encrypt(raw_refresh_token) if raw_refresh_token and isinstance(raw_refresh_token, str) else None
        )

        expires_in = token_data.get("expires_in")
        try:
            expires_in_secs = int(expires_in) if expires_in is not None else 3600
        except (ValueError, TypeError):
            expires_in_secs = 3600

        token_expiry = datetime.now(timezone.utc) + timedelta(seconds=expires_in_secs)

        # Check for existing account matching the tenant unique constraint with row lock
        stmt = (
            select(EmailAccount)
            .filter(
                EmailAccount.company_id == company_id,
                EmailAccount.provider == EmailProvider.GMAIL.value,
                EmailAccount.email_address == normalized_email,
            )
            .with_for_update()
        )
        result = await db.execute(stmt)
        existing_account = result.scalar_one_or_none()

        now = datetime.now(timezone.utc)

        if existing_account:
            existing_account.encrypted_access_token = encrypted_access_token
            # Preserve existing refresh token if Google didn't issue a new one
            if encrypted_new_refresh_token is not None:
                existing_account.encrypted_refresh_token = encrypted_new_refresh_token
            existing_account.token_expiry = token_expiry
            existing_account.is_active = True
            existing_account.updated_at = now
            account = existing_account
        else:
            account = EmailAccount(
                company_id=company_id,
                provider=EmailProvider.GMAIL.value,
                email_address=normalized_email,
                encrypted_access_token=encrypted_access_token,
                encrypted_refresh_token=encrypted_new_refresh_token,
                token_expiry=token_expiry,
                is_active=True,
                created_at=now,
                updated_at=now,
            )
            db.add(account)

        await db.commit()
        await db.refresh(account)
        return account

    @classmethod
    async def refresh_access_token(
        cls,
        db: AsyncSession,
        account: EmailAccount,
        encryption_service: Optional[TokenEncryptionService] = None,
    ) -> EmailAccount:
        """
        Securely refreshes the access token for an EmailAccount using its decrypted refresh token.
        - Concurrency-safe: acquires a row lock and re-checks expiration before refreshing.
        - Updates encrypted_access_token and token_expiry upon success.
        - Preserves existing refresh token if Google does not issue a rotating one.
        - Deactivates account (is_active = False) if the refresh token has been revoked or expired.
        - Distinguishes temporary network/server outages from revoked grants (does not deactivate on temporary errors).
        """
        cls.validate_configuration()
        enc = encryption_service or get_encryption_service()

        # Acquire row lock to prevent concurrent refresh races
        lock_stmt = select(EmailAccount).filter(EmailAccount.id == account.id).with_for_update()
        lock_res = await db.execute(lock_stmt)
        locked_account = lock_res.scalar_one_or_none() or account

        # Check if another concurrent worker has already refreshed the token
        threshold = datetime.now(timezone.utc) + timedelta(minutes=5)
        if locked_account.token_expiry and locked_account.token_expiry > threshold:
            return locked_account

        if not locked_account.encrypted_refresh_token:
            raise ValueError("No refresh token available. Account must be reconnected.")

        try:
            decrypted_refresh_token = enc.decrypt(locked_account.encrypted_refresh_token)
        except TokenDecryptionError as exc:
            locked_account.is_active = False
            locked_account.updated_at = datetime.now(timezone.utc)
            await db.commit()
            raise ValueError("Stored refresh token could not be decrypted. Please reconnect.") from exc

        data = {
            "client_id": settings.GMAIL_CLIENT_ID,
            "client_secret": settings.GMAIL_CLIENT_SECRET,
            "refresh_token": decrypted_refresh_token,
            "grant_type": "refresh_token",
        }

        try:
            async with httpx.AsyncClient(timeout=HTTP_TIMEOUT) as client:
                response = await client.post(GOOGLE_TOKEN_URL, data=data)
        except httpx.TimeoutException as exc:
            # Temporary error: do NOT deactivate account
            raise ValueError("Google OAuth token refresh timed out. The account remains active.") from exc
        except httpx.RequestError as exc:
            # Temporary error: do NOT deactivate account
            raise ValueError("Network error contacting Google OAuth token refresh service. The account remains active.") from exc

        if response.status_code in (400, 401):
            try:
                err_payload = response.json()
                error_type = err_payload.get("error", "")
            except Exception:
                error_type = ""

            if error_type in ("invalid_grant", "unauthorized_client") or response.status_code == 401:
                locked_account.is_active = False
                locked_account.updated_at = datetime.now(timezone.utc)
                await db.commit()
                raise ValueError(
                    "Gmail account authorization has been revoked or expired. Please reconnect."
                )
            raise ValueError(f"Failed to refresh access token ({error_type or 'invalid_request'}).")

        if response.status_code != 200:
            # Temporary Google 5xx or unexpected outage: do NOT deactivate account
            raise ValueError("Google OAuth service is temporarily unavailable. The account remains active.")

        try:
            resp_data = response.json()
        except Exception as exc:
            raise ValueError("Malformed response from Google token refresh service.") from exc

        new_access_token = resp_data.get("access_token")
        if not new_access_token:
            raise ValueError("Access token missing in refresh response.")

        locked_account.encrypted_access_token = enc.encrypt(new_access_token)

        try:
            new_expires_in = int(resp_data.get("expires_in", 3600))
        except (ValueError, TypeError):
            new_expires_in = 3600

        locked_account.token_expiry = datetime.now(timezone.utc) + timedelta(seconds=new_expires_in)

        # Update refresh token if Google returned a new rotating refresh token
        if resp_data.get("refresh_token") and isinstance(resp_data["refresh_token"], str):
            locked_account.encrypted_refresh_token = enc.encrypt(resp_data["refresh_token"])

        locked_account.is_active = True
        locked_account.updated_at = datetime.now(timezone.utc)
        await db.commit()
        await db.refresh(locked_account)
        return locked_account

    @classmethod
    async def get_valid_access_token(
        cls,
        db: AsyncSession,
        account: EmailAccount,
        encryption_service: Optional[TokenEncryptionService] = None,
    ) -> str:
        """
        Returns a valid, decrypted plaintext access token in-memory.
        If the access token is expired or within 5 minutes of expiring, automatically refreshes it.
        Plaintext is never logged or written to storage.
        """
        enc = encryption_service or get_encryption_service()

        if account.token_expiry:
            threshold = datetime.now(timezone.utc) + timedelta(minutes=5)
            if account.token_expiry <= threshold:
                account = await cls.refresh_access_token(db, account, encryption_service=enc)

        return enc.decrypt(account.encrypted_access_token)

    @classmethod
    async def get_company_email_account(
        cls, db: AsyncSession, company_id: UUID
    ) -> Optional[EmailAccount]:
        """
        Retrieves the primary Gmail EmailAccount for the given company tenant.
        """
        stmt = (
            select(EmailAccount)
            .filter(
                EmailAccount.company_id == company_id,
                EmailAccount.provider == EmailProvider.GMAIL.value,
            )
            .order_by(EmailAccount.created_at.desc())
        )
        result = await db.execute(stmt)
        return result.scalars().first()

    @classmethod
    async def disconnect_account(cls, db: AsyncSession, company_id: UUID) -> bool:
        """
        Deactivates the connected Gmail account for the given company tenant.
        Returns True if an account was found and deactivated, False otherwise.
        """
        account = await cls.get_company_email_account(db, company_id)
        if not account:
            return False

        account.is_active = False
        account.updated_at = datetime.now(timezone.utc)
        await db.commit()
        return True
