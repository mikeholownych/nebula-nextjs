"""
Analytics service for GA4 event tracking
"""

import os
import httpx
from typing import Optional
from datetime import datetime


class AnalyticsService:
    """GA4 Measurement Protocol tracking"""
    
    def __init__(self):
        self.measurement_id = os.getenv("GA4_MEASUREMENT_ID", "G-KJ9S3450LH")
        self.api_secret = os.getenv("GA4_API_SECRET", "")
        self.endpoint = f"https://www.google-analytics.com/mp/collect"
    
    async def track_event(self, client_id: str, event_name: str, 
                         params: Optional[dict] = None) -> bool:
        """Track GA4 event via Measurement Protocol"""
        if not self.api_secret:
            # No API secret - skip tracking (dev mode)
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
    
    async def track_audit_started(self, url: str, email: str) -> bool:
        """Track audit started event"""
        return await self.track_event(
            client_id=email,
            event_name="audit_started",
            params={"url": url[:100], "timestamp": datetime.utcnow().isoformat()}
        )
    
    async def track_audit_completed(self, email: str, score: float, grade: str) -> bool:
        """Track audit completed event"""
        return await self.track_event(
            client_id=email,
            event_name="audit_completed",
            params={"score": int(score * 10), "grade": grade}
        )
    
    async def track_email_sent(self, email: str, audit_id: str) -> bool:
        """Track email sent event"""
        return await self.track_event(
            client_id=email,
            event_name="audit_email_sent",
            params={"audit_id": str(audit_id)[:50]}
        )
    
    async def track_purchase(self, email: str, product: str, amount_cents: int) -> bool:
        """Track purchase event"""
        return await self.track_event(
            client_id=email,
            event_name="purchase",
            params={
                "currency": "USD",
                "value": amount_cents / 100,
                "items": [{"item_name": product, "price": amount_cents / 100}]
            }
        )


# Singleton
analytics = AnalyticsService()
