# AI Proposal Intelligence Engine (`backend/intelligence`)

**Owner**: Chinmay

This module houses the AI-powered proposal understanding and generation engine for Lunova.

## Submodules & Responsibilities

- **`extraction/`**: Understand incoming proposal text, extract discrete requirements, and detect missing information.
- **`retrieval/`**: Retrieve relevant company knowledge, construct context, and guarantee tenant isolation (Rule 2).
- **`generation/`**: Formulate grounded proposal responses and draft clarification questions.
- **`evaluation/`**: Perform grounding checks, knowledge coverage evaluation, confidence scoring, and unsupported claims detection.
- **`providers/`**: Pluggable provider abstractions for LLMs and embeddings (OpenAI, Anthropic, Gemini, local).

---

## Important AI Safety & Quality Rules

> [!CAUTION]
> **The AI must NOT invent company claims**:
> The AI engine must never fabricate or invent:
> - Company experience
> - Previous projects
> - Client names
> - Technologies or proprietary stacks
> - Pricing models or rate cards
> - Delivery timelines
> - Certifications or regulatory badges
> - Capabilities or case studies
> - Any other company-specific claims
>
> All statements must be directly supported by the company's retrieved knowledge base or the explicitly provided proposal context. If relevant knowledge cannot be found:
> 1. Do **not** fabricate.
> 2. Flag the missing information in `missing_information`.
> 3. Request clarification or flag for human reviewer attention (`requires_human_attention = true`).
