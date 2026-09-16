# 6. Contract-First Parallel Development

- **Status**: Accepted
- **Date**: 2026-09-16
- **Deciders**: Chinmay, Lokesh

---

## Context

Chinmay (AI / Intelligence) and Lokesh (Platform / Workflow) need to build complex systems concurrently. If development is sequential, one developer will be blocked waiting for functional endpoints, email parsing, or model responses from the other.

## Decision

We will adopt a **Contract-First Architecture** mediated by documentation and schemas in `contracts/`. 

Both developers will design against:
1. `ProposalInput`: Canonical normalized payload from Platform to AI.
2. `ProposalAnalysisResult`: Canonical structured response from AI to Platform.

Both developers will use static JSON mock fixtures (`fixtures/`) to test and run their layers independently until integration.

## Consequences

### Positive
- Zero blocking between Chinmay and Lokesh.
- Clean architectural boundary that prevents AI logic from leaking into database models or UI components.
- Direct testability of AI prompt benchmarks against deterministic inputs.
- Ability to develop the entire frontend review UI with realistic mock AI responses without calling paid LLM APIs.

### Negative / Trade-offs
- Requires discipline to keep mock fixtures and contract documents synchronized. Any breaking change to contracts must be approved by both developers.
