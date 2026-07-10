#!/usr/bin/env python3
"""LinkedIn operating engine for Nebula.

Extracted from the "29 LinkedIn Skills" image:
Content -> Warming -> Outreach, draft-first, 20/day cap.

This file does not post, DM, or connect. It creates approved-by-human queues.
"""
from __future__ import annotations

import argparse
import json
import re
from dataclasses import asdict, dataclass
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Iterable

BASE = Path(__file__).resolve().parent
GS = BASE / "growth_system"
LINKEDIN_DIR = GS / "linkedin_engine"
ENGAGER_FILE = GS / "linkedin_engager_pipeline.jsonl"
SOCIAL_OUTREACH = GS / "evergreen_outreach_queue.jsonl"
CONFIG_PATH = GS / "linkedin_skill_engine.json"
CONTENT_DRAFTS = LINKEDIN_DIR / "content_drafts.jsonl"
WARM_LIST = LINKEDIN_DIR / "warm_list.jsonl"
OUTREACH_DRAFTS = LINKEDIN_DIR / "outreach_drafts.jsonl"
WARM_TRACKER = LINKEDIN_DIR / "warm_tracker.jsonl"
POST_AUTOPSY = LINKEDIN_DIR / "post_autopsy.jsonl"
AUDIT_URL = "https://nebulacomponents.shop/audit"
DAILY_CAP = 20


@dataclass(frozen=True)
class SkillSpec:
    idx: int
    name: str
    section: str
    job: str


SKILLS = [
    SkillSpec(1, "linkedin-post-writer", "content", "Viral-ready post, 10 hook formulas, drafted not posted"),
    SkillSpec(2, "linkedin-humanizer", "content", "Strips em-dashes, AI vocab, rule-of-three, fake openers"),
    SkillSpec(3, "linkedin-hook-lab", "content", "Ten scored hook variants for a topic, picks the best two"),
    SkillSpec(4, "linkedin-carousel-writer", "content", "Turns a post into saveable carousel slides"),
    SkillSpec(5, "linkedin-content-calendar", "content", "A week of 5 posts across the 5 revenue lanes"),
    SkillSpec(6, "linkedin-voice-profiler", "content", "Reads past posts and DMs, builds voice profile"),
    SkillSpec(7, "linkedin-comment-engine", "content", "Authority comments to leave on other people's posts"),
    SkillSpec(8, "linkedin-repurposer", "content", "One asset into a full week of content"),
    SkillSpec(9, "linkedin-story-miner", "content", "Mines work for anonymized, post-worthy proof"),
    SkillSpec(10, "linkedin-post-autopsy", "content", "Why a post over/under-performed, and the one fix"),
    SkillSpec(11, "linkedin-engager-analytics", "warming", "ICP match rate + top 10 ICP profiles from a post"),
    SkillSpec(12, "linkedin-warm-list-builder", "warming", "A prioritized warming list from ICP + signals"),
    SkillSpec(13, "linkedin-signal-stack", "warming", "5+ signals per target so a message reads like homework"),
    SkillSpec(14, "linkedin-engage-plan", "warming", "A multi-touch warming sequence per target before any pitch"),
    SkillSpec(15, "linkedin-comment-warmer", "warming", "Value-add comments on target posts to warm them"),
    SkillSpec(16, "linkedin-profile-auditor", "warming", "Audits own profile as conversion asset"),
    SkillSpec(17, "linkedin-icp-definer", "warming", "Defines and locks ICP and disqualifiers"),
    SkillSpec(18, "linkedin-warm-tracker", "warming", "One row per person, next action and due date"),
    SkillSpec(19, "linkedin-outreach", "outreach", "Finds decision-makers, drafts <200-char notes, sends 20/day"),
    SkillSpec(20, "linkedin-sell-by-chat", "outreach", "The 6-message framework from warm to booked"),
    SkillSpec(21, "linkedin-connection-note", "outreach", "Two <200-char notes, each on a real specific hook"),
    SkillSpec(22, "linkedin-first-dm", "outreach", "Two <150-char first DMs for the moment they accept"),
    SkillSpec(23, "linkedin-reply-triager", "outreach", "Classifies every reply and routes it to next move"),
    SkillSpec(24, "linkedin-objection-handler", "outreach", "Answer-first reframe that advances to a call"),
    SkillSpec(25, "linkedin-followup-adapter", "outreach", "The next message from conversation state, not a timer"),
    SkillSpec(26, "linkedin-cold-reviver", "outreach", "A new-angle value bomb before a going-cold lead dies"),
    SkillSpec(27, "linkedin-booking-closer", "outreach", "Once they say yes, stop selling and book"),
    SkillSpec(28, "linkedin-onboard", "conductors", "Builds whole brief in one pass: ICP + voice + offer + pains"),
    SkillSpec(29, "linkedin-strategist", "conductors", "Virtual Head of LinkedIn: names constraint, sequences skills"),
]

