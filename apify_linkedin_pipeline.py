#!/usr/bin/env python3
"""Run Nebula's Apify LinkedIn actor stack through the authenticated Apify CLI."""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import urllib.request
from pathlib import Path
from typing import Any

BASE = Path(__file__).resolve().parent
GS = BASE / "growth_system"
INPUT_DIR = GS / "apify_inputs"
RAW_DIR = GS / "apify_raw"
CONFIG_PATH = GS / "apify_actor_config.json"

ACTORS = {
    "post_search": "apimaestro/linkedin-posts-search-scraper-no-cookies",
    "post_engagers": "scraping_solutions/linkedin-posts-engagers-likers-and-commenters-no-cookies",
    "profile_enrich": "harvestapi/linkedin-profile-scraper",
    "company_enrich": "harvestapi/linkedin-company",
    "profile_search_fallback": "harvestapi/linkedin-profile-search",
}

DEFAULT_TRIGGER_QUERY = 'ad spend OR zero conversions OR landing page pain OR not converting OR no demos'
DEFAULT_OWNED_POSTS = [
    "https://www.linkedin.com/feed/update/urn:li:activity:7478763831968768000/",
    "https://www.linkedin.com/feed/update/urn:li:share:7479391233749131264",
    ]
OWNED_PAGES = {"startup spotlight canada", "ai syndicate", "mike holownych", "mike h"}


def ensure_dirs() -> None:
    INPUT_DIR.mkdir(parents=True, exist_ok=True)
    RAW_DIR.mkdir(parents=True, exist_ok=True)


def write_json(path: Path, payload: Any) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n")
    return path


def canonical_linkedin_company_url(url: str) -> str:
    if "/company/" not in url:
        return url
    prefix, rest = url.split("/company/", 1)
    slug = rest.split("/")[0].split("?")[0]
    return f"{prefix}/company/{slug}"


