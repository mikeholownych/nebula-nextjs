#!/usr/bin/env python3
"""
Content Brief Queue Monitor — nebulacomponents.com
Reports on queued content briefs. Reminds when briefs are overdue.
Silent if nothing actionable.
"""
import json
import sys
from pathlib import Path
from datetime import datetime, timezone, timedelta

BRIEFS_FILE = Path(__file__).parent.parent / "seo/ledger/content_briefs.jsonl"

def main():
    if not BRIEFS_FILE.exists():
        return

    now = datetime.now(timezone.utc)
    briefs = []
    with BRIEFS_FILE.open() as f:
        for line in f:
            line = line.strip()
            if line:
                briefs.append(json.loads(line))

    queued = [b for b in briefs if b.get("status") == "queued"]
    drafted = [b for b in briefs if b.get("status") == "draft"]
    published = [b for b in briefs if b.get("status") == "published"]

    # Check for overdue queued briefs (older than 7 days)
    overdue = []
    for b in queued:
        created = datetime.fromisoformat(b.get("created_at", now.isoformat()))
        if (now - created) > timedelta(days=7):
            overdue.append(b)

    if overdue:
        print(f"CONTENT BRIEFS: {len(queued)} queued, {len(drafted)} in draft, {len(published)} published")
        print(f"OVERDUE ({len(overdue)} briefs waiting >7 days):")
        for b in overdue:
            print(f"  - {b['title']} [{b['primary_query']}]")
        print(f"Next action: Write the first queued brief or assign to content pipeline.")

if __name__ == "__main__":
    main()
