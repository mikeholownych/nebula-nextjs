#!/usr/bin/env python3
"""Founder second-brain campaign engine for Nebula.

Extracted pattern from "The One-Person Marketing Team":
- ingest founder expertise
- extract frameworks, stories, objections
- generate posts, email sequence, lead magnet, and video script
- review/approval before publish

This never auto-publishes or auto-sends. It creates draft queues.
"""
from __future__ import annotations

import argparse
import json
import re
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterable

BASE = Path(__file__).resolve().parent
GS = BASE / "growth_system"
BRAIN_DIR = GS / "founder_second_brain"
INBOX = BRAIN_DIR / "inbox"
CONFIG = GS / "founder_second_brain_config.json"
KNOWLEDGE_BASE = BRAIN_DIR / "knowledge_base.jsonl"
FRAMEWORKS = BRAIN_DIR / "frameworks.jsonl"
STORIES = BRAIN_DIR / "stories.jsonl"
OBJECTIONS = BRAIN_DIR / "objections.jsonl"
POST_DRAFTS = BRAIN_DIR / "linkedin_post_drafts.jsonl"
EMAIL_DRAFTS = BRAIN_DIR / "email_sequence_drafts.jsonl"
LEAD_MAGNET_DRAFTS = BRAIN_DIR / "lead_magnet_drafts.jsonl"
VIDEO_SCRIPT_DRAFTS = BRAIN_DIR / "video_script_drafts.jsonl"
CAMPAIGN_MANIFEST = BRAIN_DIR / "campaign_manifest.json"

DEFAULT_FOUNDER_KNOWLEDGE = """
Nebula Components finds where paid traffic leaks after the click.
The core buyer is a founder running ads with clicks but no conversions.
The false solution is buying more traffic, changing targeting, or hiring another agency.
The real sequence is diagnose the page, map the leak, fix the message and CTA, then scale.
Nebula starts with a free audit, then offers a $147 Fix Pack, a $1,497/mo AI Ops Retainer, and a $497/mo agency partner path.
Proof should come from real audit logs, before/after fixes, payment events, replied emails, and case studies.
Nebula should never sound like a generic marketing agency. It should sound like a leak detector with receipts.
""".strip()

PAIN_TERMS = ["clicks", "zero conversions", "no sales", "ad spend", "landing page", "traffic", "leak", "cta", "proof"]
OBJECTION_PATTERNS = [
    ("already tried an agency", "This is not another retainer. The first deliverable is a specific leak map."),
    ("ads are the problem", "Ads create arrival. The page creates action."),
    ("need more traffic", "More traffic multiplies the leak until the page is fixed."),
    ("we can fix it internally", "Then use the audit as the punch list and keep the build in-house."),
    ("not ready to buy", "Run the free audit first. Buy only if the leak is obvious."),
]
FRAMEWORK_PATTERNS = [
    ("Trigger -> audit -> fix -> scale", "Find buying trigger, deliver audit, fix visible leak, scale only after conversion proof."),
    ("Traffic is not the leak", "Separate channel quality from page friction before touching budget."),
    ("Proof before CTA", "Place credibility before asking for commitment."),
    ("Message match", "The first screen must echo the ad/search promise."),
    ("One next step", "Remove competing CTAs until the buyer knows exactly what to do."),
]


@dataclass(frozen=True)
class Chunk:
    source: str
    chunk_id: str
    text: str
    pain_terms: list[str]


@dataclass(frozen=True)
class Framework:
    name: str
    principle: str
    source: str
    status: str = "draft_needs_approval"


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def read_inputs() -> list[tuple[str, str]]:
    INBOX.mkdir(parents=True, exist_ok=True)
    files = sorted([p for p in INBOX.glob("**/*") if p.is_file() and p.suffix.lower() in {".txt", ".md"}])
    if not files:
        return [("default_nebula_founder_brief", DEFAULT_FOUNDER_KNOWLEDGE)]
    return [(p.name, p.read_text(errors="ignore")) for p in files]


def chunk_text(source: str, text: str, max_chars: int = 900) -> list[Chunk]:
    paragraphs = [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]
    chunks: list[Chunk] = []
    buf = ""
    idx = 1
    for para in paragraphs:
        if len(buf) + len(para) > max_chars and buf:
            chunks.append(make_chunk(source, idx, buf))
            idx += 1
            buf = ""
        buf = (buf + "\n\n" + para).strip()
    if buf:
        chunks.append(make_chunk(source, idx, buf))
    return chunks


