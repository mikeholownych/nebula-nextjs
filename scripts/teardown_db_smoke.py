#!/usr/bin/env python3
"""Round-trip smoke test for TeardownDB against local nebula_audit."""
import asyncio
import sys
from datetime import datetime, timezone

sys.path.insert(0, "/home/mike/nebula")

from platform_api.services.teardown_db import (
    ClaimConflict,
    TeardownDB,
)


async def main() -> int:
    db = TeardownDB()
    rec = {
        "slug": "qa-smoke", "name": "QA Smoke", "url": "https://qa.example.com",
        "domain": "example.com", "score": 4.2, "grade": "D",
        "audited_at": datetime(2026, 8, 22, tzinfo=timezone.utc), "summary": "s", "context": "c",
        "findings": [{"key": "k"}], "screenshot_path": "/x.webp",
    }
    await db.upsert_teardown(rec)
    got = await db.get_teardown("qa-smoke")
    assert got and got["domain"] == "example.com" and got["claim"] is None, got
    assert isinstance(got["findings"], list), type(got["findings"])
    assert got["findings"] == [{"key": "k"}], got["findings"]
    claim = await db.create_claim("qa-smoke", "owner@example.com", "email_domain")
    assert claim["status"] == "active"
    try:
        await db.create_claim("qa-smoke", "other@example.com", "dns_txt")
        raise AssertionError("expected ClaimConflict")
    except ClaimConflict:
        pass
    again = await db.create_claim("qa-smoke", "owner@example.com", "email_domain")
    assert again["id"] == claim["id"], "same-email re-claim must be idempotent"
    lst = await db.list_teardowns()
    match = [t for t in lst if t["slug"] == "qa-smoke"]
    assert match and match[0]["claimed"] is True
    print("SMOKE OK")
    return 0


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))
