#!/usr/bin/env python3
"""Evergreen social-signal routing for Nebula outbound.

Implements the "$234K cold email" playbook:
- Do not trust Clay/Apollo-style bought lists as source of truth.
- Source from social-native action: competitor engagement, creator audiences, owned engagers.
- Tier by intent before enriching.
- Waterfall enrichment starts with Prospeo for Tier 1.
- Tier 1 gets LinkedIn + email. Tier 2/3 get email only.
- First message is under 80 words, value-first, one CTA, never the main paid offer.
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
SIGNAL_QUEUE = GS / "evergreen_social_signal_queue.jsonl"
OUTREACH_QUEUE = GS / "evergreen_outreach_queue.jsonl"
CONFIG_PATH = GS / "social_signal_playbook.json"
AUDIT_URL = "https://nebulacomponents.shop/"

PAIN_TERMS = [
    "ad spend", "paid ads", "google ads", "meta ads", "facebook ads", "ppc",
    "no conversions", "zero conversions", "not converting", "no sales", "no leads",
    "landing page", "roas", "cpa", "clicks", "funnel", "conversion rate",
]
ROLE_TERMS = ["founder", "ceo", "cmo", "head of growth", "vp marketing", "growth", "demand gen"]
NEGATIVE_TERMS = [
    "student", "intern", "recruiter", "job seeker", "open to work", "agency owner",
    "marketing agency", "digital marketing agency", "social media marketing", "lead generation agency",
    "performance marketing executive", "affiliate marketing", "amazon ppc", "ppc audit",
]
VENDOR_PROMO_TERMS = [
    "we help", "we offer", "our team", "our services", "at ", "dm me", "drop a comment",
    "book a call", "schedule a call", "free ppc audit", "free audit this week",
    "quality affiliate clients", "clients who want", "agencies who offer",
]
FIRST_PERSON_PAIN = [
    "i spent", "we spent", "my ads", "our ads", "my landing page", "our landing page",
    "i'm getting", "we're getting", "i am getting", "we are getting",
    "no sales", "no leads", "zero conversions", "not converting",
]
SUPPRESSED_NAMES = {"mike holownych", "mike h", "nebula components", "ai syndicate", "startup spotlight canada"}
SERVICE_PROVIDER_ROLE_TERMS = [
    "i fix", "i help", "helping brands", "helping businesses", "agency", "consultant",
    "specialist", "performance marketer", "ppc", "seo", "social media", "affiliate",
]
ACTION_WEIGHTS = {
    "competitor_engagement": 3,
    "creator_post": 3,
    "owned_post": 2,
    "commenter": 2,
    "comment": 2,
    "liked": 1,
    "liker": 1,
    "linkedin_post_author": 2,
    "reddit": 2,
}


@dataclass
class RoutedSignal:
    timestamp: str
    name: str
    company: str
    role: str
    email: str
    profile_url: str
    source_url: str
    source_type: str
    action: str
    signal_text: str
    tier: int
    score: int
    reasons: list[str]
    enrichment_path: list[str]
    route: str
    outreach: str


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def load_records(path: Path) -> list[dict[str, Any]]:
    if not path.exists() or not path.read_text().strip():
        return []
    text = path.read_text().strip()
    if text.startswith("["):
        data = json.loads(text)
        return [x for x in data if isinstance(x, dict)]
    rows: list[dict[str, Any]] = []
    for line in text.splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            row = json.loads(line)
            if isinstance(row, dict):
                rows.append(row)
        except json.JSONDecodeError:
            continue
    return rows


def write_jsonl(path: Path, rows: Iterable[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w") as f:
        for row in rows:
            f.write(json.dumps(row, sort_keys=True, ensure_ascii=False) + "\n")


def infer_source_type(row: dict[str, Any]) -> str:
    explicit = str(row.get("source_type") or row.get("lead_source_type") or "").strip().lower()
    if explicit:
        return explicit
    if row.get("competitor") or row.get("competitor_name"):
        return "competitor_engagement"
    post = str(row.get("post_url") or row.get("post_link") or row.get("source_url") or "").lower()
    if "linkedin" in post:
        return "owned_post"
    if row.get("platform") == "reddit":
        return "reddit"
    return str(row.get("engagement_type") or row.get("type") or "social_signal").lower()


def normalize_signal(row: dict[str, Any]) -> dict[str, Any]:
    raw_author = row.get("author")
    author: dict[str, Any] = raw_author if isinstance(raw_author, dict) else {}
    raw_emails = row.get("emails")
    emails: list[Any] = raw_emails if isinstance(raw_emails, list) else []
    return {
        "name": row.get("name") or row.get("fullName") or row.get("author_name") or author.get("name") or row.get("author") or "",
        "company": row.get("company") or row.get("companyName") or author.get("company") or row.get("company_hint") or "",
        "role": row.get("role") or row.get("headline") or row.get("subtitle") or author.get("headline") or "",
        "email": row.get("email") or (emails[0] if emails else ""),
        "profile_url": row.get("profile_url") or row.get("profileUrl") or row.get("url_profile") or author.get("profile_url") or "",
        "source_url": row.get("post_url") or row.get("post_link") or row.get("source_url") or row.get("signal_url") or row.get("url") or "",
        "source_type": infer_source_type(row),
        "action": str(row.get("engagement_type") or row.get("type") or row.get("action") or "engaged").lower(),
        "signal_text": row.get("comment") or row.get("text") or row.get("body_excerpt") or row.get("trigger") or row.get("title") or "",
    }


def is_vendor_camouflage(signal: dict[str, Any]) -> bool:
    """Reject service providers writing promotional pain posts.

    The playbook says scrape people taking action. It does not mean contact every
    agency/vendor author who writes about the same pain to sell their own service.
    """
    hay = " ".join(str(signal.get(k, "")) for k in ["role", "signal_text", "name", "company"]).lower()
    if str(signal.get("name", "")).strip().lower() in SUPPRESSED_NAMES:
        return True
    if any(term in hay for term in NEGATIVE_TERMS):
        return True
    role = str(signal.get("role", "")).lower()
    if any(term in role for term in SERVICE_PROVIDER_ROLE_TERMS) and not any(term in hay for term in ["my ads", "our ads", "i spent", "we spent"]):
        return True
    if any(term in hay for term in VENDOR_PROMO_TERMS) and not any(term in hay for term in FIRST_PERSON_PAIN):
        return True
    if signal.get("action") == "linkedin_post_author" and any(term in hay for term in ["#ppc", "#seo", "#digitalmarketing", "#leadgeneration"]):
        return True
    return False


def score_signal(signal: dict[str, Any]) -> tuple[int, list[str]]:
    hay = " ".join(str(signal.get(k, "")) for k in ["role", "signal_text", "source_type", "action"]).lower()
    if is_vendor_camouflage(signal):
        return 0, ["vendor_or_service_provider_blocked"]
    score = 0
    reasons: list[str] = []

    source_type = signal.get("source_type", "")
    if source_type in ACTION_WEIGHTS:
        score += ACTION_WEIGHTS[source_type]
        reasons.append(f"source:{source_type}+{ACTION_WEIGHTS[source_type]}")

    action = signal.get("action", "")
    if action in ACTION_WEIGHTS:
        score += ACTION_WEIGHTS[action]
        reasons.append(f"action:{action}+{ACTION_WEIGHTS[action]}")

    pain_hits = [term for term in PAIN_TERMS if term in hay]
    if pain_hits:
        bump = min(4, len(pain_hits))
        score += bump
        reasons.append(f"pain_terms:{','.join(pain_hits[:4])}+{bump}")

    role_hits = [term for term in ROLE_TERMS if term in hay]
    if role_hits:
        score += 2
        reasons.append(f"decision_role:{role_hits[0]}+2")

    if signal.get("email"):
        score += 1
        reasons.append("reachable_email+1")
    if signal.get("profile_url"):
        score += 1
        reasons.append("linkedin_profile+1")

    if any(term in hay for term in NEGATIVE_TERMS):
        score -= 4
        reasons.append("negative_role-4")

    return max(0, min(10, score)), reasons


def tier_for_score(score: int) -> int:
    if score >= 8:
        return 1
    if score >= 5:
        return 2
    if score >= 3:
        return 3
    return 0


def enrichment_path(tier: int, signal: dict[str, Any]) -> list[str]:
    if tier == 1:
        # Prospeo first per playbook; public-site fallback keeps us independent if no Prospeo key.
        return ["prospeo", "linkedin_profile", "company_site_contact_pages", "privacy_terms_imprint"]
    if tier in (2, 3):
        return ["company_site_contact_pages", "privacy_terms_imprint"]
    return []


def route_for(tier: int, signal: dict[str, Any]) -> str:
    if tier == 1:
        return "linkedin_and_email" if signal.get("profile_url") else "email_only_after_enrichment"
    if tier in (2, 3):
        return "email_only"
    return "skip"


def first_name(name: str) -> str:
    return (name or "there").strip().split()[0]


def clean_signal(text: str, max_chars: int = 110) -> str:
    text = " ".join(str(text or "").split())
    text = re.sub(r"https?://\S+", "", text).strip(" .,-")
    return text[:max_chars].rstrip(" .,-") or "your post on landing page conversion"


def draft_outreach(signal: dict[str, Any], tier: int) -> str:
    name = first_name(signal.get("name", ""))
    context = clean_signal(signal.get("signal_text", ""))
    msg = (
        f"{name} — saw this: {context}. "
        "I built a free leak map for paid-traffic pages. "
        "It flags headline, CTA, proof, speed, and mobile gaps before more budget gets spent. "
        f"Run it here: {AUDIT_URL}"
    )
    words = msg.split()
    if len(words) > 80:
        msg = " ".join(words[:76] + [AUDIT_URL])
    return msg


def dedupe_key(signal: dict[str, Any]) -> str:
    return "|".join(str(signal.get(k, "")).strip().lower() for k in ["email", "profile_url", "name", "company", "source_url"])


def route_signals(raw_rows: Iterable[dict[str, Any]]) -> list[RoutedSignal]:
    out: list[RoutedSignal] = []
    seen: set[str] = set()
    for raw in raw_rows:
        signal = normalize_signal(raw)
        if not any(str(signal.get(k, "")).strip() for k in ["name", "email", "profile_url"]):
            continue
        key = dedupe_key(signal)
        if not key.strip("|") or key in seen:
            continue
        seen.add(key)
        score, reasons = score_signal(signal)
        tier = tier_for_score(score)
        if tier == 0:
            continue
        out.append(RoutedSignal(
            timestamp=utc_now(),
            name=str(signal.get("name", "")),
            company=str(signal.get("company", "")),
            role=str(signal.get("role", "")),
            email=str(signal.get("email", "")),
            profile_url=str(signal.get("profile_url", "")),
            source_url=str(signal.get("source_url", "")),
            source_type=str(signal.get("source_type", "")),
            action=str(signal.get("action", "")),
            signal_text=str(signal.get("signal_text", "")),
            tier=tier,
            score=score,
            reasons=reasons,
            enrichment_path=enrichment_path(tier, signal),
            route=route_for(tier, signal),
            outreach=draft_outreach(signal, tier),
        ))
    return sorted(out, key=lambda r: (r.tier, -r.score, r.name.lower()))


def default_sources() -> list[Path]:
    return [
        GS / "linkedin_engager_pipeline.jsonl",
        GS / "apify_linkedin_engagers.json",
        BASE / "reddit_enriched_prospects.jsonl",
        BASE / "competitor_mentions.jsonl",
    ]


def write_playbook_config() -> None:
    CONFIG_PATH.parent.mkdir(parents=True, exist_ok=True)
    CONFIG_PATH.write_text(json.dumps({
        "source_of_truth": "social-native actions, not bought Apollo/Clay lists",
        "sources": [
            "competitor engagement",
            "top influencers and their audience",
            "owned account engagers",
            "Reddit/HN public buying-trigger posts",
        ],
        "tiers": {
            "1": "score >=8; LinkedIn + email; enrich with Prospeo first",
            "2": "score 5-7; email only after public/contact-page enrichment",
            "3": "score 3-4; email only / low-frequency nurture",
        },
        "enrichment_waterfall": ["prospeo", "linkedin_profile", "company_site_contact_pages", "privacy_terms_imprint"],
        "message_rules": ["under 80 words", "one clear CTA", "value first", "never lead with main paid offer"],
        "benchmarks": {"best_reply_rate": "11.4%", "floor_reply_rate": "3%"},
    }, indent=2) + "\n")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", action="append", help="JSON/JSONL source file. Can be passed multiple times.")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--limit", type=int, default=250)
    args = parser.parse_args()

    rows: list[dict[str, Any]] = []
    for source in [Path(p) for p in args.source] if args.source else default_sources():
        rows.extend(load_records(source))
    routed = route_signals(rows)[: args.limit]
    write_playbook_config()

    payload = [asdict(r) for r in routed]
    if not args.dry_run:
        write_jsonl(SIGNAL_QUEUE, payload)
        outreach_rows = [r for r in payload if r["route"] != "skip"]
        write_jsonl(OUTREACH_QUEUE, outreach_rows)

    counts: dict[str, int] = {}
    for r in payload:
        counts[f"tier_{r['tier']}"] = counts.get(f"tier_{r['tier']}", 0) + 1
    print(json.dumps({
        "input_rows": len(rows),
        "routed": len(payload),
        "counts": counts,
        "signal_queue": str(SIGNAL_QUEUE),
        "outreach_queue": str(OUTREACH_QUEUE),
        "dry_run": args.dry_run,
    }, indent=2))


if __name__ == "__main__":
    main()
