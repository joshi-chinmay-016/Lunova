# Current Implementation Audit — Lunova

**Date**: November 2026  
**Auditor**: Senior Full-Stack Engineer / Architect  
**Branch**: `ft/platform` (ahead of origin by 7 commits, working tree clean with staged Gmail OAuth implementation)  
**Test Baseline**: **140 passed, 2 skipped, 0 failures** in `backend/tests/`  

---

## 1. Architecture Assessment

Lunova is organized as a **Modular Monolith** containing:
* **Backend**: FastAPI modular application split cleanly into **Platform Backend** (`backend/app/`) and **AI Intelligence Engine** (`backend/intelligence/`).
* **Frontend**: Next.js 14 App Router application with Tailwind CSS, custom claymorphic aesthetic, and 3D visual components.
* **Contracts**: Decoupled contract definitions (`contracts/intelligence-boundary.md`, `proposal-input.md`, `proposal-analysis-result.md`, `errors.md`).
* **Persistence**: PostgreSQL with pgvector (aligned to native 768 dimensions for Gemini `text-embedding-004`).

The domain boundary between Platform and Intelligence is strictly decoupled:
* The Platform handles HTTP APIs, authentication, multi-tenant database operations, OAuth integrations, background tasks, and human reviews.
* The Intelligence Engine is a pure in-memory reasoning pipeline consuming `ProposalContext` and returning `IntelligenceResult`. It has no knowledge of SQLAlchemy ORM models, HTTP route handlers, or frontend schemas.

---

## 2. Completed vs. Missing Feature Matrix

| Functional Area | Current Status | Implemented Components | Missing Components / Next Steps |
| :--- | :--- | :--- | :--- |
| **Authentication & RBAC** | ✅ Complete | JWT auth, bcrypt hashing, User model with `ADMIN`, `REVIEWER`, `VIEWER` roles, `RoleChecker` dependency. | None. Production-ready. |
| **Database Migrations** | ✅ Complete (001-006) | Alembic migrations: `001_initial`, `002_add_document_chunks`, `3a8127b6fcd9_add_user_auth`, `004_align_vector_dimension_768`, `005_add_email_accounts`, `006_add_oauth_states`. | Optional: `email_account_id` on `emails` table (Migration 007). |
| **AI Requirement Extraction** | ✅ Complete | `RequirementExtractor` using Gemini LLM and `extraction_v1.py` with structured Pydantic schemas. | None. Production-ready. |
| **Tenant Knowledge Retrieval** | ✅ Complete | `KnowledgeRetriever` and `PlatformRetriever` using pgvector `Vector(768)` with strict `company_id` isolation. | Real Lunetron proprietary knowledge corpus (synthetic fixtures used currently). |
| **Grounded Response Generation** | ✅ Complete | `ResponseGenerator` using `generation_v1.py` with anti-hallucination guardrails and deterministic grounded fallback. | None. Production-ready. |
| **Grounding Evaluation** | ✅ Complete | `GroundingEvaluator` with regex price detection, citation validation, unsupported claims flagging, and confidence scoring. | None. Production-ready. |
| **Attachment Parsing** | ✅ Complete | `AttachmentParser` supporting PDF (`pypdf`), DOCX (`python-docx`), and TXT with magic-byte validation and 10MB limits. | None. Production-ready. |
| **Attachment Persistence & Storage** | ⚠️ Partial | `ParsedAttachment` exists in memory. | Concrete file storage abstraction on disk (`storage/attachments/{company_id}/...`) and metadata persistence. |
| **Gmail OAuth 2.0 & Encryption** | ✅ Complete (Backend) | `GmailOAuthService`, `TokenEncryptionService` (Fernet authenticated encryption), `/authorize`, `/callback`, `/status`, `/disconnect`, `/refresh`. | Frontend UI button connection. |
| **Frontend Gmail Connection UI** | ❌ Missing | Settings UI has static cards. | Live "Connect Gmail" button, OAuth redirect handler, active connection badge, and disconnect confirmation modal. |
| **Gmail Inbox Synchronization** | ❌ Missing | None. | `GmailClient`, `GmailSyncService`, manual sync endpoint (`POST /api/v1/integrations/gmail/sync`), duplicate email prevention. |
| **Email Ingestion to Proposal** | ⚠️ Partial | `ProposalService.create_proposal` accepts manual inputs. | Automatic creation of `Proposal` and `Email` records from normalized Gmail messages and attachments. |
| **Human Review Station (Frontend)** | ⚠️ Partial | Complete UI layout, but missing frontend TypeScript bridge files (`@/lib/utils`, `@/lib/api/client`) and send confirmation. | Implement missing TypeScript bridge modules and fix type errors. |
| **Outbound Gmail Sending** | ❌ Missing | Proposal lifecycle has `SENT` status, but no dispatch service. | `GmailSendService`, `/api/v1/proposals/{id}/send` endpoint with mandatory human review check, duplicate-send protection. |

