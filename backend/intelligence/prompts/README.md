# Intelligence Prompts (`backend/intelligence/prompts`)

This directory houses system prompts, few-shot exemplars, and template definitions for all AI reasoning stages.

## Design Principles

1. **Centralized & Versioned**:
   Production prompts must never be hardcoded or scattered across service code. All prompts reside in this directory with explicit version numbers.
2. **Deterministic Inputs**:
   Prompts consume normalized data structures and retrieved knowledge context without assuming provider-specific markup.
3. **No Fabricated Claims**:
   System prompts enforce the strict anti-hallucination directive: the AI must only cite retrieved company knowledge and never invent capabilities, certifications, or pricing.
4. **Iterative Tuning**:
   Real prompt templates will be formulated in Phase 2 once authentic Lunetron RFP samples and representative responses are analyzed.
