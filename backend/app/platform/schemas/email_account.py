from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict


class EmailAccountResponse(BaseModel):
    id: UUID
    company_id: UUID
    provider: str
    email_address: str
    is_active: bool
    token_expiry: Optional[datetime] = None
    last_synced_at: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class GmailAuthUrlResponse(BaseModel):
    authorization_url: str
    state: str


class GmailConnectionStatusResponse(BaseModel):
    connected: bool
    account: Optional[EmailAccountResponse] = None


class SyncDurationMetrics(BaseModel):
    gmail_api_fetch_ms: float = 0.0
    message_normalization_ms: float = 0.0
    database_persistence_ms: float = 0.0
    attachment_processing_ms: float = 0.0
    document_extraction_ms: float = 0.0
    embedding_generation_ms: float = 0.0
    rag_retrieval_ms: float = 0.0
    gemini_generation_ms: float = 0.0
    total_duration_ms: float = 0.0


class GmailSyncResponse(BaseModel):
    account_id: str
    email_address: str
    messages_examined: int
    new_emails_count: int
    proposals_created_count: int
    skipped_duplicates_count: int
    attachments_discovered_count: int = 0
    failed_messages_count: int = 0
    sync_status: str = "COMPLETED"
    synced_at: str
    history_id: Optional[str] = None
    sync_strategy: Optional[str] = "history"
    durations: Optional[SyncDurationMetrics] = None
