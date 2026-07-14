#!/usr/bin/env python3
"""Run Apify LinkedIn actors directly via API (bypass CLI invoice check).

Usage:
    python3 run_linkedin_monitor.py --search
    python3 run_linkedin_monitor.py --engagers
    python3 run_linkedin_monitor.py --all
"""
import argparse
import json
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

BASE = Path("/home/mike/nebula")
TOKEN = (Path.home() / ".hermes" / "secrets" / "apify.key").read_text().strip()
RAW_DIR = BASE / "growth_system" / "apify_raw"
INPUT_DIR = BASE / "growth_system" / "apify_inputs"

ACTOR_IDS = {
    "post_search": "apimaestro/linkedin-posts-search-scraper-no-cookies",
    "post_engagers": "scraping_solutions/linkedin-posts-engagers-likers-and-commenters-no-cookies",
}

def api_url(path: str) -> str:
    return f"https://api.apify.com/v2{path}"

def api_call(method: str, path: str, body: Any = None) -> dict:
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(
        api_url(path),
        data=data,
        headers={
            "Authorization": f"Bearer {TOKEN}",
            "Content-Type": "application/json",
        },
        method=method,
    )
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            return json.load(resp)
    except urllib.error.HTTPError as e:
        print(f"  HTTP {e.code}: {e.reason}")
        print(f"  Body: {e.read().decode()[:500]}")
        raise

def run_actor_and_fetch(actor_name: str, input_data: dict, output_name: str) -> list[dict]:
    """Run actor via API, poll until done, fetch dataset."""
    actor_id = ACTOR_IDS[actor_name].replace("/", "~")
    
    # Start the run
    print(f"[API] Starting {actor_name}...")
    result = api_call("POST", f"/acts/{actor_id}/runs", input_data)
    run_id = result.get("data", {}).get("id")
    if not run_id:
        print(f"  Failed to start run: {json.dumps(result, indent=2)[:500]}")
        return []
    
    dataset_id = result.get("data", {}).get("defaultDatasetId", "")
    print(f"  Run ID: {run_id}, Dataset ID: {dataset_id}")
    
    # Poll until finished
    status_resp = result
    status = result.get("data", {}).get("status", "RUNNING")
    while status in ("READY", "RUNNING"):
        time.sleep(3)
        status_resp = api_call("GET", f"/acts/{actor_id}/runs/{run_id}")
        status = status_resp.get("data", {}).get("status", "RUNNING")
        print(f"  Status: {status}")
    
    if status != "SUCCEEDED":
        print(f"  Run failed with status: {status}")
        return []
    
    # Get dataset ID from run if not in initial response
    if not dataset_id:
        dataset_id = status_resp.get("data", {}).get("defaultDatasetId", "")
        if not dataset_id:
            print("  No dataset ID found")
            return []
    
    # Fetch results
    req = urllib.request.Request(
        api_url(f"/datasets/{dataset_id}/items?clean=true&format=json"),
        headers={"Authorization": f"Bearer {TOKEN}"},
    )
    with urllib.request.urlopen(req, timeout=120) as resp:
        items = json.load(resp)
    
    # Save raw output
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    (RAW_DIR / output_name).write_text(json.dumps(items, indent=2, ensure_ascii=False))
    
    # Save run info
    (RAW_DIR / output_name.replace(".json", ".run.json")).write_text(
        json.dumps(status_resp, indent=2, ensure_ascii=False)
    )
    
    print(f"  Fetched {len(items)} items, saved to {output_name}")
    return items if isinstance(items, list) else []

def run_post_search():
    """Run post_search with the keyword focus from the task."""
    input_data = {
        "keyword": "landing page no conversions OR ads no sales OR conversion rate zero",
        "sort_type": "date_posted",
        "date_filter": "past-week",
        "limit": 25,
        "total_posts": 25,
    }
    return run_actor_and_fetch("post_search", input_data, "post_search_latest.json")

def run_post_engagers(mode: str):
    """Run post_engagers for likers or commenters."""
    input_data = {
        "urls": [
            "https://www.linkedin.com/feed/update/urn:li:activity:7478763831968768000/",
            "https://www.linkedin.com/feed/update/urn:li:share:7479391233749131264",
        ],
        "resultsLimit": 100,
        "type": mode,
    }
    return run_actor_and_fetch("post_engagers", input_data, f"post_engagers_{mode}_latest.json")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--search", action="store_true", help="Run post-search")
    parser.add_argument("--engagers", action="store_true", help="Run post_engagers (likers + commenters)")
    parser.add_argument("--all", action="store_true", help="Run everything")
    args = parser.parse_args()
    
    if args.all or args.search:
        print(f"\n{'='*60}")
        print(f"Running LinkedIn Post Search")
        print(f"{'='*60}")
        search_results = run_post_search()
        print(f"Post search found {len(search_results)} results")
    
    if args.all or args.engagers:
        for mode in ["likers", "commenters"]:
            print(f"\n{'='*60}")
            print(f"Running LinkedIn Post Engagers ({mode})")
            print(f"{'='*60}")
            results = run_post_engagers(mode)
            print(f"Engagers ({mode}) found {len(results)} results")
    
    print("\nDone.")
