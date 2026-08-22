#!/usr/bin/env python3
"""Idempotently seed nebula_audit.teardowns from exported data.ts JSON."""
import asyncio
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse

sys.path.insert(0, "/home/mike/nebula")

from platform_api.services.domains import registered_domain
from platform_api.services.teardown_db import TeardownDB

SEED_JSON = Path("/tmp/opencode/teardown_seed.json")


def parse_audited_at(raw: str):
    for fmt in ("%B %d, %Y",):
        try:
            d = datetime.strptime(raw, fmt).date()
        except (ValueError, TypeError):
            continue
        # asyncpg rejects strings and plain dates for timestamptz (Task 2 lesson).
        return datetime.combine(d, datetime.min.time(), tzinfo=timezone.utc)
    # Month-only stamps like "August 2026" stay NULL; never fabricate a day.
    return None


def host_of(value: str):
    # Fallback for PSL-apex domains (e.g. carrd.co) where registered_domain
    # returns None because the apex itself is a public suffix.
    if not value:
        return None
    candidate = value.strip().lower()
    if "://" not in candidate:
        candidate = "//" + candidate
    try:
        return urlparse(candidate).hostname or None
    except ValueError:
        return None


async def main() -> int:
    entries = json.loads(SEED_JSON.read_text())
    db = TeardownDB()
    try:
        for slug, t in entries.items():
            assert t["slug"] == slug, f"key/slug mismatch: {slug}"
            domain = (
                registered_domain(t["domain"]) or registered_domain(t["url"])
                or host_of(t["url"]) or host_of(t["domain"])
            )
            assert domain, f"cannot normalize domain for {slug}"
            await db.upsert_teardown({
                "slug": slug,
                "name": t["name"],
                "url": t["url"],
                "domain": domain,
                "score": float(t["score"]),
                "grade": t["grade"],
                "audited_at": parse_audited_at(t.get("auditedAt", "")),
                "summary": t["summary"],
                "context": t["context"],
                "findings": t["findings"],
                "screenshot_path": t["screenshotUrl"],
            })
    finally:
        await db.close()
    print(f"seeded {len(entries)} teardowns")
    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
