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
    attachments: List[ParsedAttachment] = field(default_factory=list) # Rich parsed attachments (PDF, DOCX, TXT)
    attachments_text: List[str] = field(default_factory=list)  # Backwards-compatible raw text list
    metadata: Dict[str, Any] = field(default_factory=dict)     # Platform telemetry, sender info, timestamps
```

### Attachment Parser Interface (`intelligence.AttachmentParser`)

The platform layer can parse raw attachment file bytes directly before context creation:

```python
from intelligence import AttachmentParser, DocumentParseStatus, ParsedAttachment

parser = AttachmentParser(max_file_size_bytes=10 * 1024 * 1024)
parsed_doc = parser.parse(file_bytes=b"...", filename="rfp.pdf", content_type="application/pdf")

if parsed_doc.status == DocumentParseStatus.SUCCESS:
    parsed_att = ParsedAttachment(
        filename=parsed_doc.filename,
        content_type=parsed_doc.content_type,
        extracted_text=parsed_doc.text,
        status=parsed_doc.status.value,
        page_count=parsed_doc.page_count,
        metadata=parsed_doc.metadata,
    )
```

### Invariants for Platform Ingestion
1. **`company_id` is strictly mandatory**: The platform must supply a non-empty `company_id`. Missing or blank `company_id` raises `MissingCompanyContextError`.
2. **`proposal_id` is mandatory**: Missing or blank `proposal_id` raises `InvalidProposalError`.
3. **Payload size bound**: The sum of characters across `subject`, `body`, and `attachments_text` must not exceed `MAX_PROPOSAL_INPUT_CHARS` (default: 50,000 characters). Exceeding this limit raises `InvalidProposalError`.
4. **Bidirectional sync**: Populating `attachments` automatically populates `attachments_text`, and vice versa.

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

---

## 3. Consolidated Pipeline Output: `IntelligenceResult`

When invoking `IntelligenceService.analyze_proposal(context)`, the returned object is `IntelligenceResult`:

```python
class IntelligenceResult(BaseModel):
    proposal_id: str
    company_id: str
    status: str                                  # SUCCESS, PARTIAL, FAILED, INSUFFICIENT_EVIDENCE, CLARIFICATION_NEEDED, REVIEW_REQUIRED
    requirements: List[ExtractedRequirement]
    missing_information: List[Dict[str, Any]]
    retrieved_sources: List[RetrievedSource]     # Strictly company-isolated evidence chunks
    generated_response: Optional[GeneratedDraft] # Structured draft with draft_email_body, citations, etc.
    clarification_questions: List[Dict[str, Any]]# Ambiguities and actionable clarifying questions
    unsupported_claims: List[Dict[str, Any]]     # Claims/requirements lacking company evidence
    validation_findings: List[Dict[str, Any]]    # Evaluator findings (e.g. fabricated price detected)
    confidence: ConfidenceMetrics                # overall_score, grounding_score, requires_human_attention
    warnings: List[str]
    processing_metadata: Dict[str, Any]
```

### Generated Draft Details (`intelligence.GeneratedDraft`)

```python
class GeneratedDraft(BaseModel):
    draft_email_body: str                        # Full generated email response text
    subject_line: Optional[str] = None           # Recommended email subject (e.g. "Re: RFP - ...")
    requirement_responses: List[Dict[str, Any]]  # Per-requirement grounding and citations
    clarification_questions: List[Dict[str, Any]]
    unsupported_claims: List[Dict[str, Any]]
    evidence_citations: List[str]                # Document IDs cited as evidence
    metadata: Dict[str, Any]
```

---

## 4. Key Takeaways for Platform Development (Lokesh)

1. **Direct In-Memory Consumption**: Lokesh's platform code can simply call:
   ```python
   from intelligence import IntelligenceService, ProposalContext

   service = IntelligenceService()  # Uses configured provider (Gemini in prod, Mock in tests)
   result = service.analyze_proposal(context)
   ```
2. **Draft Email Persistence**: In `ProposalService`:
   - Set email body: `result.generated_response.draft_email_body if result.generated_response else ""`
   - Set email subject: `result.generated_response.subject_line or f"Re: {subject}"`
3. **Database Persistence**: Platform models can serialize `result.requirements`, `result.retrieved_sources`, `result.unsupported_claims`, and `result.validation_findings` directly into PostgreSQL JSONB columns.
4. **pgvector Dimension Alignment**: The database vector column and embedding configuration are standardized to `Vector(768)` (Alembic migration `004_align_vector_dimension_768.py`).
5. **Strict Tenant Isolation**: `KnowledgeRetriever` automatically filters and isolates chunks by `company_id`. No cross-tenant data can ever be retrieved.
6. **Mandatory Human Review**: If `result.confidence.requires_human_attention` is `True` or `result.status == "REVIEW_REQUIRED"`, the platform blocks automated sending and awaits user approval.

