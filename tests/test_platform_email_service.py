import pytest

from platform_api.services.email_service import AuditEmailData, EmailService


class RecordingStore:
    calls = []

    def upsert_lead(self, **kwargs):
        self.calls.append(kwargs)
        return True


class BlockedClient:
    def __init__(self, **_kwargs):
        pass

    def send_audit(self, **_kwargs):
        return {"_error": "release_blocked", "_reason": "outreach_disabled"}


class SuccessfulClient:
    def __init__(self, **_kwargs):
        pass

    def send_audit(self, **_kwargs):
        return {"message_id": "msg-1"}


def _data():
    return AuditEmailData(
        url="https://example.com",
        score=7.5,
        grade="B",
        findings=[{"label": "CTA", "issue": "Weak CTA", "quadrant": "clarity"}],
        email="lead@example.com",
    )


@pytest.mark.asyncio
async def test_blocked_audit_does_not_advance_delivery_stage(monkeypatch):
    import agentmail_client
    import lead_store

    RecordingStore.calls = []
    monkeypatch.setattr(agentmail_client, "AgentMailClient", BlockedClient)
    monkeypatch.setattr(lead_store, "LeadStore", RecordingStore)

    result = await EmailService().send_audit_results(_data())

    assert result["status"] == "failed"
    assert [call["stage"] for call in RecordingStore.calls] == ["discovered"]


@pytest.mark.asyncio
async def test_successful_audit_advances_delivery_stage(monkeypatch):
    import agentmail_client
    import lead_store

    RecordingStore.calls = []
    monkeypatch.setattr(agentmail_client, "AgentMailClient", SuccessfulClient)
    monkeypatch.setattr(lead_store, "LeadStore", RecordingStore)

    result = await EmailService().send_audit_results(_data())

    assert result["status"] == "sent"
    assert [call["stage"] for call in RecordingStore.calls] == [
        "discovered",
        "audit_delivered",
    ]
