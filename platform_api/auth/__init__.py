"""Authentication module.

Provides:
- Google OAuth 2.0 verification
- JWT session management
- Auth routes (endpoints)
"""

from .google import (
    GoogleOAuthError,
    GoogleOIDCVerifier,
    verify_google_token,
)

from .jwt import (
    JWTError,
    create_jwt,
    create_session,
    decode_jwt,
    get_active_sessions,
    revoke_all_sessions,
    revoke_session,
    verify_session,
)

__all__ = [
    # Google OAuth
    "GoogleOAuthError",
    "GoogleOIDCVerifier",
    "verify_google_token",
    # JWT Sessions
    "JWTError",
    "create_jwt",
    "create_session",
    "decode_jwt",
    "get_active_sessions",
    "revoke_all_sessions",
    "revoke_session",
    "verify_session",
]
