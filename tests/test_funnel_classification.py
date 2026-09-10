"""Exercise the real metric SQL against a disposable PostgreSQL cluster only."""
from datetime import date
from pathlib import Path
import subprocess

import psycopg
import pytest

from scripts import funnel_health_monitor as monitor


@pytest.fixture(scope="module")
def isolated_postgres(tmp_path_factory):
    # Require explicit in-worktree pytest --basetemp. Never use production PG.
    base = tmp_path_factory.mktemp("funnel-pg")
    root = Path(__file__).resolve().parents[1]
    assert base.is_relative_to(root), "Pass --basetemp=.test-tmp to keep writes isolated"
    binary = Path("/usr/lib/postgresql/16/bin")
    subprocess.run([str(binary / "initdb"), "-D", str(base / "data"), "-A", "trust", "--no-locale", "--encoding=UTF8"], check=True, capture_output=True)
    subprocess.run([str(binary / "pg_ctl"), "-D", str(base / "data"), "-l", str(base / "server.log"), "-o", f"-k {base} -p 55439 -h ''", "-w", "start"], check=True, capture_output=True)
    try:
        with psycopg.connect(host=str(base), port=55439, dbname="postgres") as conn:
            conn.execute("""CREATE TABLE analytics_event_ledger (
                event_name text, occurred_at timestamptz, audit_id text,
                is_synthetic boolean, environment text, payment_mode text,
                checkout_session_id text, transaction_id text, properties jsonb);
                CREATE TABLE purchases (stripe_session_id text, livemode boolean);
            """)
            yield conn
    finally:
        subprocess.run([str(binary / "pg_ctl"), "-D", str(base / "data"), "-m", "immediate", "-w", "stop"], check=True, capture_output=True)


@pytest.fixture
def populated_ledger(isolated_postgres):
    conn = isolated_postgres
    conn.execute("TRUNCATE analytics_event_ledger, purchases")
    rows = [
        ("checkout_creation_failed", None, False, "production", "live", None, None, '{}'),
        ("checkout_creation_failed", "real-audit", False, "production", "live", None, None, '{"reason_code":"checkout_provider_error"}'),
        ("checkout_creation_failed", monitor.PROBE_AUDIT_IDS[0], False, "production", "live", None, None, '{}'),
        ("checkout_creation_failed", None, True, "production", "live", None, None, '{}'),
        ("checkout_creation_failed", None, False, "staging", "live", None, None, '{}'),
        ("purchase_completed", None, False, "production", "live", "cs_test_disguised", None, '{}'),
        ("purchase_completed", None, False, "production", "live", None, "cs_test_transaction", '{}'),
        ("purchase_completed", None, False, "production", "live", None, None, '{"livemode":false}'),
        ("purchase_completed", None, False, "production", "live", "cs_live_but_test_row", None, '{}'),
        ("purchase_completed", None, False, "production", "test", None, None, '{}'),
        ("purchase_completed", None, False, "production", "live", None, None, '{"checkout_session_id":"cs_test_property"}'),
        ("purchase_completed", None, False, "production", "live", "cs_live_real", None, '{}'),
        ("purchase_completed", None, False, "production", None, None, None, '{}'),
    ]
    with conn.cursor() as cur:
        cur.executemany("INSERT INTO analytics_event_ledger VALUES (%s,'2026-09-09 12:00Z',%s,%s,%s,%s,%s,%s,%s)", rows)
    conn.execute("INSERT INTO purchases VALUES ('cs_live_but_test_row',false),('cs_live_real',true)")
    conn.commit()
    return conn


PERIOD = monitor.Period("daily", date(2026, 9, 9), date(2026, 9, 10), date(2026, 9, 8), date(2026, 9, 9))


def test_customer_metrics_exclude_exact_probe_and_test_payment_evidence(populated_ledger):
    counts = monitor.ledger_counts(populated_ledger, PERIOD)
    assert counts["checkout_creation_failed"] == 2
    assert counts["purchase_completed"] == 1
    # Evidence is not removed or rewritten by classification.
    assert populated_ledger.execute("SELECT count(*) FROM analytics_event_ledger").fetchone()[0] == 13


def test_report_preserves_classified_evidence_and_compares_customer_windows(populated_ledger, monkeypatch):
    monkeypatch.setattr(monitor, "posthog_event_count", lambda *args: None)
    snapshot = monitor.period_snapshot(populated_ledger, PERIOD)
    assert snapshot["raw_ledger"]["checkout_creation_failed"] == 5
    assert snapshot["raw_ledger"]["purchase_completed"] == 8
    assert snapshot["ledger"] == snapshot["commercial_ledger"]
    assert snapshot["excluded_ledger_by_class"]["known_monitor_probe"]["checkout_creation_failed"] == 1
    for event in monitor.EVENTS:
        assert snapshot["raw_ledger"][event] == snapshot["ledger"][event] + sum(counts[event] for counts in snapshot["excluded_ledger_by_class"].values())
    assert "CHECKOUT_FAILURES_WITH_ZERO_SUCCESSFUL_CHECKOUTS" in monitor.flags(snapshot)
    report = {"generated_at": "isolated", "periods": {"daily": snapshot}, "attention": {"daily": monitor.flags(snapshot)}}
    text = monitor.render_markdown(report)
    assert "Customer-eligible" in text
    assert "known_monitor_probe" in text
    assert "Raw ledger" in text
