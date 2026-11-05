"""add email_attachments table and link emails to email_accounts

Revision ID: 007_add_email_attachments_and_links
Revises: 006_add_oauth_states
Create Date: 2026-11-04 20:45:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '007_email_attachments'
down_revision: Union[str, None] = '006_add_oauth_states'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Add email_account_id to emails table
    op.add_column('emails', sa.Column('email_account_id', sa.UUID(), nullable=True))
    op.create_foreign_key(
        'fk_emails_email_account_id',
        'emails',
        'email_accounts',
        ['email_account_id'],
        ['id'],
        ondelete='SET NULL',
    )
    op.create_index(op.f('ix_emails_email_account_id'), 'emails', ['email_account_id'], unique=False)
    op.create_index(op.f('ix_emails_message_id'), 'emails', ['message_id'], unique=False)

    # 2. Create email_attachments table
    op.create_table(
        'email_attachments',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('company_id', sa.UUID(), nullable=False),
        sa.Column('email_id', sa.UUID(), nullable=False),
        sa.Column('proposal_id', sa.UUID(), nullable=True),
        sa.Column('filename', sa.String(), nullable=False),
        sa.Column('content_type', sa.String(), nullable=False),
        sa.Column('file_size_bytes', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('storage_path', sa.String(), nullable=True),
        sa.Column('extracted_text', sa.Text(), nullable=True),
        sa.Column('parsing_status', sa.String(), nullable=False, server_default='SUCCESS'),
        sa.Column('page_count', sa.Integer(), nullable=True),
        sa.Column('error_message', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['email_id'], ['emails.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['proposal_id'], ['proposals.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index(op.f('ix_email_attachments_company_id'), 'email_attachments', ['company_id'], unique=False)
    op.create_index(op.f('ix_email_attachments_email_id'), 'email_attachments', ['email_id'], unique=False)
    op.create_index(op.f('ix_email_attachments_proposal_id'), 'email_attachments', ['proposal_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_email_attachments_proposal_id'), table_name='email_attachments')
    op.drop_index(op.f('ix_email_attachments_email_id'), table_name='email_attachments')
    op.drop_index(op.f('ix_email_attachments_company_id'), table_name='email_attachments')
    op.drop_table('email_attachments')

    op.drop_index(op.f('ix_emails_message_id'), table_name='emails')
    op.drop_index(op.f('ix_emails_email_account_id'), table_name='emails')
    op.drop_constraint('fk_emails_email_account_id', 'emails', type_='foreignkey')
    op.drop_column('emails', 'email_account_id')

