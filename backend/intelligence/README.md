# AI Proposal Intelligence Engine (`backend/intelligence`)

**Owner**: Chinmay

This module houses the AI-powered proposal understanding and response generation engine for Lunova.

---

## Current Status: Phase 2 — Gemini-Powered Proposal Understanding & Requirement Extraction

Phase 2 establishes real proposal understanding and structured requirement extraction powered by Google Gemini (via the modern `google-genai` SDK), while maintaining full provider neutrality, offline testability, strict anti-hallucination guarantees, and clean integration contracts for platform development.

### Module Structure

```
backend/intelligence/
├── models/         # Normalized models (ProposalContext, ExtractedRequirement, MissingInformation, Ambiguity, ExtractionResult, etc.)
├── interfaces/     # Stage abstractions (Extractor, Retriever, Generator, Evaluator)
├── extraction/     # Proposal understanding & requirement extraction (RequirementExtractor)
├── retrieval/      # Tenant-scoped company knowledge retrieval (pgvector placeholder)
├── generation/     # Grounded proposal responses & clarification questions
├── evaluation/     # Grounding evaluation, confidence scoring & warnings
├── providers/      # Pluggable LLM & embedding providers (GeminiProvider, MockLLMProvider, etc.)
├── prompts/        # Centralized versioned prompts (extraction_v1, versions.md)
├── config.py       # Central module configuration (Gemini settings, safety bounds, embedding dimension)
├── constants.py    # Requirement categories, priorities, importance levels, status enums
├── exceptions.py   # Domain-specific intelligence exception hierarchy
├── logger.py       # Non-sensitive operational logging utility
└── service.py      # IntelligenceService orchestrating stages via dependency injection
```

---

## Provider Architecture & Gemini Integration

The intelligence layer interacts with LLMs exclusively through the abstract `LLMProvider` protocol:

```
RequirementExtractor
        ↓
    LLMProvider (Protocol)
     ├── GeminiProvider   (Uses google-genai SDK, schema-constrained output)
     └── MockLLMProvider  (Deterministic, offline, simulated errors/payloads)
```

- **SDK**: Uses the official `google-genai` Python SDK (`from google import genai`).
- **Structured Outputs**: Leverages native schema-constrained JSON generation via `types.GenerateContentConfig(response_schema=ProposalExtractionPayload)`.
- **Secret Protection**: API keys are loaded via environment (`GEMINI_API_KEY`) and are never written to source code, logged, printed in test outputs, or exposed in exceptions.
- **Provider Independence**: Extraction business logic in `backend/intelligence/extraction/` has zero dependency on the Gemini SDK.

---

## Environment Configuration

Configure options via environment variables or a local `.env` file (copied from `.env.example`):

| Variable | Default | Description |
| :--- | :--- | :--- |
| `LLM_PROVIDER` | `mock` | Active LLM provider (`gemini` or `mock`) |
| `GEMINI_API_KEY` | `None` | Google Gemini API key (kept strictly private) |
| `GEMINI_MODEL` | `gemini-2.5-flash` | Gemini model name for extraction |
| `MAX_PROPOSAL_INPUT_CHARS` | `50000` | Input safety limit to prevent uncontrolled token usage |
| `RUN_LIVE_LLM_TESTS` | `0` | Set to `1` to run opt-in live Gemini integration tests |

---

## Extraction Domain Schema

Extracted requirements are validated using Pydantic models:

- **`ExtractedRequirement`**:
  - `requirement_id`: e.g. `req-01`
  - `text`: Cleaned requirement specification
  - `category`: Canonical category (`functional_requirement`, `technical_requirement`, `security`, `integration`, `compliance`, `deliverable`, `timeline`, `budget`, etc.)
  - `priority`: `high`, `medium`, or `low`
  - `explicit`: `True` if explicitly requested; `False` if logically inferred
  - `evidence`: Verbatim quote from proposal text
  - `confidence`: Confidence score (0.0 to 1.0)
- **`MissingInformation`**:
  - `field`: Missing parameter (e.g. `budget`, `timeline`, `submission_deadline`)
  - `reason`: Rationale why this information is needed
  - `importance`: `high`, `medium`, or `low`
- **`Ambiguity`**:
  - `text`: Ambiguous phrasing (e.g. "deploy quickly")
  - `reason`: Why the phrase is ambiguous without manufacturing numbers

---

## Synthetic Proposal Fixtures

Fixtures located in `fixtures/proposals/` provide realistic scenarios for testing:

1. `simple_rfp.json`: Web app for 100 internal users, authentication, dashboard, reporting, 12 weeks.
2. `technical_rfp.json`: REST APIs, PostgreSQL, AWS/K8s, OAuth2, Salesforce/SAP integration, RBAC.
3. `ambiguous_rfp.json`: Vague delivery timeline ("quickly") and capacity ("highly scalable"). Tests anti-hallucination.
4. `incomplete_rfp.json`: Broad request without budget, timeline, users, or integrations. Tests gap detection.
5. `multi_requirement_rfp.json`: Comprehensive RFP covering 12 distinct requirements across all categories.

---

## Testing Strategy

All standard unit tests run completely offline without API keys or network access:

```powershell
# Run full intelligence test suite offline:
pytest backend/tests/intelligence -v
```

### Optional Live Gemini Smoke Test

If a real `GEMINI_API_KEY` is configured locally:

```powershell
python scripts/smoke_test_gemini_extraction.py
```

The script prints safe extraction telemetry (counts and requirement descriptions) while redacting credentials.

---

## Anti-Hallucination & Quality Rules

> [!CAUTION]
> **Anti-Hallucination Invariants**:
> 1. The extractor uses **ONLY** the provided proposal text.
> 2. The AI must **NEVER** fabricate vendor claims, certifications, past clients, pricing, or team capacity.
> 3. Numbers and timelines must never be invented from vague language (e.g., "fast" must NOT become "2 days").
> 4. Inferred requirements must be flagged as `explicit = false`.
> 5. Verbatim evidence must be preserved for all extracted requirements.

---

## Intentionally Unimplemented Components (Deferred to Future Phases)

The following components are strictly out of scope for Phase 2:
- **RAG & Knowledge Retrieval**: Deferred to Phase 3.
- **Embeddings & Vector Chunking**: Deferred to Phase 3 (Gemini embedding model and dimensions will be verified then).
- **pgvector Tables & Migrations**: Deferred to Phase 3.
- **Response Generation**: Deferred to Phase 4.
- **Email Delivery / Ingestion (Gmail/SMTP)**: Owned by Platform (`backend/app/`).
- **Background Workers / Distributed Queues (Celery/Redis/Kafka)**: Deferred to scaling phase.
- **Human Review UI**: Owned by Platform/Frontend (`frontend/`).
