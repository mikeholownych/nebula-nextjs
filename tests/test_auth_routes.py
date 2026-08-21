"""Integration tests for authentication API routes."""

from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest
from fastapi import FastAPI
from httpx import ASGITransport, AsyncClient

from platform_api.auth.routes import get_current_user, router as auth_router
from platform_api.db import get_session
from platform_api.db.models import User, UserIdentity, Organization
from platform_api.redis_client import get_redis


@pytest.fixture
def app(mock_db, mock_redis):
    """Create test FastAPI app."""
    app = FastAPI()
    app.include_router(auth_router)
    app.dependency_overrides[get_session] = lambda: mock_db
    app.dependency_overrides[get_redis] = lambda: mock_redis
    return app


@pytest.fixture
async def client(app):
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        yield client


@pytest.fixture
def mock_db():
    """Mock database session."""
    db = MagicMock()
    db.query = MagicMock()
    db.add = MagicMock()
    db.flush = MagicMock()
    db.commit = MagicMock()
    return db


@pytest.fixture
def mock_redis():
    """Mock Redis client."""
    from tests.test_jwt_sessions import _FakeRedis
    return _FakeRedis()


@pytest.fixture
def mock_user():
    """Mock user object."""
    from datetime import datetime, timezone

    return User(
        id=uuid4(),
        email="test@example.com",
        created_at=datetime.now(timezone.utc)
    )


@pytest.mark.asyncio
async def test_google_auth_new_user(app, client, mock_db, mock_redis, mock_user):
    """Test Google OAuth with new user."""
    # Mock dependencies
    with patch("platform_api.auth.routes.get_redis", return_value=mock_redis):
        with patch("platform_api.auth.routes.get_session", return_value=mock_db):
            with patch("platform_api.auth.routes.verify_google_token") as mock_verify:
                # Mock Google token verification
                mock_verify.return_value = {
                    "subject": "google-user-123",
                    "email": "test@example.com",
                    "email_verified": True,
                }

                # Mock JWT token creation
                with patch("platform_api.auth.routes.create_session") as mock_create:
                    mock_create.return_value = "test-jwt-token"

                    # Mock database query (no existing identity)
                    mock_db.query.return_value.filter_by.return_value.first.return_value = None

                    response = await client.post(
                        "/auth/google",
                        json={"id_token": "test-google-token"}
                    )

                    # Should create user
                    assert mock_db.add.call_count >= 3  # User, Identity, Org, Membership

                    assert response.status_code == 200
                    data = response.json()
                    assert "access_token" in data
                    assert data["access_token"] == "test-jwt-token"


@pytest.mark.asyncio
async def test_google_auth_existing_user(app, client, mock_db, mock_redis, mock_user):
    """Test Google OAuth with existing user."""
    # Create mock identity
    mock_identity = MagicMock()
    mock_identity.user = mock_user

    # Mock dependencies
    with patch("platform_api.auth.routes.get_redis", return_value=mock_redis):
        with patch("platform_api.auth.routes.get_session", return_value=mock_db):
            with patch("platform_api.auth.routes.verify_google_token") as mock_verify:
                mock_verify.return_value = {
                    "subject": "google-user-123",
                    "email": "test@example.com",
                    "email_verified": True,
                }

                with patch("platform_api.auth.routes.create_session") as mock_create:
                    mock_create.return_value = "test-jwt-token"

                    # Mock database query (existing identity)
                    mock_db.query.return_value.filter_by.return_value.first.return_value = mock_identity

                    response = await client.post(
                        "/auth/google",
                        json={"id_token": "test-google-token"}
                    )

                    # Should NOT create new user
                    assert mock_db.add.call_count == 0

                    assert response.status_code == 200


