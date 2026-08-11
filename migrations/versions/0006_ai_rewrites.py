"""ai_rewrites table

Revision ID: 0006_ai_rewrites
Revises: 0005_competitor_tracking
Create Date: 2026-08-05

AI rewrite previews (Feature 5). audit_id is TEXT (no FK) because audits
live in the separate nebula_audit database - cross-DB FKs are impossible.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '0006_ai_rewrites'
down_revision: Union[str, None] = '0005_competitor_tracking'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'ai_rewrites',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text('gen_random_uuid()')),
        # Audit IDs live in nebula_audit - stored as TEXT, no cross-DB FK.
        sa.Column('audit_id', sa.Text, nullable=False),
        sa.Column('finding_key', sa.Text, nullable=False),
        sa.Column('original_text', sa.Text, nullable=True),
        sa.Column('rewritten_text', sa.Text, nullable=True),
        sa.Column('model', sa.Text, nullable=False,
                  server_default=sa.text("'claude-sonnet-4-5'")),
        sa.Column('created_at', sa.DateTime(timezone=True),
                  nullable=False,
                  server_default=sa.text('now()')),
        sa.UniqueConstraint('audit_id', 'finding_key',
                            name='uq_ai_rewrites_audit_finding'),
    )


def downgrade() -> None:
    op.drop_table('ai_rewrites')
