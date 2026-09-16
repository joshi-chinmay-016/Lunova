# Lunova Backend (`backend`)

FastAPI modular monolith powering the Lunova Proposal Response Agent.

## Architecture

The backend is organized as a **modular monolith** with a strict boundary between the platform/workflow domain and the AI intelligence engine:

```
backend/
├── app/                  # Platform & Workflow (Owned by Lokesh)
│   ├── api/              # HTTP routes & dependency injection
│   ├── core/             # Configuration & security settings
│   ├── domain/           # Business entities & state machines
│   │   ├── company/      # Tenant/company configuration (MVP: Lunetron)
│   │   ├── proposal/     # Proposal aggregate & lifecycle state machine
│   │   ├── email/        # Normalized email parsing & attachment handling
│   │   ├── knowledge/    # Document management & lifecycle
│   │   ├── review/       # Human review decisions (approve, edit, reject)
│   │   └── audit/        # Immutable audit trail
│   └── infrastructure/   # External integrations
│       ├── database/     # SQLAlchemy async engine, Alembic & pgvector
│       ├── email/        # Gmail API normalized adapter
│       └── storage/      # Local file storage for documents
│
├── intelligence/         # AI Proposal Intelligence (Owned by Chinmay)
│   ├── extraction/       # Proposal understanding & requirement extraction
│   ├── retrieval/        # Company-scoped vector search & RAG
│   ├── generation/       # Proposal response drafting & clarification questions
│   ├── evaluation/       # Grounding checks, confidence scores, hallucination flags
│   └── providers/        # LLM & Embedding provider abstractions
│
└── tests/
    ├── domain/           # Platform & domain test suites (Lokesh)
    └── intelligence/     # AI & RAG evaluation test suites (Chinmay)
```

## Technology Stack

- **Framework**: FastAPI (Python 3.11+)
- **Validation**: Pydantic v2
- **ORM & Migrations**: SQLAlchemy 2.0 (async), Alembic
- **Database**: PostgreSQL 16 with `pgvector`
- **Infrastructure Scope**: Strict modular monolith. No Redis, no Celery, no Kafka, no Kubernetes.
