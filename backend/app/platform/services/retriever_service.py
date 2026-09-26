import uuid
from typing import List, Union, Optional
from sqlalchemy import select
from app.core.database import sync_session_maker
from app.models.document_chunk import DocumentChunk
from intelligence.interfaces.retriever import Retriever
from intelligence.models.extraction import ExtractedRequirement
from intelligence.models.retrieval import RetrievedSource
from intelligence.providers.embedding import EmbeddingProvider

class PlatformRetriever(Retriever):
    """Platform implementation of knowledge retrieval using Postgres pgvector.
    
    Note on sync_session_maker:
    This class currently uses sync_session_maker despite existing in an async application.
    This boundary is maintained because the Intelligence Retriever interface is synchronous
    and rewriting the entire Intelligence module to support async retrievers is out of scope 
    for Phase 5. The overhead of a synchronous DB call for retrieval is acceptable here.
    """
    def __init__(self, embedding_provider: EmbeddingProvider, top_k: int = 5):
        self.embedding_provider = embedding_provider
        self.top_k = top_k

    def retrieve(
        self,
        requirements: Union[List[ExtractedRequirement], str],
        company_id: str,
        top_k: Optional[int] = None,
    ) -> List[RetrievedSource]:
        
        limit = top_k or self.top_k
        query_text = ""
        if isinstance(requirements, str):
            query_text = requirements
        else:
            # simple strategy: combine requirement texts
            query_text = " ".join([req.text for req in requirements])
            
        if not query_text.strip():
            return []

        # Embed query
        query_embedding = self.embedding_provider.embed_query(query_text)
        
        # Ensure company_id is uuid
        try:
            cid = uuid.UUID(company_id)
        except ValueError:
            return []

        # Query chunks
        sources = []
        with sync_session_maker() as session:
            # We use cosine distance: DocumentChunk.embedding.cosine_distance(query_embedding)
            # The smaller the distance, the more similar.
            stmt = (
                select(DocumentChunk)
                .filter(DocumentChunk.company_id == cid)
                .order_by(DocumentChunk.embedding.cosine_distance(query_embedding))
                .limit(limit)
            )
            results = session.execute(stmt).scalars().all()
            
            for rank, chunk in enumerate(results):
                source = RetrievedSource(
                    source_id=str(chunk.id),
                    title=chunk.metadata_json.get("source", "Document") if chunk.metadata_json else "Document",
                    section=chunk.content,
                    relevance_score=1.0 - (rank * 0.1), # crude score approximation
                )
                sources.append(source)
                
        return sources
