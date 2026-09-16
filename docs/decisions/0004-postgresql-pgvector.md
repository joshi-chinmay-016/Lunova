# 4. PostgreSQL with pgvector for Relational Data and Embeddings

- **Status**: Accepted
- **Date**: 2026-09-16
- **Deciders**: Chinmay, Lokesh

---

## Context

Lunova requires relational storage for proposals, reviewers, audit logs, and emails, as well as vector storage for semantic retrieval over chunked knowledge documents. Managing separate databases (e.g. Postgres for relational + Pinecone/Qdrant/Weaviate for vectors) introduces operational overhead, network boundaries, and dual-system synchronization complexity.

## Decision

We will use **PostgreSQL with the `pgvector` extension** (`pgvector/pgvector:pg16`) as the unified database engine. Relational records and high-dimensional document embedding vectors will reside within the same database engine.

## Consequences

### Positive
- Single database technology to deploy, back up, monitor, and maintain.
- Atomic ACID transactions spanning proposal records and knowledge chunks.
- Vector similarity searches can be joined directly with relational filters (e.g., `company_id`, document permissions) in standard SQL queries.
- Zero external SaaS vector database costs or API rate limits during early development.

### Negative / Trade-offs
- Massive scale (tens of millions of vectors) may eventually require dedicated vector engine optimizations or read-replicas, but pgvector comfortably handles hundreds of thousands of vectors for MVP and beyond.
