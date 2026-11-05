# Lunova — Local Testing Guide

This guide details how to execute automated unit, integration, security isolation, and end-to-end lifecycle tests for Lunova.

---

## 1. Test Architecture Overview

All automated tests are designed to execute hermetically on a developer's workstation without requiring live Google Cloud API credentials or an active internet connection:
- **Mock Gmail Client:** [`MockGmailClient`](file:///c:/Users/Lokesh/OneDrive/Desktop/Projects/Lunova/backend/app/platform/integrations/gmail/client.py) stores synthetic emails, attachments, and sent messages in-memory.
- **Mock AI Providers:** [`MockLLMProvider`](file:///c:/Users/Lokesh/OneDrive/Desktop/Projects/Lunova/backend/intelligence/providers/mock.py) and [`MockEmbeddingProvider`](file:///c:/Users/Lokesh/OneDrive/Desktop/Projects/Lunova/backend/intelligence/providers/mock.py) provide deterministic completions and embeddings offline.
- **Database Isolation:** Unit tests utilize dependency overrides with `AsyncMock` to verify database transaction boundaries, row locking, and rollback states without mutating live database tables.

---

## 2. Test Execution Commands

### 2.1 Full Backend Suite
From the repository root:
```bash
cd backend
python -m pytest tests/ -v
```

### 2.2 13-Step End-to-End Workflow Test
Exercises the full proposal response lifecycle:
```bash
cd backend
python -m pytest tests/test_platform/test_e2e_local_workflow.py -v
```

### 2.3 Dispatch Hardening & Concurrency Tests
Verifies row locking, concurrent duplicate send prevention, network timeout uncertainty, and reconciliation:
```bash
cd backend
python -m pytest tests/test_platform/test_gmail_send_hardening.py -v
```

### 2.4 Multi-Tenant Isolation Tests
Verifies cross-tenant data boundaries, path traversal prevention, and proposal confidentiality:
```bash
cd backend
python -m pytest tests/test_platform/test_sync_and_send_isolation.py -v
```

### 2.5 Knowledge Quarantine Tests
Verifies synthetic benchmark fixtures cannot be ingested into production knowledge stores:
```bash
cd backend
python -m pytest tests/intelligence/test_quarantined_knowledge.py -v
```

### 2.6 Frontend Typecheck & Production Build
```bash
cd frontend
npx tsc --noEmit
npm run build
```

---

## 3. The 13-Step Synthetic RFP Workflow

The test suite validates the complete 13-step vertical slice:

1. **User Authentication:** Admin logs in via `POST /api/v1/auth/login` and receives JWT.
2. **Dashboard Query:** Proposal listing queried via `GET /api/v1/proposals`.
3. **Inbox Synchronization:** Ingests synthetic RFP message using `MockGmailClient`.
4. **Email Normalization:** Persists normalized RFC 2822 email record with thread metadata.
5. **Attachment Processing:** Extracts text from synthetic PDF/DOCX attachments.
6. **Requirement Extraction:** AI parses requirements into structured JSON with category and priority.
7. **Knowledge Retrieval:** Queries tenant-scoped vector index for matching evidence chunks.
8. **Draft Proposal Generation:** Synthesizes structured response with cited references.
9. **Grounding & Citations:** Evaluates draft against source chunks to verify factual grounding.
10. **Proposal Review:** Reviewer inspects draft in the review station.
11. **Explicit Approval:** Reviewer posts formal approval with comments to `POST /api/v1/proposals/{id}/approve`.
12. **Simulated Dispatch:** Triggers `POST /api/v1/proposals/{id}/send` with `MockGmailClient`.
13. **Verification & Audit:** Validates status `SENT`, thread continuity, and immutable audit logs.

---

## 4. Skipped Tests & Environmental Triggers

Two tests are skipped intentionally during standard offline runs:

| Skipped Test | Reason | How to Enable |
| :--- | :--- | :--- |
| `test_real_db_isolation.py` | Requires active PostgreSQL database on port 5432. | Set `DATABASE_URL=postgresql+asyncpg://...` and run against a live PostgreSQL server. |
| `test_gemini_provider_live` | Requires paid Google Gemini API key. | Set `GEMINI_API_KEY=...` and `RUN_LIVE_LLM_TESTS=1`. |

