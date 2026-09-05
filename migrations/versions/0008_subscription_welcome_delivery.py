"""subscription welcome delivery state

Revision ID: 0008_subscription_welcome
Revises: 0007_experiments
Create Date: 2026-08-25

Adds durable retry state used by subscription_welcome_email_retry.py.
Recipient email remains authoritative through organization membership and users,
not duplicated on subscriptions.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0008_subscription_welcome"
down_revision: Union[str, None] = "0007_experiments"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "subscriptions",
        sa.Column("welcome_email_enqueued_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "subscriptions",
        sa.Column(
            "welcome_email_attempts",
            sa.Integer(),
            nullable=False,
            server_default=sa.text("0"),
        ),
    )
    op.add_column(
        "subscriptions",
        sa.Column("welcome_email_last_error", sa.Text(), nullable=True),
    )
    op.create_check_constraint(
        "ck_subscriptions_welcome_email_attempts",
        "subscriptions",
        "welcome_email_attempts >= 0 AND welcome_email_attempts <= 5",
    )
    op.create_index(
        "ix_subscriptions_welcome_retry",
        "subscriptions",
        ["created_at"],
        postgresql_where=sa.text(
            "welcome_email_enqueued_at IS NULL "
            "AND welcome_email_attempts < 5"
        ),
    )


def downgrade() -> None:
    op.drop_index("ix_subscriptions_welcome_retry", table_name="subscriptions")
    op.drop_constraint(
        "ck_subscriptions_welcome_email_attempts",
        "subscriptions",
        type_="check",
    )
    op.drop_column("subscriptions", "welcome_email_last_error")
    op.drop_column("subscriptions", "welcome_email_attempts")
    op.drop_column("subscriptions", "welcome_email_enqueued_at")
