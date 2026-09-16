# Contract Versioning Policy

**Current Version**: `1.0`

---

## 1. Principles of Contract Versioning

The contracts residing in `contracts/` form the operational agreement between the **Platform Backend** (Lokesh) and the **AI Intelligence Engine** (Chinmay).

Because both developers work independently in parallel branches, changes to shared contracts have direct impact on each other's code. To maintain development velocity without introducing breaking regressions, all contracts follow Semantic Versioning (`MAJOR.MINOR`):

| Version Change | Trigger | Example | Action Required |
| :--- | :--- | :--- | :--- |
| **`1.0`** | Initial Release | Baseline draft contracts | Initial alignment between developers |
| **`1.x` (Minor)** | Backward-Compatible Addition | Adding an optional field (e.g., `cc_recipients` or `processing_metadata.model_name`) | Backward compatibility maintained; consumer can ignore new optional fields |
| **`2.0` (Major)** | Breaking Change | Renaming a field, removing a field, changing field type, making an optional field required | Requires explicit sign-off from **both** Chinmay and Lokesh |

---

## 2. Rules of Engagement

1. **No Silent Changes**:
   Never unilaterally modify a shared contract file or schema without notifying the other developer.
2. **Mutual Agreement Before Merge**:
   Any PR that alters files in `contracts/` must be reviewed and approved by both Chinmay and Lokesh before merging into `develop` or `main`.
3. **Payload Tagging**:
   All contract payloads (`ProposalInput`, `ProposalAnalysisResult`) contain a top-level `contract_version` string (e.g., `"1.0"`).
4. **Deferred Negotiation**:
   Automated multi-version negotiation or runtime version fallbacks are **not** implemented in MVP. The system operates on a single active contract version (`1.0`).
