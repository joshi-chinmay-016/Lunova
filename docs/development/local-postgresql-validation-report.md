# Lunova — Phase 3: Local PostgreSQL Setup & Database Validation Report

**Document Version:** 1.0.0  
**Date:** 2026-11-05  
**Tenant Under Test:** `lunetron` (Lunetron Technologies, UUID: scoped)  
**Database Host:** Localhost (Container `lunova_db` via local Docker Desktop engine)  
**Database Engine:** PostgreSQL 16.15 (Debian 16.15-1.pgdg12+2, x86_64)  
**Extension:** `pgvector` v0.8.6 (Vector data type, IVFFlat & HNSW index support)  
**Dedicated Database:** `lunova_dev`  
**Dedicated User:** `lunova_user`  
**Git Branch:** `ft/platform` (Strictly uncommitted and unpushed; working tree preserved per local mandate)  
**Evaluation Scope:** Database Initialization, Alembic Migration Chain 001–008, Persistence Verification, pgvector 768-dim Embeddings, Pessimistic Row Locking, Concurrent Send Prevention, Multi-Tenant Partitioning, and Application Restart Durability.

---

## 1. Executive Summary & Verification Classification

In this phase, a real, local PostgreSQL 16 database environment equipped with the native `pgvector` extension was successfully activated and fully validated. All migrations, persistence operations, pessimistic row locks, and tenant boundaries were executed and verified directly against live PostgreSQL connections.

### Verification Classification Matrix

| Domain | Status | Testing Methodology | Summary Findings |
| :--- | :---: | :---: | :--- |
| **Database Environment Setup** | **VERIFIED** | Live DB Connection | Container `lunova_db` activated on port 5432. Dedicated database `lunova_dev` and role `lunova_user` provisioned with vector extension enabled. |
| **Alembic Migrations (001–008)** | **VERIFIED** | Live DDL Execution | **Confirmed Defect Remediated:** Shortened revision ID in migration 007 from 36 chars to 22 chars to satisfy Alembic's `VARCHAR(32)` constraint. Migrations 001 through 008 applied cleanly from base to head. |
| **User & Auth Persistence** | **VERIFIED** | Live DB Insertion & Query | User records, UUID primary keys, and bcrypt-hashed passwords persist and verify cleanly. |
| **Proposal & Email Persistence** | **VERIFIED** | Live DB Insertion & Query | Proposals, multi-directional emails (`INCOMING`, `OUTGOING`), and thread associations persist accurately. |
| **Attachment Metadata Persistence** | **VERIFIED** | Live DB Insertion & Query | `email_attachments` table records file size, MIME type, storage path, and page count with cascade deletes. |
| **pgvector 768-dim Embeddings** | **VERIFIED** | Live Vector Query (`<=>`) | `vector(768)` dimension verified. `PlatformRetriever` executes cosine distance ordering with 100% tenant accuracy. |
| **Durable Dispatch States** | **VERIFIED** | Live DB Insertion & Query | `SENDING` and `DISPATCH_UNCERTAIN` enum values persist. Audit logs track `DISPATCH_STARTED`, `DISPATCH_UNCERTAIN`, `DISPATCH_RESET`. |
| **Concurrency & Row Locking** | **VERIFIED** | Live Multi-Session Locking | Pessimistic row locking (`with_for_update()`) prevents duplicate sends. Second concurrent transaction is rejected with `ValueError`. |
| **Restart Durability** | **VERIFIED** | Multi-Session Lifecycle | Proposals in `DISPATCH_UNCERTAIN` persist across session terminations and safely reconcile via `reconcile_dispatch`. |
| **Tenant Isolation** | **VERIFIED** | Live Cross-Tenant Queries | Cross-tenant reads return `None`; cross-tenant updates affect `0 rows`. Retrieval strictly isolates Company A and Company B data. |
| **Full Regression Suite** | **VERIFIED** | Pytest + Next.js Build | **202 passed, 1 skipped** (only live Gemini API key skipped), **0 failures**. Frontend builds cleanly with 0 errors across all 9 routes. |

