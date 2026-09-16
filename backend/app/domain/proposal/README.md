# Proposal Domain (`backend/app/domain/proposal`)

**Owner**: Lokesh

## Purpose & Responsibilities

- Proposal core aggregate, persistence models, and database repositories.
- Proposal/thread relationships linking incoming email threads to proposals.
- Proposal lifecycle state machine.

### Conceptual Lifecycle

```
RECEIVED
  ↓
PROCESSING
  ↓
ANALYZED
  ↓
RESPONSE_GENERATED
  ↓
REVIEW_REQUIRED
  ↓
APPROVED / EDITED / REJECTED
  ↓
SENT
  ↓
CLOSED
```

### Potential Attention / Failure States

- `FAILED`: Processing or system failure.
- `NEEDS_CLARIFICATION`: Insufficient details in RFP.
- `LOW_CONFIDENCE`: Grounding score below threshold.
