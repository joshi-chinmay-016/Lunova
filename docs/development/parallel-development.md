# Parallel Development Strategy

To allow Developer 1 (AI) and Developer 2 (Platform) to work simultaneously without blocking each other, we will use a **Mock-First Interface Strategy**.

## Interface Contracts (Pydantic)
Before writing application logic, both developers must agree on the data structures (contracts) that pass between the two modules. These will be defined as Pydantic models.

Example:
```python
class ProposalRequest(BaseModel):
    proposal_id: UUID
    company_id: UUID
    raw_text: str
    attachments: List[AttachmentContext]

class AIProposalResponse(BaseModel):
    generated_draft: str
    extracted_requirements: List[str]
    sources_used: List[DocumentCitation]
    confidence_score: float
```

## Developer 1: AI / Intelligence
Developer 1 will build the RAG pipeline, prompts, and LLM integrations.

**Workflow:**
1. Developer 1 creates a mock script that feeds a fake `ProposalRequest` into their AI service.
2. The AI service performs actual vector searches and LLM calls.
3. Developer 1 validates that the service outputs a valid `AIProposalResponse`.

```text
Developer 1 Workflow:
[Mock Platform Input] --> [AI Module (Real)] --> [Console Output / Tests]
```

## Developer 2: Platform / Workflow
Developer 2 will build the database, email listeners, Next.js frontend, and state machine.

**Workflow:**
1. Developer 2 creates a Mock AI Service.
2. When the Platform triggers processing, the Mock AI Service simply `await asyncio.sleep(2)` and returns a hardcoded `AIProposalResponse`.
3. Developer 2 uses this mock response to build the Review UI, state transitions, and email sending logic.

```text
Developer 2 Workflow:
[Real Email Ingestion] --> [Mock AI Module] --> [Real Review UI & DB]
```

## Integration
Once both developers complete their modules, the Mock AI Service in the Platform is swapped out for the real AI Service function call. Because both adhered to the agreed-upon Pydantic models, integration should be seamless.

## Repository & Module Ownership

To minimize Git merge conflicts, the FastAPI backend will be structured to isolate codebases:

```text
backend/
├── app/
│   ├── platform/       <-- Owned by Developer 2
│   │   ├── email/
│   │   ├── proposals/
│   │   ├── companies/
│   │   └── api/
│   │
│   ├── ai/             <-- Owned by Developer 1
│   │   ├── extraction/
│   │   ├── rag/
│   │   ├── generation/
│   │   └── api/
│   │
│   └── shared/         <-- Jointly Owned (requires review from both)
│       ├── models/     (SQLAlchemy models)
│       └── schemas/    (Pydantic contracts)
```

**Rule:** Developer 1 should not touch files in `app/platform/`, and Developer 2 should not touch files in `app/ai/`. Changes to `app/shared/` must be communicated.
