#!/usr/bin/env python3
"""ICAHN title research for the Nebula Audits channel.

Finds PROVEN video concepts in the landing-page-audit niche — videos with
views >= 5x the uploader's subscriber count (ideally small channels with
mediocre titles/thumbnails we can out-execute). Method from Shane Hummus'
YouTube automation playbook ("ICAHN": look for videos with 5x more views
than the channel's subs, then take the proven concept and make it better).

Usage:
  python3 yt_channel/title_research.py [--queries "q1|q2|q3"|--json]

Outputs:
  - prints a ranked report of ICAHN candidates
  - writes yt_channel/logs/title_research_<date>.jsonl (all hits + pattern stats)

Quota: search.list=100 units each, videos.list=1, channels.list=1.
6 queries x 10 results ≈ 650 units of the 10,000/day budget.
"""

import sys, json, logging
from pathlib import Path
from datetime import datetime, timezone
from collections import Counter

NEBULA_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(NEBULA_DIR))
# Add venv site-packages (python3.12 hack used by orchestrator)
sys.path.insert(0, str(NEBULA_DIR / "venv" / "lib" / "python3.12" / "site-packages"))

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("title_research")

LOG_DIR = NEBULA_DIR / "yt_channel" / "logs"
LOG_DIR.mkdir(parents=True, exist_ok=True)

DEFAULT_QUERIES = [
    "landing page teardown",
    "landing page audit",
    "website audit conversion",
    "why is my landing page not converting",
    "CRO teardown",
    "landing page review 2026",
]

ICAHN_RATIO = 5.0  # views / subs threshold


def research(queries: list[str]) -> list[dict]:
    from yt_channel.upload import _get_authenticated_service
    svc = _get_authenticated_service()
    results = []
    for q in queries:
        log.info(f"Searching: {q}")
        try:
            resp = svc.search().list(
                part="snippet", q=q, type="video",
                maxResults=10, relevanceLanguage="en",
            ).execute()
        except Exception as e:
            log.warning(f"Search failed for {q}: {e}")
            continue
        for item in resp.get("items", []):
            vid = item["id"]["videoId"]
            ch = item["snippet"]["channelId"]
            title = item["snippet"]["title"]
            channel = item["snippet"]["channelTitle"]
            try:
                views = int(svc.videos().list(part="statistics", id=vid)
                            .execute()["items"][0]["statistics"].get("viewCount", 0))
            except Exception:
                views = 0
            try:
                subs = int(svc.channels().list(part="statistics", id=ch)
                           .execute()["items"][0]["statistics"].get("subscriberCount", 0))
            except Exception:
                subs = 0
            ratio = round(views / subs, 2) if subs else 0.0
            results.append({
                "query": q,
                "video_id": vid,
                "title": title,
                "channel": channel,
                "views": views,
                "subs": subs,
                "view_subs_ratio": ratio,
                "icahn_candidate": subs > 0 and ratio >= ICAHN_RATIO,
            })
    return results


def pattern_stats(results: list[dict]) -> dict:
    """Shallow title-pattern analysis to inform our own title templates."""
    first_words = Counter()
    has_year = has_number = has_question = has_colon = 0
    for r in results:
        t = r["title"]
        words = t.split()
        if words:
            first_words[words[0].lower().strip("“”\"'")] += 1
        if any(y in t for y in ("2024", "2025", "2026")):
            has_year += 1
        if any(c.isdigit() for c in t):
            has_number += 1
        if "?" in t:
            has_question += 1
        if ":" in t or "—" in t or "–" in t:
            has_colon += 1
    n = len(results) or 1
    return {
        "top_first_words": first_words.most_common(8),
        "pct_with_year": round(100 * has_year / n),
        "pct_with_number": round(100 * has_number / n),
        "pct_with_question": round(100 * has_question / n),
        "pct_with_colon": round(100 * has_colon / n),
    }


def main():
    import argparse
    parser = argparse.ArgumentParser(description="ICAHN title research for Nebula Audits")
    parser.add_argument("--queries", default=None, help="Pipe-separated queries")
    parser.add_argument("--json", action="store_true", help="Emit machine-readable report")
    args = parser.parse_args()

    queries = args.queries.split("|") if args.queries else DEFAULT_QUERIES
    results = research(queries)
    if not results:
        log.error("No results returned — check OAuth/quota.")
        sys.exit(1)

    stamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    out = LOG_DIR / f"title_research_{stamp}.jsonl"
    with open(out, "w") as f:
        for r in results:
            f.write(json.dumps(r) + "\n")

    candidates = [r for r in results if r["icahn_candidate"]]
    stats = pattern_stats(results)

    report = {
        "timestamp": stamp,
        "total_hits": len(results),
        "icahn_candidates": len(candidates),
        "patterns": stats,
        "top_candidates": sorted(candidates, key=lambda r: r["view_subs_ratio"], reverse=True)[:15],
    }
    log_file = LOG_DIR / f"title_research_{stamp}.json"
    log_file.write_text(json.dumps(report, indent=2))

    if args.json:
        print(json.dumps(report, indent=2))
        return

    print("\n=== ICAHN candidates (views >= 5x subs) ===")
    if not candidates:
        print("  none found in this sample")
    for r in report["top_candidates"]:
        print(f"  [{r['view_subs_ratio']:>6.1f}x] {r['views']:>9,} views | "
              f"{r['subs']:>8,} subs | {r['channel'][:22]:<22} | {r['title'][:70]}")
    print(f"\n=== Title pattern stats (all {len(results)} hits) ===")
    for word, c in stats["top_first_words"]:
        print(f"  first-word '{word}': {c}")
    print(f"  % with year: {stats['pct_with_year']} | % with number: {stats['pct_with_number']} | "
          f"% with question: {stats['pct_with_question']} | % with colon: {stats['pct_with_colon']}")
    print(f"\nFull report: {log_file}")


if __name__ == "__main__":
    main()
