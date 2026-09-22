from app.ai.rag.chunking import DocumentChunker

def test_document_chunker_basic():
    chunker = DocumentChunker(chunk_size=10, chunk_overlap=2)
    text = "0123456789abcdef"
    # Chunk 1: 0123456789 (len 10)
    # Chunk 2 (overlap 2 starts at index 8): 89abcdef (len 8)
    chunks = chunker.chunk_text(text)
    
    assert len(chunks) == 2
    assert chunks[0] == "0123456789"
    assert chunks[1] == "89abcdef"

def test_document_chunker_newline_fallback():
    # It tries to find newline in the last 20%
    # chunk_size=20, 20% is 4 chars (index 16-20)
    chunker = DocumentChunker(chunk_size=20, chunk_overlap=0)
    text = "This is a sentence.\nThis is another."
    # len = 35. "This is a sentence.\n" is 20 chars long.
    chunks = chunker.chunk_text(text)
    
    # Should break cleanly at the newline
    assert chunks[0] == "This is a sentence."
    assert chunks[1] == "This is another."
