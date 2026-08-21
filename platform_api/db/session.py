"""Database session management with bounded pools and explicit timeouts."""

from contextlib import contextmanager
from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from .base import Base

# Engine will be set from config
engine = None
SessionLocal = None


def init_db(database_url: str) -> None:
    """Initialize database engine and session factory.

    Pool is bounded:
      - pool_size=10: persistent connections
      - max_overflow=20: temporary overflow (total max = 30)
      - pool_timeout=10s: wait for a connection from the pool
      - pool_recycle=300s: recycle idle connections before PostgreSQL timeout
      - pool_pre_ping=True: validate connections before use
      - connect_args: 5s connect timeout, 15s statement timeout
    """
    global engine, SessionLocal

    from sqlalchemy import event

    engine = create_engine(
        database_url,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20,
        pool_timeout=10,         # 10s to acquire a connection from the pool
        pool_recycle=300,         # Recycle connections after 5 min
        echo=False,
        connect_args={
            "connect_timeout": 5,
            "options": "-c statement_timeout=15000",  # 15s statement timeout
        },
    )

    # Idle-in-transaction timeout: 30s. Prevents abandoned transactions
    # from holding connections.
    @event.listens_for(engine, "connect")
    def _set_session_timeouts(dbapi_conn, connection_record):
        try:
            cursor = dbapi_conn.cursor()
            cursor.execute("SET idle_in_transaction_session_timeout = '30s'")
            cursor.close()
        except Exception:
            pass

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
    """Get database session for FastAPI dependency.

    Session is always committed or rolled back and closed in finally block.
    """
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
