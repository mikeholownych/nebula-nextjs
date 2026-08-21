"""Test configuration and fixtures."""

import asyncio

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from platform_api.main import app
from platform_api.services import audit_runner


@pytest.fixture(autouse=True)
def hermetic_queue_admission(monkeypatch):
    """DATA-6: default tests to an open queue so they never touch a real
    database via check_admission. Dedicated admission tests override this."""
    from unittest.mock import AsyncMock
    monkeypatch.setattr(
        "platform_api.routes.audit_api.audit_db.check_admission",
        AsyncMock(return_value=(True, "test-open")),
    )


@pytest.fixture(autouse=True)
def reset_audit_runner_loop_primitives():
    """Module-level asyncio primitives bind to the first loop that uses them."""
    audit_runner._semaphore = asyncio.Semaphore(audit_runner.MAX_IN_FLIGHT)
    audit_runner._wakeup = asyncio.Event()
    audit_runner._started = True
    yield
    audit_runner._started = False
    audit_runner._semaphore = asyncio.Semaphore(audit_runner.MAX_IN_FLIGHT)
    audit_runner._wakeup = asyncio.Event()


@pytest_asyncio.fixture(loop_scope="session")
async def client():
    """Async test client."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        yield client