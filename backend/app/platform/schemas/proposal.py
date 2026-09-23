from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from uuid import UUID
from datetime import datetime
from app.models.proposal import ProposalStatus

class ProposalCreate(BaseModel):
    title: Optional[str] = None
    content: str
    subject: Optional[str] = None

class ProposalResponse(BaseModel):
    id: UUID
    company_id: UUID
    title: Optional[str]
    status: ProposalStatus
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
