"""D7 close: $67 leftover of the $97 sprint. Not a public price.

Creates a 24h Stripe Checkout Session (Stripe max expiry) with
offer_key=fix-pack so fulfillment still runs. Coupon D7CLOSE30 caps
live redemptions at 3. Public pages stay $97.
"""
from __future__ import annotations

import json
import os
import time
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen

ROOT = Path("/home/mike/nebula")
COUPON_ID = "D7CLOSE30"
AMOUNT_CENTS = 6700
EXPIRES_SECONDS = 24 * 3600


def _key() -> str:
    env = Path.home() / ".hermes" / ".env"
    if env.exists():
        for line in env.read_text().splitlines():
            if line.startswith("STRIPE_SECRET_KEY="):
                return line.split("=", 1)[1].strip().strip('"')
    return os.environ.get("STRIPE_SECRET_KEY", "")


def _stripe(method: str, path: str, data: dict | None = None) -> dict:
    key = _key()
    if not key:
        raise RuntimeError("STRIPE_SECRET_KEY missing")
    body = urlencode(data or {}).encode() if data is not None else None
    req = Request(
        "https://api.stripe.com/v1/" + path.lstrip("/"),
        data=body,
        method=method,
        headers={"Authorization": "Bearer " + key},
    )
    if body is not None:
        req.add_header("Content-Type", "application/x-www-form-urlencoded")
    with urlopen(req, timeout=20) as resp:
        return json.loads(resp.read())


def ensure_coupon() -> dict:
    try:
        return _stripe("GET", f"coupons/{COUPON_ID}")
    except Exception:
        return _stripe(
            "POST",
            "coupons",
            {
                "id": COUPON_ID,
                "name": "D7 leftover close",
                "amount_off": "3000",
                "currency": "usd",
                "duration": "once",
                "max_redemptions": "3",
                "metadata[campaign]": "unlocked_unpaid_d7_close",
            },
        )


def coupon_open() -> bool:
    c = ensure_coupon()
    if not c.get("valid"):
        return False
    max_r = c.get("max_redemptions")
    used = int(c.get("times_redeemed") or 0)
    if max_r is not None and used >= int(max_r):
        return False
    return True


def create_d7_session(*, email: str, audit_id: str, audit_url: str) -> str | None:
    """Return a 24h checkout URL at $67, or None if the cap is hit / Stripe fails."""
    if not coupon_open():
        return None
    if not audit_id or len(audit_id) < 32:
        return None
    expires = int(time.time()) + EXPIRES_SECONDS
    try:
        session = _stripe(
            "POST",
            "checkout/sessions",
            {
                "mode": "payment",
                "expires_at": str(expires),
                "customer_email": email,
                "success_url": "https://nebulacomponents.com/thank-you?session_id={CHECKOUT_SESSION_ID}",
                "cancel_url": f"https://nebulacomponents.com/checkout?audit_id={audit_id}&from=d7_close",
                "submit_type": "pay",
                "line_items[0][price_data][currency]": "usd",
                "line_items[0][price_data][unit_amount]": "9700",
                "line_items[0][price_data][product_data][name]": "One-Leak Repair Sprint",
                "line_items[0][price_data][product_data][description]": "D7 close: one leftover failed condition (headline and first CTA). Same sprint, $67.",
                "line_items[0][quantity]": "1",
                "discounts[0][coupon]": COUPON_ID,
                "payment_method_types[0]": "card",
                "payment_method_types[1]": "link",
                "metadata[offer_key]": "fix-pack",
                "metadata[audit_id]": audit_id,
                "metadata[url]": audit_url[:500],
                "metadata[campaign]": "d7_close",
                "payment_intent_data[statement_descriptor_suffix]": "NEBULA KIT",
            },
        )
    except Exception:
        return None
    url = session.get("url")
    return url if isinstance(url, str) and url.startswith("https://checkout.stripe.com/") else None
