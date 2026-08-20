"""Single inbound path for people who unlock an audit and do not buy.

Touches (one person, one sequence):

  T0  unlock results email     platform  (audits.email_sent_at)
  T1  +2h  resume checkout     checkout_abandonment_recovery
  T2  D1   finding check       followup_sequence email1_direct
  T3  D2   methodology         email2_methodology
  T4  D3   example             email3_social_proof
  T5  D5   resource            email4_free_resource
  T6  D7   close $67 leftover     followup_sequence email5 + d7_close_checkout
                               (24h Stripe session, coupon D7CLOSE30 cap 3)
                               Public $97 is unchanged. $19 launch price is dead.

No other job may email this person until T6 completes or they reply/pay.
hot_audit_leads is alert-only. nurture_engine already skips audit_delivered.
"""
from __future__ import annotations

SKIP_EMAIL_EXACT = frozenset(
    {
        "lead@example.com",
        "test@example.com",
        "mike.holownych@gmail.com",
        "mike.holownych@aisyndicate.io",
        "mike@holownych.com",
    }
)
SKIP_EMAIL_SUFFIXES = (
    "@example.com",
    "@example.invalid",
    "@invalid.nebulacomponents.com",
)
SKIP_EMAIL_PREFIXES = ("anonymous+", "qa-", "e2e-", "ux-audit-test@")


def is_pipeline_excluded(email: str) -> bool:
    e = (email or "").strip().lower()
    if not e or "@" not in e:
        return True
    if e in SKIP_EMAIL_EXACT:
        return True
    if e.startswith(SKIP_EMAIL_PREFIXES):
        return True
    return e.endswith(SKIP_EMAIL_SUFFIXES)


def score_out_of_ten(score) -> str:
    """audits.score is 0-100. Never print 73/10."""
    if score is None:
        return "n/a"
    try:
        n = float(score)
    except (TypeError, ValueError):
        return "n/a"
    if n > 10:
        n = n / 10.0
    return f"{n:.1f}/10"
