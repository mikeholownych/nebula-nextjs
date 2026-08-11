#!/usr/bin/env python3
"""Funnel-step benchmark analyzer - 'where exactly is the funnel leaking?'

Applied from Brett Malinowski's 7-day build (y-eBAr1uRDQ): he spun up a
metrics dashboard showing conversion at each funnel step, compared each
to industry benchmarks, found his onboarding completion was 20% below
expected, found the mobile form bug, and dropped CAC $25 -> $15.

This script queries PostHog for consecutive funnel events, computes
step-by-step conversion, compares against labeled SaaS benchmarks, and
flags the weakest steps. Run on demand, via cron, or --send to Telegram.

Usage:
  python3 scripts/funnel_benchmark.py [--days 14] [--send] [--json]
"""

import os, sys, json, subprocess, logging
from pathlib import Path
from datetime import datetime, timezone, timedelta

NEBULA_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(NEBULA_DIR))

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("funnel_benchmark")

ENV = NEBULA_DIR / ".env"
TELEGRAM_TARGET = "telegram:5920497760"
REPORT_DIR = NEBULA_DIR / "scripts" / "logs"
REPORT_DIR.mkdir(parents=True, exist_ok=True)


# The audit funnel, in order, with industry-benchmark low bounds (labeled).
# Matches the actual event flow in customer-portal/app/audit + checkout.
# These are directional heuristics for free-audit -> paid SaaS funnels,
# NOT guaranteed numbers - the value is relative comparison between steps.
FUNNEL_STEPS = [
    {"event": "audit_page_viewed",       "label": "Audit page viewed",      "bench_low": None},   # entry
    {"event": "audit_submitted",         "label": "Audit submitted",        "bench_low": 0.30},  # page->submit
    {"event": "audit_ready",             "label": "Audit ready (processed)", "bench_low": 0.85}, # submit->ready
    {"event": "audit_email_submitted",   "label": "Email gate passed",      "bench_low": 0.50},  # ready->email
    {"event": "audit_results_viewed",    "label": "Results viewed",         "bench_low": 0.70},  # email->results
    {"event": "checkout_page_viewed",    "label": "Checkout page",          "bench_low": 0.25},  # results->checkout
    {"event": "checkout_initiated",      "label": "Checkout initiated",     "bench_low": 0.50},  # checkout page->init
    {"event": "purchase_confirmed_viewed", "label": "Purchase confirmed",   "bench_low": 0.40},  # init->paid
    # Ron pre-order benchmark (Chris Koerner l0Vqm0ZIySc 2026-08-09):
    #  617 pre-orders at $10 deposit -> 270 paid members = 45% deposit->paid.
    #  Nebula has NO deposit/pre-order step today, so this step is a
    #  *capability* benchmark: if we add one, ~45% of depositors should pay.
    {"event": "deposit_preorder",        "label": "Deposit/pre-order",      "bench_low": 0.45, "optional": True},
]


def load_env():
    if ENV.exists():
        for line in ENV.read_text().splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, _, v = line.partition("=")
                os.environ.setdefault(k.strip(), v.strip())


def ph_query(payload):
    key = os.environ.get("POSTHOG_PERSONAL_API_KEY")
    host = os.environ.get("POSTHOG_HOST", "https://us.posthog.com")
    project = os.environ.get("POSTHOG_CLI_PROJECT_ID", "525183")
    import urllib.request
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


