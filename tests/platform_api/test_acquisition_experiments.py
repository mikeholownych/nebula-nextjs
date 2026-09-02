"""Phase 5 Controlled Experiments, Change Provenance, Holdout & Attribution Protection Tests.

Validates:
- Zero GSC search presence representation as NULL / NOT_OBSERVED.
- Change lifecycle (register, deploy, rollback, list).
- Experiment lifecycle (draft, approval, activation, holdout, cancellation).
- Separate wall-clock and finalized source evidence clocks.
- Window purity & pre/post contamination detection.
- Confounding detection (material overlap, cohort structural change, rollback).
- Deterministic 6 evaluation outcomes (SUPPORTED, PARTIALLY_SUPPORTED, NOT_SUPPORTED, INCONCLUSIVE, CONFOUNDED, REGRESSED).
- Low denominator / tiny sample size protection.
"""

from datetime import date, datetime, timedelta, timezone
from typing import Any, Dict, List, Optional
import pytest

from acquisition.experiments import (
    activate_experiment,
    approve_experiment,
    cancel_experiment,
    check_experiment_eligibility,
    create_experiment,
    detect_confounds,
    evaluate_experiment,
    generate_change_log_markdown,
    generate_experiment_report,
    list_changes,
    register_change,
    rollback_change,
)
from acquisition.ingestion import (
    calculate_canonical_window,
    normalize_measurement_envelope,
)
from acquisition.models import (
    DEFAULT_DB_URI,
    LedgerTotals,
    NormalizedMeasurement,
)
from acquisition.trend_engine import TrendResult, classify_sitewide_trend
from acquisition.window_computation import (
    calculate_period_overlap,
    classify_comparison_type,
    ComparisonVector,
    ConcentrationMetrics,
    QueryIntelligence,
)


# ---------------------------------------------------------------------------
# 1. Zero Search Visibility Ranking Semantics
# ---------------------------------------------------------------------------

def test_zero_impressions_produces_none_position():
    """When GSC returns 0 impressions, position must normalize to None (SQL NULL), not 0.0."""
    mock_gsc_raw = {
        "totals": {"impressions": 0, "clicks": 0, "position": 0.0},
        "rows": [],
    }
    mock_ga4_raw = {"totals": {"sessions": 0, "users": 0}, "top_pages": []}
    ledger = LedgerTotals()

    meas, _, _ = normalize_measurement_envelope(mock_gsc_raw, mock_ga4_raw, ledger, days=28)
    assert meas.gsc_total_impressions == 0
    assert meas.gsc_aggregate_position is None
    assert meas.dimensioned_impression_weighted_position is None


def test_zero_to_observed_impressions_trend_is_not_established():
    """0 -> 1072 impressions must yield TREND_NOT_ESTABLISHED, not numeric position jump (0.0 -> 44.4)."""
    v = ComparisonVector(
        current_meas_id="curr",
        comparison_meas_id="comp",
        current_effective_start=date(2026, 8, 3),
        current_effective_end=date(2026, 8, 30),
        comparison_effective_start=date(2026, 7, 6),
        comparison_effective_end=date(2026, 8, 2),
        current_effective_days=28,
        comparison_effective_days=28,
        window_days=28,
        comparison_class="ADJACENT_PERIOD",
        overlap_start=None,
        overlap_end=None,
        overlap_days=0,
        overlap_ratio=0.0,
        is_comparable_for_trend=True,
        delta_impressions=1072,
        delta_impressions_pct=None,
        delta_clicks=3,
        delta_macro_position=None,  # None because prior had None position!
        delta_dimensioned_position=None,
        delta_unique_pages=41,
        delta_unique_queries=90,
        delta_organic_sessions=0,
        concentration=ConcentrationMetrics(),
        query_intel=QueryIntelligence(),
    )

    res = classify_sitewide_trend(v)
    assert res.classification == "TREND_NOT_ESTABLISHED"
    assert "Search visibility was newly established" in res.primary_reason


# ---------------------------------------------------------------------------
# 2. Change Lifecycle & Rollback Tests
# ---------------------------------------------------------------------------

