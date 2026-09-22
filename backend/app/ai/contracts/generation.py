from typing import List
from uuid import UUID
from pydantic import BaseModel, Field
from app.ai.contracts.requirements import ExtractedRequirements
from app.ai.contracts.retrieval import RetrievedChunk

class SourceReference(BaseModel):
    document_id: UUID = Field(..., description="ID of the source document")
    chunk_id: UUID = Field(..., description="ID of the specific chunk used")
    snippet: str = Field(..., description="Brief snippet of the source text")

class ProposalGenerationInput(BaseModel):
    company_id: UUID = Field(..., description="The ID of the company")
    extracted_requirements: ExtractedRequirements = Field(..., description="Requirements extracted from the request")
    retrieved_context: List[RetrievedChunk] = Field(..., description="Context retrieved from the knowledge base")

class ProposalGenerationResult(BaseModel):
    content: str = Field(..., description="The generated proposal content in Markdown format")
    sources_used: List[SourceReference] = Field(default_factory=list, description="References to the knowledge chunks actually used by the LLM")
