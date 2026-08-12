"""Compatibility entrypoint for the authoritative newsletter pipeline.

This historical YouTube scheduler must not maintain a second subscriber store,
render a second template, or call a provider. It delegates to the same release
service used by newsletter_autopilot.py.
"""
from __future__ import annotations

import asyncio
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))


async def run_weekly_newsletter(*, dry_run: bool = True):
    from newsletter_autopilot import draft, load_research, publish

    result = await publish(draft(load_research()), dry_run=dry_run)
    return {"authority": "newsletter_autopilot", **result}


class WeeklyNewsletterJob:
    """Backward-compatible facade. All work goes through the release service."""

    async def run(self):
        return await run_weekly_newsletter(dry_run=True)


if __name__ == "__main__":
    result = asyncio.run(run_weekly_newsletter(dry_run="--send" not in sys.argv))
    print(json.dumps(result, indent=2, ensure_ascii=False))
