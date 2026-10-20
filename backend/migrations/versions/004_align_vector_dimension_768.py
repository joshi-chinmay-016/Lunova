"""align vector dimension to 768 for Gemini text-embedding-004

Revision ID: 004_align_vector_dimension_768
Revises: 3a8127b6fcd9
Create Date: 2026-10-20 12:00:00.000000

Reconciles the database vector column (previously 1536) and the configuration
default (previously 3072) with Google Gemini's official text-embedding-004 model (768).
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from pgvector.sqlalchemy import Vector

# revision identifiers, used by Alembic.
revision: str = '004_align_vector_dimension_768'
down_revision: Union[str, None] = '3a8127b6fcd9'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Ensure any legacy mismatched embeddings are nulled before altering dimension
    # Documents can then be re-embedded cleanly via DocumentService.
    op.execute("UPDATE document_chunks SET embedding = NULL WHERE embedding IS NOT NULL")
    op.execute("ALTER TABLE document_chunks ALTER COLUMN embedding TYPE vector(768)")


def downgrade() -> None:
    op.execute("UPDATE document_chunks SET embedding = NULL WHERE embedding IS NOT NULL")
    op.execute("ALTER TABLE document_chunks ALTER COLUMN embedding TYPE vector(1536)")
