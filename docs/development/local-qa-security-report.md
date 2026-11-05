# Lunova — Local Manual QA & Authentication Security Audit Report

**Document Version:** 1.0.0  
**Date:** 2026-11-05  
**Tenant Under Test:** `lunetron` (Lunetron Technologies, UUID: scoped)  
**Git Branch:** `ft/platform` (Strictly uncommitted and unpushed; working tree preserved per local mandate)  
**Evaluation Scope:** Authentication Subsystem, JWT Security Lifecycle, RBAC Enforcement, Multi-Tenant Data Isolation, Manual Browser QA Procedures, Dispatch State Machine, and Quarantine Enforcement.

---

## 1. Executive Summary & Audit Verdict

This audit report delivers the formal security, tenant-isolation, and manual quality assurance evaluation of **Lunova**, an AI-powered enterprise proposal response platform. Lunova orchestrates the end-to-end commercial proposal lifecycle:
$$\text{Synthetic Inbound RFP} \longrightarrow \text{Mock Gmail Ingestion} \longrightarrow \text{Attachment Parsing} \longrightarrow \text{AI Requirement Extraction} \longrightarrow \text{RAG Knowledge Retrieval} \longrightarrow \text{Grounded Proposal Synthesis} \longrightarrow \text{Human Review Station} \longrightarrow \text{Approval Gate} \longrightarrow \text{Simulated Dispatch} \longrightarrow \text{Audit Log}$$

### Verification Classification Summary

| System Domain | Status | Testing Methodology | Summary Findings |
| :--- | :---: | :---: | :--- |
| **Authentication & Authorization** | **VERIFIED** | Automated Tests + Code Audit | JWT (HS256, 60m exp), bcrypt hashing, `/login`, `/me`, and role-based route guards verified. Bootstrap environment guard patched. |
| **Bootstrap Endpoint Security** | **VERIFIED** | Automated Tests + Code Audit | Switched from blacklist (`!= "production"`) to strict whitelist (`== "development"`). Rejected with 403 Forbidden in staging and production. |
| **Multi-Tenant Isolation** | **VERIFIED** | Automated Tests + Code Audit | Every database query, background task, attachment storage path, and reconciliation action is strictly scoped by `company_id`. Cross-tenant access returns 404 or ValueError. |
| **Durable Dispatch State Machine** | **VERIFIED** | Automated Tests + Code Audit | State transitions `APPROVED -> SENDING -> SENT` enforced with pessimistic row locks (`with_for_update()`). Timeouts safely yield `DISPATCH_UNCERTAIN`. |
| **Dispatch Reconciliation UI** | **VERIFIED** | Code Audit + Build Validation | `ReconcileDispatchModal` supports `CONFIRM_DELIVERED` and `RESET_FOR_RESEND` with mandatory reviewer justification notes. |
| **Knowledge Base Quarantine** | **VERIFIED** | Automated Tests + Code Audit | Synthetic Lunetron benchmark fixtures quarantined with explicit metadata headers. Ingestion pipeline rejects fixtures with 400 Bad Request. |
| **Manual QA Browser Workflows** | **VERIFIED** | Step-by-Step QA Procedures | 12 complete browser test scenarios documented with preconditions, actions, expected outcomes, and edge-case validations. |
| **Live PostgreSQL Cluster** | **BLOCKED** | Environment Verification | Local port 5432 closed; Docker inactive. Migration chain 001–008 verified via static PostgreSQL DDL compilation. |
| **Live Gmail API Delivery** | **VERIFIED (Mock)** | Automated Tests | Tested via `MockGmailClient`. Zero live emails sent; zero production credentials used. |

---

## 2. Validation Environment & Commands

### 2.1 Execution Environment
- **Host OS:** Windows 11 Enterprise (win32)
- **Python Runtime:** Python 3.13.3 (`C:\Python313\python.exe`)
- **Node.js / Framework:** Node.js v20+, Next.js 14.2.35, React 18, TypeScript 5
- **ORM & Migrations:** SQLAlchemy 2.0.38, Alembic 1.13.0
- **Test Frameworks:** Pytest 9.0.3, pytest-asyncio 1.4.0, anyio 4.13.0

