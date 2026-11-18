import enum
import uuid
from datetime import datetime, timezone
from sqlalchemy import Boolean, Column, DateTime, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.models.base import Base


class EmailProvider(str, enum.Enum):
    GMAIL = "GMAIL"


class EmailAccount(Base):
    __tablename__ = "email_accounts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    company_id = Column(
        UUID(as_uuid=True),
        ForeignKey("companies.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    provider = Column(String, nullable=False, default=EmailProvider.GMAIL.value)
    email_address = Column(String, nullable=False, index=True)

    # Encrypted token storage (raw ciphertext; never plaintext tokens)
    encrypted_access_token = Column(Text, nullable=False)
    encrypted_refresh_token = Column(Text, nullable=True)
    token_expiry = Column(DateTime(timezone=True), nullable=True)

    # Synchronization state & cursor
    history_id = Column(String, nullable=True)
    last_synced_at = Column(DateTime(timezone=True), nullable=True)

    # Connection status
    is_active = Column(Boolean, nullable=False, default=True)

    # Audit timestamps
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    company = relationship("Company", back_populates="email_accounts")
    emails = relationship("Email", back_populates="email_account")

    def __init__(self, **kwargs):
        kwargs.setdefault("id", uuid.uuid4())
        kwargs.setdefault("provider", EmailProvider.GMAIL.value)
        kwargs.setdefault("is_active", True)
        super().__init__(**kwargs)

    __table_args__ = (
        UniqueConstraint(
            "company_id",
            "provider",
            "email_address",
            name="uq_email_accounts_company_provider_email",
        ),
    )
