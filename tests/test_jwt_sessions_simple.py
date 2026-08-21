"""Focused JWT tests with deterministic settings and isolated Redis."""

from unittest.mock import AsyncMock, patch

import pytest

from platform_api.auth.jwt import create_jwt, create_session, decode_jwt


@pytest.fixture
def jwt_settings():
    with patch("platform_api.auth.jwt.settings") as configured:
        configured.SECRET_KEY = "simple-test-secret-key"
        configured.JWT_ALGORITHM = "HS256"
        configured.JWT_EXPIRATION_DAYS = 7
        yield configured


@pytest.mark.asyncio
async def test_create_jwt_with_controlled_settings(jwt_settings):
    payload = {"user_id": "test-user", "org_id": "test-org"}
    token = create_jwt(payload)

    assert isinstance(token, str)
    assert len(token) > 0
    assert len(token.split(".")) == 3


def test_decode_jwt_with_controlled_settings(jwt_settings):
    payload = {"user_id": "test-user", "org_id": "test-org"}
    token = create_jwt(payload)
    claims = decode_jwt(token)

    assert claims["user_id"] == "test-user"
    assert claims["org_id"] == "test-org"
    assert "exp" in claims
    assert "iat" in claims


@pytest.mark.asyncio
async def test_create_session_with_mock_redis(jwt_settings):
    redis = AsyncMock()
    token = await create_session(
        redis,
        user_id="test-user-123",
        org_id="test-org-456",
        session_data={"ip": "127.0.0.1"},
    )

    assert isinstance(token, str)
    assert len(token) > 0
    # SEC-P1-2: per-session key written via set() with a TTL
    redis.set.assert_awaited_once()
    args, kwargs = redis.set.await_args
    assert args[0].startswith("user:test-user-123:session:")
    assert kwargs.get("ttl", 0) > 0
