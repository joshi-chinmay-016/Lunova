"""Constants for the Lunova AI Proposal Intelligence module."""

from enum import Enum


class IntelligenceStatus(str, Enum):
    """Processing statuses for intelligence pipeline results."""

    SUCCESS = "SUCCESS"
    PARTIAL = "PARTIAL"
    FAILED = "FAILED"


class ConfidenceLevel(str, Enum):
    """Human-readable confidence classifications."""

    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


# Confidence threshold constants
CONFIDENCE_THRESHOLD_HIGH: float = 0.85
CONFIDENCE_THRESHOLD_MEDIUM: float = 0.60

# Default retrieval parameters
DEFAULT_RETRIEVAL_TOP_K: int = 3
MAX_RETRIEVAL_TOP_K: int = 10

# Default requirement priority levels
PRIORITY_HIGH: str = "HIGH"
PRIORITY_MEDIUM: str = "MEDIUM"
PRIORITY_LOW: str = "LOW"

# Default proposal size safety limit (characters)
DEFAULT_MAX_PROPOSAL_CHARS: int = 50000


class RequirementCategory(str, Enum):
    """Categorization for extracted proposal requirements."""

    FUNCTIONAL_REQUIREMENT = "functional_requirement"
    TECHNICAL_REQUIREMENT = "technical_requirement"
    BUSINESS_REQUIREMENT = "business_requirement"
    DELIVERABLE = "deliverable"
    TIMELINE = "timeline"
    BUDGET = "budget"
    COMPLIANCE = "compliance"
    SECURITY = "security"
    INTEGRATION = "integration"
    SUPPORT = "support"
    TEAM_REQUIREMENT = "team_requirement"
    QUALIFICATION = "qualification"
    OTHER = "other"


class ImportanceLevel(str, Enum):
    """Importance classification for missing information and ambiguities."""

    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

