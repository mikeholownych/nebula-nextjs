"""0013_acq_ai_interpretation

Revision ID: 0013_acq_ai_interpretation
Revises: 0012_acq_provenance_isolation
Create Date: 2026-09-02 16:00:00.000000

Phase 7: Acquisition AI Interpretation, Grounding Engine, Query Intelligence, and Longitudinal Learning Store.
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '0013_acq_ai_interpretation'
down_revision: Union[str, None] = '0012_acq_provenance_isolation'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Prompt Templates Registry
    op.create_table(
        'prompt_templates_registry',
        sa.Column('prompt_id', sa.String(100), primary_key=True),
        sa.Column('prompt_version', sa.String(50), nullable=False),
        sa.Column('analysis_type', sa.String(100), nullable=False),
        sa.Column('system_instructions', sa.Text(), nullable=False),
        sa.Column('user_template', sa.Text(), nullable=False),
        sa.Column('template_hash', sa.String(64), nullable=False),
        sa.Column('effective_from', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('status', sa.String(50), server_default='ACTIVE', nullable=False),
        sa.Column('description', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.CheckConstraint(
            "status IN ('ACTIVE', 'DEPRECATED', 'DRAFT')",
            name='ck_prompt_templates_status'
        ),
        sa.CheckConstraint(
            "analysis_type IN ('SITE_SUMMARY', 'COHORT_INTERPRETATION', 'PAGE_INTERPRETATION', 'QUERY_ALIGNMENT', 'CANNIBALIZATION_REVIEW', 'EXPERIMENT_HISTORY_SYNTHESIS', 'HYPOTHESIS_GENERATION')",
            name='ck_prompt_templates_analysis_type'
        ),
    )

    # 2. AI Analysis Runs
    op.create_table(
        'ai_analysis_runs',
        sa.Column('id', sa.Text(), primary_key=True),
        sa.Column('analysis_type', sa.String(100), nullable=False),
        sa.Column('environment', sa.String(50), server_default='PRODUCTION', nullable=False),
        sa.Column('generation_mode', sa.String(50), server_default='PRODUCTION', nullable=False),
        sa.Column('measurement_id', sa.Text(), sa.ForeignKey('acquisition_measurements.id'), nullable=False),
        sa.Column('target_type', sa.String(50), nullable=False),
        sa.Column('target_id', sa.Text(), nullable=True),
        sa.Column('prompt_id', sa.String(100), sa.ForeignKey('prompt_templates_registry.prompt_id'), nullable=False),
        sa.Column('prompt_version', sa.String(50), nullable=False),
        sa.Column('model_provider', sa.String(50), nullable=False),
        sa.Column('model_identifier', sa.String(100), nullable=False),
        sa.Column('model_temperature', sa.Numeric(3, 2), server_default='0.0', nullable=False),
        sa.Column('output_schema_version', sa.String(50), server_default='1.0.0', nullable=False),
        sa.Column('evidence_manifest', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('evidence_manifest_hash', sa.String(64), nullable=False),
        sa.Column('status', sa.String(50), server_default='SUCCESS', nullable=False),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('started_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('latency_ms', sa.Integer(), nullable=True),
        sa.CheckConstraint(
            "environment IN ('PRODUCTION', 'TEST', 'SIMULATION', 'REPLAY', 'SYNTHETIC')",
            name='ck_ai_runs_environment'
        ),
        sa.CheckConstraint(
            "generation_mode IN ('PRODUCTION', 'REPLAY', 'SIMULATION', 'TEST')",
            name='ck_ai_runs_generation_mode'
        ),
        sa.CheckConstraint(
            "status IN ('PENDING', 'SUCCESS', 'INVALID_OUTPUT', 'CONTRADICTED', 'FAILED')",
            name='ck_ai_runs_status'
        ),
    )

    # 3. AI Analysis Results
    op.create_table(
        'ai_analysis_results',
        sa.Column('id', sa.Text(), primary_key=True),
        sa.Column('run_id', sa.Text(), sa.ForeignKey('ai_analysis_runs.id', ondelete='CASCADE'), nullable=False),
        sa.Column('raw_structured_output', postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column('observations', postgresql.JSONB(astext_type=sa.Text()), server_default='[]', nullable=False),
        sa.Column('inferences', postgresql.JSONB(astext_type=sa.Text()), server_default='[]', nullable=False),
        sa.Column('hypotheses', postgresql.JSONB(astext_type=sa.Text()), server_default='[]', nullable=False),
        sa.Column('alternative_explanations', postgresql.JSONB(astext_type=sa.Text()), server_default='[]', nullable=False),
        sa.Column('investigation_suggestions', postgresql.JSONB(astext_type=sa.Text()), server_default='[]', nullable=False),
        sa.Column('uncertainties', postgresql.JSONB(astext_type=sa.Text()), server_default='[]', nullable=False),
        sa.Column('contradictions', postgresql.JSONB(astext_type=sa.Text()), server_default='[]', nullable=False),
        sa.Column('challenges', postgresql.JSONB(astext_type=sa.Text()), server_default='[]', nullable=False),
        sa.Column('required_evidence', postgresql.JSONB(astext_type=sa.Text()), server_default='[]', nullable=False),
        sa.Column('review_status', sa.String(50), server_default='UNREVIEWED', nullable=False),
        sa.Column('reviewed_by', sa.String(100), nullable=True),
        sa.Column('review_notes', sa.Text(), nullable=True),
        sa.Column('reviewed_at', sa.DateTime(timezone=True), nullable=True),
        sa.CheckConstraint(
            "review_status IN ('UNREVIEWED', 'ACCEPTED_AS_ANALYSIS', 'REJECTED', 'NEEDS_MORE_EVIDENCE')",
            name='ck_ai_results_review_status'
        ),
    )

    # 4. AI Analysis Challenges
    op.create_table(
        'ai_analysis_challenges',
        sa.Column('id', sa.Text(), primary_key=True),
        sa.Column('run_id', sa.Text(), sa.ForeignKey('ai_analysis_runs.id', ondelete='CASCADE'), nullable=False),
        sa.Column('challenge_type', sa.String(100), nullable=False),
        sa.Column('target_type', sa.String(50), nullable=False),
        sa.Column('target_id', sa.Text(), nullable=True),
        sa.Column('deterministic_decision', sa.Text(), nullable=False),
        sa.Column('challenge_reason', sa.Text(), nullable=False),
        sa.Column('supporting_evidence_ids', postgresql.ARRAY(sa.Text()), server_default='{}', nullable=False),
        sa.Column('proposed_review', sa.Text(), nullable=False),
        sa.Column('status', sa.String(50), server_default='OPEN', nullable=False),
        sa.Column('reviewed_by', sa.String(100), nullable=True),
        sa.Column('review_notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.CheckConstraint(
            "challenge_type IN ('POSSIBLE_RULE_GAP', 'POSSIBLE_DATA_GAP', 'POSSIBLE_CLASSIFICATION_GAP', 'POSSIBLE_QUERY_ALIGNMENT_GAP')",
            name='ck_ai_challenges_type'
        ),
        sa.CheckConstraint(
            "status IN ('OPEN', 'ACCEPTED', 'DISMISSED')",
            name='ck_ai_challenges_status'
        ),
    )

    # 5. Acquisition Longitudinal Learning Store
    op.create_table(
        'acquisition_learning_store',
        sa.Column('id', sa.Text(), primary_key=True),
        sa.Column('scope_type', sa.String(50), nullable=False),
        sa.Column('scope_id', sa.String(100), nullable=False),
        sa.Column('intervention_type', sa.String(100), nullable=False),
        sa.Column('pattern_statement', sa.Text(), nullable=False),
        sa.Column('evidence_state', sa.String(50), nullable=False),
        sa.Column('supporting_experiment_ids', postgresql.ARRAY(sa.Text()), server_default='{}', nullable=False),
        sa.Column('contradicting_experiment_ids', postgresql.ARRAY(sa.Text()), server_default='{}', nullable=False),
        sa.Column('confounded_experiment_ids', postgresql.ARRAY(sa.Text()), server_default='{}', nullable=False),
        sa.Column('environment', sa.String(50), server_default='PRODUCTION', nullable=False),
        sa.Column('first_observed_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('last_updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('metadata', postgresql.JSONB(astext_type=sa.Text()), server_default='{}', nullable=False),
        sa.CheckConstraint(
            "evidence_state IN ('ONE_OBSERVATION', 'REPEATED_SIGNAL', 'SUPPORTED_PATTERN', 'CONFLICTING_EVIDENCE', 'INSUFFICIENT_EVIDENCE')",
            name='ck_learning_store_evidence_state'
        ),
        sa.CheckConstraint(
            "environment IN ('PRODUCTION', 'TEST', 'SIMULATION', 'REPLAY', 'SYNTHETIC')",
            name='ck_learning_store_environment'
        ),
    )

    # Seed Initial Prompt Templates
    op.execute("""
        INSERT INTO prompt_templates_registry (
            prompt_id, prompt_version, analysis_type, system_instructions, user_template,
            template_hash, description
        ) VALUES
        (
            'prm_site_summary_v1', '1.0.0', 'SITE_SUMMARY',
            'You are an evidence-bound acquisition intelligence specialist. You interpret deterministic search and funnel telemetry without speculating beyond provided evidence. You must cite evidence IDs for all statements and never claim ranking trends when prior periods are unobserved.',
            'Analyze sitewide evidence for measurement {{measurement_id}}. Deterministic trend: {{trend_classification}}. Recommendations: {{recommendations_summary}}.',
            'hash_site_summary_v1', 'Sitewide longitudinal evidence interpretation and macro visibility analysis.'
        ),
        (
            'prm_cohort_interpretation_v1', '1.0.0', 'COHORT_INTERPRETATION',
            'You are an evidence-bound cohort analyst. Compare cohort search impressions, ranking distribution, and keyword coverage. Adhere to the rule that low volume high rankings do not prove repeatability.',
            'Analyze cohort {{target_id}} in measurement {{measurement_id}}. Evidence: {{cohort_evidence}}.',
            'hash_cohort_interpretation_v1', 'Cohort-level search visibility and ranking stagnation analysis.'
        ),
        (
            'prm_page_interpretation_v1', '1.0.0', 'PAGE_INTERPRETATION',
            'You are an evidence-bound page performance analyst. Evaluate page visibility, position buckets, and CTR in the context of ranking position. Clicks are not expected at positions > 20.',
            'Analyze page {{target_id}} ({{canonical_url}}) in measurement {{measurement_id}}. Metrics: {{page_metrics}}.',
            'hash_page_interpretation_v1', 'Page-level search presence and SERP presentation evaluation.'
        ),
        (
            'prm_query_alignment_v1', '1.0.0', 'QUERY_ALIGNMENT',
            'You are a semantic query intelligence analyst. Compare observed Google Search Console query terms against intended page positioning in query_intent_registry. Acknowledge GSC query privacy sampling limitations.',
            'Analyze query alignment for page {{target_id}}. Intended intent: {{intended_intent}}. Observed queries: {{observed_queries}}.',
            'hash_query_alignment_v1', 'Query intent alignment and semantic overlap evaluation.'
        ),
        (
            'prm_cannibalization_review_v1', '1.0.0', 'CANNIBALIZATION_REVIEW',
            'You are a search query cannibalization specialist. Analyze multi-page ranking competition for query terms with >= 50 impressions.',
            'Analyze query competition for query {{query_text}} across competing URLs {{competing_urls}}.',
            'hash_cannibalization_review_v1', 'Multi-page query cannibalization and semantic overlap analysis.'
        ),
        (
            'prm_experiment_history_v1', '1.0.0', 'EXPERIMENT_HISTORY_SYNTHESIS',
            'You are an acquisition experimentation synthesizer. Synthesize historical controlled experiment outcomes. Distinguish clean supported results from confounded or regressed trials.',
            'Synthesize experiment history for intervention {{intervention_type}} in cohort {{scope_id}}. Experiments: {{experiments_summary}}.',
            'hash_experiment_history_v1', 'Longitudinal experiment synthesis and causal pattern learning.'
        ),
        (
            'prm_hypothesis_generation_v1', '1.0.0', 'HYPOTHESIS_GENERATION',
            'You are an acquisition hypothesis formulation assistant. Formulate falsifiable, bounded hypotheses with expected observations if true and if false, plus required additional evidence.',
            'Formulate testable hypotheses for target {{target_id}} based on deterministic condition {{detected_condition}} and evidence {{evidence_summary}}.',
            'hash_hypothesis_generation_v1', 'Falsifiable acquisition hypothesis generation.'
        );
    """)


def downgrade() -> None:
    op.drop_table('acquisition_learning_store')
    op.drop_table('ai_analysis_challenges')
    op.drop_table('ai_analysis_results')
    op.drop_table('ai_analysis_runs')
    op.drop_table('prompt_templates_registry')
