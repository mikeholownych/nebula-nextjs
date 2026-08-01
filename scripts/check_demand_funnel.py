#!/usr/bin/env python3
"""Nebula demand-gen funnel monitor.

Queries PostHog (read-only personal API key) for the Component Lab -> Full Audit
conversion funnel and prints a compact report. Empty/zero output means nothing
to report (watchdog pattern for cron).

Funnel stages (canonical):
  lab_check_completed  ->  lab_full_audit_clicked  ->  audit_submitted (referrer=lab)

Usage:
  python3 scripts/check_demand_funnel.py [--days N] [--json]
"""
import json
import os
import sys
import urllib.request
from datetime import datetime, timedelta, timezone

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV = os.path.join(BASE, ".env")

def load_env():
    if os.path.exists(ENV):
        with open(ENV) as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, _, v = line.partition("=")
                    os.environ.setdefault(k.strip(), v.strip())

def ph_query(payload):
    key = os.environ.get("POSTHOG_PERSONAL_API_KEY")
    host = os.environ.get("POSTHOG_HOST", "https://us.posthog.com")
    project = os.environ.get("POSTHOG_CLI_PROJECT_ID", "525183")
    req = urllib.request.Request(
        f"{host}/api/projects/{project}/query/",
        data=json.dumps({"query": payload}).encode(),
        headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read())

def trend_total(event, date_from):
    payload = {
        "kind": "TrendsQuery",
        "series": [{"kind": "EventsNode", "event": event}],
        "dateRange": {"date_from": date_from, "date_to": None},
        "interval": "day",
    }
    res = ph_query(payload)
    results = res.get("results", [])
    if results and isinstance(results[0], dict):
        return sum(results[0].get("data", []))
    return 0

def main():
    days = 7
    as_json = False
    args = sys.argv[1:]
    for i, a in enumerate(args):
        if a == "--days" and i + 1 < len(args):
            days = int(args[i + 1])
        elif a == "--json":
            as_json = True

    load_env()
    date_from = (datetime.now(timezone.utc) - timedelta(days=days)).strftime("%Y-%m-%d")

    events = ["lab_check_completed", "lab_full_audit_clicked", "audit_submitted", "audit_page_viewed"]
    totals = {e: trend_total(e, date_from) for e in events}

    if as_json:
        print(json.dumps({"date_from": date_from, **totals}))
        return

    lab = totals["lab_check_completed"]
    clicked = totals["lab_full_audit_clicked"]
    submitted = totals["audit_submitted"]

    # Watchdog: silent when nothing new. Only report when there is signal.
    if lab == 0 and clicked == 0 and submitted == 0:
        print("")  # empty stdout = silent cron
        return

    lines = [f"Demand funnel (last {days}d):"]
    lines.append(f"  Lab checks:      {lab}")
    lines.append(f"  Full audit click: {clicked}")
    lines.append(f"  Audits submitted: {submitted}")
    if lab:
        lines.append(f"  Lab->Audit conv:  {clicked / lab * 100:.1f}% (click), {submitted / lab * 100:.1f}% (submit)")
    print("\n".join(lines))

if __name__ == "__main__":
    main()
