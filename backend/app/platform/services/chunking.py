from typing import List

class DocumentChunker:
    """
    Deterministic document chunking.
    Splits text by chunk size and overlap without depending on external libraries
    like LangChain for now to keep it lightweight.
    """
    def __init__(self, chunk_size: int = 1000, chunk_overlap: int = 200):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    def chunk_text(self, text: str) -> List[str]:
        if not text:
            return []
            
        chunks = []
        start = 0
        text_length = len(text)
        
        while start < text_length:
            end = min(start + self.chunk_size, text_length)
            
            # If we're not at the end of the text, try to find a newline or space to break at
            if end < text_length:
                # Try to find a newline in the last 20% of the chunk
                search_start = max(start, end - int(self.chunk_size * 0.2))
                last_newline = text.rfind('\n', search_start, end)
                
                if last_newline != -1:
                    end = last_newline + 1 # Include the newline
                else:
                    # Fallback to space
                    last_space = text.rfind(' ', search_start, end)
                    if last_space != -1:
                        end = last_space + 1
            
            chunks.append(text[start:end].strip())
            
            if end >= text_length:
                break
                
            start = end - self.chunk_overlap
            
        return [c for c in chunks if c]
