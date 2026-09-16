# 2. Email-First Input for MVP

- **Status**: Accepted
- **Date**: 2026-09-16
- **Deciders**: Chinmay, Lokesh

---

## Context

Proposals and RFPs are submitted across numerous channels in enterprise business: email inboxes, web procurement portals (e.g. Coupa, Ariba), public bidding boards, and chat tools. Supporting all channels simultaneously increases initial scope without validating the core value proposition.

## Decision

The MVP input channel is strictly **Email** via a dedicated development/test inbox. All incoming inquiries will be ingested through an email adapter and normalized into standard message and attachment models before downstream processing.

## Consequences

### Positive
- Concentrates development effort on solving RFP comprehension, RAG quality, and review workflows.
- Matches how Lunetron currently receives the vast majority of technical inquiries.
- Other channels can be introduced later by simply writing adapters that emit the same normalized proposal payload.

### Negative / Trade-offs
- RFP submissions originating strictly from web portals requiring browser automation or form uploads must be handled manually or forwarded to email for MVP.
