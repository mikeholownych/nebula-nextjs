"""Unit tests for Google OAuth verification."""

import time
from unittest.mock import AsyncMock, MagicMock, patch

import httpx
import pytest
from authlib.jose import JoseError, jwt

from platform_api.auth.google import (
    GOOGLE_JWKS_URL,
    GoogleOAuthError,
    GoogleOIDCVerifier,
    verify_google_token,
)


# Sample JWKS response (mocked)
MOCK_JWKS = {
    "keys": [
        {
            "kty": "RSA",
            "kid": "test-key-id",
            "use": "sig",
            "alg": "RS256",
            "n": "test-n",
            "e": "AQAB",
        }
    ]
}


@pytest.fixture
def verifier():
    """Create Google OIDC verifier instance."""
    return GoogleOIDCVerifier(client_id="test-client-id")


@pytest.mark.asyncio
async def test_fetch_jwks_caches_result(verifier):
    """JWKS should be cached for 1 hour."""
    mock_response = MagicMock()
    mock_response.json.return_value = MOCK_JWKS
    mock_response.raise_for_status = MagicMock()

    with patch.object(httpx.AsyncClient, "get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = mock_response

        # First fetch
        jwks1 = await verifier._fetch_jwks()

        # Second fetch (should use cache)
        jwks2 = await verifier._fetch_jwks()

        # Should only call HTTP once
        assert mock_get.call_count == 1
        assert jwks1 == jwks2 == MOCK_JWKS


@pytest.mark.asyncio
async def test_fetch_jwks_refreshes_after_ttl_expired(verifier):
    """JWKS cache should refresh after TTL."""
    mock_response = MagicMock()
    mock_response.json.return_value = MOCK_JWKS
    mock_response.raise_for_status = MagicMock()

    with patch.object(httpx.AsyncClient, "get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = mock_response

        # First fetch
        await verifier._fetch_jwks()

        # Expire cache
        verifier._jwks_cache_time = time.time() - 4000  # Older than 1 hour

        # Second fetch (should refresh)
        await verifier._fetch_jwks()

        # Should call HTTP twice
        assert mock_get.call_count == 2


@pytest.mark.asyncio
async def test_verify_google_token_success(verifier):
    """Successfully verify valid Google ID token."""
    # Mock JWKS fetch
    mock_response = MagicMock()
    mock_response.json.return_value = MOCK_JWKS
    mock_response.raise_for_status = MagicMock()

    # Mock JWT decode
    mock_claims = {
        "sub": "google-user-123",
        "email": "user@example.com",
        "email_verified": True,
        "name": "Test User",
        "picture": "https://example.com/photo.jpg",
    }

    with patch.object(httpx.AsyncClient, "get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = mock_response

        with patch("platform_api.auth.google.jwt.decode") as mock_decode:
            mock_decode.return_value = mock_claims

            result = await verifier.verify_token("test-token")

            assert result["subject"] == "google-user-123"
            assert result["email"] == "user@example.com"
            assert result["email_verified"] is True
            assert result["name"] == "Test User"


@pytest.mark.asyncio
async def test_verify_google_token_invalid_signature(verifier):
    """Invalid JWT signature should raise error."""
    mock_response = MagicMock()
    mock_response.json.return_value = MOCK_JWKS
    mock_response.raise_for_status = MagicMock()

    with patch.object(httpx.AsyncClient, "get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = mock_response

        with patch("platform_api.auth.google.jwt.decode") as mock_decode:
            mock_decode.side_effect = JoseError("Invalid signature")

            with pytest.raises(GoogleOAuthError) as exc_info:
                await verifier.verify_token("invalid-token")

            assert "Token verification failed" in str(exc_info.value)


@pytest.mark.asyncio
async def test_verify_google_token_jwks_fetch_error(verifier):
    """JWKS fetch failure should raise error."""
    with patch.object(httpx.AsyncClient, "get", new_callable=AsyncMock) as mock_get:
        mock_get.side_effect = httpx.HTTPError("Network error")

        with pytest.raises(GoogleOAuthError) as exc_info:
            await verifier.verify_token("test-token")

        assert "Failed to fetch JWKS" in str(exc_info.value)


@pytest.mark.asyncio
async def test_get_user_info_success(verifier):
    """Get user info from access token."""
    mock_response = MagicMock()
    mock_response.json.return_value = {
        "sub": "google-user-123",
        "email": "user@example.com",
    }
    mock_response.raise_for_status = MagicMock()

    with patch.object(httpx.AsyncClient, "get", new_callable=AsyncMock) as mock_get:
        mock_get.return_value = mock_response

        result = await verifier.get_user_info("test-access-token")

        assert result["sub"] == "google-user-123"
        assert result["email"] == "user@example.com"


def test_get_verifier_singleton():
    """get_verifier should return same instance."""
    from platform_api.auth.google import _verifier, get_verifier

    # Reset singleton
    import platform_api.auth.google as google_module
    google_module._verifier = None

    # Create first instance
    v1 = get_verifier()
    v2 = get_verifier()

    assert v1 is v2

    # Cleanup
    google_module._verifier = None
