#!/usr/bin/env python3
"""
channel1/teardown_tracker.py - Measure teardown propagation, not content volume.

The teardown loop is a channel hypothesis. This ledger records, per teardown,
the 11 validation fields:
  published_at, company, founder_contacted, channels_used, founder_response,
  founder_share, referral_visits, search_impressions, audit_starts,
  audit_completions, repair_purchases

Two validation questions this exists to answer:
  Q1: Does naming + notifying the subject produce distribution an anonymous
      audit would not?  -> founder_response / founder_share / referral_visits
  Q2: Does teardown traffic produce QUALIFIED audit activity, not curiosity?
      -> referral_visits -> audit_starts -> audit_completions -> repair_purchases

Usage:
  teardown_tracker.py add --company <name> --slug <slug> [--pain-source "..."]
  teardown_tracker.py update --slug <slug> --field founder_contacted --value true
  teardown_tracker.py update --slug <slug> --field founder_response --value "..."
  teardown_tracker.py rollup            # table of propagation metrics
  teardown_tracker.py ph                # pull PostHog numbers (reads nebula/.env key)
"""

import argparse
import json
import os
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).parent
LEDGER = HERE / "teardown_ledger.jsonl"
NEBULA_ENV = Path("/home/mike/nebula/.env")

FIELDS = {
    "published_at": str, "company": str, "slug": str, "url": str,
    "pain_source": str, "founder_contacted": bool, "channels_used": list,
    "founder_response": str, "founder_share": bool, "referral_visits": int,
    "search_impressions": int, "audit_starts": int, "audit_completions": int,
    "repair_purchases": int, "status": str, "last_checked": str, "notes": str,
}
REQUIRED = ["published_at", "company", "slug", "url", "status"]


def now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


def load() -> list[dict]:
    if not LEDGER.exists():
        return []
    rows = []
    for line in LEDGER.read_text().splitlines():
        line = line.strip()
        if line:
            try:
                rows.append(json.loads(line))
            except json.JSONDecodeError:
                print(f"⚠️ Skipping malformed ledger line: {line[:80]}")
    return rows


def save(rows: list[dict]) -> None:
    LEDGER.write_text("\n".join(json.dumps(r) for r in rows) + "\n")


def get(rows, slug):
    for r in rows:
        if r.get("slug") == slug:
            return r
    return None


def parse_bool(v: str) -> bool:
    return v.strip().lower() in ("1", "true", "yes", "y")


def cmd_add(args) -> int:
    rows = load()
    if get(rows, args.slug):
        print(f"❌ Teardown '{args.slug}' already in ledger. Use update.")
        return 1
    entry = {f: ([] if f == "channels_used" else 0 if f in ("referral_visits", "search_impressions", "audit_starts", "audit_completions", "repair_purchases") else False if f in ("founder_contacted", "founder_share") else "") for f in FIELDS}
    entry.update({
        "published_at": args.published_at or now_iso(),
        "company": args.company,
        "slug": args.slug,
        "url": args.url or f"https://nebulacomponents.com/teardowns/{args.slug}",
        "pain_source": args.pain_source or "",
        "status": "live_measuring",
        "last_checked": now_iso(),
    })
    rows.append(entry)
    save(rows)
    print(f"✅ Added teardown '{args.slug}' to ledger. Propagation starts at zero - as it should.")
    return 0


def cmd_update(args) -> int:
    rows = load()
    r = get(rows, args.slug)
    if not r:
        print(f"❌ Teardown '{args.slug}' not in ledger.")
        return 1
    if args.field not in FIELDS:
        print(f"❌ Unknown field '{args.field}'. Known: {', '.join(sorted(FIELDS))}")
        return 1
    val: object = args.value
    if FIELDS[args.field] is bool:
        val = parse_bool(args.value)
    elif FIELDS[args.field] is int:
        val = int(args.value)
    elif FIELDS[args.field] is list:
        val = [x.strip() for x in args.value.split(",") if x.strip()]
    r[args.field] = val
    r["last_checked"] = now_iso()
    save(rows)
    print(f"✅ {args.slug}.{args.field} = {val!r}")
    return 0


def cmd_rollup(args) -> int:
    rows = load()
    if not rows:
        print("Ledger empty. Add teardowns with: teardown_tracker.py add --company X --slug y")
        return 0
    print(f"{'company':<18}{'published':<11}{'contacted':<10}{'response':<18}{'share':<6}{'referral':<9}{'impressions':<12}{'audit_starts':<13}{'purchases':<9}")
    print("-" * 106)
    for r in sorted(rows, key=lambda x: x.get("published_at", "")):
        resp = (r.get("founder_response") or "-")[:17]
        print(f"{r.get('company','')[:17]:<18}{str(r.get('published_at',''))[:10]:<11}"
              f"{str(r.get('founder_contacted', False)):<10}{resp:<18}{str(r.get('founder_share', False)):<6}"
              f"{r.get('referral_visits', 0):<9}{r.get('search_impressions', 0):<12}"
              f"{r.get('audit_starts', 0):<13}{r.get('repair_purchases', 0):<9}")
    # Stagnation flags - teardowns that are live but show no propagation
    print("\nPropagation checks:")
    for r in rows:
        if r.get("status") != "live_measuring":
            continue
        if not r.get("founder_contacted"):
            print(f"  ⚠️ {r.get('company')}: founder NOT contacted yet - Q1 unanswered. "
                  f"Post to LinkedIn/X, then set founder_contacted=true.")
        elif not r.get("founder_share") and r.get("referral_visits", 0) == 0:
            print(f"  ⚠️ {r.get('company')}: founder contacted, no share, 0 referral visits "
                  f"- distribution retry needed (new channel), NOT a new teardown.")
        elif r.get("referral_visits", 0) > 0 and r.get("audit_starts", 0) == 0:
            print(f"  ⚠️ {r.get('company')}: {r.get('referral_visits')} visits, 0 audit starts "
                  f"- traffic is curiosity, not qualification. Check the CTA/offer on the teardown page.")
    return 0


