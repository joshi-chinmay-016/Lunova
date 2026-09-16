# Multi-Tenancy Architecture

This document defines the multi-tenancy model for **Lunova**, outlining the long-term isolation boundaries and the MVP configuration for Lunetron.

---

## 1. Long-Term Multi-Tenant Model

In its mature state, Lunova will serve multiple independent enterprise clients, each operating as a fully isolated tenant:

```
┌────────────────────────────────────────────────────────┐
│                      Lunova System                     │
├───────────────────────────┬────────────────────────────┤
│         Company A         │         Company B          │
│  ├── Inbound Email Config │  ├── Inbound Email Config  │
│  ├── Knowledge Base (RAG) │  ├── Knowledge Base (RAG)  │
│  ├── Proposals & History  │  ├── Proposals & History   │
│  ├── Reviewers & Users    │  ├── Reviewers & Users     │
│  └── Audit Log            │  └── Audit Log             │
└───────────────────────────┴────────────────────────────┘
```

Each tenant owns:
1. **Email Configuration**: Credentials and mailbox filters for their specific proposal inbox.
2. **Knowledge Base**: Proprietary product documentation, past winning proposals, rate cards, and compliance collateral.
3. **Proposals & Reviewers**: Proposals submitted to that company, reviewed by authorized internal reviewers.
4. **Audit Trail**: Tenant-scoped records for compliance and data privacy.

---

## 2. MVP Configuration (Lunetron Only)

For the MVP, multi-tenancy is represented logically through architectural scoping without building company onboarding workflows:

- `company_id` is set to `"lunetron"`.
- All incoming test proposals are tagged with `company_id = "lunetron"`.
- Knowledge embeddings are tagged with `company_id = "lunetron"`.

> [!IMPORTANT]
> **RULE 1: Company information must NEVER be hardcoded into AI logic.**
> Prompts, extraction logic, and response drafting routines must not contain conditionals like `if company == "Lunetron"`. Instead, all contextual parameters (company name, domain specialties, tone guidelines) must be supplied dynamically from tenant configuration and retrieved knowledge documents.

> [!IMPORTANT]
> **RULE 2: AI knowledge retrieval must ALWAYS be company-scoped.**
> Vector similarity searches in `pgvector` must always include a mandatory tenant filter:
> ```sql
> WHERE company_id = :target_company_id
> ```
> Cross-company document retrieval or un-scoped vector indexing is strictly forbidden by design.
