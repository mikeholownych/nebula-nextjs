#!/usr/bin/env python3
"""Draft a proof receipt from monitor data (score-based measurement).

Wires the monitoring layer (monitored_pages.baseline_score vs last_score +
monitoring_events.score_delta) into ops/outcomes/receipts/receipts.jsonl.

Usage:
  venv/bin/python3 scripts/receipt_draft_from_monitor.py \
      --url https://example.com \
      --fix-desc "Rewrote H1 to repeat ad promise and moved CTA above fold" \
      --scope single_leak \
      --finding-key above_fold \
      --engagement-type fix_pack \
      --industry saas \
      [--monitor-id 3] \
      [--confounder "Redesigned nav at same time"] \
      [--dry-run]

Creates a DRAFT receipt (customer_confirmed=false, publishable=false).
A human sets status=confirmed only after customer confirmation.
Exits 2 (graceful) when no monitor exists for the URL yet -> draft is
skipped; print the reason. Use --dry-run to preview without writing.
"""
from __future__ import annotations

import argparse
import asyncio
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

LEDGER = Path("/home/mike/nebula/ops/outcomes/receipts/receipts.jsonl")
DEFAULT_DB = "postgresql://postgres@/nebula_audit?host=/var/run/postgresql&port=5433"


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def classify(before: int | None, after: int | None) -> str:
    """Score-based conclusion ladder (README.md). Scores on 0-10 scale.

    Order matters: large improvements confirm; tiny changes are noise;
    mid-range improvements are suggested; the rest are decline.
    """
    if before is None or after is None:
        return "insufficient_data"
    delta = (after - before) / 10.0  # stored as 0-100 ints, displayed 0-10
    if delta >= 1.0:
        return "improvement_confirmed"
    if abs(delta) < 0.5:
        return "no_change"
    if delta > 0:
        return "improvement_suggested"
    return "decline"


def next_receipt_id(existing: list[dict]) -> str:
    year = datetime.now(timezone.utc).year
    nums = []
    for row in existing:
        rid = row.get("receipt_id", "")
        if rid.startswith(f"R-{year}-"):
            try:
                nums.append(int(rid.split("-")[-1]))
            except ValueError:
                pass
    return f"R-{year}-{max(nums, default=0) + 1:04d}"


async def fetch_monitor(db_url: str, url: str, monitor_id: int | None) -> dict | None:
    import asyncpg

    conn = await asyncpg.connect(db_url, timeout=10)
    try:
        if monitor_id:
            row = await conn.fetchrow(
                "SELECT id, email, url, plan, baseline_score, last_score, last_grade, "
                "last_checked_at, last_audit_id, active FROM monitored_pages WHERE id = $1",
                monitor_id,
                timeout=10,
            )
        else:
            row = await conn.fetchrow(
                "SELECT id, email, url, plan, baseline_score, last_score, last_grade, "
                "last_checked_at, last_audit_id, active FROM monitored_pages "
                "WHERE LOWER(url) = LOWER($1) ORDER BY id DESC LIMIT 1",
                url,
                timeout=10,
            )
        if not row:
            return None
        events = await conn.fetch(
            "SELECT id, audit_id, score, score_delta, checked_at FROM monitoring_events "
            "WHERE monitored_page_id = $1 ORDER BY checked_at DESC LIMIT 10",
            row["id"],
            timeout=10,
        )
        return {**dict(row), "events": [dict(e) for e in events]}
    finally:
        await conn.close()


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--url", required=True)
    p.add_argument("--fix-desc", required=True)
    p.add_argument("--scope", default="single_leak", choices=["single_leak", "multi_leak", "full_kit"])
    p.add_argument("--finding-key", default=None, help="audit finding key, e.g. above_fold")
    p.add_argument("--engagement-type", default="fix_pack", choices=["fix_pack", "retainer", "agency_partner"])
    p.add_argument("--industry", default=None)
    p.add_argument("--monitor-id", type=int, default=None)
    p.add_argument("--confounder", action="append", default=[])
    p.add_argument("--dry-run", action="store_true")
    args = p.parse_args()

    db_url = os.getenv("AUDIT_DATABASE_URL", DEFAULT_DB)
    monitor = asyncio.run(fetch_monitor(db_url, args.url, args.monitor_id))

    existing = []
    if LEDGER.exists():
        for line in LEDGER.read_text().splitlines():
            line = line.strip()
            if line:
                existing.append(json.loads(line))

    if not monitor:
        if args.dry_run:
            print("No monitor found for URL; draft skipped (would need a monitor or manual receipt).")
            return 2
        print("No monitor found for URL; draft skipped. Use the template manually or create a monitor first.")
        return 2

    before = monitor.get("baseline_score")
    after = monitor.get("last_score")
    conclusion = classify(before, after)

    receipt = {
        "receipt_id": next_receipt_id(existing),
        "status": "draft",
        "created_at": utc_now(),
        "engagement": {
            "type": args.engagement_type,
            "offer_key": None,
            "purchase_id": None,
            "price": None,
        },
        "client": {
            "industry": args.industry,
            "consented_to_publish": False,
            "consent_note": None,
        },
        "property": {
            "url": args.url,
            "vertical": args.industry,
            "label": None,
        },
        "audit": {
            "before_audit_id": None,
            "after_audit_id": monitor.get("last_audit_id"),
            "before_score": round(before / 10.0, 1) if before is not None else None,
            "after_score": round(after / 10.0, 1) if after is not None else None,
            "score_delta": round((after - before) / 10.0, 1) if before is not None and after is not None else None,
        },
        "fix": {
            "description": args.fix_desc,
            "scope": args.scope,
            "deployed_at": None,
            "audit_finding_key": args.finding_key,
        },
        "measurement": {
            "method": "score",
            "monitor_id": monitor.get("id"),
            "monitored_page_id": monitor.get("id"),
            "baseline_window": None,
            "measurement_window": None,
            "sessions_per_period": None,
        },
        "conclusion": conclusion,
        "confounders": args.confounder,
        "customer_confirmed": False,
        "confirmed_at": None,
        "case_study_eligible": False,
        "evidence": [
            {
                "type": "monitor_event",
                "ref": f"monitored_page_id={monitor.get('id')}",
                "captured_at": monitor.get("last_checked_at"),
            }
        ],
    }

    print(json.dumps(receipt, indent=2))
    if args.dry_run:
        print("\n[DRY-RUN] not written to ledger")
        return 0

    # Duplicate guard: same URL + same fix desc already drafted?
    for row in existing:
        if (
            row.get("property", {}).get("url") == args.url
            and row.get("fix", {}).get("description") == args.fix_desc
            and row.get("status") == "draft"
        ):
            print(f"\nDraft already exists: {row.get('receipt_id')} - not duplicating.")
            return 0

    LEDGER.parent.mkdir(parents=True, exist_ok=True)
    with LEDGER.open("a") as f:
        f.write(json.dumps(receipt) + "\n")
    print(f"\nDraft written to {LEDGER} (status=draft). Confirm with customer before setting confirmed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
