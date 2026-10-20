"""Structural and semantic document chunker for knowledge base ingestion.

Preserves section headers, paragraph boundaries, and sentence boundaries while
enforcing configurable size, overlap, and safety limits.
"""

from dataclasses import dataclass, field
import re
from typing import Any, Dict, List, Optional


@dataclass
class DocumentChunkItem:
    """A single structured chunk extracted from a knowledge document."""

    content: str
    chunk_index: int
    section_title: str = ""
    page_number: Optional[int] = None
    metadata: Dict[str, Any] = field(default_factory=dict)


DEFAULT_CHUNK_SIZE: int = 800
DEFAULT_CHUNK_OVERLAP: int = 150
MAX_DOCUMENT_CHARS: int = 2_000_000
MAX_CHUNK_COUNT: int = 5000


class StructuralChunker:
    """Deterministic structural document chunker for tenant knowledge ingestion.

    Features:
    - Detects section headings and attaches section context.
    - Avoids splitting sentences where practical.
    - Prevents empty chunks and excessive/duplicate overlaps.
    - Deterministic and reproducible.
    """

    def __init__(
        self,
        chunk_size: int = DEFAULT_CHUNK_SIZE,
        chunk_overlap: int = DEFAULT_CHUNK_OVERLAP,
        max_chunks: int = MAX_CHUNK_COUNT,
    ) -> None:
        if chunk_overlap >= chunk_size:
            raise ValueError(
                f"chunk_overlap ({chunk_overlap}) must be strictly less than chunk_size ({chunk_size})."
            )
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.max_chunks = max_chunks

    def chunk_document(
        self,
        text: str,
        document_id: Optional[str] = None,
        source: Optional[str] = None,
        extra_metadata: Optional[Dict[str, Any]] = None,
    ) -> List[DocumentChunkItem]:
        """Split document text into structured, section-aware chunks."""
        if not text or not text.strip():
            return []

        # Bound document size for memory safety
        sanitized_text = text[:MAX_DOCUMENT_CHARS]

        # Break text into section blocks based on Markdown / Text headers
        sections = self._split_into_sections(sanitized_text)

        chunks: List[DocumentChunkItem] = []
        chunk_idx = 0

        for section_title, section_text in sections:
            section_chunks = self._chunk_section_text(section_text, section_title)
            for chunk_content in section_chunks:
                if chunk_idx >= self.max_chunks:
                    break

                meta = {
                    "document_id": document_id or "",
                    "source": source or "",
                    "section": section_title,
                    "char_count": len(chunk_content),
                    **(extra_metadata or {}),
                }

                chunks.append(
                    DocumentChunkItem(
                        content=chunk_content,
                        chunk_index=chunk_idx,
                        section_title=section_title,
                        metadata=meta,
                    )
                )
                chunk_idx += 1

            if chunk_idx >= self.max_chunks:
                break

        return chunks

    def _split_into_sections(self, text: str) -> List[tuple[str, str]]:
        """Identify section headings and split text into (heading, body) tuples."""
        lines = text.split("\n")
        sections: List[tuple[str, str]] = []
        current_title = "Overview"
        current_lines: List[str] = []

        header_pattern = re.compile(r"^(#{1,4}\s+|[0-9]+\.[0-9]*\s+|Section\s+[0-9A-Za-z]+[:\.]?\s*)(.+)$", re.IGNORECASE)

        for line in lines:
            stripped = line.strip()
            match = header_pattern.match(stripped)
            if match and len(stripped) < 120:
                # Flush previous section
                if current_lines:
                    sec_body = "\n".join(current_lines).strip()
                    if sec_body:
                        sections.append((current_title, sec_body))
                    current_lines = []
                current_title = match.group(2).strip() or stripped
            else:
                current_lines.append(line)

        # Flush final section
        if current_lines:
            sec_body = "\n".join(current_lines).strip()
            if sec_body:
                sections.append((current_title, sec_body))

        if not sections:
            sections = [("General", text.strip())]

        return sections

    def _chunk_section_text(self, text: str, section_title: str) -> List[str]:
        """Chunk text within a section respecting sentence boundaries."""
        if len(text) <= self.chunk_size:
            return [text.strip()] if text.strip() else []

        chunks: List[str] = []
        start = 0
        text_len = len(text)

        while start < text_len:
            end = min(start + self.chunk_size, text_len)

            if end < text_len:
                # Look for sentence boundary (. \n) in the last 25% of the chunk window
                search_start = max(start, end - int(self.chunk_size * 0.25))
                split_point = -1

                for delim in ["\n\n", ".\n", ". ", "?\n", "? ", "!\n", "! ", "\n", "; "]:
                    idx = text.rfind(delim, search_start, end)
                    if idx != -1:
                        split_point = idx + len(delim)
                        break

                if split_point != -1:
                    end = split_point
                else:
                    # Fallback to last whitespace
                    space_idx = text.rfind(" ", search_start, end)
                    if space_idx != -1:
                        end = space_idx + 1

            chunk_text = text[start:end].strip()
            if chunk_text:
                chunks.append(chunk_text)

            if end >= text_len:
                break

            # Calculate next start with overlap
            next_start = end - self.chunk_overlap
            if next_start <= start:
                next_start = end
            start = next_start

        return chunks
