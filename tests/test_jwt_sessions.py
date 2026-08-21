"""Unit tests for JWT session management."""

import time
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, MagicMock, patch

import pytest


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


class _FakeRedis:
    """SEC-P1-2 model: per-session keys with TTLs, scan-based listing."""

    def __init__(self):
        self.store = {}
        self.ttls = {}

    async def set(self, key, value, ttl=None):
        self.store[key] = value
        if ttl:
            self.ttls[key] = ttl

    async def get(self, key):
        return self.store.get(key)

    async def exists(self, key):
        return 1 if key in self.store else 0

    async def delete(self, *keys):
        n = 0
        for k in keys:
            if k in self.store:
                del self.store[k]
                self.ttls.pop(k, None)
                n += 1
        return n

    async def scan(self, cursor=0, match="*", count=100):
        import fnmatch
        return 0, [k for k in self.store if fnmatch.fnmatch(k, match)]


@pytest.fixture
def mock_redis():
    """Mock Redis client."""
    redis = _FakeRedis()
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
        mock_settings.SECRET_KEY = "test-secret-key-for-session-tests"
        mock_settings.JWT_ALGORITHM = "HS256"
        mock_settings.JWT_EXPIRATION_DAYS = 7

        token = await create_session(
            mock_redis,
            user_id="user-123",
            org_id="org-456"
        )

        # Should return JWT
        assert isinstance(token, str)

        # SEC-P1-2 model: one key per session with its own TTL
        assert len(mock_redis.store) == 1
        key = next(iter(mock_redis.store))
        assert key.startswith("user:user-123:session:")
        assert mock_redis.ttls[key] == 7 * 24 * 3600


@pytest.mark.asyncio
async def test_create_session_with_metadata(mock_redis):
    """Create session with IP and user agent."""
    with patch("platform_api.auth.jwt.settings") as mock_settings:
        mock_settings.SECRET_KEY = "test-secret-key-for-session-tests"
        mock_settings.JWT_ALGORITHM = "HS256"
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

        # Should include metadata in Redis (JSON-encoded per-session record)
        import json as _json
        key = next(iter(mock_redis.store))
        session_info = _json.loads(mock_redis.store[key])
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
        import json as _json
        claims0 = decode_jwt(token)
        await mock_redis.set(
            f"user:user-123:session:{claims0['jti']}",
            _json.dumps({"session_id": claims0["jti"]}),
        )

        claims = await verify_session(mock_redis, token)

        assert claims["user_id"] == "user-123"


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

        # Token is blacklisted (blacklist checked before membership)
        async def _always_yes(key):
            return 1
        mock_redis.exists = _always_yes

        with pytest.raises(JWTError) as exc_info:
            await verify_session(mock_redis, token)

        assert "Session revoked" in str(exc_info.value)


@pytest.mark.asyncio
async def test_revoke_session_success(mock_redis):
    """Revoke session."""
    with patch("platform_api.auth.jwt.settings") as mock_settings:
        mock_settings.JWT_EXPIRATION_DAYS = 7

        await revoke_session(mock_redis, "user-123", "session-456")

        # SEC-P1-2: per-session record deleted + blacklist written
        assert mock_redis.store.get("user:user-123:session:session-456") is None


@pytest.mark.asyncio
async def test_get_active_sessions_empty(mock_redis):
    """Get active sessions when none exist."""
    sessions = await get_active_sessions(mock_redis, "user-123")

    assert sessions == {}


@pytest.mark.asyncio
async def test_get_active_sessions_multiple(mock_redis):
    """Get active sessions with multiple sessions."""
    import json as _json
    for sid, ip in (("s1", "192.168.1.1"), ("s2", "192.168.1.2")):
        await mock_redis.set(f"user:user-123:session:{sid}",
                             _json.dumps({"ip": ip}))

    sessions = await get_active_sessions(mock_redis, "user-123")


    assert len(sessions) == 2
    assert "s1" in sessions
    assert "s2" in sessions


@pytest.mark.asyncio
async def test_revoke_all_sessions_success(mock_redis):
    """Revoke all sessions for user."""
    import json as _json
    for sid in ("session-1", "session-2"):
        await mock_redis.set(f"user:user-123:session:{sid}", _json.dumps({}))

    count = await revoke_all_sessions(mock_redis, "user-123")

    assert count == 2
    # per-session records gone; only blacklist entries remain
    assert not [k for k in mock_redis.store if ":session:" in k]
    assert len([k for k in mock_redis.store if k.startswith("blacklist:")]) == 2


@pytest.mark.asyncio
async def test_revoke_all_sessions_no_sessions(mock_redis):
    """Revoke all sessions when none exist."""

    count = await revoke_all_sessions(mock_redis, "user-123")

    assert count == 0
