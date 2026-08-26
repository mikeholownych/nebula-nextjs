"""Support replies must remain drafts until explicitly approved."""

import json

import scripts.support_inbox_monitor as support
import scripts.send_queued_replies as sender


class FakeAgentMail:
    def __init__(self, intent_text: str):
        self.intent_text = intent_text
        self.replies = []
        self.labels = []

    def list_threads(self, limit=100):
        return [{
            "thread_id": "thread-1",
            "last_message_id": "message-1",
            "labels": ["received"],
            "senders": ["Customer <buyer@example.com>"],
            "subject": "Question",
            "preview": self.intent_text,
        }]

    def reply(self, message_id, recipient, text):
        self.replies.append((message_id, recipient, text))
        return {"id": "sent"}

    def label_thread(self, thread_id, add):
        self.labels.append((thread_id, tuple(add)))


def test_billing_contact_is_queued_for_approval_without_sending(tmp_path, monkeypatch):
    queue = tmp_path / "queued_replies.json"
    monkeypatch.setattr(support, "APPROVAL_QUEUE", queue)
    monkeypatch.setattr(support, "telegram", lambda _message: None)
    monkeypatch.setattr(
        support,
        "get_customer_purchase",
        lambda _email: {
            "offer_key": "one_leak_repair",
            "amount": 9700,
            "status": "delivered",
            "audit_url": "https://example.com",
            "session_id": "cs_test",
            "created_at": "2026-08-01",
        },
    )
    am = FakeAgentMail("I was charged twice and need a refund")

    support.process(am, dry_run=False)

    assert am.replies == []
    items = json.loads(queue.read_text())
    assert len(items) == 1
    assert items[0]["status"] == "pending_approval"
    assert items[0]["intent"] == "billing"
    assert items[0]["approval_required"] is True
    assert items[0]["in_reply_to"] == "message-1"


def test_implementation_question_is_queued_for_approval_without_sending(tmp_path, monkeypatch):
    queue = tmp_path / "queued_replies.json"
    monkeypatch.setattr(support, "APPROVAL_QUEUE", queue)
    monkeypatch.setattr(support, "telegram", lambda _message: None)
    monkeypatch.setattr(support, "get_customer_purchase", lambda _email: None)
    am = FakeAgentMail("How do I implement step three?")

    support.process(am, dry_run=False)

    assert am.replies == []
    item = json.loads(queue.read_text())[0]
    assert item["status"] == "pending_approval"
    assert item["intent"] == "implementation"


def test_sender_requires_explicit_approval_metadata():
    assert sender.is_approved({"status": "pending_approval"}) is False
    assert sender.is_approved({"status": "approved"}) is False
    assert sender.is_approved({
        "status": "approved",
        "approved_by": "mike",
        "approved_at": "2026-08-26T10:00:00+00:00",
    }) is True


def test_rejected_draft_is_terminal_and_not_retained():
    assert sender.queue_disposition({"status": "rejected"}) == "drop"
    assert sender.queue_disposition({"status": "pending_approval"}) == "retain"
    assert sender.queue_disposition({
        "status": "approved",
        "approved_by": "mike",
        "approved_at": "2026-08-26T10:00:00+00:00",
    }) == "send"
