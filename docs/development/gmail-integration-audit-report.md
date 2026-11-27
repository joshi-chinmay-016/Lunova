# Lunova — Phase A: Real Gmail Integration Audit & Gap Report

**Audit Date:** November 18, 2026  
**Auditor:** Lunova Full-Stack Engineering & Application Security Team  
**Scope:** Real Gmail Integration (OAuth 2.0, Inbox Sync, Attachment Processing, AI RAG Pipeline Ingestion, Frontend UI, Proposal Review & Outbound Dispatch)

---

## 1. Executive Summary

This audit assesses the readiness of Lunova's Gmail integration for **real-world Google Workspace connectivity**. 

The codebase already possesses high-quality foundational architecture:
- Data models for multi-tenant accounts (`EmailAccount`), CSRF protection (`OAuthState`), email threads (`Email`), attachments (`EmailAttachment`), and proposals (`Proposal`) are defined and backed by applied Alembic migrations (`001` through `008`).
- Strong cryptographic security is in place via Fernet token encryption (`TokenEncryptionService`) and single-use HMAC/JWT state tokens.
- An abstract client interface (`BaseGmailClient`) with both a production HTTP client (`GmailClient`) and a deterministic in-memory mock (`MockGmailClient`) is implemented.
- Robust MIME/multipart normalization and generic document parsing (PDF, DOCX, TXT) are in place.
- Human-in-the-loop review station with race-condition prevention (`SENDING` state lock) and timeout reconciliation (`DISPATCH_UNCERTAIN`) is fully architected.

However, several **critical defects and functional gaps** prevent real Gmail accounts from working end-to-end without failing. Most notably:
1. **Fatal Runtime Bug:** Both `GmailSyncService` and `GmailSendService` invoke a non-existent method `GmailOAuthService.decrypt_token(...)`, which throws an `AttributeError` whenever a real Gmail client is initialized.
2. **OAuth Callback UX Flaw:** The backend OAuth callback (`/api/v1/integrations/gmail/callback`) returns raw JSON instead of redirecting the user's browser back to the Next.js frontend settings page (`http://localhost:3000/settings?tab=integrations&connected=gmail`).
3. **Environment Variable Inconsistencies:** The codebase uses `GMAIL_CLIENT_ID` while the specification requires supporting `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, and `GOOGLE_OAUTH_SCOPES`.
4. **Missing Sync Metrics on Frontend:** The Settings UI displays a generic sync banner rather than specific counts of emails processed and proposals created.

---

## 2. Component-by-Component Audit

### 2.1. Data Models & Database Migrations
| Model / Table | File | Status | Notes |
| :--- | :--- | :--- | :--- |
| `EmailAccount` (`email_accounts`) | `backend/app/models/email_account.py` | **Complete** | Unique constraint on `(company_id, provider, email_address)`. Encrypted tokens stored as ciphertext. `last_synced_at` and `token_expiry` tracked. Migration `005` applied. |
| `OAuthState` (`oauth_states`) | `backend/app/models/oauth_state.py` | **Complete** | Single-use nonce, `expires_at`, `consumed_at`. Row locking with `with_for_update()`. Migration `006` applied. |
| `Email` (`emails`) | `backend/app/models/email.py` | **Complete** | Direction (`INCOMING`/`OUTGOING`), `message_id`, `thread_id`, recipient/sender. Migration `001` applied. |
| `EmailAttachment` (`email_attachments`) | `backend/app/models/attachment.py` | **Complete** | File metadata, storage path, `extracted_text`, `parsing_status`, `page_count`. Migration `007` applied. |
| `Proposal` (`proposals`) | `backend/app/models/proposal.py` | **Complete** | Full state machine including `SENDING` and `DISPATCH_UNCERTAIN`. Migrations `001` & `008` applied. |

---

### 2.2. Security & Token Encryption
| Component | File | Status | Notes |
| :--- | :--- | :--- | :--- |
| `TokenEncryptionService` | `backend/app/core/security.py` | **Complete** | AES-128-CBC + HMAC-SHA256 (Fernet). Throws `MissingEncryptionKeyError` and `InvalidEncryptionKeyError`. Plaintext never logged. |
| CSRF / State Token | `backend/app/platform/services/gmail_oauth_service.py` | **Complete** | Cryptographic JWT signed with `JWT_SECRET_KEY`, bound to `user_id` and `company_id`. Replay attacks prevented by database-backed atomic nonce consumption. |

---

### 2.3. OAuth Flow & Token Lifecycle (`GmailOAuthService`)
| Feature | Implementation Status | Findings / Gaps |
| :--- | :--- | :--- |
| Authorization URL Generation | **Complete** | Requests `offline` access, `prompt=consent`, and minimal scopes (`gmail.readonly`, `gmail.send`, `userinfo.email`). |
| State Verification | **Complete** | Single-use atomic consumption with `with_for_update()` row locks. Validates user is still an active admin. |
| Code Exchange | **Complete** | Exchanges authorization code for tokens via `https://oauth2.googleapis.com/token`. |
| User Email Discovery | **Complete** | Fetches verified user email from `https://www.googleapis.com/oauth2/v2/userinfo`. |
| Token Storage | **Complete** | Encrypts access and refresh tokens. Preserves existing refresh token if re-consenting without rotation. |
| Concurrency-Safe Refresh | **Complete** | Row-locked refresh; distinguishes revocations (deactivates account) from transient network errors (preserves account). |
| Decryption & Valid Token Retrieval | **Complete** | `GmailOAuthService.get_valid_access_token(db, account)` auto-refreshes tokens within 5 minutes of expiration. |
| **Missing Helper Method** | **DEFECT** | `GmailOAuthService.decrypt_token` does not exist, causing calling services to crash. |

