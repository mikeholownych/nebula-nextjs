#!/usr/bin/env python3
"""
channel1/pipeline_sheet.py — Minimal Channel 1 prospect tracker.

Usage:
  python3 pipeline_sheet.py add --name "Jane" --company "Acme" --url "https://acme.com" \
      --linkedin "in/jane" [--email jane@acme.com] [--source linkedin_search] \
      [--trigger "posted about CAC"] [--status audience]
  python3 pipeline_sheet.py list [--status audit_requested] [--raw]
  python3 pipeline_sheet.py advance --url "https://acme.com" --to audit_requested [--note "DM sent"]

CSV is the source of truth (matches the plan's "simple sheet"). Statuses map to
the canonical lifecycle so a future DB sync is a straight rename:
  audience, engaged, audit_requested, audit_completed, problem_confirmed,
  commercially_qualified, fix_offered, fix_purchased, fix_delivered,
  outcome_measured, case_study_eligible, bounced, dead
"""

import argparse
import csv
import sys
from datetime import datetime, timezone
from pathlib import Path

SHEET = Path(__file__).parent / "pipeline_sheet.csv"

VALID_STATUSES = {
    "audience", "engaged", "audit_requested", "audit_completed",
    "problem_confirmed", "commercially_qualified", "fix_offered",
    "fix_purchased", "fix_delivered", "outcome_measured",
    "case_study_eligible", "bounced", "dead",
}

COLUMNS = ["name", "company", "url", "linkedin", "email", "source",
           "trigger", "status", "first_contact", "last_contact", "notes"]


def now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


def read_rows() -> list[dict]:
    if not SHEET.exists() or SHEET.stat().st_size == 0:
        return []
    with open(SHEET, newline="") as f:
        return list(csv.DictReader(f))


def write_rows(rows: list[dict]) -> None:
    with open(SHEET, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=COLUMNS)
        writer.writeheader()
        writer.writerows(rows)


def find_row(rows: list[dict], key: str) -> int:
    """Locate a row by url, then email, then linkedin (case-insensitive)."""
    key_l = key.strip().lower()
    for i, r in enumerate(rows):
        for field in ("url", "email", "linkedin"):
            if r.get(field, "").strip().lower() == key_l:
                return i
    return -1


def cmd_add(args) -> int:
    rows = read_rows()
    dedupe_key = args.url or args.email or args.linkedin or ""
    if dedupe_key and find_row(rows, dedupe_key) >= 0:
        print(f"❌ Duplicate: {dedupe_key} already in sheet")
        return 1
    status = (args.status or "audience").strip().lower()
    if status not in VALID_STATUSES:
        print(f"❌ Invalid status '{status}'. Valid: {sorted(VALID_STATUSES)}")
        return 1
    rows.append({
        "name": args.name or "", "company": args.company or "",
        "url": args.url or "", "linkedin": args.linkedin or "",
        "email": args.email or "", "source": args.source or "",
        "trigger": args.trigger or "", "status": status,
        "first_contact": now_iso(), "last_contact": now_iso(),
        "notes": args.note or "",
    })
    write_rows(rows)
    print(f"✅ Added {args.name or args.url} → {status} ({len(rows)} prospects)")
    return 0


def cmd_list(args) -> int:
    rows = read_rows()
    if not rows:
        print("Empty sheet. Add prospects with: pipeline_sheet.py add ...")
        return 0
    if args.status:
        rows = [r for r in rows if r.get("status", "").strip().lower() == args.status.strip().lower()]
    if not rows:
        print(f"No prospects with status '{args.status}'")
        return 0
    if args.raw:
        for r in rows:
            print(",".join(r.get(c, "") for c in COLUMNS))
        return 0
    print(f"{'STATUS':<22} {'NAME':<18} {'URL':<42} {'LAST':<10} TRIGGER")
    for r in rows:
        name = (r.get("name") or "")[:17]
        url = (r.get("url") or "")[:41]
        print(f"{r.get('status',''):<22} {name:<18} {url:<42} {r.get('last_contact',''):<10} {(r.get('trigger') or '')[:40]}")
    print(f"\n{len(rows)} prospect(s)")
    return 0


def cmd_advance(args) -> int:
    rows = read_rows()
    idx = find_row(rows, args.key)
    if idx < 0:
        print(f"❌ No prospect matching '{args.key}'")
        return 1
    new_status = args.to.strip().lower()
    if new_status not in VALID_STATUSES:
        print(f"❌ Invalid status '{new_status}'. Valid: {sorted(VALID_STATUSES)}")
        return 1
    old = rows[idx].get("status", "")
    rows[idx]["status"] = new_status
    rows[idx]["last_contact"] = now_iso()
    if args.note:
        prev = rows[idx].get("notes", "")
        rows[idx]["notes"] = (prev + " | " if prev else "") + args.note
    write_rows(rows)
    print(f"✅ {rows[idx].get('name') or rows[idx].get('url')}: {old} → {new_status}")
    return 0


def main() -> int:
    p = argparse.ArgumentParser(description="Channel 1 prospect tracker")
    sub = p.add_subparsers(dest="cmd", required=True)

    pa = sub.add_parser("add", help="Add a prospect")
    pa.add_argument("--name"); pa.add_argument("--company")
    pa.add_argument("--url"); pa.add_argument("--linkedin")
    pa.add_argument("--email"); pa.add_argument("--source")
    pa.add_argument("--trigger"); pa.add_argument("--status"); pa.add_argument("--note")

    pl = sub.add_parser("list", help="List prospects")
    pl.add_argument("--status"); pl.add_argument("--raw", action="store_true")

    pv = sub.add_parser("advance", help="Advance a prospect's status")
    pv.add_argument("key", help="url, email, or linkedin to locate the row")
    pv.add_argument("--to", required=True)
    pv.add_argument("--note")

    args = p.parse_args()
    if args.cmd == "add":
        return cmd_add(args)
    if args.cmd == "list":
        return cmd_list(args)
    if args.cmd == "advance":
        return cmd_advance(args)
    return 1


if __name__ == "__main__":
    sys.exit(main())
