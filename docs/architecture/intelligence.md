# AI Intelligence Architecture (`backend/intelligence`)

This document defines the architectural blueprint, boundaries, and operational principles of the **AI Intelligence Engine** for **Lunova**.

---

## 1. Conceptual End-to-End Pipeline

Lunova orchestrates proposal intelligence while enforcing a clear separation between **platform workflow management** and **AI reasoning**:

```
                  ┌──────────────────────────────┐
                  │      Inbound RFP Email       │
                  └──────────────┬───────────────┘
                                 │
                                 ▼
                  ┌──────────────────────────────┐
                  │    Platform Normalization    │  (Owned by Platform Backend)
                  └──────────────┬───────────────┘
                                 │
                                 ▼
                  ┌──────────────────────────────┐
                  │        Proposal Input        │  (Conceptual Boundary: contracts/)
                  └──────────────┬───────────────┘
                                 │
                                 ▼
                  ┌──────────────────────────────┐
                  │    AI Intelligence Engine    │  (Owned by Chinmay: backend/intelligence/)
                  │  ├── 1. Extraction          │  (Parse requirements & detect gaps)
                  │  ├── 2. Retrieval           │  (Tenant-scoped company knowledge search)
                  │  ├── 3. Generation          │  (Draft grounded responses & clarifications)
                  │  └── 4. Evaluation          │  (Grounding checks, confidence & warnings)
                  └──────────────┬───────────────┘
                                 │
                                 ▼
                  ┌──────────────────────────────┐
                  │      AI Analysis Result      │  (Conceptual Boundary: contracts/)
                  └──────────────┬───────────────┘
                                 │
                                 ▼
                  ┌──────────────────────────────┐
                  │       Platform Backend       │  (State machine, persistence & orchestration)
                  └──────────────┬───────────────┘
                                 │
                                 ▼
                  ┌──────────────────────────────┐
                  │         Human Review         │  (Mandatory reviewer UI: approve / edit / reject)
                  └──────────────┬───────────────┘
                                 │
                    [Approved / Edited by Human]
                                 │
                                 ▼
                  ┌──────────────────────────────┐
                  │        Email Response        │  (Outbound dispatch via email adapter)
                  └──────────────────────────────┘
```

### Core Architecture Philosophy
- **Platform owns workflow**: Ingestion, normalization, database persistence, state transitions, authentication, human review orchestration, and outbound email dispatch are managed by the platform (`backend/app/`).
- **Intelligence owns reasoning**: Requirement extraction, semantic knowledge search, prompt engineering, grounded response drafting, hallucination detection, and provider abstractions are managed by the intelligence module (`backend/intelligence/`).

---

## 2. Intelligence Pipeline Principle: Deterministic before Generative

The intelligence engine strictly follows the principle of **"Deterministic before Generative"**:

```
1. Normalize Input ➔ 2. Extract Facts/Requirements ➔ 3. Retrieve Evidence ➔ 4. Generate Response ➔ 5. Validate/Evaluate
```

### Why Deterministic Precedes Generative:
Rather than passing raw, unstructured email dumps directly into a large language model and asking for an immediate narrative response, the pipeline first extracts structured, verifiable facts:
1. **Scope Bounding**: Discrete requirements are extracted and categorized first so that retrieval queries target precise technical and commercial areas.
2. **Grounded Retrieval**: Context is pulled strictly from tenant-isolated company knowledge before prompting the generation model.
3. **Controllable Reasoning**: The generative step operates over bounded evidence, reducing hallucination risk.
4. **Independent Auditing**: The evaluation stage can systematically score faithfulness by comparing generated draft claims against retrieved source chunks and extracted requirements.

---

## 3. Modular Monolith Decision

The AI intelligence module is a code-level module boundary (`backend/intelligence/`) inside the **modular monolith**. It is **not** a separate microservice.

### Rationale:
- **Simpler Development**: Both platform workflows and intelligence reasoning share the same repository, Python runtime, and test execution environments.
- **Easier Debugging**: In-process stack traces, standard logging, and local mock testing require no distributed tracing or network interception.
- **Fewer Deployment Concerns**: Avoids orchestrating multiple container instances, network discovery, service meshes, or RPC serialization for the MVP.
- **Shared Access to Context**: The platform can pass normalized in-memory context objects directly to the intelligence service with zero network latency.
- **Avoids Premature Distributed-System Complexity**: Network partitions, distributed consensus, and RPC retries are avoided during early MVP validation.

