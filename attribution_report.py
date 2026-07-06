#!/usr/bin/env python3
"""Source attribution report for Nebula revenue funnel.

Groups outreach, audit delivery, and real payments by source/trigger so we scale
segments that produce money instead of raw sends.
"""

import json
from collections import defaultdict
from pathlib import Path

ROOT = Path("/home/mike/nebula")


def load_jsonl(path: Path):
    if not path.exists():
        return []
    rows = []
    for line in path.read_text(errors="ignore").splitlines():
        if not line.strip():
            continue
        try:
            rows.append(json.loads(line))
        except Exception:
            continue
    return rows


def infer_source(row: dict) -> str:
    if row.get("source_type"):
        return row["source_type"]
    action = (row.get("action") or "").lower()
    trigger = (row.get("trigger") or "").lower()
    url = (row.get("source_url") or row.get("url") or "").lower()
    if "local_" in action or "openstreetmap" in trigger or "overpass" in trigger:
        return "local_business"
    if "reddit" in url or "reddit" in trigger or "surge" in action:
        return "reddit_explicit_pain"
    if "hn" in url or "ycombinator" in url:
        return "hn_launch"
    return "unknown"


def infer_trigger(row: dict) -> str:
    if row.get("trigger_type"):
        return row["trigger_type"]
    text = " ".join(str(row.get(k, "")) for k in ["trigger", "fit_reason", "title", "body_excerpt"]).lower()
    if any(x in text for x in ["zero conversion", "no conversion", "0 conversion", "no bookings"]):
        return "ad_bleed_zero_conversion"
    if any(x in text for x in ["landing page feedback", "roast", "teardown"]):
        return "landing_page_feedback"
    if "weak conversion page" in text or "local" in text:
        return "weak_local_page"
    return "unknown"


def real_payments(root: Path):
    payments = []
    for row in load_jsonl(root / "payments.log"):
        pid = str(row.get("payment_id", ""))
        email = str(row.get("email", "")).lower()
        if pid.startswith("cs_test_") or email in {"test-buyer@example.com", "pilot-test-buyer@example.com"}:
            continue
        payments.append(row)
    return payments


def build_report(root: Path = ROOT):
    outreach = load_jsonl(root / "outreach_evidence.jsonl")
    audits = load_jsonl(root / "audit_leads.jsonl")
    payments = real_payments(root)

    by_source = defaultdict(lambda: {
        "outreach_sent": 0,
        "audits_delivered": 0,
        "payments": 0,
        "revenue_cents": 0,
        "triggers": defaultdict(int),
    })
    email_to_source = {}

    for row in outreach:
        if row.get("status", "sent") != "sent":
            continue
        src = infer_source(row)
        trig = infer_trigger(row)
        by_source[src]["outreach_sent"] += 1
        by_source[src]["triggers"][trig] += 1
        if row.get("contact"):
            email_to_source[str(row["contact"]).lower()] = src

    for row in audits:
        if row.get("status") == "bounced":
            continue
        src = infer_source(row)
        if src == "unknown" and row.get("email"):
            src = email_to_source.get(str(row["email"]).lower(), "unknown")
        trig = infer_trigger(row)
        by_source[src]["audits_delivered"] += 1
        by_source[src]["triggers"][trig] += 1
        if row.get("email"):
            email_to_source[str(row["email"]).lower()] = src

    for row in payments:
        email = str(row.get("email", "")).lower()
        src = email_to_source.get(email, infer_source(row))
        by_source[src]["payments"] += 1
        by_source[src]["revenue_cents"] += int(row.get("amount_cents") or 0)

    clean = {}
    for src, data in by_source.items():
        clean[src] = dict(data)
        clean[src]["triggers"] = dict(data["triggers"])
        sent = data["outreach_sent"] or 0
        audits_n = data["audits_delivered"] or 0
        clean[src]["audit_rate"] = round(audits_n / sent, 3) if sent else None
        clean[src]["pay_rate_per_audit"] = round(data["payments"] / audits_n, 3) if audits_n else None

    return {
        "totals": {
            "outreach_sent": sum(x["outreach_sent"] for x in clean.values()),
            "audits_delivered": sum(x["audits_delivered"] for x in clean.values()),
            "payments": len(payments),
            "real_revenue_cents": sum(int(p.get("amount_cents") or 0) for p in payments),
        },
        "by_source": clean,
    }


def main():
    report = build_report(ROOT)
    print(json.dumps(report, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