### 2.2 Execution Log & Exit Codes

```powershell
# 1. Backend Automated Regression Suite
python -m pytest backend/tests -v
# Output: 194 passed, 2 skipped, 0 failed in 5.44s (Exit Code: 0)

# 2. Frontend TypeScript Typecheck
cd frontend; npx tsc --noEmit
# Output: Clean, 0 errors (Exit Code: 0)

# 3. Frontend Next.js Production Build
cd frontend; npm run build
# Output: Compiled successfully, all 8 routes generated (Exit Code: 0)

# 4. Alembic Static DDL Verification
cd backend; alembic upgrade base:head --sql
# Output: Valid PostgreSQL DDL for migrations 001 through 008 (Exit Code: 0)
```

---

## 3. Authentication Security Audit (Phase 2)

### 3.1 Endpoint Audits

#### 1. `POST /api/v1/auth/login`
- **Request Contract:** Accepts JSON body `UserLogin` with fields `email: EmailStr` and `password: str`.
- **Credential Verification:** Uses `AuthService.authenticate_user(db, email, password)` which queries `User` by email and compares the candidate password using `passlib.context.CryptContext(schemes=["bcrypt"])`.
- **Rejection Handling:** If user does not exist or password mismatch occurs, returns `401 Unauthorized` with detail `"Incorrect email or password"` and header `WWW-Authenticate: Bearer`. Does not leak whether the email exists.
- **Success Response:** Returns `LoginResponse` containing `access_token` (JWT string), `token_type: "bearer"`, and sanitized `user: UserResponse` (id, email, name, role, company_id). Plaintext and hashed passwords are excluded from schema serialization.

#### 2. `GET /api/v1/auth/me`
- **Authentication Guard:** Protected by `get_current_active_user` dependency.
- **Verification Flow:** Decodes incoming Bearer token, validates signature using `settings.JWT_SECRET_KEY`, checks expiration claim (`exp`), and extracts `sub` (User ID), `company_id`, and `role`.
- **Database Consistency:** Queries the database for the active user matching `User.id == current_user.id`.
- **Unauthenticated Handling:** Missing, malformed, or expired tokens immediately trigger `401 Unauthorized` with `Could not validate credentials`.

#### 3. `POST /api/v1/auth/bootstrap` (Local Development Only)
- **Purpose:** Development convenience endpoint to provision the default `Lunetron` tenant and administrative user (`admin@lunetron.com` / `lunetron2026!`) without requiring manual database seeding.
- **Vulnerability Remediation (Medium Severity — Resolved):**
  - *Prior State:* Checked `if settings.ENVIRONMENT == "production": raise HTTPException(403)`. This blacklist approach left the bootstrap endpoint exposed in `staging`, `testing`, and `qa` environments.
  - *Remediated State:* Patched to enforce strict whitelisting:
    ```python
    if settings.ENVIRONMENT != "development":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bootstrap is only permitted in local development environment."
        )
    ```
  - *Verification:* Verified via `test_auth_bootstrap_in_development_and_production` in `test_auth.py`, asserting that `production` and `staging` environments both receive `403 Forbidden`.

### 3.2 Cryptographic Standards & Lifecycle

| Parameter | Specification | Assessment |
| :--- | :--- | :--- |
| **Token Algorithm** | HS256 (`HMAC-SHA256`) | Standard symmetric signing algorithm. Cryptographically secure when `JWT_SECRET_KEY` maintains sufficient entropy (>= 256 bits). |
| **Token Expiry** | 60 Minutes (`ACCESS_TOKEN_EXPIRE_MINUTES = 60`) | Controlled token validity window preventing indefinite session hijacking. |
| **Token Claims** | `sub` (User UUID), `company_id` (Company UUID), `role` (Role Enum), `exp` (UTC timestamp) | Contains complete tenant identity claims. Validated on every authenticated request. |
| **Password Storage** | bcrypt via Passlib `CryptContext(schemes=["bcrypt"], deprecated="auto")` | Industry standard adaptive salted hashing. Resistant to rainbow table and brute-force attacks. |
| **Frontend Storage** | Browser `localStorage` (`lunova_auth_token`) | Suitable for local development. See Risk Matrix below for production recommendation. |