def make_chunk(source: str, idx: int, text: str) -> Chunk:
    low = text.lower()
    pains = [term for term in PAIN_TERMS if term in low]
    return Chunk(source=source, chunk_id=f"{source}:{idx}", text=text, pain_terms=pains)


def write_jsonl(path: Path, rows: Iterable[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w") as f:
        for row in rows:
            f.write(json.dumps(row, ensure_ascii=False, sort_keys=True) + "\n")


def extract_frameworks(chunks: list[Chunk]) -> list[Framework]:
    frameworks = [Framework(name=n, principle=p, source="nebula_default") for n, p in FRAMEWORK_PATTERNS]
    for chunk in chunks:
        low = chunk.text.lower()
        if "architecture" in low and "headcount" in low:
            frameworks.append(Framework("Architecture over headcount", "Build a reusable system before adding people.", chunk.chunk_id))
        if "founder" in low and "bottleneck" in low:
            frameworks.append(Framework("Founder access layer", "Capture the founder's real expertise once, then reuse it across campaigns.", chunk.chunk_id))
        if "review" in low and "publish" in low:
            frameworks.append(Framework("Draft -> review -> publish", "Automation creates drafts; a human approves before distribution.", chunk.chunk_id))
    unique: dict[str, Framework] = {}
    for fw in frameworks:
        unique.setdefault(fw.name, fw)
    return list(unique.values())


def extract_stories(chunks: list[Chunk]) -> list[dict[str, Any]]:
    rows = []
    for chunk in chunks:
        text = chunk.text
        if any(term in text.lower() for term in ["proof", "audit", "payment", "reply", "case stud", "before", "after", "client"]):
            rows.append({
                "timestamp": utc_now(),
                "source": chunk.chunk_id,
                "story_seed": text[:420],
                "angle": "receipt-based proof",
                "status": "draft_needs_approval",
            })
    if not rows:
        rows.append({
            "timestamp": utc_now(),
            "source": "default_nebula_founder_brief",
            "story_seed": "A founder keeps buying traffic, but the page never asks clearly for the next step. Nebula maps the leak before budget increases.",
            "angle": "traffic is not the leak",
            "status": "draft_needs_approval",
        })
    return rows[:12]


def extract_objections(chunks: list[Chunk]) -> list[dict[str, Any]]:
    rows = [{
        "timestamp": utc_now(),
        "objection": obj,
        "response": resp,
        "source": "nebula_default",
        "status": "draft_needs_approval",
    } for obj, resp in OBJECTION_PATTERNS]
    for chunk in chunks:
        if "generic" in chunk.text.lower():
            rows.append({
                "timestamp": utc_now(),
                "objection": "this sounds generic",
                "response": "Use the founder's actual audit logs and before/after screenshots, not market research prose.",
                "source": chunk.chunk_id,
                "status": "draft_needs_approval",
            })
    return rows


def post_drafts(frameworks: list[Framework], stories: list[dict[str, Any]]) -> list[dict[str, Any]]:
    out = []
    for i, fw in enumerate(frameworks[:12], start=1):
        hook = {
            "Traffic is not the leak": "Your ads are not broken by default. Your page might be leaking the money.",
            "Architecture over headcount": "Hiring more marketers will not fix a broken marketing architecture.",
            "Founder access layer": "The best marketing source is usually already trapped in the founder's head.",
        }.get(fw.name, f"Most paid-traffic leaks start with this rule: {fw.name}.")
        out.append({
            "timestamp": utc_now(),
            "asset_type": "linkedin_post",
            "post_number": i,
            "hook": hook,
            "body": f"{hook}\n\n{fw.principle}\n\nFor Nebula, the rule is simple: diagnose the leak before buying more traffic.\n\nCTA: reply with the page and I’ll tell you the first leak I’d check.",
            "source_framework": fw.name,
            "status": "draft_needs_approval",
        })
    while len(out) < 12:
        story = stories[len(out) % len(stories)]
        out.append({
            "timestamp": utc_now(),
            "asset_type": "linkedin_post",
            "post_number": len(out) + 1,
            "hook": "A good audit does not say 'improve the page'. It names the leak.",
            "body": f"A good audit does not say 'improve the page'.\n\nIt names the leak.\n\nStory seed: {story['story_seed'][:180]}\n\nCTA: run the free leak map before increasing spend.",
            "source_framework": "story_miner",
            "status": "draft_needs_approval",
        })
    return out[:12]


def email_sequence(objections: list[dict[str, Any]]) -> list[dict[str, Any]]:
    subjects = [
        "Your traffic may not be the problem",
        "Before you raise the budget",
        "The fastest page leak to check",
        "Why another agency won't fix this",
        "Run the leak map first",
    ]
    rows = []
    for i, subject in enumerate(subjects, start=1):
        obj = objections[(i - 1) % len(objections)]
        rows.append({
            "timestamp": utc_now(),
            "asset_type": "email",
            "day": i,
            "subject": subject,
            "body": f"If paid clicks are arriving but sales are not, do not start by changing the channel.\n\nCheck the page.\n\nObjection: {obj['objection']}\nResponse: {obj['response']}\n\nRun the free audit. Buy the Fix Pack only if the leak is obvious.",
            "status": "draft_needs_approval",
        })
    return rows


def lead_magnet_draft(frameworks: list[Framework]) -> list[dict[str, Any]]:
    return [{
        "timestamp": utc_now(),
        "asset_type": "lead_magnet",
        "title": "The Paid-Traffic Leak Map",
        "promise": "Find the first 5 page leaks before spending another dollar on ads.",
        "sections": [fw.name for fw in frameworks[:5]],
        "cta": "Use the free audit, then buy the $147 Fix Pack if the leak is obvious.",
        "status": "draft_needs_approval",
    }]


def video_script(frameworks: list[Framework]) -> list[dict[str, Any]]:
    fw = frameworks[0]
    return [{
        "timestamp": utc_now(),
        "asset_type": "short_video_script",
        "title": "Clicks But No Sales? Check This First",
        "script": f"Hook: Clicks but no sales does not automatically mean your ads failed.\n\nPoint 1: {fw.principle}\n\nPoint 2: Check headline match, proof before CTA, one clear action, and mobile friction.\n\nCTA: run the free Nebula audit before raising spend.",
        "status": "draft_needs_approval",
    }]


def config() -> dict[str, Any]:
    return {
        "source_pattern": "The One-Person Marketing Team / Creator",
        "nebula_adaptation": "Founder second brain for audit proof, sales content, nurture, and lead magnets",
        "flow": ["ingest", "extract", "generate", "review", "publish"],
        "policy": {
            "draft_first": True,
            "human_approval_required": True,
            "never_auto_publish": True,
            "never_auto_send": True,
            "source_of_truth": "founder transcripts, audit logs, customer ledgers, proof assets",
        },
        "outputs": {
            "linkedin_posts_per_asset": 12,
            "email_sequence": 5,
            "lead_magnet_draft": 1,
            "video_script_draft": 1,
        },
    }


def run(dry_run: bool = False) -> dict[str, Any]:
    inputs = read_inputs()
    chunks = [chunk for source, text in inputs for chunk in chunk_text(source, text)]
    frameworks = extract_frameworks(chunks)
    stories = extract_stories(chunks)
    objections = extract_objections(chunks)
    posts = post_drafts(frameworks, stories)
    emails = email_sequence(objections)
    magnets = lead_magnet_draft(frameworks)
    videos = video_script(frameworks)
    manifest = {
        "generated_at": utc_now(),
        "input_sources": [s for s, _ in inputs],
        "chunks": len(chunks),
        "frameworks": len(frameworks),
        "stories": len(stories),
        "objections": len(objections),
        "linkedin_posts": len(posts),
        "emails": len(emails),
        "lead_magnets": len(magnets),
        "video_scripts": len(videos),
        "status": "draft_needs_approval",
    }
    if not dry_run:
        BRAIN_DIR.mkdir(parents=True, exist_ok=True)
        CONFIG.write_text(json.dumps(config(), indent=2) + "\n")
        write_jsonl(KNOWLEDGE_BASE, [asdict(c) | {"timestamp": utc_now()} for c in chunks])
        write_jsonl(FRAMEWORKS, [asdict(f) | {"timestamp": utc_now()} for f in frameworks])
        write_jsonl(STORIES, stories)
        write_jsonl(OBJECTIONS, objections)
        write_jsonl(POST_DRAFTS, posts)
        write_jsonl(EMAIL_DRAFTS, emails)
        write_jsonl(LEAD_MAGNET_DRAFTS, magnets)
        write_jsonl(VIDEO_SCRIPT_DRAFTS, videos)
        CAMPAIGN_MANIFEST.write_text(json.dumps(manifest, indent=2) + "\n")
    return manifest | {"dry_run": dry_run}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    print(json.dumps(run(dry_run=args.dry_run), indent=2))


if __name__ == "__main__":
    main()
