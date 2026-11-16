"""add proposals approvals outcomes and saved searches

Revision ID: a1b2c3d4e5f6
Revises: ef62fe967e03
Create Date: 2026-10-29 20:15:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, Sequence[str], None] = 'ef62fe967e03'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    json_type = sa.JSON().with_variant(postgresql.JSONB(astext_type=sa.Text()), 'postgresql')

    # 1. saved_searches
    op.create_table(
        'saved_searches',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('organization_id', sa.Uuid(), nullable=False),
        sa.Column('user_id', sa.Uuid(), nullable=True),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('filters', json_type, nullable=True),
        sa.Column('cadence', sa.String(length=50), nullable=False),
        sa.Column('last_run_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('matches_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id']),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_saved_searches_organization_id'), 'saved_searches', ['organization_id'], unique=False)

    # 2. approval_step_records
    op.create_table(
        'approval_step_records',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('bid_id', sa.Uuid(), nullable=False),
        sa.Column('flow_type', sa.String(length=50), nullable=False),
        sa.Column('step_name', sa.String(length=255), nullable=False),
        sa.Column('step_order', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('required_role', sa.String(length=50), nullable=False),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='pending'),
        sa.Column('approver_id', sa.Uuid(), nullable=True),
        sa.Column('approver_name', sa.String(length=255), nullable=True),
        sa.Column('decision_notes', sa.Text(), nullable=True),
        sa.Column('decided_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('is_invalidated', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['approver_id'], ['users.id']),
        sa.ForeignKeyConstraint(['bid_id'], ['bids.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('bid_id', 'flow_type')
    )
    op.create_index(op.f('ix_approval_step_records_bid_id'), 'approval_step_records', ['bid_id'], unique=False)

    # 3. submission_records
    op.create_table(
        'submission_records',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('bid_id', sa.Uuid(), nullable=False),
        sa.Column('organization_id', sa.Uuid(), nullable=False),
        sa.Column('submission_reference', sa.String(length=100), nullable=False),
        sa.Column('submitted_by_id', sa.Uuid(), nullable=True),
        sa.Column('submitted_by_name', sa.String(length=255), nullable=True),
        sa.Column('submitted_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('sha256_package_hash', sa.String(length=64), nullable=False),
        sa.Column('package_manifest', json_type, nullable=True),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='submitted'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['bid_id'], ['bids.id']),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id']),
        sa.ForeignKeyConstraint(['submitted_by_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('bid_id'),
        sa.UniqueConstraint('submission_reference')
    )
    op.create_index(op.f('ix_submission_records_bid_id'), 'submission_records', ['bid_id'], unique=True)
    op.create_index(op.f('ix_submission_records_organization_id'), 'submission_records', ['organization_id'], unique=False)
    op.create_index(op.f('ix_submission_records_submission_reference'), 'submission_records', ['submission_reference'], unique=True)

    # 4. outcome_records
    op.create_table(
        'outcome_records',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('bid_id', sa.Uuid(), nullable=False),
        sa.Column('organization_id', sa.Uuid(), nullable=False),
        sa.Column('outcome_status', sa.String(length=50), nullable=False),
        sa.Column('awarded_amount', sa.Numeric(precision=18, scale=2), nullable=True),
        sa.Column('contract_reference', sa.String(length=100), nullable=True),
        sa.Column('winner_name', sa.String(length=255), nullable=True),
        sa.Column('winning_bid_amount', sa.Numeric(precision=18, scale=2), nullable=True),
        sa.Column('price_variance_percent', sa.Numeric(precision=6, scale=2), nullable=True),
        sa.Column('technical_score', sa.Numeric(precision=5, scale=2), nullable=True),
        sa.Column('financial_rank', sa.Integer(), nullable=True),
        sa.Column('debrief_notes', sa.Text(), nullable=True),
        sa.Column('lessons_learned', sa.Text(), nullable=True),
        sa.Column('recorded_by_id', sa.Uuid(), nullable=True),
        sa.Column('recorded_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['bid_id'], ['bids.id']),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id']),
        sa.ForeignKeyConstraint(['recorded_by_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('bid_id')
    )
    op.create_index(op.f('ix_outcome_records_bid_id'), 'outcome_records', ['bid_id'], unique=True)
    op.create_index(op.f('ix_outcome_records_organization_id'), 'outcome_records', ['organization_id'], unique=False)

    # 5. proposals
    op.create_table(
        'proposals',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('organization_id', sa.Uuid(), nullable=False),
        sa.Column('bid_id', sa.Uuid(), nullable=False),
        sa.Column('tender_id', sa.Uuid(), nullable=False),
        sa.Column('title', sa.String(length=500), nullable=False),
        sa.Column('template_name', sa.String(length=100), nullable=False, server_default='standard_single_stage_two_envelope'),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='draft'),
        sa.Column('version', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('summary', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['bid_id'], ['bids.id']),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id']),
        sa.ForeignKeyConstraint(['tender_id'], ['tenders.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('bid_id')
    )
    op.create_index(op.f('ix_proposals_bid_id'), 'proposals', ['bid_id'], unique=True)
    op.create_index(op.f('ix_proposals_organization_id'), 'proposals', ['organization_id'], unique=False)
    op.create_index(op.f('ix_proposals_tender_id'), 'proposals', ['tender_id'], unique=False)

    # 6. proposal_sections
    op.create_table(
        'proposal_sections',
        sa.Column('id', sa.Uuid(), nullable=False),
        sa.Column('proposal_id', sa.Uuid(), nullable=False),
        sa.Column('section_key', sa.String(length=100), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('order_index', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('envelope_type', sa.String(length=50), nullable=False, server_default='technical'),
        sa.Column('content', sa.Text(), nullable=False, server_default=''),
        sa.Column('is_ai_generated', sa.Boolean(), nullable=False, server_default=sa.text('false')),
        sa.Column('citations', json_type, nullable=True),
        sa.Column('placeholders', json_type, nullable=True),
        sa.Column('status', sa.String(length=50), nullable=False, server_default='draft'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['proposal_id'], ['proposals.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('proposal_id', 'section_key')
    )
    op.create_index(op.f('ix_proposal_sections_proposal_id'), 'proposal_sections', ['proposal_id'], unique=False)


def downgrade() -> None:
    op.drop_table('proposal_sections')
    op.drop_table('proposals')
    op.drop_table('outcome_records')
    op.drop_table('submission_records')
    op.drop_table('approval_step_records')
    op.drop_table('saved_searches')

