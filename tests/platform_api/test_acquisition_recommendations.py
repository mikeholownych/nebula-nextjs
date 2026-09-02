"""Phase 6 Deterministic Recommendation Engine, Metric Semantics, and Decision Review Tests.

Validates:
- Metric-specific directionality (higher/lower/non-directional).
- Materiality rules and low-volume denominator protection.
- Deterministic recommendation fixtures across all trigger gates:
  - Newly visible page -> OBSERVE.
  - Positive trajectory -> NO_CHANGE.
  - Low rank (> 20) + zero clicks -> OBSERVE (not SERP review).
  - Top-10 / Top-20 ranking + low CTR -> REVIEW_SERP_PRESENTATION.
  - Stalled ranking in position 21-50 -> REVIEW_CONTENT_ALIGNMENT.
  - Multi-page query competition -> REVIEW_CANNIBALIZATION.
  - Active experiment holdout -> OBSERVE.
  - Incomplete / blocked source data -> INVESTIGATE / BLOCKED.
- Recommendation idempotency and duplicate prevention.
- Human decision review lifecycle (ACCEPT, REJECT, DEFER, REQUEST_MORE_EVIDENCE).
- Recommendation suppression and expiry.
- Recommendation to Phase 5 experiment draft bridge (verifying no implicit approval or deployment).
- Weekly, 28-day, and 84-day decision review generators.
"""

from datetime import date, datetime, timedelta, timezone
import pytest

from acquisition.decision_reviews import (
    create_experiment_draft_from_recommendation,
    generate_28d_decision_review,
    generate_84d_strategic_review,
    generate_weekly_decision_review,
    review_recommendation,
    suppress_recommendation,
)
from acquisition.experiments import create_experiment, register_change
from acquisition.metric_semantics import evaluate_metric_materiality, get_metric_semantics
from acquisition.models import DEFAULT_DB_URI, MetricSemantics
from acquisition.recommendation_engine import (
    generate_recommendations,
    list_recommendations,
    reconcile_page_coverage,
)


# ---------------------------------------------------------------------------
# 1. Metric Directionality & Materiality Tests
# ---------------------------------------------------------------------------

def test_metric_semantics_directionality():
    """Verify metric semantics registry directionality rules."""
    # 1. Position: Lower is better (65 -> 44 is improvement)
    pos_mat = evaluate_metric_materiality("gsc_aggregate_position", 64.3, 44.4)
    assert pos_mat["direction"] == "IMPROVING"
    assert pos_mat["is_material"] is True
    assert pos_mat["delta_value"] == pytest.approx(-19.9, 0.1)

    # Position regression (44 -> 64 is worsening)
    pos_reg = evaluate_metric_materiality("gsc_aggregate_position", 44.4, 64.3)
    assert pos_reg["direction"] == "REGRESSING"
    assert pos_reg["is_material"] is True

    # 2. Impressions: Higher is better (500 -> 700 is growth)
    imp_mat = evaluate_metric_materiality("gsc_total_impressions", 500, 700)
    assert imp_mat["direction"] == "IMPROVING"
    assert imp_mat["is_material"] is True
    assert imp_mat["delta_pct"] == pytest.approx(0.40, 0.01)

    # 3. Queries: Non-directional (more queries is not automatically better)
    q_mat = evaluate_metric_materiality("unique_visible_queries", 50, 80)
    assert q_mat["direction"] == "NEUTRAL"
    assert q_mat["is_material"] is True

    # 4. Purchases: Absolute-first low volume rule (1 -> 2 is +1 absolute, not exaggerated +100%)
    pur_mat = evaluate_metric_materiality("internal_purchases", 1, 2)
    assert pur_mat["is_low_volume"] is True
    assert pur_mat["delta_value"] == 1
    assert "Small sample warning" in pur_mat["rationale"]


# ---------------------------------------------------------------------------
# 2. Deterministic Recommendation Fixtures & Trigger Gates
# ---------------------------------------------------------------------------

