"""
Analytics service for GA4 event tracking and Internal Event Ledger persistence
"""

import os
import json
import httpx
import asyncpg
from typing import Optional
from datetime import datetime, timezone


class AnalyticsService:
    """GA4 Measurement Protocol tracking & Internal Event Ledger persistence"""

    def __init__(self):
        self.measurement_id = os.getenv("GA4_MEASUREMENT_ID", "")
        if not self.measurement_id:
            import logging
            logging.getLogger(__name__).warning("GA4_MEASUREMENT_ID not set; GA4 forwarding disabled")
        self.api_secret = os.getenv("GA4_API_SECRET", "")
        self.endpoint = "https://www.google-analytics.com/mp/collect"
        from platform_api.config import platform_db_dsn
        self.db_url = platform_db_dsn()
        self.pool: Optional[asyncpg.Pool] = None

    async def _get_pool(self) -> asyncpg.Pool:
        if self.pool is None:
            self.pool = await asyncpg.create_pool(self.db_url, min_size=1, max_size=5, statement_cache_size=0)
        return self.pool

    async def record_ledger_event(
        self,
        event_name: str,
        stage: str,
        source_system: str = "platform_api",
        anonymous_user_id: Optional[str] = None,
        session_id: Optional[str] = None,
        journey_id: Optional[str] = None,
        audit_attempt_id: Optional[str] = None,
        audit_id: Optional[str] = None,
        checkout_session_id: Optional[str] = None,
        transaction_id: Optional[str] = None,
        status: str = "success",
        failure_reason: Optional[str] = None,
        dedup_key: Optional[str] = None,
        properties: Optional[dict] = None,
    ) -> bool:
        """Persist canonical event to PostgreSQL analytics_event_ledger."""
        try:
            pool = await self._get_pool()
            async with pool.acquire() as conn:
                await conn.execute(
                    """
                    INSERT INTO analytics_event_ledger (
                        event_name, event_version, stage, source_system, occurred_at,
                        anonymous_user_id, session_id, journey_id,
                        audit_attempt_id, audit_id, checkout_session_id, transaction_id,
                        status, failure_reason, dedup_key, properties
                    ) VALUES (
                        $1, 1, $2, $3, $4,
                        $5, $6, $7,
                        $8, $9, $10, $11,
                        $12, $13, $14, $15
                    )
                    ON CONFLICT (dedup_key) DO NOTHING
                    """,
                    event_name,
                    stage,
                    source_system,
                    datetime.now(timezone.utc),
                    anonymous_user_id,
                    session_id,
                    journey_id,
                    audit_attempt_id,
                    audit_id,
                    checkout_session_id,
                    transaction_id,
                    status,
                    failure_reason,
                    dedup_key,
                    json.dumps(properties or {}),
                )
                return True
        except Exception as e:
            print(f"[AnalyticsService] Ledger persistence error for {event_name}: {e}")
            return False

    async def track_event(self, client_id: str, event_name: str, 
                         params: Optional[dict] = None) -> bool:
        """Track GA4 event via Measurement Protocol"""
        if not self.api_secret:
            return False
        
        payload = {
            "client_id": client_id,
            "events": [{
                "name": event_name,
                "params": params or {}
            }]
        }
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.endpoint}?measurement_id={self.measurement_id}&api_secret={self.api_secret}",
                    json=payload,
                    timeout=10.0
                )
                return response.status_code == 204
        except Exception:
            return False

    async def track_audit_started(self, url: str, email: str, audit_attempt_id: Optional[str] = None, audit_id: Optional[str] = None, journey_id: Optional[str] = None) -> bool:
        """Track audit started event"""
        await self.record_ledger_event(
            event_name="audit_started",
            stage="audit_execution",
            source_system="platform_api",
            journey_id=journey_id,
            audit_attempt_id=audit_attempt_id,
            audit_id=audit_id,
            properties={"url_domain": url.split("//")[-1].split("/")[0] if "//" in url else url, "journey_id": journey_id}
        )
        return await self.track_event(
            client_id=email,
            event_name="audit_started",
            params={"page_domain": url.split("//")[-1].split("/")[0] if "//" in url else url}
        )

    async def track_audit_completed(self, email: str, score: float, grade: str, audit_id: Optional[str] = None, audit_attempt_id: Optional[str] = None, journey_id: Optional[str] = None, findings_count: int = 0) -> bool:
        """Track audit completed event"""
        score_val = int(score * 10) if score <= 10 else int(score)
        score_bucket = "score_0_40" if score_val <= 40 else "score_41_70" if score_val <= 70 else "score_71_100"
        dedup = f"audit_{audit_id}_completed_v1" if audit_id else None

        await self.record_ledger_event(
            event_name="audit_completed",
            stage="audit_execution",
            source_system="server_worker",
            journey_id=journey_id,
            audit_attempt_id=audit_attempt_id,
            audit_id=audit_id,
            dedup_key=dedup,
            properties={
                "score": score_val,
                "score_bucket": score_bucket,
                "grade": grade,
                "findings_count": findings_count,
                "journey_id": journey_id,
            }
        )

        return await self.track_event(
            client_id=email,
            event_name="audit_completed",
            params={
                "score": score_val,
                "score_bucket": score_bucket,
                "grade": grade,
                "findings_count": findings_count,
            }
        )

    async def track_audit_failed(self, reason: str, audit_id: Optional[str] = None, audit_attempt_id: Optional[str] = None, journey_id: Optional[str] = None) -> bool:
        """Track audit failed event"""
        await self.record_ledger_event(
            event_name="audit_failed",
            stage="audit_execution",
            source_system="server_worker",
            journey_id=journey_id,
            audit_attempt_id=audit_attempt_id,
            audit_id=audit_id,
            status="failed",
            failure_reason=reason,
            properties={"reason_code": reason, "journey_id": journey_id}
        )
        return True

    async def track_purchase(self, email: str, product: str, amount_cents: int, transaction_id: Optional[str] = None, checkout_session_id: Optional[str] = None, audit_id: Optional[str] = None, journey_id: Optional[str] = None) -> bool:
        """Track purchase event with standard GA4 parameters"""
        dedup = f"purchase_{transaction_id or checkout_session_id}"

        await self.record_ledger_event(
            event_name="purchase_completed",
            stage="purchase",
            source_system="payment_webhook",
            journey_id=journey_id,
            audit_id=audit_id,
            checkout_session_id=checkout_session_id,
            transaction_id=transaction_id,
            dedup_key=dedup,
            properties={
                "offer_key": product,
                "amount_cents": amount_cents,
                "currency": "USD",
                "transaction_id": transaction_id,
                "journey_id": journey_id,
            }
        )

        return await self.track_event(
            client_id=email,
            event_name="purchase",
            params={
                "transaction_id": transaction_id or checkout_session_id or f"tx_{int(datetime.now().timestamp())}",
                "currency": "USD",
                "value": amount_cents / 100,
                "items": [{
                    "item_name": product,
                    "price": amount_cents / 100,
                    "quantity": 1
                }]
            }
        )


# Singleton
analytics = AnalyticsService()

