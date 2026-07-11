#!/usr/bin/env python3
"""
apify_trigger_feed.py — ingest Apify LinkedIn raw JSON → trigger_leads.jsonl with TrustOS scoring.

Pipeline path:
  ~/nebula/growth_system/apify_raw/{post_engagers,post_search}*.json → trigger_leads.jsonl

Scoring (seed):
  • +1 base discovery
  • +1 if profile_url valid (enriched)
  • +1 if subtitle contains trigger keywords (founder, ads, spend, conversion)
  • +1 if role matches founder/ceo/owner
  • +1 if post indicates active authority/engagement
  Total seed: 1–5 (initial score)

Segmentation:
  cold:   ≤ 7
  warm:  8–14
  hot:    ≥ 15  (audit opened/replied)
  terminal: bounced or blocked

TrustOS marks used:
  reply: +3   (via audit reply monitor)
  audit consumed: +3
  audit requested: +5
  email sent: +1
  hard bounce: -5
  spam complaint: -10
  decay: -2 per 30 days(already applied in engine)
"""

from __future__ import annotations

import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

NEBULA = Path("/home/mike/nebula")
LEADS_PATH = NEBULA / "trigger_leads.jsonl"
CONTACTED_PATH = NEBULA / "contacted.json"
APIFY_RAW = NEBULA / "growth_system" / "apify_raw"

# Suppressed owner/pages (ignore)
SUPPRESSED = {
    "mike holownych",
    "ai syndicate",
    "mike h",
    "startup spotlight canada",
    "nebula components",
    "nebula components shop"
}

TRIGGER_PATTERNS = {
    "ad_bleed": r'\bad spend\b|\bgoogle ads\b|\bfacebook ads\b|\bpaid traffic\b|\bcpc\b',
    "zero_conversions": r'\bzero conversions\b|\b0 conversions\b|\bnot converting\b|\bno sales\b|\bno signups\b'
}

ROLE_TRIGGERS = {'founder', 'ceo', 'owner', 'cofounder', 'co-founder', 'entrepreneur', 'hiring', 'scaling'}

def load_contacted() -> set[str]:
    """Load contacted email or LinkedIn URLs."""
    if CONTACTED_PATH.exists():
        with CONTACTED_PATH.open() as f:
            data = json.load(f)
        return set(data.get("emails", [])) | set(data.get("linkedin", []))
    return set()

def normalize_name(name: str) -> str:
    """Remove extra whitespace/punctuation."""
    return re.sub(r'\s+', ' ', name.strip())

def detect_triggers(text: str) -> list[str]:
    """Find buying triggers in subtitle/post text."""
    triggers = []
    low = text.lower()
    for trigger_label, pattern in TRIGGER_PATTERNS.items():
        if re.search(pattern, low, re.IGNORECASE):
            triggers.append(trigger_label)
    return triggers

def role_match(subtitle: str) -> bool:
    """Does subtitle contain founder/CEO/owner keywords."""
    low = subtitle.lower()
    return any(role in low for role in ROLE_TRIGGERS)

def compute_seed_score(entry: dict[str, Any]) -> int:
    """Compute initial TrustOS score 1–5."""
    score = 1  # Base discovery
    if entry.get("url_profile") and "ACo" in entry["url_profile"]:
        score += 1
    subtitle = entry.get("subtitle", "")
    if detect_triggers(subtitle):
        score += 1
    if role_match(subtitle):
        score += 1
    # Active engagement bonus (liked/commented a Nebula-relevant post)
    if "post_Link" in entry:
        score += 1
    return min(score, 5)

def build_segment(score: int) -> str:
    """Segment mapping according to TrustOS docs."""
    if score <= 7:
        return "cold"
    elif score <= 20:
        return "warm"
    else:
        return "hot"

