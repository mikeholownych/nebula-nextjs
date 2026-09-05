from datetime import date

from scripts.funnel_health_monitor import build_periods, flags, render_markdown


def test_periods_use_complete_daily_weekly_and_calendar_month_windows():
    periods = build_periods(date(2026, 9, 4))

    assert periods["daily"].start == date(2026, 9, 3)
    assert periods["daily"].end == date(2026, 9, 4)
    assert periods["weekly"].start == date(2026, 8, 24)
    assert periods["weekly"].end == date(2026, 8, 31)
    assert periods["monthly"].start == date(2026, 8, 1)
    assert periods["monthly"].end == date(2026, 9, 1)
    assert periods["monthly"].previous_start == date(2026, 7, 1)
    assert periods["monthly"].previous_end == date(2026, 8, 1)


def test_flags_surface_checkout_and_unlock_risks():
    snapshot = {
        "ledger": {
            "audit_started": 24,
            "audit_completed": 12,
            "audit_results_unlocked": 0,
            "checkout_creation_failed": 4,
            "checkout_started": 0,
            "purchase_completed": 0,
        },
        "previous_ledger": {
            "audit_started": 0,
            "audit_completed": 0,
            "audit_results_unlocked": 2,
            "checkout_creation_failed": 0,
            "checkout_started": 0,
            "purchase_completed": 0,
        },
        "unlock_reconciliation": {
            "ledger": 0,
            "previous_ledger": 2,
            "posthog": 2,
            "previous_posthog": 2,
        },
    }

    assert flags(snapshot) == [
        "CHECKOUT_FAILURES_WITH_ZERO_SUCCESSFUL_CHECKOUTS",
        "AUDIT_STARTS_EXCEED_COMPLETIONS",
        "RESULT_UNLOCKS_DROPPED_TO_ZERO",
        "UNLOCK_LEDGER_BACKFILL_PENDING",
        "NO_PURCHASE_SIGNAL",
    ]


def test_markdown_contains_all_cadences_and_attention_section():
    base = {
        "start": "2026-09-03",
        "end_exclusive": "2026-09-04",
        "ledger": {"audit_started": 0, "audit_completed": 0, "audit_results_unlocked": 0, "checkout_creation_failed": 0, "checkout_started": 0, "purchase_completed": 0},
        "previous_ledger": {"audit_started": 0, "audit_completed": 0, "audit_results_unlocked": 0, "checkout_creation_failed": 0, "checkout_started": 0, "purchase_completed": 0},
        "posthog": {"audit_results_unlocked": None, "previous_audit_results_unlocked": None},
    }
    report = {
        "generated_at": "2026-09-04T00:00:00+00:00",
        "periods": {"daily": base, "weekly": base, "monthly": base},
        "attention": {"daily": [], "weekly": [], "monthly": []},
    }

    text = render_markdown(report)
    assert "## Daily" in text
    assert "## Weekly" in text
    assert "## Monthly" in text
    assert "**Attention:** none" in text
