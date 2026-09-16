# Email Domain (`backend/app/domain/email`)

**Owner**: Lokesh

## Purpose & Responsibilities

- Inbound email ingestion and normalization into canonical domain models.
- Message and thread identification linking messages to proposals.
- Attachment extraction and metadata tracking.
- Email provider abstraction interface.

> [!IMPORTANT]
> The AI layer must **not** depend directly on Gmail-specific structures. All email data passed across the contract boundary is strictly normalized.
