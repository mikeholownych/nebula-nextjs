"""0011_acq_recommendations

Revision ID: 0011_acq_recommendations
Revises: 0010_acq_experiments
Create Date: 2026-09-02 14:00:00.000000

Phase 6: Acquisition Recommendation Engine, Metric Semantics, Query Intent Registry, Decision Reviews, and Suppressions.
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '0011_acq_recommendations'
down_revision: Union[str, None] = '0010_acq_experiments'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Metric Semantics Registry
    op.create_table(
        'metric_semantics_registry',
        sa.Column('metric_name', sa.String(100), primary_key=True),
        sa.Column('metric_family', sa.String(50), nullable=False),
        sa.Column('preferred_direction', sa.String(50), nullable=False),
        sa.Column('comparison_method', sa.String(50), nullable=False),
        sa.Column('materiality_rule', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('low_volume_rule', sa.String(50), nullable=False, server_default='NONE'),
        sa.Column('low_volume_threshold', sa.Integer(), nullable=False, server_default='5'),
        sa.Column('null_semantics', sa.String(50), nullable=False, server_default='ZERO_PRESENCE_NULL'),
        sa.Column('eligibility_requirements', postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default='{}'),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.CheckConstraint(
            "preferred_direction IN ('HIGHER_IS_BETTER', 'LOWER_IS_BETTER', 'TARGET_RANGE', 'NON_DIRECTIONAL')",
            name='ck_metric_semantics_preferred_direction'
        ),
        sa.CheckConstraint(
            "comparison_method IN ('PERCENTAGE_DELTA', 'ABSOLUTE_DELTA', 'POSITION_AWARE', 'RATIO_DELTA')",
            name='ck_metric_semantics_comparison_method'
        ),
        sa.CheckConstraint(
            "low_volume_rule IN ('ABSOLUTE_FIRST', 'SUPPRESS_PERCENTAGE', 'NONE')",
            name='ck_metric_semantics_low_volume_rule'
        ),
        sa.CheckConstraint(
            "null_semantics IN ('ZERO_PRESENCE_NULL', 'NOT_APPLICABLE', 'DEFAULT_ZERO')",
            name='ck_metric_semantics_null_semantics'
        ),
    )

    # Seed default metric semantics
    op.execute("""
        INSERT INTO metric_semantics_registry (
            metric_name, metric_family, preferred_direction, comparison_method,
            materiality_rule, low_volume_rule, low_volume_threshold, null_semantics,
            eligibility_requirements, description
        ) VALUES
        ('gsc_total_impressions', 'GSC', 'HIGHER_IS_BETTER', 'PERCENTAGE_DELTA',
         '{"pct_threshold": 0.10, "abs_min": 50}', 'NONE', 10, 'ZERO_PRESENCE_NULL',
         '{"min_days": 28}', 'Total sitewide Google Search Console impressions across dimensioned queries.'),
        ('gsc_total_clicks', 'GSC', 'HIGHER_IS_BETTER', 'PERCENTAGE_DELTA',
         '{"pct_threshold": 0.15, "abs_min": 5}', 'ABSOLUTE_FIRST', 5, 'ZERO_PRESENCE_NULL',
         '{"min_days": 28}', 'Total sitewide Google Search Console organic clicks.'),
        ('gsc_aggregate_position', 'GSC', 'LOWER_IS_BETTER', 'POSITION_AWARE',
         '{"abs_threshold": 3.0, "rank_step": 5.0}', 'NONE', 100, 'ZERO_PRESENCE_NULL',
         '{"min_days": 28, "min_impressions": 100}', 'Dimensionless aggregate average position across all search queries.'),
        ('dimensioned_impression_weighted_position', 'GSC', 'LOWER_IS_BETTER', 'POSITION_AWARE',
         '{"abs_threshold": 2.5, "rank_step": 5.0}', 'NONE', 100, 'ZERO_PRESENCE_NULL',
         '{"min_days": 28, "min_impressions": 100}', 'Impression-weighted average position computed over dimensioned rows.'),
        ('gsc_average_ctr', 'GSC', 'HIGHER_IS_BETTER', 'PERCENTAGE_DELTA',
         '{"abs_threshold": 0.005, "pct_threshold": 0.20}', 'NONE', 100, 'ZERO_PRESENCE_NULL',
         '{"min_days": 28, "min_impressions": 100, "max_avg_position": 20.0}', 'Click-through rate from GSC impressions to clicks.'),
        ('unique_visible_pages', 'GSC', 'HIGHER_IS_BETTER', 'ABSOLUTE_DELTA',
         '{"abs_threshold": 3}', 'NONE', 5, 'DEFAULT_ZERO',
         '{"min_days": 28}', 'Count of distinct canonical landing pages receiving at least 1 impression.'),
        ('unique_visible_queries', 'GSC', 'NON_DIRECTIONAL', 'PERCENTAGE_DELTA',
         '{"pct_threshold": 0.15, "abs_min": 10}', 'NONE', 10, 'DEFAULT_ZERO',
         '{"min_days": 28}', 'Count of distinct search queries returning search impressions.'),
        ('ga4_organic_sessions', 'GA4', 'HIGHER_IS_BETTER', 'PERCENTAGE_DELTA',
         '{"pct_threshold": 0.10, "abs_min": 20}', 'NONE', 10, 'DEFAULT_ZERO',
         '{"min_days": 28}', 'Total organic search landing sessions from GA4.'),
        ('internal_audit_started', 'INTERNAL', 'HIGHER_IS_BETTER', 'ABSOLUTE_DELTA',
         '{"abs_threshold": 2}', 'ABSOLUTE_FIRST', 5, 'DEFAULT_ZERO',
         '{"min_days": 28}', 'Internal audit workflow initiation events.'),
        ('internal_purchases', 'INTERNAL', 'HIGHER_IS_BETTER', 'ABSOLUTE_DELTA',
         '{"abs_threshold": 1}', 'ABSOLUTE_FIRST', 5, 'DEFAULT_ZERO',
         '{"min_days": 28}', 'Completed $97 audit purchase transactions from platform ledger.')
        ON CONFLICT (metric_name) DO NOTHING;
    """)

    # 2. Query Intent Registry (Intended Search Positioning)
    op.create_table(
        'query_intent_registry',
        sa.Column('id', sa.Text(), primary_key=True),
        sa.Column('page_id', sa.UUID(), sa.ForeignKey('page_registry.id', ondelete='CASCADE'), nullable=False),
        sa.Column('primary_topic', sa.String(255), nullable=False),
        sa.Column('secondary_topics', postgresql.ARRAY(sa.Text()), nullable=False, server_default='{}'),
        sa.Column('target_query_patterns', postgresql.ARRAY(sa.Text()), nullable=False, server_default='{}'),
        sa.Column('intended_intent', sa.String(50), nullable=False, server_default='COMMERCIAL'),
        sa.Column('effective_from', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('effective_until', sa.DateTime(timezone=True), nullable=True),
        sa.Column('version', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.CheckConstraint(
            "intended_intent IN ('INFORMATIONAL', 'COMMERCIAL', 'TRANSACTIONAL', 'NAVIGATIONAL')",
            name='ck_query_intent_intended_intent'
        ),
    )
    op.create_index('ix_query_intent_page_id', 'query_intent_registry', ['page_id'])

    # Seed query intent mappings for core existing routes
    op.execute("""
        INSERT INTO query_intent_registry (id, page_id, primary_topic, secondary_topics, target_query_patterns, intended_intent)
        SELECT 
            'intent_' || pr.id,
            pr.id,
            CASE 
                WHEN pr.route_path = '/' THEN 'landing page audit tools'
                WHEN pr.route_path = '/audit' THEN 'website conversion audit'
                WHEN pr.route_path = '/pricing' THEN 'landing page audit cost'
                WHEN pr.route_path = '/signals' THEN 'conversion rate optimization signals'
                WHEN pr.route_path = '/learning-centre' THEN 'landing page teardowns and conversion education'
                WHEN pr.route_path LIKE '/vs/%' THEN 'cro tool comparison alternative'
                WHEN pr.route_path LIKE '/teardowns/%' THEN 'landing page teardown analysis'
                ELSE 'conversion optimization'
            END,
            ARRAY['conversion rate optimization', 'landing page teardowns'],
            CASE
                WHEN pr.route_path = '/' THEN ARRAY['landing page audit', 'website audit tool', 'nebula components']
                WHEN pr.route_path = '/audit' THEN ARRAY['buy landing page audit', 'get conversion audit', 'landing page review']
                WHEN pr.route_path LIKE '/vs/%' THEN ARRAY['alternative to', 'vs', 'comparison']
                ELSE ARRAY['conversion rate', 'landing page']
            END,
            'COMMERCIAL'
        FROM page_registry pr
        ON CONFLICT (id) DO NOTHING;
    """)

    # 3. Acquisition Recommendations
    op.create_table(
        'acquisition_recommendations',
        sa.Column('id', sa.Text(), primary_key=True),
        sa.Column('measurement_id', sa.Text(), sa.ForeignKey('acquisition_measurements.id'), nullable=False),
        sa.Column('comparison_measurement_id', sa.Text(), sa.ForeignKey('acquisition_measurements.id'), nullable=True),
        sa.Column('decision_rule_set_id', sa.Text(), sa.ForeignKey('decision_rule_sets.id'), nullable=False),
        sa.Column('target_type', sa.String(50), nullable=False),
        sa.Column('target_page_id', sa.UUID(), sa.ForeignKey('page_registry.id', ondelete='SET NULL'), nullable=True),
        sa.Column('target_cohort', sa.String(100), nullable=True),
        sa.Column('detected_condition', sa.Text(), nullable=False),
        sa.Column('trend_classification', sa.String(100), nullable=False),
        sa.Column('search_state', sa.String(100), nullable=True),
        sa.Column('product_state', sa.String(100), nullable=True),
        sa.Column('evidence_status', sa.String(50), nullable=False),
        sa.Column('recommendation_class', sa.String(100), nullable=False),
        sa.Column('reason_code', sa.String(100), nullable=False),
        sa.Column('reason_text', sa.Text(), nullable=False),
        sa.Column('primary_metric', sa.String(100), nullable=False),
        sa.Column('supporting_metrics', postgresql.JSONB(astext_type=sa.Text()), nullable=False, server_default='{}'),
        sa.Column('confidence', sa.String(50), nullable=False),
        sa.Column('uncertainties', postgresql.ARRAY(sa.Text()), nullable=False, server_default='{}'),
        sa.Column('minimum_observation_period', sa.Integer(), nullable=False, server_default='28'),
        sa.Column('do_not_change_conditions', postgresql.ARRAY(sa.Text()), nullable=False, server_default='{}'),
        sa.Column('lifecycle_status', sa.String(50), nullable=False, server_default='GENERATED'),
        sa.Column('experiment_candidate_id', sa.Text(), sa.ForeignKey('acquisition_experiments.id', ondelete='SET NULL'), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.CheckConstraint(
            "target_type IN ('SITEWIDE', 'COHORT', 'PAGE', 'QUERY')",
            name='ck_acq_rec_target_type'
        ),
        sa.CheckConstraint(
            "evidence_status IN ('SUFFICIENT', 'INSUFFICIENT', 'INCOMPLETE', 'BLOCKED')",
            name='ck_acq_rec_evidence_status'
        ),
        sa.CheckConstraint(
            "recommendation_class IN ('NO_CHANGE', 'OBSERVE', 'INVESTIGATE', 'REVIEW_QUERY_ALIGNMENT', 'REVIEW_CONTENT_ALIGNMENT', 'REVIEW_INTERNAL_LINKING', 'REVIEW_SERP_PRESENTATION', 'REVIEW_TECHNICAL_INDEXABILITY', 'REVIEW_CANNIBALIZATION', 'CONSOLIDATE', 'RETIRE', 'EXPAND_ADJACENCY', 'RUN_CONTROLLED_EXPERIMENT')",
            name='ck_acq_rec_recommendation_class'
        ),
        sa.CheckConstraint(
            "confidence IN ('NONE', 'LOW', 'MEDIUM', 'HIGH')",
            name='ck_acq_rec_confidence'
        ),
        sa.CheckConstraint(
            "lifecycle_status IN ('GENERATED', 'PENDING_REVIEW', 'ACCEPTED', 'REJECTED', 'DEFERRED', 'SUPERSEDED', 'EXPIRED')",
            name='ck_acq_rec_lifecycle_status'
        ),
    )
    op.create_index('ix_acq_rec_measurement_id', 'acquisition_recommendations', ['measurement_id'])
    op.create_index('ix_acq_rec_target_page_id', 'acquisition_recommendations', ['target_page_id'])
    op.create_index('ix_acq_rec_target_cohort', 'acquisition_recommendations', ['target_cohort'])
    op.create_index('ix_acq_rec_lifecycle_status', 'acquisition_recommendations', ['lifecycle_status'])

    # 4. Recommendation Reviews
    op.create_table(
        'recommendation_reviews',
        sa.Column('id', sa.Text(), primary_key=True),
        sa.Column('recommendation_id', sa.Text(), sa.ForeignKey('acquisition_recommendations.id', ondelete='CASCADE'), nullable=False),
        sa.Column('reviewed_by', sa.String(100), nullable=False),
        sa.Column('review_action', sa.String(50), nullable=False),
        sa.Column('review_notes', sa.Text(), nullable=False),
        sa.Column('reviewed_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.CheckConstraint(
            "review_action IN ('ACCEPT', 'REJECT', 'DEFER', 'REQUEST_MORE_EVIDENCE')",
            name='ck_rec_reviews_action'
        ),
    )
    op.create_index('ix_rec_reviews_recommendation_id', 'recommendation_reviews', ['recommendation_id'])

    # 5. Recommendation Suppressions
    op.create_table(
        'recommendation_suppressions',
        sa.Column('id', sa.Text(), primary_key=True),
        sa.Column('target_type', sa.String(50), nullable=False),
        sa.Column('target_id', sa.Text(), nullable=False),
        sa.Column('recommendation_class', sa.String(100), nullable=False),
        sa.Column('suppressed_by', sa.String(100), nullable=False),
        sa.Column('suppression_reason', sa.Text(), nullable=False),
        sa.Column('suppressed_until', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.CheckConstraint(
            "target_type IN ('SITEWIDE', 'COHORT', 'PAGE')",
            name='ck_rec_suppressions_target_type'
        ),
    )
    op.create_index('ix_rec_suppressions_target', 'recommendation_suppressions', ['target_type', 'target_id'])


def downgrade() -> None:
    op.drop_table('recommendation_suppressions')
    op.drop_table('recommendation_reviews')
    op.drop_table('acquisition_recommendations')
    op.drop_table('query_intent_registry')
    op.drop_table('metric_semantics_registry')