---

### 2.4. Gmail API Clients (`backend/app/platform/integrations/gmail/`)
| Component | Status | Notes |
| :--- | :--- | :--- |
| `BaseGmailClient` | **Complete** | Abstract interface defining `list_messages`, `get_message`, `get_attachment`, `send_message`. |
| `GmailClient` (Production) | **Mostly Complete** | Uses `httpx.Client(timeout=30.0)` to call Gmail REST API v1. Handles base64url decoding for attachments and RFC 2822 send payloads. Needs retry/backoff for 429 rate limits. |
| `MockGmailClient` | **Complete** | In-memory mock store for automated testing and offline development. |
| `GmailMessageNormalizer` | **Complete** | Decodes multipart emails, text/plain, text/html, headers (`From`, `To`, `Subject`, `Date`), and attachment stubs. |

---

### 2.5. Inbox Synchronization (`GmailSyncService`)
| Feature | Implementation Status | Findings / Gaps |
| :--- | :--- | :--- |
| Message Ingestion | **Working** | Queries `label:INBOX`, skips duplicate message IDs. |
| Proposal Creation | **Working** | Creates `Proposal` with status `RECEIVED`. |
| Attachment Ingestion | **Working** | Fetches attachment bytes, saves to disk via `AttachmentStorageService`, parses using `AttachmentParser` (PDF, DOCX, TXT), persists `EmailAttachment`. |
| Background Intelligence Trigger | **Working** | Background task enqueued via FastAPI `BackgroundTasks` for newly created proposals. |
| **Client Initialization Bug** | **CRITICAL DEFECT** | Line 55: calls `GmailOAuthService.decrypt_token(...)`. Will crash on real runs unless updated to `get_valid_access_token`. |

---

