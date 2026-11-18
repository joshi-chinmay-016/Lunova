"""add dispatch states SENDING and DISPATCH_UNCERTAIN to proposalstatus enum

Revision ID: 008_add_dispatch_states
Revises: 007_add_email_attachments_and_links
Create Date: 2026-11-04 22:30:00.000000

"""
from typing import Sequence, Union
from alembic import op


# revision identifiers, used by Alembic.
revision: str = '008_add_dispatch_states'
down_revision: Union[str, None] = '007_email_attachments'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        op.execute("ALTER TYPE proposalstatus ADD VALUE IF NOT EXISTS 'SENDING'")
        op.execute("ALTER TYPE proposalstatus ADD VALUE IF NOT EXISTS 'DISPATCH_UNCERTAIN'")


def downgrade() -> None:
    pass