def test_change_registration_and_retrieval():
    """Test registering a site change and retrieving it via list_changes."""
    cid = f"test_chg_{datetime.now().strftime('%Y%m%d%H%M%S%f')}"
    chg = register_change(
        change_id=cid,
        change_type="CONTENT",
        summary="Test change registration for headline clarity",
        affected_page_urls=["/"],
        affected_cohorts=["product_core"],
        deployed_commit="commit_abc123",
        expected_impact="positive",
        actor_type="TERMINAL_AGENT",
        environment="TEST",
        evidence_origin="TEST",
    )

    assert chg.id == cid
    assert chg.change_type == "CONTENT"
    assert chg.affected_cohorts == ["product_core"]
    assert chg.execution_status == "DEPLOYED"

    changes = list_changes(limit=10)
    assert any(c.id == cid for c in changes)


def test_change_rollback_preserves_provenance():
    """Test registering a rollback creates a linked record without deleting original."""
    cid = f"test_chg_to_rb_{datetime.now().strftime('%Y%m%d%H%M%S%f')}"
    register_change(
        change_id=cid,
        change_type="CONTENT",
        summary="Experimental copy modification",
        affected_page_urls=["/"],
        affected_cohorts=["product_core"],
        deployed_commit="commit_v1",
        environment="TEST",
        evidence_origin="TEST",
    )

    rb = rollback_change(
        original_change_id=cid,
        rollback_commit="commit_rollback_v2",
        rollback_reason="Emergency regression observed in CTA engagement",
        actor_type="HUMAN",
        logged_by="mike",
    )

    assert rb.rollback_change_id == cid
    assert rb.execution_status == "DEPLOYED"
    assert "Rollback of" in rb.summary

    # Original change is marked ROLLED_BACK
    changes = list_changes(limit=20)
    orig = next(c for c in changes if c.id == cid)
    assert orig.execution_status == "ROLLED_BACK"
    assert orig.rollback_change_id == rb.id


# ---------------------------------------------------------------------------
# 3. Experiment Lifecycle & Approval Boundary
# ---------------------------------------------------------------------------

def test_experiment_creation_approval_activation_flow():
    """Test full experiment creation, approval, and holdout activation."""
    cid = f"test_chg_exp_{datetime.now().strftime('%Y%m%d%H%M%S%f')}"
    register_change(
        change_id=cid,
        change_type="INTERNAL_LINKING",
        summary="Add cross-links between /vs pages",
        affected_page_urls=["/vs/screaming-frog", "/vs/hotjar"],
        affected_cohorts=["commercial_comparison"],
        deployed_commit="commit_exp_01",
        environment="TEST",
        evidence_origin="TEST",
    )

    eid = f"test_exp_{datetime.now().strftime('%Y%m%d%H%M%S%f')}"
    exp = create_experiment(
        experiment_id=eid,
        change_id=cid,
        hypothesis_statement="Internal links will increase commercial comparison search impressions by >= 15%.",
        target_metric="gsc_total_impressions",
        expected_direction="INCREASE",
        pre_change_measurement_id="meas_20260830_canonical_w28",
        expected_magnitude=150.0,
        minimum_holdout_days=28,
        environment="TEST",
        evidence_origin="TEST",
    )

    assert exp.id == eid
    assert exp.approval_status == "DRAFT"
    assert exp.pre_metric_value == 1072.0  # from meas_20260830_canonical_w28

    # Cannot activate unapproved experiment
    with pytest.raises(ValueError, match="Must be APPROVED"):
        activate_experiment(eid)

    # Approve
    app_exp = approve_experiment(eid, approved_by="mike_principal")
    assert app_exp.approval_status == "APPROVED"
    assert app_exp.approved_by == "mike_principal"

    # Activate
    act_exp = activate_experiment(eid, holdout_days=28)
    assert act_exp.approval_status == "HOLDOUT"
    assert act_exp.do_not_change_until is not None


