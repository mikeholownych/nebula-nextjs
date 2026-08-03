"""auth enhancements

Revision ID: 0002_auth_enhancements
Revises: 0001_platform_core
Create Date: 2026-08-03

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
down_revision = '0001_platform_core'
branch_labels = None
depends_on = None

revision = '0002_auth_enhancements'


def upgrade() -> None:
    # Add columns to users table
    op.add_column('users', sa.Column('name', sa.String(255), nullable=True))
    op.add_column('users', sa.Column('picture', sa.Text, nullable=True))
    op.add_column('users', sa.Column('status', sa.String(20), nullable=False, server_default='active'))
    op.add_column('users', sa.Column('email_verified_at', sa.DateTime(timezone=True), nullable=True))

    # CHECK constraint on users.status
    op.create_check_constraint(
        'ck_users_status',
        'users',
        "status IN ('active', 'suspended', 'disabled')"
    )

    # Partial unique index on users(email) WHERE email IS NOT NULL
    op.create_index(
        'ix_users_email_unique',
        'users',
        ['email'],
        unique=True,
        postgresql_where=sa.text('email IS NOT NULL')
    )

    # Add status column to memberships table
    op.add_column('memberships', sa.Column('status', sa.String(20), nullable=False, server_default='active'))

    # CHECK constraint on memberships.status
    op.create_check_constraint(
        'ck_memberships_status',
        'memberships',
        "status IN ('active', 'suspended', 'removed')"
    )


def downgrade() -> None:
    # Remove memberships status
    op.drop_constraint('ck_memberships_status', 'memberships', type_='check')
    op.drop_column('memberships', 'status')

    # Remove users enhancements
    op.drop_index('ix_users_email_unique', 'users')
    op.drop_constraint('ck_users_status', 'users', type_='check')
    op.drop_column('users', 'email_verified_at')
    op.drop_column('users', 'status')
    op.drop_column('users', 'picture')
    op.drop_column('users', 'name')
