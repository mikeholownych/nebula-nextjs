#!/usr/bin/env python3
"""Backfill page intent classification for existing audits.

Queries all completed audits with page_intent IS NULL, classifies each,
and updates the DB. Runs in batches of 100 for efficiency.

Usage:
  uv run python scripts/backfill_page_intent.py
"""

import asyncio
import sys
from datetime import datetime
from uuid import UUID

sys.path.insert(0, "/home/mike/nebula/platform_api")

import asyncpg

from platform_api.config import audit_db_dsn
from platform_api.services.page_intent import classify_page

_AUDIT_DB_URL = audit_db_dsn()

_pool: asyncpg.Pool | None = None


async def get_pool() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        _pool = await asyncpg.create_pool(_AUDIT_DB_URL, min_size=1, max_size=5)
    return _pool


BATCH_SIZE = 100


async def unclassified_audits(pool) -> list[dict]:
    """Fetch audits that need classification."""
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT id, url, 
                   engine_output->>'page_title' as page_title,
                   engine_output->>'page_h1' as page_h1,
                   engine_output->>'page_meta_desc' as page_meta_desc,
                   engine_output->>'page_text' as page_text,
                   engine_output->>'page_html' as page_html
            FROM audits
            WHERE status = 'completed'
              AND page_intent IS NULL
            ORDER BY completed_at DESC
            LIMIT $1
            """,
            BATCH_SIZE,
        )
    return [dict(row) for row in rows]


async def update_audit_intent(
    pool, audit_id: UUID, intent: str, confidence: float, signals: dict
) -> None:
    """Update a single audit with its classification."""
    async with pool.acquire() as conn:
        await conn.execute(
            """
            UPDATE audits
            SET page_intent = $2,
                intent_confidence = $3,
                intent_signals = $4
            WHERE id = $1
            """,
            audit_id,
            intent,
            confidence,
            signals,
        )


async def backfill():
    """Main backfill loop."""
    pool = await get_pool()

    total_backfilled = 0
    total_skipped = 0
    total_failed = 0

    print(f"[{datetime.now().isoformat()}] Starting page intent backfill...")
    print(f"Batch size: {BATCH_SIZE}")

    while True:
        batch = await unclassified_audits(pool)

        if not batch:
            break

        for audit in batch:
            audit_id = audit["id"]
            url = audit.get("url", "")
            title = audit.get("page_title", "")
            h1 = audit.get("page_h1", "")
            meta_desc = audit.get("page_meta_desc", "")
            text = audit.get("page_text", "")
            html = audit.get("page_html", "")

            try:
                classification = classify_page(
                    url=url,
                    title=title,
                    h1=h1,
                    meta_desc=meta_desc,
                    text=text,
                    html=html,
                )

                await update_audit_intent(
                    pool,
                    audit_id,
                    classification.intent,
                    float(classification.confidence),
                    classification.signals,
                )

                total_backfilled += 1

                if total_backfilled % 100 == 0:
                    print(
                        f"[{datetime.now().isoformat()}] Processed {total_backfilled} audits..."
                    )

            except Exception as exc:
                total_failed += 1
                print(
                    f"[{datetime.now().isoformat()}] FAILED {audit_id}: {exc}",
                    file=sys.stderr,
                )

        # Small delay between batches to avoid overwhelming the DB
        if batch:
            await asyncio.sleep(0.1)

    print(
        f"[{datetime.now().isoformat()}] Backfill complete. "
        f"Backfilled: {total_backfilled}, Failed: {total_failed}"
    )

    await pool.close()


if __name__ == "__main__":
    asyncio.run(backfill())
