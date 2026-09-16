# Team Ownership & Responsibilities

This document defines the strict ownership boundaries, functional domains, and shared areas between **Chinmay** and **Lokesh** to facilitate independent parallel development.

---

## 1. Ownership Matrix

```
                      ┌────────────────────────────────────────┐
                      │          Shared Coordination           │
                      │  • contracts/                          │
                      │  • docs/architecture/ & docs/decisions/│
                      │  • tests/integration/ & tests/e2e/     │
                      │  • Deployment & database infrastructure│
                      └──────────────────┬─────────────────────┘
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 │                                               │
                 ▼                                               ▼
  ┌─────────────────────────────┐                 ┌─────────────────────────────┐
  │           CHINMAY           │                 │           LOKESH            │
  │     AI & Intelligence       │                 │     Platform & Workflow     │
  └──────────────┬──────────────┘                 └──────────────┬──────────────┘
                 │                                               │
  • backend/intelligence/                         • frontend/
    ├── extraction/                                 ├── app/
    ├── retrieval/                                  ├── components/
    ├── generation/                                 ├── features/
    ├── evaluation/                                 └── services/
    └── providers/                                • backend/app/
  • backend/tests/intelligence/                     ├── api/
                                                    ├── domain/
                                                    │   ├── company/
                                                    │   ├── proposal/
                                                    │   ├── email/
                                                    │   ├── knowledge/
                                                    │   ├── review/
                                                    │   └── audit/
                                                    └── infrastructure/
                                                        ├── database/
                                                        ├── email/
                                                        └── storage/
                                                  • backend/tests/domain/
```

---

## 2. Chinmay's Scope: AI & Proposal Intelligence

**Core Mandate**: Transform normalized proposal data into structured requirements, retrieve grounded context, and generate high-fidelity proposal drafts.

- **Proposal Understanding & Requirement Extraction**: Parsing text to identify discrete requirements, categories, and priority.
- **RAG & Knowledge Retrieval**: Semantic vector search against company-scoped document chunks.
- **Source Attribution**: Mapping every response statement back to original source documents.
- **Response & Clarification Generation**: Drafting cohesive proposal responses and generating questions for missing information.
- **Grounding Validation & Confidence Scoring**: Measuring answer faithfulness against retrieved sources to prevent hallucination.
- **AI Unit & Evaluation Tests**: Maintaining test fixtures and evaluation benches in `backend/tests/intelligence/`.

---

## 3. Lokesh's Scope: Platform & Proposal Workflow

**Core Mandate**: Manage system state, integrate email, handle document persistence, and deliver the human review experience.

- **Frontend Application**: Leading development of `frontend/` (views, dashboard, review interface).
- **Email Ingestion & Sending**: Gmail API integration, mailbox polling, attachment downloads, and normalized email dispatch.
- **Proposal Lifecycle Management**: State machine transitions (`RECEIVED` ➔ `CLOSED`).
- **Human Review Workflow**: Frontend review interfaces for inspecting, editing, approving, or rejecting generated responses.
- **Company & Knowledge Document CRUD**: Tenant management and document upload/cataloging.
- **Audit & History**: Recording immutable system events, reviewer actions, and message histories.
- **Platform Unit & Domain Tests**: Maintaining test suites in `backend/tests/domain/`.

---

## 4. Shared Responsibilities

Neither developer is restricted to pure CRUD or pure AI in isolation:

- **Contract Definitions**: Updating or versioning contracts in `contracts/`.
- **Frontend Intelligence UI**: Integrating AI results into `frontend/features/intelligence/`.
- **Database Schema**: Approving migration scripts and relational tables.
- **Integration & E2E Testing**: Validating the end-to-end integration of Platform + AI.
- **Deployment & Observability**: Docker Compose environments and logging standards.
