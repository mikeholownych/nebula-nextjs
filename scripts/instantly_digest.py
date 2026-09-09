#!/usr/bin/env python3
"""Instantly.ai cold-email stats digest (for the daily Nebula stats cron).

Prints a compact human-readable summary of the cold-email funnel. Uses the
instantly_client module. Empty/zero output means nothing to report.

Usage: python3 scripts/instantly_digest.py [--json]
"""
import json
import sys

sys.path.insert(0, "/home/mike/nebula/scripts")
import instantly_client as ic  # noqa: E402


def main():
    as_json = "--json" in sys.argv
    ov = ic.analytics_overview()
    camps = ic.list_campaigns()
    accts = ic.list_accounts()

    sent = ov.get("emails_sent_count", 0)
    contacted = ov.get("contacted_count", 0)
    replies = ov.get("reply_count", 0)
    auto = ov.get("reply_count_automatic", 0)
    bounced = ov.get("bounced_count", 0)
    opps = ov.get("total_opportunities", 0)
    opp_value = ov.get("total_opportunity_value", 0)
    interested = ov.get("total_interested", 0)
    meetings = ov.get("total_meeting_booked", 0)
    closed = ov.get("total_closed", 0)

    reply_rate = (replies / sent * 100) if sent else 0.0

    out = {
        "accounts": len(accts),
        "campaigns": len(camps),
        "emails_sent": sent,
        "contacted": contacted,
        "replies": replies,
        "automatic_replies": auto,
        "bounced": bounced,
        "reply_rate_pct": round(reply_rate, 2),
        "opportunities": opps,
        "opportunity_value": opp_value,
        "interested": interested,
        "meetings_booked": meetings,
        "closed": closed,
    }

    if as_json:
        print(json.dumps(out, indent=2))
        return

    print("Instantly cold email (all-time):")
    print(f"  {sent} sent, {contacted} contacted, {replies} replies "
          f"({reply_rate:.1f}%), {bounced} bounced")
    print(f"  {opps} opportunities (${opp_value}), {interested} interested, "
          f"{meetings} meetings, {closed} closed")
    if camps:
        print("  Campaigns:")
        for c in camps:
            print(f"    - {c.get('name')} (status={c.get('status')})")


if __name__ == "__main__":
    main()
