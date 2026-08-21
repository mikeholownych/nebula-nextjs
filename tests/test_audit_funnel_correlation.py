"""The audit funnel measured 0% conversion past `audit_completed`.

This service emitted its own bare `audit_started` for every audit, while the
portal's /api/audit/start route emitted a richer one for the same audit under
the same distinct_id. Two `audit_started` events per audit inflated the funnel's
first step and depressed every conversion rate measured against it.

`audit_started` is now owned solely by the portal route, which holds the
referrer and attribution context this service never sees. What this service
still owns - `audit_completed` and `audit_failed` - carries `audit_attempt_id`,
the correlation key minted in the browser at form submit, so the whole chain can
be joined on the audit rather than on a person identity that is still anonymous
when the flow starts.
"""

from types import SimpleNamespace
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest
from fastapi import HTTPException

from platform_api.routes import audit_api


class FakePostHog:
    # Read by posthog.new_context() when it opens a capture context.
    enable_exception_autocapture = False

    def __init__(self):
        self.captured = []

    def capture(self, event, properties=None, **kwargs):
        self.captured.append((event, properties or {}))

    def events(self):
        return [event for event, _ in self.captured]

    def properties_for(self, event):
        return next(props for name, props in self.captured if name == event)


@pytest.fixture
def posthog(monkeypatch):
    client = FakePostHog()
    monkeypatch.setattr(audit_api.audit_db, "create_audit", AsyncMock(return_value=uuid4()))
    monkeypatch.setattr(audit_api.audit_db, "update_audit", AsyncMock(return_value=True))
    monkeypatch.setattr(audit_api.audit_db, "mark_audit_failed", AsyncMock(return_value=True))
    monkeypatch.setattr(audit_api.analytics, "track_audit_started", AsyncMock())
    monkeypatch.setattr(audit_api.analytics, "track_audit_completed", AsyncMock())
    monkeypatch.setattr(audit_api.analytics, "track_audit_failed", AsyncMock())
    monkeypatch.setattr(audit_api, "get_posthog", lambda: client)
    return client


def _script(returncode=0, stdout='{"score": 5, "grade": "C", "findings": []}\n'):
    def fake_run(argv, **kwargs):
        return SimpleNamespace(returncode=returncode, stdout=stdout, stderr="")

    return fake_run


def _request(**overrides):
    payload = {
        "url": "https://example.com",
        "analytics_consent": True,
        "analytics_distinct_id": "019fdbe6-d3d1-7a59-99c4-8a8488a948f7",
        "analytics_attempt_id": "attempt-abc-123",
    }
    payload.update(overrides)
    return audit_api.AuditRequest(**payload)


@pytest.mark.asyncio
async def test_run_audit_does_not_emit_a_duplicate_audit_started(monkeypatch, posthog):
    monkeypatch.setattr(audit_api.subprocess, "run", _script())

    result = await audit_api.run_audit(_request())

    assert result.status == "completed"
    assert "audit_started" not in posthog.events()
    assert posthog.events() == ["audit_completed"]


@pytest.mark.asyncio
async def test_audit_completed_carries_the_correlation_key(monkeypatch, posthog):
    monkeypatch.setattr(audit_api.subprocess, "run", _script())

    await audit_api.run_audit(_request())

    properties = posthog.properties_for("audit_completed")
    assert properties["audit_attempt_id"] == "attempt-abc-123"
    assert properties["audit_id"]


@pytest.mark.asyncio
async def test_audit_failed_carries_the_correlation_key(monkeypatch, posthog):
    monkeypatch.setattr(audit_api.subprocess, "run", _script(returncode=1))

    with pytest.raises(HTTPException) as excinfo:
        await audit_api.run_audit(_request())

    assert excinfo.value.status_code == 500
    properties = posthog.properties_for("audit_failed")
    assert properties["audit_attempt_id"] == "attempt-abc-123"
    assert properties["reason"] == "script_error"


@pytest.mark.asyncio
async def test_no_audit_events_without_analytics_consent(monkeypatch, posthog):
    monkeypatch.setattr(audit_api.subprocess, "run", _script())

    await audit_api.run_audit(_request(analytics_consent=False))

    assert posthog.captured == []
