#!/usr/bin/env python3
"""Flat-file Claude-style growth system for Nebula.

Implements the six-step playbook without adding new infrastructure:
ICP/positioning/banned words -> 30d calendar -> content skills -> engager ingest -> DM queue -> weekly summary.
"""

from __future__ import annotations

import argparse
import json
import os
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Iterable

DEFAULT_BASE = Path("/home/mike/nebula")
SYSTEM_DIR = "growth_system"
AUDIT_URL = "https://nebulacomponents.shop/"
CHECKOUT_URL = "https://buy.stripe.com/aFa7sL5E03Iwgyt2Nk43S02"

ICP_TEXT = """# ICP

Founders actively bleeding money on ads with zero or weak conversions.

Must-have buying triggers:
- Publicly mentions paid traffic, ads, clicks, or spend.
- Says leads, demos, bookings, sales, or conversions are weak.
- Has a live landing page or offer page to audit.

Not ICP:
- Agencies selling ads/CRO.
- People asking abstract marketing questions with no spend or URL.
- Free-tool promoters and roast-thread tourists.
"""

POSITIONING_TEXT = """# Positioning

Nebula Components is the autonomous conversion leak detector for founders burning ad budget.

Promise: paste the landing page, get the top conversion leaks, then buy the $97 implementation-ready fix pack without calls, calendars, or manual review.

Core angle: your ads may not be broken; your landing page is leaking the money.
"""

BANNED_WORDS = [
    "book a call",
    "jump on a call",
    "calendar",
    "let me know",
    "pick your brain",
    "synergy",
    "revolutionary",
    "game-changing",
]

VOICE_SKILL = """# Nebula Post Voice Skill

Write like Mike/Nebula:
- Short lines.
- Direct claims.
- Proof over polish.
- Founder pain first.
- No hype words.
- Every post points to a measurable leak, shipped asset, or revenue bottleneck.
"""

REPURPOSE_SKILL = """# Nebula Repurposing Skill

For every post, create:
1. LinkedIn post.
2. X thread hook + 5 bullets.
3. Email subject + short body.
4. DM opener for engagers.
5. Build-in-public proof snippet.
"""


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def system_path(base: Path) -> Path:
    path = base / SYSTEM_DIR
    path.mkdir(parents=True, exist_ok=True)
    return path


def write_if_missing(path: Path, content: str) -> None:
    if not path.exists():
        path.write_text(content)


def load_strategy(base: Path = DEFAULT_BASE) -> dict:
    """Create/load the Claude Project inputs: ICP, Positioning, Banned Words."""
    gs = system_path(base)
    write_if_missing(gs / "ICP.md", ICP_TEXT)
    write_if_missing(gs / "Positioning.md", POSITIONING_TEXT)
    write_if_missing(gs / "Banned_Words.txt", "\n".join(BANNED_WORDS) + "\n")
    write_if_missing(gs / "Nebula_Post_Voice_Skill.md", VOICE_SKILL)
    write_if_missing(gs / "Nebula_Repurpose_Skill.md", REPURPOSE_SKILL)
    return {
        "icp": (gs / "ICP.md").read_text(),
        "positioning": (gs / "Positioning.md").read_text(),
        "banned_words": [line.strip() for line in (gs / "Banned_Words.txt").read_text().splitlines() if line.strip()],
    }


def build_content_calendar(days: int = 30) -> list[dict]:
    """Map 30 days of content before writing any single post."""
    jobs = ["Educational", "Testimonial", "Personal story"]
    calendar = []
    hooks = {
        "Educational": "Your ads are not broken by default. Your landing page is leaking the money.",
        "Testimonial": "A founder with clicks and no conversions needs a leak map, not more opinions.",
        "Personal story": "I am building Nebula as an autonomous revenue machine in public.",
    }
    ctas = {
        "Educational": "Paste the URL. Get the free teardown.",
        "Testimonial": "Use the $97 fix pack when the leak is obvious.",
        "Personal story": "Follow the build: agents, offers, revenue proof.",
    }
    for idx in range(days):
        job = jobs[idx % len(jobs)]
        calendar.append({
            "day": idx + 1,
            "job": job,
            "hook": hooks[job],
            "angle": f"Ad-burn conversion leak #{(idx % 10) + 1}",
            "cta": ctas[job],
        })
    return calendar


def _load_json_records(source: Path) -> list[dict]:
    if not source.exists():
        return []
    text = source.read_text().strip()
    if not text:
        return []
    if text.startswith("["):
        data = json.loads(text)
        return [item for item in data if isinstance(item, dict)]
    rows = []
    for line in text.splitlines():
        line = line.strip()
        if line:
            rows.append(json.loads(line))
    return rows