NEGATIVE_TERMS = [
    "agency", "agencies", "consultant", "student", "recruiter", "open to work", "ppc specialist", "seo specialist",
    "performance marketing", "affiliate", "lead generation", "i fix", "i help", "we help",
    "amazon ppc", "marketing executive", "social media", "digital marketing", "ads specialist",
    "for dtc brands", "for brands", "for agencies", "automation for",
]
ICP_TERMS = ["founder", "ceo", "cmo", "head of growth", "vp marketing", "ecommerce", "saas", "dtc", "shopify"]
PAIN_TERMS = ["ad spend", "google ads", "meta ads", "clicks", "zero conversions", "no sales", "landing page", "not converting", "cpa", "roas"]
AI_SLOP = ["leverage", "unlock", "supercharge", "game-changing", "revolutionize", "delve", "moreover", "furthermore", "in today's fast-paced"]


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def read_jsonl(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        return []
    rows = []
    for line in path.read_text().splitlines():
        if line.strip():
            try:
                rows.append(json.loads(line))
            except json.JSONDecodeError:
                continue
    return rows


def write_jsonl(path: Path, rows: Iterable[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w") as f:
        for row in rows:
            f.write(json.dumps(row, ensure_ascii=False, sort_keys=True) + "\n")


def word_count(text: str) -> int:
    return len(re.findall(r"\b\w+\b", text))


def humanize(text: str) -> str:
    text = text.replace("—", ". ").replace("–", "-")
    for term in AI_SLOP:
        text = re.sub(re.escape(term), "", text, flags=re.I)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def score_hook(hook: str) -> int:
    text = hook.lower()
    score = 0
    if any(t in text for t in PAIN_TERMS):
        score += 3
    if any(ch.isdigit() for ch in hook):
        score += 2
    if len(hook) <= 105:
        score += 2
    if "?" in hook:
        score += 1
    if any(bad in text for bad in AI_SLOP):
        score -= 3
    return max(0, min(10, score))


def hook_lab(topic: str) -> list[dict[str, Any]]:
    variants = [
        f"Your ads are not broken. Your {topic} is leaking the money.",
        f"Clicks but no sales? Check this before raising ad spend.",
        f"The landing page leak I see on almost every paid-traffic funnel.",
        f"If your page gets traffic and no leads, inspect these 5 lines first.",
        f"Most founders buy more traffic when they should fix the page.",
        f"A $500 ad problem is often a 30-second page problem.",
        f"Before you blame Meta, audit the first screen people land on.",
        f"Your CTA might be asking for commitment before trust exists.",
        f"The quiet reason paid clicks bounce before they convert.",
        f"This is why a decent ad can still produce zero customers.",
    ]
    scored = [{"hook": humanize(v), "score": score_hook(v)} for v in variants]
    return sorted(scored, key=lambda x: x["score"], reverse=True)


def build_content_drafts() -> list[dict[str, Any]]:
    lanes = [
        ("pain_validation", "landing page", "Mistake revealer", "Run the free leak map."),
        ("proof", "paid traffic page", "Show the before/after logic", "Reply URL and I will tell you the first leak."),
        ("objection", "CTA", "Why design is not the first fix", "Use the CTA Rewrite Swipe Kit."),
        ("build_in_public", "Nebula", "Show the system shipping", "Follow the build."),
        ("offer", "Fix Pack", "Unbundle one piece of the offer", "Run the audit first."),
    ]
    out = []
    now = utc_now()
    for idx, (lane, topic, proof, cta) in enumerate(lanes, start=1):
        hooks = hook_lab(topic)
        best_hook = hooks[0]["hook"]
        body = humanize(
            f"{best_hook}\n\n"
            f"Most founders see clicks and assume the channel failed. But traffic only tells you people arrived. "
            f"The page decides whether they trust the next step.\n\n"
            f"Today I would check: headline match, proof before CTA, one clear action, mobile friction, and objection coverage.\n\n"
            f"{proof}.\n\n{cta}"
        )
        out.append({
            "timestamp": now,
            "day": idx,
            "lane": lane,
            "skill_chain": ["linkedin-hook-lab", "linkedin-post-writer", "linkedin-humanizer"],
            "hook_variants": hooks[:3],
            "draft": body,
            "cta": cta,
            "status": "draft_needs_approval",
        })
    return out


def icp_score(row: dict[str, Any]) -> tuple[int, list[str]]:
    hay = " ".join(str(row.get(k, "")) for k in ["name", "role", "comment", "signal_text", "source_type", "action"]).lower()
    score = 0
    reasons = []
    pain_hits = [term for term in PAIN_TERMS if term in hay]
    for term in pain_hits[:3]:
        score += 2
        reasons.append(f"pain:{term}")
    icp_hits = [term for term in ICP_TERMS if term in hay]
    for term in icp_hits[:2]:
        score += 2
        reasons.append(f"icp:{term}")
    if row.get("profile_url"):
        score += 1
        reasons.append("profile")
    if row.get("email"):
        score += 1
        reasons.append("email")
    if any(term in hay for term in NEGATIVE_TERMS):
        score -= 3
        reasons.append("negative_role")
    return max(0, min(10, score)), reasons


def person_key(row: dict[str, Any]) -> str:
    return (row.get("profile_url") or row.get("email") or row.get("name") or "").strip().lower()


def build_warm_list(limit: int = DAILY_CAP) -> list[dict[str, Any]]:
    source_rows = read_jsonl(ENGAGER_FILE) + read_jsonl(SOCIAL_OUTREACH)
    seen = set()
    out = []
    now = datetime.now(timezone.utc)
    for row in source_rows:
        key = person_key(row)
        if not key or key in seen:
            continue
        if "/company/" in str(row.get("profile_url") or ""):
            continue
        role_text = str(row.get("role") or "").lower()
        if "followers" in role_text or "turning wasted" in role_text:
            continue
        seen.add(key)
        score, reasons = icp_score(row)
        if "negative_role" in reasons:
            continue
        if score < 3:
            continue
        name = str(row.get("name") or "there").split(" ")[0]
        signal = str(row.get("comment") or row.get("signal_text") or row.get("outreach") or "their LinkedIn activity")[:220]
        due = (now + timedelta(days=len(out) % 5)).date().isoformat()
        out.append({
            "timestamp": utc_now(),
            "name": row.get("name", ""),
            "profile_url": row.get("profile_url", ""),
            "email": row.get("email", ""),
            "role": row.get("role", ""),
            "source_url": row.get("post_url") or row.get("source_url") or "",
            "signal": signal,
            "icp_score": score,
            "reasons": reasons,
            "next_action": "value_comment" if score < 7 else "connection_note",
            "due_date": due,
            "status": "draft_needs_approval",
            "comment_draft": f"Strong point, {name}. The part most teams miss is separating traffic quality from page friction before they change budget.",
        })
    return sorted(out, key=lambda x: x["icp_score"], reverse=True)[:limit]


def connection_note(row: dict[str, Any]) -> str:
    name = str(row.get("name") or "there").split(" ")[0]
    signal = str(row.get("signal") or "your post")[:72].replace("\n", " ")
    note = f"{name}, saw your point on {signal}. I map paid-traffic page leaks. Thought it was worth connecting."
    return note[:199]


def first_dm(row: dict[str, Any]) -> str:
    name = str(row.get("name") or "there").split(" ")[0]
    msg = f"{name}, if useful, send the landing page. I’ll tell you the first leak I’d fix. No pitch."
    return msg[:149]


def followup(row: dict[str, Any]) -> str:
    return "Quick value bomb: check if the first CTA appears before proof. If yes, move proof above it before changing ads."


def build_outreach_drafts(warm_rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    rows = []
    for row in warm_rows[:DAILY_CAP]:
        rows.append({
            "timestamp": utc_now(),
            "name": row.get("name", ""),
            "profile_url": row.get("profile_url", ""),
            "icp_score": row.get("icp_score", 0),
            "skill_chain": ["linkedin-connection-note", "linkedin-first-dm", "linkedin-followup-adapter"],
            "connection_note": connection_note(row),
            "first_dm": first_dm(row),
            "followup_if_no_reply": followup(row),
            "cap_policy": "max_20_per_day",
            "status": "draft_needs_approval",
        })
    return rows


def build_config() -> dict[str, Any]:
    return {
        "source": "29 LinkedIn Skills image",
        "engine": "Content -> Warming -> Outreach",
        "policy": {
            "draft_first": True,
            "human_approval_required": True,
            "daily_outreach_cap": DAILY_CAP,
            "never_auto_send": True,
            "external_links_in_comments": "avoid; point to profile or DM unless approved",
        },
        "skills": [asdict(s) for s in SKILLS],
        "sections": {
            "content": 10,
            "warming": 8,
            "outreach": 9,
            "conductors": 2,
        },
    }


def run(dry_run: bool = False) -> dict[str, Any]:
    content = build_content_drafts()
    warm = build_warm_list()
    outreach = build_outreach_drafts(warm)
    tracker = [{
        "timestamp": utc_now(),
        "name": r.get("name"),
        "profile_url": r.get("profile_url"),
        "next_action": r.get("next_action"),
        "due_date": r.get("due_date"),
        "status": "pending_approval",
    } for r in warm]
    autopsy = [{
        "timestamp": utc_now(),
        "post_id": "pending",
        "diagnosis": "No live post metrics supplied. Draft-first engine generated posts; autopsy runs after performance data exists.",
        "one_fix": "Compare audit signups by lane, not likes.",
    }]
    if not dry_run:
        LINKEDIN_DIR.mkdir(parents=True, exist_ok=True)
        CONFIG_PATH.write_text(json.dumps(build_config(), indent=2) + "\n")
        write_jsonl(CONTENT_DRAFTS, content)
        write_jsonl(WARM_LIST, warm)
        write_jsonl(OUTREACH_DRAFTS, outreach)
        write_jsonl(WARM_TRACKER, tracker)
        write_jsonl(POST_AUTOPSY, autopsy)
    return {
        "skills": len(SKILLS),
        "content_drafts": len(content),
        "warm_targets": len(warm),
        "outreach_drafts": len(outreach),
        "daily_cap": DAILY_CAP,
        "draft_first": True,
        "dry_run": dry_run,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    print(json.dumps(run(dry_run=args.dry_run), indent=2))


if __name__ == "__main__":
    main()
