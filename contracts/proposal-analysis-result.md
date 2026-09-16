# AI Output Contract: `ProposalAnalysisResult`

**Current Status**: Conceptual Draft  
**Version**: `1.0`  
**Boundary**: AI Intelligence Engine ➔ Platform Backend

---

## Overview

The `ProposalAnalysisResult` contract defines the structured, machine-readable output produced by the AI Intelligence Engine upon analyzing an incoming proposal.

### Key Principles

1. **Encapsulation of AI Internals**:
   The Platform Backend treats the AI Intelligence Engine as a black box. The platform does not need to know:
   - Which LLM provider or foundation model was called.
   - What chunking strategies or embedding dimensions were used.
   - What prompts or few-shot templates were executed.
   - How vector similarity was computed.
   The platform only consumes the structured result payload.

2. **Structured Machine-Readability**:
   The output is strictly structured (JSON) rather than free-form text. Extracted requirements, confidence scores, source attributions, and draft answers are parsed into distinct fields so the UI can render granular review widgets (e.g., source chips, confidence indicators, editable drafts).

3. **Grounded Attribution**:
   All answers in `generated_response` must correlate to entries in `retrieved_sources` to ensure auditability and human reviewer trust.

---

## Conceptual Structure

```
ProposalAnalysisResult
│
├── contract_version             # String: Contract schema version (e.g. "1.0")
├── proposal_id                  # String/UUID: Matching proposal ID from input
├── status                       # String: Processing status ("SUCCESS", "PARTIAL", "FAILED")
│
├── requirements                 # List of structured requirements extracted from RFP
│   └── [Requirement]
│       ├── requirement_id       # String: Identifier for this specific requirement
│       ├── category             # String: "TECHNICAL", "COMMERCIAL", "SECURITY", "COMPLIANCE", etc.
│       ├── description          # String: Clear summary of the client's requirement
│       └── priority             # String: "HIGH", "MEDIUM", "LOW"
│
├── missing_information          # List of items needed to complete the proposal but absent from RFP
│   └── [MissingItem]
│       ├── topic                # String: Area of missing detail
│       └── description          # String: Specific detail missing
│
├── retrieved_sources            # Citations from Lunetron's knowledge base used to ground the draft
│   └── [Source]
│       ├── source_id            # String: Document/chunk identifier
│       ├── title                # String: Document title
│       ├── section              # String: Specific section or page reference
│       └── relevance_score      # Float: Similarity/relevance metric (0.0 to 1.0)
│
├── generated_response           # AI drafted response ready for human review
│   ├── executive_summary        # String: High-level overview
│   ├── requirement_responses    # List: Specific responses mapped to requirement_id
│   └── draft_email_body         # String: Full formatted draft response email
│
├── clarification_questions      # List of questions to ask the client before finalizing
│   └── [Question]
│       ├── question_id          # String: Identifier
│       ├── question             # String: Clear question text
│       └── rationale            # String: Why this clarification is needed
│
├── confidence                   # Grounding and confidence metrics
│   ├── overall_score            # Float: Aggregate confidence (0.0 to 1.0)
│   ├── grounding_score          # Float: Faithfulness against retrieved sources
│   └── requires_human_attention # Boolean: Flag if confidence is below review threshold
│
├── warnings                     # List of operational or domain caveats
│   └── [String]
│
└── processing_metadata          # Telemetry and processing details
    ├── processed_at             # String: ISO-8601 UTC timestamp
    └── duration_ms              # Integer: Processing time in milliseconds
```

---

## Conceptual JSON Representation

```json
{
  "contract_version": "1.0",
  "proposal_id": "prop-550e8400-e29b-41d4-a716-446655440000",
  "status": "SUCCESS",
  "requirements": [
    {
      "requirement_id": "req-01",
      "category": "TECHNICAL",
      "description": "Integration with existing customer email systems via REST APIs",
      "priority": "HIGH"
    },
    {
      "requirement_id": "req-02",
      "category": "SECURITY",
      "description": "SOC 2 Type II compliance and role-based access control",
      "priority": "HIGH"
    }
  ],
  "missing_information": [
    {
      "topic": "Deployment Timeline",
      "description": "Target go-live quarter not specified in client RFP document"
    }
  ],
  "retrieved_sources": [
    {
      "source_id": "kb-doc-104",
      "title": "Lunetron Platform Architecture & API Specification",
      "section": "Section 3.2: REST Ingestion Endpoints",
      "relevance_score": 0.94
    },
    {
      "source_id": "kb-doc-208",
      "title": "Lunetron Security & Compliance Whitepaper",
      "section": "SOC 2 Type II Certification & Audit Scope",
      "relevance_score": 0.91
    }
  ],
  "generated_response": {
    "executive_summary": "Lunetron is pleased to submit our technical proposal for the Intelligent Automation Platform Integration...",
    "draft_email_body": "Dear Procurement Team,\n\nThank you for sharing the RFP. Lunetron fully supports your API integration and SOC 2 security requirements...",
    "requirement_responses": [
      {
        "requirement_id": "req-01",
        "response": "Lunetron provides robust REST APIs supporting OAuth2 authentication and bi-directional message parsing.",
        "grounded_in": ["kb-doc-104"]
      },
      {
        "requirement_id": "req-02",
        "response": "Lunetron maintains active SOC 2 Type II certification with strict RBAC enforcement across all service boundaries.",
        "grounded_in": ["kb-doc-208"]
      }
    ]
  },
  "clarification_questions": [
    {
      "question_id": "cq-01",
      "question": "What is the expected daily volume of incoming RFP emails?",
      "rationale": "Helps determine optimal rate limits and provisioned capacity"
    }
  ],
  "confidence": {
    "overall_score": 0.92,
    "grounding_score": 0.95,
    "requires_human_attention": false
  },
  "warnings": [],
  "processing_metadata": {
    "processed_at": "2026-09-16T10:31:15Z",
    "duration_ms": 2850
  }
}
```

---

## Next Steps for Finalization

1. Review actual proposal responses previously prepared by Lunetron to align field names, categories, and citation formats.
2. Formulate explicit Pydantic response models in `backend/` and TypeScript return types in `frontend/` following validation with sample data.
