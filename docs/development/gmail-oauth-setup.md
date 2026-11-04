# Gmail OAuth Setup & Infrastructure Guide

This document details the configuration, security design, and testing procedures for **Phase 2: Secure Gmail OAuth Infrastructure** in Lunova.

---

## 1. Architecture Overview

Lunova connects company Gmail accounts to ingest incoming RFPs and dispatch human-approved proposals.

```
Company Admin (Browser)
       │
       ▼
1. GET /api/v1/integrations/gmail/authorize (Admin only)
       │   └─ Returns Google OAuth URL + Signed CSRF State (15-min JWT bound to company_id)
       ▼
2. Google OAuth 2.0 Consent Screen
       │   └─ Scopes: gmail.readonly, gmail.send, userinfo.email
       ▼
3. GET /api/v1/integrations/gmail/callback?code=...&state=...
       │   ├─ Validates signed CSRF state (ensures tenant binding & freshness)
       │   ├─ Exchanges authorization code for access & refresh tokens
       │   ├─ Fetches connecting account email from Google UserInfo
       │   ├─ Encrypts tokens using Fernet authenticated symmetric encryption
       │   └─ Upserts EmailAccount record in database (isolated by company_id)
       ▼
4. Success Response: Clean EmailAccount metadata (Zero tokens/secrets exposed)
```

---

## 2. Environment Configuration

### Required Environment Variables

Add the following variables to your `.env` file (copied from `.env.example` or `backend/.env.example`):

```bash
# Gmail OAuth & Token Encryption Configuration
GMAIL_CLIENT_ID="<your-google-oauth-client-id>.apps.googleusercontent.com"
GMAIL_CLIENT_SECRET="<your-google-oauth-client-secret>"
GMAIL_REDIRECT_URI="http://localhost:8000/api/v1/integrations/gmail/callback"
GMAIL_TOKEN_ENCRYPTION_KEY="<your-32-byte-base64-fernet-key>"
```

### Secure Token Encryption Key Generation & Retention

The token encryption key **must** be a valid 32-byte URL-safe base64-encoded string. Generate one using Python:

```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

> [!CAUTION]
> **Key Retention Requirement**: The exact same encryption key must be retained to decrypt previously stored tokens. If the key is changed or rotated without re-encrypting existing database records, previously encrypted credentials will become undecryptable.
>
> **Never commit `.env` or hard-code encryption keys.** The `.env` file is excluded in `.gitignore`. The encryption service fails safely with `MissingEncryptionKeyError` or `InvalidEncryptionKeyError` if the key is missing or malformed.

---

## 3. Google Cloud Console Setup

To configure Google OAuth for local development:

1. **Create or Select a Google Cloud Project**:
   - Navigate to the [Google Cloud Console](https://console.cloud.google.com/).
   - Create a new project (e.g., `Lunova-Dev`) or select an existing one.

2. **Enable Required APIs**:
   - Go to **APIs & Services > Library**.
   - Search for **Gmail API** and click **Enable**.

3. **Configure OAuth Consent Screen**:
   - Go to **APIs & Services > OAuth consent screen**.
   - Select **External** (or **Internal** if using Google Workspace).
   - Enter Application Name: `Lunova`.
   - Add Developer Contact Email.
   - Click **Save and Continue**.

4. **Add Scopes**:
   Configure the minimal scopes supported by Lunova:
   - `https://www.googleapis.com/auth/gmail.readonly` — Read inbound RFPs and inquiry threads.
   - `https://www.googleapis.com/auth/gmail.send` — Send approved proposal emails.
   - `https://www.googleapis.com/auth/userinfo.email` — Identify the authorized account email address.

5. **Create OAuth Client Credentials**:
   - Go to **APIs & Services > Credentials**.
   - Click **Create Credentials > OAuth client ID**.
   - Application type: **Web application**.
   - Name: `Lunova Local Backend`.
   - **Authorized redirect URIs**:
     - `http://localhost:8000/api/v1/integrations/gmail/callback`
   - Click **Create**.
   - Copy the generated **Client ID** and **Client Secret** into your `.env` file.