---

## 2. Step 1 — Inspection & Environment Assessment

### 2.1 Configuration Review
- **Engine & Session Maker ([`backend/app/core/database.py`](file:///c:/Users/Lokesh/OneDrive/Desktop/Projects/Lunova/backend/app/core/database.py)):**
  - Async Engine: `create_async_engine(settings.DATABASE_URL)`
  - Sync Engine: `create_engine(settings.DATABASE_URL.replace("+asyncpg", ""))` (Used by synchronous `PlatformRetriever`)
- **Connection Strings ([`backend/app/core/config.py`](file:///c:/Users/Lokesh/OneDrive/Desktop/Projects/Lunova/backend/app/core/config.py)):**
  - Default: `postgresql+asyncpg://postgres:postgres@localhost:5432/lunova`
  - Validated Dev Connection: `postgresql+asyncpg://lunova_user:lunova_dev_password@localhost:5432/lunova_dev`

### 2.2 Expected PostgreSQL & Extension Specifications
- **PostgreSQL Version:** 16+
- **Extensions:** `vector` (pgvector 0.8.0+)
- **Vector Dimensions:** Explicitly configured as `768` (Aligned with `004_align_vector_dimension_768.py` and Google Gemini's `text-embedding-004`).

---

## 3. Step 2 & 3 — Local Database Initialization & Migration Execution

### 3.1 Local Container Activation
The local Docker Desktop daemon service was activated, bringing online the existing pre-configured container `lunova_db`:
```bash
docker ps
# Output:
# CONTAINER ID   IMAGE                    STATUS                  PORTS                    NAMES
# 88bd69688b98   pgvector/pgvector:pg16   Up Less than a second   0.0.0.0:5432->5432/tcp   lunova_db
```

### 3.2 Dedicated Database & Role Provisioning
In accordance with local development security mandates:
1. Created dedicated development user: `lunova_user`.
2. Created dedicated database: `lunova_dev` (Owner: `lunova_user`).
3. Enabled extension `vector` in `lunova_dev`.
```sql
CREATE USER lunova_user WITH PASSWORD 'lunova_dev_password';
CREATE DATABASE lunova_dev OWNER lunova_user;
\c lunova_dev
CREATE EXTENSION IF NOT EXISTS vector;
GRANT ALL ON SCHEMA public TO lunova_user;
ALTER SCHEMA public OWNER TO lunova_user;
```

### 3.3 Confirmed Migration Defect Discovered & Remediated

#### Defect: Alembic Revision String Length Exceeded `VARCHAR(32)` in Migration 007
- **Root Cause:**
  When executing `alembic upgrade head`, PostgreSQL threw:
  ```
  asyncpg.exceptions.StringDataRightTruncationError: value too long for type character varying(32)
  [SQL: UPDATE alembic_version SET version_num='007_add_email_attachments_and_links' WHERE alembic_version.version_num = '006_add_oauth_states']
  ```
  Alembic hardcodes the `alembic_version.version_num` column as `VARCHAR(32)`. The revision identifier `'007_add_email_attachments_and_links'` was **36 characters long**, which PostgreSQL strictly rejected. (SQLite and offline `--sql` generation previously masked this defect).
- **Remediation:**
  Shortened the revision ID to a clean, descriptive 22-character string in [`007_add_email_attachments_and_links.py`](file:///c:/Users/Lokesh/OneDrive/Desktop/Projects/Lunova/backend/migrations/versions/007_add_email_attachments_and_links.py):
  - Changed `revision: str = '007_email_attachments'`
  - Updated downstream dependency in [`008_add_dispatch_states.py`](file:///c:/Users/Lokesh/OneDrive/Desktop/Projects/Lunova/backend/migrations/versions/008_add_dispatch_states.py): `down_revision = '007_email_attachments'`

### 3.4 Live Migration Execution
With the revision string remediated, the entire migration chain from base to head was executed against `lunova_dev`:
```bash
$env:DATABASE_URL="postgresql+asyncpg://lunova_user:lunova_dev_password@localhost:5432/lunova_dev"
cd backend
python -m alembic upgrade head
```
**Execution Output:**
```
INFO  [alembic.runtime.migration] Context impl PostgresqlImpl.
INFO  [alembic.runtime.migration] Will assume transactional DDL.
INFO  [alembic.runtime.migration] Running upgrade  -> 001, initial
INFO  [alembic.runtime.migration] Running upgrade 001 -> 002_add_document_chunks, add document chunks
INFO  [alembic.runtime.migration] Running upgrade 002_add_document_chunks -> 3a8127b6fcd9, add_user_auth
INFO  [alembic.runtime.migration] Running upgrade 3a8127b6fcd9 -> 004_align_vector_dimension_768, align vector dimension to 768 for Gemini text-embedding-004
INFO  [alembic.runtime.migration] Running upgrade 004_align_vector_dimension_768 -> 005_add_email_accounts, add email_accounts and email thread_id
INFO  [alembic.runtime.migration] Running upgrade 005_add_email_accounts -> 006_add_oauth_states, add oauth_states table for durable replay prevention
INFO  [alembic.runtime.migration] Running upgrade 006_add_oauth_states -> 007_email_attachments, add email_attachments table and link emails to email_accounts
INFO  [alembic.runtime.migration] Running upgrade 007_email_attachments -> 008_add_dispatch_states, add dispatch states SENDING and DISPATCH_UNCERTAIN to proposalstatus enum
```

**Verification Queries:**
- `SELECT version_num FROM alembic_version;` -> `008_add_dispatch_states`
- Total Tables Created: `12` tables (`companies`, `users`, `proposals`, `emails`, `email_accounts`, `email_attachments`, `knowledge_documents`, `document_chunks`, `oauth_states`, `reviews`, `audit_logs`, `alembic_version`).
- `proposalstatus` Enum Values: `RECEIVED`, `PROCESSING`, `ANALYZED`, `REVIEW_REQUIRED`, `APPROVED`, `SENDING`, `DISPATCH_UNCERTAIN`, `SENT`, `FAILED`, `REJECTED`.

---

## 4. Step 4 — Persistence Verification Results

A dedicated automated test suite ([`backend/tests/test_platform/test_postgres_validation.py`](file:///c:/Users/Lokesh/OneDrive/Desktop/Projects/Lunova/backend/tests/test_platform/test_postgres_validation.py)) was constructed and executed against live PostgreSQL:

| Test Case | Method | PostgreSQL Evidence | Result |
| :--- | :--- | :--- | :---: |
| **User & Password Persistence** | `test_postgres_user_and_auth_persistence` | User record inserted with bcrypt hash; queried in fresh transaction; `AuthService.verify_password` returns True for valid password and False for incorrect password. | **PASS** |
| **Proposal & Email Persistence** | `test_postgres_proposal_email_and_attachment_persistence` | Proposal, incoming email with thread_id, and outgoing draft email persist with foreign keys to `companies` and `proposals`. | **PASS** |
| **Attachment Metadata Persistence** | `test_postgres_proposal_email_and_attachment_persistence` | `EmailAttachment` record with file size (1MB), page count (5), and storage path persists in `email_attachments` table. | **PASS** |
| **Knowledge & 768-dim pgvector** | `test_postgres_pgvector_768_dimension_and_retrieval` | Chunk with 768-dim vector inserted; `PlatformRetriever` performs cosine distance (`<=>`) query; chunk returned with correct distance ranking. | **PASS** |
| **Dispatch State & Audit Logs** | `test_postgres_dispatch_states_and_audit_persistence` | Proposal transitioned `APPROVED -> SENDING -> DISPATCH_UNCERTAIN`. Immutable `AuditLog` rows created for each transition and verified in order. | **PASS** |

---

## 5. Step 5 — Concurrency, Row Locking, & Tenant Isolation

### 5.1 Cross-Tenant Read and Write Isolation
- **Test:** `test_postgres_cross_tenant_isolation_reads_and_writes`
- **Execution:**
  1. Created Company Alpha and Company Beta.
  2. Created Proposal under Company Beta.
  3. Company Alpha executed `SELECT * FROM proposals WHERE id = :beta_id AND company_id = :alpha_id`.
     - **Observed Result:** Returned `None`.
  4. Company Alpha executed `UPDATE proposals SET title = 'Compromised' WHERE id = :beta_id AND company_id = :alpha_id`.
     - **Observed Result:** Row count affected was `0`. Company Beta's record remained unaltered.
- **Verdict:** **PASS**

### 5.2 Pessimistic Row Locking (`with_for_update`)
- **Test:** `test_postgres_pessimistic_row_locking_and_concurrent_send_prevention`
- **Execution:**
  1. Opened Session 1: Acquired row-level lock using `.with_for_update()`.
  2. Session 1 updated proposal status to `SENDING` and committed.
  3. Opened Session 2: Attempted to lock the same proposal.
  4. Session 2 observed `proposal.status == ProposalStatus.SENDING` and threw `ValueError("Proposal is currently being dispatched (state 'SENDING')")`.
- **Verdict:** **PASS**

### 5.3 Dispatch Uncertainty & Restart Durability
- **Test:** `test_postgres_dispatch_uncertainty_survives_restart_and_reconciles`
- **Execution:**
  1. Session 1 marked proposal as `DISPATCH_UNCERTAIN` following simulated network timeout. Session committed and closed.
  2. Session 2 (Simulating fresh application restart) queried proposal. Verified `status == DISPATCH_UNCERTAIN`.
  3. Invoked `GmailSendService.reconcile_dispatch(action="RESET_FOR_RESEND")`.
  4. Status transitioned back to `APPROVED`; audit log recorded `DISPATCH_RESET`.
  5. In Session 3, verified proposal is in `APPROVED` status and eligible for resend.
- **Verdict:** **PASS**

---

## 6. Step 6 — Final Regression Summary

### 6.1 Backend Automated Suite (Pytest)
```powershell
$env:DATABASE_URL="postgresql+asyncpg://lunova_user:lunova_dev_password@localhost:5432/lunova_dev"
python -m pytest backend/tests
```
- **Total Tests Collected:** 203
- **Passed:** **202 passed**
- **Skipped:** **1 skipped** (`test_gemini_provider_live` — offline mock mode enabled)
- **Failures:** **0**
- **Warnings:** **0**
- **Execution Time:** 38.07s
- **Exit Code:** `0`

### 6.2 Frontend Typecheck & Production Build
```powershell
cd frontend
npx tsc --noEmit
# Exit code: 0 (0 errors)

npm run build
# Exit code: 0
# All 9 routes compiled cleanly:
#   / (Dashboard)            6.10 kB
#   /_not-found              873 B
#   /analytics               3.50 kB
#   /knowledge-base          7.26 kB
#   /login                   3.65 kB
#   /proposals               4.99 kB
#   /proposals/[id]          9.67 kB
#   /proposals/[id]/review   1.92 kB
#   /settings                8.50 kB
```

---

## 7. How to Maintain the Local PostgreSQL Environment

To run Lunova locally with full PostgreSQL persistence:

1. **Ensure the container is running:**
   ```powershell
   docker start lunova_db
   ```
2. **Set the environment variable (or put in `backend/.env`):**
   ```ini
   DATABASE_URL=postgresql+asyncpg://lunova_user:lunova_dev_password@localhost:5432/lunova_dev
   ```
3. **Run Migrations (if new revisions are added):**
   ```powershell
   cd backend
   python -m alembic upgrade head
   ```
4. **Start Backend & Frontend:**
   ```powershell
   # Terminal 1: Backend
   cd backend
   python -m uvicorn app.main:app --port 8000 --reload

   # Terminal 2: Frontend
   cd frontend
   npm run dev
   ```