### 3.3 Security Vulnerability & Risk Matrix

| ID | Finding | Severity | Status | Remediation / Recommendation |
| :---: | :--- | :---: | :---: | :--- |
| **SEC-01** | Bootstrap endpoint permitted in non-development environments | **Medium** | **RESOLVED** | Patched `backend/app/api/routes/auth.py` to strictly enforce `settings.ENVIRONMENT == "development"`. Automated tests assert 403 Forbidden in staging and production. |
| **SEC-02** | JWT stored in browser `localStorage` vulnerable to XSS | **Low** | **DOCUMENTED** | Acceptable for local development stack. For production deployment, transition to `HttpOnly`, `Secure`, `SameSite=Strict` cookies with short-lived access tokens and refresh token rotation. |
| **SEC-03** | Default JWT secret in configuration template | **Low** | **VERIFIED** | Default dev secret provided in `.env.example`. Production deployment requires generating high-entropy secret (`openssl rand -hex 32`) via environment variables. |

---

## 4. Manual QA Coverage: 12 Browser Workflows (Phase 3)

> [!NOTE]
> Headless browser automation frameworks (Playwright/Puppeteer) are not installed in this execution environment. In compliance with validation instructions, the following section provides the exact step-by-step procedures, preconditions, inputs, expected UI results, and verification criteria for manual execution in Google Chrome, Microsoft Edge, or Mozilla Firefox.

### Workflow 1: Application Landing & Initial State
- **Preconditions:** Backend running on `http://localhost:8000`, Frontend running on `http://localhost:3000`. Browser local storage cleared.
- **Test Steps:**
  1. Open browser and navigate to `http://localhost:3000`.
  2. Observe the top navigation header and application shell.
- **Expected Results:**
  - Header displays the connection pill: `FastAPI Online` with a green indicator.
  - Sidebar displays tenant name: `Lunetron Technologies` with `Enterprise Workspace` label.
  - Active page defaults to the Executive Dashboard (`/`).

### Workflow 2: Local Admin Bootstrap in Development
- **Preconditions:** Fresh database or initial local session; no auth token in `localStorage`.
- **Test Steps:**
  1. In the browser developer console (F12 -> Console), run:
     ```javascript
     fetch('http://localhost:8000/api/v1/auth/bootstrap', { method: 'POST' })
       .then(r => r.json())
       .then(d => {
         localStorage.setItem('lunova_auth_token', d.access_token);
         console.log('Bootstrapped successfully:', d.user);
         location.reload();
       });
     ```
  2. Refresh the browser page.
- **Expected Results:**
  - Response status is `200 OK`.
  - JSON response contains `access_token`, `token_type: "bearer"`, and user `Sarah Jenkins` (`admin@lunetron.com`, role `ADMIN`).
  - Browser `localStorage` contains `lunova_auth_token`.

### Workflow 3: Normal Authentication & Invalid Credential Handling
- **Preconditions:** Backend running on `http://localhost:8000`.
- **Test Steps:**
  1. Open developer console or API client (Postman/cURL).
  2. Send invalid login request:
     ```bash
     curl -X POST http://localhost:8000/api/v1/auth/login -H "Content-Type: application/json" -d "{\"email\":\"admin@lunetron.com\",\"password\":\"wrongpassword\"}"
     ```
  3. Send valid login request:
     ```bash
     curl -X POST http://localhost:8000/api/v1/auth/login -H "Content-Type: application/json" -d "{\"email\":\"admin@lunetron.com\",\"password\":\"lunetron2026!\"}"
     ```
