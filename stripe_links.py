#!/usr/bin/env python3
"""Audit-first link builder for the $97 self-implementation kit.

The canonical checkout API requires a completed audit UUID and its signed unlock
cookie. Outreach records do not reliably carry either proof, so this module must
never create an unbound Stripe session or fall back to a static payment link.
It preserves the legacy function name for scheduled callers while sending the
lead through the auditable funnel first.
"""

from urllib.parse import urlencode

AUDIT_URL = "https://nebulacomponents.com/audit"


def get_97_checkout_url(
    email: str,
    lead_url: str,
    audit_score,
    domain: str,
) -> str:
    """Return an audit-first URL; checkout is unlocked from the eligible report."""
    params = {
        "url": lead_url,
        "source": "followup_sequence",
        "from": "option_b_offer",
    }
    return f"{AUDIT_URL}?{urlencode(params)}"


if __name__ == "__main__":
    print(
        get_97_checkout_url(
            email="test@example.com",
            lead_url="https://example.com",
            audit_score="4.2",
            domain="example.com",
        )
    )
