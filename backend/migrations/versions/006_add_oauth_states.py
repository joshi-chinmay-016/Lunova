"""add oauth_states table for durable replay prevention

Revision ID: 006_add_oauth_states
Revises: 005_add_email_accounts
Create Date: 2026-10-21 12:35:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '006_add_oauth_states'
down_revision: Union[str, None] = '005_add_email_accounts'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'oauth_states',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('company_id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('nonce', sa.String(length=64), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('consumed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('nonce', name='uq_oauth_states_nonce'),
    )
    op.create_index(op.f('ix_oauth_states_company_id'), 'oauth_states', ['company_id'], unique=False)
    op.create_index(op.f('ix_oauth_states_user_id'), 'oauth_states', ['user_id'], unique=False)
    op.create_index(op.f('ix_oauth_states_nonce'), 'oauth_states', ['nonce'], unique=True)
    op.create_index(op.f('ix_oauth_states_expires_at'), 'oauth_states', ['expires_at'], unique=False)
    op.create_index(op.f('ix_oauth_states_consumed_at'), 'oauth_states', ['consumed_at'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_oauth_states_consumed_at'), table_name='oauth_states')
    op.drop_index(op.f('ix_oauth_states_expires_at'), table_name='oauth_states')
    op.drop_index(op.f('ix_oauth_states_nonce'), table_name='oauth_states')
    op.drop_index(op.f('ix_oauth_states_user_id'), table_name='oauth_states')
    op.drop_index(op.f('ix_oauth_states_company_id'), table_name='oauth_states')
    op.drop_table('oauth_states')
