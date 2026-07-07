#!/usr/bin/env python3
"""tracking_report.py — Check email open rates from pixel tracking log."""

import json, os
from collections import Counter
from datetime import datetime, timezone

LOG = os.path.join(os.path.dirname(__file__), "ledgers", "tracking_log.jsonl")

def load_opens() -> list[dict]:
    if not os.path.exists(LOG):
        return []
    with open(LOG) as f:
        return [json.loads(l) for l in f if l.strip()]

def main():
    opens = load_opens()
    if not opens:
        print("No tracking data yet.")
        return
    
    total = len(opens)
    unique = len(set(o["email"] for o in opens))
    
    print(f"📧 Email Open Tracking Report")
    print(f"{'='*60}")
    print(f"  Total opens recorded: {total}")
    print(f"  Unique email opens:   {unique}")
    print()
    
    # By hour
    hours = Counter()
    for o in opens:
        ts = o.get("timestamp", "")
        h = ts[11:13] if len(ts) > 13 else "??"
        hours[h] += 1
    print(f"  Opens by hour:")
    for h in sorted(hours):
        bar = "█" * min(hours[h], 40)
        print(f"    {h}:00  {bar} {hours[h]}")
    print()
    
    print(f"  Recent opens (last 10):")
    for o in opens[-10:]:
        print(f"    {o['timestamp'][:19]}  {o['email']:<35}  {o.get('ua','')[:40]}")
    print()

if __name__ == "__main__":
    main()
