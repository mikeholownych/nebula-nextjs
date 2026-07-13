from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DASHBOARD = (ROOT / "dashboard.html").read_text(encoding="utf-8")


def test_dashboard_fetches_live_platform_metrics():
    assert "fetch('/api/stats'" in DASHBOARD
    assert "hard-coded sample data" not in DASHBOARD
    assert "setTimeout(" not in DASHBOARD
    assert 'id="data-status"' in DASHBOARD
    assert "ageHours > 24" in DASHBOARD
    assert "Stale data" in DASHBOARD


def test_dashboard_maps_available_metrics_without_inventing_ga4_data():
    for field in (
        "audits_delivered",
        "real_payments",
        "real_revenue",
        "emails_sent",
        "replies",
        "open_convos",
        "warm_leads",
        "trigger_reply_rate",
    ):
        assert f"data.{field}" in DASHBOARD
    assert "GA4 not connected" in DASHBOARD
