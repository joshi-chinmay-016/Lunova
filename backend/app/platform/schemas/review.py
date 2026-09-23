from pydantic import BaseModel, ConfigDict
from typing import Optional
from uuid import UUID
from datetime import datetime

class ReviewCreate(BaseModel):
    comments: Optional[str] = None

class ReviewResponse(BaseModel):
    id: UUID
    company_id: UUID
    proposal_id: UUID
    reviewer_id: Optional[UUID]
    comments: Optional[str]
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