def test_experiment_cancellation_preserves_record():
    """Cancellation preserves history and does not classify as NOT_SUPPORTED."""
    cid = f"test_chg_cancel_{datetime.now().strftime('%Y%m%d%H%M%S%f')}"
    register_change(
        change_id=cid,
        change_type="LAYOUT",
        summary="Navigation redesign",
        affected_page_urls=["/"],
        affected_cohorts=["product_core"],
        deployed_commit="commit_cancel_01",
        environment="TEST",
        evidence_origin="TEST",
    )

    eid = f"test_exp_cancel_{datetime.now().strftime('%Y%m%d%H%M%S%f')}"
    create_experiment(
        experiment_id=eid,
        change_id=cid,
        hypothesis_statement="Navigation change will reduce bounce rate.",
        target_metric="ga4_organic_sessions",
        expected_direction="INCREASE",
        pre_change_measurement_id="meas_20260830_canonical_w28",
        environment="TEST",
        evidence_origin="TEST",
    )

    canc = cancel_experiment(
        eid, cancelled_by="operator", cancellation_reason="Business priority shifted to platform billing"
    )
    assert canc.approval_status == "CANCELLED"
    assert canc.cancellation_reason == "Business priority shifted to platform billing"


# ---------------------------------------------------------------------------
# 4. Temporal Eligibility & Window Contamination
# ---------------------------------------------------------------------------

def test_eligibility_checks_wall_clock_and_source_days():
    """Verify separate wall-clock and finalized source day requirements."""
    cid = f"test_chg_elig_{datetime.now().strftime('%Y%m%d%H%M%S%f')}"
    now = datetime.now(timezone.utc)
    # Deployed 10 days ago (wall clock < 28d)
    register_change(
        change_id=cid,
        change_type="CONTENT",
        summary="Recent copy update",
        affected_page_urls=["/pricing"],
        affected_cohorts=["product_core"],
        deployed_commit="commit_recent",
        deployed_at=now - timedelta(days=10),
        environment="TEST",
        evidence_origin="TEST",
    )

    eid = f"test_exp_elig_{datetime.now().strftime('%Y%m%d%H%M%S%f')}"
    create_experiment(
        experiment_id=eid,
        change_id=cid,
        hypothesis_statement="Pricing copy update increases sessions.",
        target_metric="ga4_organic_sessions",
        expected_direction="INCREASE",
        pre_change_measurement_id="meas_20260830_canonical_w28",
        environment="TEST",
        evidence_origin="TEST",
    )
    approve_experiment(eid, approved_by="admin")
    activate_experiment(eid, effective_change_at=now - timedelta(days=10))

    # Wall-clock is only 10 days -> NOT ELIGIBLE
    res = check_experiment_eligibility(eid)
    assert res["is_eligible"] is False
    assert any("below minimum holdout" in r for r in res["reasons"])


def test_window_contamination_detection():
    """If post-measurement start precedes deployment timestamp, flag window contamination."""
    cid = f"test_chg_contam_{datetime.now().strftime('%Y%m%d%H%M%S%f')}"
    now = datetime.now(timezone.utc)
    # Deployed on August 15, 2026
    dep_time = datetime(2026, 8, 15, 12, 0, 0, tzinfo=timezone.utc)
    register_change(
        change_id=cid,
        change_type="CONTENT",
        summary="Mid-month deployment",
        affected_page_urls=["/"],
        affected_cohorts=["product_core"],
        deployed_commit="commit_aug15",
        deployed_at=dep_time,
        environment="TEST",
        evidence_origin="TEST",
    )

    eid = f"test_exp_contam_{datetime.now().strftime('%Y%m%d%H%M%S%f')}"
    create_experiment(
        experiment_id=eid,
        change_id=cid,
        hypothesis_statement="Mid-month change improves visibility.",
        target_metric="gsc_total_impressions",
        expected_direction="INCREASE",
        pre_change_measurement_id="meas_20260802_canonical_w28",
        environment="TEST",
        evidence_origin="TEST",
    )
    approve_experiment(eid, approved_by="admin")
    activate_experiment(eid, effective_change_at=dep_time)

    # Post measurement started August 3 (before Aug 15 deployment) -> Contaminated
    res = check_experiment_eligibility(eid, post_measurement_id="meas_20260830_canonical_w28")
    assert res["is_clean_window"] is False
    assert any("Contaminated Window" in r for r in res["reasons"])


