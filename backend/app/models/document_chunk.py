import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, Integer
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from pgvector.sqlalchemy import Vector
from app.models.base import Base

class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # Company ID is denormalized here for strict isolation queries.
    company_id = Column(UUID(as_uuid=True), ForeignKey("companies.id", ondelete="CASCADE"), nullable=False, index=True)
    document_id = Column(UUID(as_uuid=True), ForeignKey("knowledge_documents.id", ondelete="CASCADE"), nullable=False, index=True)
    
    chunk_index = Column(Integer, nullable=False)
    content = Column(String, nullable=False)

    # UNRESOLVED ARCHITECTURE DECISION:
    # The platform DB currently hardcodes Vector(1536) (typical for text-embedding-3-small).
    # The Intelligence layer config defaults to 3072 (typical for text-embedding-3-large).
    # Furthermore, we must determine the exact output dimension of the final Gemini embedding model.
    # DO NOT migrate this column to 3072 speculatively. Wait until the final Gemini embedding model is chosen.
    embedding = Column(Vector(1536), nullable=True) # 1536 is typical for OpenAI text-embedding-3-small
    metadata_json = Column(JSONB, nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    company = relationship("Company")
    document = relationship("KnowledgeDocument")
