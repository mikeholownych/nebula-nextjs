"""Unit tests for the outbox email channel's AgentMail transactional lane."""

import agentmail_client
from platform_api.infra.outbox import Outbox


class FakeAgentMailClient:
    calls = []
    response = {"message_id": "am-msg-1"}

    def __init__(self, *args, **kwargs):
        pass

    def send_transactional(self, to, subject, **kwargs):
        FakeAgentMailClient.calls.append({"to": to, "subject": subject, **kwargs})
        return FakeAgentMailClient.response


def _install(monkeypatch):
    FakeAgentMailClient.calls = []
    FakeAgentMailClient.response = {"message_id": "am-msg-1"}
    monkeypatch.setattr(agentmail_client, "AgentMailClient", FakeAgentMailClient)
    return FakeAgentMailClient


async def test_success_returns_true_and_maps_payload(monkeypatch):
    fake = _install(monkeypatch)

    ok = await Outbox()._send_email(
        "mike.holownych@gmail.com",
        {"subject": "[ops] hello", "body": "<p>hi</p>", "content_type": "text/html"},
    )

    assert ok is True
    call = fake.calls[0]
    assert call["to"] == ["mike.holownych@gmail.com"]
    assert call["subject"] == "[ops] hello"
    assert call["text"] == "<p>hi</p>"
    assert call["html"] == "<p>hi</p>"
    assert call["client_id"].startswith("txn:outbox:")
    assert "mike.holownych@gmail.com" in call["client_id"]


async def test_plain_text_content_type_passes_no_html(monkeypatch):
    fake = _install(monkeypatch)

    ok = await Outbox()._send_email(
        "lead@example.com",
        {"subject": "s", "body": "plain body", "content_type": "text/plain"},
    )

    assert ok is True
    call = fake.calls[0]
    assert call["text"] == "plain body"
    assert call["html"] is None


async def test_missing_content_type_passes_no_html(monkeypatch):
    fake = _install(monkeypatch)

    ok = await Outbox()._send_email("lead@example.com", {"subject": "s", "body": "b"})

    assert ok is True
    assert fake.calls[0]["html"] is None


async def test_error_result_returns_false(monkeypatch):
    _install(monkeypatch)
    FakeAgentMailClient.response = {"_error": "release_blocked"}

    ok = await Outbox()._send_email("lead@example.com", {"subject": "s"})

    assert ok is False


async def test_client_constructor_exception_returns_false(monkeypatch):
    class ExplodingInit:
        def __init__(self, *args, **kwargs):
            raise FileNotFoundError("AgentMail key not found")

    monkeypatch.setattr(agentmail_client, "AgentMailClient", ExplodingInit)

    ok = await Outbox()._send_email("lead@example.com", {"subject": "s"})

    assert ok is False


async def test_send_exception_returns_false(monkeypatch):
    class ExplodingSend:
        def __init__(self, *args, **kwargs):
            pass

        def send_transactional(self, *args, **kwargs):
            raise ValueError("boom")

    monkeypatch.setattr(agentmail_client, "AgentMailClient", ExplodingSend)

    ok = await Outbox()._send_email("lead@example.com", {"subject": "s"})

    assert ok is False
