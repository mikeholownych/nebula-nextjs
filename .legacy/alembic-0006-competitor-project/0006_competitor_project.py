"""Add project attribution to competitor tracking."""
from alembic import op
import sqlalchemy as sa

revision = "0006_competitor_project"
down_revision = "0005_competitor_tracking"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("competitor_tracking", sa.Column("project_domain", sa.String(length=255), nullable=True))
    op.create_index(
        "ix_competitor_tracking_user_project",
        "competitor_tracking",
        ["user_id", "project_domain"],
    )


def downgrade():
    op.drop_index("ix_competitor_tracking_user_project", table_name="competitor_tracking")
    op.drop_column("competitor_tracking", "project_domain")
