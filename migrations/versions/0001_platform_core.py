"""platform core schema

Revision ID: 0001_platform_core
Revises:
Create Date: 2026-07-14

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
down_revision = None
branch_labels = None
depends_on = None

revision = '0001_platform_core'


def upgrade() -> None:
    # Users table
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('email', sa.String(255), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id', name='pk_users')
    )

    # User identities table
    op.create_table(
        'user_identities',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('issuer', sa.String(255), nullable=False),
        sa.Column('subject', sa.String(255), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], name='fk_user_identities_user_id', ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', name='pk_user_identities'),
        sa.UniqueConstraint('issuer', 'subject', name='uq_user_identities_issuer_subject')
    )
    op.create_index('ix_user_identities_user_id', 'user_identities', ['user_id'])

    # Organizations table
    op.create_table(
        'organizations',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('slug', sa.String(100), nullable=False),
        sa.Column('is_agency', sa.Boolean, nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.PrimaryKeyConstraint('id', name='pk_organizations'),
        sa.UniqueConstraint('slug', name='uq_organizations_slug')
    )

    # Memberships table
    op.create_table(
        'memberships',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('organization_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('role', sa.String(50), nullable=False, server_default='member'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], name='fk_memberships_user_id', ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id'], name='fk_memberships_organization_id', ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', name='pk_memberships'),
        sa.UniqueConstraint('user_id', 'organization_id', name='uq_memberships_user_organization')
    )
    op.create_index('ix_memberships_organization_id', 'memberships', ['organization_id'])

    # Subscriptions table
    op.create_table(
        'subscriptions',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('organization_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('stripe_subscription_id', sa.String(255), nullable=True),
        sa.Column('stripe_customer_id', sa.String(255), nullable=True),
        sa.Column('status', sa.String(50), nullable=False, server_default='active'),
        sa.Column('plan', sa.String(100), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id'], name='fk_subscriptions_organization_id', ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id', name='pk_subscriptions')
    )
    op.create_index('ix_subscriptions_organization_id', 'subscriptions', ['organization_id'])
    op.create_index('ix_subscriptions_stripe_subscription_id', 'subscriptions', ['stripe_subscription_id'])

    # Audit events table
    op.create_table(
        'audit_events',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('organization_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('event_type', sa.String(100), nullable=False),
        sa.Column('event_data', sa.Text, nullable=True),
        sa.Column('request_id', sa.String(100), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['organization_id'], ['organizations.id'], name='fk_audit_events_organization_id', ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], name='fk_audit_events_user_id', ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id', name='pk_audit_events')
    )
    op.create_index('ix_audit_events_organization_id', 'audit_events', ['organization_id'])
    op.create_index('ix_audit_events_created_at', 'audit_events', ['created_at'])


def downgrade() -> None:
    op.drop_index('ix_audit_events_created_at', 'audit_events')
    op.drop_index('ix_audit_events_organization_id', 'audit_events')
    op.drop_table('audit_events')

    op.drop_index('ix_subscriptions_stripe_subscription_id', 'subscriptions')
    op.drop_index('ix_subscriptions_organization_id', 'subscriptions')
    op.drop_table('subscriptions')

    op.drop_index('ix_memberships_organization_id', 'memberships')
    op.drop_table('memberships')

    op.drop_table('organizations')

    op.drop_index('ix_user_identities_user_id', 'user_identities')
    op.drop_table('user_identities')

    op.drop_table('users')
