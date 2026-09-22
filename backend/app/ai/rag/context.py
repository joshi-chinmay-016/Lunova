from typing import List
from app.ai.contracts.retrieval import RetrievedChunk

class ContextBuilder:
    """
    Assembles retrieved chunks into a formatted string for the LLM context.
    """
    
    @staticmethod
    def build_context(chunks: List[RetrievedChunk]) -> str:
        if not chunks:
            return "No relevant company knowledge found."
            
        context_parts = []
        for i, chunk in enumerate(chunks, 1):
            source_info = chunk.metadata.get("source", f"Document {chunk.document_id}")
            context_parts.append(f"--- SOURCE {i}: {source_info} (ID: {chunk.chunk_id}) ---\n{chunk.content}\n")
            
        return "\n".join(context_parts)
