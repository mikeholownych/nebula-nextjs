"""Simple JWT tests without mocking."""

import pytest
from platform_api.auth.jwt import create_jwt, decode_jwt, create_session, verify_session
from platform_api.redis_client import get_redis
from unittest.mock import AsyncMock


@pytest.mark.asyncio
async def test_create_jwt_real_settings():
    """Test JWT creation with real settings."""
    payload = {"user_id": "test-user", "org_id": "test-org"}
    token = create_jwt(payload)
    
    assert isinstance(token, str)
    assert len(token) > 0
    assert len(token.split(".")) == 3


def test_decode_jwt_real_settings():
    """Test JWT decoding with real settings."""
    payload = {"user_id": "test-user", "org_id": "test-org"}
    token = create_jwt(payload)
    
    claims = decode_jwt(token)
    
    assert claims["user_id"] == "test-user"
    assert claims["org_id"] == "test-org"
    assert "exp" in claims
    assert "iat" in claims


@pytest.mark.asyncio
async def test_create_session_with_real_redis():
    """Test session creation with real Redis."""
    redis = await get_redis()
    await redis.connect()
    
    try:
        token = await create_session(
            redis,
            user_id="test-user-123",
            org_id="test-org-456",
            session_data={"ip": "127.0.0.1"}
        )
        
        assert isinstance(token, str)
        assert len(token) > 0
    finally:
        await redis.disconnect()
