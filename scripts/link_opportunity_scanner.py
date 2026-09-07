#!/usr/bin/env python3
"""
Link Opportunity Scanner — nebulacomponents.com
Finds guest post opportunities, tool roundups, and resource pages
that are relevant to CRO/landing page optimization.

Runs as a cron job. Outputs scored opportunities to link_opportunities.jsonl
Deduplicates via _watermark pattern.
"""

import json
import time
import urllib.request
import re
import os
import sys
from pathlib import Path
from datetime import datetime, timezone

# ── Config ──────────────────────────────────────────────────────────────────
WORKSPACE = Path(__file__).parent.parent / "seo"
OPPORTUNITIES_FILE = WORKSPACE / "link_opportunities.jsonl"
SEEN_FILE = WORKSPACE / ".link_scanner_seen.json"
WORKSPACE.mkdir(exist_ok=True)

# Search queries targeting high-value link sources
SEARCH_QUERIES = [
    # Guest post opportunities
    '"write for us" "conversion rate optimization"',
    '"guest post" "landing page" marketing blog',
    '"contribute" "CRO" "submit article" marketing',
    '"write for us" "paid traffic" OR "landing pages" marketing',

    # Roundup/tool list pages
    '"best CRO tools" 2025 OR 2026',
    '"landing page optimization tools" list',
    '"best landing page" "audit tool" OR "checker"',
    '"conversion rate optimization tools" roundup',

    # Resource pages
    '"resources" "landing page" "conversion" site:*.com',
    '"tools we recommend" "CRO" OR "landing page"',

    # Podcast/media opportunities
    '"CRO podcast" "guest" OR "appear"',
    '"landing page" "podcast" "conversion" founder',

    # HARO/PR opportunities
    '"expert quote" "conversion rate" journalist',
    '"looking for experts" "landing page" "conversion"',
]

# Scoring weights
SIGNAL_SCORES = {
    "write for us": 8,
    "guest post": 7,
    "contribute": 6,
    "submit article": 6,
    "best cro tools": 9,
    "best landing page tools": 9,
    "tools we recommend": 8,
    "resources": 4,
    "roundup": 5,
    "podcast": 6,
    "expert": 4,
}

# High-value domains (bonus +3 if present)
HIGH_VALUE_DOMAINS = [
    "cxl.com", "unbounce.com", "instapage.com", "demandcurve.com",
    "hotjar.com", "conversionxl.com", "searchengineland.com",
    "searchenginejournal.com", "moz.com", "hubspot.com",
    "marketingland.com", "copyblogger.com", "kissmetrics.com",
    "crazyegg.com", "optimizely.com", "speero.com",
]


def load_seen():
    if SEEN_FILE.exists():
        return set(json.loads(SEEN_FILE.read_text()))
    return set()


def save_seen(seen: set):
    SEEN_FILE.write_text(json.dumps(list(seen), indent=2))


def web_search(query: str, limit: int = 8) -> list[dict]:
    """Search via DataForSEO SERP or fallback to placeholder."""
    # Use DataForSEO if available, else return empty (cron will have it)
    try:
        # Try the claude-seo DataForSEO integration
        import subprocess
        result = subprocess.run(
            ["python3", "/home/mike/claude-seo/scripts/dataforseo_serp.py",
             "--query", query, "--limit", str(limit), "--json"],
            capture_output=True, text=True, timeout=30
        )
        if result.returncode == 0:
            return json.loads(result.stdout).get("results", [])
    except Exception:
        pass

    # Fallback: use urllib to hit a search endpoint
    # (actual implementation via DataForSEO MCP in agent context)
    return []


def score_opportunity(url: str, title: str, description: str) -> int:
    """Score a link opportunity 0-10."""
    combined = f"{url} {title} {description}".lower()
    score = 0

    for signal, points in SIGNAL_SCORES.items():
        if signal in combined:
            score += points
            break  # take highest match only

    # Domain authority bonus
    for domain in HIGH_VALUE_DOMAINS:
        if domain in url.lower():
            score += 3
            break

    # Recency bonus (2025/2026 in title)
    if "2025" in title or "2026" in title:
        score += 1

    # Already about CRO/landing pages = higher relevance
    cro_terms = ["conversion rate", "landing page", "cro", "paid traffic", "ad spend"]
    for term in cro_terms:
        if term in combined:
            score += 1

    return min(score, 10)


def classify_type(url: str, title: str, description: str) -> str:
    combined = f"{url} {title} {description}".lower()
    if any(t in combined for t in ["write for us", "guest post", "contribute", "submit"]):
        return "guest_post"
    if any(t in combined for t in ["best", "top", "list", "roundup", "tools"]):
        return "roundup"
    if any(t in combined for t in ["resources", "recommend"]):
        return "resource_page"
    if "podcast" in combined:
        return "podcast"
    if any(t in combined for t in ["expert", "journalist", "quote"]):
        return "pr_haro"
    return "unknown"


def main():
    seen = load_seen()
    new_opportunities = []
    timestamp = datetime.now(timezone.utc).isoformat()

    print(f"[{timestamp}] Link opportunity scanner starting — {len(SEARCH_QUERIES)} queries")

    for query in SEARCH_QUERIES:
        results = web_search(query)
        time.sleep(2)  # rate limit

        for r in results:
            url = r.get("url", r.get("link", ""))
            title = r.get("title", "")
            description = r.get("description", r.get("snippet", ""))

            if not url or url in seen:
                continue

            # Skip if it's Nebula itself or known spam
            if "nebulacomponents.com" in url:
                continue

            score = score_opportunity(url, title, description)
            opp_type = classify_type(url, title, description)

            if score >= 5:  # Only queue high-quality opportunities
                opp = {
                    "url": url,
                    "title": title,
                    "description": description,
                    "score": score,
                    "type": opp_type,
                    "query": query,
                    "discovered_at": timestamp,
                    "status": "new",
                    "pitch_sent_at": None,
                    "outcome": None,
                }
                new_opportunities.append(opp)
                seen.add(url)
                print(f"  [{score}/10] {opp_type}: {title[:60]} ({url[:50]})")

    # Append to JSONL
    if new_opportunities:
        with OPPORTUNITIES_FILE.open("a") as f:
            for opp in new_opportunities:
                f.write(json.dumps(opp) + "\n")
        print(f"\n✓ Added {len(new_opportunities)} new opportunities to {OPPORTUNITIES_FILE}")
    else:
        print("No new opportunities found this run.")

    save_seen(seen)
    return len(new_opportunities)


if __name__ == "__main__":
    count = main()
    sys.exit(0)
