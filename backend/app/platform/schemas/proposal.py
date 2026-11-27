from pydantic import BaseModel, ConfigDict
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime
from app.models.proposal import ProposalStatus

class ProposalCreate(BaseModel):
    title: Optional[str] = None
    content: str
    subject: Optional[str] = None
    sender_address: str
    recipient_address: str

class ProposalDraftUpdate(BaseModel):
    subject: Optional[str] = None
    body: str

class EmailSummary(BaseModel):
    id: UUID
    direction: str
    sender_address: str
    recipient_address: str
    subject: Optional[str] = None
    body: Optional[str] = None
    classification: Optional[str] = None
    thread_id: Optional[str] = None
    message_id: Optional[str] = None
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class AttachmentSummary(BaseModel):
    id: UUID
    filename: str
    content_type: Optional[str] = None
    file_size_bytes: Optional[int] = None
    parsing_status: str
    model_config = ConfigDict(from_attributes=True)

class ProposalResponse(BaseModel):
    id: UUID
    company_id: UUID
    title: Optional[str] = None
    status: ProposalStatus
    classification: Optional[str] = "CUSTOMER_REQUEST"
    requirements: Optional[Any] = None
    sources: Optional[Any] = None
    generated_response: Optional[Any] = None
    confidence: Optional[Any] = None
    missing_information: Optional[Any] = None
    clarification_questions: Optional[Any] = None
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class ProposalDetailResponse(ProposalResponse):
    incoming_email: Optional[EmailSummary] = None
    outgoing_email: Optional[EmailSummary] = None
    attachments: List[AttachmentSummary] = []

class ResponseCenterMetrics(BaseModel):
    total_inbox: int
    customer_requests: int
    drafts_generated: int
    awaiting_review: int
    approved: int
    sent: int
    needs_info: int
