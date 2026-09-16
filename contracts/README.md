# Contracts (`contracts`)

This directory defines the explicit contract boundary between:

```
┌───────────────────────────┐
│     Platform Backend      │  (Owned by Lokesh: Ingestion, Database, Workflow, Review)
└─────────────┬─────────────┘
              │
              │  ◄── Communication Boundary: contracts/
              ▼
┌───────────────────────────┐
│   AI Intelligence Engine  │  (Owned by Chinmay: Extraction, Retrieval, Generation)
└───────────────────────────┘
```

## Purpose

1. **Decoupled Parallel Development**:
   By establishing clear contracts first, Chinmay can build and evaluate the AI pipeline using mock input payloads, while Lokesh can build the proposal review and email workflows using mock output payloads.
2. **Preventing Leaky Abstractions**:
   - The platform never needs to know how the AI performs embedding, vector searching, prompt engineering, or confidence scoring.
   - The AI engine never needs to know whether the email came from Gmail, Outlook, or IMAP, nor how database transactions are handled.
3. **Draft / Conceptual State**:
   - The contracts documented here are **conceptual specifications** (v1.0-draft).
   - Exact schemas, field types, and validation rules will be finalized once actual sample proposals and requirements from Lunetron are analyzed.

## Contract Documents

- [`proposal-input.md`](./proposal-input.md): The normalized data payload provided by the Platform to the AI Engine.
- [`proposal-analysis-result.md`](./proposal-analysis-result.md): The structured result returned by the AI Engine to the Platform.
- [`contract-versioning.md`](./contract-versioning.md): Versioning rules, deprecation policy, and change management protocol.
- [`errors.md`](./errors.md): Common error taxonomy and status codes shared across the platform and AI layers.
