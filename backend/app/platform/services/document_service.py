import logging
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.document import KnowledgeDocument
from app.models.document_chunk import DocumentChunk
from app.platform.schemas.document import DocumentCreate
from app.core.database import async_session_maker

from intelligence.providers.mock import MockEmbeddingProvider
from app.platform.services.chunking import DocumentChunker

logger = logging.getLogger(__name__)

class DocumentService:
    @staticmethod
    async def get_documents(db: AsyncSession, company_id: UUID):
        stmt = select(KnowledgeDocument).filter(KnowledgeDocument.company_id == company_id)
        result = await db.execute(stmt)
        return result.scalars().all()

    @staticmethod
    async def ingest_document(db: AsyncSession, data: DocumentCreate, company_id: UUID) -> KnowledgeDocument:
        doc = KnowledgeDocument(
            company_id=company_id,
            name=data.name,
            doc_type=data.doc_type,
            source=data.source,
            status="PROCESSING"
        )
        db.add(doc)
        await db.commit()
        await db.refresh(doc)
        return doc

    @staticmethod
    async def process_document_bg(document_id: UUID, company_id: UUID, raw_content: str):
        async with async_session_maker() as db:
            stmt = select(KnowledgeDocument).filter(KnowledgeDocument.id == document_id, KnowledgeDocument.company_id == company_id)
            result = await db.execute(stmt)
            doc = result.scalar_one_or_none()
            
            if not doc:
                logger.error(f"Document {document_id} not found for processing")
                return

            try:
                # 1. Chunking
                chunker = DocumentChunker()
                chunks_text = chunker.chunk_text(raw_content)

                # 2. Embedding
                from app.core.config import settings
                if settings.EMBEDDING_PROVIDER == "gemini":
                    from intelligence.providers.gemini_embedding import GeminiEmbeddingProvider
                    embedder = GeminiEmbeddingProvider()
                elif settings.EMBEDDING_PROVIDER == "mock" and settings.ENVIRONMENT != "production":
                    embedder = MockEmbeddingProvider()
                else:
                    raise ValueError(f"Unsupported or missing EMBEDDING_PROVIDER: {settings.EMBEDDING_PROVIDER}")
                
                # We can embed them one by one or batch
                for i, text in enumerate(chunks_text):
                    embedding_vector = embedder.embed_texts([text])[0]
                    
                    chunk = DocumentChunk(
                        document_id=doc.id,
                        company_id=company_id,
                        content=text,
                        embedding=embedding_vector,
                        chunk_index=i,
                        metadata_json={"source": doc.source, "doc_type": doc.doc_type}
                    )
                    db.add(chunk)
                
                doc.status = "READY"
                await db.commit()
            except Exception as e:
                logger.error(f"Failed to process document {document_id}: {e}")
                doc.status = "FAILED"
                await db.commit()
