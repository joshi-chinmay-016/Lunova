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

    # RESOLVED ARCHITECTURE DECISION:
    # Aligned with Gemini text-embedding-004 output dimension of 768.
    # Matches IntelligenceConfig.embedding_dimension (768) and Alembic migration 004.
    embedding = Column(Vector(768), nullable=True)

    metadata_json = Column(JSONB, nullable=True)
    
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    # Relationships
    company = relationship("Company")
    document = relationship("KnowledgeDocument")
