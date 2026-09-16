# Knowledge Retrieval & RAG (`backend/intelligence/retrieval`)

**Owner**: Chinmay

## Responsibilities

- Semantic vector search and context preparation against chunked documents in PostgreSQL `pgvector`.
- Guaranteeing company/tenant isolation during all vector queries (`WHERE company_id = :target_company_id`).
- Scoring and ranking knowledge relevance to ensure high retrieval precision.
- Attributing source citations (`source_id`, title, section) to ground generated answers.