def cmd_ph(args) -> int:
    """Pull PostHog numbers for teardown URLs. Reads the query:read key from nebula/.env."""
    key = project = None
    if NEBULA_ENV.exists():
        for line in NEBULA_ENV.read_text().splitlines():
            line = line.strip()
            if line.startswith("#") or "=" not in line:
                continue
            k, _, v = line.partition("=")
            v = v.strip().strip('"').strip("'")
            if k.strip() in ("POSTHOG_READ_KEY", "POSTHOG_API_KEY", "PH_READ_KEY", "POSTHOG_CLI_API_KEY", "POSTHOG_PERSONAL_API_KEY"):
                key = v
            if k.strip() in ("POSTHOG_PROJECT_ID", "POSTHOG_CLI_PROJECT_ID"):
                project = v
    if not key:
        print("❌ No PostHog query key in nebula/.env (POSTHOG_PERSONAL_API_KEY / POSTHOG_READ_KEY).")
        return 1
    project = project or "525183"  # Nebula Components PostHog project id (verified)

    env = dict(os.environ, POSTHOG_CLI_API_KEY=key, POSTHOG_CLI_PROJECT_ID=project)
    rows = load()
    print(f"{'teardown':<16}{'visits':<9}{'audit_starts':<13}")
    print("-" * 40)
    for r in rows:
        slug = r.get("slug")
        # pageview trend for the teardown URL
        cmd = ["npx", "@posthog/cli", "api", "call", "query-trends",
               json.dumps({"kind": "TrendsQuery", "series": [{"kind": "EventsNode", "event": "$pageview", "properties": [{"type": "event", "key": "$current_url", "operator": "icontains", "value": f"/teardowns/{slug}"}]}], "dateRange": {"date_from": "2026-07-25", "date_to": None}}),
               "--json"]
        try:
            out = subprocess.run(cmd, env=env, capture_output=True, text=True, timeout=60)
            data = json.loads(out.stdout) if out.stdout.strip() else {}
            visits = data.get("results", [{}])[0].get("data", [0])[0] if isinstance(data, dict) else 0
        except Exception as e:
            visits = f"err:{e}"[:8]

        # audit_submitted events whose referrer property mentions this teardown
        acmd = ["npx", "@posthog/cli", "api", "call", "query-trends",
                json.dumps({"kind": "TrendsQuery", "series": [{"kind": "EventsNode", "event": "audit_submitted", "properties": [{"type": "event", "key": "referrer", "operator": "icontains", "value": f"/teardowns/{slug}"}]}], "dateRange": {"date_from": "2026-07-25", "date_to": None}}),
                "--json"]
        try:
            aout = subprocess.run(acmd, env=env, capture_output=True, text=True, timeout=60)
            adata = json.loads(aout.stdout) if aout.stdout.strip() else {}
            starts = adata.get("results", [{}])[0].get("data", [0])[0] if isinstance(adata, dict) else 0
        except Exception as e:
            starts = f"err:{e}"[:8]
        print(f"{slug:<16}{str(visits):<9}{str(starts):<13}")
    print("\nNOTE: audit_starts = audit_submitted events with referrer containing /teardowns/<slug>.")
    print("The ?from= param on teardown CTAs (wired 2026-07-31) feeds this referrer automatically.")
    return 0


def main() -> int:
    p = argparse.ArgumentParser()
    sub = p.add_subparsers(dest="cmd", required=True)

    a = sub.add_parser("add")
    a.add_argument("--company", required=True)
    a.add_argument("--slug", required=True)
    a.add_argument("--url", default="")
    a.add_argument("--pain-source", default="")
    a.add_argument("--published-at", default="")
    a.set_defaults(fn=cmd_add)

    u = sub.add_parser("update")
    u.add_argument("--slug", required=True)
    u.add_argument("--field", required=True)
    u.add_argument("--value", required=True)
    u.set_defaults(fn=cmd_update)

    r = sub.add_parser("rollup")
    r.set_defaults(fn=cmd_rollup)

    ph = sub.add_parser("ph")
    ph.set_defaults(fn=cmd_ph)

    args = p.parse_args()
    return args.fn(args)


if __name__ == "__main__":
    sys.exit(main())
