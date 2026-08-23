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
from datetime import datetime, timezone, timedelta, date
from decimal import Decimal
from typing import Optional, List
from uuid import UUID
import json


def _json_serialize_default(o):
    if isinstance(o, (UUID, Decimal)):
        return str(o)
    if isinstance(o, (datetime, date)):
        return o.isoformat()
    if hasattr(o, "__dict__"):
        return o.__dict__
    return str(o)


def _safe_json_dumps(obj):
    if obj is None:
        return None
    return json.dumps(obj, default=_json_serialize_default)

# Internal/founder accounts excluded from all public-facing stats and counts.
# Audits from these addresses are fully functional but do not inflate metrics.
INTERNAL_EMAILS: frozenset[str] = frozenset({
    "mike.holownych@gmail.com",
    "mcp-agent@nebula.internal",
    "qa-workspace-20260803-001@example.invalid",
    "e2e-crawler-test@example.com",
    "test@example.com",
})

# Self-owned domains: audits of Nebula's own properties are founder QA, not
# customer evidence. Excluded from every public aggregate alongside
# INTERNAL_EMAILS (D5 - self-audits were inflating the Leak Index cohort).
SELF_DOMAINS: frozenset[str] = frozenset({
    "nebulacomponents.com",
    "internal.nebulacomponents.com",
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
        from platform_api.config import audit_db_dsn
        self.db_url = audit_db_dsn()
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
                _safe_json_dumps(engine_input),
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
        """Recover stale queue rows (DATA-6).

        Stale RUNNING rows are requeued once (status -> pending, heartbeat
        cleared, requeue_attempts incremented); a second offense is terminal.
        Abandoned PENDING rows age to failure as before. Accepted work no
        longer dies silently just because a worker hiccupped.
        """
        await self.connect()
        async with self.pool.acquire() as conn:
            requeued = await conn.execute(
                """
                UPDATE audits SET status = 'pending', heartbeat_at = NULL,
                    requeue_attempts = requeue_attempts + 1,
                    engine_input = COALESCE(engine_input, '{}'::jsonb)
                        || jsonb_build_object('failure_reason', 'requeued_stale_heartbeat')
                WHERE status = 'running'
                  AND requeue_attempts < 1
                  AND COALESCE(heartbeat_at, created_at) < NOW() - INTERVAL '3 minutes'
                """
            )
            failed_running = await conn.execute(
                """
                UPDATE audits SET status = 'failed', completed_at = NOW(),
                    engine_input = COALESCE(engine_input, '{}'::jsonb)
                        || jsonb_build_object('failure_reason', 'stale_heartbeat_retried')
                WHERE status = 'running'
                  AND requeue_attempts >= 1
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
            def _n(tag: str) -> int:
                try:
                    return int(tag.split()[-1])
                except (IndexError, ValueError):
                    return 0
            return _n(requeued) + _n(failed_running) + _n(pending)

    async def get_audit(self, audit_id: UUID) -> Optional[dict]:
        """Fetch a single audit by ID."""
        await self.connect()
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                SELECT id, customer_id, url, email, name, status,
                       score, grade, composite, composite_anchor, findings,
                       engine_input, engine_output, guided_implementation,
                       strategic_finding, screenshot_url, created_at, completed_at,
                       email_sent_at, paid_at, paid_product
                FROM audits WHERE id = $1
                """,
                audit_id,
            )
        if not row:
            return None
        data = dict(row)
        if data.get('findings') and isinstance(data['findings'], str):
            try:
                data['findings'] = json.loads(data['findings'])
            except json.JSONDecodeError:
                pass
        if data.get('score') is not None:
            data['score'] = data['score'] / 10.0
        if data.get('composite') is not None:
            data['composite'] = float(data['composite'])
        if data.get('composite_anchor') is not None:
            data['composite_anchor'] = float(data['composite_anchor'])
        data['audit_id'] = str(data.pop('id'))
        if data.get('customer_id'):
            data['customer_id'] = str(data['customer_id'])

        for key in ("engine_input", "engine_output"):
            if data.get(key) and isinstance(data[key], str):
                try:
                    data[key] = json.loads(data[key])
                except json.JSONDecodeError:
                    pass
        if data.get("engine_output") and isinstance(data["engine_output"], dict):
            for k, v in data["engine_output"].items():
                data.setdefault(k, v)
        return data

    async def claim_audit(self, audit_id: UUID, email: str) -> Optional[dict]:
        """Link an anonymous audit to a real email address."""
        await self.connect()

        ANONYMOUS_PLACEHOLDERS = {
            None,
            "",
            "anonymous",
            "anonymous@example.com",
            "placeholder@example.com",
        }

        def _is_anonymous(email_value) -> bool:
            n = (email_value or "").strip().lower()
            if n in {(p or "").lower() for p in ANONYMOUS_PLACEHOLDERS}:
                return True
            if n.endswith("@invalid.nebulacomponents.com"):
                return True
            if n.startswith("anonymous+") and "@" in n:
                return True
            return False

        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT id, email FROM audits WHERE id = $1",
                audit_id,
            )
            if row is None:
                return None

            current_email = row["email"]
            current_norm = (current_email or "").strip().lower()
            new_norm = email.strip().lower()

            if _is_anonymous(current_email):
                await conn.execute(
                    """
                    UPDATE audits
                    SET email = $2, unlocked_at = COALESCE(unlocked_at, NOW())
                    WHERE id = $1
                    """,
                    audit_id, new_norm,
                )
                await conn.execute(
                    """
                    INSERT INTO customers (email)
                    VALUES ($1)
                    ON CONFLICT (email) DO NOTHING
                    """,
                    new_norm,
                )
                return {"claimed": True, "audit_id": str(audit_id), "email": new_norm}

            if current_norm == new_norm:
                await conn.execute(
                    """
                    UPDATE audits
                    SET unlocked_at = COALESCE(unlocked_at, NOW())
                    WHERE id = $1 AND email IS NOT NULL
                      AND email NOT LIKE 'anonymous+%@invalid.nebulacomponents.com'
                    """,
                    audit_id,
                )
                return {"claimed": True, "audit_id": str(audit_id), "email": current_norm}

            return {"claimed": False, "audit_id": str(audit_id), "email": current_norm}

    async def get_audits_by_email(self, email: str, limit: int = 10) -> List[dict]:
        """Get audits by email"""
        await self.connect()
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT id, url, status, score, grade, composite, composite_anchor,
                       created_at, completed_at, screenshot_url
                FROM audits
                WHERE email = $1
                ORDER BY created_at DESC
                LIMIT $2
                """,
                email, limit
            )
            return [dict(r) for r in rows]

    async def get_latest_completed_audit(self, email: str, url: str) -> Optional[dict]:
        """Latest completed audit for (email, url), or None."""
        await self.connect()
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                SELECT id, url, status, score, grade, composite, composite_anchor,
                        created_at, completed_at
                FROM audits
                WHERE email = $1 AND url = $2 AND status = 'completed'
                ORDER BY created_at DESC
                LIMIT 1
                """,
                email, url
            )
        if not row:
            return None
        d = dict(row)
        d["id"] = str(d["id"])
        d["score"] = float(d["score"]) if d.get("score") is not None else None
        return d

    async def get_audit_history(self, email: str, url: str, limit: int = 10) -> List[dict]:
        """Get historical audits for a specific email and URL, ordered by date (newest first)."""
        await self.connect()
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT id, url, status, score, grade, composite, composite_anchor,
                        created_at, completed_at
                FROM audits
                WHERE email = $1 AND url = $2 AND status = 'completed'
                ORDER BY created_at DESC
                LIMIT $3
                """,
                email, url, limit
            )
        return [dict(r) for r in rows]

    async def get_score_trend(self, email: str, url: str, limit: int = 10) -> List[dict]:
        """Get score trend over time for a specific email and URL."""
        await self.connect()
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT 
                    score::decimal / 10.0 as score,
                    created_at,
                    grade
                FROM audits
                WHERE email = $1 AND url = $2 AND status = 'completed'
                ORDER BY created_at ASC
                LIMIT $3
                """,
                email, url, limit
            )
            return [
                {
                    "score": float(r["score"]) if r["score"] is not None else None,
                    "date": r["created_at"].isoformat() if r["created_at"] else None,
                    "grade": r["grade"]
                }
                for r in rows
            ]

    async def get_recurring_issues(self, email: str, limit: int = 5) -> List[dict]:
        """Get recurring issues across a user's audit history."""
        await self.connect()
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT findings
                FROM audits
                WHERE email = $1 AND status = 'completed' AND findings IS NOT NULL
                ORDER BY created_at DESC
                LIMIT $2
                """,
                email, limit * 3
            )
            issue_counts = {}
            issue_details = {}
            for row in rows:
                findings = row["findings"]
                if isinstance(findings, str):
                    try:
                        findings = json.loads(findings)
                    except Exception:
                        findings = []
                if not isinstance(findings, list):
                    continue
                for finding in findings:
                    if isinstance(finding, dict):
                        key = finding.get("key")
                        label = finding.get("label", "Unknown Issue")
                        if key:
                            if key not in issue_counts:
                                issue_counts[key] = 0
                                issue_details[key] = {
                                    "label": label,
                                    "issue": finding.get("issue", ""),
                                    "fix": finding.get("fix", ""),
                                    "impact": finding.get("impact", 0)
                                }
                            issue_counts[key] += 1
            sorted_issues = sorted(issue_counts.items(), key=lambda x: x[1], reverse=True)
            result = []
            for key, count in sorted_issues[:limit]:
                detail = issue_details[key].copy()
                detail["key"] = key
                detail["frequency"] = count
                result.append(detail)
            return result

    async def get_effective_fixes(self, email: str, limit: int = 5) -> List[dict]:
        """Get fixes that have historically led to score improvements for a user."""
        await self.connect()
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT 
                    a1.findings as prior_findings,
                    a2.findings as later_findings,
                    a1.score as prior_score,
                    a2.score as later_score,
                    a2.created_at as later_date
                FROM audits a1
                JOIN audits a2 ON a1.email = a2.email AND a1.id < a2.id
                WHERE a1.email = $1 
                  AND a1.status = 'completed' 
                  AND a2.status = 'completed'
                  AND a1.findings IS NOT NULL
                  AND a2.findings IS NOT NULL
                ORDER BY a1.email, a1.created_at DESC, a2.created_at DESC
                LIMIT $2
                """,
                email, limit * 10
            )
            fix_effectiveness = {}
            for row in rows:
                prior_score = row["prior_score"] or 0
                later_score = row["later_score"] or 0
                score_improvement = (later_score or 0) - (prior_score or 0)
                if score_improvement > 0:
                    try:
                        prior_findings = json.loads(row["prior_findings"]) if isinstance(row["prior_findings"], str) else row["prior_findings"]
                        later_findings = json.loads(row["later_findings"]) if isinstance(row["later_findings"], str) else row["later_findings"]
                    except Exception:
                        continue
                    if not isinstance(prior_findings, list) or not isinstance(later_findings, list):
                        continue
                    prior_keys = {f.get("key") for f in prior_findings if isinstance(f, dict) and f.get("key")}
                    later_keys = {f.get("key") for f in later_findings if isinstance(f, dict) and f.get("key")}
                    fixed_keys = prior_keys - later_keys
                    for key in fixed_keys:
                        if key not in fix_effectiveness:
                            fix_effectiveness[key] = {
                                "total_improvement": 0,
                                "count": 0,
                                "avg_improvement": 0
                            }
                        fix_effectiveness[key]["total_improvement"] += score_improvement
                        fix_effectiveness[key]["count"] += 1
            result = []
            for key, data in fix_effectiveness.items():
                if data["count"] > 0:
                    data["avg_improvement"] = round(data["total_improvement"] / data["count"], 1)
                    data["label"] = key.replace("_", " ").title()
                    result.append({
                        "key": key,
                        "label": data["label"],
                        "avg_improvement": data["avg_improvement"],
                        "times_fixed": data["count"],
                        "total_improvement": data["total_improvement"]
                    })
            result.sort(key=lambda x: x["avg_improvement"], reverse=True)
            return result[:limit]

    async def count_completed_this_month(self, email: str) -> int:
        """Count completed audits for an email within current calendar month (UTC)."""
        await self.connect()
        email_clean = (email or "").strip().lower()
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                SELECT COUNT(*) as cnt
                FROM audits
                WHERE LOWER(email) = $1
                  AND status = 'completed'
                  AND created_at >= date_trunc('month', NOW() AT TIME ZONE 'UTC')
                """,
                email_clean,
            )
            return int(row['cnt']) if row and row['cnt'] is not None else 0

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
                audit_id, int(score * 10), grade, _safe_json_dumps(findings or []), status,
                composite, composite_anchor, engine_version,
                _safe_json_dumps(guided_implementation),
                strategic_finding,
                _safe_json_dumps(engine_output),
            )
            updated = result == 'UPDATE 1'
            if updated and status == 'completed':
                # DATA-5: side effects stay non-fatal but are no longer silent —
                # every failure is logged with the audit id so integrity gaps
                # between audits/badges/cohort aggregates are observable.
                import logging
                _log = logging.getLogger("nebula.audit_db")
                try:
                    await self.check_and_award_badge(conn, audit_id)
                except Exception as exc:
                    _log.error("badge award failed audit=%s: %s", audit_id, exc)
                try:
                    await self.record_cohort_aggregate(conn, score, grade, findings)
                except Exception as exc:
                    _log.error("cohort aggregate failed audit=%s: %s", audit_id, exc)
                # Task 13: backfill fix_implementations.score_after now that
                # this audit's final score exists. Non-fatal by design.
                try:
                    await self.backfill_fix_scores(audit_id)
                except Exception as exc:
                    _log.error("fix score backfill failed audit=%s: %s", audit_id, exc)
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

    async def check_and_award_badge(self, conn, audit_id: UUID) -> Optional[dict]:
        """A badge documents one real, specific event: this customer's score
        on this URL genuinely improved between their first audit and a later
        one - not a fixed pass bar, any real delta. Runs inside the same
        connection/transaction as the completing update_audit call.
        Idempotent via badges' UNIQUE(customer_id, url) - a badge, once
        earned, is never reissued or overwritten even if the page improves
        further or regresses later."""
        row = await conn.fetchrow(
            "SELECT customer_id, url FROM audits WHERE id = $1", audit_id
        )
        if row is None or row['customer_id'] is None:
            return None

        history = await conn.fetch(
            """
            SELECT id, score, created_at FROM audits
            WHERE customer_id = $1 AND url = $2 AND status = 'completed'
            ORDER BY created_at ASC
            """,
            row['customer_id'], row['url']
        )
        if len(history) < 2:
            return None

        earliest, latest = history[0], history[-1]
        if latest['score'] <= earliest['score']:
            return None

        badge = await conn.fetchrow(
            """
            INSERT INTO badges
                (customer_id, url, before_audit_id, after_audit_id,
                 before_score, after_score, earned_year)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (customer_id, url) DO NOTHING
            RETURNING id, serial_number
            """,
            row['customer_id'], row['url'], earliest['id'], latest['id'],
            earliest['score'], latest['score'], latest['created_at'].year
        )
        return dict(badge) if badge else None

    async def mark_email_sent(self, audit_id: UUID, message_id: str | None = None) -> bool:
        """Mark audit email as sent, recording the provider message id when
        available so delivery/open webhooks can be reconciled per message."""
        await self.connect()
        async with self.pool.acquire() as conn:
            result = await conn.execute(
                """
                UPDATE audits
                SET email_sent_at = NOW(),
                    email_message_id = COALESCE($2, email_message_id)
                WHERE id = $1
                """,
                audit_id,
                message_id,
            )
            return result == 'UPDATE 1'

    async def track_email_open(self, audit_id: UUID) -> bool:
        """Record an open event for an emailed audit report.

        Idempotent-ish per minute window: repeated pixel fetches from the same
        mail-client prefetch within a short window collapse into one event."""
        await self.connect()
        async with self.pool.acquire() as conn:
            recent = await conn.fetchval(
                """
                SELECT 1 FROM email_events
                WHERE audit_id = $1 AND event_type = 'open'
                  AND created_at >= LOCALTIMESTAMP - INTERVAL '60 seconds'
                LIMIT 1
                """,
                audit_id,
            )
            if recent:
                return False
            await conn.execute(
                "INSERT INTO email_events (audit_id, event_type) VALUES ($1, 'open')",
                audit_id,
            )
            await conn.execute(
                "UPDATE audits SET email_opens = COALESCE(email_opens, 0) + 1 WHERE id = $1",
                audit_id,
            )
            return True

    async def get_fix_effectiveness(
        self, limit: int = 10, finding_key: str | None = None
    ) -> list[dict]:
        """Aggregate fix outcomes per finding key.

        Both /audit/fix-library and /audit/fix-effectiveness call this. It was
        referenced but never implemented - the sweep probe caught the 503."""
        await self.connect()
        async with self.pool.acquire() as conn:
            if finding_key:
                rows = await conn.fetch(
                    """
                    SELECT finding_key,
                           COUNT(*) AS total_attempts,
                           COUNT(*) FILTER (
                               WHERE implemented AND score_after IS NOT NULL
                           ) AS successful_implementations,
                           COALESCE(ROUND(AVG(score_after - score_before) FILTER (
                               WHERE implemented AND score_after IS NOT NULL
                               AND score_before IS NOT NULL
                           ), 1), 0.0) AS avg_score_improvement,
                           COUNT(*) FILTER (
                               WHERE implemented AND score_after > score_before
                           ) AS positive_outcomes,
                           ROUND(COUNT(*) FILTER (WHERE implemented) * 100.0
                                 / GREATEST(COUNT(*), 1), 1) AS success_rate_percentage
                    FROM fix_implementations
                    WHERE finding_key = $1
                    GROUP BY finding_key
                    LIMIT 1
                    """,
                    finding_key,
                )
            else:
                rows = await conn.fetch(
                    """
                    SELECT finding_key,
                           COUNT(*) AS total_attempts,
                           COUNT(*) FILTER (
                               WHERE implemented AND score_after IS NOT NULL
                           ) AS successful_implementations,
                           COALESCE(ROUND(AVG(score_after - score_before) FILTER (
                               WHERE implemented AND score_after IS NOT NULL
                               AND score_before IS NOT NULL
                           ), 1), 0.0) AS avg_score_improvement,
                           COUNT(*) FILTER (
                               WHERE implemented AND score_after > score_before
                           ) AS positive_outcomes,
                           ROUND(COUNT(*) FILTER (WHERE implemented) * 100.0
                                 / GREATEST(COUNT(*), 1), 1) AS success_rate_percentage
                    FROM fix_implementations
                    GROUP BY finding_key
                    ORDER BY total_attempts DESC
                    LIMIT $1
                    """,
                    limit,
                )
            return [dict(r) for r in rows]

    async def get_user_fix_history(
        self, email: str, limit: int = 10
    ) -> list[dict]:
        """Fix implementation attempts recorded against one email address.

        Referenced by /audit/fix-history but never implemented (same defect
        batch as get_fix_effectiveness)."""
        await self.connect()
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT f.finding_key, f.implemented, f.score_before, f.score_after,
                       f.implemented_at, f.created_at, a.url AS audit_url
                FROM fix_implementations f
                LEFT JOIN audits a ON a.id = f.audit_id
                WHERE lower(f.email) = $1
                ORDER BY f.created_at DESC
                LIMIT $2
                """,
                email.strip().lower(),
                limit,
            )
            return [dict(r) for r in rows]

    async def get_or_create_share_token(self, audit_id: UUID) -> Optional[str]:
        """Return the audit's share token, generating and persisting one on
        first request. share_token has a UNIQUE constraint in the schema;
        16 bytes of entropy makes a collision practically impossible."""
        await self.connect()
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT share_token FROM audits WHERE id = $1",
                audit_id
            )
            if row is None:
                return None
            if row['share_token']:
                return row['share_token']

            token = secrets.token_urlsafe(16)
            await conn.execute(
                "UPDATE audits SET share_token = $2 WHERE id = $1",
                audit_id, token
            )
            return token

    async def get_audit_by_share_token(self, share_token: str) -> Optional[dict]:
        """Look up an audit by its share token."""
        await self.connect()
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                SELECT id, customer_id, url, email, name, status,
                       score, grade, composite, composite_anchor, findings,
                       created_at, completed_at,
                       email_sent_at, paid_at, paid_product
                FROM audits WHERE share_token = $1
                """,
                share_token
            )
            if row is None:
                return None
            data = dict(row)
            if data.get('findings') and isinstance(data['findings'], str):
                data['findings'] = json.loads(data['findings'])
            if data.get('score') is not None:
                data['score'] = data['score'] / 10.0
            if data.get('composite') is not None:
                data['composite'] = float(data['composite'])
            if data.get('composite_anchor') is not None:
                data['composite_anchor'] = float(data['composite_anchor'])
            data['audit_id'] = str(data.pop('id'))
            if data.get('customer_id'):
                data['customer_id'] = str(data['customer_id'])
            return data

    async def get_badge(self, badge_id: UUID) -> Optional[dict]:
        """Real before/after data for the embeddable badge endpoint."""
        await self.connect()
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                SELECT id, url, serial_number, before_score, after_score, earned_year
                FROM badges WHERE id = $1
                """,
                badge_id
            )
            if row is None:
                return None
            data = dict(row)
            data['badge_id'] = str(data.pop('id'))
            data['before_score'] = data['before_score'] / 10.0
            data['after_score'] = data['after_score'] / 10.0
            return data

    async def get_aggregate_stats(self) -> dict:
        """Real counts for the homepage's aggregate-proof strip."""
        await self.connect()
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                SELECT
                    count(*) FILTER (WHERE status = 'completed') AS completed_audits,
                    avg(score) FILTER (WHERE status = 'completed' AND score IS NOT NULL) AS avg_score_raw
                FROM audits
                WHERE email != ALL($1::text[])
                  AND split_part(email, '@', 2) != ALL($2::text[])
                """,
                list(INTERNAL_EMAILS),
                list(SELF_DOMAINS),
            )
            completed = row['completed_audits'] or 0 if row else 0
            return {"completed_audits": completed, "avg_score": None}

    async def get_benchmarks(self) -> dict:
        """Per-component benchmark aggregates from real completed audits.
        Privacy-safe: no URLs, no emails - only component failure rates,
        average impact, and score distribution."""
        await self.connect()

        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT score, grade, findings
                FROM audits
                WHERE status = 'completed'
                  AND score IS NOT NULL
                  AND email != ALL($1::text[])
                  AND split_part(email, '@', 2) != ALL($2::text[])
                  AND created_at >= NOW() - INTERVAL '90 days'
                ORDER BY created_at DESC
                LIMIT 500
                """,
                list(INTERNAL_EMAILS),
                list(SELF_DOMAINS),
            )

        if not rows:
            return {"audit_count": 0, "components": [], "distribution": []}

        import json as _json

        buckets = {"0-3": 0, "4-5": 0, "6-7": 0, "8-10": 0}
        component_counts: dict[str, dict] = {}
        scores = []
        total_findings = 0
        deprecated_keys = {"above_fold", "ad_signals"}

        for row in rows:
            score = row["score"]
            if score is None:
                continue
            score_10 = score / 10.0
            scores.append(score_10)
            if score_10 < 4:
                buckets["0-3"] += 1
            elif score_10 < 6:
                buckets["4-5"] += 1
            elif score_10 < 8:
                buckets["6-7"] += 1
            else:
                buckets["8-10"] += 1

            findings = row["findings"]
            if isinstance(findings, str):
                try:
                    findings = _json.loads(findings)
                except Exception:
                    findings = []
            if not isinstance(findings, list):
                continue
            for f in findings:
                if not isinstance(f, dict) or f.get("key") in deprecated_keys:
                    continue
                total_findings += 1
                key = f.get("key") or f.get("label") or "unknown"
                key = str(key).replace("_", " ").title()
                label = f.get("label") or key
                impact = f.get("impact") or 0
                entry = component_counts.setdefault(
                    label, {"key": key, "label": label, "failures": 0, "impact_sum": 0.0}
                )
                entry["failures"] += 1
                entry["impact_sum"] += float(impact)

        components = []
        for entry in component_counts.values():
            components.append(
                {
                    "label": entry["label"],
                    "failures": entry["failures"],
                    "avg_impact": round(entry["impact_sum"] / entry["failures"], 1)
                    if entry["failures"]
                    else 0,
                    "share": round(entry["failures"] / max(len(scores), 1) * 100),
                }
            )
        components.sort(key=lambda c: c["failures"], reverse=True)

        avg_failures_per_page = (
            round(total_findings / len(scores), 1) if scores else 0.0
        )
        top_leak = components[0] if components else None

        return {
            "audit_count": len(scores),
            "avg_score": None,
            "highest": None,
            "lowest": None,
            "avg_failures_per_page": avg_failures_per_page,
            "top_leak": top_leak,
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "components": components[:12],
            "distribution": [],
        }

    async def get_recent_finding(self) -> dict | None:
        """Return the most interesting finding from the most recent completed audit."""
        await self.connect()
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                SELECT score, grade, findings, completed_at
                FROM audits
                WHERE status = 'completed'
                  AND findings IS NOT NULL
                  AND findings != '[]'
                  AND email != ALL($1::text[])
                ORDER BY completed_at DESC
                LIMIT 1
                """,
                list(INTERNAL_EMAILS),
            )
            if not row:
                return None

            findings_raw = row['findings']
            if isinstance(findings_raw, str):
                import json as _json
                try:
                    findings = _json.loads(findings_raw)
                except Exception:
                    return None
            else:
                findings = findings_raw

            if not findings:
                return None

            top = max(findings, key=lambda f: f.get('impact', 0))
            completed_at = row['completed_at']
            if completed_at:
                from datetime import timezone as _tz
                if completed_at.tzinfo is None:
                    completed_at = completed_at.replace(tzinfo=_tz.utc)
                from datetime import datetime as _dt
                diff = _dt.now(_tz.utc) - completed_at
                hours = int(diff.total_seconds() / 3600)
                if hours < 1:
                    time_ago = 'just now'
                elif hours == 1:
                    time_ago = '1 hour ago'
                elif hours < 48:
                    time_ago = f'{hours} hours ago'
                else:
                    time_ago = f'{hours // 24} days ago'
            else:
                time_ago = 'recently'

            return {
                'label': top.get('label', 'Finding'),
                'issue': top.get('issue', ''),
                'impact': top.get('impact', 0),
                'quadrant': top.get('quadrant', ''),
                'overall_score': round(float(row['score']) / 10.0, 1) if row['score'] else None,
                'grade': row['grade'],
                'completed_at': time_ago,
            }

    # ── Monitoring ────────────────────────────────────────────────────

    async def list_monitors(self, email: str) -> List[dict]:
        """List monitors for a workspace email, newest first."""
        await self.connect()
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT id, email, url, cadence, active, next_run_at,
                       last_run_at, last_score, created_at, updated_at
                FROM monitors
                WHERE email = $1
                ORDER BY created_at DESC
                """,
                email,
            )
            out = []
            for r in rows:
                d = dict(r)
                d["id"] = str(d["id"])
                d["last_score"] = float(d["last_score"]) if d.get("last_score") is not None else None
                d["next_run_at"] = d["next_run_at"].isoformat() if d.get("next_run_at") else None
                d["last_run_at"] = d["last_run_at"].isoformat() if d.get("last_run_at") else None
                d["created_at"] = d["created_at"].isoformat() if d.get("created_at") else None
                d["updated_at"] = d["updated_at"].isoformat() if d.get("updated_at") else None
                out.append(d)
            return out

    async def count_monitors(self, email: str) -> int:
        """Active monitor count for plan cap enforcement."""
        await self.connect()
        norm = (email or "").strip().lower()
        async with self.pool.acquire() as conn:
            n = await conn.fetchval(
                "SELECT count(*) FROM monitors WHERE email=$1 AND active", norm)
            return int(n)

    async def list_audits_by_domain(self, domain: str) -> list[dict]:
        """Audits whose URL host belongs to the registered domain.

        Prefilter in SQL with ILIKE on the distinctive label, exact-match in Python.
        """
        await self.connect()
        label = domain.split(".")[0]
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                "SELECT id, url, email, status, score, grade, created_at "
                "FROM audits WHERE url ILIKE $1 ORDER BY created_at DESC LIMIT 500",
                f"%{label}%")
            from platform_api.services.domains import registered_domain
            return [dict(r) for r in rows
                    if registered_domain(r["url"]) == domain]

    async def create_monitor(self, email: str, url: str, cadence: str = "weekly") -> Optional[dict]:
        """Create a monitor. Idempotent per (email, url): re-activates and resets cadence."""
        await self.connect()
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                INSERT INTO monitors (email, url, cadence, active, next_run_at)
                VALUES ($1, $2, $3, true, now())
                ON CONFLICT (email, url) DO UPDATE
                SET cadence = EXCLUDED.cadence,
                    active = true,
                    next_run_at = now(),
                    updated_at = now()
                RETURNING id, email, url, cadence, active, next_run_at,
                          last_run_at, last_score, created_at, updated_at
                """,
                email, url, cadence,
            )
            if not row:
                return None
            d = dict(row)
            d["id"] = str(d["id"])
            d["last_score"] = float(d["last_score"]) if d.get("last_score") is not None else None
            d["next_run_at"] = d["next_run_at"].isoformat() if d.get("next_run_at") else None
            d["last_run_at"] = d["last_run_at"].isoformat() if d.get("last_run_at") else None
            d["created_at"] = d["created_at"].isoformat() if d.get("created_at") else None
            d["updated_at"] = d["updated_at"].isoformat() if d.get("updated_at") else None
            return d

    async def update_monitor(self, monitor_id: str, cadence: Optional[str] = None,
                             active: Optional[bool] = None) -> Optional[dict]:
        """Update a monitor's cadence or active flag."""
        await self.connect()
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                UPDATE monitors
                SET cadence = COALESCE($2, cadence),
                    active = COALESCE($3, active),
                    updated_at = now()
                WHERE id = $1
                RETURNING id, email, url, cadence, active, next_run_at,
                          last_run_at, last_score, created_at, updated_at
                """,
                monitor_id, cadence, active,
            )
            if not row:
                return None
            d = dict(row)
            d["id"] = str(d["id"])
            d["last_score"] = float(d["last_score"]) if d.get("last_score") is not None else None
            d["next_run_at"] = d["next_run_at"].isoformat() if d.get("next_run_at") else None
            d["last_run_at"] = d["last_run_at"].isoformat() if d.get("last_run_at") else None
            d["created_at"] = d["created_at"].isoformat() if d.get("created_at") else None
            d["updated_at"] = d["updated_at"].isoformat() if d.get("updated_at") else None
            return d

    async def delete_monitor(self, monitor_id: str) -> bool:
        """Delete a monitor (and its events via cascade)."""
        await self.connect()
        async with self.pool.acquire() as conn:
            result = await conn.execute(
                "DELETE FROM monitors WHERE id = $1",
                monitor_id,
            )
            return result == "DELETE 1"

    async def get_due_monitors(self) -> List[dict]:
        """Active monitors whose next run is due, oldest next_run first."""
        await self.connect()
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT id, email, url, cadence, active, next_run_at,
                       last_run_at, last_score, created_at, updated_at
                FROM monitors
                WHERE active = true AND next_run_at <= now()
                ORDER BY next_run_at ASC
                """,
            )
            out = []
            for r in rows:
                d = dict(r)
                d["id"] = str(d["id"])
                d["last_score"] = float(d["last_score"]) if d.get("last_score") is not None else None
                d["next_run_at"] = d["next_run_at"].isoformat() if d.get("next_run_at") else None
                d["last_run_at"] = d["last_run_at"].isoformat() if d.get("last_run_at") else None
                out.append(d)
            return out

    async def mark_monitor_ran(self, monitor_id: str, score: Optional[float]) -> None:
        """Record a completed run and schedule the next one per cadence."""
        await self.connect()
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT cadence FROM monitors WHERE id = $1",
                monitor_id,
            )
            if not row:
                return
            cadence = row["cadence"]
            if cadence == "monthly":
                interval = timedelta(days=30)
            else:
                interval = timedelta(weeks=1)
            await conn.execute(
                """
                UPDATE monitors
                SET last_run_at = now(),
                    last_score = $2,
                    next_run_at = now() + $3::interval,
                    updated_at = now()
                WHERE id = $1
                """,
                monitor_id, score, interval,
            )

    async def create_monitor_event(self, monitor_id: str, audit_id: Optional[UUID],
                                   status: str, prev_score: Optional[float],
                                   new_score: Optional[float], summary: str) -> dict:
        """Record a monitoring event."""
        await self.connect()
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                INSERT INTO monitor_events (monitor_id, audit_id, status, prev_score, new_score, summary)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING id, monitor_id, audit_id, status, prev_score, new_score, summary, created_at
                """,
                monitor_id, audit_id, status, prev_score, new_score, summary,
            )
            d = dict(row)
            d["id"] = str(d["id"])
            d["monitor_id"] = str(d["monitor_id"])
            d["audit_id"] = str(d["audit_id"]) if d.get("audit_id") else None
            d["prev_score"] = float(d["prev_score"]) if d.get("prev_score") is not None else None
            d["new_score"] = float(d["new_score"]) if d.get("new_score") is not None else None
            d["created_at"] = d["created_at"].isoformat() if d.get("created_at") else None
            return d

    async def list_monitor_events(self, monitor_id: str, limit: int = 20) -> List[dict]:
        """Recent events for one monitor, newest first."""
        await self.connect()
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT id, monitor_id, audit_id, status, prev_score, new_score, summary, created_at
                FROM monitor_events
                WHERE monitor_id = $1
                ORDER BY created_at DESC
                LIMIT $2
                """,
                monitor_id, limit,
            )
            out = []
            for r in rows:
                d = dict(r)
                d["id"] = str(d["id"])
                d["monitor_id"] = str(d["monitor_id"])
                d["audit_id"] = str(d["audit_id"]) if d.get("audit_id") else None
                d["prev_score"] = float(d["prev_score"]) if d.get("prev_score") is not None else None
                d["new_score"] = float(d["new_score"]) if d.get("new_score") is not None else None
                d["created_at"] = d["created_at"].isoformat() if d.get("created_at") else None
                out.append(d)
            return out

    # ── Kanban Recommendations ──────────────────────────────────────────

    async def sync_recommendations(self, email: str) -> List[dict]:
        """Derive the recommendation kanban from completed audits."""
        await self.connect()
        async with self.pool.acquire() as conn:
            latest_per_url = await conn.fetch(
                """
                SELECT DISTINCT ON (url) id, url, findings, completed_at
                FROM audits
                WHERE email = $1 AND status = 'completed' AND findings IS NOT NULL
                ORDER BY url, completed_at DESC
                """,
                email,
            )
            insert_records = []
            latest_keys = {}
            for a in latest_per_url:
                findings = a["findings"]
                if isinstance(findings, str):
                    try:
                        findings = json.loads(findings)
                    except Exception:
                        findings = []
                if not isinstance(findings, list):
                    continue

                keys = set()
                for f in findings:
                    if not isinstance(f, dict):
                        continue
                    k = f.get("key")
                    if not k:
                        continue
                    keys.add(k)
                    label = f.get("label") or k
                    try:
                        impact = float(f.get("impact") or 0)
                    except (ValueError, TypeError):
                        impact = 0.0
                    try:
                        effort = float(f.get("effort") or 0)
                    except (ValueError, TypeError):
                        effort = 0.0
                    quadrant = f.get("quadrant")
                    insert_records.append((
                        email, a["id"], a["url"], k, label, impact, effort, quadrant
                    ))
                latest_keys[a["url"]] = keys

            if insert_records:
                await conn.executemany(
                    """
                    INSERT INTO recommendations
                        (email, audit_id, url, finding_key, label, impact, effort, quadrant, status)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'to_fix')
                    ON CONFLICT (email, url, finding_key)
                    DO UPDATE SET
                        audit_id = EXCLUDED.audit_id,
                        label = EXCLUDED.label,
                        impact = EXCLUDED.impact,
                        effort = EXCLUDED.effort,
                        quadrant = EXCLUDED.quadrant,
                        updated_at = now()
                    """,
                    insert_records,
                )

            recs = await conn.fetch(
                "SELECT id, url, finding_key, status FROM recommendations WHERE email = $1",
                email,
            )
            done_ids = []
            for r in recs:
                keys = latest_keys.get(r["url"])
                if (
                    keys is not None
                    and r["finding_key"] not in keys
                    and r["status"] != "done"
                ):
                    done_ids.append(r["id"])

            if done_ids:
                await conn.execute(
                    """
                    UPDATE recommendations
                    SET status = 'done', verified_at = now(), updated_at = now()
                    WHERE id = ANY($1::uuid[])
                    """,
                    done_ids,
                )

            rows = await conn.fetch(
                """
                SELECT id, email, audit_id, url, finding_key, label, impact, effort,
                       quadrant, status, verified_at, created_at, updated_at
                FROM recommendations
                WHERE email = $1
                ORDER BY
                    CASE status WHEN 'to_fix' THEN 0 WHEN 'doing' THEN 1 ELSE 2 END,
                    impact DESC
                """,
                email,
            )
            out = []
            for r in rows:
                d = dict(r)
                d["id"] = str(d["id"]) if d.get("id") is not None else ""
                d["audit_id"] = str(d["audit_id"]) if d.get("audit_id") is not None else ""
                try:
                    d["impact"] = float(d["impact"]) if d.get("impact") is not None else 0.0
                except (ValueError, TypeError):
                    d["impact"] = 0.0
                try:
                    d["effort"] = float(d["effort"]) if d.get("effort") is not None else 0.0
                except (ValueError, TypeError):
                    d["effort"] = 0.0
                out.append(d)
            return out

    async def update_recommendation_status(self, rec_id: str, status: str, email: Optional[str] = None) -> Optional[dict]:
        """Move a recommendation between kanban columns."""
        await self.connect()
        async with self.pool.acquire() as conn:
            if email:
                row = await conn.fetchrow(
                    """
                    UPDATE recommendations
                    SET status = $1, updated_at = now()
                    WHERE id = $2 AND email = $3
                    RETURNING id, email, audit_id, url, finding_key, label, impact,
                              effort, quadrant, status, verified_at, created_at, updated_at
                    """,
                    status, rec_id, email,
                )
            else:
                row = await conn.fetchrow(
                    """
                    UPDATE recommendations
                    SET status = $1, updated_at = now()
                    WHERE id = $2
                    RETURNING id, email, audit_id, url, finding_key, label, impact,
                              effort, quadrant, status, verified_at, created_at, updated_at
                    """,
                    status, rec_id,
                )
            if not row:
                return None
            d = dict(row)
            d["id"] = str(d["id"]) if d.get("id") is not None else ""
            d["audit_id"] = str(d["audit_id"]) if d.get("audit_id") is not None else ""
            try:
                d["impact"] = float(d["impact"]) if d.get("impact") is not None else 0.0
            except (ValueError, TypeError):
                d["impact"] = 0.0
            try:
                d["effort"] = float(d["effort"]) if d.get("effort") is not None else 0.0
            except (ValueError, TypeError):
                d["effort"] = 0.0
            return d

    # ── Lab experiments (Component Lab History) ──────────────────────────

    async def list_lab_experiments(self, email: str, limit: int = 200) -> List[dict]:
        """List saved lab experiments for a workspace email, newest first."""
        await self.connect()
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT id, email, url, label, score, grade, components, ad_copy,
                       status, created_at, updated_at
                FROM lab_experiments
                WHERE email = $1
                ORDER BY created_at DESC
                LIMIT $2
                """,
                email, limit,
            )
            out = []
            for r in rows:
                d = dict(r)
                d["id"] = str(d["id"])
                d["score"] = float(d["score"]) if d.get("score") is not None else None
                if d.get("components") and isinstance(d["components"], str):
                    d["components"] = json.loads(d["components"])
                out.append(d)
            return out

    async def create_lab_experiment(self, email: str, url: str, label: str,
                                    score: float, grade: Optional[str],
                                    components: dict, ad_copy: Optional[str]) -> dict:
        """Save a lab run as an experiment."""
        await self.connect()
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                INSERT INTO lab_experiments (email, url, label, score, grade, components, ad_copy)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING id, email, url, label, score, grade, components, ad_copy,
                          status, created_at, updated_at
                """,
                email, url, label, score, grade,
                _safe_json_dumps(components),
                ad_copy,
            )
            d = dict(row)
            d["id"] = str(d["id"])
            d["score"] = float(d["score"]) if d.get("score") is not None else None
            if d.get("components") and isinstance(d["components"], str):
                d["components"] = json.loads(d["components"])
            return d

    async def update_lab_experiment_status(self, exp_id: str, status: str) -> Optional[dict]:
        """Mark an experiment as production (or back to saved)."""
        await self.connect()
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                UPDATE lab_experiments
                SET status = $1, updated_at = now()
                WHERE id = $2
                RETURNING id, email, url, label, score, grade, components, ad_copy,
                          status, created_at, updated_at
                """,
                status, exp_id,
            )
            if not row:
                return None
            d = dict(row)
            d["id"] = str(d["id"])
            d["score"] = float(d["score"]) if d.get("score") is not None else None
            return d

    async def delete_lab_experiment(self, exp_id: str) -> bool:
        """Delete a saved experiment."""
        await self.connect()
        async with self.pool.acquire() as conn:
            cur = await conn.execute("DELETE FROM lab_experiments WHERE id = $1", exp_id)
            return cur == "DELETE 1"

    # ── Purchases ────────────────────────────────────────────────────────────

    async def create_purchase(self, customer_id: UUID, audit_id: Optional[UUID],
                             product: str, amount_cents: int,
                             stripe_payment_intent_id: Optional[str] = None) -> UUID:
        """Create purchase record"""
        await self.connect()
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                INSERT INTO purchases (customer_id, audit_id, product,
                                       amount_cents, stripe_payment_intent_id)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id
                """,
                customer_id, audit_id, product, amount_cents, stripe_payment_intent_id
            )
            if audit_id:
                await conn.execute(
                    "UPDATE audits SET paid_at = NOW(), paid_product = $2 WHERE id = $1",
                    audit_id, product
                )
            return row['id']

    # ── Widget partners ──────────────────────────────────────────────────────

    async def get_partner(self, partner_id: str) -> Optional[dict]:
        """Look up a widget partner by id."""
        await self.connect()
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT id, name, email, plan, status, domains FROM partners WHERE id = $1",
                partner_id,
            )
            if not row:
                return None
            domains = row["domains"]
            if isinstance(domains, str):
                try:
                    domains = json.loads(domains)
                except Exception:
                    domains = []
            return {
                "id": row["id"],
                "name": row["name"],
                "email": row["email"],
                "plan": row["plan"],
                "status": row["status"],
                "domains": domains or [],
            }

    async def create_partner(self, partner_id: str, name: str,
                             domains: List[str], email: Optional[str] = None,
                             plan: str = "agency",
                             status: str = "active") -> bool:
        """Register a widget partner."""
        await self.connect()
        async with self.pool.acquire() as conn:
            try:
                await conn.execute(
                    """
                    INSERT INTO partners (id, name, email, plan, status, domains)
                    VALUES ($1, $2, $3, $4, $5, $6::jsonb)
                    """,
                    partner_id, name, email, plan, status, _safe_json_dumps(domains or []),
                )
                return True
            except Exception:
                return False

    async def add_partner_domain(self, partner_id: str, domain: str) -> bool:
        """Add a domain to a partner's CORS allowlist."""
        await self.connect()
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                "SELECT domains FROM partners WHERE id = $1", partner_id
            )
            if not row:
                return False
            domains = row["domains"]
            if isinstance(domains, str):
                try:
                    domains = json.loads(domains)
                except Exception:
                    domains = []
            if domain in domains:
                return True
            domains.append(domain)
            await conn.execute(
                "UPDATE partners SET domains = $2::jsonb, updated_at = NOW() WHERE id = $1",
                partner_id, _safe_json_dumps(domains),
            )
            return True

    async def mark_finding_implemented(self, audit_id, email: str,
                                       finding_key: str) -> dict:
        """Insert or update an open fix_implementations row, capturing the
        audit's current score as score_before (never overwritten once set)."""
        await self.connect()
        norm = email.strip().lower()
        async with self.pool.acquire() as conn:
            score = await conn.fetchval(
                "SELECT score FROM audits WHERE id=$1", audit_id)
            if score is None:
                raise ValueError("audit not found")
            row = await conn.fetchrow(
                """
                INSERT INTO fix_implementations
                    (audit_id, email, finding_key, implemented, score_before, implemented_at)
                VALUES ($1,$2,$3,true,$4,now())
                ON CONFLICT (audit_id, finding_key)
                DO UPDATE SET implemented=true, implemented_at=now(),
                              score_before=COALESCE(fix_implementations.score_before, EXCLUDED.score_before),
                              updated_at=now()
                RETURNING *
                """, audit_id, norm, finding_key, score)
            return dict(row)

    async def backfill_fix_scores(self, audit_id) -> int:
        """Set score_after on un-scored rows for findings this completed audit
        covers. Returns number of rows updated; 0 when audit not completed."""
        await self.connect()
        async with self.pool.acquire() as conn:
            score = await conn.fetchval(
                "SELECT score FROM audits WHERE id=$1 AND status='completed'", audit_id)
            if score is None:
                return 0
            n = await conn.execute(
                """UPDATE fix_implementations SET score_after=$2, updated_at=now()
                   WHERE audit_id=$1 AND score_after IS NULL""", audit_id, score)
            return int(n.split()[-1])


# Singleton
audit_db = AuditDB()
