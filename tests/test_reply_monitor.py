from pathlib import Path

import reply_monitor
from outbound_release_gate import OutboundReleaseGate


def _gate(tmp_path: Path) -> OutboundReleaseGate:
    replied = tmp_path / "replied.jsonl"
    replied.touch()
    return OutboundReleaseGate(
        state_db=tmp_path / "outbound.db",
        lead_db=tmp_path / "unused-leads.db",
        replied_path=replied,
        disable_marker=tmp_path / "OUTREACH_DISABLED",
    )


def test_save_reply_claims_new_thread_once(tmp_path):
    gate = _gate(tmp_path)
    assert reply_monitor.save_reply(gate, "lead@example.com", "warm", "thread-1", "hello")
    assert not reply_monitor.save_reply(gate, "lead@example.com", "warm", "thread-1", "hello")


def test_process_reply_action_routes_warm_and_propagates_failure(monkeypatch):
    calls = []

    def fake_warm(email, body, thread_id, dry_run):
        calls.append((email, body, thread_id, dry_run))
        return False

    monkeypatch.setattr(reply_monitor, "handle_warm_reply", fake_warm)
    result = reply_monitor.process_reply_action({
        "email": "lead@example.com",
        "classification": "warm",
        "thread_id": "thread-warm",
        "message_excerpt": "interested",
    })
    assert result is False
    assert calls == [("lead@example.com", "interested", "thread-warm", False)]


def test_process_reply_action_routes_all_stop_variants(monkeypatch):
    calls = []
    monkeypatch.setattr(
        reply_monitor,
        "mark_bounced",
        lambda email, reason: calls.append((email, reason)) or True,
    )
    for classification in ("unsubscribe", "unsubscribed", "do_not_contact", "stop_reply"):
        assert reply_monitor.process_reply_action({
            "email": "lead@example.com",
            "classification": classification,
            "thread_id": f"thread-{classification}",
            "message_excerpt": "please stop",
        })
    assert len(calls) == 4
