"""Database base configuration and types."""

from datetime import datetime, timezone
from typing import Any
from uuid import uuid4

from sqlalchemy import MetaData
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy.dialects.postgresql import UUID

# Naming convention for indexes and constraints
convention = {
    "ix": "ix_%(column_0_label)s",
    "uq": "uq_%(table_name)s_%(column_0_name)s",
    "ck": "ck_%(table_name)s_%(constraint_name)s",
    "fk": "fk_%(table_name)s_%(column_0_name)s_%(referred_table_name)s",
    "pk": "pk_%(table_name)s",
}

metadata = MetaData(naming_convention=convention)


class Base(DeclarativeBase):
    """Base class for all models."""
    metadata = metadata

    def __init__(self, **kwargs: Any) -> None:
        super().__init__(**kwargs)


class TimestampMixin:
    """Mixin for created_at and updated_at timestamps (UTC)."""
    # These will be overridden in concrete models
    # created_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc))
    # updated_at = Column(DateTime(timezone=True), nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))


def utcnow() -> datetime:
    """Return current UTC datetime."""
    return datetime.now(timezone.utc)


def generate_uuid() -> UUID:
    """Generate a new UUID4."""
    return uuid4()
