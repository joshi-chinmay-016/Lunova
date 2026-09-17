"""Lightweight logging utility for the Lunova AI Proposal Intelligence module.

Avoids logging confidential proposal text, client PII, email bodies, credentials,
or API keys. Logs only operational milestones, telemetry, and non-sensitive identifiers.
"""

import logging

# Module-level logger for intelligence operations
logger = logging.getLogger("lunova.intelligence")

if not logger.handlers:
    handler = logging.StreamHandler()
    formatter = logging.Formatter(
        "[%(asctime)s] [%(levelname)s] [lunova.intelligence] %(message)s"
    )
    handler.setFormatter(formatter)
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)


def log_pipeline_started(proposal_id: str, company_id: str) -> None:
    """Log the start of an intelligence analysis pipeline run."""
    logger.info("Intelligence pipeline started for proposal_id=%s, company_id=%s", proposal_id, company_id)


def log_stage_completed(stage_name: str, proposal_id: str, duration_ms: float) -> None:
    """Log completion of a specific intelligence pipeline stage."""
    logger.info("Stage '%s' completed for proposal_id=%s in %.2f ms", stage_name, proposal_id, duration_ms)


def log_retrieval_attempted(company_id: str, count: int) -> None:
    """Log scoped retrieval execution without logging raw queries or sensitive data."""
    logger.info("Scoped retrieval completed for company_id=%s (sources_retrieved=%d)", company_id, count)


def log_evaluation_completed(proposal_id: str, overall_score: float, human_attention: bool) -> None:
    """Log grounding evaluation completion."""
    logger.info(
        "Evaluation completed for proposal_id=%s (overall_score=%.2f, requires_attention=%s)",
        proposal_id,
        overall_score,
        human_attention,
    )


def log_provider_error(provider_name: str, error_type: str) -> None:
    """Log provider errors without exposing raw payload or tokens."""
    logger.error("Provider error encountered in provider='%s': %s", provider_name, error_type)
