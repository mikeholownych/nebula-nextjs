#!/usr/bin/env python3
"""Compatibility wrapper for the single authoritative newsletter pipeline.

The former roundup sender no longer owns recipient selection or provider I/O.
It delegates to newsletter_autopilot.py so this legacy command cannot bypass
release approval, execution-time eligibility, suppression, hashing, or the
submission ledger.
"""
from __future__ import annotations

import argparse
import asyncio
import json
import sys
from pathlib import Path

BASE = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE))


async def main(dry_run: bool = True):
    from newsletter_autopilot import load_research, draft, publish

    issue = draft(load_research())
    result = await publish(issue, dry_run=dry_run)
    return {"authority": "newsletter_autopilot", **result}


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--send", action="store_true", help="submit only through the authoritative release service")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    try:
        result = asyncio.run(main(dry_run=(args.dry_run or not args.send)))
        print(json.dumps(result, indent=2, ensure_ascii=False))
    except Exception as exc:
        print(json.dumps({"status": "blocked", "authority": "newsletter_autopilot", "error": str(exc)}))
        raise SystemExit(1)