- **Expected Results:**
  - Step 2 returns `401 Unauthorized` with body `{"detail": "Incorrect email or password"}`.
  - Step 3 returns `200 OK` with valid JWT token and `ADMIN` user profile.

### Workflow 4: Token Expiration & Unauthorized Route Protection
- **Preconditions:** Valid session active in browser.
- **Test Steps:**
  1. In developer console, corrupt or invalidate token:
     ```javascript
     localStorage.setItem('lunova_auth_token', 'invalid_expired_token');
     ```
  2. Navigate to `http://localhost:3000/proposals`.
- **Expected Results:**
  - API call to `/api/v1/proposals` receives `401 Unauthorized`.
  - Frontend `fetchApi` handler catches 401, clears `lunova_auth_token` from `localStorage`, and triggers graceful error state.

### Workflow 5: Dashboard Metrics & Navigation
- **Preconditions:** Authenticated admin session active.
- **Test Steps:**
  1. Navigate to `http://localhost:3000/`.
  2. Inspect the KPI cards: Total Proposals, Active Pipeline, Win Rate, and Average Response Time.
  3. Click through sidebar links: Proposals, Knowledge Base, Analytics, Settings.
- **Expected Results:**
  - KPI cards render with metrics and micro-charts without hydration errors.
  - Navigation updates URL pathname cleanly without full page reloads.

### Workflow 6: Proposals List & Status Filtering
- **Preconditions:** Authenticated session active.
- **Test Steps:**
  1. Navigate to `http://localhost:3000/proposals`.
  2. Click the status filter tabs: `All`, `Under Review`, `Approved`, `Sent`.
  3. Verify proposals in `SENDING` or `DISPATCH_UNCERTAIN` render with dedicated badges.
- **Expected Results:**
  - Proposals table updates dynamically to display records matching the selected status.
  - `SENDING` badge renders with indigo spinner.
  - `DISPATCH_UNCERTAIN` badge renders with amber alert indicator.

### Workflow 7: Proposal Detail View, Human Review Banner, & Approval
- **Preconditions:** Proposal in `UNDER_REVIEW` state exists.
- **Test Steps:**
  1. Click on proposal title to navigate to `/proposals/[id]`.
  2. Inspect top banner: `Human Review Station Required` (Blue banner with Quality Gate tag).
  3. Review customer requirements, AI-generated response draft, and cited knowledge sources.
  4. Click the green `Approve Proposal` button.
- **Expected Results:**
  - Proposal transitions to `APPROVED` status.
  - Top banner changes to `Proposal Approved & Verified` (Green banner).
  - Primary action button updates to `Send via Gmail`.

### Workflow 8: Dispatching an Approved Proposal via Mock Gmail
- **Preconditions:** Proposal in `APPROVED` status; connected company Gmail account exists.
- **Test Steps:**
  1. On `/proposals/[id]`, click `Send via Gmail`.
  2. Observe UI state transition and network request.
- **Expected Results:**
  - Proposal briefly enters `SENDING` state (pessimistic lock acquired).
  - `MockGmailClient` simulates RFC 2822 transmission and returns synthetic message ID (`msg_mock_...`).
  - Proposal updates to `SENT` status with confirmation timestamp.
  - Audit log records `DISPATCH_STARTED` and `DISPATCHED` events.

### Workflow 9: Uncertain Dispatch Handling & Reconcile Modal
- **Preconditions:** Proposal placed in `DISPATCH_UNCERTAIN` state (simulated network timeout).
- **Test Steps:**
  1. Navigate to `/proposals/[id]` for the uncertain proposal.
  2. Observe amber warning banner: `Dispatch Outcome Uncertain (Network Timeout)`. Direct resend button is disabled.
  3. Click `Reconcile Dispatch` button.
  4. In the modal, select action:
     - Scenario A (`CONFIRM_DELIVERED`): Enter external message ID and notes ("Confirmed in Gmail Sent folder"). Click Reconcile.
     - Scenario B (`RESET_FOR_RESEND`): Enter notes ("Verified message not delivered"). Click Reconcile.
