"""Exceptions for the Lunova AI Proposal Intelligence module."""


class IntelligenceError(Exception):
    """Base exception for all errors within the intelligence module."""

    pass


class InvalidProposalError(IntelligenceError):
    """Raised when proposal payload is malformed, missing required fields, or unparseable."""

    pass


class MissingCompanyContextError(IntelligenceError):
    """Raised when company/tenant identity is missing, violating tenant isolation invariants."""

    pass


class ExtractionError(IntelligenceError):
    """Raised when requirement extraction stage fails to parse or analyze input."""

    pass


class RetrievalError(IntelligenceError):
    """Raised when tenant-scoped knowledge retrieval encounters an error."""

    pass


class GenerationError(IntelligenceError):
    """Raised when response generation fails to produce a grounded response."""

    pass


class EvaluationError(IntelligenceError):
    """Raised when grounding evaluation or confidence calculation encounters an error."""

    pass


class ProviderError(IntelligenceError):
    """Raised when an underlying LLM or embedding provider encounters an error."""

    pass
