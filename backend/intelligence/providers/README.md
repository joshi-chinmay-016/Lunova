# Provider Abstractions (`backend/intelligence/providers`)

**Owner**: Chinmay

## Responsibilities

- LLM provider abstraction layer (supporting OpenAI, Anthropic, Gemini, local models).
- Embedding provider abstraction layer.
- Ensuring provider implementations are pluggable and replaceable without altering business logic.
- Connection pooling, retries, and rate limit handling.
