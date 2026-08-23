"""Database service for teardown content and ownership claims."""

import json

import asyncpg

from platform_api.config import audit_db_dsn


class ClaimConflict(Exception):
    """Another email holds the active claim for this teardown."""


class TeardownDB:
    def __init__(self):
        self.db_url = audit_db_dsn()
        self.pool = None

    async def _init_conn(self, conn):
        await conn.set_type_codec(
            "jsonb", encoder=lambda v: json.dumps(v),
            decoder=lambda s: json.loads(s), schema="pg_catalog")

    async def connect(self):
        if not self.pool:
            self.pool = await asyncpg.create_pool(
                self.db_url, min_size=1, max_size=5,
                command_timeout=10, statement_cache_size=0,
                server_settings={"statement_timeout": "15s"},
                init=self._init_conn,
            )

    async def close(self):
        if self.pool:
            await self.pool.close()

    async def upsert_teardown(self, record: dict) -> None:
        await self.connect()
        q = """
        INSERT INTO teardowns
          (slug, name, url, domain, score, grade, audited_at, summary, context,
           findings, screenshot_path)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11)
        ON CONFLICT (slug) DO UPDATE SET
          name=EXCLUDED.name, url=EXCLUDED.url, domain=EXCLUDED.domain,
          score=EXCLUDED.score, grade=EXCLUDED.grade, audited_at=EXCLUDED.audited_at,
          summary=EXCLUDED.summary, context=EXCLUDED.context,
          findings=EXCLUDED.findings, screenshot_path=EXCLUDED.screenshot_path,
          updated_at=now()
        """
        async with self.pool.acquire() as conn:
            await conn.execute(
                q, record["slug"], record["name"], record["url"], record["domain"],
                record.get("score"), record.get("grade"), record.get("audited_at"),
                record.get("summary"), record.get("context"),
                record.get("findings", []),
                record.get("screenshot_path"),
            )
    @staticmethod
    def _with_claim(row, claim) -> dict:
        d = dict(row)
        d["findings"] = (
            d["findings"] if isinstance(d.get("findings"), list) else []
        )
        if claim is None:
            d["claim"] = None
        else:
            c = dict(claim)
            if c.get("response_status") != "visible":
                c.pop("response_text", None)
            d["claim"] = c
        return d

    async def list_teardowns(self) -> list[dict]:
        await self.connect()
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT t.slug, t.name, t.url, t.domain, t.score, t.grade,
                       to_char(t.audited_at AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS audited_at,
                       t.summary, t.screenshot_path,
                       (c.id IS NOT NULL AND c.status = 'active') AS claimed
                FROM teardowns t
                LEFT JOIN LATERAL (
                    SELECT id, status FROM teardown_claims tc
                    WHERE tc.slug = t.slug ORDER BY (tc.status='active') DESC
                    LIMIT 1
                ) c ON true
                ORDER BY t.name
                """
            )
            return [self._with_claim(r, {"status": "active"} if r["claimed"] else None) for r in rows]

    async def get_teardown(self, slug: str) -> dict | None:
        await self.connect()
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                SELECT t.*, 
                       to_char(t.audited_at AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS audited_at_iso
                FROM teardowns t WHERE t.slug = $1
                """,
                slug,
            )
            if row is None:
                return None
            claim = await conn.fetchrow(
                """SELECT claimed_by_email, verification_method, status,
                          response_status, response_text
                   FROM teardown_claims WHERE slug = $1
                     AND status = 'active'
                   LIMIT 1""",
                slug,
            )
        return self._with_claim(row, claim)

    async def create_claim(self, slug: str, email: str, method: str) -> dict:
        await self.connect()
        norm = email.strip().lower()
        async with self.pool.acquire() as conn:
            revoked = await conn.fetchval(
                "SELECT id FROM teardown_claims "
                "WHERE slug=$1 AND claimed_by_email=$2 AND status='revoked' LIMIT 1",
                slug, norm)
            if revoked:
                # Spec: revoked claims never silently re-activate. Support path only.
                raise ClaimConflict(f"revoked:{norm}")
            existing = await conn.fetchrow(
                "SELECT id, claimed_by_email FROM teardown_claims "
                "WHERE slug=$1 AND status='active'", slug)
            if existing:
                if existing["claimed_by_email"] == norm:
                    return dict(await conn.fetchrow(
                        "SELECT * FROM teardown_claims WHERE id=$1", existing["id"]))
                raise ClaimConflict(existing["claimed_by_email"])
            try:
                return dict(await conn.fetchrow(
                    """INSERT INTO teardown_claims (slug, claimed_by_email, verification_method)
                       VALUES ($1,$2,$3) RETURNING *""", slug, norm, method))
            except asyncpg.UniqueViolationError:
                other = await conn.fetchval(
                    "SELECT claimed_by_email FROM teardown_claims "
                    "WHERE slug=$1 AND status='active'", slug)
                raise ClaimConflict(other)

    async def update_response(self, slug: str, email: str, *,
                              response_text: str | None = None,
                              private_context: str | None = None) -> dict | None:
        await self.connect()
        norm = email.strip().lower()
        async with self.pool.acquire() as conn:
            if response_text is not None:
                row = await conn.fetchrow(
                    """UPDATE teardown_claims SET response_text=$3,
                           response_updated_at=now(), updated_at=now()
                       WHERE slug=$1 AND claimed_by_email=$2 AND status='active'
                       RETURNING *""", slug, norm, response_text)
            elif private_context is not None:
                row = await conn.fetchrow(
                    """UPDATE teardown_claims SET private_context=$3, updated_at=now()
                       WHERE slug=$1 AND claimed_by_email=$2 AND status='active'
                       RETURNING *""", slug, norm, private_context)
            else:
                row = None
            return dict(row) if row else None

    async def set_response_status(self, slug: str, status: str) -> dict | None:
        await self.connect()
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                """UPDATE teardown_claims SET response_status=$2, updated_at=now()
                   WHERE slug=$1 AND status='active' RETURNING *""",
                slug, status)
            return dict(row) if row else None

    async def get_active_claim_by_domain(self, domain: str) -> dict | None:
        await self.connect()
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                """SELECT tc.* FROM teardown_claims tc
                   JOIN teardowns t ON t.slug = tc.slug
                   WHERE t.domain = $1 AND tc.status = 'active'
                   LIMIT 1""", domain)
            return dict(row) if row else None

    async def list_claims_by_email(self, email: str) -> list[dict]:
        """Active teardown claims owned by an email, with public teardown fields."""
        await self.connect()
        norm = email.strip().lower()
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                """SELECT t.slug, t.name, t.domain, t.score
                   FROM teardown_claims tc
                   JOIN teardowns t ON t.slug = tc.slug
                   WHERE tc.claimed_by_email = $1 AND tc.status = 'active'
                   ORDER BY t.name""", norm)
            return [dict(r) for r in rows]


_db: TeardownDB | None = None


def get_teardown_db() -> TeardownDB:
    global _db
    if _db is None:
        _db = TeardownDB()
    return _db
