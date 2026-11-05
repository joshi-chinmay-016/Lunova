"""add email_accounts and email thread_id

Revision ID: 005_add_email_accounts
Revises: 004_align_vector_dimension_768
Create Date: 2026-10-21 11:35:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '005_add_email_accounts'
down_revision: Union[str, None] = '004_align_vector_dimension_768'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Create email_accounts table
    op.create_table(
        'email_accounts',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('company_id', sa.UUID(), nullable=False),
        sa.Column('provider', sa.String(), nullable=False),
        sa.Column('email_address', sa.String(), nullable=False),
        sa.Column('encrypted_access_token', sa.Text(), nullable=False),
        sa.Column('encrypted_refresh_token', sa.Text(), nullable=True),
        sa.Column('token_expiry', sa.DateTime(timezone=True), nullable=True),
        sa.Column('history_id', sa.String(), nullable=True),
        sa.Column('last_synced_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint(
            'company_id',
            'provider',
            'email_address',
            name='uq_email_accounts_company_provider_email'
        )
    )
    op.create_index(op.f('ix_email_accounts_company_id'), 'email_accounts', ['company_id'], unique=False)
    op.create_index(op.f('ix_email_accounts_email_address'), 'email_accounts', ['email_address'], unique=False)

    # 2. Add nullable thread_id to emails table preserving existing records
    op.add_column('emails', sa.Column('thread_id', sa.String(), nullable=True))
    op.create_index(op.f('ix_emails_thread_id'), 'emails', ['thread_id'], unique=False)


def downgrade() -> None:
    # 1. Revert thread_id from emails table
    op.drop_index(op.f('ix_emails_thread_id'), table_name='emails')
    op.drop_column('emails', 'thread_id')

    # 2. Drop email_accounts table
    op.drop_index(op.f('ix_email_accounts_email_address'), table_name='email_accounts')
    op.drop_index(op.f('ix_email_accounts_company_id'), table_name='email_accounts')
    op.drop_table('email_accounts')
