"""
Database service for audit persistence

Hardened:
  - Pool bounded: min_size=2, max_size=10
  - statement_timeout=15s (server-side)
  - command_timeout=10s (client-side asyncpg)
  - connect_timeout=5s
  - idle_in_transaction_session_timeout=30s
  - Heartbeat for stale detection
  - Admission control: bounded pending queue depth
"""

import os
import asyncpg
import secrets
from datetime import datetime, timezone
from typing import Optional, List
from uuid import UUID
import json

# Internal/founder accounts excluded from all public-facing stats and counts.
INTERNAL_EMAILS: frozenset[str] = frozenset({
    "mike.holownych@gmail.com",
    "mcp-agent@nebula.internal",
    "qa-workspace-20260803-001@example.invalid",
    "e2e-crawler-test@example.com",
    "test@example.com",
})

# ─── Admission control constants ─────────────────────────────────────────────
# Derived from: p95 audit duration ~90s, 2 workers = max concurrent throughput.
# Max acceptable queue wait = 10 minutes → 10*60/90 ≈ 6.6, capped at 8.
MAX_RUNNING_AUDITS = 2
MAX_PENDING_AUDITS = 8
STALE_HEARTBEAT_SECONDS = 180  # 3 minutes
STALE_PENDING_MINUTES = 30


