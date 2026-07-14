"""Test configuration and fixtures."""

import pytest
import pytest_asyncio
from httpx import AsyncClient

from platform_api.main import app


@pytest_asyncio.fixture
async def client():
    """Async test client."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client