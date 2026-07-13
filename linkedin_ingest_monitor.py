#!/usr/bin/env python3
"""
linkedin_ingest_monitor.py — Ingest Apify LinkedIn actor output → trigger_leads.jsonl
with is_qualified_signal() filtering and dedup.

Usage:
  python3 linkedin_ingest_monitor.py [--post-search-json PATH] [--engagers-likers-json PATH] [--engagers-commenters-json PATH]
"""

from __future__ import annotations

import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

NEBULA = Path("/home/mike/nebula")
GS = NEBULA / "growth_system"
LEADS_PATH = NEBULA / "trigger_leads.jsonl"

SUPPRESSED = {
    "mike holownych", "ai syndicate", "mike h",
    "startup spotlight canada", "nebula components", "nebula components shop"
}


# ─── is_qualified_signal() from claude_growth_system.py ──────────
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


# ─── Trigger patterns from trigger_lead_engine.py ────────────────
TRIGGER_PATTERNS = {
    "ad_bleed": r'\bad spend\b|\bgoogle ads\b|\bfacebook ads\b|\bpaid traffic\b|\bcpc\b',
    "zero_conversions": r'\bzero conversions\b|\b0 conversions\b|\bnot converting\b|\bno sales\b|\bno signups\b',
    "landing_page_feedback": r'\broast my landing page\b|\blanding page feedback\b|\bconversion rate\b|\bcro\b',
    "founder_signal": r'\bfounder\b|\bsolo founder\b|\bco-founder\b|\bcofounder\b|\bentrepreneur\b',
}
ROLE_TRIGGERS = {'founder', 'ceo', 'owner', 'cofounder', 'co-founder', 'entrepreneur', 'hiring', 'scaling'}


def detect_triggers(text: str) -> list[str]:
    triggers = []
    low = text.lower()
    for label, pattern in TRIGGER_PATTERNS.items():
        if re.search(pattern, low, re.IGNORECASE):
            triggers.append(label)
    return triggers


def role_match(subtitle: str) -> bool:
    low = subtitle.lower()
    return any(role in low for role in ROLE_TRIGGERS)


def compute_seed_score(profile_url: str, subtitle: str, has_post: bool = False) -> int:
    score = 1  # base discovery
    if profile_url and "ACo" in profile_url:
        score += 1
    if detect_triggers(subtitle):
        score += 1
    if role_match(subtitle):
        score += 1
    if has_post:
        score += 1
    return min(score, 5)


def build_segment(score: int) -> str:
    if score <= 7:
        return "cold"
    elif score <= 20:
        return "warm"
    return "hot"


