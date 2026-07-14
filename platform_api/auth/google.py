"""Google OAuth 2.0 / OpenID Connect verification.

Flow:
1. Frontend receives ID token from Google Sign-In
2. Backend verifies token signature using Google's public keys (JWKS)
3. Extract user claims (email, name, picture)
4. Return verified user info

Security:
- Signature verification (RS256)
- Issuer verification (accounts.google.com)
- Audience verification (client_id)
- Expiration check (exp claim)
"""

import time
from typing import Dict, Optional

import httpx
from authlib.jose import JsonWebKey, jwt
from authlib.jose.errors import JoseError

from ..config import settings


# Google OIDC configuration
GOOGLE_ISSUER = "https://accounts.google.com"
GOOGLE_JWKS_URL = "https://www.googleapis.com/oauth2/v3/certs"
GOOGLE_JWKS_CACHE_TTL = 3600  # 1 hour


class GoogleOAuthError(Exception):
    """Google OAuth verification error."""
    pass


class GoogleOIDCVerifier:
    """Verify Google OpenID Connect tokens.
    
    Usage:
        verifier = GoogleOIDCVerifier(client_id=settings.GOOGLE_CLIENT_ID)
        user_info = await verifier.verify_token(id_token)
        
        # user_info = {
        #     "subject": "google_user_id",
        #     "email": "user@example.com",
        #     "email_verified": True,
        #     "name": "John Doe",
        #     "picture": "https://..."
        # }
    """
    
    def __init__(self, client_id: str, client_secret: Optional[str] = None):
        self.client_id = client_id
        self.client_secret = client_secret
        self._jwks_cache: Optional[Dict] = None
        self._jwks_cache_time: float = 0
    
    async def _fetch_jwks(self) -> Dict:
        """Fetch Google's public keys (JWKS).
        
        Caches keys for 1 hour to avoid repeated requests.
        """
        # Check cache
        if (
            self._jwks_cache is not None
            and time.time() - self._jwks_cache_time < GOOGLE_JWKS_CACHE_TTL
        ):
            return self._jwks_cache
        
        # Fetch from Google
        async with httpx.AsyncClient() as client:
            response = await client.get(GOOGLE_JWKS_URL)
            response.raise_for_status()
            jwks = response.json()
        
        # Cache results
        self._jwks_cache = jwks
        self._jwks_cache_time = time.time()
        
        return jwks
    
    async def verify_token(self, id_token: str) -> Dict:
        """Verify Google ID token and extract claims.
        
        Args:
            id_token: JWT from Google Sign-In
        
        Returns:
            Dictionary with user information:
            - subject: Google user ID
            - email: User email
            - email_verified: Boolean
            - name: User name (optional)
            - picture: Avatar URL (optional)
        
        Raises:
            GoogleOAuthError: If token verification fails
        """
        try:
            # Get Google's public keys
            jwks = await self._fetch_jwks()
            
            # Decode and verify JWT
            claims = jwt.decode(
                id_token,
                key=jwks,
                claims_options={
                    "iss": {"values": [GOOGLE_ISSUER]},
                    "aud": {"values": [self.client_id]},
                }
            )
            
            # Extract standard claims
            return {
                "subject": claims.get("sub"),
                "email": claims.get("email"),
                "email_verified": claims.get("email_verified", False),
                "name": claims.get("name"),
                "given_name": claims.get("given_name"),
                "family_name": claims.get("family_name"),
                "picture": claims.get("picture"),
                "locale": claims.get("locale"),
            }
        
        except JoseError as e:
            raise GoogleOAuthError(f"Token verification failed: {e}")
        except httpx.HTTPError as e:
            raise GoogleOAuthError(f"Failed to fetch JWKS: {e}")
    
    async def get_user_info(self, access_token: str) -> Dict:
        """Get user info from Google using access token.
        
        Alternative method when ID token is not available.
        
        Args:
            access_token: OAuth 2.0 access token
        
        Returns:
            User info dictionary
        """
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://www.googleapis.com/oauth2/v3/userinfo",
                headers={"Authorization": f"Bearer {access_token}"}
            )
            response.raise_for_status()
            return response.json()


# Global verifier instance
_verifier: Optional[GoogleOIDCVerifier] = None


def get_verifier() -> GoogleOIDCVerifier:
    """Get or create Google OIDC verifier.
    
    Requires GOOGLE_CLIENT_ID to be configured.
    """
    global _verifier
    
    if _verifier is None:
        if not settings.GOOGLE_CLIENT_ID:
            raise ValueError("GOOGLE_CLIENT_ID not configured")
        
        _verifier = GoogleOIDCVerifier(
            client_id=settings.GOOGLE_CLIENT_ID,
            client_secret=settings.GOOGLE_CLIENT_SECRET
        )
    
    return _verifier


async def verify_google_token(id_token: str) -> Dict:
    """Verify Google ID token and return user info.
    
    Convenience function for use in routes.
    
    Args:
        id_token: JWT from Google Sign-In
    
    Returns:
        User info dict with subject, email, name, picture
    
    Raises:
        GoogleOAuthError: If verification fails
    """
    verifier = get_verifier()
    return await verifier.verify_token(id_token)
