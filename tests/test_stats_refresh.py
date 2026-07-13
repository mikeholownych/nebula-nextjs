import json
from pathlib import Path

import webhook_server

SOURCE = (Path(__file__).resolve().parents[1] / "webhook_server.py").read_text(encoding="utf-8")


def test_stats_endpoint_refreshes_before_responding():
    assert "stats = refresh_stats_snapshot()" in SOURCE


def write_jsonl(path: Path, rows):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("".join(json.dumps(row) + "\n" for row in rows))


def test_refresh_stats_rebuilds_snapshot_from_live_ledgers(tmp_path, monkeypatch):
    stats = tmp_path / "stats.json"
    outreach = tmp_path / "outreach.jsonl"
    customers = tmp_path / "customers.jsonl"
    audits = tmp_path / "audits.jsonl"
    stats.write_text(json.dumps({"updated": "2026-07-05T00:00:00Z", "emails_sent": 999}))
    write_jsonl(outreach, [
        {"status": "sent", "action": "ramp_audit_sent"},
        {"status": "sent", "action": "surge_audit_sent"},
        {"status": "captured", "action": "inbound_audit_capture"},
    ])
    write_jsonl(customers, [
        {"event": "inbound_reply", "classification": "warm", "email": "buyer@company.com"},
        {"event_type": "audit_delivered", "email": "buyer@company.com"},
        {"event_type": "payment", "email": "buyer@company.com", "amount_cents": 14700, "payment_id": "pi_live"},
        {"event_type": "payment", "email": "test@example.com", "amount_cents": 14700, "payment_id": "cs_test_1"},
    ])
    write_jsonl(audits, [{"email": "buyer@company.com"}])

    monkeypatch.setattr(webhook_server, "STATS_FILE", str(stats))
    monkeypatch.setattr(webhook_server, "OUTREACH_EVIDENCE_FILE", str(outreach), raising=False)
    monkeypatch.setattr(webhook_server, "INBOX_LOG", str(customers))
    monkeypatch.setattr(webhook_server, "AUDIT_LEADS_FILE", str(audits), raising=False)

    result = webhook_server.refresh_stats_snapshot()

    assert result["emails_sent"] == 2
    assert result["replies"] == 1
    assert result["warm_leads"] == 1
    assert result["audits_delivered"] == 1
    assert result["real_revenue"] == 147
    assert result["real_payments"] == 1
    assert result["test_payments_excluded"] == 1
    assert result["trigger_based_sends"] == 2
    assert result["trigger_reply_rate"] == 50.0
    assert result["updated"] != "2026-07-05T00:00:00Z"
    assert result["data_updated"]
    assert json.loads(stats.read_text()) == result