def load_jsonl(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        return []
    rows = []
    for line in path.read_text().splitlines():
        if line.strip():
            rows.append(json.loads(line))
    return rows


def build_inputs() -> dict[str, Path]:
    ensure_dirs()
    paths = {
        "post_search": write_json(INPUT_DIR / "post_search.json", {
            "keyword": DEFAULT_TRIGGER_QUERY,
            "sort_type": "date_posted",
            "date_filter": "past-week",
            "limit": 25,
            "total_posts": 25,
        }),
        "post_engagers_likers": write_json(INPUT_DIR / "post_engagers_likers.json", {
            "urls": DEFAULT_OWNED_POSTS,
            "resultsLimit": 100,
            "type": "likers",
        }),
        "post_engagers_commenters": write_json(INPUT_DIR / "post_engagers_commenters.json", {
            "urls": DEFAULT_OWNED_POSTS,
            "resultsLimit": 100,
            "type": "commenters",
        }),
        "profile_search_fallback": write_json(INPUT_DIR / "profile_search_fallback.json", {
            "profileScraperMode": "Short",
            "searchQuery": "Founder paid ads landing page",
            "maxItems": 25,
            "recentlyPostedOnLinkedIn": True,
            "currentJobTitles": ["Founder", "CEO", "CMO", "Head of Growth"],
            "companyHeadcount": ["B", "C", "D"],
        }),
    }

    profile_urls = []
    for row in load_jsonl(GS / "linkedin_engager_pipeline.jsonl"):
        name = str(row.get("name", "")).strip().lower()
        url = row.get("profile_url")
        if url and name not in OWNED_PAGES and "/in/" in str(url):
            profile_urls.append(url)
    profile_urls = list(dict.fromkeys(profile_urls))[:10]
    paths["profile_enrich"] = write_json(INPUT_DIR / "profile_enrich.json", {
        "profileScraperMode": "Profile details no email ($4 per 1k)",
        "queries": profile_urls,
    })

    company_urls = []
    for row in load_jsonl(GS / "linkedin_engager_pipeline.jsonl"):
        name = str(row.get("name", "")).strip().lower()
        if name in OWNED_PAGES:
            continue
        url = row.get("company_url") or row.get("company_linkedin_url")
        profile_url = row.get("profile_url")
        if url:
            company_urls.append(canonical_linkedin_company_url(str(url)))
        elif profile_url and "/company/" in str(profile_url):
            company_urls.append(canonical_linkedin_company_url(str(profile_url)))
    company_urls = list(dict.fromkeys(company_urls))[:10]
    paths["company_enrich"] = write_json(INPUT_DIR / "company_enrich.json", {"companies": company_urls})

    config = {
        "actors": ACTORS,
        "owned_pages_suppressed": sorted(OWNED_PAGES),
        "input_files": {k: str(v.relative_to(BASE)) for k, v in paths.items()},
        "policy": {
            "primary": "post_engagers on owned/high-signal posts",
            "secondary": "post_search for trigger post discovery",
            "enrich_after_signal_only": True,
            "avoid": ["cookie actors", "LinkedIn DM senders", "inbox automation"],
        },
    }
    write_json(CONFIG_PATH, config)
    return paths


def apify_token() -> str:
    token = os.getenv("APIFY_TOKEN") or os.getenv("APIFY_API_TOKEN")
    if token:
        return token.strip()
    secret = Path.home() / ".hermes" / "secrets" / "apify.key"
    return secret.read_text().strip()


def fetch_dataset(dataset_id: str) -> list[dict[str, Any]]:
    req = urllib.request.Request(
        f"https://api.apify.com/v2/datasets/{dataset_id}/items?clean=true&format=json",
        headers={"Authorization": f"Bearer {apify_token()}"},
    )
    with urllib.request.urlopen(req, timeout=120) as response:
        return json.load(response)


def extract_dataset_id(run_info: Any) -> str:
    if isinstance(run_info, dict):
        if run_info.get("defaultDatasetId"):
            return run_info["defaultDatasetId"]
        for key in ("data", "lastRun"):
            if isinstance(run_info.get(key), dict):
                dataset_id = extract_dataset_id(run_info[key])
                if dataset_id:
                    return dataset_id
    return ""


def last_run_dataset_from_cli(actor: str) -> str:
    # CLI list output can exceed terminal caps; use Apify API for the last run lookup.
    actor_id = actor.replace("/", "~")
    req = urllib.request.Request(
        f"https://api.apify.com/v2/acts/{actor_id}/runs?limit=1&desc=1",
        headers={"Authorization": f"Bearer {apify_token()}"},
    )
    with urllib.request.urlopen(req, timeout=120) as response:
        listing = json.load(response)
    items = listing.get("data", {}).get("items", [])
    return extract_dataset_id(items[0]) if items else ""


def run_actor(actor: str, input_file: Path, output_name: str) -> Path:
    ensure_dirs()
    cmd = [
        "apify", "actors", "call", actor,
        "--input-file", str(input_file),
        "--json",
    ]
    proc = subprocess.run(cmd, cwd=BASE, text=True, capture_output=True, timeout=900)
    if proc.returncode != 0:
        raise RuntimeError(f"actor failed: {actor}\nSTDOUT:\n{proc.stdout}\nSTDERR:\n{proc.stderr}")
    run_info = json.loads(proc.stdout.strip() or "{}")
    dataset_id = extract_dataset_id(run_info) or last_run_dataset_from_cli(actor)
    if not dataset_id:
        raise RuntimeError(f"actor run had no defaultDatasetId: {actor}\n{json.dumps(run_info)[:1000]}")
    data = fetch_dataset(dataset_id)
    out = RAW_DIR / output_name
    write_json(out, data)
    write_json(RAW_DIR / output_name.replace(".json", ".run.json"), run_info)
    return out


def copy_to_ingest(raw_path: Path) -> None:
    target = GS / "apify_linkedin_engagers.json"
    target.write_text(raw_path.read_text())


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("command", choices=[
        "setup",
        "smoke-post-search", "smoke-owned-engagers", "smoke-profile-enrich", "smoke-company-enrich",
        "run-post-search", "run-owned-engagers", "run-profile-enrich", "run-company-enrich", "run-profile-search-fallback",
    ])
    args = parser.parse_args()
    paths = build_inputs()

    if args.command == "setup":
        print(json.dumps({"configured": True, "config": str(CONFIG_PATH), "inputs": {k: str(v) for k, v in paths.items()}}, indent=2))
        return

    if args.command in {"smoke-post-search", "run-post-search"}:
        if args.command.startswith("smoke"):
            smoke = dict(json.loads(paths["post_search"].read_text()))
            smoke["limit"] = 5
            smoke["total_posts"] = 5
            input_file = write_json(INPUT_DIR / "post_search_smoke.json", smoke)
            out_name = "post_search_smoke.json"
        else:
            input_file = paths["post_search"]
            out_name = "post_search_latest.json"
        out = run_actor(ACTORS["post_search"], input_file, out_name)
        print(json.dumps({"actor": ACTORS["post_search"], "raw_output": str(out), "purpose": "discovery_only; feed selected post URLs into post_engagers before DM"}, indent=2))
        return

    if args.command in {"smoke-owned-engagers", "run-owned-engagers"}:
        if args.command.startswith("smoke"):
            smoke = dict(json.loads(paths["post_engagers_likers"].read_text()))
            smoke["resultsLimit"] = 5
            input_file = write_json(INPUT_DIR / "post_engagers_likers_smoke.json", smoke)
            out_name = "post_engagers_likers_smoke.json"
        else:
            input_file = paths["post_engagers_likers"]
            out_name = "post_engagers_likers_latest.json"
        out = run_actor(ACTORS["post_engagers"], input_file, out_name)
        if args.command == "run-owned-engagers":
            copy_to_ingest(out)
        print(json.dumps({"actor": ACTORS["post_engagers"], "raw_output": str(out), "ingest_source": str(GS / "apify_linkedin_engagers.json") if args.command == "run-owned-engagers" else None}, indent=2))
        return

    if args.command in {"smoke-profile-enrich", "run-profile-enrich"}:
        payload = json.loads(paths["profile_enrich"].read_text())
        if args.command.startswith("smoke"):
            payload["queries"] = payload.get("queries", [])[:2]
            input_file = write_json(INPUT_DIR / "profile_enrich_smoke.json", payload)
            out_name = "profile_enrich_smoke.json"
        else:
            input_file = paths["profile_enrich"]
            out_name = "profile_enrich_latest.json"
        if not payload.get("queries"):
            print(json.dumps({"actor": ACTORS["profile_enrich"], "skipped": "no profile URLs available"}, indent=2))
            return
        out = run_actor(ACTORS["profile_enrich"], input_file, out_name)
        print(json.dumps({"actor": ACTORS["profile_enrich"], "raw_output": str(out)}, indent=2))
        return

    if args.command in {"smoke-company-enrich", "run-company-enrich"}:
        payload = json.loads(paths["company_enrich"].read_text())
        if args.command.startswith("smoke"):
            payload["companies"] = payload.get("companies", [])[:2]
            input_file = write_json(INPUT_DIR / "company_enrich_smoke.json", payload)
            out_name = "company_enrich_smoke.json"
        else:
            input_file = paths["company_enrich"]
            out_name = "company_enrich_latest.json"
        if not payload.get("companies"):
            print(json.dumps({"actor": ACTORS["company_enrich"], "skipped": "no company URLs available"}, indent=2))
            return
        out = run_actor(ACTORS["company_enrich"], input_file, out_name)
        print(json.dumps({"actor": ACTORS["company_enrich"], "raw_output": str(out)}, indent=2))
        return

    if args.command == "run-profile-search-fallback":
        out = run_actor(ACTORS["profile_search_fallback"], paths["profile_search_fallback"], "profile_search_fallback_latest.json")
        print(json.dumps({"actor": ACTORS["profile_search_fallback"], "raw_output": str(out), "warning": "fallback source only; lower intent than engagers"}, indent=2))
        return


if __name__ == "__main__":
    main()
