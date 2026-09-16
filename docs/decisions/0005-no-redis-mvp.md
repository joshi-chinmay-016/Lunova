# 5. Exclusion of Redis and Distributed Message Queues from MVP

- **Status**: Accepted
- **Date**: 2026-09-16
- **Deciders**: Chinmay, Lokesh

---

## Context

Many AI and enterprise platforms introduce distributed task workers (Celery, RQ, Dramatiq) backed by message brokers (Redis, RabbitMQ) from the start. However, introducing brokers adds operational footprint, state synchronization overhead, and distributed debugging complexity.

## Decision

**Redis is excluded from the initial MVP.** Background and asynchronous processing (such as LLM generation calls and email polling) will be managed through lightweight in-process asynchronous facilities (FastAPI `BackgroundTasks` or native Python `asyncio` task execution).

Infrastructure can be upgraded to Redis/Celery later when justified by high concurrent processing volume or strict multi-worker distributed durability requirements.

## Consequences

### Positive
- Simpler development environment: only Docker with PostgreSQL is required locally.
- Fewer moving parts to monitor, configure, and debug.
- Low memory footprint.

### Negative / Trade-offs
- In-process tasks are tied to the API server lifecycle; a server restart could interrupt an active generation task. For MVP volumes, retries can be triggered manually from the review interface.