6. **Add Test Users (while in Testing Mode)**:
   - Under **OAuth consent screen > Test users**, add the Gmail addresses intended for testing (e.g., your development inbox).
   - In external testing mode, only authorized test users can complete authorization before Google app verification.

---

## 4. API Endpoints

All endpoints are mounted under `/api/v1/integrations/gmail`:

| Method | Endpoint | Authorization | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/integrations/gmail/authorize` | Admin (`RoleChecker([ADMIN])`) | Initiates OAuth flow; records state in DB and returns consent URL. |
| `GET` | `/api/v1/integrations/gmail/callback` | Public (Google redirect) | Validates and consumes single-use CSRF state, exchanges code for tokens, persists encrypted credentials. |
| `GET` | `/api/v1/integrations/gmail/status` | Authenticated User | Returns connection status and metadata for current company tenant. |
| `POST` | `/api/v1/integrations/gmail/disconnect` | Admin (`RoleChecker([ADMIN])`) | Deactivates the company's connected Gmail account (`is_active = False`). |
| `POST` | `/api/v1/integrations/gmail/refresh` | Admin (`RoleChecker([ADMIN])`) | Refreshes the access token using stored encrypted refresh token. |

---

## 5. Security Architecture & Guarantees

1. **Authenticated Encryption**:
   - Access and refresh tokens are encrypted via `cryptography.fernet.Fernet` (AES-128-CBC with HMAC-SHA256 authenticated encryption) before database writes.
   - Plaintext tokens exist strictly in-memory during external API requests and are never written to logs or storage.

2. **Durable Single-Use CSRF & Replay Prevention (`oauth_states`)**:
   - Every authorization attempt records a durable nonce in the `oauth_states` table (Migration `006_add_oauth_states`).
   - The state parameter sent to Google is a signed JWT containing `company_id`, `user_id`, `nonce`, `purpose="gmail_oauth"`, and 15-minute expiration.
   - On callback, the state is verified cryptographically and the database nonce is checked and burned atomically using row-level locking (`with_for_update()`).
   - If a state is reused (replay attack), expired, or belongs to a user who is no longer an active administrator, it is rejected immediately with HTTP 400.

3. **Multi-Tenant Isolation**:
   - Every `EmailAccount` record has a mandatory `company_id` foreign key with a unique constraint `(company_id, provider, email_address)`.
   - Endpoints enforce tenant isolation using the authenticated user's JWT `company_id`. An admin of Company A can never view, refresh, or disconnect Company B's credentials.

4. **Safe Re-Consent & Refresh Token Preservation**:
   - Google often omits `refresh_token` when an account re-authenticates if consent was previously granted.
   - Lunova explicitly preserves the existing `encrypted_refresh_token` if Google does not return a new one on re-authorization.

5. **Token Refresh, Concurrency Guard & Outage Differentiation**:
   - Concurrency locking with `with_for_update()` on `EmailAccount` prevents duplicate concurrent refresh operations.
   - If Google explicitly returns `invalid_grant`, `unauthorized_client`, or 401, the account is marked `is_active = False` requiring reconnection.
   - Temporary network timeouts (`httpx.TimeoutException`, `httpx.RequestError`) or upstream Google 5xx outages do **NOT** deactivate the account, preserving service continuity once upstream recovers.

6. **Zero Secret Leakage**:
   - Client secrets, access tokens, refresh tokens, and ciphertext strings are strictly excluded from all API response schemas (`EmailAccountResponse`, `GmailConnectionStatusResponse`).

---

## 6. Running Tests

All unit and integration tests mock Google network calls and require **zero** real Google credentials or network access.

### Running Platform Tests from Repository Root:
```bash
python -m pytest backend/tests/test_platform -v
```

### Running from Backend Directory:
```bash
cd backend
python -m pytest tests/test_platform -v
```

### Running Specific Test Suites:
```bash
# Token encryption and key validation tests
python -m pytest backend/tests/test_platform/test_encryption.py -v

# Gmail OAuth flow, CSRF state, callback, and tenant isolation tests
python -m pytest backend/tests/test_platform/test_gmail_oauth.py -v
```
