"""Authentication module.

Provides:
- Google OAuth 2.0 verification
- GitHub OAuth 2.0 authorization code flow
- JWT session management
- Auth routes (endpoints)
"""

from .google import (
    GoogleOAuthError,
    GoogleOIDCVerifier,
    verify_google_token,
)

from .github import (
    GitHubOAuthError,
    exchange_code_for_token,
    fetch_github_user,
    generate_authorize_url,
    validate_state,
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
    # GitHub OAuth
    "GitHubOAuthError",
    "exchange_code_for_token",
    "fetch_github_user",
    "generate_authorize_url",
    "validate_state",
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