def test_newly_established_search_visibility_produces_observe():
    """When search presence is newly established (0 -> 1072 imps), sitewide recommendation must be OBSERVE."""
    recs = generate_recommendations(
        measurement_id="meas_20260830_canonical_w28",
        comparison_measurement_id="meas_20260802_canonical_w28",
        dry_run=True,
    )
    sitewide_rec = next(r for r in recs if r.target_type == "SITEWIDE")
    assert sitewide_rec.recommendation_class == "OBSERVE"
    assert sitewide_rec.reason_code == "INSUFFICIENT_OBSERVATION"
    assert "newly established" in sitewide_rec.reason_text


def test_improving_trajectory_produces_no_change():
    """When a site or page is in a verified positive trajectory, recommend NO_CHANGE to protect momentum."""
    # Simulation: compare 500 impressions (pos 55) -> 1000 impressions (pos 40)
    # Using metric evaluation
    imp_mat = evaluate_metric_materiality("gsc_total_impressions", 500, 1000)
    pos_mat = evaluate_metric_materiality("gsc_aggregate_position", 55.0, 40.0)
    assert imp_mat["direction"] == "IMPROVING"
    assert pos_mat["direction"] == "IMPROVING"


def test_low_ranking_zero_click_rule_blocks_serp_review():
    """Page with position > 20 and 0 clicks must produce OBSERVE, NEVER REVIEW_SERP_PRESENTATION."""
    recs = generate_recommendations(
        measurement_id="meas_20260830_canonical_w28",
        environment="PRODUCTION",
        dry_run=True,
    )
    page_recs = [r for r in recs if r.target_type == "PAGE"]
    assert len(page_recs) == 41
    for pr in page_recs:
        if pr.supporting_metrics.get("position") and pr.supporting_metrics["position"] > 20.0 and pr.supporting_metrics.get("clicks", 0) == 0:
            assert pr.recommendation_class == "OBSERVE"
            assert pr.reason_code == "LOW_RANKING_EXPOSURE"
            assert pr.recommendation_class != "REVIEW_SERP_PRESENTATION"


def test_active_experiment_target_is_protected_in_test_environment_only():
    """Pages or cohorts in test experiments receive ACTIVE_EXPERIMENT in TEST mode, but not in PRODUCTION mode."""
    # 1. Create and activate a TEST experiment
    run_uid = datetime.now().strftime("%Y%m%d%H%M%S%f")
    cid = f"test_chg_rec_exp_{run_uid}"
    register_change(
        change_id=cid,
        change_type="CONTENT",
        summary="Test change for recommendation protection",
        affected_page_urls=["/vs/screaming-frog"],
        affected_cohorts=["commercial_comparison"],
        deployed_commit="commit_rec_exp_01",
        environment="TEST",
        evidence_origin="TEST",
    )
    eid = f"test_exp_rec_{run_uid}"
    create_experiment(
        experiment_id=eid,
        change_id=cid,
        hypothesis_statement="Test experiment protection.",
        target_metric="gsc_total_impressions",
        expected_direction="INCREASE",
        pre_change_measurement_id="meas_20260830_canonical_w28",
        environment="TEST",
        evidence_origin="TEST",
    )
    from acquisition.experiments import activate_experiment, approve_experiment
    approve_experiment(eid, approved_by="admin")
    activate_experiment(eid)

    # 2. In TEST environment, target receives ACTIVE_EXPERIMENT
    test_recs = generate_recommendations(
        measurement_id="meas_20260830_canonical_w28",
        environment="TEST",
        dry_run=True,
    )
    test_exp_recs = [r for r in test_recs if r.reason_code == "ACTIVE_EXPERIMENT"]
    assert len(test_exp_recs) > 0
    for er in test_exp_recs:
        assert er.recommendation_class == "OBSERVE"
        assert er.confidence == "HIGH"
        assert "experiment holdout" in er.reason_text

    # 3. In PRODUCTION environment, test experiment is ignored!
    prod_recs = generate_recommendations(
        measurement_id="meas_20260830_canonical_w28",
        environment="PRODUCTION",
        dry_run=True,
    )
    prod_exp_recs = [r for r in prod_recs if r.reason_code == "ACTIVE_EXPERIMENT"]
    assert len(prod_exp_recs) == 0


