# Parallel Development Strategy

This document describes the mock-driven parallel development strategy that allows **Chinmay** and **Lokesh** to build and test their components simultaneously without blocking each other.

---

## 1. The Decoupled Development Workflow

In a traditional sequential workflow, the platform developer waits for the AI engine, or the AI developer waits for the real email ingestion pipeline to produce real data. 

In Lunova, **contracts and mock fixtures** break this dependency:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        PARALLEL PHASE (UNBLOCKED)                       │
├────────────────────────────────────┬────────────────────────────────────┤
│         CHINMAY'S STREAM           │          LOKESH'S STREAM           │
│                                    │                                    │
│   Mock Platform Input              │   Real Email / Test Trigger        │
│   (fixtures/proposals/)            │          │                         │
│          │                         │          ▼                         │
│          ▼                         │   Platform Ingestion Pipeline      │
│   AI Intelligence Engine           │          │                         │
│   (Extraction, RAG, Generation)    │          ▼                         │
│          │                         │   Mock AI Analysis Result          │
│          ▼                         │   (fixtures/ai-results/)           │
│   Mock AI Result Validation        │          │                         │
│   (Evaluation & Grounding Tests)   │          ▼                         │
│                                    │   Human Review UI & Workflow       │
│                                    │   (Approve / Edit / Send Email)    │
└────────────────────────────────────┴────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          INTEGRATION PHASE                              │
│                                                                         │
│   Real Platform Ingestion  ──►  ProposalInput  ──►  Real AI Engine      │
│                                                            │            │
│   Human Review Workflow    ◄──  ProposalAnalysisResult ◄───┘            │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Chinmay's Independent Execution

Chinmay develops the extraction, retrieval, and response pipeline using static JSON payloads stored in `fixtures/proposals/sample-proposal-input.json`.

- Does **not** require a running email server or Gmail API credentials.
- Can run prompt evaluation and grounding tests repeatedly and deterministically.
- Validates that outputs strictly conform to `ProposalAnalysisResult`.

---

## 3. Lokesh's Independent Execution

Lokesh builds the database schemas, proposal state machine, email ingestion, and review screens using static mock outputs stored in `fixtures/ai-results/sample-analysis-result.json`.

- Does **not** incur LLM API latency, costs, or non-deterministic model responses during UI development.
- Can build rich review components, diff viewers, and confidence indicators against known test cases.
- Validates that inputs prepared for the AI engine strictly match `ProposalInput`.

---

## 4. Integration Milestones

When both developers complete their unit and domain milestones against the shared contracts:

1. Connect the real platform hand-off to the real AI engine entrypoint.
2. Execute cross-boundary test suites in `tests/integration/`.
3. Perform end-to-end verification in `tests/e2e/`.