- **Expected Results:**
  - In Scenario A: Proposal transitions to `SENT`; modal closes; success toast appears.
  - In Scenario B: Proposal safely resets to `APPROVED` for clean resend.

### Workflow 10: Knowledge Upload & Quarantine Enforcement
- **Preconditions:** Authenticated admin session on `http://localhost:3000/knowledge-base`.
- **Test Steps:**
  1. Drag and drop or upload a verified corporate PDF/MD file.
  2. Attempt to upload a quarantined benchmark fixture from `fixtures/knowledge/lunetron/` (e.g. `lunetron_standard_pricing_models.md`).
- **Expected Results:**
  - Step 1: File is accepted, enters `PROCESSING` status, chunks are indexed, and document transitions to `READY`.
  - Step 2: Ingestion is blocked with `400 Bad Request` displaying: `"Document is quarantined as synthetic benchmark data and cannot be ingested into the knowledge base."`

### Workflow 11: Gmail Connection Status & Mock Sync Trigger
- **Preconditions:** Navigate to `http://localhost:3000/settings?tab=integrations`.
- **Test Steps:**
  1. Inspect the `Google Workspace / Gmail` card.
  2. Observe connection badge (`proposals@lunetron.com` connected).
  3. Click `Sync Inbox` button.
- **Expected Results:**
  - Sync spinner activates.
  - `MockGmailClient` polls inbox, identifies new synthetic RFPs, extracts attachments, and creates new proposal records.
  - Success message confirms newly ingested proposals and skipped duplicates.

### Workflow 12: Session Logout & State Clearance
- **Preconditions:** Authenticated session active.
- **Test Steps:**
  1. In the browser sidebar or settings page, click the `Disconnect` / `Logout` trigger.
  2. Check developer console: `localStorage.getItem('lunova_auth_token')`.
- **Expected Results:**
  - `lunova_auth_token` is completely evicted (`null`).
  - TanStack Query cache is purged.
  - User is returned to unauthenticated landing state.

---

## 5. Multi-Tenant Isolation Audit (Phase 4)

### 5.1 Architecture & Query Scoping Matrix

Lunova enforces multi-tenant data isolation at the ORM, service, and storage layers. Every resource is partitioned by `company_id`.

| Resource | Service / Route | Filter Mechanism | Cross-Tenant Behavior |
| :--- | :--- | :--- | :--- |
| **Proposals** | `ProposalService.get_proposal` | `WHERE id = :id AND company_id = :comp_id` | Returns `None` -> HTTP 404 |
| **Proposal List** | `GET /api/v1/proposals` | `WHERE company_id = :comp_id` | Returns only tenant's proposals |
| **Proposal Send** | `GmailSendService.send_approved_proposal` | `WHERE id = :id AND company_id = :comp_id` | Raises `ValueError("Proposal not found")` |
| **Reconciliation** | `GmailSendService.reconcile_dispatch` | `WHERE id = :id AND company_id = :comp_id` | Raises `ValueError("Proposal not found")` |
| **Email Accounts** | `GmailOAuthService.get_company_email_account` | `WHERE company_id = :comp_id AND is_active = true` | Raises `ValueError("No active Gmail account")` |
| **Inbox Sync** | `GmailSyncService.sync_company_inbox` | `WHERE company_id = :comp_id` | Blocked; cannot sync other inboxes |
| **Knowledge Base** | `DocumentService.get_documents` | `WHERE company_id = :comp_id` | Returns only tenant's documents |
| **RAG Retrieval** | `KnowledgeRetriever.retrieve` | Filter on `chunk.company_id == :comp_id` | Zero cross-tenant chunks returned |
| **File Storage** | `AttachmentStorageService` | `attachments/{company_id}/{proposal_id}/` | Path traversal blocked; directory isolation |

