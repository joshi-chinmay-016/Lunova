# Lunetron Knowledge Base Fixtures (`fixtures/knowledge/lunetron`)

> [!CAUTION]
> **QUARANTINED SYNTHETIC TEST FIXTURES — NOT VERIFIED COMPANY KNOWLEDGE**  
> All documents in this folder are **synthetic benchmark fixtures** designed exclusively for offline RAG evaluation (Hit@1, Hit@3, Recall@K) and pipeline integration testing.  
> **Under no circumstances should these documents be ingested into production knowledge stores or presented as verified factual commitments of Lunetron Technologies Inc.**

---

## 1. Purpose of this Directory

This directory contains 8 benchmark documents with representative terminology and domain structures (cloud architecture, AI pipelines, SLAs, pricing models, and case studies) used to:
1. Benchmark the structural chunker (`StructuralChunker`) on complex multi-heading enterprise markdown.
2. Verify semantic vector retrieval precision using 768-dimensional embeddings.
3. Validate anti-hallucination guardrails and source citation matching in `IntelligenceService`.
4. Enforce strict multi-tenant isolation against other tenant data in automated test suites.

---

## 2. Catalog of Unverified Synthetic Claims

None of the claims below have been verified or authorized by Lunetron executive, legal, or finance leadership:

| Document | Unverified Synthetic Elements | Risk / Audit Note |
| :--- | :--- | :--- |
| `lunetron_security_and_compliance.md` | Claims annual SOC 2 Type II across 5 trust criteria, ISO 27001:2022, and HIPAA BAA readiness. | **No certified audit report exists on record.** |
| `lunetron_service_level_agreements.md` | Claims 99.99% monthly uptime, < 15min Sev-1 response 24/7/365, and 10%–50% financial penalty credits. | **Unapproved operational and financial liabilities.** |
| `lunetron_standard_pricing_models.md` | Quotes Enterprise Core ($12,000/mo), Enterprise Scale ($28,000/mo), and Discovery Sprints ($45,000). | **Synthetic rate cards. Must not be quoted in binding proposals.** |
| `lunetron_case_studies_and_references.md` | References Top-5 Investment Bank, National Health Network (50M records), and Global Logistics Fleet ($3.2M savings). | **Fictional marketing narratives.** |
| `lunetron_company_overview.md` | Lists San Francisco HQ, Austin/London centers, 240+ architects, and 85+ enterprise platforms. | **Synthetic organizational metrics.** |

---

## 3. Production Ingestion Gate

The platform ingestion service (`DocumentService.ingest_document`) programmatically inspects incoming documents. Any document containing the quarantine token:
```text
QUARANTINE_STATUS: BENCHMARK_ONLY
```
is **automatically rejected** from ingestion to prevent synthetic benchmark documents from entering the production knowledge base.