---

## 3. Detailed Component Audit (17 Core Components)

1. **`ProposalService`** (`backend/app/platform/services/proposal_service.py`):
   * *Responsibilities*: Proposal CRUD, background intelligence execution (`process_proposal_bg`), approval (`approve_proposal`), and rejection (`reject_proposal`).
   * *Status*: Implemented. Needs integration with incoming email sync and outbound send dispatch.

2. **`ProposalContext`** (`backend/intelligence/models/proposal.py`):
   * *Responsibilities*: Clean in-memory input contract for intelligence analysis (`proposal_id`, `company_id`, `subject`, `body`, `attachments`).
   * *Status*: Fully implemented and tested.

3. **`IntelligenceService`** (`backend/intelligence/service.py`):
   * *Responsibilities*: Pipeline orchestrator running Extraction ➔ Retrieval ➔ Generation ➔ Evaluation.
   * *Status*: Fully implemented and tested.

4. **`IntelligenceResult`** (`backend/intelligence/models/result.py`):
   * *Responsibilities*: Structured output contract holding requirements, sources, draft response, confidence metrics, and warnings.
   * *Status*: Fully implemented and tested.

5. **`Email` model** (`backend/app/models/email.py`):
   * *Responsibilities*: Stores inbound and outbound emails (`direction`, `sender_address`, `recipient_address`, `subject`, `body`, `message_id`, `thread_id`).
   * *Status*: Implemented. Needs optional `email_account_id` relationship and unique index to prevent duplicate ingestion.

6. **`Proposal` model** (`backend/app/models/proposal.py`):
   * *Responsibilities*: Tracks RFP proposal lifecycle (`RECEIVED`, `PROCESSING`, `ANALYZED`, `REVIEW_REQUIRED`, `APPROVED`, `SENT`, `FAILED`, `REJECTED`).
   * *Status*: Fully implemented and tested.

7. **`EmailAccount` model** (`backend/app/models/email_account.py`):
   * *Responsibilities*: Stores connected Gmail account metadata, encrypted tokens, and sync cursors (`history_id`, `last_synced_at`).
   * *Status*: Fully implemented in migration `005`.

8. **`OAuthState` model** (`backend/app/models/oauth_state.py`):
   * *Responsibilities*: Persists single-use CSRF nonces for Google OAuth handshakes with 15-minute expiration.
   * *Status*: Fully implemented in migration `006`.

9. **Attachment Storage Abstraction**:
   * *Responsibilities*: Safe storage of downloaded raw attachment bytes on disk isolated by tenant (`company_id`).
   * *Status*: Currently missing in `backend/app/platform/`. Needs implementation in Phase 5.

10. **`AttachmentParser`** (`backend/intelligence/document_processing/parser.py`):
    * *Responsibilities*: Generic parser extracting text from PDF, DOCX, and TXT files with validation and page tracking.
    * *Status*: Fully implemented and tested.

11. **`GmailOAuthService`** (`backend/app/platform/services/gmail_oauth_service.py`):
    * *Responsibilities*: Handles Google OAuth 2.0 authorization URL, callback code exchange, user info retrieval, token refresh, and disconnection.
    * *Status*: Fully implemented and tested with 31 test cases.

12. **`TokenEncryptionService`** (`backend/app/core/security.py`):
    * *Responsibilities*: Fernet AES-128-CBC + HMAC-SHA256 authenticated symmetric encryption for OAuth tokens.
    * *Status*: Fully implemented and tested with 8 test cases.

