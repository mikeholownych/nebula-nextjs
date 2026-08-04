"""gsc_connections table

Revision ID: 0003_gsc_connections
Revises: 0002_auth_enhancements
Create Date: 2026-08-04

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '0003_gsc_connections'
down_revision: Union[str, None] = '0002_auth_enhancements'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'gsc_connections',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text('gen_random_uuid()')),
        # One GSC connection per user (unique constraint)
        sa.Column('user_id', postgresql.UUID(as_uuid=True),
                  sa.ForeignKey('users.id', ondelete='CASCADE'),
                  nullable=False, unique=True),
        # TODO: encrypt access_token at rest using a KMS/symmetric key before production
        sa.Column('access_token', sa.Text, nullable=True),
        sa.Column('refresh_token', sa.Text, nullable=True),
        sa.Column('token_expiry', sa.DateTime(timezone=True), nullable=True),
        sa.Column('gsc_site_url', sa.Text, nullable=True),
        sa.Column('connected_at', sa.DateTime(timezone=True),
                  nullable=False,
                  server_default=sa.text('now()')),
    )
    op.create_index('ix_gsc_connections_user_id', 'gsc_connections', ['user_id'])


def downgrade() -> None:
    op.drop_index('ix_gsc_connections_user_id', table_name='gsc_connections')
    op.drop_table('gsc_connections')
