"""Stripe Webhook Handler — Accept charge.succeeded, trigger delivery workflow.

Mount in platform_api/main.py:
  from yt_channel.stripe_webhook import router
  app.include_router(router, prefix="/webhook")
"""

from fastapi import APIRouter, Request, HTTPException
import hashlib
import hmac
import json
import asyncio
from datetime import datetime

router = APIRouter()

# Will be loaded from env
STRIPE_SIGNING_SECRET = None  # Set via os.getenv("STRIPE_SIGNING_SECRET")


@router.post("/stripe")
async def handle_stripe_webhook(request: Request):
    """Receive Stripe webhook for charge.succeeded
    
    Payload (example):
    {
      "type": "charge.succeeded",
      "data": {
        "object": {
          "id": "ch_1234",
          "amount": 9700,
          "metadata": {
            "audit_id": "abc123",
            "email": "founder@example.com",
            "name": "John",
          }
        }
      }
    }
    """
    
    # Get signature header
    sig_header = request.headers.get("stripe-signature")
    if not sig_header:
        raise HTTPException(status_code=400, detail="Missing Stripe signature")
    
    # Get raw body for verification
    body = await request.body()
    
    # Verify signature
    if not _verify_stripe_signature(body, sig_header):
        raise HTTPException(status_code=403, detail="Invalid Stripe signature")
    
    # Parse payload
    payload = json.loads(body)
    event_type = payload.get("type")
    
    if event_type == "charge.succeeded":
        # Trigger delivery workflow
        from yt_channel.delivery_workflow import DeliveryWorkflow
        
        workflow = DeliveryWorkflow()
        success = await workflow.handle_stripe_charge_success(payload)
        
        if not success:
            raise HTTPException(status_code=500, detail="Failed to process charge")
        
        return {"success": True, "message": "Charge processed, Email 1 sent"}
    
    # Ignore other event types
    return {"success": True, "message": f"Ignored event type: {event_type}"}


def _verify_stripe_signature(body: bytes, sig_header: str) -> bool:
    """Verify Stripe webhook signature.
    
    Stripe signs webhooks with HMAC-SHA256.
    Format: timestamp.signature (colon-separated)
    """
    if not STRIPE_SIGNING_SECRET:
        # For testing only
        return True
    
    try:
        # Extract timestamp and signature
        timestamp, sig = sig_header.split(",")[0].split("=")[1], sig_header.split(",")[1].split("=")[1]
        
        # Reconstruct signed content
        signed_content = f"{timestamp}.{body.decode()}"
        
        # Compute HMAC
        expected_sig = hmac.new(
            STRIPE_SIGNING_SECRET.encode(),
            signed_content.encode(),
            hashlib.sha256
        ).hexdigest()
        
        # Compare (constant-time)
        return hmac.compare_digest(expected_sig, sig)
    except Exception as e:
        print(f"[ERROR] Stripe signature verification failed: {e}")
        return False
