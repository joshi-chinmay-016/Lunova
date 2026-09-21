import enum
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base import Base

class ProposalStatus(str, enum.Enum):
    RECEIVED = "RECEIVED"
    PROCESSING = "PROCESSING"
    ANALYZED = "ANALYZED"
    REVIEW_REQUIRED = "REVIEW_REQUIRED"
    APPROVED = "APPROVED"
    SENT = "SENT"
    FAILED = "FAILED"
    REJECTED = "REJECTED"

class Proposal(Base):
    __tablename__ = "proposals"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    status = Column(Enum(ProposalStatus), default=ProposalStatus.RECEIVED, nullable=False, index=True)
    title = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    company = relationship("Company", back_populates="proposals")
    emails = relationship("Email", back_populates="proposal", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="proposal", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="proposal", cascade="all, delete-orphan")
