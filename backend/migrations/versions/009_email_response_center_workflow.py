"""email response center workflow enhancements

Revision ID: 009_email_response_center
Revises: 008_add_dispatch_states
Create Date: 2026-11-27 12:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '009_email_response_center'
down_revision: Union[str, None] = '008_add_dispatch_states'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    bind = op.get_bind()
    dialect = bind.dialect.name

    # 1. Update proposalstatus enum if postgresql
    if dialect == "postgresql":
        for val in ['CLASSIFIED', 'DRAFT_GENERATED', 'NEEDS_INFORMATION', 'NEEDS_ADMIN_REVIEW', 'SEND_FAILED']:
            op.execute(f"ALTER TYPE proposalstatus ADD VALUE IF NOT EXISTS '{val}'")

    # 2. Add columns to proposals table
    op.add_column('proposals', sa.Column('classification', sa.String(), nullable=True, server_default='CUSTOMER_REQUEST'))
    op.add_column('proposals', sa.Column('requirements', sa.JSON(), nullable=True))
    op.add_column('proposals', sa.Column('sources', sa.JSON(), nullable=True))
    op.add_column('proposals', sa.Column('generated_response', sa.JSON(), nullable=True))
    op.add_column('proposals', sa.Column('confidence', sa.JSON(), nullable=True))
    op.add_column('proposals', sa.Column('missing_information', sa.JSON(), nullable=True))
    op.add_column('proposals', sa.Column('clarification_questions', sa.JSON(), nullable=True))

    op.create_index(op.f('ix_proposals_classification'), 'proposals', ['classification'], unique=False)

    # 3. Add column to emails table
    op.add_column('emails', sa.Column('classification', sa.String(), nullable=True))
    op.create_index(op.f('ix_emails_classification'), 'emails', ['classification'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_emails_classification'), table_name='emails')
    op.drop_column('emails', 'classification')

    op.drop_index(op.f('ix_proposals_classification'), table_name='proposals')
    op.drop_column('proposals', 'clarification_questions')
    op.drop_column('proposals', 'missing_information')
    op.drop_column('proposals', 'confidence')
    op.drop_column('proposals', 'generated_response')
    op.drop_column('proposals', 'sources')
    op.drop_column('proposals', 'requirements')
    op.drop_column('proposals', 'classification')