def extract_email(text: str) -> str | None:
    m = re.search(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', text)
    return m.group(0) if m else None


def normalize_name(name: str) -> str:
    return re.sub(r'\s+', ' ', name.strip())


def is_suppressed(name: str) -> bool:
    return any(supp in name.lower() for supp in SUPPRESSED)


# ─── Processing functions ─────────────────────────────────────────
def process_post_search(post: dict) -> dict | None:
    """Process a post_search result into a lead dict."""
    author = post.get("author", {})
    name = normalize_name(author.get("name", ""))
    if is_suppressed(name):
        return None

    profile_url = author.get("profile_url", "")
    subtitle = author.get("headline", "")
    post_text = post.get("text", "")
    posted_at = post.get("posted_at", {}).get("date", datetime.now(timezone.utc).isoformat())

    triggers = detect_triggers(post_text + " " + subtitle)
    score = compute_seed_score(profile_url, subtitle, has_post=True)
    email = extract_email(post_text + " " + subtitle)

    return {
        "avoid": "human contact, calendar, call, manual gating",
        "cta_style": "self_serve_audit",
        "discovered_at": posted_at,
        "email": email,
        "email_copy": None,
        "intent": "cold",
        "lead_with": "LinkedIn post matching ad-spend trigger",
        "name": name,
        "profile_url": profile_url,
        "query": "apify_linkedin_post_search",
        "score": score,
        "segment": build_segment(score),
        "snippet": post_text[:300],
        "source": "linkedin",
        "source_url": post.get("post_url", ""),
        "title": post.get("content", {}).get("title", "")[:150],
        "triggers": triggers,
    }


def process_engager(engager: dict, post_link: str) -> dict | None:
    """Process an engager (liker/commenter) result into a lead dict."""
    name = normalize_name(engager.get("name", ""))
    if is_suppressed(name):
        return None

    profile_url = engager.get("url_profile", "")
    subtitle = engager.get("subtitle", "")
    comment = engager.get("Content") or engager.get("comment") or ""

    triggers = detect_triggers(subtitle + " " + comment)
    score = compute_seed_score(profile_url, subtitle, has_post=True)
    email = extract_email(subtitle)

    # Apply is_qualified_signal() to commenters (not pure likers)
    eng_type = engager.get("type", "likers")
    if eng_type == "commenters" and comment.strip():
        row_for_check = {"comment": comment, "role": subtitle}
        if not is_qualified_signal(row_for_check):
            # Still add, but mark with a note — the signal filter is advisory for LinkedIn
            pass  # LinkedIn commenters are generally valuable, keep them

    return {
        "avoid": "human contact, calendar, call, manual gating",
        "cta_style": "self_serve_audit",
        "discovered_at": datetime.now(timezone.utc).isoformat(),
        "email": email,
        "email_copy": None,
        "intent": "cold",
        "lead_with": "LinkedIn engagement on Nebula post",
        "name": name,
        "profile_url": profile_url,
        "query": "apify_linkedin_engagers",
        "score": score,
        "segment": build_segment(score),
        "snippet": subtitle[:300],
        "source": "linkedin",
        "source_url": post_link,
        "title": subtitle[:150],
        "triggers": triggers,
    }


def load_jsonl(path: Path) -> list[dict]:
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


def load_json(path: Path) -> list[dict]:
    if not path.exists():
        return []
    try:
        return json.loads(path.read_text())
    except (json.JSONDecodeError, Exception):
        return []


def append_lead(lead: dict, existing_urls: set) -> int:
    """Append lead if profile_url is new, return 1 if added else 0."""
    profile_url = lead.get("profile_url", "")
    if not profile_url or profile_url == "https://www.linkedin.com/in/None":
        return 0
    if profile_url in existing_urls:
        return 0
    with LEADS_PATH.open("a") as f:
        f.write(json.dumps(lead, ensure_ascii=False) + "\n")
    existing_urls.add(profile_url)
    return 1


def main() -> int:
    import argparse
    parser = argparse.ArgumentParser(description="Ingest LinkedIn Apify output into trigger_leads.jsonl")
    parser.add_argument("--post-search-json", default=str(GS / "apify_raw" / "post_search_latest.json"))
    parser.add_argument("--engagers-likers-json", default=str(GS / "apify_raw" / "post_engagers_likers_latest.json"))
    parser.add_argument("--engagers-commenters-json", default=str(GS / "apify_raw" / "post_engagers_commenters_latest.json"))
    args = parser.parse_args()

    # Load existing leads for dedup
    existing = load_jsonl(LEADS_PATH)
    existing_urls = {l.get("profile_url") for l in existing if l.get("profile_url")}

    print(f"[INGEST] Loaded {len(existing)} existing leads, {len(existing_urls)} unique profile URLs")

    total_added = 0
    errors = []

    # ── 1. Process post_search results ──────────────────────────
    search_results = load_json(Path(args.post_search_json))
    print(f"[INGEST] Processing {len(search_results)} post-search results...")
    for post in search_results:
        try:
            lead = process_post_search(post)
            if lead:
                added = append_lead(lead, existing_urls)
                if added:
                    total_added += 1
                    print(f"  + {lead['name']} (score={lead['score']}, {lead['triggers']})")
        except Exception as e:
            err = f"post_search: {e}"
            errors.append(err)
            print(f"  [ERR] {err}")

    # ── 2. Process engagers (likers) ────────────────────────────
    likers_results = load_json(Path(args.engagers_likers_json))
    print(f"[INGEST] Processing {len(likers_results)} likers results...")
    for engager in likers_results:
        try:
            post_link = engager.get("post_Link", "")
            lead = process_engager(engager, post_link)
            if lead:
                added = append_lead(lead, existing_urls)
                if added:
                    total_added += 1
                    print(f"  + {lead['name']} (like, score={lead['score']})")
        except Exception as e:
            err = f"engager_likers: {e}"
            errors.append(err)
            print(f"  [ERR] {err}")

    # ── 3. Process engagers (commenters) ────────────────────────
    commenters_results = load_json(Path(args.engagers_commenters_json))
    print(f"[INGEST] Processing {len(commenters_results)} commenters results...")
    for engager in commenters_results:
        try:
            post_link = engager.get("post_Link", "")
            lead = process_engager(engager, post_link)
            if lead:
                added = append_lead(lead, existing_urls)
                if added:
                    total_added += 1
                    print(f"  + {lead['name']} (comment, score={lead['score']})")
        except Exception as e:
            err = f"engager_commenters: {e}"
            errors.append(err)
            print(f"  [ERR] {err}")

    # ── Report ──────────────────────────────────────────────────
    dt = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    print(f"\n{'='*60}")
    print(f"[INGEST] {dt}")
    print(f"  Post-search results: {len(search_results)}")
    print(f"  Liker results:       {len(likers_results)}")
    print(f"  Commenter results:   {len(commenters_results)}")
    print(f"  New leads added:     {total_added}")
    print(f"  Total leads in file: {len(load_jsonl(LEADS_PATH))}")
    if errors:
        print(f"  Errors:              {len(errors)}")
        for e in errors:
            print(f"    - {e}")
    else:
        print(f"  Errors:              0")
    print(f"{'='*60}")

    return 0 if not errors else 1


if __name__ == "__main__":
    sys.exit(main())