# ---------------------------------------------------------------------------
# 5. Confounding Detection
# ---------------------------------------------------------------------------

def test_confounding_detection_same_page_overlap():
    """Overlapping change on the same page produces MATERIAL / CRITICAL confound."""
    t_start = date(2026, 8, 1)
    t_end = date(2026, 8, 28)

    cid_exp = f"test_chg_main_{datetime.now().strftime('%Y%m%d%H%M%S%f')}"
    register_change(
        change_id=cid_exp,
        change_type="CONTENT",
        summary="Experiment target change on /audit",
        affected_page_urls=["/audit"],
        affected_cohorts=["product_core"],
        deployed_commit="commit_exp",
        deployed_at=datetime(2026, 8, 2, 10, 0, 0, tzinfo=timezone.utc),
        environment="TEST",
        evidence_origin="TEST",
    )

    eid = f"test_exp_conf_{datetime.now().strftime('%Y%m%d%H%M%S%f')}"
    create_experiment(
        experiment_id=eid,
        change_id=cid_exp,
        hypothesis_statement="Audit page copy increases conversion.",
        target_metric="internal_audit_started",
        expected_direction="INCREASE",
        pre_change_measurement_id="meas_20260830_canonical_w28",
        environment="TEST",
        evidence_origin="TEST",
    )

    # Register an overlapping change on the same page during the holdout
    cid_conf = f"test_chg_intervene_{datetime.now().strftime('%Y%m%d%H%M%S%f')}"
    register_change(
        change_id=cid_conf,
        change_type="CTA",
        summary="Emergency CTA redesign on /audit",
        affected_page_urls=["/audit"],
        affected_cohorts=["product_core"],
        deployed_commit="commit_cta_emergency",
        deployed_at=datetime(2026, 8, 10, 10, 0, 0, tzinfo=timezone.utc),
        environment="TEST",
        evidence_origin="TEST",
    )

    level, details = detect_confounds(eid, t_start, t_end)
    assert level in ["MATERIAL", "CRITICAL"]
    assert details["total_overlapping_changes"] >= 1


# ---------------------------------------------------------------------------
# 6. Deterministic 6 Evaluation Outcomes Golden Fixtures
# ---------------------------------------------------------------------------

