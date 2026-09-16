# 3. Lunetron-First Development with Scoped Tenancy

- **Status**: Accepted
- **Date**: 2026-09-16
- **Deciders**: Chinmay, Lokesh

---

## Context

The long-term vision of Lunova is a multi-tenant platform where any enterprise can plug in their company profile, knowledge base, and email inbox to automate proposal generation. However, premature multi-tenant UI, onboarding wizards, and billing infrastructure would stall time-to-market.

## Decision

The initial MVP is developed specifically for **Lunetron**. We will not build generic tenant onboarding workflows or multi-tenant management consoles for the MVP. 

However, we will enforce **scoped tenancy** in the architecture from Day 1: all data, knowledge vectors, and proposals are tagged with `company_id = "lunetron"`. Company-specific business rules, prompts, or logic must **never** be hardcoded.

## Consequences

### Positive
- Allows immediate focus on solving Lunetron's actual proposal and knowledge challenges.
- Cleanly preserves the architectural path to full multi-tenancy without costly database migrations later.
- Prevents technical debt from hardcoded company logic.

### Negative / Trade-offs
- Additional organizations cannot self-onboard until tenant administration is built in a subsequent phase.
