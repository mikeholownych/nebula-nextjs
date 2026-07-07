#!/usr/bin/env python3
"""Firewall Health Report — daily summary of content firewall activity.

Reads firewall_blocked.jsonl and reports blocked vs passed stats.
Run: python3 scripts/firewall_report.py
Cron: daily at 8am
"""
import json
from collections import Counter
from datetime import datetime, timezone, timedelta
from pathlib import Path

BASE = Path("/home/mike/nebula")
FIREWALL_LOG = BASE / "firewall_blocked.jsonl"

ONE_DAY = timedelta(days=1)
ONE_WEEK = timedelta(days=7)

def count_window(records, cutoff):
    return [r for r in records if r.get("timestamp", "") >= cutoff]

def main():
    if not FIREWALL_LOG.exists():
        print("No firewall log found — likely no blocked posts yet.")
        print("Summary: 0 blocked | 0 passed | N/A pass rate")
        return

    records = []
    with open(FIREWALL_LOG) as f:
        for line in f:
            try:
                records.append(json.loads(line))
            except json.JSONDecodeError:
                pass

    now = datetime.now(timezone.utc).isoformat()
    today_start = (datetime.now(timezone.utc) - ONE_DAY).isoformat()
    week_start = (datetime.now(timezone.utc) - ONE_WEEK).isoformat()

    today = count_window(records, today_start)
    week = count_window(records, week_start)

    # Count reasons
    verdict_dist = Counter(r.get("verdict", "unknown") for r in week)
    reason_types = Counter()
    for r in week:
        violations = r.get("violations", [])
        if isinstance(violations, list):
            for v in violations:
                reason_types[v] += 1
        elif isinstance(violations, str):
            reason_types[violations] += 1

    # Top blocked domains
    domains = Counter()
    for r in week:
        site = r.get("site", "") or ""
        if site:
            from urllib.parse import urlparse
            try:
                domain = urlparse(site).netloc
                if domain:
                    domains[domain] += 1
            except Exception:
                domains[site] += 1

    print("=" * 55)
    print("  CONTENT FIREWALL — WEEKLY HEALTH REPORT")
    print(f"  Generated: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}")
    print("=" * 55)
    print(f"  Total records: {len(records)}")
    print(f"  Last 24h:      {len(today)} blocked")
    print(f"  Last 7d:       {len(week)} blocked")
    print()
    print("  ── Blocked by verdict ──")
    for verdict, count in verdict_dist.most_common():
        print(f"    {verdict}: {count}")
    print()
    print("  ── Violation distribution ──")
    for vtype, count in reason_types.most_common(10):
        print(f"    {vtype}: {count}")
    print()
    if domains:
        print("  ── Top blocked domains (7d) ──")
        for domain, count in domains.most_common(5):
            print(f"    {domain}: {count}")

    # Summary line
    total_week = len(week)
    if total_week > 0:
        print(f"\n  ▶ {total_week} leads blocked in 7d — pipeline cleaned, outreach quality protected")

    print("=" * 55)


if __name__ == "__main__":
    main()
