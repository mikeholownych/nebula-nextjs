#!/usr/bin/env python3
"""Try Apify API directly to bypass CLI invoice check."""
import json, os, sys, urllib.request
from pathlib import Path

TOKEN = (Path.home() / ".hermes" / "secrets" / "apify.key").read_text().strip()

# Try to list runs for our actors to see API status
actors = {
    "post_search": "apimaestro~linkedin-posts-search-scraper-no-cookies",
}

for name, actor_id in actors.items():
    req = urllib.request.Request(
        f"https://api.apify.com/v2/acts/{actor_id}/runs?limit=1&desc=1",
        headers={"Authorization": f"Bearer {TOKEN}"},
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = json.load(resp)
            print(f"{name}: {json.dumps(data, indent=2)[:500]}")
    except urllib.error.HTTPError as e:
        print(f"{name}: HTTP {e.code} - {e.reason}")
        body = e.read().decode()
        print(f"  Body: {body[:500]}")
