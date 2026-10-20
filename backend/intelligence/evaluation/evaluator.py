"""Deterministic grounding, coverage, and anti-hallucination evaluator.

Evaluates response drafts against extracted requirements and retrieved company
knowledge sources, computing precision scores and flagging ungrounded claims.
"""

import re
from typing import Any, Dict, List, Optional, Set

from ..constants import (
    CONFIDENCE_THRESHOLD_HIGH,
    CONFIDENCE_THRESHOLD_MEDIUM,
    ConfidenceLevel,
)
from ..interfaces.evaluator import Evaluator
from ..models.evaluation import ConfidenceMetrics
from ..models.extraction import ExtractedRequirement
from ..models.generation import GeneratedDraft
from ..models.retrieval import RetrievedSource


class GroundingEvaluator(Evaluator):
    """Deterministic grounding and confidence evaluator for proposal response drafts."""

    def __init__(
        self,
        high_threshold: float = CONFIDENCE_THRESHOLD_HIGH,
        medium_threshold: float = CONFIDENCE_THRESHOLD_MEDIUM,
    ) -> None:
        self.high_threshold = high_threshold
        self.medium_threshold = medium_threshold

    def evaluate(
        self,
        draft: GeneratedDraft,
        requirements: Optional[List[ExtractedRequirement]] = None,
        sources: Optional[List[RetrievedSource]] = None,
    ) -> ConfidenceMetrics:
        """Evaluate grounding, requirement coverage, and hallucination risk."""
        req_list = requirements or []
        src_list = sources or []
        valid_source_ids: Set[str] = {s.source_id for s in src_list if s.source_id}

        validation_findings: List[Dict[str, Any]] = []

        # 1. Requirement Coverage Evaluation
        total_reqs = len(req_list)
        addressed_ids: Set[str] = set()
        grounded_count = 0
        ungrounded_reqs: List[str] = []

        for r in draft.requirement_responses:
            req_id = r.get("requirement_id", "")
            if req_id:
                addressed_ids.add(req_id)

            cited = r.get("grounded_in", [])
            # Check if citation exists in retrieved sources
            valid_citations = [c for c in cited if c in valid_source_ids]

            if valid_citations and r.get("is_supported", True):
                grounded_count += 1
            else:
                ungrounded_reqs.append(req_id)
                validation_findings.append(
                    {
                        "type": "UNGROUNDED_REQUIREMENT",
                        "severity": "WARNING",
                        "requirement_id": req_id,
                        "description": f"Requirement '{req_id}' is addressed without verifiable retrieved knowledge citation.",
                    }
                )

        # Calculate coverage score
        if total_reqs > 0:
            coverage_score = round(min(1.0, len(addressed_ids) / total_reqs), 4)
        else:
            coverage_score = 1.0

        # Calculate grounding score
        addressed_count = len(draft.requirement_responses)
        if addressed_count > 0:
            grounding_score = round(grounded_count / addressed_count, 4)
        else:
            grounding_score = 0.50 if not src_list else 1.0

        # If no sources were retrieved at all, cap grounding score
        if not src_list:
            grounding_score = min(grounding_score, 0.40)
            validation_findings.append(
                {
                    "type": "EMPTY_KNOWLEDGE_BASE",
                    "severity": "HIGH",
                    "description": "No relevant company knowledge sources were retrieved to ground this response.",
                }
            )

        # 2. Unsupported Claims & Missing Information Inspection
        unsupported_count = len(draft.unsupported_claims)
        for u in draft.unsupported_claims:
            item = u.get("item", "Unspecified claim")
            reason = u.get("reason", "Missing evidence")
            validation_findings.append(
                {
                    "type": "UNSUPPORTED_CLAIM",
                    "severity": "HIGH",
                    "item": item,
                    "description": f"Unsupported claim flagged for human review: {reason}",
                }
            )

        # 3. Deterministic Anti-Hallucination Regex Checks on Email Body
        email_body = draft.draft_email_body or ""

        # Price quote pattern (e.g. $5,000, $100/hr, USD 20,000)
        price_pattern = re.compile(r"(\$\s*[0-9]+(?:,[0-9]{3})*(?:\.[0-9]{2})?|\bUSD\s*[0-9]+|\bEUR\s*[0-9]+|\b€\s*[0-9]+)", re.IGNORECASE)
        found_prices = price_pattern.findall(email_body)
        if found_prices:
            # Check if any retrieved source contains this price
            sources_text = " ".join(s.content for s in src_list)
            for p in found_prices:
                if p not in sources_text:
                    unsupported_count += 1
                    validation_findings.append(
                        {
                            "type": "FABRICATED_PRICE_DETECTED",
                            "severity": "CRITICAL",
                            "detail": p,
                            "description": f"Fabricated price quotation '{p}' detected in email body not present in company knowledge.",
                        }
                    )

        # 4. Overall Confidence Score Calculation
        # Weighted combination: 60% grounding, 30% coverage, -10% per unsupported claim
        claim_penalty = min(0.40, unsupported_count * 0.10)
        overall_score = round(
            max(0.10, (grounding_score * 0.60) + (coverage_score * 0.40) - claim_penalty),
            4,
        )

        # 5. Determine Human Attention Requirement
        requires_human = (
            overall_score < self.medium_threshold
            or len(src_list) == 0
            or unsupported_count > 0
            or len(ungrounded_reqs) > 0
            or any(f["severity"] in ("CRITICAL", "HIGH") for f in validation_findings)
        )

        # 6. Classification Level
        if overall_score >= self.high_threshold and not requires_human:
            conf_level = ConfidenceLevel.HIGH.value
        elif overall_score >= self.medium_threshold:
            conf_level = ConfidenceLevel.MEDIUM.value
        else:
            conf_level = ConfidenceLevel.LOW.value

        return ConfidenceMetrics(
            overall_score=overall_score,
            grounding_score=grounding_score,
            requires_human_attention=requires_human,
            coverage_score=coverage_score,
            unsupported_claim_count=unsupported_count,
            validation_findings=validation_findings,
            confidence_level=conf_level,
        )