---

## 4. AI Responsibilities & Non-Responsibilities

### What `backend/intelligence/` Owns
- **Proposal Understanding**: Parsing normalized proposal texts and pre-extracted attachment content.
- **Requirement Extraction**: Extracting discrete technical, commercial, security, and compliance requirements.
- **Missing Information Detection**: Identifying missing specifications, timelines, or client constraints.
- **Tenant-Scoped Retrieval**: Querying company knowledge strictly scoped to the tenant (`company_id`).
- **Context Construction**: Assembling relevant document chunks into structured prompts for reasoning.
- **Response Generation**: Drafting executive summaries, requirement-by-requirement answers, and email bodies.
- **Clarification Formulations**: Drafting targeted questions for ambiguous or unanswerable client requirements.
- **Grounding Verification**: Validating that generated statements are directly supported by retrieved sources.
- **Unsupported Claims Detection**: Identifying and suppressing unverified assertions.
- **Confidence Scoring**: Calculating overall confidence, grounding scores, and reviewer attention flags.
- **Operational AI Warnings**: Emitting actionable warnings when knowledge is thin or requirements conflict.
- **Provider Abstraction**: Decoupling the reasoning layer from specific LLM and embedding vendors via abstract interfaces.

### What `backend/intelligence/` Does NOT Own
- **Email Ingestion & Sending**: Gmail/IMAP API polling, webhook management, and outbound SMTP delivery.
- **Company CRUD**: Creation, update, and configuration of tenant entities.
- **Knowledge Document CRUD**: Upload endpoints, document storage, and lifecycle management of files.
- **Proposal Persistence**: Database ORM models, migrations, and proposal state transitions in PostgreSQL.
- **Human Approval Workflow**: Review assignment, approval/rejection recording, and reviewer attribution.
- **Authentication & Authorization**: User credentials, JWT validation, and RBAC policies.
- **Frontend UI**: Visual components, review screens, and citation badge styling.
- **Audit Persistence**: Storing immutable audit log records to disk/database.

---

## 5. The Conceptual AI Boundary

The communication boundary between the Platform and the Intelligence Engine is mediated through conceptual contracts. Detailed production JSON/Pydantic schemas are intentionally deferred until real Lunetron requirements are analyzed.

```
Platform Backend ──(Proposal Input)──► AI Intelligence ──(Analysis Result)──► Platform Backend
```

### Platform ➔ AI (`Proposal Input` Concept)
The platform provides a normalized payload:
- **Proposal Identity**: Unique proposal tracking identifier (`proposal_id`).
- **Company / Tenant Identity**: Target tenant identifier (`company_id`) and company metadata.
- **Normalized Email Content**: Sender, recipients, subject, normalized plain text/markdown body, and timestamps.
- **Thread Information**: Normalized conversation thread ID for multi-turn context.
- **Pre-extracted Attachments**: File metadata alongside cleaned, pre-extracted text content.
- **Proposal Metadata**: Priority flags, submission deadlines, or source mailbox context.
- **Access to Company Knowledge**: Scoped access mechanism to retrieve knowledge vectors for `company_id`.

### AI ➔ Platform (`Analysis Result` Concept)
The intelligence engine returns a structured result payload:
- **Analysis Status**: High-level execution status (`SUCCESS`, `PARTIAL`, `FAILED`).
- **Extracted Requirements**: Structured list of discrete client requirements with categories and priority.
- **Missing Information**: Missing items or gaps identified in the RFP specification.
- **Retrieved Knowledge / Sources**: Source citations (`source_id`, title, section reference, relevance score).
- **Generated Response**: Grounded draft text (executive summary, requirement answers, draft email body).
- **Clarification Questions**: Recommended questions to pose back to the client.
- **Confidence Information**: Overall confidence score, grounding score, and `requires_human_attention` flag.
- **AI Warnings**: Domain caveats, ambiguity alerts, or low-coverage notices.
- **Processing Metadata**: Processing duration in milliseconds and execution timestamps.

---

