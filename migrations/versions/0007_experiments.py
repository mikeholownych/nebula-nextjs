"""experiments table

Revision ID: 0007_experiments
Revises: 0006_ai_rewrites
Create Date: 2026-08-05

Experiment tracking (Feature 7). Users log a change to a URL; Nebula
captures a baseline (latest audit score + GSC position/CTR) and tracks
current metrics until the experiment is concluded.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '0007_experiments'
down_revision: Union[str, None] = '0006_ai_rewrites'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'experiments',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text('gen_random_uuid()')),
        sa.Column('user_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('users.id', ondelete='CASCADE'),
                  nullable=False),
        sa.Column('url', sa.Text, nullable=False),
        sa.Column('description', sa.Text, nullable=False),
        sa.Column('finding_keys', postgresql.ARRAY(sa.Text), nullable=True),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text('now()')),
        sa.Column('concluded_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('status', sa.Text, nullable=False,
                  server_default=sa.text("'running'")),
        sa.Column('baseline_score', sa.Numeric(4, 1), nullable=True),
        sa.Column('baseline_position', sa.Numeric(5, 1), nullable=True),
        sa.Column('baseline_ctr', sa.Numeric(5, 4), nullable=True),
        sa.Column('current_score', sa.Numeric(4, 1), nullable=True),
        sa.Column('current_position', sa.Numeric(5, 1), nullable=True),
        sa.Column('current_ctr', sa.Numeric(5, 4), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text('now()')),
        sa.CheckConstraint(
            "status IN ('running', 'concluded', 'inconclusive')",
            name='ck_experiments_status',
        ),
    )
    op.create_index('ix_experiments_user_id', 'experiments', ['user_id'])


def downgrade() -> None:
    op.drop_index('ix_experiments_user_id', table_name='experiments')
    op.drop_table('experiments')
