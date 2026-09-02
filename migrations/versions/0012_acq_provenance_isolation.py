"""0012_acq_provenance_isolation

Revision ID: 0012_acq_provenance_isolation
Revises: 0011_acq_recommendations
Create Date: 2026-09-02 15:00:00.000000

Phase 6B: Acquisition Provenance Isolation, Environment Boundaries, and Evidence Cleansing.
"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa

revision: str = '0012_acq_provenance_isolation'
down_revision: Union[str, None] = '0011_acq_recommendations'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. acquisition_changes
    op.add_column('acquisition_changes', sa.Column('environment', sa.String(50), nullable=False, server_default='PRODUCTION'))
    op.add_column('acquisition_changes', sa.Column('evidence_origin', sa.String(50), nullable=False, server_default='PRODUCTION'))
    op.create_check_constraint(
        'ck_acq_changes_environment',
        'acquisition_changes',
        "environment IN ('PRODUCTION', 'TEST', 'SIMULATION', 'REPLAY', 'SYNTHETIC')"
    )
    op.create_check_constraint(
        'ck_acq_changes_evidence_origin',
        'acquisition_changes',
        "evidence_origin IN ('PRODUCTION', 'SYNTHETIC', 'REPLAY', 'SIMULATION', 'TEST')"
    )

    # 2. acquisition_experiments
    op.add_column('acquisition_experiments', sa.Column('environment', sa.String(50), nullable=False, server_default='PRODUCTION'))
    op.add_column('acquisition_experiments', sa.Column('evidence_origin', sa.String(50), nullable=False, server_default='PRODUCTION'))
    op.create_check_constraint(
        'ck_acq_experiments_environment',
        'acquisition_experiments',
        "environment IN ('PRODUCTION', 'TEST', 'SIMULATION', 'REPLAY', 'SYNTHETIC')"
    )
    op.create_check_constraint(
        'ck_acq_experiments_evidence_origin',
        'acquisition_experiments',
        "evidence_origin IN ('PRODUCTION', 'SYNTHETIC', 'REPLAY', 'SIMULATION', 'TEST')"
    )

    # 3. experiment_evaluations
    op.add_column('experiment_evaluations', sa.Column('environment', sa.String(50), nullable=False, server_default='PRODUCTION'))
    op.create_check_constraint(
        'ck_exp_evaluations_environment',
        'experiment_evaluations',
        "environment IN ('PRODUCTION', 'TEST', 'SIMULATION', 'REPLAY', 'SYNTHETIC')"
    )

    # 4. acquisition_recommendations
    op.add_column('acquisition_recommendations', sa.Column('environment', sa.String(50), nullable=False, server_default='PRODUCTION'))
    op.add_column('acquisition_recommendations', sa.Column('evidence_origin', sa.String(50), nullable=False, server_default='PRODUCTION'))
    op.add_column('acquisition_recommendations', sa.Column('generation_mode', sa.String(50), nullable=False, server_default='PRODUCTION'))
    op.add_column('acquisition_recommendations', sa.Column('measurement_code_commit', sa.String(100), nullable=True))
    op.create_check_constraint(
        'ck_acq_recommendations_environment',
        'acquisition_recommendations',
        "environment IN ('PRODUCTION', 'TEST', 'SIMULATION', 'REPLAY', 'SYNTHETIC')"
    )
    op.create_check_constraint(
        'ck_acq_recommendations_evidence_origin',
        'acquisition_recommendations',
        "evidence_origin IN ('PRODUCTION', 'SYNTHETIC', 'REPLAY', 'SIMULATION', 'TEST')"
    )
    op.create_check_constraint(
        'ck_acq_recommendations_generation_mode',
        'acquisition_recommendations',
        "generation_mode IN ('PRODUCTION', 'REPLAY', 'SIMULATION', 'TEST')"
    )

    # 5. recommendation_reviews
    op.add_column('recommendation_reviews', sa.Column('environment', sa.String(50), nullable=False, server_default='PRODUCTION'))
    op.create_check_constraint(
        'ck_rec_reviews_environment',
        'recommendation_reviews',
        "environment IN ('PRODUCTION', 'TEST', 'SIMULATION', 'REPLAY', 'SYNTHETIC')"
    )

    # 6. recommendation_suppressions
    op.add_column('recommendation_suppressions', sa.Column('environment', sa.String(50), nullable=False, server_default='PRODUCTION'))
    op.create_check_constraint(
        'ck_rec_suppressions_environment',
        'recommendation_suppressions',
        "environment IN ('PRODUCTION', 'TEST', 'SIMULATION', 'REPLAY', 'SYNTHETIC')"
    )

    # 7. Clean existing test/synthetic contamination in tables
    op.execute("""
        UPDATE acquisition_changes
        SET environment = 'TEST', evidence_origin = 'TEST'
        WHERE id LIKE 'test_%' OR summary ILIKE '%test%' OR id LIKE 'chg_bridge_%';
    """)

    op.execute("""
        UPDATE acquisition_experiments
        SET environment = 'TEST', evidence_origin = 'TEST'
        WHERE id LIKE 'test_%' OR id LIKE 'exp_from_rec_%' OR change_id LIKE 'test_%';
    """)

    op.execute("""
        UPDATE experiment_evaluations
        SET environment = 'TEST'
        WHERE experiment_id LIKE 'test_%';
    """)

    op.execute("""
        UPDATE acquisition_recommendations
        SET environment = 'TEST', evidence_origin = 'TEST', generation_mode = 'TEST'
        WHERE id LIKE 'test_%' OR measurement_id NOT IN ('meas_20260830_canonical_w28', 'meas_20260802_canonical_w28');
    """)

    op.execute("""
        UPDATE recommendation_reviews
        SET environment = 'TEST'
        WHERE id LIKE 'test_%' OR reviewed_by LIKE '%test%' OR reviewed_by = 'mike_principal';
    """)

    op.execute("""
        UPDATE recommendation_suppressions
        SET environment = 'TEST'
        WHERE id LIKE 'test_%' OR suppressed_by LIKE '%test%' OR suppressed_by = 'mike_principal';
    """)


def downgrade() -> None:
    op.drop_column('recommendation_suppressions', 'environment')
    op.drop_column('recommendation_reviews', 'environment')
    op.drop_column('acquisition_recommendations', 'measurement_code_commit')
    op.drop_column('acquisition_recommendations', 'generation_mode')
    op.drop_column('acquisition_recommendations', 'evidence_origin')
    op.drop_column('acquisition_recommendations', 'environment')
    op.drop_column('experiment_evaluations', 'environment')
    op.drop_column('acquisition_experiments', 'evidence_origin')
    op.drop_column('acquisition_experiments', 'environment')
    op.drop_column('acquisition_changes', 'evidence_origin')
    op.drop_column('acquisition_changes', 'environment')
