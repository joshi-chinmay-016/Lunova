# Proposal Lifecycle Architecture

This document specifies the conceptual lifecycle states and state transitions for proposals in **Lunova**.

---

## 1. Happy-Path State Machine

```
      [Inbound Email]
             │
             ▼
        ┌──────────┐
        │ RECEIVED │
        └────┬─────┘
             │ Email parsed & proposal record created
             ▼
       ┌────────────┐
       │ PROCESSING │
       └─────┬──────┘
             │ AI requirement extraction completed
             ▼
        ┌──────────┐
        │ ANALYZED │
        └────┬─────┘
             │ RAG retrieval & draft generation completed
             ▼
  ┌────────────────────┐
  │ RESPONSE_GENERATED │
  └──────────┬─────────┘
             │ Enters human review queue
             ▼
   ┌─────────────────┐
   │ REVIEW_REQUIRED │
   └─────────┬───────┘
             │
   ┌─────────┼──────────────┐
   ▼         ▼              ▼
┌──────────┐ ┌────────┐ ┌──────────┐
│ APPROVED │ │ EDITED │ │ REJECTED │
└────┬─────┘ └───┬────┘ └────┬─────┘
     │           │           │
     └─────┬─────┘           │
           │ Sent via email   │ Dropped/archived
           ▼                 ▼
       ┌──────┐          ┌────────┐
       │ SENT │          │ CLOSED │
       └───┬──┘          └────────┘
           │ Lifecycle finalized
           ▼
       ┌────────┐
       │ CLOSED │
       └────────┘
```

---

## 2. State Descriptions

| State | Trigger / Definition |
| :--- | :--- |
| **`RECEIVED`** | Normalized email has been ingested and a proposal record created in the database. |
| **`PROCESSING`** | The proposal payload has been handed off to the AI Intelligence Engine for extraction. |
| **`ANALYZED`** | Requirements have been identified, categorized, and structured. |
| **`RESPONSE_GENERATED`** | Knowledge retrieval is complete, citations attached, and draft response formulated. |
| **`REVIEW_REQUIRED`** | Response draft is ready for human verification in the review interface. |
| **`APPROVED`** | Human reviewer verified the draft without text modifications. |
| **`EDITED`** | Human reviewer modified the draft response or requirement mappings prior to approval. |
| **`REJECTED`** | Human reviewer determined the proposal should not be responded to. |
| **`SENT`** | The approved/edited email response has been successfully dispatched via the email adapter. |
| **`CLOSED`** | The proposal cycle is finished, and records are frozen in the audit log. |

---

## 3. Exception and Review-Triggering States

| State | Cause | Recovery / Human Action |
| :--- | :--- | :--- |
| **`FAILED`** | Unrecoverable error in ingestion, parsing, or AI processing. | Reviewer is alerted with the error code; manual retry or file upload is permitted. |
| **`NEEDS_CLARIFICATION`** | AI identified major gaps in the incoming RFP requirements. | Reviewer can inspect generated clarification questions and email the client. |
| **`LOW_CONFIDENCE`** | The draft response scored below grounding or confidence thresholds. | Proposal is flagged with a prominent warning badge in `REVIEW_REQUIRED` queue. |

> [!NOTE]
> Implementation of the formal database state machine, transition guards, and audit triggers will be developed in `backend/app/domain/proposal/`.
