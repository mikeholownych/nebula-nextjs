"""Test configuration and fixtures."""

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from platform_api.main import app


@pytest_asyncio.fixture(loop_scope="session")
async def client():
    """Async test client."""
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as client:
        yield client