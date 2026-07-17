"""Unit tests for JWT session management."""

import time
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from authlib.jose import JoseError

from platform_api.auth.jwt import (
    JWTError,
    create_jwt,
    create_session,
    decode_jwt,
    get_active_sessions,
    revoke_all_sessions,
    revoke_session,
    verify_session,
)


@pytest.fixture
def secret_key():
    """Generate test secret key."""
    return "test-secret-key-for-unit-tests"


@pytest.fixture
def mock_redis():
    """Mock Redis client."""
    redis = AsyncMock()
    redis.hset = AsyncMock()
    redis.hgetall = AsyncMock(return_value={})
    redis.hdel = AsyncMock()
    redis.set = AsyncMock()
    redis.get = AsyncMock()
    redis.exists = AsyncMock(return_value=False)
    redis.expire = AsyncMock()
    redis.ttl = AsyncMock(return_value=3600)
    return redis


def test_create_jwt_success(secret_key):
    """Create JWT with valid payload."""
    with patch("platform_api.auth.jwt.settings") as mock_settings:
        mock_settings.SECRET_KEY = secret_key
        mock_settings.JWT_ALGORITHM = "HS256"
        mock_settings.JWT_EXPIRATION_DAYS = 7

        payload = {"user_id": "user-123", "org_id": "org-456"}

        token = create_jwt(payload)

        assert isinstance(token, str)
        assert len(token) > 0
        # JWT has 3 parts (header.payload.signature)
        assert len(token.split(".")) == 3


def test_create_jwt_without_secret_key():
    """Create JWT without SECRET_KEY should raise error."""
    with patch("platform_api.auth.jwt.settings") as mock_settings:
        mock_settings.SECRET_KEY = None
        mock_settings.JWT_ALGORITHM = "HS256"
        mock_settings.JWT_EXPIRATION_DAYS = 7

        with pytest.raises(ValueError) as exc_info:
            create_jwt({"user_id": "user-123"})

        assert "SECRET_KEY not configured" in str(exc_info.value)


def test_create_jwt_custom_expiration(secret_key):
    """Create JWT with custom expiration."""
    with patch("platform_api.auth.jwt.settings") as mock_settings:
        mock_settings.SECRET_KEY = secret_key
        mock_settings.JWT_ALGORITHM = "HS256"
        mock_settings.JWT_EXPIRATION_DAYS = 7

        # Create token with 1-day expiration
        token = create_jwt({"user_id": "user-123"}, expires_days=1)

        # Decode and check expiration
        claims = decode_jwt(token)

        exp = claims.get("exp")
        now = datetime.now(timezone.utc).timestamp()

        # Expiration should be within 1 day
        assert exp - now < 86400  # 1 day in seconds


def test_decode_jwt_success(secret_key):
    """Decode valid JWT."""
    with patch("platform_api.auth.jwt.settings") as mock_settings:
        mock_settings.SECRET_KEY = secret_key
        mock_settings.JWT_ALGORITHM = "HS256"
        mock_settings.JWT_EXPIRATION_DAYS = 7

        payload = {"user_id": "user-123", "org_id": "org-456"}
        token = create_jwt(payload)

        claims = decode_jwt(token)

        assert claims["user_id"] == "user-123"
        assert claims["org_id"] == "org-456"
        assert "exp" in claims
        assert "iat" in claims
        assert "jti" in claims


def test_decode_jwt_invalid_token(secret_key):
    """Decode invalid JWT should raise error."""
    with patch("platform_api.auth.jwt.settings") as mock_settings:
        mock_settings.SECRET_KEY = secret_key
        mock_settings.JWT_ALGORITHM = "HS256"

        with pytest.raises(JWTError) as exc_info:
            decode_jwt("invalid-token")

        assert "Invalid token" in str(exc_info.value)


def test_decode_jwt_wrong_secret_key(secret_key):
    """Decode JWT with wrong key should raise error."""
    with patch("platform_api.auth.jwt.settings") as mock_settings:
        mock_settings.SECRET_KEY = secret_key
        mock_settings.JWT_ALGORITHM = "HS256"
        mock_settings.JWT_EXPIRATION_DAYS = 7

        payload = {"user_id": "user-123"}
        token = create_jwt(payload)

        # Try to decode with different key
        mock_settings.SECRET_KEY = "wrong-secret-key"

        with pytest.raises(JWTError):
            decode_jwt(token)


