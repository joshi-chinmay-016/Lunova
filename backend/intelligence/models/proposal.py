"""Normalized proposal input model."""

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional


@dataclass
class AttachmentMetadata:
    """Metadata describing an attached document."""

    filename: str
    content_type: str
    size_bytes: int = 0
    document_id: Optional[str] = None
    extraction_status: str = "SUCCESS"  # SUCCESS, EMPTY, FAILED, UNSUPPORTED, OVERSIZED, CORRUPTED
    page_count: Optional[int] = None
    error_message: Optional[str] = None
    extra: Dict[str, Any] = field(default_factory=dict)


@dataclass
class ParsedAttachment:
    """Normalized structured parsed attachment."""

    filename: str
    content_type: str
    extracted_text: str
    status: str = "SUCCESS"
    page_count: Optional[int] = None
    pages: List[Dict[str, Any]] = field(default_factory=list)
    error_message: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class ProposalContext:
    """Normalized input payload passed into the intelligence module."""

    proposal_id: str
    company_id: str
    subject: str
    body: str
    attachments_text: List[str] = field(default_factory=list)
    attachments: List[ParsedAttachment] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)

    def __post_init__(self) -> None:
        # Sync attachments -> attachments_text
        if self.attachments and not self.attachments_text:
            self.attachments_text = [
                att.extracted_text for att in self.attachments if att.extracted_text
            ]
        # Sync attachments_text -> attachments
        elif self.attachments_text and not self.attachments:
            self.attachments = [
                ParsedAttachment(
                    filename=f"attachment_{idx + 1}.txt",
                    content_type="text/plain",
                    extracted_text=text,
                    status="SUCCESS",
                )
                for idx, text in enumerate(self.attachments_text)
            ]