def append_jsonl(path: Path, rows: Iterable[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "a") as f:
        for row in rows:
            f.write(json.dumps(row, sort_keys=True) + "\n")


def _prospect_key(row: dict) -> str:
    name = str(row.get("name", "")).strip().lower()
    company = str(row.get("company", "")).strip().lower()
    role = str(row.get("role", "")).strip().lower()
    return f"{name}|{company}|{role}"


def is_self_engager(row: dict) -> bool:
    """Suppress Mike/Nebula-owned accounts from DM queues."""
    name = str(row.get("name", "")).strip().lower()
    profile_url = str(row.get("profile_url") or row.get("url_profile") or "").lower()
    return (
        name in {"mike holownych", "mike h", "startup spotlight canada", "ai syndicate"}
        or "nebula components" in name
        or "mike-holownych" in profile_url
    )


def is_qualified_signal(row: dict) -> bool:
    """Keep only buyer-pain signals; drop generic LinkedIn feed noise."""
    text = f"{row.get('comment', '')} {row.get('role', '')}".lower()
    traffic_terms = [
        "paid ads", "ad spend", "google ads", "meta ads", "facebook ads", "budget", "traffic",
        "clicks", "cpc", "campaign", "campaigns", "wasted spend", "budget leaking",
    ]
    failure_terms = [
        "zero conversion", "zero conversions", "no conversion", "no conversions", "not converting",
        "didn't convert", "form didn't start", "form did not start", "no leads", "no demos",
        "no sales", "landing page", "bounce", "bounces", "leaking",
    ]
    generic_terms = ["fourth of july", "fireworks", "commercial heat pump", "factory-installed"]
    if any(term in text for term in generic_terms):
        return False
    return any(term in text for term in traffic_terms) and any(term in text for term in failure_terms)


def normalize_apify_engager(raw: dict) -> dict:
    """Normalize LinkedIn engager/post-search actor output into Nebula's canonical shape."""
    raw_author = raw.get("author")
    author: dict = raw_author if isinstance(raw_author, dict) else {}
    is_post_search = bool(author) and bool(raw.get("text")) and bool(raw.get("post_url"))
    engagement_type = str(raw.get("type") or raw.get("engagement_type") or ("linkedin_post_author" if is_post_search else "engaged")).strip().lower()
    verb = "commented on" if "comment" in engagement_type else "liked"
    name = raw.get("name") or raw.get("fullName") or raw.get("author_name") or author.get("name") or ""
    role = raw.get("role") or raw.get("subtitle") or raw.get("headline") or author.get("headline") or ""
    post_url = raw.get("post_url") or raw.get("post_Link") or raw.get("postLink") or raw.get("url") or ""
    profile_url = raw.get("profile_url") or raw.get("url_profile") or raw.get("profileUrl") or author.get("profile_url") or ""
    comment = raw.get("comment") or raw.get("text") or f"{verb} Mike's LinkedIn post about the Nebula autonomous revenue build."
    return {
        "name": name,
        "company": raw.get("company") or raw.get("companyName") or "",
        "role": role,
        "comment": comment,
        "post_url": post_url,
        "profile_url": profile_url,
        "engagement_type": engagement_type,
    }


def ingest_engagers(base: Path = DEFAULT_BASE, source: Path | None = None) -> list[dict]:
    """Load Apify/LinkedIn engager exports into the flat-file pipeline."""
    gs = system_path(base)
    source = source or (gs / "apify_linkedin_engagers.json")
    seen = set()
    pipeline_path = gs / "linkedin_engager_pipeline.jsonl"
    for existing in _load_json_records(pipeline_path):
        seen.add(_prospect_key(existing))
    rows = []
    for raw in _load_json_records(source):
        normalized = normalize_apify_engager(raw)
        if is_self_engager(normalized):
            continue
        if normalized.get("engagement_type") == "linkedin_post_author" and not is_qualified_signal(normalized):
            continue
        key = _prospect_key(normalized)
        if key in seen or key == "||":
            continue
        seen.add(key)
        rows.append({
            "timestamp": utc_now(),
            "name": normalized.get("name", ""),
            "company": normalized.get("company", ""),
            "role": normalized.get("role", ""),
            "comment": normalized.get("comment", ""),
            "post_url": normalized.get("post_url", ""),
            "profile_url": normalized.get("profile_url", ""),
            "engagement_type": normalized.get("engagement_type", ""),
            "stage": "engaged",
            "last_touch_at": utc_now(),
        })
    if rows:
        append_jsonl(gs / "linkedin_engager_pipeline.jsonl", rows)
    return rows


def _clean_banned(text: str, banned_words: list[str]) -> str:
    cleaned = text
    for banned in banned_words:
        cleaned = cleaned.replace(banned, "")
        cleaned = cleaned.replace(banned.title(), "")
        cleaned = cleaned.replace(banned.capitalize(), "")
    return " ".join(cleaned.split())


def concise_signal(text: str, max_chars: int = 170) -> str:
    """Keep only the first useful sentence/fragment for DM personalization."""
    text = " ".join(str(text).split()).strip().rstrip(". ")
    if not text:
        return "your landing page conversion issue"
    for marker in [". ", "\n", "? ", "! "]:
        if marker in text:
            first = text.split(marker, 1)[0].strip().rstrip(". ")
            if 20 <= len(first) <= max_chars:
                return first
    return text[:max_chars].rstrip()


def draft_dm(prospect: dict, strategy: dict | None = None) -> str:
    """Write one personalized DM under 150 words in Nebula voice."""
    strategy = strategy or load_strategy(DEFAULT_BASE)
    name = prospect.get("name") or "there"
    comment = concise_signal(prospect.get("comment") or "your landing page conversion issue")
    company = str(prospect.get("company") or "").strip()
    if company:
        traffic_clause = f"If {company} is paying for clicks and the page is not converting"
    else:
        traffic_clause = "If you're paying for clicks and the page is not converting"
    dm = (
        f"{name} — saw your note: {comment}. "
        f"{traffic_clause}, the leak is usually headline/CTA/proof mismatch. "
        f"I made a free teardown path to flag the top leaks before anyone spends more on traffic. "
        f"No call, no ask attached. Paste the URL if useful: {AUDIT_URL}"
    )
    dm = _clean_banned(dm, strategy.get("banned_words", []))
    words = dm.split()
    if len(words) > 150:
        dm = " ".join(words[:150])
    return dm


def write_dm_queue(base: Path, prospects: list[dict], strategy: dict) -> list[dict]:
    gs = system_path(base)
    rows = []
    for prospect in prospects:
        dm = draft_dm(prospect, strategy)
        row = {
            "timestamp": utc_now(),
            "name": prospect.get("name", ""),
            "company": prospect.get("company", ""),
            "role": prospect.get("role", ""),
            "comment": prospect.get("comment", ""),
            "dm": dm,
            "stage": "dm_written",
            "word_count": len(dm.split()),
        }
        rows.append(row)
    if rows:
        append_jsonl(gs / "dm_queue.jsonl", rows)
    return rows


def queue_followups(base: Path = DEFAULT_BASE, now: datetime | None = None) -> list[dict]:
    """Queue follow-ups for prospects silent for 5+ days."""
    now = now or datetime.now(timezone.utc)
    gs = system_path(base)
    pipeline = gs / "linkedin_engager_pipeline.jsonl"
    rows = _load_json_records(pipeline)
    followups = []
    for row in rows:
        stage = row.get("stage", "")
        if stage not in {"dm_sent", "dm_written"}:
            continue
        raw_touch = row.get("last_touch_at") or row.get("timestamp")
        if not raw_touch:
            continue
        try:
            last_touch = datetime.fromisoformat(str(raw_touch).replace("Z", "+00:00"))
        except Exception:
            continue
        if now - last_touch >= timedelta(days=5):
            followups.append({
                "timestamp": utc_now(),
                "name": row.get("name", ""),
                "company": row.get("company", ""),
                "reason": "silent_5_days",
                "dm": f"{row.get('name', 'there')} — leaving this here in case it helps: if the ad traffic is still not converting, run the free teardown here: {AUDIT_URL}. No ask attached.",
            })
    if followups:
        append_jsonl(gs / "followup_queue.jsonl", followups)
    return followups


def run_weekly_system(base: Path = DEFAULT_BASE, source: Path | None = None) -> dict:
    """Run the weekly Monday system: strategy, calendar, engager ingest, DM writing, followups, summary."""
    gs = system_path(base)
    strategy = load_strategy(base)
    calendar = build_content_calendar()
    (gs / "content_calendar_30d.json").write_text(json.dumps(calendar, indent=2))
    prospects = ingest_engagers(base, source)
    dms = write_dm_queue(base, prospects, strategy)
    followups = queue_followups(base)
    summary = {
        "timestamp": utc_now(),
        "system": "claude_growth_system",
        "engagers_ingested": len(prospects),
        "dms_written": len(dms),
        "followups_queued": len(followups),
        "calendar_days": len(calendar),
        "apify_token_configured": bool(os.getenv("APIFY_TOKEN") or os.getenv("APIFY_API_TOKEN")),
        "next_action": "Export LinkedIn/Apify engagers to growth_system/apify_linkedin_engagers.json, then rerun.",
    }
    (gs / "weekly_summary.json").write_text(json.dumps(summary, indent=2))
    append_jsonl(gs / "weekly_runs.jsonl", [summary])
    return summary


def main() -> None:
    parser = argparse.ArgumentParser(description="Run Nebula's flat-file Claude growth system")
    parser.add_argument("--base", default=str(DEFAULT_BASE))
    parser.add_argument("--source", default="")
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()
    base = Path(args.base)
    source = Path(args.source) if args.source else None
    summary = run_weekly_system(base, source)
    if args.json:
        print(json.dumps(summary, indent=2))
    else:
        print(f"Engagers ingested: {summary['engagers_ingested']}")
        print(f"DMs written: {summary['dms_written']}")
        print(f"Followups queued: {summary['followups_queued']}")
        print(f"Calendar days: {summary['calendar_days']}")


if __name__ == "__main__":
    main()