def extract_email(text: str) -> str | None:
    """Extract first email-like pattern from text."""
    m = re.search(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', text)
    return m.group(0) if m else None

def apify_post_to_lead(post: dict[str, Any]) -> dict[str, Any] | None:
    """Convert Apify post_search result to lead entry."""
    author = post.get("author", {})
    name = normalize_name(author.get("name", ""))
    subtitle = author.get("headline", "")
    profile_url = author.get("profile_url", "")
    post_text = post.get("text", "")
    posted_at = post.get("posted_at", {}).get("date", datetime.now(timezone.utc).isoformat())

    # Skip suppressed matches
    if any(supp in name.lower() for supp in SUPPRESSED):
        return None

    triggers = detect_triggers(post_text + " " + subtitle)
    if not triggers:
        triggers = []  # keep going, still valuable

    score = compute_seed_score({
        "url_profile": profile_url,
        "subtitle": subtitle,
        "post_Link": post.get("post_url", "")
    })

    # Try to find email in post text or subtitle
    email = extract_email(post_text + " " + subtitle)

    return {
        "avoid": "human contact, calendar, call, manual gating",
        "cta_style": "self_serve_audit",
        "discovered_at": posted_at,
        "email": email,
        "email_copy": None,  # engine fills later
        "intent": "cold",
        "lead_with": "LinkedIn post matching ad‑spend trigger",
        "name": name,
        "profile_url": profile_url,
        "query": "apify_linkedin_post_search",
        "score": score,
        "segment": build_segment(score),
        "snippet": post_text[:300],
        "source": "apify_post_search",
        "source_url": post.get("post_url", ""),
        "title": post.get("content", {}).get("title", "")[:150],
        "triggers": triggers,
    }

def apify_engager_to_lead(engager: dict[str, Any], post_link: str) -> dict[str, Any] | None:
    """Convert Apify engager (liker/commenter) to lead entry."""
    name = normalize_name(engager.get("name", ""))
    subtitle = engager.get("subtitle", "")
    profile_url = engager.get("url_profile", "")

    if any(supp in name.lower() for supp in SUPPRESSED):
        return None

    triggers = detect_triggers(subtitle)
    score = compute_seed_score({
        "url_profile": profile_url,
        "subtitle": subtitle,
        "post_Link": post_link
    })

    email = extract_email(subtitle)

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
        "source": "apify_linkedin_engagers",
        "source_url": post_link,
        "title": subtitle[:150],
        "triggers": triggers,
    }

def load_apify_json(path: Path) -> list[dict[str, Any]]:
    """Safely load JSON array."""
    if not path.exists():
        return []
    try:
        with path.open() as f:
            return json.load(f)
    except json.JSONDecodeError:
        return []

def main() -> int:
    contacted = load_contacted()
    existing_urls = {l.get("profile_url") for l in load_apify_json(LEADS_PATH) if l.get("profile_url")}
    
    leads_added = 0

    # Process post_search results
    search_path = APIFY_RAW / "post_search_latest.json"
    for post in load_apify_json(search_path):
        lead = apify_post_to_lead(post)
        if not lead:
            continue
        profile_url = lead.get("profile_url")
        if profile_url and profile_url in contacted:
            continue
        if profile_url and profile_url in existing_urls:
            continue
        # Write to trigger_leads.jsonl
        with LEADS_PATH.open("a") as f:
            f.write(json.dumps(lead) + "\n")
        leads_added += 1
        existing_urls.add(profile_url)

    # Process engagers (likers/commenters)
    engagers_path = APIFY_RAW / "post_engagers_likers_latest.json"
    for engager in load_apify_json(engagers_path):
        lead = apify_engager_to_lead(engager, engager.get("post_Link", ""))
        if not lead:
            continue
        profile_url = lead.get("profile_url")
        if profile_url and profile_url in contacted:
            continue
        if profile_url and profile_url in existing_urls:
            continue
        with LEADS_PATH.open("a") as f:
            f.write(json.dumps(lead) + "\n")
        leads_added += 1
        existing_urls.add(profile_url)

    # Log outcome
    dt = datetime.now(timezone.utc).strftime("%Y‑%m‑dT%H:%M:%S")
    sys.stdout.write(f"{dt} Apify trigger feed added {leads_added} leads\n")
    return 0

if __name__ == "__main__":
    sys.exit(main())
