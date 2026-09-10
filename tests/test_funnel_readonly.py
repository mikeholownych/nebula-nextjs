from unittest.mock import MagicMock
from scripts import funnel_health_monitor as monitor


def test_default_report_connection_is_read_only_and_utc(monkeypatch):
    connect = MagicMock()
    monkeypatch.setattr(monitor.psycopg, "connect", connect)
    monkeypatch.setattr(monitor, "period_snapshot", lambda *args: {})
    monkeypatch.setattr(monitor, "flags", lambda *args: [])
    monitor.build_report()
    options = connect.call_args.kwargs.get("options", "")
    assert "default_transaction_read_only=on" in options
    assert "timezone=UTC" in options
    assert "statement_timeout=30000" in options
