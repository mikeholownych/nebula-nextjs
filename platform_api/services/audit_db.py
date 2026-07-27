"""
Database service for audit persistence
"""

import os
import asyncpg
import secrets
from datetime import datetime
from typing import Optional, List
from uuid import UUID
import json


class AuditDB:
    """PostgreSQL database service for audit records"""
    
    def __init__(self):
        self.db_url = os.getenv(
            "DATABASE_URL",
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
    
    async def create_audit(self, url: str, email: str, name: Optional[str] = None) -> UUID:
        """Create a new audit record"""
        await self.connect()
        
        customer_id = await self.get_or_create_customer(email, name)
        
        async with self.pool.acquire() as conn:
            row = await conn.fetchrow(
                """
                INSERT INTO audits (customer_id, url, email, name, status)
                VALUES ($1, $2, $3, $4, 'pending')
                RETURNING id
                """,
                customer_id, url, email, name
            )
            return row['id']
    
    async def update_audit(self, audit_id: UUID, score: float, grade: str,
                          findings: List[dict], status: str = 'completed') -> bool:
        """Update audit with results"""
        await self.connect()

        async with self.pool.acquire() as conn:
            result = await conn.execute(
                """
                UPDATE audits
                SET score = $2, grade = $3, findings = $4,
                    status = $5, completed_at = NOW()
                WHERE id = $1
                """,
                audit_id, int(score * 10), grade, json.dumps(findings), status
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
            return updated

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
                       score, grade, findings, created_at, completed_at,
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
                       score, grade, findings, created_at, completed_at,
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
                # Convert UUIDs to strings for JSON serialization
                data['audit_id'] = str(data.pop('id'))
                if data.get('customer_id'):
                    data['customer_id'] = str(data['customer_id'])
                return data
            return None
    
    async def get_audits_by_email(self, email: str, limit: int = 10) -> List[dict]:
        """Get audits by email"""
        await self.connect()
        
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(
                """
                SELECT id, url, status, score, grade, created_at, completed_at
                FROM audits
                WHERE email = $1
                ORDER BY created_at DESC
                LIMIT $2
                """,
                email, limit
            )
            return [dict(r) for r in rows]
    
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


# Singleton
audit_db = AuditDB()
