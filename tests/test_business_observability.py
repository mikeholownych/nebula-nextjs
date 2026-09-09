from business_observability import (
    LAYER_COVERAGE,
    classify_commercial_states,
    classify_metric,
    compile_snapshot,
    conversion_failure_class,
    parse_acquisition_baseline,
    primary_state,
    render_markdown,
)


def test_missing_search_is_unknown_not_zero_discovery():
    result = classify_commercial_states(
        {
            "search": {"impressions": None, "clicks": None},
            "visits": {"sessions": 0, "landing_page_views": 0},
            "funnel": {
                "audit_completed": 0,
                "checkout_started": 0,
                "checkout_creation_failed": 0,
                "purchase_completed": 0,
            },
        }
    )
    assert "not_discovered" not in result["active_states"]
    assert result["search_status"] == "UNKNOWN"


def test_zero_impressions_is_not_discovered():
    result = classify_commercial_states(
        {
            "search": {"impressions": 0, "clicks": 0},
            "visits": {"sessions": 0, "landing_page_views": 0},
            "funnel": {
                "audit_completed": 0,
                "checkout_started": 0,
                "checkout_creation_failed": 0,
                "purchase_completed": 0,
            },
        }
    )
    assert result["active_states"] == ["not_discovered"]
    assert result["search_status"] == "OBSERVED"


def test_impressions_without_clicks_or_sessions_is_discovered_no_visits():
    result = classify_commercial_states(
        {
            "search": {"impressions": 1063, "clicks": 0},
            "visits": {"sessions": 0, "landing_page_views": 0},
            "funnel": {
                "audit_completed": 0,
                "checkout_started": 0,
                "checkout_creation_failed": 0,
                "purchase_completed": 0,
            },
        }
    )
    assert result["active_states"] == ["discovered_no_visits"]


def test_visits_without_checkout_attempt_or_failure_is_didnt_convert():
    result = classify_commercial_states(
        {
            "search": {"impressions": 100, "clicks": 4},
            "visits": {"sessions": 16, "landing_page_views": 40},
            "funnel": {
                "audit_completed": 12,
                "checkout_started": 0,
                "checkout_creation_failed": 0,
                "purchase_completed": 0,
            },
        }
    )
    assert result["active_states"] == ["visits_no_conversion"]
    assert conversion_failure_class(result) == "didnt_convert"


def test_checkout_failures_with_zero_starts_is_couldnt_convert():
    result = classify_commercial_states(
        {
            "search": {"impressions": 1063, "clicks": 3},
            "visits": {"sessions": 16, "landing_page_views": 733},
            "funnel": {
                "audit_completed": 14,
                "checkout_started": 0,
                "checkout_creation_failed": 33,
                "purchase_completed": 0,
            },
        }
    )
    assert "system_prevents_conversion" in result["active_states"]
    assert conversion_failure_class(result) == "couldnt_convert"
    assert primary_state(result) == "system_prevents_conversion"


def test_primary_state_prefers_system_block_over_weak_discovery():
    result = classify_commercial_states(
        {
            "search": {"impressions": 1063, "clicks": 3},
            "visits": {"sessions": 16, "landing_page_views": 105},
            "funnel": {
                "audit_completed": 14,
                "checkout_started": 0,
                "checkout_creation_failed": 33,
                "purchase_completed": 0,
            },
        }
    )
    assert primary_state(result) == "system_prevents_conversion"
    assert "discovered_no_visits" not in result["active_states"]


def test_purchase_clears_conversion_blockers():
    result = classify_commercial_states(
        {
            "search": {"impressions": 200, "clicks": 10},
            "visits": {"sessions": 8, "landing_page_views": 8},
            "funnel": {
                "audit_completed": 4,
                "checkout_started": 2,
                "checkout_creation_failed": 0,
                "purchase_completed": 1,
            },
        }
    )
    assert result["active_states"] == []
    assert primary_state(result) == "conversion_path_working"
    assert conversion_failure_class(result) is None


def test_metric_provenance_labels():
    assert classify_metric(source="gsc", value=1063)["classification"] == "OBSERVED"
    assert classify_metric(source="derived_ctr", value=0.0028)["classification"] == "DERIVED"
    assert classify_metric(source="aeo_estimate", value=12)["classification"] == "ESTIMATED"
    assert classify_metric(source="gsc", value=None)["classification"] == "UNKNOWN"


def test_layer_coverage_has_twenty_four_named_layers():
    assert len(LAYER_COVERAGE) == 24
    assert LAYER_COVERAGE[0]["id"] == 1
    assert LAYER_COVERAGE[-1]["id"] == 24
    statuses = {layer["status"] for layer in LAYER_COVERAGE}
    assert statuses <= {"in_place", "partial", "missing"}


def test_compile_snapshot_from_funnel_health_and_baseline(tmp_path):
    funnel = {
        "generated_at": "2026-09-09T02:30:01+00:00",
        "periods": {
            "daily": {
                "start": "2026-09-08",
                "end_exclusive": "2026-09-09",
                "ledger": {
                    "audit_started": 3,
                    "audit_completed": 14,
                    "audit_results_unlocked": 0,
                    "audit_result_viewed": 105,
                    "checkout_creation_failed": 33,
                    "checkout_started": 0,
                    "purchase_completed": 0,
                },
            }
        },
        "attention": {"daily": ["CHECKOUT_FAILURES_WITH_ZERO_SUCCESSFUL_CHECKOUTS"]},
    }
    baseline = tmp_path / "ACQUISITION_BASELINE.md"
    baseline.write_text(
        "| Total impressions | 1063 | GSC dimensionless aggregate |\n"
        "| Total clicks | 3 | GSC dimensionless aggregate |\n"
        "| Total organic sessions | 16 |\n",
        encoding="utf-8",
    )
    snapshot = compile_snapshot(
        funnel_health=funnel,
        acquisition_baseline_text=baseline.read_text(encoding="utf-8"),
        technical_health={"healthy": False, "failed": 1},
        period="daily",
    )
    assert snapshot["chain"] == [
        "search_visibility",
        "acquisition",
        "landing_experience",
        "audit_journey",
        "determination",
        "repair_intent",
        "checkout",
        "revenue",
        "reobservation",
    ]
    assert snapshot["classification"]["primary_state"] == "system_prevents_conversion"
    assert snapshot["classification"]["conversion_failure_class"] == "couldnt_convert"
    assert snapshot["metrics"]["impressions"]["classification"] == "OBSERVED"
    assert snapshot["metrics"]["impressions"]["value"] == 1063
    assert snapshot["attachments"]["technical_health"]["healthy"] is False
    text = render_markdown(snapshot)
    assert "system_prevents_conversion" in text
    assert "couldnt_convert" in text
    assert "OBSERVED" in text


def test_parse_acquisition_baseline_extracts_gsc_and_ga4():
    parsed = parse_acquisition_baseline(
        "| Total impressions | 1063 | GSC dimensionless aggregate |\n"
        "| Total clicks | 3 | GSC dimensionless aggregate |\n"
        "| Total organic sessions | 16 |\n"
    )
    assert parsed == {"impressions": 1063, "clicks": 3, "sessions": 16}
