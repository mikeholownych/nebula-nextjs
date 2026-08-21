"""Test configuration and fixtures."""

import asyncio

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from platform_api.main import app
from platform_api.services import audit_runner


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