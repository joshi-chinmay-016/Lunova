# Lunova — Real Gmail Integration Testing Guide

This document describes the testing strategy, test suites, and execution instructions for the Lunova Gmail integration.

---

## 1. Automated Testing Strategy

To guarantee absolute safety, zero external network dependencies during CI, and strict tenant isolation, all automated tests use deterministic mocking:
- **`MockGmailClient`**: In-memory Gmail client implementing `BaseGmailClient`. Simulates message listing, pagination, message retrieval, attachment download, history listing, and outbound sending without hitting external Google servers.
- **`httpx.Client` Mocks**: Unit tests for `GmailClient` mock HTTP responses using `httpx.Response` to verify exponential backoff retries on HTTP 429 and 503 errors.
- **In-Memory SQLite**: Fast, clean database sessions for unit and integration tests.
- **PostgreSQL Validation**: Dedicated local PostgreSQL container tests verify pgvector (768 dimensions), row locking (`with_for_update()`), and foreign key constraints.

---

## 2. Test Suite Overview

| Test File | Focus Area | Key Assertions |
| :--- | :--- | :--- |
| `test_gmail_oauth_phase_b.py` | Google OAuth & Token Lifecycle | State generation, single-use CSRF consumption, token encryption, centralized refresh with row lock, redirect handling, alias compatibility |
| `test_gmail_sync.py` | Inbound Synchronization | Message deduplication, pagination, backoff retry (429/503), history tracking, automated noise filtering, thread association, oversized attachments |
| `test_gmail_normalizer.py` | Message Normalization | From/To/Cc/Bcc parsing, internalDate ms parsing, multipart attachment extraction, HTML-to-text fallback |
| `test_gmail_send.py` | Outbound Proposal Dispatching | Status checks (only APPROVED), RFC 2822 formatting, In-Reply-To headers, SENDING transition, SENT finalization |
| `test_gmail_send_hardening.py` | Send Hardening & Reconciliation | Network timeout handling (DISPATCH_UNCERTAIN), blocked retry, out-of-band reconciliation (CONFIRM_DELIVERED, RESET_FOR_RESEND) |
| `test_sync_and_send_isolation.py` | Multi-Tenant Isolation | Cross-tenant access boundaries, company scoping on accounts, emails, and proposals |

---

## 3. Running the Test Suites

### 3.1 Run Gmail Integration Tests
From the repository root (PowerShell):
```powershell
$env:PYTHONPATH="backend"
python -m pytest backend/tests/test_platform/test_gmail_oauth_phase_b.py backend/tests/test_platform/test_gmail_sync.py backend/tests/test_platform/test_gmail_normalizer.py backend/tests/test_platform/test_gmail_send.py backend/tests/test_platform/test_gmail_send_hardening.py backend/tests/test_platform/test_sync_and_send_isolation.py -v
```

### 3.2 Run Complete Non-Postgres Backend Suite (215 Tests)
```powershell
$env:PYTHONPATH="backend"
python -m pytest backend/tests --ignore=backend/tests/test_platform/test_postgres_validation.py --ignore=backend/tests/test_platform/test_real_db_isolation.py
```

### 3.3 Run Frontend TypeScript & Build Verification
```powershell
cd frontend
npx tsc --noEmit
npm run build
```
