# Intelligence Module Boundary Contract (`contracts/intelligence-boundary.md`)

This contract defines the integration interface between **Platform Backend** (`backend/app/`, owned by Lokesh) and the **AI Intelligence Engine** (`backend/intelligence/`, owned by Chinmay).

> [!IMPORTANT]
> The intelligence module operates as an independent, decoupled reasoning engine inside the modular monolith. It consumes normalized inputs and produces serializable results without coupling to SQLAlchemy ORM models, FastAPI route handlers, Gmail SDK objects, or frontend DTOs.

---

## 1. Input Contract: `ProposalContext`

The platform normalizes raw inbound data (email messages, webhooks, or attachment files) into a pure, in-memory `ProposalContext` object before calling the intelligence engine.

### Python Definition (`intelligence.ProposalContext`)

```python
@dataclass
class ProposalContext:
    proposal_id: str                          # Unique proposal tracking identifier (e.g. UUID or 'prop-001')
    company_id: str                           # Mandatory tenant identifier for data isolation (e.g. 'lunetron')
    subject: str                              # Normalized email/proposal subject line
    body: str                                 # Cleaned, normalized proposal text body
    attachments_text: List[str] = field(default_factory=list)  # Pre-extracted text from RFP PDFs/docs
    metadata: Dict[str, Any] = field(default_factory=dict)     # Platform telemetry, sender info, timestamps
```

### Invariants for Platform Ingestion
1. **`company_id` is strictly mandatory**: The platform must supply a non-empty `company_id`. Missing or blank `company_id` raises `MissingCompanyContextError`.
2. **`proposal_id` is mandatory**: Missing or blank `proposal_id` raises `InvalidProposalError`.
3. **Payload size bound**: The sum of characters across `subject`, `body`, and `attachments_text` must not exceed `MAX_PROPOSAL_INPUT_CHARS` (default: 50,000 characters). Exceeding this limit raises `InvalidProposalError`.
4. **Pre-extracted attachments**: Attachment parsing (PDF/Word/Excel extraction) is executed by the platform before passing text into `attachments_text`.

---

## 2. Output Contract: `ExtractionResult`

The extraction pipeline extracts structured requirements, detects missing RFP specifications, and flags ambiguous statements using schema-constrained generation validated via Pydantic.

### Python Definition (`intelligence.ExtractionResult`)

```python
class ExtractedRequirement(BaseModel):
    requirement_id: str      # Deterministic ID (e.g. 'req-01')
    text: str                # Standardized requirement statement
    category: str            # One of: functional_requirement, technical_requirement, business_requirement,
                             # deliverable, timeline, budget, compliance, security, integration, support,
                             # team_requirement, qualification, other
    priority: str            # 'high', 'medium', 'low'
    explicit: bool           # True if explicitly requested; False if inferred
    evidence: str            # Verbatim quotation from proposal text
    confidence: float        # Confidence score (0.0 - 1.0)
    description: Optional[str] = None # Backwards-compatible alias for text

class MissingInformation(BaseModel):
    field: str               # Missing parameter (e.g. 'submission_deadline', 'budget', 'timeline')
    reason: str              # Explanation of why this parameter is missing and needed
    importance: str          # 'high', 'medium', 'low'

class Ambiguity(BaseModel):
    text: str                # Vague phrasing (e.g. "deploy quickly")
    reason: str              # Why this is ambiguous and what clarification is needed

class ExtractionResult(BaseModel):
    proposal_id: str
    requirements: List[ExtractedRequirement]
    missing_information: List[MissingInformation]
    ambiguities: List[Ambiguity]
    raw_summary: Optional[str] = None
    metadata: Dict[str, Any]
```

### JSON Serialization Example

```json
{
  "proposal_id": "prop-simple-001",
  "requirements": [
    {
      "requirement_id": "req-01",
      "text": "The solution must provide secure user authentication and an administrative dashboard.",
      "category": "functional_requirement",
      "priority": "high",
      "explicit": true,
      "evidence": "It should include secure user authentication, an administrative dashboard...",
      "confidence": 0.98
    }
  ],
  "missing_information": [
    {
      "field": "budget",
      "reason": "No allocated project budget or pricing expectations were provided.",
      "importance": "high"
    }
  ],
  "ambiguities": [
    {
      "text": "Automated reporting",
      "reason": "Frequency, data sources, and delivery format of reports are not specified."
    }
  ],
  "raw_summary": "Inbound RFP for internal operations web application for 100 users.",
  "metadata": {
    "provider": "gemini",
    "model": "gemini-2.5-flash",
    "requirement_count": 1,
    "missing_info_count": 1,
    "ambiguity_count": 1
  }
}
```

---

## 3. Consolidated Pipeline Output: `IntelligenceResult`

When invoking the full `IntelligenceService.analyze_proposal(context)`, the returned object is `IntelligenceResult`.

In **Phase 2**:
- `requirements`: Real extracted requirements (`List[ExtractedRequirement]`).
- `missing_information`: Real detected missing information items (`List[Dict[str, str]]`).
- `clarification_questions`: Real ambiguous statements needing review (`List[Dict[str, str]]`).
- `retrieved_sources`: Mocked/stubbed (Phase 3 will implement real tenant-scoped RAG).
- `generated_response`: Mocked/stubbed (Phase 4 will implement real response generation).
- `confidence`: Mocked/stubbed (Phase 4 will evaluate grounding score).
- `status`: `"SUCCESS"`, `"PARTIAL"`, or `"FAILED"`.

---

## 4. Key Takeaways for Platform Development (Lokesh)

1. **Direct In-Memory Consumption**: Lokesh's platform code can simply call:
   ```python
   from intelligence import IntelligenceService, ProposalContext

   service = IntelligenceService()  # Uses configured provider (Gemini in prod, Mock in tests)
   result = service.analyze_proposal(context)
   ```
2. **Database Persistence**: Platform models can serialize `result.requirements`, `result.missing_information`, and `result.clarification_questions` directly into PostgreSQL JSONB columns.
3. **No Gemini SDK Leakage**: Platform code does NOT need to import `google-genai` or manage LLM prompt templates.
4. **Mandatory Human Review**: Extraction outputs are designed to be presented to human reviewers on the frontend before any downstream action is finalized.
