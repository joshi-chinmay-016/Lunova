"""initial

Revision ID: 001
Revises: 
Create Date: 2023-10-25 10:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '001'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 1. Create vector extension
    op.execute('CREATE EXTENSION IF NOT EXISTS vector')

    # 2. Create Enums
    proposal_status = postgresql.ENUM('RECEIVED', 'PROCESSING', 'ANALYZED', 'REVIEW_REQUIRED', 'APPROVED', 'SENT', 'FAILED', 'REJECTED', name='proposalstatus', create_type=False)
    proposal_status.create(op.get_bind())

    email_direction = postgresql.ENUM('INCOMING', 'OUTGOING', name='emaildirection', create_type=False)
    email_direction.create(op.get_bind())

    # 3. Create Tables
    op.create_table('companies',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )

    op.create_table('users',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('company_id', sa.UUID(), nullable=False),
        sa.Column('email', sa.String(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_company_id'), 'users', ['company_id'], unique=False)
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=False)

    op.create_table('proposals',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('company_id', sa.UUID(), nullable=False),
        sa.Column('status', proposal_status, nullable=False),
        sa.Column('title', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_proposals_company_id'), 'proposals', ['company_id'], unique=False)
    op.create_index(op.f('ix_proposals_status'), 'proposals', ['status'], unique=False)

    op.create_table('emails',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('company_id', sa.UUID(), nullable=False),
        sa.Column('proposal_id', sa.UUID(), nullable=True),
        sa.Column('direction', email_direction, nullable=False),
        sa.Column('sender_address', sa.String(), nullable=False),
        sa.Column('recipient_address', sa.String(), nullable=False),
        sa.Column('subject', sa.String(), nullable=True),
        sa.Column('body', sa.Text(), nullable=True),
        sa.Column('message_id', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['proposal_id'], ['proposals.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_emails_company_id'), 'emails', ['company_id'], unique=False)
    op.create_index(op.f('ix_emails_proposal_id'), 'emails', ['proposal_id'], unique=False)

    op.create_table('knowledge_documents',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('company_id', sa.UUID(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('doc_type', sa.String(), nullable=True),
        sa.Column('source', sa.String(), nullable=True),
        sa.Column('status', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_knowledge_documents_company_id'), 'knowledge_documents', ['company_id'], unique=False)

    op.create_table('reviews',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('company_id', sa.UUID(), nullable=False),
        sa.Column('proposal_id', sa.UUID(), nullable=False),
        sa.Column('reviewer_id', sa.UUID(), nullable=True),
        sa.Column('comments', sa.Text(), nullable=True),
        sa.Column('status', sa.String(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['proposal_id'], ['proposals.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['reviewer_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_reviews_company_id'), 'reviews', ['company_id'], unique=False)
    op.create_index(op.f('ix_reviews_proposal_id'), 'reviews', ['proposal_id'], unique=False)

    op.create_table('audit_logs',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('company_id', sa.UUID(), nullable=False),
        sa.Column('proposal_id', sa.UUID(), nullable=True),
        sa.Column('user_id', sa.UUID(), nullable=True),
        sa.Column('action', sa.String(), nullable=False),
        sa.Column('details', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['company_id'], ['companies.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['proposal_id'], ['proposals.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_audit_logs_company_id'), 'audit_logs', ['company_id'], unique=False)
    op.create_index(op.f('ix_audit_logs_proposal_id'), 'audit_logs', ['proposal_id'], unique=False)

def downgrade() -> None:
    op.drop_table('audit_logs')
    op.drop_table('reviews')
    op.drop_table('knowledge_documents')
    op.drop_table('emails')
    op.drop_table('proposals')
    op.drop_table('users')
    op.drop_table('companies')
    
    op.execute('DROP TYPE emaildirection')
    op.execute('DROP TYPE proposalstatus')
    
    # We leave vector extension as dropping it might drop user data from other schema
