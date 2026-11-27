import enum
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Enum, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base import Base

class ProposalStatus(str, enum.Enum):
    RECEIVED = "RECEIVED"
    PROCESSING = "PROCESSING"
    CLASSIFIED = "CLASSIFIED"
    DRAFT_GENERATED = "DRAFT_GENERATED"
    NEEDS_INFORMATION = "NEEDS_INFORMATION"
    NEEDS_ADMIN_REVIEW = "NEEDS_ADMIN_REVIEW"
    ANALYZED = "ANALYZED"
    REVIEW_REQUIRED = "REVIEW_REQUIRED"
    UNDER_REVIEW = "UNDER_REVIEW"
    APPROVED = "APPROVED"
    SENDING = "SENDING"
    DISPATCH_UNCERTAIN = "DISPATCH_UNCERTAIN"
    SENT = "SENT"
    SEND_FAILED = "SEND_FAILED"
    FAILED = "FAILED"
    REJECTED = "REJECTED"

class Proposal(Base):
    __tablename__ = "proposals"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(Enum(ProposalStatus), default=ProposalStatus.RECEIVED, nullable=False, index=True)
    title = Column(String, nullable=True)
    classification = Column(String, nullable=True, default="CUSTOMER_REQUEST", index=True)
    requirements = Column(JSON, nullable=True)
    sources = Column(JSON, nullable=True)
    generated_response = Column(JSON, nullable=True)
    confidence = Column(JSON, nullable=True)
    missing_information = Column(JSON, nullable=True)
    clarification_questions = Column(JSON, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    company = relationship("Company", back_populates="proposals")
    emails = relationship("Email", back_populates="proposal", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="proposal", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="proposal", cascade="all, delete-orphan")
    attachments = relationship("EmailAttachment", back_populates="proposal")