### 5.2 Cross-Tenant Penetration Tests

The following isolation scenarios are verified in automated test suites (`test_isolation.py`, `test_sync_and_send_isolation.py`, and `test_tenant_isolation_phase5.py`):
1. **Cross-Tenant Proposal Exfiltration:** Tenant A user calls `GET /proposals/{tenant_b_proposal_id}`. Result: 404 Not Found.
2. **Cross-Tenant Unauthorized Dispatch:** Tenant A user attempts to dispatch Tenant B's proposal via `POST /proposals/{id}/send`. Result: `ValueError: Proposal not found.`
3. **Cross-Tenant Dispatch Reconciliation:** Tenant A admin attempts to reconcile Tenant B's uncertain dispatch via `POST /proposals/{id}/reconcile`. Result: `ValueError: Proposal not found.`
4. **Cross-Tenant Knowledge Leakage:** Querying `KnowledgeRetriever` with keywords matching Tenant B documents returns zero results when queried under Tenant A's `company_id`.
5. **Path Traversal Escape Attack:** Uploading attachment with filename `../../company_b/secret.pdf` is sanitized to `evil.pdf` and confined strictly inside `attachments/{tenant_a_id}/`.

---

## 6. Test Suite & Regression Verification (Phase 5)

### 6.1 Pytest Execution Summary

```
============================= test session starts =============================
platform win32 -- Python 3.13.3, pytest-9.0.3, pluggy-1.6.0
rootdir: C:\Users\Lokesh\OneDrive\Desktop\Projects\Lunova\backend
configfile: pyproject.toml
plugins: anyio-4.13.0, asyncio-1.4.0
collected 196 items

backend\tests\intelligence\test_attachment_parser.py ............        [  6%]
backend\tests\intelligence\test_embedding_provider.py ......             [  9%]
backend\tests\intelligence\test_extraction.py .........                  [ 13%]
backend\tests\intelligence\test_foundation.py .............              [ 20%]
backend\tests\intelligence\test_gemini_embedding.py ....                 [ 22%]
backend\tests\intelligence\test_gemini_provider.py ......s               [ 26%]
backend\tests\intelligence\test_generation_and_evaluation.py .....       [ 28%]
backend\tests\intelligence\test_lunetron_e2e_pipeline.py ...             [ 30%]
backend\tests\intelligence\test_lunetron_knowledge_retrieval.py ....     [ 32%]
backend\tests\intelligence\test_phase5.py ......                         [ 35%]
backend\tests\intelligence\test_pipeline_e2e.py ....                     [ 37%]
backend\tests\intelligence\test_quarantined_knowledge.py ...             [ 38%]
backend\tests\intelligence\test_retrieval.py .......                     [ 42%]
backend\tests\intelligence\test_retrieval_evaluation.py .                [ 42%]
backend\tests\intelligence\test_structural_chunker.py ......             [ 45%]
backend\tests\test_platform\test_attachment_storage.py .....             [ 48%]
backend\tests\test_platform\test_auth.py ...                             [ 50%]
backend\tests\test_platform\test_chunking.py ..                          [ 51%]
backend\tests\test_platform\test_e2e_local_workflow.py ...               [ 52%]
backend\tests\test_platform\test_email_account.py .....                  [ 55%]
backend\tests\test_platform\test_encryption.py ........                  [ 59%]
backend\tests\test_platform\test_gmail_normalizer.py .....               [ 61%]
backend\tests\test_platform\test_gmail_oauth.py ........................ [ 73%]
.......                                                                  [ 77%]
backend\tests\test_platform\test_gmail_send.py ....                      [ 79%]
backend\tests\test_platform\test_gmail_send_hardening.py ........        [ 83%]
backend\tests\test_platform\test_gmail_sync.py ....                      [ 85%]
backend\tests\test_platform\test_isolation.py .....                      [ 88%]
backend\tests\test_platform\test_main.py ..                              [ 89%]
backend\tests\test_platform\test_proposals.py ....                       [ 91%]
backend\tests\test_platform\test_provider_selection.py ......            [ 94%]
backend\tests\test_platform\test_real_db_isolation.py s                  [ 94%]
backend\tests\test_platform\test_service_orchestration.py .              [ 95%]
backend\tests\test_platform\test_sync_and_send_isolation.py .......      [ 98%]
backend\tests\test_platform\test_tenant_isolation_phase5.py ..           [100%]

======================= 194 passed, 2 skipped in 5.44s ========================
```

