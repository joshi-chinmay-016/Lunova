"""Requirement extraction models."""

from dataclasses import dataclass


@dataclass
class ExtractedRequirement:
    """A discrete requirement extracted from proposal content."""

    requirement_id: str
    category: str  # e.g., "TECHNICAL", "SECURITY", "COMMERCIAL", "COMPLIANCE"
    description: str
    priority: str = "MEDIUM"  # "HIGH", "MEDIUM", "LOW"
