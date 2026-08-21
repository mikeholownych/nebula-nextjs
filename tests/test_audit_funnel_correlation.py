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

from unittest.mock import AsyncMock
from uuid import uuid4

import pytest

from platform_api.routes import audit_api
from platform_api.services import audit_runner


class FakePostHog:
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
    monkeypatch.setattr(audit_api.analytics, "track_audit_started", AsyncMock())
    monkeypatch.setattr(audit_api.analytics, "track_audit_completed", AsyncMock())
    monkeypatch.setattr(audit_api.analytics, "track_audit_failed", AsyncMock())
    monkeypatch.setattr(audit_api, "get_posthog", lambda: client)
    monkeypatch.setattr(audit_api, "_crm_audit_completed", AsyncMock())
    return client


def _job(**overrides):
    payload = {
        "id": uuid4(),
        "url": "https://example.com",
        "email": "lead@example.com",
        "analytics_consent": True,
        "analytics_distinct_id": "019fdbe6-d3d1-7a59-99c4-8a8488a948f7",
        "analytics_attempt_id": "attempt-abc-123",
        "analytics_journey_id": "journey-xyz",
    }
    payload.update(overrides)
    return payload


@pytest.mark.asyncio
async def test_finalize_audit_does_not_emit_a_duplicate_audit_started(monkeypatch, posthog):
    data = {"score": 5, "grade": "C", "findings": []}
    await audit_api.finalize_completed_audit(_job(), data)

    assert "audit_started" not in posthog.events()
    assert posthog.events() == ["audit_completed"]


@pytest.mark.asyncio
async def test_audit_completed_carries_the_correlation_key(monkeypatch, posthog):
    job = _job()
    data = {"score": 5, "grade": "C", "findings": []}
    await audit_api.finalize_completed_audit(job, data)

    properties = posthog.properties_for("audit_completed")
    assert properties["audit_attempt_id"] == "attempt-abc-123"
    assert properties["audit_id"] == str(job["id"])


@pytest.mark.asyncio
async def test_audit_failed_carries_the_correlation_key(monkeypatch):
    track_failed = AsyncMock()
    monkeypatch.setattr(audit_api.analytics, "track_audit_failed", track_failed)
    job = _job()

    await audit_runner._track_failed(job, "script_error")

    track_failed.assert_awaited_once()
    kwargs = track_failed.await_args.kwargs
    assert kwargs["reason"] == "script_error"
    assert kwargs["audit_id"] == str(job["id"])
    assert kwargs["audit_attempt_id"] == "attempt-abc-123"


@pytest.mark.asyncio
async def test_no_audit_events_without_analytics_consent(monkeypatch, posthog):
    data = {"score": 5, "grade": "C", "findings": []}
    await audit_api.finalize_completed_audit(_job(analytics_consent=False), data)

    assert posthog.captured == []