### 2.6. Proposal Processing & AI Integration (`ProposalService.process_proposal_bg`)
| Feature | Implementation Status | Findings / Gaps |
| :--- | :--- | :--- |
| Context Assembly | **Complete** | Maps `EmailAttachment` (status `SUCCESS`) to `ParsedAttachment` inside `ProposalContext`. |
| Knowledge Retrieval | **Complete** | Uses `PlatformRetriever` with `top_k=settings.RETRIEVAL_TOP_K`, strictly partitioned by `company_id`. |
| Response Generation | **Complete** | Synthesizes response, extracts requirements, records confidence. |
| Outgoing Draft Creation | **Complete** | Saves generated response as an `OUTGOING` `Email` record and transitions proposal to `REVIEW_REQUIRED`. |

---

### 2.7. Proposal Review & Outbound Sending (`GmailSendService`)
| Feature | Implementation Status | Findings / Gaps |
| :--- | :--- | :--- |
| Pre-flight Authorization | **Complete** | Requires proposal status to be strictly `APPROVED`. Forbids sending from `DRAFT`, `RECEIVED`, `ANALYZED`, `SENDING`, or `SENT`. |
| Concurrency Lock | **Complete** | Commits durable `SENDING` state to database before API submission to prevent double sends. |
| Email Construction | **Complete** | Builds RFC 2822 payload preserving `In-Reply-To`, `References`, and `threadId`. |
| Timeout Handling | **Complete** | On network timeout, transitions to `DISPATCH_UNCERTAIN` and requires human reconciliation. |
| Finalization | **Complete** | Updates to `SENT`, stores sent message ID, logs audit trail. |
| **Client Initialization Bug** | **CRITICAL DEFECT** | Line 143: calls `GmailOAuthService.decrypt_token(...)`. Must use `get_valid_access_token`. |

---

### 2.8. API Routes (`backend/app/api/routes/integrations.py`)
| Endpoint | Implementation Status | Findings / Gaps |
| :--- | :--- | :--- |
| `GET /integrations/gmail/authorize` | **Complete** | Returns authorization URL and state. Admin restricted. |
| `GET /integrations/gmail/callback` | **DEFECT** | Exchanges code and persists account, but returns JSON response instead of redirecting the user's browser back to the frontend settings page (`http://localhost:3000/settings?tab=integrations&connected=gmail`). |
| `GET /integrations/gmail/status` | **Complete** | Returns active connection status and account email. Tokens excluded. |
| `POST /integrations/gmail/disconnect` | **Complete** | Deactivates company email account. Admin restricted. |
| `POST /integrations/gmail/refresh` | **Complete** | Manually refreshes access token. Admin restricted. |
| `POST /integrations/gmail/sync` | **Complete** | Triggers mailbox sync and queues background proposal processing. |

---

### 2.9. Frontend Integration (`frontend/app/settings/page.tsx`)
| Feature | Implementation Status | Findings / Gaps |
| :--- | :--- | :--- |
| Integration Card | **Complete** | Renders Gmail integration status, connected account email, and last synced timestamp. |
| Connect Action | **Complete** | Fetches authorization URL and redirects to Google OAuth. |
| Disconnect Action | **Complete** | Opens confirmation dialog and invalidates React Query cache. |
| Sync Inbox Action | **Partially Complete** | Triggers sync and invalidates queries, but does not display returned sync metrics (`new_emails_count`, `proposals_created_count`, `skipped_duplicates_count`). |

---

## 3. Detailed Root Causes & Proposed Solutions

### Defect 1: Missing `GmailOAuthService.decrypt_token`
* **Root Cause:** In earlier refactoring, `get_valid_access_token` was introduced on `GmailOAuthService` to combine decryption and expiration validation, but `gmail_sync_service.py` and `gmail_send_service.py` continued to reference a static `decrypt_token` method.
* **Solution:**
  1. Add a classmethod `decrypt_token(cls, encrypted_token: str) -> str` to `GmailOAuthService` for convenience.
  2. Update `GmailSyncService.get_authenticated_client` and `GmailSendService` to use `await GmailOAuthService.get_valid_access_token(db, account)`, ensuring access tokens are guaranteed fresh and valid before every Gmail API call.

