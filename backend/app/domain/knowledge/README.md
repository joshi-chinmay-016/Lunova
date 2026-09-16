# Knowledge Domain (`backend/app/domain/knowledge`)

**Owner**: Lokesh

## Purpose & Responsibilities

- Knowledge documents and document metadata management.
- Knowledge lifecycle states (UPLOADED ➔ PARSED ➔ INDEXED).
- Company-scoped document association.

> [!IMPORTANT]
> Knowledge must **always** be company/tenant scoped. Company A must never retrieve or see Company B's knowledge.
