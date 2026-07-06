#!/usr/bin/env python3
"""
stripe_links.py — Generate personalized Stripe Checkout URLs for the $97 offer.

Key resolution order for STRIPE_SECRET_KEY:
  1. STRIPE_SECRET_KEY environment variable
  2. ~/.hermes/secrets/stripe.key file
  3. Static fallback URL (never blocks email send)
"""

import os
import sys
from pathlib import Path

STATIC_97_URL = "https://buy.stripe.com/4gMdR9aYkenafup3Ro43S00"
PRICE_97_ID   = "price_1TlZlbEINR1kU9chWMfqc1jc"
SUCCESS_URL   = "https://nebulacomponents.shop/checkout.html?success=true"
CANCEL_URL    = "https://nebulacomponents.shop/audit.html"


def _load_stripe_key() -> str | None:
    """Return the Stripe secret key, or None if unavailable."""
    # 1. Environment variable
    key = os.environ.get("STRIPE_SECRET_KEY", "").strip()
    if key:
        return key
    # 2. ~/.hermes/.env
    hermes_env = Path.home() / ".hermes/.env"
    if hermes_env.exists():
        for line in hermes_env.read_text().splitlines():
            if line.startswith("STRIPE_SECRET_KEY="):
                key = line.split("=", 1)[1].strip()
                if key:
                    return key
    # 3. Secrets file
    secrets_file = Path.home() / ".hermes/secrets/stripe.key"
    if secrets_file.exists():
        key = secrets_file.read_text().strip()
        if key:
            return key
    return None


def get_97_checkout_url(
    email: str,
    lead_url: str,
    audit_score,
    domain: str,
) -> str:
    """
    Create a personalised Stripe Checkout Session for the $97 fix pack.

    Parameters
    ----------
    email       : lead's email address (prefilled on checkout page)
    lead_url    : lead's website URL (stored in metadata)
    audit_score : numeric or string audit score (stored in metadata)
    domain      : domain name for display / metadata

    Returns
    -------
    str — Stripe Checkout URL, or static fallback if API unavailable.
    """
    secret_key = _load_stripe_key()
    if not secret_key:
        return STATIC_97_URL

    try:
        # Add venv site-packages to path so 'stripe' SDK is importable
        nebula = Path(__file__).parent
        venv_lib = nebula / "venv/lib"
        for sp in venv_lib.glob("python*/site-packages"):
            if str(sp) not in sys.path:
                sys.path.insert(0, str(sp))

        import stripe  # type: ignore

        stripe.api_key = secret_key

        session = stripe.checkout.Session.create(
            mode="payment",
            line_items=[{"price": PRICE_97_ID, "quantity": 1}],
            customer_email=email or None,
            success_url=SUCCESS_URL,
            cancel_url=CANCEL_URL,
            metadata={
                "email":       email,
                "url":         lead_url,
                "score":       str(audit_score) if audit_score else "",
                "domain":      domain,
                "source":      "followup_sequence",
            },
        )
        url = session.url if hasattr(session, "url") else session.get("url")
        if url:
            return url
    except Exception as exc:
        # Never block email send — log and fall back
        print(f"  [stripe_links] checkout session failed ({exc}); using static URL")

    return STATIC_97_URL


if __name__ == "__main__":
    # Quick smoke test (prints static URL if no key is configured)
    test_url = get_97_checkout_url(
        email="test@example.com",
        lead_url="https://example.com",
        audit_score="4.2",
        domain="example.com",
    )
    print(f"checkout URL: {test_url}")
