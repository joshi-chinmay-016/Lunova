# 7. Intelligence Module Boundary and Responsibilities

- **Status**: Accepted
- **Date**: 2026-09-17
- **Deciders**: Chinmay, Lokesh

---

## Context

Lunova combines transactional platform workflows (email ingestion, proposal persistence, human review, and dispatch) with complex AI reasoning (requirement extraction, semantic retrieval, grounded draft generation, and confidence evaluation).

To maintain high development velocity and clear team ownership without premature microservice distribution, we need an explicit boundary defining where AI intelligence lives and what it is responsible for.

## Decision

We will isolate all AI intelligence functionality inside `backend/intelligence/`, keeping all platform workflow, database operations, and external communications inside `backend/app/`.

Key architectural principles of this boundary:

1. **Modular Monolith, Not Microservices**:
   - The intelligence module is a code-level boundary within the modular monolith, rather than an independently deployed network service.
   - *Rationale*: Simpler development across teams, straightforward in-process debugging, fewer deployment concerns, zero network latency when passing normalized context, and avoidance of premature distributed-system complexity.

2. **AI Reasoning vs. Platform Workflow**:
   - `backend/intelligence/` owns requirement parsing, semantic knowledge retrieval, draft generation, grounding checks, and provider abstractions.
   - `backend/app/` owns email fetching/sending, database models, proposal lifecycle state machines, company configuration, and human review workflows.

3. **Stage Interfaces & Inversion of Control**:
   - The intelligence pipeline is decomposed into stage interfaces (`Extractor`, `Retriever`, `Generator`, `Evaluator`).
   - `IntelligenceService` depends on these abstractions, ensuring individual reasoning steps can be mocked, benchmarked, or upgraded independently.

4. **Provider Abstraction Layer**:
   - LLM and embedding backends are isolated behind abstract interfaces (`LLMProvider`, `EmbeddingProvider`).
   - The system is not hardcoded to any single vendor (e.g. OpenAI, Anthropic, Gemini).

5. **Configurable Embedding Dimension (Planned: 3072)**:
   - The vector embedding dimension is centrally configured (`DEFAULT_EMBEDDING_DIMENSION = 3072`) rather than hardcoded across the codebase.
   - Vector database schemas and pgvector columns will align with this configured dimension once production embedding models are selected.

6. **Tenant Isolation Enforced by Default**:
   - All knowledge retrieval is strictly scoped by `company_id`. The AI engine cannot execute un-scoped queries; missing tenant context raises `MissingCompanyContextError`.

7. **Deferral of Detailed Production Contracts**:
   - Production JSON/Pydantic schemas remain conceptual until representative Lunetron proposal samples and real requirements are evaluated. This avoids premature schema churn.

## Consequences

### Positive
- **Independent Testability**: The AI layer can be tested with mock inputs and mock providers without requiring running databases, email inboxes, or paid LLM APIs.
- **Clear Ownership**: Chinmay owns `backend/intelligence/` and AI tests; Lokesh owns `backend/app/` and the platform frontend.
- **Pluggable AI Providers**: Foundation models and embedding backends can be swapped without touching platform code.
- **Provider Neutrality**: Lunova can ingest from Gmail, Outlook, or web forms in the future without altering AI logic.
- **Low Overhead**: Modular monolith avoids network hops, distributed serialization, and multi-service deployment pipelines.

### Negative / Trade-offs
- Requires explicit data normalization in the platform layer before invoking intelligence routines.
- In-process contract serialization must be maintained between `backend/app/` and `backend/intelligence/`.
