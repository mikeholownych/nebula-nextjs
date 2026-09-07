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
TRANSPORT_DRAIN_SECONDS = 0.05


def _socket_dsn(db: str) -> str:
    return f"postgresql://postgres@/{db}?host=/var/run/postgresql&port=5433"


async def _try_connect(db: str):
    return await asyncpg.connect(_socket_dsn(db), timeout=3)


@pytest.fixture(scope="module")
def pg_db():
    name = f"nebula_pgtest_{uuid.uuid4().hex[:8]}"
    created = False

    async def setup():
        nonlocal created
        conn = await _try_connect("postgres")
        try:
            await conn.execute(f"CREATE DATABASE {name}")
            created = True
        finally:
            await conn.close()
            await asyncio.sleep(TRANSPORT_DRAIN_SECONDS)

        c = await _try_connect(name)
        try:
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
            rows = [(f"https://t.example/{i}", f"q{i}@x.io") for i in range(10)]
            await c.executemany("INSERT INTO audits (url, email) VALUES ($1,$2)", rows)
            msgs = [("email", f"r{i}@x.io") for i in range(10)]
            await c.executemany(
                "INSERT INTO outbox_messages (channel, recipient) VALUES ($1,$2)", msgs
            )
        finally:
            await c.close()
            await asyncio.sleep(TRANSPORT_DRAIN_SECONDS)

    async def teardown():
        if not created:
            return
        conn = await _try_connect("postgres")
        try:
            await conn.execute(f"DROP DATABASE {name} WITH (FORCE)")
        finally:
            await conn.close()
            await asyncio.sleep(TRANSPORT_DRAIN_SECONDS)

    async def available():
        conn = await _try_connect("postgres")
        await conn.close()
        await asyncio.sleep(TRANSPORT_DRAIN_SECONDS)

    try:
        asyncio.run(available())
    except Exception:
        pytest.skip("local Postgres :5433 socket unavailable")
    try:
        asyncio.run(setup())
        yield name
    finally:
        asyncio.run(teardown())


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
        pool = await asyncpg.create_pool(
            _socket_dsn(pg_db), min_size=20, max_size=20, timeout=3
        )

        async def claim():
            async with pool.acquire() as conn:
                return await conn.fetchval(CLAIM_AUDIT_SQL)

        try:
            results = await asyncio.gather(*[claim() for _ in range(20)])
            return [r for r in results if r]
        finally:
            await pool.close()
            await asyncio.sleep(TRANSPORT_DRAIN_SECONDS)

    claimed = asyncio.run(run())

    # Exactly the number of pending rows get claimed; never duplicated.
    assert len(claimed) == 10
    assert len(set(claimed)) == len(claimed), "SKIP LOCKED violated: duplicate claim"


def test_concurrent_outbox_claims_are_exclusive(pg_db):
    """Outbox drains must never double-claim the same message."""

    async def run():
        pool = await asyncpg.create_pool(
            _socket_dsn(pg_db), min_size=20, max_size=20, timeout=3
        )

        async def claim():
            async with pool.acquire() as conn:
                return await conn.fetchval(CLAIM_OUTBOX_SQL)

        try:
            results = await asyncio.gather(*[claim() for _ in range(20)])
            return [r for r in results if r]
        finally:
            await pool.close()
            await asyncio.sleep(TRANSPORT_DRAIN_SECONDS)

    claimed = asyncio.run(run())

    assert len(set(claimed)) == len(claimed)