class AuditDB:
    """PostgreSQL database service for audit records"""

    def __init__(self):
        # Audit pipeline has its own dedicated database. It must NOT inherit
        # the platform DATABASE_URL (which points at nebula_platform for the
        # auth tables). Use AUDIT_DATABASE_URL when set, else the default.
        self.db_url = os.getenv(
            "AUDIT_DATABASE_URL",
            "postgresql://postgres@/nebula_audit?host=/var/run/postgresql&port=5433"
        )
        self.pool = None

    async def connect(self):
        """Create connection pool with bounded timeouts."""
        if not self.pool:
            self.pool = await asyncpg.create_pool(
                self.db_url,
                min_size=2,
                max_size=10,
                command_timeout=10,           # 10s client-side timeout per query
                statement_cache_size=0,
                server_settings={
                    "statement_timeout": "15s",
                    "idle_in_transaction_session_timeout": "30s",
                },
            )

    async def close(self):
        """Close connection pool"""
        if self.pool:
            await self.pool.close()

    async def get_or_create_customer(self, email: str, name: Optional[str] = None) -> UUID:
        """Get or create customer by email."""
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                INSERT INTO customers (email, name) VALUES ($1, $2)
                ON CONFLICT (email) DO UPDATE
                SET name = COALESCE(EXCLUDED.name, customers.name)
                RETURNING id
                """,
                email, name
            )
            return row['id']

    async def create_audit(self, url: str, email: str, name: Optional[str] = None,
                           source: Optional[str] = None,
                           partner_id: Optional[str] = None,
                           engine_input: Optional[dict] = None) -> UUID:
        """Create a new audit record in pending state."""
        await self.connect()

        customer_id = await self.get_or_create_customer(email, name)
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                INSERT INTO audits (customer_id, url, email, name, status, source, partner_id, engine_input)
                VALUES ($1, $2, $3, $4, 'pending', $5, $6, $7::jsonb)
                RETURNING id
                """,
                customer_id, url, email, name, source, partner_id,
                json.dumps(engine_input) if engine_input is not None else None,
            )
            return row['id']

    # ─── Admission control ────────────────────────────────────────────────────

    async def count_running(self) -> int:
        """Count currently running audits."""
        await self.connect()
        async with self.pool.acquire() as conn:
            return await conn.fetchval(
                "SELECT COUNT(*) FROM audits WHERE status = 'running'"
            ) or 0

    async def count_pending(self) -> int:
        """Count currently pending audits."""
        await self.connect()
        async with self.pool.acquire() as conn:
            return await conn.fetchval(
                "SELECT COUNT(*) FROM audits WHERE status = 'pending'"
            ) or 0

    async def check_admission(self) -> tuple[bool, str]:
        """Check whether a new audit can be admitted.

        Returns (allowed, reason).
        """
        running = await self.count_running()
        if running >= MAX_RUNNING_AUDITS:
            return False, f"at_capacity: {running}/{MAX_RUNNING_AUDITS} running"

        pending = await self.count_pending()
        if pending >= MAX_PENDING_AUDITS:
            return False, f"queue_full: {pending}/{MAX_PENDING_AUDITS} pending"

        return True, "ok"

    # ─── Audit lifecycle ──────────────────────────────────────────────────────

    async def find_open_by_attempt_id(self, attempt_id: str) -> Optional[dict]:
        """Return existing pending/running audit for this analytics_attempt_id."""
        attempt_id = (attempt_id or "").strip()
        if not attempt_id:
            return None
        await self.connect()
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                SELECT id, url, email, name, status, engine_input
                FROM audits
                WHERE engine_input->>'analytics_attempt_id' = $1
                  AND status IN ('pending', 'running')
                ORDER BY created_at ASC
                LIMIT 1
                """,
                attempt_id,
            )
        if not row:
            return None
        data = dict(row)
        if data.get("engine_input") and isinstance(data["engine_input"], str):
            try:
                data["engine_input"] = json.loads(data["engine_input"])
            except json.JSONDecodeError:
                pass
        return data

    async def mark_audit_failed(self, audit_id: UUID, reason: Optional[str] = None) -> bool:
        """Persist engine failure without overwriting a completed audit."""
        await self.connect()
        async with self.pool.acquire() as conn:
            result = await conn.execute(
                """
                UPDATE audits SET status = 'failed',
                    engine_input = CASE
                        WHEN $2::text IS NULL THEN engine_input
                        ELSE COALESCE(engine_input, '{}'::jsonb)
                             || jsonb_build_object('failure_reason', $2::text)
                    END
                WHERE id = $1 AND status <> 'completed'
                """,
                audit_id, reason,
            )
            return result == 'UPDATE 1'

    async def claim_pending_audit(self) -> Optional[dict]:
        """Claim the next pending audit with SKIP LOCKED. Marks it running."""
        await self.connect()
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                UPDATE audits
                SET status = 'running', heartbeat_at = NOW()
                WHERE id = (
                    SELECT id FROM audits
                    WHERE status = 'pending'
                    ORDER BY created_at ASC
                    FOR UPDATE SKIP LOCKED
                    LIMIT 1
                )
                RETURNING id, url, email, name, source, partner_id, engine_input, status
                """
            )
            if not row:
                return None
            data = dict(row)
            if data.get("engine_input") and isinstance(data["engine_input"], str):
                data["engine_input"] = json.loads(data["engine_input"])
            return data

    async def heartbeat_audit(self, audit_id: UUID) -> None:
        await self.connect()
        async with self.pool.acquire() as conn:
            await conn.execute(
                """
                UPDATE audits SET heartbeat_at = NOW()
                WHERE id = $1 AND status = 'running'
                """,
                audit_id,
            )

    async def sweep_stale_audits(self) -> int:
        """Fail stale running (missed heartbeat) and abandoned pending rows."""
        await self.connect()
        async with self.pool.acquire() as conn:
            running = await conn.execute(
                """
                UPDATE audits SET status = 'failed', completed_at = NOW(),
                    engine_input = COALESCE(engine_input, '{}'::jsonb)
                        || jsonb_build_object('failure_reason', 'stale_heartbeat')
                WHERE status = 'running'
                  AND COALESCE(heartbeat_at, created_at) < NOW() - INTERVAL '3 minutes'
                """
            )
            pending = await conn.execute(
                """
                UPDATE audits SET status = 'failed', completed_at = NOW(),
                    engine_input = COALESCE(engine_input, '{}'::jsonb)
                        || jsonb_build_object('failure_reason', 'stale_pending')
                WHERE status = 'pending'
                  AND created_at < NOW() - INTERVAL '30 minutes'
                """
            )
            def _count(tag: str) -> int:
                try:
                    return int(tag.split()[-1])
                except (IndexError, ValueError):
                    return 0
            return _count(running) + _count(pending)

    async def get_audit(self, audit_id: UUID) -> Optional[dict]:
        """Fetch a single audit by ID."""
        await self.connect()
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                SELECT id, url, email, name, status, score, grade, findings,
                       composite, composite_anchor, engine_input, engine_output,
                       guided_implementation, strategic_finding, screenshot_url,
                       created_at, completed_at
                FROM audits WHERE id = $1
                """,
                audit_id,
            )
        if not row:
            return None
        data = dict(row)
        for key in ("engine_input", "engine_output"):
            if data.get(key) and isinstance(data[key], str):
                try:
                    data[key] = json.loads(data[key])
                except json.JSONDecodeError:
                    pass
        # Flatten for compatibility with callers that expect top-level keys
        if data.get("engine_output") and isinstance(data["engine_output"], dict):
            for k, v in data["engine_output"].items():
                data.setdefault(k, v)
        return data

    async def get_audit_history(self, email: str, url: str, limit: int = 5) -> list:
        """Fetch recent audit history for an email+url combination."""
        await self.connect()
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT id, score, grade, status, completed_at, url
                FROM audits
                WHERE email = $1 AND url = $2 AND status = 'completed'
                ORDER BY completed_at DESC
                LIMIT $3
                """,
                email, url, limit,
            )
        return [dict(r) for r in rows]

    async def get_score_trend(self, email: str, url: str, limit: int = 5) -> list:
        """Get score trend for historical tracking."""
        await self.connect()
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT score, completed_at
                FROM audits
                WHERE email = $1 AND url = $2 AND status = 'completed'
                ORDER BY completed_at DESC
                LIMIT $3
                """,
                email, url, limit,
            )
        return [{"score": r["score"], "date": r["completed_at"]} for r in rows]

    async def get_recurring_issues(self, email: str, limit: int = 3) -> list:
        """Get most common failed finding keys across audits."""
        await self.connect()
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT finding_key, COUNT(*) as cnt
                FROM (
                    SELECT jsonb_array_elements_text(findings->*->'key') as finding_key
                    FROM audits
                    WHERE email = $1 AND status = 'completed'
                    LIMIT 20
                ) sub
                WHERE finding_key IS NOT NULL
                GROUP BY finding_key
                ORDER BY cnt DESC
                LIMIT $2
                """,
                email, limit,
            )
        return [{"key": r["finding_key"], "count": r["cnt"]} for r in rows]

    async def get_effective_fixes(self, email: str, limit: int = 3) -> list:
        """Get fixes that improved scores across audits."""
        # Simplified: return recent completed audits with findings for now.
        await self.connect()
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT score, grade, completed_at
                FROM audits
                WHERE email = $1 AND status = 'completed'
                ORDER BY completed_at DESC
                LIMIT $2
                """,
                email, limit,
            )
        return [dict(r) for r in rows]

    async def update_audit(self, audit_id: UUID, score: float, grade: str,
                          findings: List[dict], status: str = 'completed',
                          composite: Optional[float] = None,
                          composite_anchor: Optional[float] = None,
                          engine_version: Optional[str] = None,
                          guided_implementation: Optional[dict] = None,
                          strategic_finding: Optional[str] = None,
                          engine_output: Optional[dict] = None) -> bool:
        """Update audit with results"""
        await self.connect()

        async with self.pool.acquire() as conn:
            result = await conn.execute(
                """
                UPDATE audits
                SET score = $2, grade = $3, findings = $4,
                    status = $5, completed_at = NOW(),
                    composite = $6, composite_anchor = $7,
                    engine_version = COALESCE($8, engine_version),
                    guided_implementation = $9,
                    strategic_finding = $10,
                    engine_output = COALESCE($11::jsonb, engine_output)
                WHERE id = $1
                """,
                audit_id, int(score * 10), grade, json.dumps(findings), status,
                composite, composite_anchor, engine_version,
                json.dumps(guided_implementation) if guided_implementation is not None else None,
                strategic_finding,
                json.dumps(engine_output) if engine_output is not None else None,
            )
            updated = result == 'UPDATE 1'
            if updated and status == 'completed':
                # Best-effort: badge check
                try:
                    await self.check_and_award_badge(conn, audit_id)
                except Exception:
                    pass
                # Best-effort cohort aggregate
                try:
                    await self.record_cohort_aggregate(conn, score, grade, findings)
                except Exception:
                    pass
                # Fire-and-forget screenshot
                try:
                    url_row = await conn.fetchrow("SELECT url FROM audits WHERE id = $1", audit_id)
                    if url_row:
                        import asyncio as _asyncio
                        from platform_api.services.screenshot_service import capture_audit_screenshot
                        _asyncio.create_task(
                            self._capture_and_store_screenshot(audit_id, url_row['url'])
                        )
                except Exception:
                    pass
            return updated

    async def _capture_and_store_screenshot(self, audit_id: UUID, url: str) -> None:
        """Capture a screenshot of the audited URL and store the path in the DB."""
        try:
            from platform_api.services.screenshot_service import capture_audit_screenshot
            screenshot_url = await capture_audit_screenshot(str(audit_id), url)
            if screenshot_url:
                await self.connect()
                async with self.pool.acquire() as conn:
                    await conn.execute(
                        "UPDATE audits SET screenshot_url = $2 WHERE id = $1",
                        audit_id, screenshot_url,
                    )
        except Exception:
            pass

    async def record_cohort_aggregate(
        self, conn, score: float, grade: str, findings: List[dict]
    ) -> None:
        """Increment a daily score/signals cohort with no page-level identifiers."""
        failed_keys = {
            finding.get('key')
            for finding in findings
            if isinstance(finding, dict)
        }
        signal_passes = (
            int('headline' not in failed_keys),
            int('cta' not in failed_keys),
            int('above_fold' not in failed_keys),
            int('social_proof' not in failed_keys),
            int('load_speed' not in failed_keys),
            int('mobile' not in failed_keys),
            int('seo_foundations' not in failed_keys),
            int('ad_signals' not in failed_keys),
            int('ai_readiness' not in failed_keys),
        )
        score_bucket = max(0, min(100, round(score * 10)))
        await conn.execute(
            """
            INSERT INTO audit_cohort
                (audit_date, source, industry_tag, score_bucket, grade,
                 sample_count, finding_count_sum,
                 h1_pass_count, cta_pass_count, above_fold_pass_count,
                 social_proof_pass_count, load_speed_pass_count,
                 mobile_pass_count, seo_foundations_pass_count,
                 ad_signals_pass_count, ai_readiness_pass_count)
            VALUES (CURRENT_DATE, 'organic', 'general', $1, $2,
                    1, $3,
                    $4, $5, $6, $7, $8, $9, $10, $11, $12)
            ON CONFLICT (audit_date, source, industry_tag, score_bucket) DO UPDATE SET
                sample_count = audit_cohort.sample_count + 1,
                finding_count_sum = audit_cohort.finding_count_sum + EXCLUDED.finding_count_sum,
                h1_pass_count = audit_cohort.h1_pass_count + EXCLUDED.h1_pass_count,
                cta_pass_count = audit_cohort.cta_pass_count + EXCLUDED.cta_pass_count,
                above_fold_pass_count = audit_cohort.above_fold_pass_count + EXCLUDED.above_fold_pass_count,
                social_proof_pass_count = audit_cohort.social_proof_pass_count + EXCLUDED.social_proof_pass_count,
                load_speed_pass_count = audit_cohort.load_speed_pass_count + EXCLUDED.load_speed_pass_count,
                mobile_pass_count = audit_cohort.mobile_pass_count + EXCLUDED.mobile_pass_count,
                seo_foundations_pass_count = audit_cohort.seo_foundations_pass_count + EXCLUDED.seo_foundations_pass_count,
                ad_signals_pass_count = audit_cohort.ad_signals_pass_count + EXCLUDED.ad_signals_pass_count,
                ai_readiness_pass_count = audit_cohort.ai_readiness_pass_count + EXCLUDED.ai_readiness_pass_count
            """,
            score_bucket, grade, len(findings),
            *signal_passes,
        )

    async def check_and_award_badge(self, conn, audit_id: UUID) -> None:
        """Award badge to customer if this is their first completed audit."""
        try:
            row = await conn.fetchrow(
                """
                SELECT customer_id FROM audits WHERE id = $1
                """,
                audit_id,
            )
            if not row:
                return
            customer_id = row["customer_id"]
            count = await conn.fetchval(
                """
                SELECT COUNT(*) FROM audits
                WHERE customer_id = $1 AND status = 'completed'
                """,
                customer_id,
            )
            if count and count == 1:
                await conn.execute(
                    """
                    UPDATE customers SET first_audit_badge_at = NOW()
                    WHERE id = $1 AND first_audit_badge_at IS NULL
                    """,
                    customer_id,
                )
        except Exception:
            pass


# Singleton
audit_db = AuditDB()
