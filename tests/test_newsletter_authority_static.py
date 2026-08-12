from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_roundup_is_only_a_wrapper():
    source = (ROOT / "scripts/send_weekly_roundup.py").read_text()
    assert "newsletter_autopilot" in source
    assert "AgentMailClient" not in source
    assert ".send(" not in source
    assert "messages/send" not in source


def test_autopilot_delegates_provider_submission_to_release_service():
    source = (ROOT / "newsletter_autopilot.py").read_text()
    assert "from newsletter_release_service import create_release_payload, create_release, send_release" in source
    assert "client.send(" not in source
    assert "messages/send" not in source


def test_release_service_is_the_only_newsletter_provider_caller():
    source = (ROOT / "newsletter_release_service.py").read_text()
    assert "client.send" in source
    assert "newsletter_submission" in source
