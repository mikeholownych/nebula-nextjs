from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_provider_event_endpoint_requires_signature():
    source = (ROOT / "platform_api/routes/newsletter_events.py").read_text()
    assert "invalid webhook signature" in source
    assert "ON CONFLICT (provider_event_id) DO NOTHING" in source
    assert "HARD_BOUNCE" in source
    assert "COMPLAINT" in source
    assert '"message.sent": "SENT"' in source
    assert '"message.rejected": "REJECTED"' in source
    assert "provider_rejected" in source


def test_historical_weekly_job_has_no_provider_or_sqlite_path():
    source = (ROOT / "yt_channel/weekly_newsletter_job.py").read_text()
    assert "AgentMailClient" not in source
    assert "sqlite3" not in source
    assert "newsletter_autopilot" in source


def test_release_service_contains_execution_time_recheck_and_submission_ledger():
    source = (ROOT / "newsletter_release_service.py").read_text()
    assert "SELECT * FROM newsletter_subscribers ORDER BY" in source
    assert "SELECT * FROM newsletter_subscribers WHERE id=$1 FOR UPDATE" in source
    assert "newsletter_recipient_decision" in source
    assert "newsletter_submission" in source
    assert "provider_message_id" in source
