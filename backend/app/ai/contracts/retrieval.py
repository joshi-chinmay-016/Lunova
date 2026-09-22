from typing import Optional, List, Dict, Any
from uuid import UUID
from pydantic import BaseModel, Field

class RetrievalInput(BaseModel):
    company_id: UUID = Field(..., description="The ID of the company. Used to enforce isolation.")
    query: str = Field(..., description="The search query")
    top_k: int = Field(5, ge=1, le=20, description="Number of results to retrieve")

class RetrievedChunk(BaseModel):
    chunk_id: UUID = Field(..., description="ID of the retrieved chunk")
    document_id: UUID = Field(..., description="ID of the source document")
    content: str = Field(..., description="Text content of the chunk")
    score: float = Field(..., description="Similarity score")
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Additional metadata from chunk/document")

class RetrievalResult(BaseModel):
    query: str = Field(..., description="The original search query")
    chunks: List[RetrievedChunk] = Field(default_factory=list, description="List of retrieved chunks")
