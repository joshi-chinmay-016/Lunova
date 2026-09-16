# Git Workflow & Branching Strategy

This document establishes the Git and branching conventions for Lunova to minimize merge conflicts and maintain an orderly commit history.

---

## 1. Branch Topology

```
main (Production-ready releases)
  │
  ▼
develop (Integration and staging branch)
  │
  ├── feature/chinmay-intelligence (AI, extraction, RAG, evaluation)
  │
  └── feature/lokesh-platform      (Ingestion, proposal lifecycle, review, email)
```

- **`main`**: Protected branch. Only merged from `develop` following successful integration testing. No direct pushes.
- **`develop`**: Primary integration branch where verified features from both developers are merged.
- **`feature/chinmay-intelligence`**: Chinmay's active development branch for AI intelligence modules.
- **`feature/lokesh-platform`**: Lokesh's active development branch for platform workflow and frontend.

---

## 2. Rules for Avoiding Merge Conflicts

1. **Work Within Owned Directories**:
   - Chinmay primarily modifies files in `backend/intelligence/` and `backend/tests/intelligence/`.
   - Lokesh primarily modifies files in `frontend/`, `backend/app/`, and `backend/tests/domain/`.
2. **Coordinated Contract Modifications**:
   - Files in `contracts/`, root `package.json`, or shared database migrations must be discussed and coordinated before committing.
3. **Frequent Rebase / Pull**:
   - Regularly rebase or merge `develop` into active feature branches to detect integration drift early.
4. **Small, Atomic Commits**:
   - Avoid massive single commits touching dozens of unrelated files.

---

## 3. Commit Message Conventions

Commit messages follow the Conventional Commits specification: `<type>(<scope>): <short description>`.

### Chinmay's Scopes (`ai`, `rag`, `extraction`, `eval`, `providers`)
- `feat(ai): add proposal extraction pipeline`
- `feat(rag): implement company-scoped vector retrieval`
- `test(eval): add grounding evaluation benchmark`
- `fix(providers): handle rate limit exponential backoff`

### Lokesh's Scopes (`frontend`, `proposal`, `email`, `review`, `company`, `db`)
- `feat(proposal): add proposal lifecycle state transitions`
- `feat(frontend): create proposal review action widgets`
- `feat(email): implement gmail ingestion adapter`
- `fix(db): add company_id index on proposal table`

### Shared Scopes (`contracts`, `infra`, `docs`)
- `feat(contracts): add clarification_questions to analysis result`
- `docs(arch): update email normalization diagram`
- `ci: configure automated lint workflow`
