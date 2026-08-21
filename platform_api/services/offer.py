"""Canonical One-Leak Repair Sprint pricing authority (CODE-8).

Mirrors customer-portal/app/lib/public-facts.ts `fixPack` block. The 2027
price rollover must never depend on hardcoded strings scattered through
email/follow-up templates.

Environment overrides exist for staging/tests only:
    NEBULA_OFFER_PRICE_CENTS        override the current advertised price
    NEBULA_NEXT_OFFER_PRICE_CENTS   override the post-rollover price
"""

from __future__ import annotations

import os
from datetime import date

OFFER_KEY = "fix-pack"
OFFER_NAME = "One-Leak Repair Sprint"

# Current public offer (locked through 2026-12-31 per public-facts receipt).
OFFER_PRICE_CENTS = int(os.getenv("NEBULA_OFFER_PRICE_CENTS", "9700"))
OFFER_PRICE_VALID_UNTIL = date(2026, 12, 31)

# Rollover effective 2027-01-01.
NEXT_OFFER_PRICE_CENTS = int(os.getenv("NEBULA_NEXT_OFFER_PRICE_CENTS", "14700"))

TIMING_CLAIM_EMAIL = "Done in 48 hours"
TIMING_CLAIM_SHORT = "48h"


def _usd(cents: int) -> str:
    return f"${cents // 100}"


def active_offer_price_cents(at: date | None = None) -> int:
    """Advertised price at `at` (UTC date). Post-window => rollover price."""
    at = at or date.today()
    if at > OFFER_PRICE_VALID_UNTIL:
        return NEXT_OFFER_PRICE_CENTS
    return OFFER_PRICE_CENTS


def offer_price_display(at: date | None = None) -> str:
    return _usd(active_offer_price_cents(at))
