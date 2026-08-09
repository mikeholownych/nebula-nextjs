"""Stripe webhook handler — charge.succeeded and subscription events → CRM.

Mounted at: POST /api/stripe/webhook
Stripe signing secret: STRIPE_WEBHOOK_SECRET env var

Events handled:
  charge.succeeded              → purchase_completed() in CRM
  customer.subscription.deleted → customer_churned() in CRM
  checkout.session.completed    → purchase_completed() if not already handled by charge
"""
from __future__ import annotations

import hashlib
import hmac
import json
import os
import time
from typing import Optional

from fastapi import APIRouter, HTTPException, Request

from platform_api.services.crm_hooks import purchase_completed, customer_churned

router = APIRouter()

_STRIPE_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "")
_processed_event_ids: set[str] = set()  # in-process dedup; swap for Redis at scale


def _verify_stripe_signature(payload: bytes, sig_header: str, secret: str) -> bool:
    """Verify Stripe webhook signature (HMAC-SHA256)."""
    if not secret:
        return True  # Dev mode — no secret configured, allow all

    try:
        # Parse timestamp and signatures from header
        # Format: t=timestamp,v1=sig1,v1=sig2,...
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


def _extract_email(stripe_object: dict) -> Optional[str]:
    """Extract customer email from various Stripe event shapes."""
    # Direct email field
    if email := stripe_object.get("receipt_email") or stripe_object.get("email"):
        return email.lower().strip()
    # Metadata
    if email := (stripe_object.get("metadata") or {}).get("email"):
        return email.lower().strip()
    # Customer email in billing details
    if billing := stripe_object.get("billing_details", {}):
        if email := billing.get("email"):
            return email.lower().strip()
    # Checkout session customer_details
    if details := stripe_object.get("customer_details", {}):
        if email := details.get("email"):
            return email.lower().strip()
    return None


@router.post("/stripe/webhook")
async def stripe_webhook(request: Request):
    """Receive Stripe events and update CRM."""
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")

    if _STRIPE_SECRET and not _verify_stripe_signature(payload, sig_header, _STRIPE_SECRET):
        raise HTTPException(status_code=400, detail="Invalid Stripe signature")

    try:
        event = json.loads(payload)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON")

    event_type = event.get("type", "")
    event_id = event.get("id", "")  # Stripe event ID — use for dedup
    stripe_obj = event.get("data", {}).get("object", {})

    # Dedup: check if this Stripe event was already processed
    # Uses a simple in-process set for current volume; swap for Redis at scale
    if event_id and event_id in _processed_event_ids:
        return {"received": True, "type": event_type, "deduped": True}
    if event_id:
        _processed_event_ids.add(event_id)
        # Prune set if it gets large (memory safety)
        if len(_processed_event_ids) > 10_000:
            _processed_event_ids.clear()

    # ── charge.succeeded ────────────────────────────────────────────────────
    if event_type == "charge.succeeded":
        email = _extract_email(stripe_obj)
        amount_cents = stripe_obj.get("amount", 0)
        payment_intent_id = stripe_obj.get("payment_intent") or stripe_obj.get("id", "")

        # Determine product type from metadata or description
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
            )

    # ── checkout.session.completed ──────────────────────────────────────────
    elif event_type == "checkout.session.completed":
        email = _extract_email(stripe_obj)
        amount_cents = stripe_obj.get("amount_total", 0)
        payment_intent_id = stripe_obj.get("payment_intent", "")

        if email and amount_cents > 0:
            await purchase_completed(
                email=email,
                amount_cents=amount_cents,
                product_type="fix_pack",
                stripe_payment_intent_id=payment_intent_id,
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

    # Return 200 for all handled and unhandled events
    return {"received": True, "type": event_type}
