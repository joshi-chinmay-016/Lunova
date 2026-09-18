# Proposal Test Fixtures (`fixtures/proposals/`)

This directory contains synthetic proposal fixtures for local development, offline unit testing, and Gemini extraction evaluation.

> [!NOTE]
> All fixture files contain strictly synthetic test data. No confidential client information or proprietary business data is included.

---

## Fixture Catalog

| Fixture File | Scenario | Key Testing Focus | Expected Extraction Highlights |
| :--- | :--- | :--- | :--- |
| `simple_rfp.json` | **Case 1 — Simple** | Core functional deliverables & straightforward timeline | 100 users, web app, authentication, dashboard, reporting, 12 weeks timeline |
| `technical_rfp.json` | **Case 2 — Technical** | Architecture, infrastructure, database, security, and integrations | REST APIs, PostgreSQL, AWS/K8s deployment, Salesforce/SAP integration, RBAC, TLS 1.3 |
| `ambiguous_rfp.json` | **Case 3 — Ambiguous** | Anti-hallucination & ambiguity detection | "quickly" flagged as ambiguous timeline; "highly scalable" flagged as vague capacity; **no invented numbers** (e.g. 2 weeks or 1 million users) |
| `incomplete_rfp.json` | **Case 4 — Incomplete** | Missing information detection | Generic request with missing budget, timeline, users, integration, SLA; **no invented constraints** |
| `multi_requirement_rfp.json` | **Case 5 — Multi-Requirement** | Complex multi-category requirements (12 distinct items) | Functional, technical, integration, security, compliance, support, team requirement, qualification, timeline, budget |
| `sample-proposal-input.json` | **Phase 1 Baseline** | Baseline regression test input | Enterprise automation platform with OAuth2, tenant isolation, RBAC |

---

## Schema Structure

Each proposal fixture conforms to normalized inbound proposal data:

```json
{
  "contract_version": "1.0",
  "proposal_id": "string",
  "company": {
    "company_id": "string",
    "company_name": "string"
  },
  "email": {
    "message_id": "string",
    "thread_id": "string",
    "sender": "string",
    "recipients": ["string"],
    "subject": "string",
    "body": "string",
    "received_at": "ISO-8601 string"
  },
  "attachments": [
    {
      "attachment_id": "string",
      "filename": "string",
      "mime_type": "string",
      "extracted_content": "string"
    }
  ]
}
```
