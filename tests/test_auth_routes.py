"""Integration tests for authentication API routes."""

from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from httpx import AsyncClient

from platform_api.auth.routes import router as auth_router
from platform_api.db.models import User, UserIdentity, Organization


@pytest.fixture
def app():
    """Create test FastAPI app."""
    app = FastAPI()
    app.include_router(auth_router)
    return app


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
    redis = AsyncMock()
    redis.hset = AsyncMock()
    redis.hgetall = AsyncMock(return_value={})
    redis.exists = AsyncMock(return_value=False)
    redis.expire = AsyncMock()
    return redis


@pytest.fixture
def mock_user():
    """Mock user object."""
    from datetime import datetime, timezone

    return User(
        id=uuid4(),
        email="test@example.com",
        created_at=datetime.now(timezone.utc)
    )


def test_google_auth_new_user(app, mock_db, mock_redis, mock_user):
    """Test Google OAuth with new user."""
    client = TestClient(app)

    # Mock dependencies
    with patch("platform_api.auth.routes.get_redis", return_value=mock_redis):
        with patch("platform_api.auth.routes.get_session", return_value=mock_db):
            with patch("platform_api.auth.routes.verify_google_token") as mock_verify:
                # Mock Google token verification
                mock_verify.return_value = {
                    "subject": "google-user-123",
                    "email": "test@example.com",
                }

                # Mock JWT token creation
                with patch("platform_api.auth.routes.create_session") as mock_create:
                    mock_create.return_value = "test-jwt-token"

                    # Mock database query (no existing identity)
                    mock_db.query.return_value.filter_by.return_value.first.return_value = None

                    response = client.post(
                        "/auth/google",
                        json={"id_token": "test-google-token"}
                    )

                    # Should create user
                    assert mock_db.add.call_count >= 3  # User, Identity, Org, Membership

                    assert response.status_code == 200
                    data = response.json()
                    assert "access_token" in data
                    assert data["access_token"] == "test-jwt-token"


def test_google_auth_existing_user(app, mock_db, mock_redis, mock_user):
    """Test Google OAuth with existing user."""
    client = TestClient(app)

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
                }

                with patch("platform_api.auth.routes.create_session") as mock_create:
                    mock_create.return_value = "test-jwt-token"

                    # Mock database query (existing identity)
                    mock_db.query.return_value.filter_by.return_value.first.return_value = mock_identity

                    response = client.post(
                        "/auth/google",
                        json={"id_token": "test-google-token"}
                    )

                    # Should NOT create new user
                    assert mock_db.add.call_count == 0

                    assert response.status_code == 200


def test_google_auth_invalid_token(app, mock_db, mock_redis):
    """Test Google OAuth with invalid token."""
    client = TestClient(app)

    from platform_api.auth.google import GoogleOAuthError

    with patch("platform_api.auth.routes.get_redis", return_value=mock_redis):
        with patch("platform_api.auth.routes.get_session", return_value=mock_db):
            with patch("platform_api.auth.routes.verify_google_token") as mock_verify:
                mock_verify.side_effect = GoogleOAuthError("Invalid token")

                response = client.post(
                    "/auth/google",
                    json={"id_token": "invalid-token"}
                )

                assert response.status_code == 401


def test_logout_success(app, mock_redis):
    """Test successful logout."""
    client = TestClient(app)

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
            response = client.post("/auth/logout")

            assert response.status_code == 200
            assert "message" in response.json()

            # Should revoke session
            mock_redis.hset.assert_not_called()  # Not creating
            mock_redis.hdel.assert_called_once()  # Deleting


def test_list_sessions_success(app, mock_redis):
    """Test list sessions."""
    client = TestClient(app)

    mock_user = MagicMock()
    mock_user.id = uuid4()

    mock_current_user = {
        "user": mock_user,
        "user_id": str(mock_user.id),
        "org_id": str(uuid4()),
        "session_id": "session-123",
    }

    mock_redis.hgetall.return_value = {
        "session-1": {
            "ip": "192.168.1.1",
            "user_agent": "Mozilla/5.0",
            "created_at": "2026-07-14T06:00:00Z",
        }
    }

    with patch("platform_api.auth.routes.get_redis", return_value=mock_redis):
        with patch("platform_api.auth.routes.get_current_user", return_value=mock_current_user):
            response = client.get("/auth/sessions")

            assert response.status_code == 200
            data = response.json()
            assert isinstance(data, list)
            assert len(data) == 1
            assert data[0]["session_id"] == "session-1"


def test_get_me_success(app):
    """Test get current user info."""
    client = TestClient(app)

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
        response = client.get(
            "/auth/me",
            headers={"Authorization": "Bearer test-token"}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "test@example.com"


def test_get_me_unauthorized(app):
    """Test get current user without auth."""
    client = TestClient(app)

    response = client.get("/auth/me")

    assert response.status_code == 401
    assert "Missing authorization token" in response.json()["detail"]
