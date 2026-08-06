#!/usr/bin/env python3
"""Backfill engine_version on existing audit records.

Engine versioning was added after audits had already been scored by two
engine generations:
  1.0.0 - original 4-signal ad_signals scoring on all pages (all audits
          created before the context-scope change)
  2.0.0 - page-type scoping for ad_signals (homepages scored on GA4 only);
          exactly the three agency pilot batch-2 audits that ran after the
          change but before the version constant existed
Future audits are stamped at runtime with ENGINE_VERSION from deliver_audit.py.
"""
import asyncio
import os

import asyncpg

# Batch-2 agency audits that ran on the context-scoped engine (v2 logic)
V2_AUDIT_IDS = [
    "c85f3f3c-2e50-4347-ad7d-520dab8d6134",  # adsnord.com
    "4c4a14db-744a-4d27-a547-2f10c8ed5efb",  # keepersdigital.com
    "9a8a9521-bc66-47c2-9122-6390df5f22fb",  # sqauras.com
]


async def main():
    for line in open(".env"):
        k, _, v = line.strip().partition("=")
        if k and not k.startswith("#"):
            os.environ.setdefault(k, v)
    url = os.environ.get(
        "AUDIT_DATABASE_URL",
        "postgresql://postgres@/nebula_audit?host=/var/run/postgresql&port=5433",
    )
    conn = await asyncpg.connect(url)
    await conn.execute("ALTER TABLE audits ADD COLUMN IF NOT EXISTS engine_version TEXT")
    await conn.execute(
        "UPDATE audits SET engine_version = $1 WHERE engine_version IS NULL", "1.0.0"
    )
    await conn.execute(
        "UPDATE audits SET engine_version = $2 WHERE id = ANY($1::uuid[])",
        V2_AUDIT_IDS,
        "2.0.0",
    )
    rows = await conn.fetch(
        "SELECT engine_version, count(*) AS n FROM audits GROUP BY engine_version ORDER BY engine_version"
    )
    print("engine_version distribution:")
    for r in rows:
        print(f"  {r['engine_version']}: {r['n']}")
    await conn.close()


if __name__ == "__main__":
    asyncio.run(main())
