"""competitor_tracking table

Revision ID: 0005_competitor_tracking
Revises: 0004_audit_schedules
Create Date: 2026-08-05

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '0005_competitor_tracking'
down_revision: Union[str, None] = '0004_audit_schedules'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'competitor_tracking',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text('gen_random_uuid()')),
        sa.Column('user_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('users.id', ondelete='CASCADE'),
                  nullable=False),
        sa.Column('competitor_url', sa.Text, nullable=False),
        sa.Column('label', sa.Text, nullable=True),
        sa.Column('last_score', sa.Numeric(4, 1), nullable=True),
        sa.Column('last_audited_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True),
                  nullable=False,
                  server_default=sa.text('now()')),
    )
    op.create_index(
        'ix_competitor_tracking_user_url',
        'competitor_tracking',
        ['user_id', 'competitor_url'],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index('ix_competitor_tracking_user_url', table_name='competitor_tracking')
    op.drop_table('competitor_tracking')