def analyze(days: int) -> dict:
    load_env()
    key = os.environ.get("POSTHOG_PERSONAL_API_KEY")
    if not key:
        return {"available": False, "reason": "POSTHOG_PERSONAL_API_KEY missing"}

    date_from = (datetime.now(timezone.utc) - timedelta(days=days)).strftime("%Y-%m-%d")
    steps = []
    prev_event, prev_count = None, None
    for i, step in enumerate(FUNNEL_STEPS):
        count = trend_total(step["event"], date_from)
        conv = (count / prev_count) if (prev_count and prev_count > 0) else None
        status = "ok"
        if conv is not None and step["bench_low"] is not None:
            # Optional steps (e.g. deposit/pre-order capability) are not
            # flagged LOW when they don't exist yet - they're capability
            # benchmarks, not leaks.
            if step.get("optional") and count == 0:
                status = "n/a"
            else:
                status = "LOW" if conv < step["bench_low"] else "ok"
        steps.append({
            "event": step["event"],
            "label": step["label"],
            "count": count,
            "conv": round(conv * 100, 1) if conv is not None else None,
            "bench_low": step["bench_low"],
            "status": status,
        })
        prev_event, prev_count = step["event"], count

    weak = [s for s in steps if s["status"] == "LOW"]
    # first-step leak: entry count vs page view (not a conversion, just signal)
    entry = steps[0]["count"]
    submitted = next((s["count"] for s in steps if s["event"] == "audit_submitted"), 0)
    paid = next((s["count"] for s in steps if s["event"] == "purchase_confirmed_viewed"), 0)

    return {
        "available": True,
        "date_from": date_from,
        "days": days,
        "steps": steps,
        "weakest": [s["label"] for s in weak],
        "entry_count": entry,
        "submitted": submitted,
        "paid": paid,
        "entry_to_paid_pct": round(paid / entry * 100, 2) if entry else 0.0,
    }


def render_text(r: dict) -> str:
    lines = [f"🔻 Funnel Benchmark (last {r['days']}d, from {r['date_from']})"]
    lines.append("━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    for s in r["steps"]:
        conv = f"{s['conv']}%" if s["conv"] is not None else "   -"
        flag = " ⚠️ LOW" if s["status"] == "LOW" else ""
        bench = f" (bench ≥{int(s['bench_low']*100)}%)" if s["bench_low"] else ""
        lines.append(f"  {s['label']:<28} {s['count']:>5}  {conv:>6}{bench}{flag}")
    lines.append("")
    lines.append(f"  Entry→Paid: {r['entry_to_paid_pct']}%  |  Paid: {r['paid']}")
    deposit = next((s for s in r["steps"] if s["event"] == "deposit_preorder"), None)
    if deposit and deposit["count"] == 0:
        lines.append("  💡 No deposit/pre-order step - Ron benchmark: ~45% of")
        lines.append("     $10 depositors convert to paid (617->270, Koerner Office).")
        lines.append("     Consider a deposit offer for audit completers (email-gate")
        lines.append("     leavers) before checkout.")
    if r["weakest"]:
        lines.append("")
        lines.append("  ⚠️ Below benchmark: " + ", ".join(r["weakest"]))
        lines.append("  → Fix the step with the biggest drop; smallest funnel wins.")
    else:
        lines.append("  All steps at/above benchmark ✅")
    lines.append("")
    lines.append(f"Generated {datetime.now(timezone.utc).isoformat()[:16]} UTC")
    return "\n".join(lines)


def send_telegram(text: str):
    res = subprocess.run(
        ["hermes", "send", "--to", TELEGRAM_TARGET, text],
        capture_output=True, text=True, timeout=60,
    )
    if res.returncode != 0:
        log.warning(f"hermes send failed: {res.stderr.strip()[:200]}")
        return False
    log.info("Telegram delivered")
    return True


def main():
    import argparse
    parser = argparse.ArgumentParser(description="Funnel-step benchmark analyzer")
    parser.add_argument("--days", type=int, default=14)
    parser.add_argument("--send", action="store_true")
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()

    r = analyze(args.days)
    if not r.get("available"):
        print(f"N/A - {r.get('reason')}")
        return 1

    stamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    (REPORT_DIR / f"funnel_benchmark_{stamp}.json").write_text(json.dumps(r, indent=2))

    text = render_text(r)
    if args.json:
        print(json.dumps(r, indent=2))
        return 0
    print(text)
    if args.send:
        ok = send_telegram(text)
        print(f"\n[telegram] {'delivered' if ok else 'FAILED'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