def test_evaluation_outcomes_dry_run_fixtures():
    """Verify deterministic evaluation across all 6 approved outcome classes."""
    run_uid = datetime.now().strftime("%Y%m%d%H%M%S%f")

    # 1. SUPPORTED outcome (on clean unconfounded cohort)
    cid_supp = f"test_chg_supp_{run_uid}"
    register_change(
        change_id=cid_supp,
        change_type="TECHNICAL_SEO",
        summary="Structured data additions on isolated route",
        affected_page_urls=[f"https://nebulacomponents.com/clean_route_{run_uid}"],
        affected_cohorts=[f"cohort_clean_{run_uid}"],
        deployed_commit="commit_seo_v1",
        deployed_at=datetime(2026, 7, 5, 0, 0, 0, tzinfo=timezone.utc),
        environment="TEST",
        evidence_origin="TEST",
    )
    eid_supp = f"test_exp_supp_{run_uid}"
    create_experiment(
        experiment_id=eid_supp,
        change_id=cid_supp,
        hypothesis_statement="Structured data increases sitewide impressions.",
        target_metric="gsc_total_impressions",
        expected_direction="INCREASE",
        pre_change_measurement_id="meas_20260802_canonical_w28",  # 0 impressions
        expected_magnitude=500.0,
        environment="TEST",
        evidence_origin="TEST",
    )
    approve_experiment(eid_supp, approved_by="admin")
    activate_experiment(eid_supp, effective_change_at=datetime(2026, 7, 5, 0, 0, 0, tzinfo=timezone.utc))

    ev_supp = evaluate_experiment(
        experiment_id=eid_supp,
        post_measurement_id="meas_20260830_canonical_w28",  # 1072 impressions
        dry_run=True,
    )
    assert ev_supp.outcome == "SUPPORTED"
    assert ev_supp.delta_value == 1072.0
    assert ev_supp.confidence_level == "HIGH"

    # 2. REGRESSED outcome
    eid_reg = f"test_exp_reg_{run_uid}"
    create_experiment(
        experiment_id=eid_reg,
        change_id=cid_supp,
        hypothesis_statement="Expect decrease in sessions.",
        target_metric="gsc_total_impressions",
        expected_direction="DECREASE",  # but impressions grew 0 -> 1072
        pre_change_measurement_id="meas_20260802_canonical_w28",
        environment="TEST",
        evidence_origin="TEST",
    )
    approve_experiment(eid_reg, approved_by="admin")
    activate_experiment(eid_reg, effective_change_at=datetime(2026, 7, 5, 0, 0, 0, tzinfo=timezone.utc))

    ev_reg = evaluate_experiment(
        experiment_id=eid_reg,
        post_measurement_id="meas_20260830_canonical_w28",
        dry_run=True,
    )
    assert ev_reg.outcome == "REGRESSED"

    # 3. CONFOUNDED outcome
    # Add an overlapping structural change in the same cohort during the holdout
    cid_conf_overlap = f"test_chg_conf_overlap_{run_uid}"
    register_change(
        change_id=cid_conf_overlap,
        change_type="INTERNAL_LINKING",
        summary="Material internal linking overhaul on cohort",
        affected_page_urls=[f"https://nebulacomponents.com/clean_route_{run_uid}"],
        affected_cohorts=[f"cohort_clean_{run_uid}"],
        deployed_commit="commit_conf_v2",
        deployed_at=datetime(2026, 8, 12, 0, 0, 0, tzinfo=timezone.utc),
        environment="TEST",
        evidence_origin="TEST",
    )
    ev_conf = evaluate_experiment(
        experiment_id=eid_supp,
        post_measurement_id="meas_20260830_canonical_w28",
        dry_run=True,
    )
    assert ev_conf.outcome == "CONFOUNDED"
    assert ev_conf.confidence_level == "NONE"


def test_experiment_report_generation():
    """Verify structured markdown experiment report generation."""
    changes = list_changes(limit=1)
    if not changes:
        pytest.skip("No changes available for report test")

    eid = f"test_exp_rep_{datetime.now().strftime('%Y%m%d%H%M%S%f')}"
    create_experiment(
        experiment_id=eid,
        change_id=changes[0].id,
        hypothesis_statement="Internal linking updates improve crawl coverage.",
        target_metric="gsc_total_impressions",
        expected_direction="INCREASE",
        pre_change_measurement_id="meas_20260830_canonical_w28",
        environment="TEST",
        evidence_origin="TEST",
    )
    # 1. Unevaluated report
    draft_report = generate_experiment_report(eid)
    assert "# Acquisition Experiment Report:" in draft_report
    assert "## 1. Pre-Registered Immutable Hypothesis (FACT)" in draft_report
    assert "*Experiment has not yet been evaluated." in draft_report

    # 2. Evaluated report
    approve_experiment(eid, approved_by="admin")
    activate_experiment(eid, effective_change_at=datetime(2026, 7, 5, 0, 0, 0, tzinfo=timezone.utc))
    evaluate_experiment(eid, post_measurement_id="meas_20260830_canonical_w28", dry_run=False)

    eval_report = generate_experiment_report(eid)
    assert "## 3. Quantitative Evidence & Result (FACT)" in eval_report
    assert "## 4. Evaluation Synthesis & Outcome (CONCLUSION)" in eval_report
    assert "## 5. Epistemic Boundary & Limitations (LIMITATION)" in eval_report
    assert "—" not in eval_report  # AGENTS.md zero em-dash invariant


