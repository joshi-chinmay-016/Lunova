# AI Input Contract: `ProposalInput`

**Current Status**: Conceptual Draft  
**Version**: `1.0`  
**Boundary**: Platform Backend ➔ AI Intelligence Engine

---

## Overview

The `ProposalInput` contract defines the complete, normalized data structure that the Platform Backend provides to the AI Intelligence Engine when a proposal inquiry is ready for processing.

### Key Principles

1. **Provider Neutrality**:
   The AI engine must **NOT** depend on Gmail-specific structures, headers, or API tokens. All email data is normalized by the platform layer into a canonical representation before being packaged into `ProposalInput`.

2. **Strict Multi-Tenant Boundary (`company_id`)**:
   `company.company_id` constitutes the primary tenant boundary. The AI engine uses this identifier to enforce strict scoping during vector search and knowledge retrieval. Knowledge from one company must never be accessible or returned for another company.

3. **Pre-extracted Attachment Content**:
   The platform handles file downloads and raw text extraction from attachments (e.g., PDF, DOCX, XLSX). The AI engine receives pre-extracted text content alongside file metadata.

---

## Conceptual Structure

```
ProposalInput
│
├── contract_version             # String: Contract schema version (e.g. "1.0")
├── proposal_id                  # String/UUID: Unique identifier for the proposal record
│
├── company                      # Tenant identification context
│   ├── company_id               # String: Unique tenant identifier (MVP: "lunetron")
│   └── company_name             # String: Human-readable company name (MVP: "Lunetron")
│
├── email                        # Normalized email payload (provider-agnostic)
│   ├── message_id               # String: Normalized source email message ID
│   ├── thread_id                # String: Normalized thread ID for conversational grouping
│   ├── sender                   # String: Sender email address (and optional display name)
│   ├── recipients               # List[String]: Recipient email addresses
│   ├── subject                  # String: Cleaned email subject line
│   ├── body                     # String: Normalized plain text / markdown email body
│   └── received_at              # String: ISO-8601 UTC timestamp of message receipt
│
└── attachments                  # List of attached documents
    └── [Attachment]
        ├── attachment_id        # String/UUID: Unique attachment record ID
        ├── filename             # String: Original filename (e.g., "RFP_Specification.pdf")
        ├── mime_type            # String: MIME type (e.g., "application/pdf")
        └── extracted_content    # String: Cleaned text extracted from the document
```

---

## Conceptual JSON Representation

> [!NOTE]
> This is a conceptual representation for stubbing and parallel development, not a locked Pydantic or TypeScript schema.

```json
{
  "contract_version": "1.0",
  "proposal_id": "prop-550e8400-e29b-41d4-a716-446655440000",
  "company": {
    "company_id": "lunetron",
    "company_name": "Lunetron"
  },
  "email": {
    "message_id": "msg-18e4a9b2c3d4e5f6",
    "thread_id": "thread-18e4a9b2c3d4e5f6",
    "sender": "client.rfp@prospective-client.com",
    "recipients": ["proposals@lunetron.com"],
    "subject": "RFP Request: Intelligent Automation Platform Integration",
    "body": "Hello Lunetron Team,\n\nPlease find our RFP attached for the upcoming automation platform integration. Kindly review our requirements and provide your technical proposal by end of week.\n\nRegards,\nProcurement Team",
    "received_at": "2026-09-16T10:30:00Z"
  },
  "attachments": [
    {
      "attachment_id": "att-771a8230-b19c-49a2-9214-556677889900",
      "filename": "Platform_RFP_Specification.pdf",
      "mime_type": "application/pdf",
      "extracted_content": "Project Overview: Prospective Client is seeking an intelligent proposal response integration...\n\nKey Requirements:\n1. Seamless email parsing.\n2. Knowledge base retrieval with high precision.\n3. Human-in-the-loop review workflow before dispatch."
    }
  ]
}
```

---

## Next Steps for Finalization

1. Review actual RFP emails received by Lunetron to verify if additional fields (e.g., CC recipients, digital signatures, inline tables) are needed.
2. Formulate Pydantic schemas in `backend/` and TypeScript interfaces in `frontend/` conforming to this contract once sample data is verified.
