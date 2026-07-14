"""Configuration settings using Pydantic Settings."""

import re
from typing import List, Optional
from urllib.parse import urlparse

from pydantic import HttpUrl, field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings."""
    
    # Database
    DATABASE_URL: Optional[str] = None
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Server
    PORT: int = 8769  # Changed from 8766 (Apache) and 8767 (conflict)
    
    # OIDC Authentication
    OIDC_ISSUER: Optional[str] = None
    OIDC_AUDIENCE: Optional[str] = None
    OIDC_JWKS_URL: Optional[str] = None
    
    # Google OAuth
    GOOGLE_CLIENT_ID: Optional[str] = None
    GOOGLE_CLIENT_SECRET: Optional[str] = None
    
    # JWT
    SECRET_KEY: Optional[str] = None
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_DAYS: int = 7
    
    # Stripe
    STRIPE_SECRET_KEY: Optional[str] = None
    STRIPE_WEBHOOK_SECRET: Optional[str] = None
    
    # SendGrid
    SENDGRID_API_KEY: Optional[str] = None
    SENDGRID_FROM_EMAIL: str = "noreply@nebulacomponents.shop"
    
    # CORS
    ALLOWED_ORIGINS: List[str] = []
    
    # Environment
    ENVIRONMENT: str = "development"
    
    # Request limits
    MAX_JSON_BODY_BYTES: int = 1024 * 1024  # 1MB default
    
    model_config = {
        "env_file": ".env",
        "case_sensitive": False,
    }
    
    @field_validator("DATABASE_URL")
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
        
        return missing
    
    def ready(self) -> bool:
        """Check if all required settings are present."""
        return len(self.missing_required_settings()) == 0


# Global settings instance
settings = Settings()