"""Approval CLI changes only one exact queued support draft."""

import json

import pytest

import scripts.reply_approval as approval


def test_approve_persists_actor_and_timestamp(tmp_path):
    queue = tmp_path / "queue.json"
    queue.write_text(json.dumps([{
        "id": "support:t1:m1",
        "status": "pending_approval",
        "approval_required": True,
    }]))

    result = approval.update_status(
        queue, "support:t1:m1", "approve", "mike", "2026-08-26T10:00:00+00:00"
    )

    item = json.loads(queue.read_text())[0]
    assert result == "approved"
    assert item["status"] == "approved"
    assert item["approved_by"] == "mike"
    assert item["approved_at"] == "2026-08-26T10:00:00+00:00"


def test_reject_never_becomes_sendable(tmp_path):
    queue = tmp_path / "queue.json"
    queue.write_text(json.dumps([{
        "id": "support:t1:m1",
        "status": "pending_approval",
        "approval_required": True,
    }]))

    result = approval.update_status(
        queue, "support:t1:m1", "reject", "mike", "2026-08-26T10:00:00+00:00"
    )

    item = json.loads(queue.read_text())[0]
    assert result == "rejected"
    assert item["status"] == "rejected"
    assert "approved_at" not in item


def test_missing_draft_fails_closed(tmp_path):
    queue = tmp_path / "queue.json"
    queue.write_text("[]")

    with pytest.raises(KeyError):
        approval.update_status(
            queue, "missing", "approve", "mike", "2026-08-26T10:00:00+00:00"
        )
