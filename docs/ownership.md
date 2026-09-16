# Team Ownership & Boundary Matrix

This document defines the primary ownership, technical responsibilities, and collaboration rules between **Chinmay** and **Lokesh** for the Lunova project.

> [!IMPORTANT]
> **Core Principle**: Ownership indicates primary responsibility, not exclusive access.

---

## 1. Responsibility Overview

| Area | Owner | Main Responsibility |
| :--- | :--- | :--- |
| `frontend/` | **Lokesh** | Next.js frontend application, layout, shared components, proposals list, review workflow UI, company & knowledge management screens. |
| `frontend/features/intelligence/` | **Shared** | Visual representation of AI outputs (cards, badges, citations), integrating backend intelligence contracts into the UI. |
| `backend/app/api/` | **Lokesh** | Platform HTTP API routes, endpoint validation, and dependency injection providers. |
| `backend/app/domain/company/` | **Lokesh** | Company/tenant configuration, settings, tenant metadata (MVP: Lunetron). |
| `backend/app/domain/proposal/` | **Lokesh** | Proposal aggregate, persistence rules, thread relationships, and lifecycle state machine (`RECEIVED` ➔ `CLOSED`). |
| `backend/app/domain/email/` | **Lokesh** | Inbound email ingestion, email normalization, message/thread identification, attachment extraction. |
| `backend/app/domain/knowledge/` | **Lokesh** | Knowledge document entity management, upload lifecycle, and tenant-scoped document records. |
| `backend/app/domain/review/` | **Lokesh** | Human review workflow rules, review decision capture (approve, edit, reject), and reviewer attribution. |
| `backend/app/domain/audit/` | **Lokesh** | Immutable audit trail capturing who reviewed, AI generated content, sources cited, human edits, and dispatch events. |
| `backend/app/infrastructure/` | **Lokesh** | Database connections (SQLAlchemy/Alembic), email provider adapter (Gmail API), and storage handlers. |
| `backend/intelligence/` | **Chinmay** | AI/RAG intelligence engine: requirement extraction, company-scoped vector retrieval, response drafting, grounding validation, confidence scoring, and provider abstractions. |
| `backend/tests/domain/` | **Lokesh** | Platform and domain test suites. |
| `backend/tests/intelligence/` | **Chinmay** | AI evaluation and extraction test benches. |
| `contracts/` | **Shared** | Communication boundary between Platform Backend and AI Intelligence (`ProposalInput`, `ProposalAnalysisResult`, `errors.md`). |
| `docs/` | **Shared** | Architecture blueprints, ADRs, requirements, and system documentation. |
| `fixtures/` | **Shared** | Mock test data allowing decoupled parallel development. |
| `tests/integration/` | **Shared** | Cross-boundary integration test suites verifying Platform ↔ AI integration. |
| `tests/e2e/` | **Shared** | End-to-end user journey and workflow verification. |
| `.github/` | **Shared** | CI/CD automation workflows and repository maintenance. |
| `docker-compose.yml` | **Shared** | Shared local container infrastructure (PostgreSQL + pgvector). |
| `README.md` | **Shared** | Root repository documentation. |

---

## 2. Chinmay — AI / Proposal Intelligence

### Primary Ownership
- `backend/intelligence/`
  - `backend/intelligence/extraction/`: Understand proposal, extract requirements, identify missing information.
  - `backend/intelligence/retrieval/`: Retrieve relevant company knowledge, prepare context, ensure strict company/tenant isolation (`company_id`).
  - `backend/intelligence/generation/`: Generate grounded proposal responses, formulate clarification questions.
  - `backend/intelligence/evaluation/`: Grounding checks, knowledge coverage, confidence scoring, AI warnings, unsupported claims detection.
  - `backend/intelligence/providers/`: Replaceable LLM and embedding provider abstractions.
- `backend/tests/intelligence/`: AI-specific test suites, benchmarks, and evaluation fixtures.

### Key Working Rules for Chinmay
- Chinmay primarily works inside `backend/intelligence/` and its corresponding tests.
- Chinmay should avoid unnecessarily modifying Lokesh's platform/domain implementations in `backend/app/` or `frontend/`.
- The AI layer must **never** invent company claims (experience, previous projects, client names, technologies, pricing, delivery timelines, certifications, or capabilities) unless explicitly supported by the company knowledge base.
- If relevant knowledge cannot be found, the AI must flag the issue rather than fabricate.

---

## 3. Lokesh — Platform / Proposal Workflow

### Primary Ownership
- `frontend/`: Full Next.js application, component libraries, state management, and user interfaces.
- `backend/app/`:
  - `backend/app/api/`: REST routes and dependency injection.
  - `backend/app/domain/`: Business entities, proposal lifecycle, email models, review logic, audit logs.
  - `backend/app/infrastructure/`: PostgreSQL + pgvector setup, Gmail API integration, storage.
- `backend/tests/domain/`: Platform domain unit tests.

### Key Working Rules for Lokesh
- Lokesh owns the end-to-end proposal lifecycle, email delivery, and human review experience.
- The platform layer must normalize email and attachment payloads before passing them to the AI engine via `ProposalInput`.
- The platform consumes `ProposalAnalysisResult` without coupling to internal AI prompting, embedding dimensions, or retrieval algorithms.
- Human review and approval is strictly mandatory before sending in the MVP.

---

## 4. Shared Collaboration & Coordination Rules

1. **Contract Changes**:
   Any modification to files in `contracts/` must be coordinated and approved by both Chinmay and Lokesh.
2. **Git Branches**:
   - `main`: Protected production releases.
   - `develop`: Integration and staging branch.
   - `feature/chinmay-intelligence`: Chinmay's feature development branch.
   - `feature/lokesh-platform`: Lokesh's feature development branch.
3. **Commit Discipline**:
   Keep commits small, atomic, and focused. Avoid sweeping formatting changes across directories owned by the other developer.
