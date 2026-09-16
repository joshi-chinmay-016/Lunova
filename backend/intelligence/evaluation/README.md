# Grounding & Evaluation (`backend/intelligence/evaluation`)

**Owner**: Chinmay

## Responsibilities

- Grounding checks: Verifying every factual claim in the response matches retrieved knowledge.
- Knowledge coverage measurement.
- Confidence scoring (0.0 to 1.0) and computing threshold flags (`requires_human_attention`).
- Unsupported claims detection to prevent hallucination.
- Emitting AI operational warnings to human reviewers.