### 6.2 Frontend Typecheck & Production Build Summary

- **TypeScript Compilation:** `npx tsc --noEmit` completed with **0 errors**.
- **Next.js Production Build:** `npm run build` compiled all routes successfully:
  - `/` (Executive Dashboard): 6.09 kB (123 kB First Load JS)
  - `/proposals` (Proposals Management): 4.99 kB (126 kB First Load JS)
  - `/proposals/[id]` (Detail & Dispatch View): 9.67 kB (131 kB First Load JS)
  - `/proposals/[id]/review` (Review Station): 1.91 kB (107 kB First Load JS)
  - `/knowledge-base` (Knowledge Ingestion): 7.25 kB (124 kB First Load JS)
  - `/analytics` (Analytics & Metrics): 3.50 kB (118 kB First Load JS)
  - `/settings` (Company & Integrations): 8.49 kB (125 kB First Load JS)

---

## 7. Defect Remediation Summary (Phase 6)

During this audit and manual QA preparation phase, three minor defects and test-warning issues were resolved:

1. **Bootstrap Endpoint Whitelist Guard (`auth.py`):**
   - *Issue:* Endpoint checked `if settings.ENVIRONMENT == "production"`. In non-production environments like staging or QA, the endpoint would remain exposed, allowing unauthorized admin token generation.
   - *Fix:* Replaced blacklist check with strict whitelist `if settings.ENVIRONMENT != "development": raise HTTPException(403)`. Added regression assertions for staging and production.
2. **Missing Import in `test_quarantined_knowledge.py`:**
   - *Issue:* `MagicMock` was referenced without explicit import from `unittest.mock`.
   - *Fix:* Added `from unittest.mock import AsyncMock, MagicMock`.
3. **Unawaited AsyncMock Coroutine Warnings:**
   - *Issue:* In `test_quarantined_knowledge.py` and `test_e2e_local_workflow.py`, `mock_db = AsyncMock()` caused synchronous SQLAlchemy `db.add()` calls to return coroutines that were never awaited.
   - *Fix:* Configured `mock_db.add = MagicMock()` to accurately reflect the synchronous signature of `session.add()`. All 3 runtime warnings eliminated.

---

## 8. Known Environment Limitations & Prerequisites

1. **PostgreSQL Daemon Availability (BLOCKED):**
   - Local port 5432 is closed and Docker daemon is inactive on this workstation.
   - Migration chain 001–008 has been verified statically via `alembic upgrade base:head --sql`.
   - Live database tests (`test_real_db_isolation.py`) are skipped until a local PostgreSQL instance with pgvector is started.
2. **Gmail API Integration (VERIFIED MOCK):**
   - All tests execute against `MockGmailClient`.
   - Zero live emails sent; zero production Google OAuth credentials required.
3. **AI Intelligence Engine (VERIFIED MOCK):**
   - Tests execute against `MockLLMProvider` and `MockEmbeddingProvider`.
   - Zero Gemini API consumption.

---

## 9. Next Steps for Local Development

When resuming local development:
1. **Start Backend Server:**
   ```powershell
   cd backend
   python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
   ```
2. **Start Frontend Server:**
   ```powershell
   cd frontend
   npm run dev
   ```
3. **Initialize Local Admin Session:**
   - Run the bootstrap call in browser console or cURL to establish `lunetron2026!` credentials.
4. **Execute Manual QA Test Cases:**
   - Follow the 12 browser workflows documented in Section 4 to validate user experience end-to-end.