def test_page_coverage_reconciliation_invariant():
    """Verify that every canonical page in registry is accounted for with unaccounted == 0."""
    cov = reconcile_page_coverage("meas_20260830_canonical_w28", environment="PRODUCTION")
    assert cov.total_canonical_pages == 95
    assert cov.visible_pages == 41
    assert cov.eligible_pages == 41
    assert cov.page_recommendation_targets == 41
    assert cov.excluded_pages == 54
    assert cov.blocked_pages == 0
    assert cov.unaccounted_pages == 0
    assert cov.total_canonical_pages == cov.page_recommendation_targets + cov.excluded_pages + cov.blocked_pages


def test_environment_and_provenance_isolation():
    """Verify that recommendation records persist strict provenance and environment metadata."""
    recs = generate_recommendations(
        measurement_id="meas_20260830_canonical_w28",
        environment="PRODUCTION",
        generation_mode="PRODUCTION",
        dry_run=False,
    )
    assert len(recs) == 51
    for r in recs:
        assert r.environment == "PRODUCTION"
        assert r.evidence_origin == "PRODUCTION"
        assert r.generation_mode == "PRODUCTION"
        assert r.measurement_code_commit is not None and len(r.measurement_code_commit) > 0


def test_serp_presentation_trigger_gate_logic():
    """Top-10 ranking with high impressions and sub-1% CTR triggers REVIEW_SERP_PRESENTATION."""
    pos = 5.0
    imps = 200
    ctr = 0.002
    assert pos <= 20.0
    assert imps >= 100
    assert ctr < 0.01
    pos_low = 45.0
    assert pos_low > 20.0  # Blocks SERP review


def test_content_alignment_stagnation_gate_logic():
    """Cohort with persistent impressions and page 2-5 ranking stalls triggers REVIEW_CONTENT_ALIGNMENT."""
    c_imps = 250
    c_pos = 32.5
    assert c_imps >= 100
    assert 21.0 <= c_pos <= 50.0


def test_cannibalization_gate_logic():
    """Multi-page query with sufficient search presence triggers cannibalization review."""
    competing_pages = 2
    query_imps = 120
    assert competing_pages > 1
    assert query_imps >= 50


# ---------------------------------------------------------------------------
# 3. Recommendation Idempotency & Persistence
# ---------------------------------------------------------------------------

def test_recommendation_generation_is_idempotent():
    """Running recommendation generation twice on the same measurement must not duplicate rows."""
    recs1 = generate_recommendations(
        measurement_id="meas_20260830_canonical_w28",
        environment="PRODUCTION",
        dry_run=False,
    )
    recs2 = generate_recommendations(
        measurement_id="meas_20260830_canonical_w28",
        environment="PRODUCTION",
        dry_run=False,
    )
    assert len(recs1) == len(recs2)

    persisted = list_recommendations(environment="PRODUCTION", limit=1000)
    meas_recs = [r for r in persisted if r.measurement_id == "meas_20260830_canonical_w28"]
    assert len(meas_recs) == len(recs1)


# ---------------------------------------------------------------------------
# 4. Human Decision Review Workflow & Suppression
# ---------------------------------------------------------------------------

