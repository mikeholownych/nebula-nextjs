"""
Database service for audit persistence
"""

import os
import asyncpg
import secrets
from datetime import datetime, timezone
from typing import Optional, List
from uuid import UUID
import json


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
        """Create connection pool"""
        if not self.pool:
            self.pool = await asyncpg.create_pool(self.db_url, min_size=2, max_size=10)
    
    async def close(self):
        """Close connection pool"""
        if self.pool:
            await self.pool.close()
    
    async def get_or_create_customer(self, email: str, name: Optional[str] = None) -> UUID:
        """Get or create customer by email"""
        async with self.pool.acquire() as conn:
            # Try to get existing
            row = await conn.fetchrow(
                "SELECT id FROM customers WHERE email = $1",
                email
            )
            if row:
                return row['id']
            
            # Create new
            row = await conn.fetchrow(
                "INSERT INTO customers (email, name) VALUES ($1, $2) RETURNING id",
                email, name
            )
            return row['id']
    
    async def create_audit(self, url: str, email: str, name: Optional[str] = None,
                           source: Optional[str] = None,
                           partner_id: Optional[str] = None) -> UUID:
        """Create a new audit record"""
        await self.connect()
        
        customer_id = await self.get_or_create_customer(email, name)
        
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                INSERT INTO audits (customer_id, url, email, name, status, source, partner_id)
                VALUES ($1, $2, $3, $4, 'pending', $5, $6)
                RETURNING id
                """,
                customer_id, url, email, name, source, partner_id
            )
            return row['id']
    
    async def update_audit(self, audit_id: UUID, score: float, grade: str,
                          findings: List[dict], status: str = 'completed',
                          composite: Optional[float] = None,
                          composite_anchor: Optional[float] = None) -> bool:
        """Update audit with results"""
        await self.connect()

        async with self.pool.acquire() as conn:
            result = await conn.execute(
                """
                UPDATE audits
                SET score = $2, grade = $3, findings = $4,
                    status = $5, completed_at = NOW(),
                    composite = $6, composite_anchor = $7
                WHERE id = $1
                """,
                audit_id, int(score * 10), grade, json.dumps(findings), status,
                composite, composite_anchor,
            )
            updated = result == 'UPDATE 1'
            if updated and status == 'completed':
                # Best-effort: the audit UPDATE above already succeeded, so a
                # badge-check failure (transient DB hiccup, etc.) must never
                # surface as an audit-completion failure to the caller.
                try:
                    await self.check_and_award_badge(conn, audit_id)
                except Exception:
                    pass
                # Best-effort aggregate-only cohort record — feeds percentile
                # positioning without retaining page URLs, domains, or customer IDs.
                try:
                    await self.record_cohort_aggregate(conn, score, grade, findings)
                except Exception:
                    pass
                # Fire-and-forget screenshot for visual diffs — never blocks completion.
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
            VALUES (CURRENT_DATE, 'live', 'unknown', $1, $2,
                    1, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            ON CONFLICT (audit_date, source, industry_tag, score_bucket, grade)
            DO UPDATE SET
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
            score_bucket,
            grade,
            len(findings),
            *signal_passes,
        )

    async def check_and_award_badge(self, conn, audit_id: UUID) -> Optional[dict]:
        """A badge documents one real, specific event: this customer's score
        on this URL genuinely improved between their first audit and a later
        one — not a fixed pass bar, any real delta. Runs inside the same
        connection/transaction as the completing update_audit call.
        Idempotent via badges' UNIQUE(customer_id, url) — a badge, once
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
    
    async def mark_email_sent(self, audit_id: UUID) -> bool:
        """Mark audit email as sent"""
        await self.connect()

        async with self.pool.acquire() as conn:
            result = await conn.execute(
                "UPDATE audits SET email_sent_at = NOW() WHERE id = $1",
                audit_id
            )
            return result == 'UPDATE 1'

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
                interval = "1 month"
            else:
                interval = "1 week"
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
        """Record a monitoring event (improved/regressed/no_change/new_fail/error)."""
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


    async def get_or_create_share_token(self, audit_id: UUID) -> Optional[str]:
        """Return the audit's share token, generating and persisting one on
        first request. share_token has a UNIQUE constraint in the schema;
        16 bytes of entropy makes a collision practically impossible, so no
        retry-on-conflict loop."""
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
        """Look up an audit by its share token — used to validate a share
        link before returning full results to a visitor who isn't the
        original requester and doesn't have the unlock cookie."""
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
        """Real before/after data for the embeddable badge endpoint. Scores
        are stored as int*10; converted back to a 0-10 float here so callers
        never touch the storage representation."""
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

    async def get_audit(self, audit_id: UUID) -> Optional[dict]:
        """Get audit by ID"""
        await self.connect()
        
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                SELECT id, customer_id, url, email, name, status, 
                       score, grade, composite, composite_anchor, findings,
                       created_at, completed_at,
                       email_sent_at, paid_at, paid_product
                FROM audits WHERE id = $1
                """,
                audit_id
            )
            if row:
                data = dict(row)
                # Parse findings JSON string to list
                if data.get('findings') and isinstance(data['findings'], str):
                    data['findings'] = json.loads(data['findings'])
                # Convert score back to float (stored as int * 10)
                if data.get('score') is not None:
                    data['score'] = data['score'] / 10.0
                # composite already numeric(3,1) — cast for JSON serialization
                if data.get('composite') is not None:
                    data['composite'] = float(data['composite'])
                if data.get('composite_anchor') is not None:
                    data['composite_anchor'] = float(data['composite_anchor'])
                # Convert UUIDs to strings for JSON serialization
                data['audit_id'] = str(data.pop('id'))
                if data.get('customer_id'):
                    data['customer_id'] = str(data['customer_id'])
                return data
            return None
    
    async def claim_audit(self, audit_id: UUID, email: str) -> Optional[dict]:
        """Link an anonymous audit to a real email address.

        Returns a dict with claimed=True if the update succeeded, or
        claimed=False + current_email if the audit is already owned by a
        *different* email so the caller can return a 400.  Returns None if
        the audit does not exist.
        """
        await self.connect()

        ANONYMOUS_PLACEHOLDERS = {
            None,
            "",
            "anonymous",
            "anonymous@example.com",
            "placeholder@example.com",
        }

        def _is_anonymous(email_value) -> bool:
            """An audit is unclaimed when its email is a placeholder or the
            frontend's per-audit anonymous pattern
            (anonymous+<uuid>@invalid.nebulacomponents.com)."""
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

            # Normalise for comparison
            current_norm = (current_email or "").strip().lower()
            new_norm = email.strip().lower()

            if _is_anonymous(current_email):
                # Unclaimed — update the audit email
                await conn.execute(
                    "UPDATE audits SET email = $2 WHERE id = $1",
                    audit_id, new_norm,
                )
                # Also ensure a customers record exists for this email
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
                # Already claimed by the same email — idempotent success
                return {"claimed": True, "audit_id": str(audit_id), "email": current_norm}

            # Claimed by a different email — caller should return 400
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

    async def sync_recommendations(self, email: str) -> List[dict]:
        """Derive the recommendation kanban from completed audits.

        - Upserts findings from the latest completed audit per URL into
          recommendations (status preserved on re-sync).
        - Auto-verifies: a recommendation whose URL has a newer completed
          audit that no longer flags that finding key moves to 'done' with
          verified_at set (the 'next audit checks it' loop).
        Returns rows ordered: to_fix, doing, done; impact desc within group.
        """
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
            for a in latest_per_url:
                findings = a["findings"]
                if isinstance(findings, str):
                    findings = json.loads(findings)
                for f in findings:
                    await conn.execute(
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
                        email, a["id"], a["url"], f.get("key"), f.get("label"),
                        f.get("impact", 0), f.get("effort", 0), f.get("quadrant"),
                    )

            # latest flag-set per URL for auto-verification
            latest_keys = {}
            for a in latest_per_url:
                findings = a["findings"]
                if isinstance(findings, str):
                    findings = json.loads(findings)
                latest_keys[a["url"]] = {f.get("key") for f in findings}

            recs = await conn.fetch(
                "SELECT id, url, finding_key, status FROM recommendations WHERE email = $1",
                email,
            )
            for r in recs:
                keys = latest_keys.get(r["url"])
                if (
                    keys is not None
                    and r["finding_key"] not in keys
                    and r["status"] != "done"
                ):
                    await conn.execute(
                        """
                        UPDATE recommendations
                        SET status = 'done', verified_at = now(), updated_at = now()
                        WHERE id = $1
                        """,
                        r["id"],
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
                d["id"] = str(d["id"])
                d["audit_id"] = str(d["audit_id"])
                d["impact"] = float(d["impact"])
                d["effort"] = float(d["effort"])
                out.append(d)
            return out

    async def update_recommendation_status(self, rec_id: str, status: str) -> Optional[dict]:
        """Move a recommendation between kanban columns."""
        await self.connect()

        async with self.pool.acquire() as conn:
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
            d["id"] = str(d["id"])
            d["audit_id"] = str(d["audit_id"])
            d["impact"] = float(d["impact"])
            d["effort"] = float(d["effort"])
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
                json.dumps(components) if components else None,
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
    
    async def get_aggregate_stats(self) -> dict:
        """Real counts for the homepage's aggregate-proof strip. No fabricated
        numbers — if volume is genuinely small, that's what gets shown."""
        await self.connect()

        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                SELECT
                    count(*) FILTER (WHERE status = 'completed') AS completed_audits,
                    avg(score) FILTER (WHERE status = 'completed' AND score IS NOT NULL) AS avg_score_raw
                FROM audits
                """
            )
            completed = row['completed_audits'] or 0
            avg_score = round(float(row['avg_score_raw']) / 10.0, 1) if row['avg_score_raw'] is not None else None
            return {"completed_audits": completed, "avg_score": avg_score}

    async def get_benchmarks(self) -> dict:
        """Per-component benchmark aggregates from real completed audits.
        Privacy-safe: no URLs, no emails — only component failure rates,
        average impact, and score distribution."""
        await self.connect()

        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT score, grade, findings
                FROM audits
                WHERE status = 'completed'
                  AND score IS NOT NULL
                """
            )

        if not rows:
            return {"audit_count": 0, "components": [], "distribution": []}

        import json as _json

        # Score distribution buckets (0-10 scale, stored as 0-100)
        buckets = {"0-3": 0, "4-5": 0, "6-7": 0, "8-10": 0}
        component_counts: dict[str, dict] = {}
        scores = []
        total_findings = 0

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
            total_findings += len(findings)
            for f in findings:
                if not isinstance(f, dict):
                    continue
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

        # The citable headline stat: average number of failed conversion
        # signals per completed audit. ("The average landing page leaks N of 9
        # conversion signals.") Also surface the single most common leak.
        avg_failures_per_page = (
            round(total_findings / len(scores), 1) if scores else 0.0
        )
        top_leak = components[0] if components else None

        return {
            "audit_count": len(scores),
            "avg_score": round(sum(scores) / len(scores), 1) if scores else None,
            "highest": round(max(scores), 1) if scores else None,
            "lowest": round(min(scores), 1) if scores else None,
            "avg_failures_per_page": avg_failures_per_page,
            "top_leak": top_leak,
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "components": components[:12],
            "distribution": [{"bucket": k, "count": v} for k, v in buckets.items()],
        }

    async def get_recent_finding(self) -> dict | None:
        """Return the most interesting finding from the most recent completed audit.
        Used for the homepage's 'recent finding' strip. Returns None when no
        eligible audits exist. Never exposes the URL — only the finding label,
        issue summary, impact score, and time-ago."""
        await self.connect()

        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                SELECT score, grade, findings, completed_at
                FROM audits
                WHERE status = 'completed'
                  AND findings IS NOT NULL
                  AND findings != '[]'
                ORDER BY completed_at DESC
                LIMIT 1
                """
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

            # Pick the highest-impact finding
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
            
            # Also update audit if provided
            if audit_id:
                await conn.execute(
                    "UPDATE audits SET paid_at = NOW(), paid_product = $2 WHERE id = $1",
                    audit_id, product
                )
            
            return row['id']

    # ── Widget partners (Play 4: agencies as distribution layer) ─────────────
    async def get_partner(self, partner_id: str) -> Optional[dict]:
        """Look up a widget partner by id. Returns None if not found."""
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
        """Register a widget partner. Returns False if the id already exists."""
        await self.connect()
        async with self.pool.acquire() as conn:
            try:
                await conn.execute(
                    """
                    INSERT INTO partners (id, name, email, plan, status, domains)
                    VALUES ($1, $2, $3, $4, $5, $6::jsonb)
                    """,
                    partner_id, name, email, plan, status, json.dumps(domains or []),
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
                partner_id, json.dumps(domains),
            )
            return True


# Singleton
audit_db = AuditDB()
