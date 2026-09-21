import enum
import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Enum, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base import Base

class EmailDirection(str, enum.Enum):
    INCOMING = "INCOMING"
    OUTGOING = "OUTGOING"

class Email(Base):
    __tablename__ = "emails"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    proposal_id = Column(UUID(as_uuid=True), ForeignKey("proposals.id", ondelete="SET NULL"), nullable=True, index=True)
    direction = Column(Enum(EmailDirection), nullable=False)
    sender_address = Column(String, nullable=False)
    recipient_address = Column(String, nullable=False)
    subject = Column(String, nullable=True)
    body = Column(Text, nullable=True)
    message_id = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    company = relationship("Company", back_populates="emails")
    proposal = relationship("Proposal", back_populates="emails")
