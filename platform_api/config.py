"""Configuration settings using Pydantic Settings."""

import os
import re
from typing import List, Optional
from urllib.parse import urlparse

from pydantic import HttpUrl, field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings."""

    # Database
    DATABASE_URL: Optional[str] = None
    AUDIT_DATABASE_URL: Optional[str] = None

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Server
    PORT: int = 8001

    # OIDC Authentication
    OIDC_ISSUER: Optional[str] = None
    OIDC_AUDIENCE: Optional[str] = None
    OIDC_JWKS_URL: Optional[str] = None

    # Google OAuth
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None

    # GitHub OAuth
    GITHUB_CLIENT_ID: Optional[str] = None
    GITHUB_CLIENT_SECRET: Optional[str] = None

    # Public-facing base URL (used for OAuth redirect URIs)
    PUBLIC_BASE_URL: str = "https://nebulacomponents.com"

    # JWT
    SECRET_KEY: Optional[str] = None
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_DAYS: int = 7

    # Stripe
    STRIPE_SECRET_KEY: Optional[str] = None
    STRIPE_WEBHOOK_SECRET: Optional[str] = None
    STRIPE_PUBLISHABLE_KEY: Optional[str] = None

    # SendGrid
    SENDGRID_API_KEY: Optional[str] = None
    SENDGRID_FROM_EMAIL: str = "noreply@nebulacomponents.shop"

    # OpenRouter (AI Assistant)
    OPENROUTER_API_KEY: Optional[str] = None

    # PostHog
    POSTHOG_PROJECT_TOKEN: Optional[str] = None
    POSTHOG_HOST: str = "https://us.i.posthog.com"
    POSTHOG_PERSONAL_API_KEY: Optional[str] = None

    # CORS
    ALLOWED_ORIGINS: List[str] = []

    # Environment
    ENVIRONMENT: str = "development"

    # Request limits
    MAX_JSON_BODY_BYTES: int = 1024 * 1024  # 1MB default

    model_config = {
        "env_file": ".env",
        "case_sensitive": False,
        # The shared .env also carries frontend-only vars (NEXT_PUBLIC_*) -
        # the API must tolerate them rather than crash at startup.
        "extra": "ignore",
    }

    @field_validator("DATABASE_URL", "AUDIT_DATABASE_URL")
    @classmethod
    def validate_postgres_url(cls, v: Optional[str]) -> Optional[str]:
        """Validate PostgreSQL URL scheme."""
        if v is None:
            return v

        parsed = urlparse(v)
        if parsed.scheme not in ("postgresql", "postgres", "postgresql+psycopg"):
            raise ValueError("DATABASE_URL must use postgresql:// or postgresql+psycopg:// scheme")

        return v

    @field_validator("OIDC_ISSUER", "OIDC_JWKS_URL")
    @classmethod
    def validate_https_urls(cls, v: Optional[str]) -> Optional[str]:
        """Validate HTTPS URLs except for test fixtures."""
        if v is None:
            return v

        # Skip validation for test fixtures
        if "localhost" in v or "127.0.0.1" in v:
            return v

        parsed = urlparse(v)
        if parsed.scheme != "https":
            raise ValueError("OIDC URLs must use HTTPS except for test fixtures")

        return v

    @field_validator("ENVIRONMENT")
    @classmethod
    def validate_environment(cls, v: str) -> str:
        """Validate environment value."""
        valid_envs = {"development", "staging", "production"}
        if v not in valid_envs:
            raise ValueError(f"Environment must be one of {valid_envs}")
        return v

    @property
    def is_production(self) -> bool:
        """Check if running in production environment."""
        return self.ENVIRONMENT == "production"

    @property
    def is_development(self) -> bool:
        """Check if running in development environment."""
        return self.ENVIRONMENT == "development"

    def missing_required_settings(self) -> List[str]:
        """Return list of missing required setting keys."""
        missing = []

        # For the scaffold, require environment settings
        if not self.ENVIRONMENT:
            missing.append("ENVIRONMENT")

        # In production, require more settings
        if self.is_production:
            # Production requires all URLs to be HTTPS (validated elsewhere)
            # and at least one allowed origin for CORS
            if len(self.ALLOWED_ORIGINS) == 0:
                missing.append("ALLOWED_ORIGINS")
            if not self.STRIPE_WEBHOOK_SECRET:
                missing.append("STRIPE_WEBHOOK_SECRET")
            if not self.SECRET_KEY:
                missing.append("SECRET_KEY")
            if not self.DATABASE_URL:
                missing.append("DATABASE_URL")
            if not self.AUDIT_DATABASE_URL:
                missing.append("AUDIT_DATABASE_URL")

        return missing

    def ready(self) -> bool:
        """Check if all required settings are present."""
        return len(self.missing_required_settings()) == 0


# Global settings instance
settings = Settings()

def _dsn(env_var: str, default_dev_dsn: str) -> str:
    """Resolve a database DSN from the environment contract.

    DATA-4 invariant: production must never silently fall back to a hardcoded
    local-socket DSN. In production a missing variable is a hard error; in
    development the documented socket default keeps local runs working.
    """
    value = os.getenv(env_var)
    if value:
        return value
    if os.getenv("ENVIRONMENT") == "production":
        raise RuntimeError(f"{env_var} is required when ENVIRONMENT=production")
    return default_dev_dsn


def audit_db_dsn() -> str:
    return _dsn("AUDIT_DATABASE_URL",
                "postgresql://postgres@/nebula_audit?host=/var/run/postgresql&port=5433")


def platform_db_dsn() -> str:
    return _dsn("DATABASE_URL",
                "postgresql://postgres@/nebula_platform?host=/var/run/postgresql&port=5433")
