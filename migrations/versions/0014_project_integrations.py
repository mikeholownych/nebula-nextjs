"""project-scoped Google property selections

Revision ID: 0014_project_integrations
Revises: 0013_acq_ai_interpretation
Create Date: 2026-09-03
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0014_project_integrations"
down_revision: Union[str, None] = "0013_acq_ai_interpretation"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "project_integrations",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text("gen_random_uuid()")),
        sa.Column("user_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("project_domain", sa.String(255), nullable=False),
        sa.Column("gsc_site_url", sa.Text(), nullable=True),
        sa.Column("ga4_property_id", sa.Text(), nullable=True),
        sa.Column("ga4_property_display_name", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False,
                  server_default=sa.text("now()")),
        sa.UniqueConstraint("user_id", "project_domain",
                            name="uq_project_integrations_user_domain"),
    )
    op.create_index("ix_project_integrations_user_id", "project_integrations", ["user_id"])


def downgrade() -> None:
    op.drop_index("ix_project_integrations_user_id", table_name="project_integrations")
    op.drop_table("project_integrations")
