#!/usr/bin/env python3
"""Append-only commercial try log.

A try is one change with a stated hypothesis and a close record.
Purchases are the only success. Everything else is diagnostic.

  venv/bin/python3 scripts/try_log.py start --id ID --type channel --hypothesis '...' --change '...'
  venv/bin/python3 scripts/try_log.py close --id ID --status no_purchases --wrong '...' --well '...' --keep kill
  venv/bin/python3 scripts/try_log.py list
  venv/bin/python3 scripts/try_log.py open
  venv/bin/python3 scripts/try_log.py show ID
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path("/home/mike/nebula")
LOG = Path(os.environ.get("TRY_LOG_PATH") or (ROOT / "ops" / "try_log.jsonl"))
ALLOWED_STATUS = {"running", "sale_signal", "no_purchases", "killed", "blocked"}
ALLOWED_KEEP = {"keep", "revise", "kill"}
ALLOWED_TYPE = {"channel", "copy", "offer", "pipeline", "outreach", "compliance"}


def iso_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def load() -> list[dict]:
    if not LOG.exists():
        return []
    rows = []
    for line in LOG.read_text().splitlines():
        if not line.strip():
            continue
        try:
            row = json.loads(line)
        except json.JSONDecodeError:
            continue
        if isinstance(row, dict):
            rows.append(row)
    return rows


def write_all(rows: list[dict]) -> None:
    LOG.parent.mkdir(parents=True, exist_ok=True)
    tmp = LOG.with_suffix(".jsonl.tmp")
    tmp.write_text("".join(json.dumps(r, ensure_ascii=False) + "\n" for r in rows))
    tmp.replace(LOG)


def find(rows: list[dict], try_id: str) -> dict | None:
    for row in reversed(rows):
        if row.get("id") == try_id:
            return row
    return None


def cmd_start(args: argparse.Namespace) -> int:
    if args.type not in ALLOWED_TYPE:
        print(f"bad type {args.type}", file=sys.stderr)
        return 2
    rows = load()
    existing = find(rows, args.id)
    if existing and existing.get("status") == "running":
        print(f"already_running {args.id}")
        return 1
    row = {
        "id": args.id,
        "started_at": iso_now(),
        "closed_at": None,
        "type": args.type,
        "hypothesis": args.hypothesis,
        "one_change": args.change,
        "audience": args.audience or "",
        "attribution_key": args.attribution or args.id,
        "window": args.window or "",
        "status": "running",
        "receipts": {},
        "went_well": "",
        "went_wrong": "",
        "keep": "",
        "next": "",
    }
    rows.append(row)
    write_all(rows)
    print(json.dumps(row, indent=2))
    return 0


def cmd_close(args: argparse.Namespace) -> int:
    if args.status not in ALLOWED_STATUS or args.status == "running":
        print("status must be sale_signal|no_purchases|killed|blocked", file=sys.stderr)
        return 2
    if args.keep not in ALLOWED_KEEP:
        print("keep must be keep|revise|kill", file=sys.stderr)
        return 2
    rows = load()
    row = find(rows, args.id)
    if not row:
        print(f"missing {args.id}", file=sys.stderr)
        return 1
    receipts = dict(row.get("receipts") or {})
    if args.receipt:
        try:
            receipts.update(json.loads(args.receipt))
        except json.JSONDecodeError:
            print("receipt must be JSON object", file=sys.stderr)
            return 2
    row.update(
        {
            "closed_at": iso_now(),
            "status": args.status,
            "receipts": receipts,
            "went_well": args.well or "",
            "went_wrong": args.wrong or "",
            "keep": args.keep,
            "next": args.next or "",
        }
    )
    write_all(rows)
    print(json.dumps(row, indent=2))
    return 0


def cmd_list(_args: argparse.Namespace) -> int:
    rows = load()
    if not rows:
        print("empty")
        return 0
    for row in rows[-20:]:
        print(
            f"{row.get('started_at','')}  {row.get('status','?'):12}  {row.get('keep') or '-':6}  {row.get('id')}  {row.get('one_change','')[:80]}"
        )
    return 0


def cmd_open(_args: argparse.Namespace) -> int:
    open_rows = [r for r in load() if r.get("status") == "running"]
    if not open_rows:
        print("none_open")
        return 0
    for row in open_rows:
        print(json.dumps(row, indent=2))
    return 0


def cmd_show(args: argparse.Namespace) -> int:
    row = find(load(), args.id)
    if not row:
        print(f"missing {args.id}", file=sys.stderr)
        return 1
    print(json.dumps(row, indent=2))
    return 0


def main() -> int:
    p = argparse.ArgumentParser(description="Commercial try log")
    sub = p.add_subparsers(dest="cmd", required=True)
    s = sub.add_parser("start")
    s.add_argument("--id", required=True)
    s.add_argument("--type", required=True)
    s.add_argument("--hypothesis", required=True)
    s.add_argument("--change", required=True)
    s.add_argument("--audience", default="")
    s.add_argument("--attribution", default="")
    s.add_argument("--window", default="")
    c = sub.add_parser("close")
    c.add_argument("--id", required=True)
    c.add_argument("--status", required=True)
    c.add_argument("--keep", required=True)
    c.add_argument("--well", default="")
    c.add_argument("--wrong", default="")
    c.add_argument("--next", default="")
    c.add_argument("--receipt", default="")
    sub.add_parser("list")
    sub.add_parser("open")
    sh = sub.add_parser("show")
    sh.add_argument("id")
    args = p.parse_args()
    return {
        "start": cmd_start,
        "close": cmd_close,
        "list": cmd_list,
        "open": cmd_open,
        "show": cmd_show,
    }[args.cmd](args)


if __name__ == "__main__":
    raise SystemExit(main())
