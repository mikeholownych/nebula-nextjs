#!/usr/bin/env python3
"""Hormozi-style lead magnet engine for Nebula.

Source pattern:
1. Reveal what audience is doing wrong.
2. Give them a taste of the actual result.
3. Unbundle one piece of the paid offer so they want the full thing.

This builds three concrete Nebula magnets and a routing map for outreach/nurture.
"""
from __future__ import annotations

import argparse
import json
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable

BASE = Path(__file__).resolve().parent
MAGNET_DIR = BASE / "lead_magnets"
GS = BASE / "growth_system"
CONFIG = GS / "hormozi_lead_magnet_vault.json"
QUEUE = GS / "lead_magnet_offer_queue.jsonl"


@dataclass(frozen=True)
class LeadMagnet:
    id: str
    format: str
    title: str
    promise: str
    buyer_state: str
    cta: str
    file: str
    body: str


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


MAGNETS = [
    LeadMagnet(
        id="mistake_revealer",
        format="reveals_what_they_are_doing_wrong",
        title="The Paid-Traffic Leak Checklist",
        promise="Find the 7 mistakes making paid clicks die before they become leads.",
        buyer_state="Founder has traffic but does not know which page mistake is killing conversion.",
        cta="Run the free audit, then buy the $147 Fix Pack if you want the leaks implemented.",
        file="paid_traffic_leak_checklist.md",
        body="""# The Paid-Traffic Leak Checklist

## Job
Reveal what the founder is doing wrong before asking for money.

## Use this when
A lead says: clicks, no sales; ads are working but page is not; landing page not converting.

## Checklist

Score each 0/1.

1. **Message mismatch** — ad promise and page headline do not say the same thing.
2. **CTA asks too early** — the button asks for commitment before proof exists.
3. **Trust appears too late** — testimonials, logos, guarantees, or proof are below the first CTA.
4. **No single next step** — page has multiple competing CTAs above the fold.
5. **Mobile friction** — form, button, or hero layout breaks on phone.
6. **Slow first impression** — page feels heavy before the offer is understood.
7. **Objection silence** — price, timing, credibility, or risk is not addressed before the ask.

## Interpretation
- 0-2 leaks: traffic quality or offer may be the main issue.
- 3-4 leaks: page is probably taxing every click.
- 5-7 leaks: do not buy more traffic until the page is fixed.

## Next step
Run the free leak map: https://nebulacomponents.shop/audit.html

If you want implementation instead of diagnosis, use the Fix Pack: https://buy.stripe.com/6oUfZh7M87YM5TPgEa43S0b
""",
    ),
    LeadMagnet(
        id="result_taster",
        format="taste_of_actual_result",
        title="Free Leak Map Preview",
        promise="See the exact kind of output Nebula gives before buying implementation.",
        buyer_state="Lead wants proof that the audit/fix path is concrete, not generic advice.",
        cta="Generate your own free audit and see the first fix path.",
        file="free_leak_map_preview.md",
        body="""# Free Leak Map Preview

## Job
Give the lead a taste of the actual result before the paid offer.

## Sample output

**Page:** example paid-traffic landing page  
**Primary leak:** CTA friction before proof  
**Why it matters:** visitors are asked to book/buy before they understand why the offer is safe.  
**Fix:** move proof block directly under the headline, then repeat one CTA after the proof.  
**Expected effect:** fewer qualified clicks exit before seeing credibility.

## What the full audit shows

1. Headline/message match
2. CTA clarity
3. Proof placement
4. Mobile friction
5. Technical trust signals
6. Objection coverage
7. Priority fix order

## Next step
Run your own free leak map: https://nebulacomponents.shop/audit.html

If the result is obvious and you want it shipped, use the Fix Pack: https://buy.stripe.com/6oUfZh7M87YM5TPgEa43S0b
""",
    ),
    LeadMagnet(
        id="offer_unbundle",
        format="unbundled_piece_of_paid_offer",
        title="CTA Rewrite Swipe Kit",
        promise="Get one unbundled piece of the Fix Pack: conversion-focused CTA rewrites.",
        buyer_state="Lead wants a useful implementation artifact, but not the whole service yet.",
        cta="Use the swipe, then buy the Fix Pack when they want the rest implemented.",
        file="cta_rewrite_swipe_kit.md",
        body="""# CTA Rewrite Swipe Kit

## Job
Unbundle one valuable piece of the paid Fix Pack.

## Rule
A CTA should reduce risk, match intent, and point to one next step.

## Rewrites

| Weak CTA | Better CTA | Why |
|---|---|---|
| Book a call | Show me the leaks first | lowers commitment |
| Get started | Run the free leak map | concrete action |
| Submit | Send my audit | outcome-based |
| Learn more | See why clicks are not converting | matches pain |
| Contact us | Get the 3 highest-priority fixes | clearer value |

## Placement rule
Put the first CTA after:
1. one clear promise
2. one proof point
3. one reason the visitor should trust the next step

## Next step
This is one piece of the Fix Pack. The full Fix Pack also handles proof order, headline rewrite, mobile friction, objection handling, and technical trust fixes.

Get implementation: https://buy.stripe.com/6oUfZh7M87YM5TPgEa43S0b
""",
    ),
]


def write_jsonl(path: Path, rows: Iterable[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w") as f:
        for row in rows:
            f.write(json.dumps(row, sort_keys=True) + "\n")


def build_vault() -> dict:
    return {
        "source_pattern": "Hormozi lead magnet formats via Daily Email Tactics",
        "principle": "A lead magnet must reveal a mistake, taste the result, or unbundle one piece of the paid offer.",
        "magnets": [
            {
                "id": m.id,
                "format": m.format,
                "title": m.title,
                "promise": m.promise,
                "buyer_state": m.buyer_state,
                "cta": m.cta,
                "file": str(MAGNET_DIR / m.file),
            }
            for m in MAGNETS
        ],
        "routing": {
            "cold_social_pain": "mistake_revealer",
            "warm_reply_needs_proof": "result_taster",
            "checkout_or_price_objection": "offer_unbundle",
        },
    }


def build_offer_queue() -> list[dict]:
    now = utc_now()
    return [
        {
            "timestamp": now,
            "magnet_id": m.id,
            "format": m.format,
            "title": m.title,
            "use_when": m.buyer_state,
            "outreach_line": f"I made this for founders in that spot: {m.title}. {m.promise}",
            "asset_path": str(MAGNET_DIR / m.file),
            "primary_cta": m.cta,
        }
        for m in MAGNETS
    ]


def run(dry_run: bool = False) -> dict:
    MAGNET_DIR.mkdir(parents=True, exist_ok=True)
    GS.mkdir(parents=True, exist_ok=True)
    if not dry_run:
        for magnet in MAGNETS:
            (MAGNET_DIR / magnet.file).write_text(magnet.body)
        CONFIG.write_text(json.dumps(build_vault(), indent=2) + "\n")
        write_jsonl(QUEUE, build_offer_queue())
    return {
        "magnets": len(MAGNETS),
        "formats": [m.format for m in MAGNETS],
        "config": str(CONFIG),
        "queue": str(QUEUE),
        "dry_run": dry_run,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    print(json.dumps(run(dry_run=args.dry_run), indent=2))


if __name__ == "__main__":
    main()
