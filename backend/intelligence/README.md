# AI Proposal Intelligence Engine (`backend/intelligence`)

**Owner**: Chinmay

This module houses the AI-powered proposal understanding and response generation engine for Lunova.

---

## Current Status: Phase 1 (Foundation Refinement Complete)

The intelligence foundation establishes package structure, internal interfaces, decoupled pipeline orchestration, domain exception taxonomy, and pluggable provider abstractions.

### Module Structure

```
backend/intelligence/
├── models/         # Normalized internal models (ProposalContext, ExtractedRequirement, RetrievedSource, GeneratedDraft, ConfidenceMetrics, IntelligenceResult)
├── interfaces/     # Stage abstractions (Extractor, Retriever, Generator, Evaluator)
├── extraction/     # Proposal understanding & requirement extraction
├── retrieval/      # Tenant-scoped company knowledge retrieval (pgvector)
├── generation/     # Grounded proposal responses & clarification questions
├── evaluation/     # Grounding evaluation, confidence scoring & warnings
├── providers/      # Pluggable LLM & embedding provider abstractions
├── prompts/        # Centralized versioned prompts and roadmap
├── config.py       # Central module configuration (configurable embedding dimension)
├── constants.py    # Enums for statuses, priorities, confidence thresholds
├── exceptions.py   # Domain-specific intelligence exception hierarchy
├── logger.py       # Non-sensitive operational logging utility
└── service.py      # IntelligenceService orchestrating stages via dependency injection
```

---

## Embedding Vector Configuration

- **Configured Default**: `3072` dimensions (defined centrally in `backend/intelligence/config.py`).
- **Configurable**: The embedding dimension can be overridden at runtime via `IntelligenceConfig`.
- **Pre-Production Notice**: The configured dimension is currently 3072. Before production RAG/vector indexing, this value must match the output dimension of the selected embedding model.
- **Status**: No production embedding integration or pgvector database table exists yet.

---

## Ownership & Boundaries

### What `backend/intelligence/` Owns
- Proposal understanding & requirement extraction
- Tenant-scoped knowledge retrieval
- Grounded draft and clarification question generation
- Grounding verification & confidence scoring
- Provider abstractions (`LLMProvider`, `EmbeddingProvider`)
- Prompt version management

### What `backend/intelligence/` Does NOT Own
- Email ingestion or delivery (Gmail API / SMTP)
- Company CRUD and tenant management
- Knowledge document file uploads and storage CRUD
- Proposal database persistence & lifecycle state transitions in PostgreSQL
- Human approval workflows and audit trail persistence
- Authentication & authorization
- Frontend UI components

---

## Important AI Safety & Quality Rules

> [!CAUTION]
> **The AI must NOT invent company claims**:
> The AI engine must never fabricate or invent:
> - Company experience
> - Previous projects
> - Client names
> - Technologies or proprietary stacks
> - Pricing models or rate cards
> - Delivery timelines
> - Certifications or regulatory badges
> - Capabilities or case studies
> - Any other company-specific claims
>
> All statements must be directly supported by the company's retrieved knowledge base or the explicitly provided proposal context. If relevant knowledge cannot be found:
> 1. Do **not** fabricate.
> 2. Flag the missing information in `missing_information`.
> 3. Request clarification or flag for human reviewer attention (`requires_human_attention = true`).

---

## How to Run Unit Tests

All intelligence unit tests run completely standalone without requiring database connections, Redis, or external LLM API keys:

```bash
# From repository root:
pytest backend/tests/intelligence/ -v

# Or from backend/:
pytest tests/intelligence/ -v
```
