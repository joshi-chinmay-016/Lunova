# Prompt Versions & Roadmap

This file tracks the evolution of prompt versions across intelligence stages.

## Stage Prompt Versions

### Requirement Extraction
### Requirement Extraction
- **v1.0 (Phase 2 - Active)**:
  - **Module**: `backend/intelligence/prompts/extraction_v1.py`
  - **Purpose**: Parse normalized email and RFP attachment text into discrete technical, security, compliance, functional, and commercial requirements without hallucination.
  - **Input**: `ProposalContext` (subject, body, extracted attachment texts).
  - **Output**: Strict JSON schema validated via Pydantic `ProposalExtractionPayload` (discrete requirements, missing information, ambiguities).
  - **Anti-Hallucination & Integrity Rules**:
    - Uses only provided proposal content; strictly zero invented facts or vendor claims.
    - Preserves verbatim quotation in `evidence` for all requirements.
    - Explicit vs inferred distinction (`explicit: bool`).
    - Surfaces ambiguous specifications in `ambiguities` rather than fabricating numbers, SLAs, or timelines.
    - Highlights relevant missing details (`missing_information`) rather than assuming defaults.
  - **Limitations**: Extraction only; does not perform RAG, search company knowledge, or generate proposal responses.


### Response Generation
- **v1 (Planned - Phase 2 / Phase 3)**:
  - Purpose: Formulate grounded proposal sections, executive summaries, and clarification questions strictly citing retrieved knowledge.
  - Status: Placeholder. To be tuned using authentic Lunetron response exemplars.

---

## Change Policy

- Any prompt revision affecting output schemas or grounding criteria must increment the minor version (e.g. `v1.1`).
- Breaking changes requiring platform contract changes must increment the major version (e.g. `v2.0`).
