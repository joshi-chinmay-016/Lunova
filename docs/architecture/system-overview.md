# System Overview Architecture

This document describes the high-level system architecture of **Lunova**, detailing both the initial MVP pipeline tailored for Lunetron and the strategic roadmap for future multi-company expansion.

---

## 1. MVP Architecture Pipeline

The MVP focuses on automating proposal drafting from incoming emails for **Lunetron** with mandatory human oversight:

```
                  ┌──────────────────────────────┐
                  │    Incoming RFP Email        │
                  │   (Lunetron Test Inbox)      │
                  └──────────────┬───────────────┘
                                 │
                                 ▼
                  ┌──────────────────────────────┐
                  │       Email Ingestion        │  (Gmail Normalized Adapter)
                  └──────────────┬───────────────┘
                                 │
                                 ▼
                  ┌──────────────────────────────┐
                  │     Proposal Management      │  (Create Proposal Record, State: RECEIVED)
                  └──────────────┬───────────────┘
                                 │
                                 ▼
                  ┌──────────────────────────────┐
                  │     Requirement Analysis     │  (Extract & Structure Requirements)
                  └──────────────┬───────────────┘
                                 │
                                 ▼
                  ┌──────────────────────────────┐
                  │ Lunetron Knowledge Retrieval │  (Vector Search scoped to Lunetron)
                  └──────────────┬───────────────┘
                                 │
                                 ▼
                  ┌──────────────────────────────┐
                  │     Response Generation      │  (Draft Proposal & Clarifications)
                  └──────────────┬───────────────┘
                                 │
                                 ▼
                  ┌──────────────────────────────┐
                  │    Grounding / Confidence    │  (Faithfulness Check & Quality Score)
                  └──────────────┬───────────────┘
                                 │
                                 ▼
                  ┌──────────────────────────────┐
                  │         Human Review         │  (UI for Review, Edit, or Reject)
                  └──────────────┬───────────────┘
                                 │
                   [Approved / Edited by Human]
                                 │
                                 ▼
                  ┌──────────────────────────────┐
                  │        Email Response        │  (Send Response Email to Client)
                  └──────────────┬───────────────┘
                                 │
                                 ▼
                  ┌──────────────────────────────┐
                  │       Audit / History        │  (Log Complete Trace for Compliance)
                  └──────────────────────────────┘
```

---

## 2. Stage Breakdown

1. **Email Ingestion**: Polling or receiving notifications from the development test email inbox. The raw email is normalized into standard fields (sender, subject, body, received timestamp).
2. **Proposal Management**: The platform creates a new proposal entity tracked in PostgreSQL with unique `proposal_id` and initial state `RECEIVED`.
3. **Requirement Analysis**: The AI engine parses email content and extracted attachment text to identify discrete technical, commercial, and compliance requirements.
4. **Lunetron Knowledge Retrieval**: Using semantic similarity in `pgvector` scoped strictly to Lunetron's documents, relevant product sheets, whitepapers, and past proposals are retrieved.
5. **Response Generation**: The AI constructs a cohesive proposal response, addressing each requirement with cited knowledge.
6. **Grounding & Confidence Scoring**: The AI evaluates the draft response against retrieved sources to detect hallucination risks, computing grounding and confidence metrics.
7. **Human Review**: The platform transitions the proposal to `REVIEW_REQUIRED`. A team member reviews extracted requirements, citations, and draft text. Reviewers can approve, edit, or reject the response.
8. **Email Response**: Upon approval, the platform dispatches the final response via the email adapter back to the client sender.
9. **Audit / History**: Every lifecycle step, AI confidence score, human edit, and outbound message is saved to an immutable audit log.

---

## 3. Comparison: MVP vs. Future Scope

| Dimension | MVP Implementation | Future Target |
| :--- | :--- | :--- |
| **Tenant** | Exclusively **Lunetron** (`company_id = "lunetron"`) | Multi-tenant with self-service company onboarding |
| **Knowledge Base** | Pre-loaded Lunetron internal documents | Dedicated tenant-isolated document management |
| **Input Channel** | Email only (development inbox) | Multi-channel: Email, Web Portals, Vendor RFPs, APIs |
| **Email Accounts** | Dedicated dev/test email account | Configurable tenant email credentials / OAuth |
| **Deployment Mode** | Modular Monolith (Docker Compose) | Modular Monolith / Cloud Container Services |
| **Execution** | Synchronous / In-process background tasks | Distributed job queue (Celery/Redis) if load demands |
| **Human Review** | Mandatory for 100% of proposals | Configurable auto-dispatch based on confidence score |
