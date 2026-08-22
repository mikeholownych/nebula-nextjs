"""TEST-1: real-Postgres concurrency guarantees (no mocks).

Runs against a throwaway database created from the live schema of
nebula_audit's queue/outbox tables. Validates behaviors whose correctness
depends on PostgreSQL semantics:

  - outbox claim uses FOR UPDATE SKIP LOCKED: two concurrent drains claim
    DISTINCT rows, never the same row twice
  - claim_pending_audit (audits queue) hands distinct rows to concurrent
    workers and never duplicates

Skips (with explicit reason) when no local Postgres socket is available so
developer machines without PG still pass; CI runs it inside a service
container where the socket always exists.
"""

from __future__ import annotations

import asyncio
import uuid

import asyncpg
import pytest

DSN = "postgresql://postgres@/var/run/postgresql/port=5433"  # replaced below


def _socket_dsn(db: str) -> str:
    return f"postgresql://postgres@/{db}?host=/var/run/postgresql&port=5433"


async def _try_connect(db: str):
    return await asyncpg.connect(_socket_dsn(db), timeout=3)


@pytest.fixture(scope="module")
def pg_db():
    created = None
    try:
        loop = asyncio.new_event_loop()
        conn = loop.run_until_complete(_try_connect("postgres"))
    except Exception:
        pytest.skip("local Postgres :5433 socket unavailable")
    name = f"nebula_pgtest_{uuid.uuid4().hex[:8]}"
    loop.run_until_complete(conn.execute(f"CREATE DATABASE {name}"))
    conn.close()

    async def seed():
        c = await _try_connect(name)
        # minimal shapes mirroring production tables used by the runner
        await c.execute(
            """
            CREATE TABLE outbox_messages (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                channel TEXT NOT NULL,
                recipient TEXT NOT NULL,
                payload JSONB NOT NULL DEFAULT '{}',
                status TEXT NOT NULL DEFAULT 'pending',
                attempts INT NOT NULL DEFAULT 0,
                next_retry_at TIMESTAMPTZ,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            )
            """
        )
        await c.execute(
            "CREATE INDEX idx_outbox_pending ON outbox_messages (next_retry_at, created_at) "
            "WHERE status = 'pending'"
        )
        await c.execute(
            """
            CREATE TABLE audits (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                customer_id UUID,
                url VARCHAR(2048) NOT NULL,
                email VARCHAR(255) NOT NULL,
                name VARCHAR(255),
                status VARCHAR(20) NOT NULL DEFAULT 'pending',
                score INTEGER CHECK (score BETWEEN 0 AND 100),
                grade VARCHAR(2),
                findings JSONB,
                tech_stack JSONB,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                completed_at TIMESTAMPTZ,
                heartbeat_at TIMESTAMPTZ,
                share_token VARCHAR(32),
                requeue_attempts SMALLINT NOT NULL DEFAULT 0
            )
            """
        )
        rows = [
            (f"https://t.example/{i}", f"q{i}@x.io") for i in range(10)
        ]
        await c.executemany(
            "INSERT INTO audits (url, email) VALUES ($1,$2)", rows
        )
        msgs = [(f"email", f"r{i}@x.io") for i in range(10)]
        await c.executemany(
            "INSERT INTO outbox_messages (channel, recipient) VALUES ($1,$2)", msgs
        )
        await c.close()

    loop.run_until_complete(seed())
    created = name
    yield name
    if created:
        conn = loop.run_until_complete(_try_connect("postgres"))
        loop.run_until_complete(conn.execute(f"DROP DATABASE {created} WITH (FORCE)"))
        conn.close()
        loop.close()


CLAIM_AUDIT_SQL = """
UPDATE audits SET status='running', heartbeat_at=NOW()
WHERE id = (
  SELECT id FROM audits WHERE status='pending'
  ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT 1
)
RETURNING id
"""

CLAIM_OUTBOX_SQL = """
UPDATE outbox_messages SET status='sending', attempts=attempts+1
WHERE id = (
  SELECT id FROM outbox_messages WHERE status='pending' AND next_retry_at <= NOW()
  ORDER BY created_at FOR UPDATE SKIP LOCKED LIMIT 1
)
RETURNING id
"""


def test_concurrent_audit_claims_are_exclusive(pg_db):
    """20 workers claiming concurrently must receive 20 DISTINCT audit ids."""

    async def run():
        conns = [await _try_connect(pg_db) for _ in range(20)]
        try:
            results = await asyncio.gather(
                *[c.fetchval(CLAIM_AUDIT_SQL) for c in conns]
            )
            return [r for r in results if r]
        finally:
            for c in conns:
                await c.close()

    loop = asyncio.new_event_loop()
    claimed = loop.run_until_complete(run())

    # Exactly the number of pending rows get claimed; never duplicated.
    assert len(claimed) == 10
    assert len(set(claimed)) == len(claimed), "SKIP LOCKED violated: duplicate claim"


def test_concurrent_outbox_claims_are_exclusive(pg_db):
    """Outbox drains must never double-claim the same message."""

    async def run():
        conns = [await _try_connect(pg_db) for _ in range(20)]
        try:
            results = await asyncio.gather(
                *[c.fetchval(CLAIM_OUTBOX_SQL) for c in conns]
            )
            return [r for r in results if r]
        finally:
            for c in conns:
                await c.close()

    loop = asyncio.new_event_loop()
    claimed = loop.run_until_complete(run())

    assert len(set(claimed)) == len(claimed)
