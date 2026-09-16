# Shared Error Contract (`errors.md`)

**Current Status**: Conceptual Draft  
**Version**: `1.0`  
**Scope**: Shared error taxonomy between Platform and AI Intelligence

---

## Overview

This document establishes a unified, shared error taxonomy across both the Platform Backend and AI Intelligence layers. It ensures that both developers and system components use consistent error codes and conceptual semantics.

> [!NOTE]
> Detailed exception classes, HTTP status mappings, and retry strategies are deferred. This document defines the shared vocabulary.

---

## Canonical Error Codes

| Error Code | Layer Origin | Description | Expected Workflow Action |
| :--- | :--- | :--- | :--- |
| `INPUT_INVALID` | Shared / Platform | The incoming payload fails schema validation or lacks critical data (e.g. empty email body and no attachments). | Mark proposal as `FAILED` with validation message; alert user. |
| `DOCUMENT_PROCESSING_FAILED` | Platform | Failed to parse or extract readable text from an attachment (e.g., corrupted PDF, unsupported format). | Flag attachment in proposal UI; allow human to inspect or upload text. |
| `NO_RELEVANT_KNOWLEDGE` | AI Intelligence | Knowledge retrieval query returned zero relevant documents matching the RFP requirements within company scope. | Mark proposal as `NEEDS_CLARIFICATION` or flag missing knowledge to reviewer. |
| `AI_GENERATION_FAILED` | AI Intelligence | Downstream LLM provider call timed out, failed rate limits, or refused to complete generation. | Record failure in proposal audit; offer retry button in review UI. |
| `LOW_CONFIDENCE` | AI Intelligence | AI generated a draft response, but grounding or confidence score fell below safety thresholds. | Set proposal state to `REVIEW_REQUIRED` with high-visibility warning badge. |
| `EMAIL_PROCESSING_FAILED` | Platform | Failure during email polling, message parsing, or normalization from the email adapter. | Log ingestion error; retry email poll safely without dropping message. |
| `EMAIL_SENDING_FAILED` | Platform | Human reviewer approved the response, but the email adapter failed to deliver the message. | Keep proposal in `APPROVED` state with delivery error; provide retry action. |
| `UNKNOWN_ERROR` | Shared | Unhandled runtime exception or unexpected boundary failure. | Log full stack trace with correlation ID for debugging. |

---

## Conceptual Error Response Shape

```json
{
  "contract_version": "1.0",
  "error_code": "LOW_CONFIDENCE",
  "message": "Generated proposal response grounding score (0.42) is below minimum threshold (0.75)",
  "proposal_id": "prop-550e8400-e29b-41d4-a716-446655440000",
  "details": {
    "grounding_score": 0.42,
    "threshold": 0.75,
    "unverified_claims": ["Proprietary hardware acceleration support"]
  },
  "timestamp": "2026-09-16T10:31:15Z"
}
```