@pytest.mark.asyncio
async def test_google_auth_invalid_token(app, client, mock_db, mock_redis):
    """Test Google OAuth with invalid token."""
    from platform_api.auth.google import GoogleOAuthError

    with patch("platform_api.auth.routes.get_redis", return_value=mock_redis):
        with patch("platform_api.auth.routes.get_session", return_value=mock_db):
            with patch("platform_api.auth.routes.verify_google_token") as mock_verify:
                mock_verify.side_effect = GoogleOAuthError("Invalid token")

                response = await client.post(
                    "/auth/google",
                    json={"id_token": "invalid-token"}
                )

                assert response.status_code == 401


@pytest.mark.asyncio
async def test_google_auth_rejects_unverified_email(client, mock_db):
    with patch("platform_api.auth.routes.verify_google_token") as mock_verify:
        mock_verify.return_value = {
            "subject": "google-user-123",
            "email": "unverified@example.com",
            "email_verified": False,
        }

        response = await client.post(
            "/auth/google",
            json={"id_token": "test-google-token"},
        )

    assert response.status_code == 401
    assert response.json()["detail"] == "Verified email required"
    mock_db.add.assert_not_called()


@pytest.mark.asyncio
async def test_logout_success(app, client, mock_redis):
    """Test successful logout."""
    mock_user = MagicMock()
    mock_user.id = uuid4()

    mock_current_user = {
        "user": mock_user,
        "user_id": str(mock_user.id),
        "org_id": str(uuid4()),
        "session_id": "session-123",
    }

    with patch("platform_api.auth.routes.get_redis", return_value=mock_redis):
        with patch("platform_api.auth.routes.get_current_user", return_value=mock_current_user):
            app.dependency_overrides[get_current_user] = lambda: mock_current_user
            response = await client.post("/auth/logout")

            assert response.status_code == 200
            assert "message" in response.json()

            # Should revoke session: record deleted, blacklist written
            assert "user:%s:session:session-123" % mock_current_user["user_id"] not in mock_redis.store
            assert "blacklist:jwt:session-123" in mock_redis.store


@pytest.mark.asyncio
async def test_list_sessions_success(app, client, mock_redis):
    """Test list sessions."""
    mock_user = MagicMock()
    mock_user.id = uuid4()

    mock_current_user = {
        "user": mock_user,
        "user_id": str(mock_user.id),
        "org_id": str(uuid4()),
        "session_id": "session-123",
    }

    import json as _json
    await mock_redis.set(
        f"user:{mock_current_user['user_id']}:session:session-1",
        _json.dumps({
            "ip": "192.168.1.1",
            "user_agent": "Mozilla/5.0",
            "created_at": "2026-07-14T06:00:00Z",
        }),
    )

    with patch("platform_api.auth.routes.get_redis", return_value=mock_redis):
        with patch("platform_api.auth.routes.get_current_user", return_value=mock_current_user):
            app.dependency_overrides[get_current_user] = lambda: mock_current_user
            response = await client.get("/auth/sessions")

            assert response.status_code == 200
            data = response.json()
            assert isinstance(data, list)
            assert len(data) == 1
            assert data[0]["session_id"] == "session-1"


@pytest.mark.asyncio
async def test_get_me_success(app, client):
    """Test get current user info."""
    from datetime import datetime, timezone

    mock_user = MagicMock()
    mock_user.id = uuid4()
    mock_user.email = "test@example.com"
    mock_user.created_at = datetime.now(timezone.utc)

    mock_current_user = {
        "user": mock_user,
        "user_id": str(mock_user.id),
        "org_id": str(uuid4()),
        "session_id": "session-123",
    }

    with patch("platform_api.auth.routes.get_current_user", return_value=mock_current_user):
        app.dependency_overrides[get_current_user] = lambda: mock_current_user
        response = await client.get(
            "/auth/me",
            headers={"Authorization": "Bearer test-token"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "test@example.com"


@pytest.mark.asyncio
async def test_get_me_unauthorized(app, client):
    """Test get current user without auth."""
    response = await client.get("/auth/me")

    assert response.status_code == 401
    assert "Missing authorization token" in response.json()["detail"]