@pytest.mark.asyncio
async def test_create_session_success(mock_redis):
    """Create session in Redis."""
    with patch("platform_api.auth.jwt.settings") as mock_settings:
        mock_settings.JWT_EXPIRATION_DAYS = 7

        token = await create_session(
            mock_redis,
            user_id="user-123",
            org_id="org-456"
        )

        # Should return JWT
        assert isinstance(token, str)

        # Should call Redis hset
        mock_redis.hset.assert_called_once()
        mock_redis.expire.assert_called_once()

        # Check Redis key format
        call_args = mock_redis.hset.call_args
        assert "user:user-123:sessions" in str(call_args)


@pytest.mark.asyncio
async def test_create_session_with_metadata(mock_redis):
    """Create session with IP and user agent."""
    with patch("platform_api.auth.jwt.settings") as mock_settings:
        mock_settings.JWT_EXPIRATION_DAYS = 7

        session_data = {
            "ip": "192.168.1.1",
            "user_agent": "Mozilla/5.0",
        }

        token = await create_session(
            mock_redis,
            user_id="user-123",
            org_id="org-456",
            session_data=session_data
        )

        # Should include metadata in Redis
        call_args = mock_redis.hset.call_args
        session_info = call_args[0][2]  # Third argument is the dict

        assert session_info["ip"] == "192.168.1.1"
        assert session_info["user_agent"] == "Mozilla/5.0"


@pytest.mark.asyncio
async def test_verify_session_success(mock_redis, secret_key):
    """Verify valid session."""
    with patch("platform_api.auth.jwt.settings") as mock_settings:
        mock_settings.SECRET_KEY = secret_key
        mock_settings.JWT_ALGORITHM = "HS256"
        mock_settings.JWT_EXPIRATION_DAYS = 7

        # Create token
        payload = {"user_id": "user-123", "org_id": "org-456"}
        token = create_jwt(payload)

        # Verify session (not blacklisted)
        mock_redis.exists.return_value = False

        claims = await verify_session(mock_redis, token)

        assert claims["user_id"] == "user-123"
        mock_redis.exists.assert_called_once()


@pytest.mark.asyncio
async def test_verify_session_blacklisted(mock_redis, secret_key):
    """Verify blacklisted session should fail."""
    with patch("platform_api.auth.jwt.settings") as mock_settings:
        mock_settings.SECRET_KEY = secret_key
        mock_settings.JWT_ALGORITHM = "HS256"
        mock_settings.JWT_EXPIRATION_DAYS = 7

        # Create token
        payload = {"user_id": "user-123", "org_id": "org-456"}
        token = create_jwt(payload)

        # Token is blacklisted
        mock_redis.exists.return_value = True

        with pytest.raises(JWTError) as exc_info:
            await verify_session(mock_redis, token)

        assert "Session revoked" in str(exc_info.value)


@pytest.mark.asyncio
async def test_revoke_session_success(mock_redis):
    """Revoke session."""
    with patch("platform_api.auth.jwt.settings") as mock_settings:
        mock_settings.JWT_EXPIRATION_DAYS = 7

        await revoke_session(mock_redis, "user-123", "session-456")

        # Should remove from active sessions
        mock_redis.hdel.assert_called_once()

        # Should add to blacklist
        mock_redis.set.assert_called_once()


@pytest.mark.asyncio
async def test_get_active_sessions_empty(mock_redis):
    """Get active sessions when none exist."""
    mock_redis.hgetall.return_value = {}

    sessions = await get_active_sessions(mock_redis, "user-123")

    assert sessions == {}


@pytest.mark.asyncio
async def test_get_active_sessions_multiple(mock_redis):
    """Get active sessions with multiple sessions."""
    mock_redis.hgetall.return_value = {
        "session-1": {"ip": "192.168.1.1"},
        "session-2": {"ip": "192.168.1.2"},
    }

    sessions = await get_active_sessions(mock_redis, "user-123")

    assert len(sessions) == 2
    assert "session-1" in sessions
    assert "session-2" in sessions


@pytest.mark.asyncio
async def test_revoke_all_sessions_success(mock_redis):
    """Revoke all sessions for user."""
    # Mock active sessions
    mock_redis.hgetall.return_value = {
        "session-1": {"ip": "192.168.1.1"},
        "session-2": {"ip": "192.168.1.2"},
    }

    count = await revoke_all_sessions(mock_redis, "user-123")

    assert count == 2

    # Should call revoke_session for each
    assert mock_redis.hdel.call_count == 2
    assert mock_redis.set.call_count == 2


@pytest.mark.asyncio
async def test_revoke_all_sessions_no_sessions(mock_redis):
    """Revoke all sessions when none exist."""
    mock_redis.hgetall.return_value = {}

    count = await revoke_all_sessions(mock_redis, "user-123")

    assert count == 0
