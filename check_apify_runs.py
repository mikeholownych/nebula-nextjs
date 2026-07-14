#!/usr/bin/env python3
"""Check Apify account for available datasets and recent runs."""
import json, urllib.request
from pathlib import Path

TOKEN = (Path.home() / ".hermes" / "secrets" / "apify.key").read_text().strip()
BASE = "https://api.apify.com/v2"

def api_get(path):
    req = urllib.request.Request(
        f"{BASE}{path}",
        headers={"Authorization": f"Bearer {TOKEN}"},
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.load(resp)
    except urllib.error.HTTPError as e:
        print(f"  HTTP {e.code}: {e.reason}")
        print(f"  Body: {e.read().decode()[:500]}")
        return None

# Check recent runs for both actors
for name, actor in [
    ("post_search", "apimaestro~linkedin-posts-search-scraper-no-cookies"),
    ("post_engagers", "scraping_solutions~linkedin-posts-engagers-likers-and-commenters-no-cookies"),
]:
    print(f"\n=== {name} ({actor}) ===")
    result = api_get(f"/acts/{actor}/runs?limit=3&desc=1")
    if result:
        runs = result.get("data", {}).get("items", [])
        for r in runs:
            ds_id = r.get("defaultDatasetId", "N/A")
            status = r.get("status", "N/A")
            started = r.get("startedAt", "N/A")
            finished = r.get("finishedAt", "N/A")
            print(f"  Run: {r.get('id')} | Status: {status} | Dataset: {ds_id}")
            print(f"       Started: {started} | Finished: {finished}")
            # Try fetching dataset
            if ds_id and ds_id != "N/A":
                ds = api_get(f"/datasets/{ds_id}/items?clean=true&format=json&limit=1")
                if ds:
                    if isinstance(ds, list):
                        print(f"       Items count: {len(ds)} (showing 1)")
                    elif isinstance(ds, dict):
                        print(f"       Items count: {ds.get('data', {}).get('total', '?')}")
