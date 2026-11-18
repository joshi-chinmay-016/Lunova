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
