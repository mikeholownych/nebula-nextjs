"""Acquisition Experiment Lifecycle, Nullable Positions & Confounding Support.

Revision ID: 0010_acquisition_experiment_lifecycle
Revises: 0009_acquisition_data_layer
Create Date: 2026-09-02 13:35:00.000000
"""

from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "0010_acq_experiments"
down_revision: Union[str, None] = "0009_acquisition_data_layer"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Nullable positions on acquisition_measurements (0 impressions => NULL position)
    op.alter_column("acquisition_measurements", "gsc_aggregate_position", nullable=True, server_default=None)
    op.alter_column("acquisition_measurements", "dimensioned_impression_weighted_position", nullable=True, server_default=None)

    # 2. Refine acquisition_changes check constraints & add lifecycle fields
    op.drop_constraint("ck_changes_type", "acquisition_changes", type_="check")
    op.create_check_constraint(
        "ck_changes_type",
        "acquisition_changes",
        "change_type IN ('CONTENT', 'TITLE_META', 'INTERNAL_LINKING', 'STRUCTURED_DATA', 'ROUTE', 'CANONICAL', 'INDEXABILITY', 'NAVIGATION', 'CTA', 'LAYOUT', 'TEARDOWN_CONTENT', 'CASE_STUDY_CONTENT', 'TECHNICAL_SEO', 'EXPERIMENTAL', 'OTHER', 'CONTENT_REWRITE', 'SCHEMA_UPDATE', 'NEW_PAGE', 'RETIRED_PAGE', 'EXPERIMENT')",
    )

    op.add_column("acquisition_changes", sa.Column("actor_type", sa.String(50), nullable=False, server_default="SYSTEM"))
    op.create_check_constraint(
        "ck_changes_actor_type",
        "acquisition_changes",
        "actor_type IN ('HUMAN', 'TERMINAL_AGENT', 'AUTOMATION', 'SYSTEM')",
    )

    op.add_column("acquisition_changes", sa.Column("execution_status", sa.String(50), nullable=False, server_default="DEPLOYED"))
    op.create_check_constraint(
        "ck_changes_execution_status",
        "acquisition_changes",
        "execution_status IN ('PLANNED', 'DEPLOYED', 'ROLLED_BACK', 'CANCELLED')",
    )

    op.add_column("acquisition_changes", sa.Column("rollback_change_id", sa.Text(), sa.ForeignKey("acquisition_changes.id"), nullable=True))
    op.add_column("acquisition_changes", sa.Column("rollback_reason", sa.Text(), nullable=True))
    op.add_column("acquisition_changes", sa.Column("rollback_at", sa.DateTime(timezone=True), nullable=True))

    # 3. Refine acquisition_experiments check constraints & add holdout / governance fields
    op.drop_constraint("ck_acq_exp_status", "acquisition_experiments", type_="check")
    op.create_check_constraint(
        "ck_acq_exp_status",
        "acquisition_experiments",
        "approval_status IN ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'RUNNING', 'HOLDOUT', 'ELIGIBLE_FOR_EVALUATION', 'EVALUATED', 'CANCELLED', 'REJECTED')",
    )

    op.add_column("acquisition_experiments", sa.Column("decision_rule_set_id", sa.Text(), sa.ForeignKey("decision_rule_sets.id"), nullable=True))
    op.add_column("acquisition_experiments", sa.Column("measurement_version_id", sa.Text(), sa.ForeignKey("measurement_versions.id"), nullable=True))
    op.add_column("acquisition_experiments", sa.Column("pre_change_measurement_id", sa.Text(), sa.ForeignKey("acquisition_measurements.id"), nullable=True))
    op.add_column("acquisition_experiments", sa.Column("effective_change_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("acquisition_experiments", sa.Column("do_not_change_until", sa.DateTime(timezone=True), nullable=True))
    op.add_column("acquisition_experiments", sa.Column("override_reason", sa.Text(), nullable=True))
    op.add_column("acquisition_experiments", sa.Column("override_actor", sa.String(100), nullable=True))
    op.add_column("acquisition_experiments", sa.Column("override_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("acquisition_experiments", sa.Column("cancelled_at", sa.DateTime(timezone=True), nullable=True))
    op.add_column("acquisition_experiments", sa.Column("cancelled_by", sa.String(100), nullable=True))
    op.add_column("acquisition_experiments", sa.Column("cancellation_reason", sa.Text(), nullable=True))

    # 4. Refine experiment_evaluations with confounding & temporal audit fields
    op.add_column("experiment_evaluations", sa.Column("decision_rule_set_id", sa.Text(), sa.ForeignKey("decision_rule_sets.id"), nullable=True))
    op.add_column("experiment_evaluations", sa.Column("confounding_level", sa.String(50), nullable=False, server_default="NONE"))
    op.create_check_constraint(
        "ck_exp_eval_confounding",
        "experiment_evaluations",
        "confounding_level IN ('NONE', 'LOW', 'MATERIAL', 'CRITICAL')",
    )
    op.add_column("experiment_evaluations", sa.Column("confounding_details", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'{}'::jsonb")))
    op.add_column("experiment_evaluations", sa.Column("wall_clock_elapsed_days", sa.Integer(), nullable=True))
    op.add_column("experiment_evaluations", sa.Column("finalized_source_days", sa.Integer(), nullable=True))
    op.add_column("experiment_evaluations", sa.Column("is_clean_window", sa.Boolean(), nullable=False, server_default="true"))


def downgrade() -> None:
    # 4. experiment_evaluations
    op.drop_constraint("ck_exp_eval_confounding", "experiment_evaluations", type_="check")
    op.drop_column("experiment_evaluations", "is_clean_window")
    op.drop_column("experiment_evaluations", "finalized_source_days")
    op.drop_column("experiment_evaluations", "wall_clock_elapsed_days")
    op.drop_column("experiment_evaluations", "confounding_details")
    op.drop_column("experiment_evaluations", "confounding_level")
    op.drop_column("experiment_evaluations", "decision_rule_set_id")

    # 3. acquisition_experiments
    op.drop_column("acquisition_experiments", "cancellation_reason")
    op.drop_column("acquisition_experiments", "cancelled_by")
    op.drop_column("acquisition_experiments", "cancelled_at")
    op.drop_column("acquisition_experiments", "override_at")
    op.drop_column("acquisition_experiments", "override_actor")
    op.drop_column("acquisition_experiments", "override_reason")
    op.drop_column("acquisition_experiments", "do_not_change_until")
    op.drop_column("acquisition_experiments", "effective_change_at")
    op.drop_column("acquisition_experiments", "pre_change_measurement_id")
    op.drop_column("acquisition_experiments", "measurement_version_id")
    op.drop_column("acquisition_experiments", "decision_rule_set_id")
    op.drop_constraint("ck_acq_exp_status", "acquisition_experiments", type_="check")
    op.create_check_constraint(
        "ck_acq_exp_status",
        "acquisition_experiments",
        "approval_status IN ('DRAFT', 'APPROVED', 'RUNNING', 'EVALUATED', 'CANCELLED')",
    )

    # 2. acquisition_changes
    op.drop_column("acquisition_changes", "rollback_at")
    op.drop_column("acquisition_changes", "rollback_reason")
    op.drop_column("acquisition_changes", "rollback_change_id")
    op.drop_constraint("ck_changes_execution_status", "acquisition_changes", type_="check")
    op.drop_column("acquisition_changes", "execution_status")
    op.drop_constraint("ck_changes_actor_type", "acquisition_changes", type_="check")
    op.drop_column("acquisition_changes", "actor_type")
    op.drop_constraint("ck_changes_type", "acquisition_changes", type_="check")
    op.create_check_constraint(
        "ck_changes_type",
        "acquisition_changes",
        "change_type IN ('CONTENT_REWRITE', 'SCHEMA_UPDATE', 'INTERNAL_LINKING', 'TITLE_META', 'NEW_PAGE', 'RETIRED_PAGE', 'TECHNICAL_SEO', 'EXPERIMENT')",
    )

    # 1. acquisition_measurements
    op.alter_column("acquisition_measurements", "dimensioned_impression_weighted_position", nullable=False, server_default="0.0")
    op.alter_column("acquisition_measurements", "gsc_aggregate_position", nullable=False, server_default="0.0")