### Defect 2: OAuth Callback Browser Redirection
* **Root Cause:** `/api/v1/integrations/gmail/callback` was written returning Pydantic model `EmailAccountResponse`. When a real browser follows Google's 302 redirect after user consent, it requests `GET /callback` and renders raw JSON.
* **Solution:**
  Update `oauth_callback` to detect browser navigation (or by default in browser OAuth flows) and return a `RedirectResponse` to `{FRONTEND_URL}/settings?tab=integrations&connected=gmail`. If an error occurs, redirect to `{FRONTEND_URL}/settings?tab=integrations&error={encoded_message}`. If `Accept: application/json` is explicitly requested by API clients/tests, return the JSON response.

### Defect 3: Configuration Variable Aliasing
* **Root Cause:** Configuration settings expect `GMAIL_CLIENT_ID`, `GMAIL_CLIENT_SECRET`, and `GMAIL_REDIRECT_URI`. The prompt and standard Google documentation often refer to `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, and `GOOGLE_OAUTH_SCOPES`.
* **Solution:**
  In `backend/app/core/config.py`, support both `GMAIL_*` and `GOOGLE_*` environment variable names using property fallbacks or pydantic field aliases. Add `FRONTEND_URL: str = "http://localhost:3000"`.

### Defect 4: Sync Metrics Visibility in Frontend
* **Root Cause:** The frontend mutation `useSyncGmail` discards the returned `GmailSyncResult` payload.
* **Solution:**
  Update `frontend/hooks/useSettings.ts` and `frontend/app/settings/page.tsx` to capture the sync response and render:
  `"Successfully synced: X new emails ingested, Y proposals created, Z duplicates skipped."`

---

## 4. Phase-by-Phase Remediation Roadmap

1. **Phase A (Current):** Audit existing implementation and produce gap report (Completed).
2. **Phase B: Complete OAuth Connection & Browser Redirection:**
   - Add `GOOGLE_*` / `GMAIL_*` variable aliases and `FRONTEND_URL` to `backend/app/core/config.py`.
   - Update `oauth_callback` to return `RedirectResponse` to the frontend settings page.
   - Add `decrypt_token` and standardize on `get_valid_access_token`.
   - Test OAuth URL generation, state consumption, and token exchange.
3. **Phase C: Complete Real Gmail Inbox Synchronization:**
   - Fix `GmailSyncService.get_authenticated_client` to properly call `get_valid_access_token`.
   - Implement rate limit retry handling in `GmailClient`.
   - Test idempotency and error handling with mock and real payloads.
4. **Phase D: Attachment Processing Verification:**
   - Verify PDF, DOCX, TXT attachment downloading and storage partitioning by `company_id`.
   - Ensure corrupted or oversized attachments fail gracefully without aborting email ingestion.
5. **Phase E: AI Intelligence Pipeline Integration:**
   - Verify end-to-end chain: `Email` $\to$ `EmailAttachment` $\to$ `ProposalContext` $\to$ `IntelligenceService` $\to$ `Proposal` (`REVIEW_REQUIRED`).
   - Validate strict `company_id` tenant isolation in retrieval.
6. **Phase F: Frontend Settings & Sync UI Completion:**
   - Display dynamic sync metrics (`new_emails_count`, `proposals_created_count`, etc.) in the UI.
   - Verify connection status and error notifications.
7. **Phase G: Proposal Review & Actual Gmail Sending:**
   - Fix `GmailSendService` token retrieval to use `get_valid_access_token`.
   - Verify outbound RFC 2822 formatting, threading (`In-Reply-To`), and status transition (`APPROVED` $\to$ `SENDING` $\to$ `SENT`).
8. **Phase H: Comprehensive Test Suite & End-to-End Validation:**
   - Run full unit, integration, and security test suites.
   - Provide clear instructions for Google Cloud Console setup and live smoke testing.
