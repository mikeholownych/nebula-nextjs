#!/usr/bin/env python3
"""
channel1/intake_signal_queue.py — Pull signal-watcher queue into the Channel 1 sheet.

Usage:
  python3 intake_signal_queue.py [--dry-run] [--min-score 8]
  python3 intake_signal_queue.py --queue reddit_leads.jsonl   # PRAW monitor output

Tiering (matches CHANNEL1_PLAYBOOK.md):
  TIER A (outreach-ready): signal_score >= 8 AND real product URL AND ad-spend ICP.
      These get direct, pre-audited outreach. (Current queue: none.)
  TIER B (audit-first):     real product URL, launch ICP (Show HN etc.).
      These go in the sheet at status=audience with the "new launch, no traction"
      framing — free audit funnel, NEVER ad-spend copy (known ICP mismatch pitfall).

Excluded automatically:
  - producthunt.com product_urls (listing pages, not landing pages — known pitfall)
  - empty / github.com / twitter.com product_urls (nothing to audit)
  - URLs already in the pipeline sheet (dedup by URL)
"""

import argparse
import csv
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

NEBULA = Path("/home/mike/nebula")
QUEUE = NEBULA / "signal_queue.jsonl"
SHEET = Path(__file__).parent / "pipeline_sheet.csv"

# Launch ICP vs ad-spend ICP. Show HN leads are launch ICP — audit-first, no ad copy.
AD_SPEND_TERMS = [
    "ad spend", " ads", "spent $", "spent €", "zero signups", "no signups",
    "zero conversions", "no conversions", "roas", "cac", "paid traffic",
    "burning", "wasted", "no sales", "0 sales", "not converting",
]

REAL_URL_PATTERNS = re.compile(r"^https?://", re.I)
BAD_HOSTS = ("producthunt.com", "github.com", "twitter.com", "x.com", "news.ycombinator.com")


def now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


def load_queue(path: Path | None = None) -> list[dict]:
    q = path or QUEUE
    if not q.exists():
        print(f"❌ Queue file not found: {q}")
        return []
    rows = []
    with open(q) as f:
        for line in f:
            line = line.strip()
            if line:
                try:
                    rows.append(json.loads(line))
                except json.JSONDecodeError:
                    continue
    return rows


def load_sheet() -> list[dict]:
    if not SHEET.exists() or SHEET.stat().st_size == 0:
        return []
    with open(SHEET, newline="") as f:
        return list(csv.DictReader(f))


def write_sheet(rows: list[dict]) -> None:
    cols = ["name", "company", "url", "linkedin", "email", "source",
            "trigger", "status", "first_contact", "last_contact", "notes"]
    with open(SHEET, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=cols)
        w.writeheader()
        w.writerows(rows)


def real_url(u: str) -> str | None:
    if not u:
        return None
    u = u.strip()
    if not REAL_URL_PATTERNS.match(u):
        return None
    host = u.split("/")[2].lower() if "://" in u else ""
    if any(b in host for b in BAD_HOSTS):
        return None
    return u


def is_ad_spend_icp(text: str) -> bool:
    t = text.lower()
    return any(term in t for term in AD_SPEND_TERMS)


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--dry-run", action="store_true", help="Print what would be added without writing")
    p.add_argument("--min-score", type=int, default=8, help="Tier A threshold (default 8)")
    p.add_argument("--queue", default=str(QUEUE), help="Path to lead queue JSONL (default: signal_queue.jsonl)")
    args = p.parse_args()

    queue = load_queue(Path(args.queue))
    sheet = load_sheet()
    existing_urls = {r.get("url", "").strip().lower() for r in sheet if r.get("url")}

    tier_a, tier_b, excluded = [], [], []
    excluded_reasons: dict[str, int] = {}

    for r in queue:
        url = real_url(r.get("product_url") or r.get("url") or "") or ""
        source = r.get("source", "unknown")
        headline = r.get("headline", "") or ""
        trigger = r.get("trigger_text", "") or ""
        combined = f"{headline} {trigger}"

        if not url:
            excluded_reasons["no real product URL"] = excluded_reasons.get("no real product URL", 0) + 1
            excluded.append(r)
            continue
        if url.lower() in existing_urls:
            excluded_reasons["already in sheet"] = excluded_reasons.get("already in sheet", 0) + 1
            excluded.append(r)
            continue

        score = int(r.get("signal_score") or 0)
        if score >= args.min_score and is_ad_spend_icp(combined):
            tier_a.append(r)
        elif url:
            tier_b.append(r)
        else:
            excluded_reasons["below min score"] = excluded_reasons.get("below min score", 0) + 1
            excluded.append(r)

    print(f"Queue: {len(queue)} rows | Existing sheet URLs: {len(existing_urls)}")
    print(f"  TIER A (outreach-ready, ≥{args.min_score} + ad-spend ICP): {len(tier_a)}")
    print(f"  TIER B (audit-first, launch ICP): {len(tier_b)}")
    print(f"  Excluded: {sum(excluded_reasons.values())} → {dict(excluded_reasons)}")

    if args.dry_run:
        for r in tier_a + tier_b:
            print(f"  [WOULD ADD] {r.get('source')}: {real_url(r.get('product_url') or r.get('url'))}")
        print("\nDry run — no changes written.")
        return 0

    added = 0
    for r in tier_a + tier_b:
        url = real_url(r.get("product_url") or r.get("url") or "") or ""
        if url.lower() in existing_urls:
            continue
        trigger = (r.get("headline") or "")[:120]
        notes = "Tier A: ad-spend ICP, pre-audit before outreach" if r in tier_a else \
                "Tier B: launch ICP — audit-first, NEVER ad-spend copy"
        sheet.append({
            "name": (r.get("author") or "").strip(),
            "company": "",
            "url": url,
            "linkedin": "",
            "email": "",
            "source": r.get("source", "signal_watcher"),
            "trigger": trigger,
            "status": "audience",
            "first_contact": now_iso(),
            "last_contact": now_iso(),
            "notes": notes,
        })
        existing_urls.add(url.lower())
        added += 1
        print(f"  [ADDED] {r.get('source')}: {url}")

    write_sheet(sheet)
    print(f"\nAdded {added} prospect(s). Sheet now has {len(sheet)} rows.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