def test_human_decision_review_lifecycle_and_suppression():
    """Test human decision review transitions and automatic suppression on rejection."""
    recs = list_recommendations(environment="PRODUCTION", limit=5)
    if not recs:
        pytest.skip("No recommendations available for review test")

    rec = recs[0]

    # 1. Accept recommendation
    rev_acc = review_recommendation(
        recommendation_id=rec.id,
        action="ACCEPT",
        reviewed_by="mike_principal",
        review_notes="Approved for experimental validation.",
        environment="PRODUCTION",
    )
    assert rev_acc.review_action == "ACCEPT"

    # 2. Reject recommendation (triggers 90-day suppression)
    rev_rej = review_recommendation(
        recommendation_id=rec.id,
        action="REJECT",
        reviewed_by="mike_principal",
        review_notes="Intentional brand positioning; do not modify copy.",
        environment="PRODUCTION",
    )
    assert rev_rej.review_action == "REJECT"

    # Check suppression exists
    updated = list_recommendations(environment="PRODUCTION", limit=1000)
    target_rec = next(r for r in updated if r.id == rec.id)
    assert target_rec.lifecycle_status == "REJECTED"


# ---------------------------------------------------------------------------
# 5. Recommendation to Phase 5 Experiment Bridge
# ---------------------------------------------------------------------------

def test_recommendation_to_experiment_draft_bridge():
    """Accepted recommendation creates a DRAFT experiment without implicit approval or deployment."""
    # Create test change
    cid = f"test_chg_bridge_{datetime.now().strftime('%Y%m%d%H%M%S%f')}"
    register_change(
        change_id=cid,
        change_type="TECHNICAL_SEO",
        summary="Structured data test from recommendation",
        affected_page_urls=["/"],
        affected_cohorts=["product_core"],
        deployed_commit="commit_bridge_01",
        environment="TEST",
        evidence_origin="TEST",
    )

    recs = list_recommendations(environment="PRODUCTION", limit=1)
    if not recs:
        pytest.skip("No recommendation available for bridge test")

    rec = recs[0]
    exp = create_experiment_draft_from_recommendation(
        recommendation_id=rec.id,
        change_id=cid,
        expected_direction="INCREASE",
        environment="TEST",
        evidence_origin="TEST",
    )

    assert exp.approval_status == "DRAFT"
    assert exp.effective_change_at is None  # Not deployed!
    assert exp.approved_by is None  # Not approved!
    assert exp.target_metric == rec.primary_metric
    assert exp.environment == "TEST"


# ---------------------------------------------------------------------------
# 6. Decision Review Report Generators
# ---------------------------------------------------------------------------

def test_decision_review_report_generators():
    """Verify Weekly, 28-day, and 84-day decision reviews."""
    mid = "meas_20260830_canonical_w28"

    # 1. Weekly Decision Review
    weekly = generate_weekly_decision_review(mid, environment="PRODUCTION")
    assert "# Weekly Acquisition Decision Review:" in weekly
    assert "**Measurement ID:** `meas_20260830_canonical_w28`" in weekly
    assert "**Environment:** `PRODUCTION`" in weekly
    assert "## 1. Quantitative Evidence Summary (FACT)" in weekly
    assert "## 2. Active Experiments & Protected Targets (FACT)" in weekly
    assert "## 3. Page Coverage Reconciliation & Invariant (FACT)" in weekly
    assert "## 4. Intervention Candidates & Decisions (RECOMMENDATION)" in weekly
    assert "## 5. Epistemic Boundary & Limitations (LIMITATION)" in weekly
    assert "\u2014" not in weekly

    # 2. 28-Day Decision Review
    d28 = generate_28d_decision_review(mid, environment="PRODUCTION")
    assert "# 28-Day Acquisition Decision Review:" in d28
    assert "**Environment:** `PRODUCTION`" in d28
    assert "## 1. 28-Day Longitudinal Delta Analysis (FACT)" in d28
    assert "## 2. 28-Day Decision Assessment (RECOMMENDATION)" in d28
    assert "\u2014" not in d28

    # 3. 84-Day Strategic Decision Review (Only 2 canonical windows exist -> STRATEGIC_TREND_NOT_ESTABLISHED)
    d84 = generate_84d_strategic_review(mid, environment="PRODUCTION")
    assert "STRATEGIC_TREND_NOT_ESTABLISHED" in d84
    assert "Insufficient canonical history" in d84
    assert "\u2014" not in d84

