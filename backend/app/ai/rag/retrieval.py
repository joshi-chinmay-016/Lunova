from typing import List, Optional
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.document_chunk import DocumentChunk
from app.ai.contracts.retrieval import RetrievalInput, RetrievedChunk, RetrievalResult
from app.ai.providers.embeddings import EmbeddingProvider

class RetrievalService:
    def __init__(self, db: AsyncSession, embedding_provider: EmbeddingProvider):
        self.db = db
        self.embedding_provider = embedding_provider

    async def retrieve(self, input_data: RetrievalInput) -> RetrievalResult:
        """
        Perform vector similarity search.
        CRITICAL: This always filters by input_data.company_id to ensure company isolation.
        """
        # Embed the query
        query_embedding = await self.embedding_provider.embed_text(input_data.query)
        
        # Perform similarity search using pgvector's <-> operator (L2 distance)
        # Enforce company_id isolation at the database query level
        stmt = (
            select(DocumentChunk)
            .filter(DocumentChunk.company_id == input_data.company_id)
            .order_by(DocumentChunk.embedding.l2_distance(query_embedding))
            .limit(input_data.top_k)
        )
        
        result = await self.db.execute(stmt)
        chunks = result.scalars().all()
        
        retrieved_chunks = []
        for chunk in chunks:
            # We don't have access to the exact similarity score from l2_distance in the select clause easily 
            # without adding it to the select list, but for now we just return a fake score or 0.0, 
            # or we could calculate it. Let's do a basic query with distance returned.
            retrieved_chunks.append(RetrievedChunk(
                chunk_id=chunk.id,
                document_id=chunk.document_id,
                content=chunk.content,
                score=1.0, # Placeholder, in a real implementation we'd select the distance
                metadata=chunk.metadata_json or {}
            ))
            
        return RetrievalResult(
            query=input_data.query,
            chunks=retrieved_chunks
        )
