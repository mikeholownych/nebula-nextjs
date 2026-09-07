#!/usr/bin/env python3
"""
Unlinked Brand Mention Monitor — nebulacomponents.com
Finds pages that mention Nebula Components without linking.
Silent if no new unlinked mentions.
"""
import json
import urllib.request
import urllib.parse
import re
from pathlib import Path
from datetime import datetime, timezone
import os
import base64

WORKSPACE = Path(__file__).parent.parent / "seo"
SEEN_FILE = WORKSPACE / "ledger/mentions_seen.json"
OPPS_FILE = WORKSPACE / "link_opportunities.jsonl"
WORKSPACE.mkdir(exist_ok=True)
(WORKSPACE / "ledger").mkdir(exist_ok=True)

SEARCH_QUERIES = [
    '"Nebula Components" -site:nebulacomponents.com -site:nebulacomponents.shop',
    '"nebulacomponents.com" -site:nebulacomponents.com',
]

def load_seen() -> set:
    if SEEN_FILE.exists():
        return set(json.loads(SEEN_FILE.read_text()))
    return set()

def save_seen(seen: set):
    SEEN_FILE.write_text(json.dumps(list(seen), indent=2))

def dataforseo_search(query: str) -> list[dict]:
    """Search via DataForSEO SERP API."""
    env_files = [Path.home() / '.hermes/.env', Path('/home/mike/nebula/.env')]
    username = password = None
    for ef in env_files:
        if ef.exists():
            for line in ef.read_text().splitlines():
                if line.startswith('DATAFORSEO_USERNAME=') or line.startswith('DATAFORSEO_LOGIN='):
                    username = line.split('=', 1)[1].strip().strip('"\'')
                elif line.startswith('DATAFORSEO_PASSWORD=') or line.startswith('DATAFORSEO_KEY='):
                    password = line.split('=', 1)[1].strip().strip('"\'')
    if not username or not password:
        return []
    
    creds = base64.b64encode(f"{username}:{password}".encode()).decode()
    payload = json.dumps([{"keyword": query, "location_code": 2840, "language_code": "en", "depth": 10}]).encode()
    req = urllib.request.Request(
        "https://api.dataforseo.com/v3/serp/google/organic/live/advanced",
        data=payload,
        headers={"Authorization": f"Basic {creds}", "Content-Type": "application/json"},
        method="POST"
    )
    try:
        resp = json.loads(urllib.request.urlopen(req, timeout=20).read())
        results = []
        for task in resp.get("tasks", []):
            for item in task.get("result", [{}])[0].get("items", []):
                if item.get("type") == "organic":
                    results.append({
                        "url": item.get("url", ""),
                        "title": item.get("title", ""),
                        "description": item.get("description", ""),
                    })
        return results
    except Exception:
        return []

def page_has_link(url: str) -> bool:
    """Check whether the page links to nebulacomponents.com."""
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        html = urllib.request.urlopen(req, timeout=10).read().decode("utf-8", errors="ignore")
        return "nebulacomponents.com" in html
    except Exception:
        return True  # assume linked on error to avoid false positives

def main():
    seen = load_seen()
    new_mentions = []
    timestamp = datetime.now(timezone.utc).isoformat()

    for query in SEARCH_QUERIES:
        results = dataforseo_search(query)
        for r in results:
            url = r.get("url", "")
            if not url or url in seen:
                continue
            if "nebulacomponents.com" in url:
                continue
            # Skip obvious false positives (astronomy, Eclipse project, unrelated Nebula repos)
            skip_domains = ["eclipse.dev", "github.com/NebulaUI", "youtube.com", "facebook.com",
                            "linkedin.com", "mozilla", "space", "astronomy", "telescope"]
            if any(s.lower() in url.lower() for s in skip_domains):
                seen.add(url)
                continue
            # Require the description/title to reference conversion, landing page, or audit
            combined = (r.get("title","") + r.get("description","")).lower()
            if not any(x in combined for x in ["conversion", "landing page", "audit", "cro", "nebulacomponents"]):
                seen.add(url)
                continue
            seen.add(url)
            if not page_has_link(url):
                opp = {
                    "url": url,
                    "title": r.get("title", ""),
                    "description": r.get("description", "")[:150],
                    "score": 7,
                    "type": "unlinked_mention",
                    "query": query,
                    "discovered_at": timestamp,
                    "status": "new",
                    "pitch_sent_at": None,
                    "outcome": None,
                }
                new_mentions.append(opp)
                print(f"UNLINKED MENTION: {url}")
                print(f"  {r.get('title', '')[:70]}")

    if new_mentions:
        with OPPS_FILE.open("a") as f:
            for m in new_mentions:
                f.write(json.dumps(m) + "\n")

    save_seen(seen)

if __name__ == "__main__":
    main()
