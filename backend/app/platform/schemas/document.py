from pydantic import BaseModel, ConfigDict
from typing import Optional
from uuid import UUID
from datetime import datetime

class DocumentCreate(BaseModel):
    name: str
    doc_type: Optional[str] = None
    source: Optional[str] = None
    content: str # Raw text to process

class DocumentResponse(BaseModel):
    id: UUID
    company_id: UUID
    name: str
    doc_type: Optional[str]
    source: Optional[str]
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
