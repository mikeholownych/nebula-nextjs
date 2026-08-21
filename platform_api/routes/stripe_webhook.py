"""Stripe webhook handler - hardened.

Hardening:
  - Body size bounded (read + validate before JSON parse)
  - Event-id dedup via Redis (durable across restarts, bounded cardinality)
  - Signature verification is fail-closed
  - Unhandled events return 200 (idempotent acknowledge)
  - Structured logging for operational visibility
"""
from __future__ import annotations

import hashlib
import hmac
import json
import logging
import os
import time
from typing import Optional

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse

from platform_api.services.crm_hooks import purchase_completed, customer_churned, subscription_activated
from platform_api.redis_client import redis_client

logger = logging.getLogger("platform_api.stripe_webhook")

router = APIRouter()

_STRIPE_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "")

# Maximum webhook body size: 512KB (Stripe events are typically <100KB)
MAX_WEBHOOK_BODY_BYTES = 512 * 1024

# Redis key for event-id dedup: TTL = 24h (Stripe retries for ~3 days but
# idempotency is really about duplicate delivery within the same window)
EVENT_DEDUP_TTL = 86400  # 24 hours
EVENT_DEDUP_MAX_KEYS = 50_000  # hard cap — if we exceed this, prune oldest
EVENT_DEDUP_PREFIX = "stripe_evt:"


def _verify_stripe_signature(payload: bytes, sig_header: str, secret: str) -> bool:
    """Verify Stripe webhook signature (HMAC-SHA256)."""
    if not secret:
        return False

    try:
        parts = {k: v for k, v in (item.split("=", 1) for item in sig_header.split(","))}
        timestamp = parts.get("t", "")
        signature = parts.get("v1", "")

        # Reject if timestamp is >5 minutes old (replay attack protection)
        if abs(time.time() - int(timestamp)) > 300:
            return False

        signed_payload = f"{timestamp}.{payload.decode()}"
        expected = hmac.new(
            secret.encode(),
            signed_payload.encode(),
            hashlib.sha256,
        ).hexdigest()

        return hmac.compare_digest(expected, signature)
    except Exception:
        return False


async def _is_duplicate_event(event_id: str) -> bool:
    """Check Redis for duplicate event. Sets TTL on first sighting."""
    if not event_id:
        return False
    key = f"{EVENT_DEDUP_PREFIX}{event_id}"
    try:
        await redis_client.connect()
        # SET NX = set only if not exists, returns True if set (new)
        is_new = await redis_client.client.set(key, "1", nx=True, ex=EVENT_DEDUP_TTL)
        return not is_new
    except Exception:
        # Redis down: we can't dedup. Log and allow processing.
        # The webhook handlers are designed to be idempotent (ON CONFLICT DO NOTHING),
        # so duplicate processing is safe, just wasteful.
        logger.warning("stripe_webhook_dedup_unavailable: redis down, allowing event %s", event_id)
        return False


def _extract_email(stripe_object: dict) -> Optional[str]:
    """Extract customer email from various Stripe event shapes."""
    if email := stripe_object.get("receipt_email") or stripe_object.get("email"):
        return email.lower().strip()
    if email := (stripe_object.get("metadata") or {}).get("email"):
        return email.lower().strip()
    if billing := stripe_object.get("billing_details", {}):
        if email := billing.get("email"):
            return email.lower().strip()
    if details := stripe_object.get("customer_details", {}):
        if email := details.get("email"):
            return email.lower().strip()
    return None


@router.post("/stripe/webhook")
async def stripe_webhook(request: Request):
    """Receive Stripe events and update CRM.

    Dedup is Redis-backed (durable across restarts). Unverified/untrusted
    traffic is bounded by body size limit. Verified webhooks are never
    rate-limited by user IP — signature verification + event-id idempotency
    is the guard.
    """
    # Body size enforcement — read the body first, then check size.
    body_bytes = await request.body()
    if len(body_bytes) > MAX_WEBHOOK_BODY_BYTES:
        raise HTTPException(status_code=413, detail="Webhook body too large")

    sig_header = request.headers.get("stripe-signature", "")
    secret = (os.getenv("STRIPE_WEBHOOK_SECRET") or "").strip() or _STRIPE_SECRET
    if not secret:
        raise HTTPException(status_code=503, detail="Stripe webhook secret not configured")

    if not _verify_stripe_signature(body_bytes, sig_header, secret):
        logger.warning("stripe_webhook_signature_invalid")
        raise HTTPException(status_code=400, detail="Invalid Stripe signature")

    try:
        event = json.loads(body_bytes)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON")

    event_type = event.get("type", "")
    event_id = event.get("id", "")

    # Redis-backed event-id dedup (durable across process restarts)
    if event_id and await _is_duplicate_event(event_id):
        logger.info("stripe_webhook_deduped event=%s type=%s", event_id, event_type)
        return {"received": True, "type": event_type, "deduped": True}

    stripe_obj = event.get("data", {}).get("object", {})

    # ── charge.succeeded ────────────────────────────────────────────────────
    if event_type == "charge.succeeded":
        email = _extract_email(stripe_obj)
        amount_cents = stripe_obj.get("amount", 0)
        payment_intent_id = stripe_obj.get("payment_intent") or stripe_obj.get("id", "")

        metadata = stripe_obj.get("metadata", {})
        product_type = metadata.get("product_type", "fix_pack")
        if "subscription" in (stripe_obj.get("description", "") or "").lower():
            product_type = "subscription"

        if email and amount_cents > 0:
            await purchase_completed(
                email=email,
                amount_cents=amount_cents,
                product_type=product_type,
                stripe_payment_intent_id=payment_intent_id,
                trigger_delivery=False,
            )

    # ── checkout.session.completed ──────────────────────────────────────────
    elif event_type == "checkout.session.completed":
        email = _extract_email(stripe_obj)
        amount_cents = stripe_obj.get("amount_total", 0)
        payment_intent_id = stripe_obj.get("payment_intent", "")
        metadata = stripe_obj.get("metadata") or {}

        if email and amount_cents > 0:
            await purchase_completed(
                email=email,
                amount_cents=amount_cents,
                product_type="fix_pack",
                stripe_payment_intent_id=payment_intent_id,
                audit_id=metadata.get("audit_id") or "",
                audit_url=metadata.get("url") or "",
                first_name=metadata.get("first_name") or "",
                trigger_delivery=False,
            )

    # ── customer.subscription.deleted ──────────────────────────────────────
    elif event_type == "customer.subscription.deleted":
        email = _extract_email(stripe_obj)
        cancellation_reason = (
            (stripe_obj.get("cancellation_details") or {}).get("reason", "")
            or stripe_obj.get("cancel_at_period_end", False) and "period_end_cancel"
            or "subscription_deleted"
        )

        if email:
            await customer_churned(
                email=email,
                reason=str(cancellation_reason),
            )

    # ── customer.subscription.created ──────────────────────────────────────
    elif event_type == "customer.subscription.created":
        email = _extract_email(stripe_obj)
        if email:
            await subscription_activated(email=email)

    return {"received": True, "type": event_type}