## 6. Tenant Isolation: Multi-Tenancy Boundary

A foundational architectural invariant for Lunova is strict multi-tenant isolation:

```
proposal.company_id ──► Retrieval Query ──► WHERE company_id = :target_company_id ──► ONLY That Company's Knowledge
```

1. **Every retrieval operation is tenant-scoped**: All semantic vector queries and keyword searches must be explicitly scoped by `company_id`.
2. **Zero cross-tenant leakage**: The AI engine must never retrieve, inspect, or synthesize knowledge belonging to any company other than the tenant identified in the proposal.
3. **No hardcoded company logic**: The AI engine must not use hardcoded company conditionals (e.g. `if company == "lunetron"`). Company identity is provided dynamically as contextual data.
4. **Mandatory validation**: Attempts to query knowledge without an explicit, non-empty `company_id` raise `MissingCompanyContextError`.

---

## 7. AI Quality & Anti-Hallucination Rule

To ensure enterprise trust, the intelligence engine enforces a strict anti-hallucination constraint:

> [!CAUTION]
> **The AI must NEVER invent undocumented company-specific claims.**
>
> The AI engine is strictly forbidden from fabricating:
> - Previous projects, client references, or case studies
> - Client names or customer logos
> - Technologies, architectures, or proprietary tooling
> - Certifications, compliance badges (SOC 2, ISO, HIPAA), or regulatory statuses
> - Pricing schedules, rate cards, or licensing models
> - Delivery timelines, milestones, or service-level agreements (SLAs)
> - Specialized company capabilities or past performance

### Operational Protocol for Missing Knowledge
When relevant company knowledge cannot be retrieved to answer a proposal requirement:
1. **Do not fabricate**: Never generate speculative or assumed capabilities.
2. **Flag the gap**: Record the exact gap in `missing_information`.
3. **Draft clarification / Escalate**: Formulate a targeted question or flag for human reviewer intervention (`requires_human_attention = true`).

---

## 8. Embedding Configuration

- **Current Planned Dimension**: `3072` (e.g. OpenAI `text-embedding-3-large`).
- **Configurable**: The embedding dimension is centrally defined in `backend/intelligence/config.py` (`DEFAULT_EMBEDDING_DIMENSION = 3072`) and can be overridden via `IntelligenceConfig`.
- **Pre-Production Alignment**: The configured dimension is currently 3072. Before production RAG and pgvector indexing, this value must match the output dimension of the selected embedding model.
- **No Early Migration**: No database migrations, pgvector column schemas, or vector index scripts are created in Phase 1.

---

## 9. Modular Structure (`backend/intelligence/`)

The intelligence package is decomposed into focused, cohesive modules:

```
backend/intelligence/
├── models/         # Normalized stage dataclasses (proposal, extraction, retrieval, generation, evaluation, result)
├── interfaces/     # Stage abstractions (Extractor, Retriever, Generator, Evaluator)
├── extraction/     # Proposal understanding & structured requirement extraction
├── retrieval/      # Tenant-scoped knowledge search & context preparation
├── generation/     # Grounded draft generation & clarification question synthesis
├── evaluation/     # Grounding verification, confidence scoring & warning detection
├── providers/      # Pluggable LLM & Embedding provider abstractions
├── prompts/        # Centralized, versioned prompt templates and roadmap
├── config.py       # Central configuration (embedding dimension, defaults)
├── constants.py    # Status enums, confidence levels, retrieval limits
├── exceptions.py   # Explicit domain exception hierarchy
├── logger.py       # Lightweight, privacy-preserving operational logger
└── service.py      # Decoupled IntelligenceService orchestrator
```

---

## 10. Future Extensibility & Provider Neutrality

The intelligence architecture is designed with clean seams for future evolution:
- **Email Ingestion Agnostic**: Consumes normalized inputs; does not depend on Gmail-specific headers or protocols.
- **Model Agnostic**: Uses abstract provider interfaces (`LLMProvider`, `EmbeddingProvider`) allowing drop-in replacement across OpenAI, Anthropic Claude, Google Gemini, or local models.
- **Storage Agnostic**: Decoupled from direct database transactions; retrieval interfaces accept tenant queries without coupling extraction or generation to PostgreSQL internals.
