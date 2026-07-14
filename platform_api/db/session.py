"""Database session management."""

from contextlib import contextmanager
from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from .base import Base

# Engine will be set from config
engine = None
SessionLocal = None


def init_db(database_url: str) -> None:
    """Initialize database engine and session factory."""
    global engine, SessionLocal

    engine = create_engine(
        database_url,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20,
        echo=False,  # Set True for SQL logging
    )

    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def create_tables() -> None:
    """Create all tables (for development/testing)."""
    if engine is None:
        raise RuntimeError("Database not initialized. Call init_db() first.")
    Base.metadata.create_all(bind=engine)


def drop_tables() -> None:
    """Drop all tables (for testing)."""
    if engine is None:
        raise RuntimeError("Database not initialized. Call init_db() first.")
    Base.metadata.drop_all(bind=engine)


def get_session() -> Generator[Session, None, None]:
    """Get database session for FastAPI dependency."""
    if SessionLocal is None:
        raise RuntimeError("Database not initialized. Call init_db() first.")

    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


@contextmanager
def session_scope() -> Generator[Session, None, None]:
    """Context manager for database session (for scripts)."""
    if SessionLocal is None:
        raise RuntimeError("Database not initialized. Call init_db() first.")

    session = SessionLocal()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()
