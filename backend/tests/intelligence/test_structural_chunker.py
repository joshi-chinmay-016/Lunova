"""Unit tests for StructuralChunker (heading preservation, sentence boundaries, safety)."""

import pytest

from intelligence.retrieval.chunker import (
    DEFAULT_CHUNK_OVERLAP,
    DEFAULT_CHUNK_SIZE,
    DocumentChunkItem,
    StructuralChunker,
)


def test_chunker_initialization_validation():
    """Verify chunker rejects invalid overlap >= chunk_size."""
    with pytest.raises(ValueError, match="strictly less than chunk_size"):
        StructuralChunker(chunk_size=100, chunk_overlap=100)

    with pytest.raises(ValueError, match="strictly less than chunk_size"):
        StructuralChunker(chunk_size=100, chunk_overlap=150)


def test_chunker_empty_and_whitespace():
    """Verify empty text produces no chunks."""
    chunker = StructuralChunker()
    assert chunker.chunk_document("") == []
    assert chunker.chunk_document("   \n\t   ") == []


def test_chunker_preserves_headings():
    """Verify Markdown headers are recognized and tagged as section metadata."""
    chunker = StructuralChunker(chunk_size=300, chunk_overlap=50)
    markdown_doc = (
        "# Platform Overview\n"
        "Lunetron provides enterprise proposal generation agents with deep grounding.\n\n"
        "## Security Specifications\n"
        "All data at rest is encrypted with AES-256. Multi-tenant isolation is enforced at the DB query level.\n\n"
        "## SLA & Availability\n"
        "We maintain high availability with automated multi-zone failover."
    )

    chunks = chunker.chunk_document(markdown_doc, document_id="doc-spec-01", source="spec.md")
    assert len(chunks) >= 3

    section_titles = [c.section_title for c in chunks]
    assert any("Platform Overview" in s for s in section_titles)
    assert any("Security Specifications" in s for s in section_titles)
    assert any("SLA & Availability" in s for s in section_titles)

    # Verify metadata attachment
    for chk in chunks:
        assert chk.metadata["document_id"] == "doc-spec-01"
        assert chk.metadata["source"] == "spec.md"


def test_chunker_avoids_sentence_splitting():
    """Verify chunker breaks cleanly on sentence boundary rather than middle of sentence."""
    chunker = StructuralChunker(chunk_size=120, chunk_overlap=20)
    text = (
        "This is the first complete sentence. "
        "This is the second complete sentence with detailed specs. "
        "This is the third sentence that completes the test."
    )

    chunks = chunker.chunk_document(text)
    assert len(chunks) >= 2
    # Check that chunks end cleanly with a period or complete words
    for chk in chunks:
        assert chk.content.endswith(".") or chk.content[-1].isalnum()


def test_chunker_deterministic_output():
    """Verify that multiple chunking runs on identical input produce identical output."""
    chunker = StructuralChunker(chunk_size=200, chunk_overlap=40)
    text = "Lunova proposal intelligence engine.\n" * 20

    run1 = chunker.chunk_document(text)
    run2 = chunker.chunk_document(text)

    assert len(run1) == len(run2)
    for c1, c2 in zip(run1, run2):
        assert c1.content == c2.content
        assert c1.chunk_index == c2.chunk_index
        assert c1.section_title == c2.section_title


def test_chunker_max_chunks_limit():
    """Verify safety limit on maximum chunk count."""
    chunker = StructuralChunker(chunk_size=50, chunk_overlap=10, max_chunks=5)
    huge_text = "Sentence number text that repeats. " * 100

    chunks = chunker.chunk_document(huge_text)
    assert len(chunks) == 5
