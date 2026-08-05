"""audit_schedules table

Revision ID: 0004_audit_schedules
Revises: 0003_gsc_connections
Create Date: 2026-08-05

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '0004_audit_schedules'
down_revision: Union[str, None] = '0003_gsc_connections'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'audit_schedules',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text('gen_random_uuid()')),
        sa.Column('user_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('users.id', ondelete='CASCADE'),
                  nullable=False),
        sa.Column('url', sa.Text, nullable=False),
        sa.Column('interval_days', sa.Integer, server_default='7'),
        sa.Column('next_run_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('enabled', sa.Boolean, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True),
                  nullable=False,
                  server_default=sa.text('now()')),
    )
    op.create_index(
        'ix_audit_schedules_user_url',
        'audit_schedules',
        ['user_id', 'url'],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index('ix_audit_schedules_user_url', table_name='audit_schedules')
    op.drop_table('audit_schedules')
