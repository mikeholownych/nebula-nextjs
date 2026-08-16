"""Stripe Checkout Session creator — POST /api/checkout

Creates a dynamic Stripe Checkout Session for the $97 Fix Pack with
audit_id, email, and url embedded in session metadata so the webhook
can trigger automated delivery on payment.

The static buy link (buy.stripe.com/...) carries no metadata, so
automated delivery can never fire from it. This route replaces that
link for any flow where we know the audit context.
"""
from __future__ import annotations

import json
import os
import urllib.request
import urllib.error
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, EmailStr

router = APIRouter(prefix="/checkout", tags=["checkout"])

# ── Stripe config ──────────────────────────────────────────────────────────
def _stripe_key() -> str:
    key_sources = [
        os.getenv("STRIPE_SECRET_KEY"),
        # Fallback: read from hermes .env
        *([Path(p).read_text().strip()
           for p in ["/home/mike/.hermes/.env"]
           if Path(p).exists() and "STRIPE_SECRET_KEY" in Path(p).read_text()]),
    ]
    for src in key_sources:
        if src and src.strip().startswith("sk_"):
            return src.strip()
    raise RuntimeError("STRIPE_SECRET_KEY not configured")


def _stripe_key_from_env_file() -> str:
    """Read STRIPE_SECRET_KEY from ~/.hermes/.env"""
    env_path = Path("/home/mike/.hermes/.env")
    if env_path.exists():
        for line in env_path.read_text().splitlines():
            if line.startswith("STRIPE_SECRET_KEY="):
                return line.split("=", 1)[1].strip().strip('"').strip("'")
    return ""


def _get_stripe_key() -> str:
    key = os.getenv("STRIPE_SECRET_KEY", "")
    if not key:
        key = _stripe_key_from_env_file()
    if not key:
        raise RuntimeError("STRIPE_SECRET_KEY not configured")
    return key


PRICE_CENTS = 9700  # $97.00
SUCCESS_URL = "https://nebulacomponents.shop/thank-you?session_id={CHECKOUT_SESSION_ID}"
CANCEL_URL = "https://nebulacomponents.shop/audit"
PRODUCT_NAME = "Nebula Fix Pack — One Conversion Leak Repaired in 48h"


# ── Request / Response models ──────────────────────────────────────────────
class CheckoutRequest(BaseModel):
    email: str
    audit_id: str
    url: str
    first_name: Optional[str] = ""


class CheckoutResponse(BaseModel):
    session_id: str
    checkout_url: str


# ── Stripe API helpers (no SDK dependency) ─────────────────────────────────
def _stripe_post(path: str, data: dict, key: str) -> dict:
    """Minimal Stripe API POST using urllib (no stripe SDK required)."""
    import urllib.parse
    payload = urllib.parse.urlencode(data, doseq=True).encode()
    req = urllib.request.Request(
        f"https://api.stripe.com/v1{path}",
        data=payload,
        headers={
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/x-www-form-urlencoded",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        raise HTTPException(status_code=502, detail=f"Stripe error: {body[:300]}")


# ── Route ──────────────────────────────────────────────────────────────────
@router.post("", response_model=CheckoutResponse)
async def create_checkout_session(body: CheckoutRequest) -> CheckoutResponse:
    """
    Create a Stripe Checkout Session for the $97 Fix Pack.

    Embeds audit_id, email, and url in session metadata so the
    checkout.session.completed webhook can trigger automated delivery.

    Usage (from audit email or landing page):
        POST /api/checkout
        {"email": "founder@co.com", "audit_id": "uuid", "url": "https://co.com"}
    """
    key = _get_stripe_key()

    data = {
        "mode": "payment",
        "payment_method_types[]": "card",
        "customer_email": body.email,
        "line_items[0][price_data][currency]": "usd",
        "line_items[0][price_data][unit_amount]": str(PRICE_CENTS),
        "line_items[0][price_data][product_data][name]": PRODUCT_NAME,
        "line_items[0][price_data][product_data][description]":
            "We fix the top conversion leak on your landing page. Delivered in 48 hours. No calls.",
        "line_items[0][quantity]": "1",
        "success_url": SUCCESS_URL,
        "cancel_url": CANCEL_URL,
        # Metadata — carried through to checkout.session.completed event
        "metadata[audit_id]": body.audit_id,
        "metadata[email]": body.email,
        "metadata[url]": body.url,
        "metadata[first_name]": body.first_name or "",
        "metadata[product_type]": "fix_pack",
    }

    session = _stripe_post("/checkout/sessions", data, key)

    return CheckoutResponse(
        session_id=session["id"],
        checkout_url=session["url"],
    )
