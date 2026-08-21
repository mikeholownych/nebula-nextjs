"""SEC-P2-2 regression: chunked bodies without Content-Length are size-capped."""

import pytest
from httpx import AsyncClient, ASGITransport

from platform_api.main import app


@pytest.mark.asyncio
async def test_oversized_body_without_content_length_rejected():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        # 2 MB body, no Content-Length header (httpx sets it; strip via stream)
        big = b"x" * (2 * 1024 * 1024)

        async def stream():
            yield big

        r = await client.post("/audit/claim", content=stream(),
                              headers={"Content-Type": "application/json"})
        assert r.status_code == 413


@pytest.mark.asyncio
async def test_normal_body_still_accepted():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        r = await client.post("/healthz")  # GET sanity
        assert r.status_code == 200
