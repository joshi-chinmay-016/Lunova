# 1. Modular Monolith Architecture

- **Status**: Accepted
- **Date**: 2026-09-16
- **Deciders**: Chinmay, Lokesh

---

## Context

Lunova is in early MVP development with two dedicated developers. Choosing an architecture pattern impacts development velocity, deployment complexity, debugging, and data consistency.

## Decision

We will structure Lunova as a **Modular Monolith** rather than a distributed set of microservices. 

The backend codebase is partitioned into distinct, isolated modules (`backend/app/domain/*` and `backend/intelligence/*`) that communicate via clear in-process interfaces and shared contract definitions.

## Consequences

### Positive
- Zero network latency between platform workflows and AI processing.
- Simple atomic database transactions where appropriate.
- Rapid local development with a single runtime container (Postgres) and no complex service orchestration.
- Seamless refactoring of boundaries before boundaries freeze into hard network interfaces.

### Negative / Trade-offs
- Scaling components independently (e.g. scaling AI workers separately from HTTP API) requires careful in-process concurrency management initially, but can be split later if justified by metrics.