13. **Authentication & RBAC** (`backend/app/auth/`, `backend/app/api/dependencies/auth.py`):
    * *Responsibilities*: User login, password hashing, JWT creation/validation, and role-based route protection.
    * *Status*: Fully implemented and tested.

14. **Proposal Review & Approval Endpoints** (`backend/app/api/routes/proposals.py`):
    * *Responsibilities*: `POST /proposals/{id}/approve`, `POST /proposals/{id}/reject`, `GET /proposals/{id}/reviews`.
    * *Status*: Implemented. Needs `POST /proposals/{id}/send`.

15. **Frontend API Client** (`frontend/services/api.ts`, `frontend/lib/api/client.ts`):
    * *Responsibilities*: Typed fetch client for communicating with backend REST endpoints.
    * *Status*: Incomplete. Missing `@/lib/api/client.ts` causes compilation errors in `frontend/hooks/`.

16. **Frontend Integration Settings** (`frontend/app/settings/page.tsx`):
    * *Responsibilities*: Managing company integrations.
    * *Status*: UI placeholder present; needs real Gmail OAuth connect button and live status display.

17. **Proposal Detail and Review Pages** (`frontend/app/proposals/[id]/page.tsx`, `frontend/app/proposals/[id]/review/page.tsx`):
    * *Responsibilities*: Reviewing extracted requirements, supporting evidence, editing response draft, and approving/sending.
    * *Status*: Visual components built; needs end-to-end integration with real backend data and send confirmation.

---

## 4. Current Test Baseline

* **Command**: `C:\Python313\python.exe -m pytest backend/tests/`
* **Result**: **140 passed, 2 skipped in 8.98s**
* **Failures**: **0**
* **Coverage**: Complete coverage across intelligence (attachment parsing, extraction, RAG, generation, evaluation), security (token encryption), OAuth (handshake, CSRF validation, refresh), and platform isolation.

---

## 5. Architectural Concerns & Risks

1. **Frontend Compilation Errors**:
   `npx tsc --noEmit` in `frontend` currently fails due to missing `@/lib/utils` (`cn` helper) and `@/lib/api/client`. Fixing these is essential before connecting the UI to the backend.
2. **Gmail Scopes**:
   Current OAuth setup requests `https://www.googleapis.com/auth/gmail.readonly` and `userinfo.email`. For Phase 8 (Sending), `https://www.googleapis.com/auth/gmail.send` must be handled cleanly without breaking read-only synchronization.
3. **Duplicate Sync Ingestion**:
   Repeated manual syncs from Gmail must not create duplicate `Email` or `Proposal` records. An idempotent check on `(company_id, message_id)` is strictly necessary.
4. **Mandatory Human Review**:
   Under no circumstances may an incoming email or draft automatically send a response. The send action must be strictly gated behind an `APPROVED` proposal status and explicit human confirmation.

---

## 6. Implementation Dependency Order

1. **Phase 1**: Verify and finalize Gmail OAuth backend (Already implemented & passing 39 tests).
2. **Phase 2**: Frontend Gmail Connection UI & TypeScript Fixes (Implement `@/lib/utils`, `@/lib/api/client`, connect Settings UI to `/api/v1/integrations/gmail`).
3. **Phase 3 & 4**: Gmail Provider Client, Message Normalizer & Inbox Sync Service (Manual sync endpoint with duplicate prevention).
4. **Phase 5**: Attachment Storage & Ingestion Pipeline (Disk storage abstraction + `AttachmentParser` integration).
5. **Phase 6**: Connect Ingested Email & Attachments to `ProposalService` & AI Intelligence Engine.
6. **Phase 7**: Frontend Proposal Experience Verification (Real data feeding into dashboard and review station).
7. **Phase 8**: Outbound Gmail Sending Service (`/proposals/{id}/send` with strict validation and confirmation).
8. **Phase 9**: Multi-Tenant Security & Isolation Verification.
9. **Phase 10**: Automated End-to-End & Integration Test Suite.
10. **Phase 11**: Real Lunetron Knowledge Base Ingestion.
11. **Phase 12**: Quality Verification (`pytest`, `npm run build`, `npm run lint`).
12. **Phase 13**: End-to-End Acceptance Verification & Final Completion Report.

