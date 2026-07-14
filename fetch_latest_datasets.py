#!/usr/bin/env python3
"""Re-fetch latest datasets from Apify and save locally."""
import json
import urllib.error
import urllib.request
from pathlib import Path

TOKEN = (Path.home() / ".hermes" / "secrets" / "apify.key").read_text().strip()
RAW_DIR = Path("/home/mike/nebula/growth_system/apify_raw")
BASE = "https://api.apify.com/v2"

def api_get(path):
    req = urllib.request.Request(
        f"{BASE}{path}",
        headers={"Authorization": f"Bearer {TOKEN}"},
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        return json.load(resp)

def fetch_dataset(ds_id, filename):
    items = api_get(f"/datasets/{ds_id}/items?clean=true&format=json")
    if items is None:
        print(f"  No items for {ds_id}")
        return 0
    (RAW_DIR / filename).write_text(json.dumps(items, indent=2, ensure_ascii=False))
    print(f"  Fetched {len(items) if isinstance(items, list) else '?'} items -> {filename}")
    return len(items) if isinstance(items, list) else 0

# Map run start -> dataset by querying actor runs
engagers_actor = "scraping_solutions~linkedin-posts-engagers-likers-and-commenters-no-cookies"
runs = api_get(f"/acts/{engagers_actor}/runs?limit=8&desc=1")
items = runs.get("data", {}).get("items", [])

# Sort by startedAt to find likers vs commenters
engagers_runs = []
for r in items:
    ds_id = r.get("defaultDatasetId", "")
    if not ds_id:
        continue
    # Get first item to determine type
    ds_items = api_get(f"/datasets/{ds_id}/items?clean=true&format=json&limit=2")
    if isinstance(ds_items, list) and len(ds_items) > 0:
        first = ds_items[0]
        dtype = first.get("type", first.get("engagement_type", "unknown"))
        engagers_runs.append({
            "run_id": r["id"],
            "dataset_id": ds_id,
            "type": dtype,
            "started": r.get("startedAt", ""),
            "finished": r.get("finishedAt", ""),
            "count": len(ds_items) if isinstance(ds_items, list) else 0,
        })
        print(f"Run {r['id'][:10]} ({dtype}) @ {r['finishedAt'][:19]} : dataset={ds_id}, items={engagers_runs[-1]['count']}")

# Pick the latest likers and commenters datasets
likers = [r for r in engagers_runs if r["type"] == "likers"]
commenters = [r for r in engagers_runs if r["type"] == "commenters"]

print("\n--- Fetching latest datasets ---")

# Post search - July 9 dataset
print("\n[post_search]")
fetch_dataset("G6EsXgOb9fuPcDHmq", "post_search_latest.json")

if likers:
    latest_likers = max(likers, key=lambda r: r["started"])
    print(f"\n[engagers likers] Latest: {latest_likers['dataset_id']} ({latest_likers['finished']})")
    fetch_dataset(latest_likers["dataset_id"], "post_engagers_likers_latest.json")

if commenters:
    latest_commenters = max(commenters, key=lambda r: r["started"])
    print(f"\n[engagers commenters] Latest: {latest_commenters['dataset_id']} ({latest_commenters['finished']})")
    fetch_dataset(latest_commenters["dataset_id"], "post_engagers_commenters_latest.json")