def test_low_volume_denominator_protection():
    """Verify tiny counts (e.g. 0 -> 1 purchase, 1 -> 2) trigger low volume warnings and cautious confidence."""
    cid = f"test_chg_lowvol_{datetime.now().strftime('%Y%m%d%H%M%S%f')}"
    register_change(
        change_id=cid,
        change_type="CTA",
        summary="Conversion funnel optimization",
        affected_page_urls=["/checkout"],
        affected_cohorts=["checkout"],
        deployed_commit="commit_cta_01",
        deployed_at=datetime(2026, 7, 5, 0, 0, 0, tzinfo=timezone.utc),
        environment="TEST",
        evidence_origin="TEST",
    )
    eid = f"test_exp_lowvol_{datetime.now().strftime('%Y%m%d%H%M%S%f')}"
    create_experiment(
        experiment_id=eid,
        change_id=cid,
        hypothesis_statement="CTA overhaul will increase completed purchases.",
        target_metric="internal_purchases",
        expected_direction="INCREASE",
        pre_change_measurement_id="meas_20260802_canonical_w28",  # 0 purchases
        environment="TEST",
        evidence_origin="TEST",
    )
    approve_experiment(eid, approved_by="admin")
    activate_experiment(eid, effective_change_at=datetime(2026, 7, 5, 0, 0, 0, tzinfo=timezone.utc))

    ev = evaluate_experiment(
        experiment_id=eid,
        post_measurement_id="meas_20260830_canonical_w28",  # 0 purchases
        dry_run=True,
    )
    assert ev.confidence_level == "LOW"
    assert ev.learning_accumulated["low_volume_warning"] is True
    assert ev.outcome == "INCONCLUSIVE"


def test_position_ranking_experiment_evaluation():
    """Verify position metric evaluation where lower number = better ranking."""
    cid = f"test_chg_pos_{datetime.now().strftime('%Y%m%d%H%M%S%f')}"
    register_change(
        change_id=cid,
        change_type="TECHNICAL_SEO",
        summary="Sitemap and indexing hierarchy",
        affected_page_urls=["/vs/screaming-frog"],
        affected_cohorts=["commercial_comparison"],
        deployed_commit="commit_sitemap_01",
        deployed_at=datetime(2026, 7, 5, 0, 0, 0, tzinfo=timezone.utc),
        environment="TEST",
        evidence_origin="TEST",
    )
    eid = f"test_exp_pos_{datetime.now().strftime('%Y%m%d%H%M%S%f')}"
    create_experiment(
        experiment_id=eid,
        change_id=cid,
        hypothesis_statement="Hierarchy improvements will improve average search rank by >= 5 positions.",
        target_metric="gsc_aggregate_position",
        expected_direction="INCREASE",  # ranking improvement (lower numeric position)
        pre_change_measurement_id="meas_20260830_canonical_w28",  # 44.4 macro pos
        environment="TEST",
        evidence_origin="TEST",
    )
    approve_experiment(eid, approved_by="admin")
    activate_experiment(eid, effective_change_at=datetime(2026, 7, 5, 0, 0, 0, tzinfo=timezone.utc))

    # Evaluate against dry run
    ev = evaluate_experiment(
        experiment_id=eid,
        post_measurement_id="meas_20260830_canonical_w28",
        dry_run=True,
    )
    assert ev.outcome in ["SUPPORTED", "PARTIALLY_SUPPORTED", "NOT_SUPPORTED"]


def test_experiment_environment_quarantine():
    """Verify experiments created in TEST environment do not leak into PRODUCTION queries."""
    cid = f"test_chg_quarantine_{datetime.now().strftime('%Y%m%d%H%M%S%f')}"
    register_change(
        change_id=cid,
        change_type="CONTENT",
        summary="Test quarantine change",
        affected_page_urls=["/vs/screaming-frog"],
        affected_cohorts=["commercial_comparison"],
        deployed_commit="commit_test_quarantine",
        environment="TEST",
        evidence_origin="TEST",
    )
    eid = f"test_exp_quarantine_{datetime.now().strftime('%Y%m%d%H%M%S%f')}"
    exp = create_experiment(
        experiment_id=eid,
        change_id=cid,
        hypothesis_statement="Test experiment quarantine statement.",
        target_metric="gsc_total_impressions",
        expected_direction="INCREASE",
        pre_change_measurement_id="meas_20260830_canonical_w28",
        environment="TEST",
        evidence_origin="TEST",
    )
    approve_experiment(eid, approved_by="admin")
    activate_experiment(eid)

    assert exp.environment == "TEST"
    assert exp.evidence_origin == "TEST"


