"""acquisition data layer schema and integrity controls

Revision ID: 0009_acquisition_data_layer
Revises: 0008_subscription_welcome
Create Date: 2026-09-02

Implements canonical structured acquisition data layer in nebula_platform:
- measurement_versions (immutable version metadata & definition hashes)
- decision_rule_sets (versioned decision rules & threshold registry)
- page_registry (canonical page identity & sitemap mapping)
- page_cohort_assignments (declarative versioned cohort mappings)
- acquisition_measurements (master measurement envelope & macro visibility)
- acquisition_source_runs (audit trail of source API execution)
- page_measurements (durable per-page visibility & conversion snapshots)
- query_measurements (structured query observations with anonymization flag)
- acquisition_state_transitions (two-dimensional state transitions)
- acquisition_anomalies (structured anomaly registry)
- acquisition_changes (site modifications & deployments)
- acquisition_experiments (formal hypothesis tracking)
- experiment_evaluations (immutable post-holdout evaluations)
- immutability triggers for measurement facts
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "0009_acquisition_data_layer"
down_revision: Union[str, None] = "0008_subscription_welcome"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Measurement Versions (Immutable definition provenance)
    op.create_table(
        "measurement_versions",
        sa.Column("id", sa.Text(), primary_key=True),
        sa.Column("version_code", sa.String(50), nullable=False, unique=True),
        sa.Column("metric_definition_version", sa.String(50), nullable=False),
        sa.Column("cohort_definition_version", sa.String(50), nullable=False),
        sa.Column("page_classification_version", sa.String(50), nullable=False),
        sa.Column("attribution_model_version", sa.String(50), nullable=False),
        sa.Column("bot_filtering_version", sa.String(50), nullable=False),
        sa.Column("internal_traffic_filter_version", sa.String(50), nullable=False),
        sa.Column("measurement_code_commit", sa.String(100), nullable=False),
        sa.Column("definition_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("definition_hash", sa.String(64), nullable=False, unique=True),
        sa.Column("effective_from", sa.DateTime(timezone=True), nullable=False),
        sa.Column("effective_until", sa.DateTime(timezone=True), nullable=True),
        sa.Column("status", sa.String(50), nullable=False, server_default="ACTIVE"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.CheckConstraint(
            "status IN ('ACTIVE', 'SUPERSEDED', 'DEPRECATED')",
            name="ck_measurement_versions_status",
        ),
    )
    op.create_index("ix_measurement_versions_code", "measurement_versions", ["version_code"])

    # 2. Decision Rule Sets (Versioned decision-rule registry)
    op.create_table(
        "decision_rule_sets",
        sa.Column("id", sa.Text(), primary_key=True),
        sa.Column("version_code", sa.String(50), nullable=False, unique=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("min_holdout_days", sa.Integer(), nullable=False, server_default="28"),
        sa.Column("min_impression_gate", sa.Integer(), nullable=False, server_default="100"),
        sa.Column("definition_json", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("definition_hash", sa.String(64), nullable=False, unique=True),
        sa.Column("effective_from", sa.DateTime(timezone=True), nullable=False),
        sa.Column("effective_until", sa.DateTime(timezone=True), nullable=True),
        sa.Column("status", sa.String(50), nullable=False, server_default="ACTIVE"),
        sa.Column("created_by", sa.String(100), nullable=False, server_default="system"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.CheckConstraint(
            "status IN ('ACTIVE', 'SUPERSEDED', 'DEPRECATED')",
            name="ck_decision_rule_sets_status",
        ),
    )
    op.create_index("ix_decision_rule_sets_code", "decision_rule_sets", ["version_code"])

    # 3. Canonical Page Registry
    op.create_table(
        "page_registry",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("canonical_url", sa.Text(), nullable=False, unique=True),
        sa.Column("route_path", sa.Text(), nullable=False, unique=True),
        sa.Column("route_pattern", sa.Text(), nullable=False),
        sa.Column("route_type", sa.String(50), nullable=False),
        sa.Column("sitemap_priority", sa.Numeric(3, 2), nullable=True),
        sa.Column("is_indexable", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("first_seen_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("retired_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.CheckConstraint(
            "route_type IN ('static', 'dynamic', 'utility', 'conversion', 'gated')",
            name="ck_page_registry_route_type",
        ),
        sa.CheckConstraint(
            "sitemap_priority >= 0.0 AND sitemap_priority <= 1.0",
            name="ck_page_registry_priority",
        ),
    )
    op.create_index("ix_page_registry_route_path", "page_registry", ["route_path"])
    op.create_index("ix_page_registry_active", "page_registry", ["is_active"], postgresql_where=sa.text("is_active = TRUE"))

    # 4. Declarative Page Cohort Assignments
    op.create_table(
        "page_cohort_assignments",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("page_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("page_registry.id", ondelete="CASCADE"), nullable=False),
        sa.Column("cohort_name", sa.String(100), nullable=False),
        sa.Column("cohort_definition_version", sa.String(50), nullable=False, server_default="2.0.0"),
        sa.Column("assigned_by", sa.String(100), nullable=False, server_default="declarative_registry"),
        sa.Column("assigned_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("valid_until", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_current", sa.Boolean(), nullable=False, server_default="true"),
        sa.CheckConstraint(
            "cohort_name IN ('problem_intent', 'commercial_comparison', 'category', 'vertical_use_case', 'resources', 'teardown_index', 'individual_teardown', 'case_study', 'product_core', 'checkout', 'utility_legal', 'other')",
            name="ck_page_cohort_name",
        ),
        sa.UniqueConstraint("page_id", "cohort_name", "cohort_definition_version", name="uq_page_cohort_version"),
    )
    op.create_index("ix_page_cohort_page", "page_cohort_assignments", ["page_id"], postgresql_where=sa.text("is_current = TRUE"))
    op.create_index("ix_page_cohort_name", "page_cohort_assignments", ["cohort_name"], postgresql_where=sa.text("is_current = TRUE"))

    # 5. Acquisition Measurements (Master Envelope & Totals)
    op.create_table(
        "acquisition_measurements",
        sa.Column("id", sa.Text(), primary_key=True),
        sa.Column("measurement_version", sa.Integer(), nullable=False, server_default="2"),
        sa.Column("measurement_version_code", sa.String(50), sa.ForeignKey("measurement_versions.version_code"), nullable=True),
        sa.Column("generated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("requested_period_start", sa.Date(), nullable=False),
        sa.Column("requested_period_end", sa.Date(), nullable=False),
        sa.Column("effective_period_start", sa.Date(), nullable=False),
        sa.Column("effective_period_end", sa.Date(), nullable=False),
        sa.Column("source_native_period_start", sa.Date(), nullable=False),
        sa.Column("source_native_period_end", sa.Date(), nullable=False),
        sa.Column("source_native_timezone", sa.String(100), nullable=False, server_default="America/Los_Angeles"),
        sa.Column("canonical_timezone", sa.String(50), nullable=False, server_default="UTC"),
        sa.Column("window_days", sa.Integer(), nullable=False),
        
        # Macro Search Visibility Metrics (Distinct naming to prevent collision)
        sa.Column("gsc_total_impressions", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("gsc_total_clicks", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("gsc_aggregate_position", sa.Numeric(5, 2), nullable=False, server_default="0.0"),
        sa.Column("dimensioned_impression_weighted_position", sa.Numeric(5, 2), nullable=False, server_default="0.0"),
        sa.Column("unique_visible_pages", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("unique_visible_queries", sa.Integer(), nullable=False, server_default="0"),
        
        # Position Distribution Buckets
        sa.Column("pos_bucket_1_10", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("pos_bucket_11_20", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("pos_bucket_21_30", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("pos_bucket_31_50", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("pos_bucket_51_plus", sa.Integer(), nullable=False, server_default="0"),
        
        # Organic Search Traffic (GA4)
        sa.Column("ga4_organic_sessions", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("ga4_organic_users", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("ga4_search_entry_sessions", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("ga4_downstream_checkout_sessions", sa.Integer(), nullable=False, server_default="0"),
        
        # Product Funnel Counts (from canonical internal ledger)
        sa.Column("internal_audit_started", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("internal_audit_completed", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("internal_checkout_started", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("internal_purchases", sa.Integer(), nullable=False, server_default="0"),
        
        # Provenance Metadata
        sa.Column("source_system", sa.String(100), nullable=False, server_default="gsc_ga4_combined"),
        sa.Column("source_property", sa.String(255), nullable=False, server_default="sc-domain:nebulacomponents.com"),
        sa.Column("source_filters", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("source_query_parameters", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("metric_definition_version", sa.String(50), nullable=False, server_default="2.0.0"),
        sa.Column("cohort_definition_version", sa.String(50), nullable=False, server_default="2.0.0"),
        sa.Column("page_classification_version", sa.String(50), nullable=False, server_default="2.0.0"),
        sa.Column("attribution_model_version", sa.String(50), nullable=False, server_default="last_non_direct_v1"),
        sa.Column("bot_filtering_version", sa.String(50), nullable=False, server_default="1.0.0"),
        sa.Column("internal_traffic_filter_version", sa.String(50), nullable=False, server_default="1.0.0"),
        sa.Column("measurement_code_commit", sa.String(100), nullable=False),
        sa.Column("application_commit", sa.String(100), nullable=True),
        
        # Data Quality & Operational Status
        sa.Column("data_completeness_status", sa.String(50), nullable=False),
        sa.Column("source_finalization_status", sa.String(50), nullable=False),
        sa.Column("known_anomalies", postgresql.ARRAY(sa.Text()), nullable=False, server_default=sa.text("'{}'")),
        sa.Column("known_blockers", postgresql.ARRAY(sa.Text()), nullable=False, server_default=sa.text("'{}'")),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.CheckConstraint(
            "data_completeness_status IN ('COMPLETE', 'PARTIAL', 'INSUFFICIENT', 'BLOCKED')",
            name="ck_acq_meas_completeness",
        ),
        sa.CheckConstraint(
            "source_finalization_status IN ('FINAL', 'PROVISIONAL', 'STALE')",
            name="ck_acq_meas_finalization",
        ),
    )
    op.create_index("ix_acq_meas_dates", "acquisition_measurements", ["effective_period_start", "effective_period_end"])
    op.create_index("ix_acq_meas_window", "acquisition_measurements", ["window_days", "generated_at"])

    # 6. Acquisition Source Runs (Audit trail of raw API invocations)
    op.create_table(
        "acquisition_source_runs",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("measurement_id", sa.Text(), sa.ForeignKey("acquisition_measurements.id", ondelete="CASCADE"), nullable=False),
        sa.Column("source_system", sa.String(50), nullable=False),
        sa.Column("source_property", sa.String(255), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("response_status", sa.Integer(), nullable=False),
        sa.Column("status", sa.String(50), nullable=False),
        sa.Column("payload_hash", sa.String(64), nullable=False),
        sa.Column("records_received", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("records_persisted", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("quota_consumed", sa.Integer(), nullable=True),
        sa.Column("quota_remaining", sa.Integer(), nullable=True),
        sa.Column("execution_duration_ms", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("error_class", sa.String(100), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("retry_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("source_revision_identifier", sa.String(100), nullable=True),
        sa.CheckConstraint(
            "source_system IN ('gsc', 'ga4', 'internal_ledger')",
            name="ck_source_runs_system",
        ),
        sa.CheckConstraint(
            "status IN ('SUCCESS', 'PARTIAL', 'DELAYED', 'FAILED', 'UNAVAILABLE')",
            name="ck_source_runs_status",
        ),
    )
    op.create_index("ix_source_runs_meas", "acquisition_source_runs", ["measurement_id"])

    # 7. Page Measurements (Per-page durable snapshot)
    op.create_table(
        "page_measurements",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("measurement_id", sa.Text(), sa.ForeignKey("acquisition_measurements.id", ondelete="CASCADE"), nullable=False),
        sa.Column("page_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("page_registry.id", ondelete="CASCADE"), nullable=False),
        sa.Column("cohort_name", sa.String(100), nullable=False),
        sa.Column("impressions", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("clicks", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("ctr", sa.Numeric(5, 4), nullable=False, server_default="0.0"),
        sa.Column("best_position", sa.Numeric(5, 2), nullable=True),
        sa.Column("weighted_avg_position", sa.Numeric(5, 2), nullable=True),
        sa.Column("position_bucket", sa.String(50), nullable=False),
        sa.Column("ga4_organic_entry_sessions", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("ga4_organic_attributed_sessions", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("internal_audit_starts", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("internal_audit_completions", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("data_quality_status", sa.String(50), nullable=False, server_default="VERIFIED"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.CheckConstraint(
            "position_bucket IN ('POS_1_10', 'POS_11_20', 'POS_21_30', 'POS_31_50', 'POS_51_PLUS', 'UNSEEN')",
            name="ck_page_measurements_bucket",
        ),
        sa.UniqueConstraint("measurement_id", "page_id", name="uq_page_measurements_meas_page"),
    )
    op.create_index("ix_page_meas_cohort", "page_measurements", ["measurement_id", "cohort_name"])
    op.create_index("ix_page_meas_page_time", "page_measurements", ["page_id", "created_at"])

    # 8. Query Measurements (Per-query structured snapshot)
    op.create_table(
        "query_measurements",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("measurement_id", sa.Text(), sa.ForeignKey("acquisition_measurements.id", ondelete="CASCADE"), nullable=False),
        sa.Column("page_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("page_registry.id", ondelete="CASCADE"), nullable=False),
        sa.Column("query_text", sa.Text(), nullable=False),
        sa.Column("impressions", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("clicks", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("ctr", sa.Numeric(5, 4), nullable=False, server_default="0.0"),
        sa.Column("position", sa.Numeric(5, 2), nullable=False, server_default="0.0"),
        sa.Column("query_intent_class", sa.String(50), nullable=True),
        sa.Column("is_anonymized_subset", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("first_seen", sa.Date(), nullable=True),
        sa.Column("last_seen", sa.Date(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.CheckConstraint(
            "query_intent_class IS NULL OR query_intent_class IN ('problem', 'brand', 'comparison', 'category', 'navigational', 'informational', 'unclassified')",
            name="ck_query_measurements_intent",
        ),
        sa.UniqueConstraint("measurement_id", "page_id", "query_text", name="uq_query_measurements_key"),
    )
    op.create_index("ix_query_meas_query", "query_measurements", ["measurement_id", "query_text"])
    op.create_index("ix_query_meas_page_query", "query_measurements", ["page_id", "query_text"])

    # 9. Acquisition State Transitions
    op.create_table(
        "acquisition_state_transitions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("page_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("page_registry.id", ondelete="CASCADE"), nullable=False),
        sa.Column("measurement_id", sa.Text(), sa.ForeignKey("acquisition_measurements.id", ondelete="CASCADE"), nullable=False),
        sa.Column("dimension", sa.String(50), nullable=False),
        sa.Column("from_state", sa.String(50), nullable=False),
        sa.Column("to_state", sa.String(50), nullable=False),
        sa.Column("transition_type", sa.String(50), nullable=False),
        sa.Column("transition_reason", sa.Text(), nullable=False),
        sa.Column("occurred_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.CheckConstraint(
            "dimension IN ('search_visibility', 'product_journey')",
            name="ck_state_transitions_dim",
        ),
        sa.CheckConstraint(
            "transition_type IN ('PROGRESSION', 'REGRESSION', 'MAINTAINED', 'INITIAL')",
            name="ck_state_transitions_type",
        ),
    )
    op.create_index("ix_state_transitions_page", "acquisition_state_transitions", ["page_id", "occurred_at"])

    # 10. Acquisition Anomalies Registry
    op.create_table(
        "acquisition_anomalies",
        sa.Column("id", sa.Text(), primary_key=True),
        sa.Column("anomaly_type", sa.String(100), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("source_system", sa.String(50), nullable=False),
        sa.Column("severity", sa.String(50), nullable=False),
        sa.Column("status", sa.String(50), nullable=False),
        sa.Column("affected_pages", postgresql.ARRAY(postgresql.UUID(as_uuid=True)), nullable=False, server_default=sa.text("'{}'")),
        sa.Column("affected_metrics", postgresql.ARRAY(sa.Text()), nullable=False, server_default=sa.text("'{}'")),
        sa.Column("affected_period_start", sa.Date(), nullable=True),
        sa.Column("affected_period_end", sa.Date(), nullable=True),
        sa.Column("detected_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("mitigation_notes", sa.Text(), nullable=True),
        sa.Column("resolution", sa.Text(), nullable=True),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.CheckConstraint(
            "severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')",
            name="ck_anomalies_severity",
        ),
        sa.CheckConstraint(
            "status IN ('OPEN', 'INVESTIGATING', 'MITIGATED', 'RESOLVED', 'ACCEPTED_LIMITATION', 'KNOWN_ATTRIBUTION_BEHAVIOR')",
            name="ck_anomalies_status",
        ),
    )

    # 11. Acquisition Changes & Interventions
    op.create_table(
        "acquisition_changes",
        sa.Column("id", sa.Text(), primary_key=True),
        sa.Column("change_type", sa.String(100), nullable=False),
        sa.Column("summary", sa.Text(), nullable=False),
        sa.Column("affected_page_ids", postgresql.ARRAY(postgresql.UUID(as_uuid=True)), nullable=False, server_default=sa.text("'{}'")),
        sa.Column("affected_cohorts", postgresql.ARRAY(sa.Text()), nullable=False, server_default=sa.text("'{}'")),
        sa.Column("deployed_commit", sa.String(100), nullable=False),
        sa.Column("deployed_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("expected_impact", sa.String(50), nullable=False),
        sa.Column("pre_change_measurement_id", sa.Text(), sa.ForeignKey("acquisition_measurements.id"), nullable=True),
        sa.Column("min_observation_days", sa.Integer(), nullable=False, server_default="28"),
        sa.Column("evaluation_due_date", sa.Date(), nullable=False),
        sa.Column("logged_by", sa.String(100), nullable=False, server_default="system"),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.CheckConstraint(
            "change_type IN ('CONTENT_REWRITE', 'SCHEMA_UPDATE', 'INTERNAL_LINKING', 'TITLE_META', 'NEW_PAGE', 'RETIRED_PAGE', 'TECHNICAL_SEO', 'EXPERIMENT')",
            name="ck_changes_type",
        ),
        sa.CheckConstraint(
            "expected_impact IN ('positive', 'neutral', 'investigative', 'defensive')",
            name="ck_changes_impact",
        ),
    )

    # 12. Acquisition Experiments (Formal hypothesis testing)
    op.create_table(
        "acquisition_experiments",
        sa.Column("id", sa.Text(), primary_key=True),
        sa.Column("change_id", sa.Text(), sa.ForeignKey("acquisition_changes.id", ondelete="CASCADE"), nullable=False),
        sa.Column("hypothesis_statement", sa.Text(), nullable=False),
        sa.Column("target_metric", sa.String(100), nullable=False),
        sa.Column("expected_direction", sa.String(50), nullable=False),
        sa.Column("expected_magnitude", sa.Numeric(8, 2), nullable=True),
        sa.Column("pre_metric_value", sa.Numeric(8, 2), nullable=False),
        sa.Column("approval_status", sa.String(50), nullable=False, server_default="DRAFT"),
        sa.Column("approved_by", sa.String(100), nullable=True),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("scheduled_evaluation_at", sa.DateTime(timezone=True), nullable=False),
        sa.CheckConstraint(
            "expected_direction IN ('INCREASE', 'DECREASE', 'MAINTAIN')",
            name="ck_acq_exp_direction",
        ),
        sa.CheckConstraint(
            "approval_status IN ('DRAFT', 'APPROVED', 'RUNNING', 'EVALUATED', 'CANCELLED')",
            name="ck_acq_exp_status",
        ),
    )

    # 13. Experiment Evaluations (Post-holdout results & learning)
    op.create_table(
        "experiment_evaluations",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("experiment_id", sa.Text(), sa.ForeignKey("acquisition_experiments.id", ondelete="CASCADE"), nullable=False),
        sa.Column("post_measurement_id", sa.Text(), sa.ForeignKey("acquisition_measurements.id", ondelete="CASCADE"), nullable=False),
        sa.Column("outcome", sa.String(50), nullable=False),
        sa.Column("pre_value", sa.Numeric(8, 2), nullable=False),
        sa.Column("post_value", sa.Numeric(8, 2), nullable=False),
        sa.Column("delta_value", sa.Numeric(8, 2), nullable=False),
        sa.Column("delta_percentage", sa.Numeric(6, 2), nullable=True),
        sa.Column("confidence_level", sa.String(50), nullable=False),
        sa.Column("synthesis_notes", sa.Text(), nullable=False),
        sa.Column("learning_accumulated", postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default=sa.text("'{}'::jsonb")),
        sa.Column("evaluated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.CheckConstraint(
            "outcome IN ('SUPPORTED', 'PARTIALLY_SUPPORTED', 'NOT_SUPPORTED', 'INCONCLUSIVE', 'CONFOUNDED', 'REGRESSED')",
            name="ck_exp_eval_outcome",
        ),
        sa.CheckConstraint(
            "confidence_level IN ('HIGH', 'MEDIUM', 'LOW', 'NONE')",
            name="ck_exp_eval_confidence",
        ),
    )

    # 14. Database-Level Immutability Trigger for Measurement Facts
    op.execute("""
    CREATE OR REPLACE FUNCTION trg_prevent_mutation_acq_facts()
    RETURNS TRIGGER AS $$
    BEGIN
        IF (TG_OP = 'DELETE') THEN
            RAISE EXCEPTION 'Deletion of historical acquisition facts is strictly prohibited (table: %)', TG_TABLE_NAME;
        ELSIF (TG_OP = 'UPDATE') THEN
            RAISE EXCEPTION 'Mutation of historical acquisition facts is strictly prohibited (table: %)', TG_TABLE_NAME;
        END IF;
        RETURN NULL;
    END;
    $$ LANGUAGE plpgsql;
    """)

    # Attach immutability triggers
    op.execute("CREATE TRIGGER trg_acq_meas_immutable BEFORE UPDATE OR DELETE ON acquisition_measurements FOR EACH ROW EXECUTE FUNCTION trg_prevent_mutation_acq_facts();")
    op.execute("CREATE TRIGGER trg_page_meas_immutable BEFORE UPDATE OR DELETE ON page_measurements FOR EACH ROW EXECUTE FUNCTION trg_prevent_mutation_acq_facts();")
    op.execute("CREATE TRIGGER trg_query_meas_immutable BEFORE UPDATE OR DELETE ON query_measurements FOR EACH ROW EXECUTE FUNCTION trg_prevent_mutation_acq_facts();")
    op.execute("CREATE TRIGGER trg_meas_versions_immutable BEFORE UPDATE OR DELETE ON measurement_versions FOR EACH ROW EXECUTE FUNCTION trg_prevent_mutation_acq_facts();")
    op.execute("CREATE TRIGGER trg_decision_rules_immutable BEFORE UPDATE OR DELETE ON decision_rule_sets FOR EACH ROW EXECUTE FUNCTION trg_prevent_mutation_acq_facts();")
    op.execute("CREATE TRIGGER trg_state_trans_immutable BEFORE UPDATE OR DELETE ON acquisition_state_transitions FOR EACH ROW EXECUTE FUNCTION trg_prevent_mutation_acq_facts();")


def downgrade() -> None:
    # Drop triggers
    op.execute("DROP TRIGGER IF EXISTS trg_acq_meas_immutable ON acquisition_measurements;")
    op.execute("DROP TRIGGER IF EXISTS trg_page_meas_immutable ON page_measurements;")
    op.execute("DROP TRIGGER IF EXISTS trg_query_meas_immutable ON query_measurements;")
    op.execute("DROP TRIGGER IF EXISTS trg_meas_versions_immutable ON measurement_versions;")
    op.execute("DROP TRIGGER IF EXISTS trg_decision_rules_immutable ON decision_rule_sets;")
    op.execute("DROP TRIGGER IF EXISTS trg_state_trans_immutable ON acquisition_state_transitions;")
    op.execute("DROP FUNCTION IF EXISTS trg_prevent_mutation_acq_facts();")

    # Drop tables in reverse order
    op.drop_table("experiment_evaluations")
    op.drop_table("acquisition_experiments")
    op.drop_table("acquisition_changes")
    op.drop_table("acquisition_anomalies")
    op.drop_table("acquisition_state_transitions")
    op.drop_table("query_measurements")
    op.drop_table("page_measurements")
    op.drop_table("acquisition_source_runs")
    op.drop_table("acquisition_measurements")
    op.drop_table("page_cohort_assignments")
    op.drop_table("page_registry")
    op.drop_table("decision_rule_sets")
    op.drop_table("measurement_versions")
