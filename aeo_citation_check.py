#!/usr/bin/env python3
"""AEO Citation Checker — score Reddit threads for AI-citability.

Two modes:
  1. Standalone: python3 aeo_citation_check.py "Brand Name"
     → Uses Apify to search Reddit + scores threads
  2. Pipeline data: python3 aeo_citation_check.py --from-pipeline
     → Reads existing scraped threads from pipeline and scores them

Outputs structured JSON with recommendations.
"""

import argparse, json, re, sys, time, urllib.request, urllib.parse
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

BASE = Path(__file__).parent
APIFY_KEY_FILE = Path.home() / ".hermes/secrets/apify.key"
APIFY_ACTOR = "trudax~reddit-scraper-lite"
REDDIT_DEDUP = BASE / "reddit_scraped_ids.jsonl"

# ── AEO Subreddit Tiers ──────────────────────────────────────────────────────
# Based on analysis of which subreddits ChatGPT/Perplexity cite most frequently
# for product-recommendation queries.
AEO_TIER_1 = {"SaaS", "startups", "Entrepreneur", "SEO", "PPC", "marketing"}
AEO_TIER_2 = {"smallbusiness", "indiehackers", "growthhacking", "digital_marketing",
              "webdev", "RoastMyWebsite", "roastmystartup", "SideProject",
              "juststart", "askmarketing", "EntrepreneurRideAlong", "sales"}

REDDIT_UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36"


# ── Citation Scoring ─────────────────────────────────────────────────────────
# Each signal carries a score delta. Base = 50, clamped to [0, 100].
CITATION_WEIGHTS = {
    "body_contains_url":    13,
    "op_has_karma":         8,
    "detailed_body":        12,
    "technical_depth":      10,
    "question_in_title":    8,
    "howto_format":         10,
    "comparison_format":    12,
    "listing_format":       8,
    "high_engagement":      15,
    "no_comments":         -5,
    "tier1_subreddit":     10,
    "tier2_subreddit":      5,
    "anti_aeo_subreddit": -15,
    "vendor_projection":  -25,
    "low_effort":         -10,
}


def score_thread(post: dict) -> dict:
    """Score a Reddit post's likelihood of being cited by AI models."""
    signals = []
    score = 50
    title = (post.get("title") or "").lower()
    body = (post.get("body") or post.get("selftext") or "").lower()
    combined = title + " " + body
    subreddit = (post.get("subreddit") or "").lower()
    body_len = len(body)
    num_comments = post.get("num_comments", 0)

    # Body signals
    if re.search(r"https?://", body):
        score += CITATION_WEIGHTS["body_contains_url"]
        signals.append("body_contains_url")
    if body_len > 500:
        score += CITATION_WEIGHTS["detailed_body"]
        signals.append("detailed_body")
    elif 0 < body_len < 100:
        score += CITATION_WEIGHTS["low_effort"]
        signals.append("low_effort")

    # Technical depth
    if re.search(r"\b(api|code|data|metric|revenue|conversion|a/b|split test|"
                 r"statistical|cohort|lift|churn|lifetime value)", combined):
        score += CITATION_WEIGHTS["technical_depth"]
        signals.append("technical_depth")

    # Title format signals
    if re.search(r"^(what|how|why|where|which|should|does|can|do|is|are)\b", title):
        score += CITATION_WEIGHTS["question_in_title"]
        signals.append("question_in_title")
    if re.search(r"\b(how to|guide|walkthrough|tutorial|step by|strategy for)", combined):
        score += CITATION_WEIGHTS["howto_format"]
        signals.append("howto_format")
    if re.search(r"\b(best|vs |versus|alternative|compare|top \d)", combined):
        score += CITATION_WEIGHTS["comparison_format"]
        signals.append("comparison_format")
    if re.search(r"(?:^|\n)\s*[-\*\d+\.]\s+\w", body[:500]):
        score += CITATION_WEIGHTS["listing_format"]
        signals.append("listing_format")

    # Engagement
    if num_comments >= 10:
        score += CITATION_WEIGHTS["high_engagement"]
        signals.append("high_engagement")
    elif num_comments == 0 and body_len > 0:
        score += CITATION_WEIGHTS["no_comments"]
        signals.append("no_comments")

    # Subreddit
    if subreddit in {s.lower() for s in AEO_TIER_1}:
        score += CITATION_WEIGHTS["tier1_subreddit"]
        signals.append("tier1_subreddit")
    elif subreddit in {s.lower() for s in AEO_TIER_2}:
        score += CITATION_WEIGHTS["tier2_subreddit"]
        signals.append("tier2_subreddit")

    # Penalties
    if re.search(r"\b(my app|my tool|my product|my startup|my saas|check out|"
                 r"sign up|download here|use code|discount|promo|I built|"
                 r"I created|I (just )?launch)", combined):
        score += CITATION_WEIGHTS["vendor_projection"]
        signals.append("vendor_projection")

    return {
        "score": max(0, min(100, score)),
        "signals": signals,
        "is_promo": "vendor_projection" in signals,
    }


def score_label(s: int) -> str:
    if s < 15: return "Invisible"
    if s < 30: return "Minimal"
    if s < 50: return "Developing"
    if s < 70: return "Visible"
    if s < 85: return "Strong"
    return "Excellent"


# ── Data sources ─────────────────────────────────────────────────────────────

def load_pipeline_data() -> list[dict]:
    """Load Reddit threads from pipeline's data files (richest available)."""
    threads = []

    # Priority 1: trigger_leads.jsonl (has title, snippet, source_url)
    trigger_file = BASE / "trigger_leads.jsonl"
    if trigger_file.exists():
        for line in trigger_file.read_text().splitlines():
            try:
                entry = json.loads(line)
                threads.append({
                    "title": entry.get("title", ""),
                    "body": entry.get("snippet", ""),
                    "subreddit": _extract_subreddit(entry.get("source_url", "")),
                    "url": entry.get("source_url", ""),
                    "num_comments": 0,
                    "author": "",
                    "source": "trigger_leads",
                })
            except json.JSONDecodeError:
                continue

    # Priority 2: reddit_scraped_ids.jsonl (IDs + URLs only, fallback)
    if REDDIT_DEDUP.exists():
        for line in REDDIT_DEDUP.read_text().splitlines():
            try:
                entry = json.loads(line)
                threads.append({
                    "id": entry.get("id", ""),
                    "url": entry.get("url", ""),
                    "title": "",
                    "body": "",
                    "subreddit": _extract_subreddit(entry.get("url", "")),
                    "num_comments": 0,
                    "author": "",
                    "source": "scraped_ids",
                })
            except json.JSONDecodeError:
                continue

    return threads


def _extract_subreddit(url: str) -> str:
    """Extract subreddit name from a Reddit URL."""
    m = re.search(r"reddit\.com/r/(\w+)", url)
    return m.group(1) if m else ""


def apify_reddit_search(query: str, token: str) -> list[dict]:
    """Search Reddit via Apify actor (same as ramp pipeline)."""
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }
    payload = {
        "startUrls": [
            {"url": f"https://www.reddit.com/search/?q={urllib.parse.quote(query)}&sort=new&t=year"}
        ],
        "maxItems": 15,
    }
    try:
        import requests as reqs
        r = reqs.post(
            f"https://api.apify.com/v2/acts/{APIFY_ACTOR}/runs?waitForFinish=30",
            json=payload, headers=headers, timeout=40,
        )
        if r.ok:
            run = r.json().get("data", {})
            ds = run.get("defaultDatasetId", "")
            if ds:
                r2 = reqs.get(
                    f"https://api.apify.com/v2/datasets/{ds}/items?clean=true&format=json&limit=30",
                    headers=headers, timeout=10,
                )
                return r2.json() if r2.ok else []
    except Exception as e:
        print(f"  [apify] Error: {e}", file=sys.stderr)
    return []


def search_reddit_for_brand(brand: str) -> list[dict]:
    """Search Reddit via Apify + pipeline data for brand mentions."""
    all_posts = []
    seen_urls = set()

    # 1. Check pipeline data first (free)
    pipeline_threads = load_pipeline_data()
    for p in pipeline_threads:
        url = p.get("url") or p.get("link") or ""
        text = (p.get("title") or "") + " " + (p.get("body") or p.get("selftext") or "")
        if brand.lower() in text.lower():
            if url and url not in seen_urls:
                seen_urls.add(url)
                all_posts.append(p)

    # 2. Search via Apify
    apify_token = None
    try:
        apify_token = APIFY_KEY_FILE.read_text().strip()
    except Exception:
        pass

    if apify_token:
        for term in [brand, brand.split(".")[0] if "." in brand else brand]:
            if len(term) < 3:
                continue
            results = apify_reddit_search(term, apify_token)
            for p in results:
                url = p.get("url") or p.get("link") or ""
                if url and url not in seen_urls:
                    seen_urls.add(url)
                    all_posts.append(p)
            time.sleep(0.5)

    # Dedup by title similarity
    seen_titles = set()
    deduped = []
    for p in all_posts:
        norm = re.sub(r"[^a-z0-9]", "", (p.get("title") or "").lower())[:40]
        if norm not in seen_titles or not norm:
            seen_titles.add(norm)
            deduped.append(p)

    return deduped


# ── Analysis ─────────────────────────────────────────────────────────────────

def analyze_threads(threads: list[dict], brand: str = "") -> dict:
    """Score all threads and produce AEO analysis."""
    scored = []
    for p in threads:
        analysis = score_thread(p)
        scored.append({
            "url": p.get("url") or p.get("link") or f"https://reddit.com{p.get('permalink','')}",
            "title": p.get("title", ""),
            "body_snippet": (p.get("body") or p.get("selftext") or "")[:300],
            "subreddit": p.get("subreddit", ""),
            "author": p.get("author") or p.get("username") or "",
            "num_comments": p.get("num_comments", 0),
            "created_utc": p.get("created_utc"),
            "aeo_score": analysis["score"],
            "aeo_signals": analysis["signals"],
            "is_promo": analysis["is_promo"],
        })

    # Sort by AEO score desc
    scored.sort(key=lambda x: x.get("aeo_score", 0), reverse=True)

    # Stats
    high = sum(1 for t in scored if t["aeo_score"] >= 70)
    medium = sum(1 for t in scored if 40 <= t["aeo_score"] < 70)
    low = sum(1 for t in scored if t["aeo_score"] < 40)
    promo = sum(1 for t in scored if t["is_promo"])
    top_subreddits = {s.lower() for s in AEO_TIER_1 | AEO_TIER_2}
    tier1_t2 = sum(1 for t in scored if t.get("subreddit", "").lower() in top_subreddits)

    # Overall score: weighted combination of top-thread quality + volume
    top_5 = scored[:5]
    avg_top = sum(t["aeo_score"] for t in top_5) / max(len(top_5), 1) if top_5 else 0
    volume_bonus = min(15, len(scored) * 1.5)
    promo_penalty = promo * 5
    overall = int(avg_top * 0.7 + volume_bonus - promo_penalty)
    overall = max(0, min(100, overall))

    return {
        "brand": brand or "pipeline_data",
        "analyzed_at": datetime.now(timezone.utc).isoformat(),
        "thread_count": len(scored),
        "high_potential": high,
        "medium_potential": medium,
        "low_potential": low,
        "promotional": promo,
        "aeo_friendly_subreddits": tier1_t2,
        "citation_score": overall,
        "score_label": score_label(overall),
        "recommendations": _generate_recs(brand or "pipeline", scored, overall),
        "top_threads": scored[:10],
    }


def _generate_recs(brand: str, threads: list[dict], score: int) -> list[str]:
    """Generate actionable AEO recommendations."""
    recs = []
    high_quality = [t for t in threads if t["aeo_score"] >= 70]
    promo = [t for t in threads if t["is_promo"]]
    tier1 = [t for t in threads if t.get("subreddit", "").lower() in {s.lower() for s in AEO_TIER_1}]

    if not threads:
        recs.append(f"**No Reddit threads found** for '{brand}'. "
                     f"Start by creating 1 high-quality thread/week in r/SaaS answering "
                     f"a buying-intent question with specific data and URLs.")
        return recs

    if score < 20:
        recs.append(f"Most threads lack citation signals. Add URLs, "
                     f"technical depth, and ensure the OP account has history.")
    elif score < 40:
        recs.append(f"Some foundation exists ({len(threads)} threads). "
                     f"Focus on thread depth: aim for 500+ word bodies with "
                     f"data-backed claims and external URLs.")

    if promo:
        recs.append(f"⚠️ {len(promo)} thread(s) flagged as promotional. "
                     f"AI deprioritizes self-promo. Lead with value first.")

    if high_quality:
        recs.append(f"{len(high_quality)} high-scoring thread(s) (≥70/100). "
                     f"These are AI citation candidates. Monitor engagement weekly.")

    no_urls = [t for t in threads if "body_contains_url" not in t.get("aeo_signals", [])]
    if no_urls and len(no_urls) == len(threads):
        recs.append("**No threads contain external URLs** — the #1 signal for AI citation. "
                     "Add data-source links to existing threads.")

    if tier1:
        recs.append(f"Good subreddit placement: {len(tier1)} thread(s) in r/{', r/'.join(list({t['subreddit'] for t in tier1})[:3])}. "
                     f"Double down on these subreddits with structured how-to content.")
    else:
        recs.append("Consider posting in tier-1 AEO subreddits: r/SaaS, r/startups, "
                     "r/Entrepreneur for highest AI citation probability.")

    if score < 30:
        recs.append(f"**Priority**: Write one detailed 'How we solved [X]' post in r/SaaS "
                     f"(800+ words, data, URLs, numbered steps).")
    elif score < 60:
        recs.append(f"**Next**: Pick your best thread and deepen it — add case-study "
                     f"data, fix the title to match a buyer question, ensure external URLs.")
    else:
        recs.append(f"Maintain momentum: 2-3 expert threads/month. Monitor competitor "
                     f"citation share of voice.")

    return recs


# ── CLI ──────────────────────────────────────────────────────────────────────

def print_report(result: dict):
    """Pretty-print the analysis report."""
    print(f"\n{'='*60}")
    label = result.get("score_label", "")
    print(f"🔍 AEO Citation Report — {result.get('brand', '?')}")
    print(f"{'='*60}")
    print()

    threads = result.get("top_threads", [])
    if not threads:
        print("No threads found.")
    else:
        print(f"📋 Reddit Threads: {result['thread_count']} total")
        print(f"   • High citation potential: {result['high_potential']} (≥70/100)")
        print(f"   • Medium: {result['medium_potential']} (40-69)")
        print(f"   • Low: {result['low_potential']} (<40)")
        print(f"   • In AEO-friendly subreddits: {result['aeo_friendly_subreddits']}")
        if result.get("promotional"):
            print(f"   • ⚠️ Promotional/self-promo: {result['promotional']}")
        print()

        print("   Top threads by citation potential:")
        for i, t in enumerate(threads[:5], 1):
            signals = ", ".join(t.get("aeo_signals", [])[:4])
            print(f"   {i}. [{t['aeo_score']:3d}/100] r/{t['subreddit']}")
            print(f"      {t['title'][:90]}")
            print(f"      💬 {t['num_comments']} comments | {signals}")
            print()

    print(f"{'─'*40}")
    print(f"🏆 AEO Citation Score: {result['citation_score']}/100 — {label}")
    print()

    recs = result.get("recommendations", [])
    if recs:
        print("💡 Recommendations:")
        for i, r in enumerate(recs, 1):
            print(f"   {i}. {r}")
    print()


def main():
    parser = argparse.ArgumentParser(
        description="AEO Citation Checker — score Reddit AI-citability",
    )
    parser.add_argument("brand", nargs="?",
                        help="Brand name or domain to check (uses Apify search)")
    parser.add_argument("--from-pipeline", action="store_true",
                        help="Analyze existing pipeline scraped data")
    parser.add_argument("--json", type=str, nargs="?", const="-", default=None,
                        help="Save JSON output to file (omit path = stdout)")

    args = parser.parse_args()

    if args.from_pipeline:
        threads = load_pipeline_data()
        result = analyze_threads(threads, brand="pipeline_data")
        if args.json:
            _output_json(result, args.json)
        else:
            print_report(result)
        return

    if not args.brand:
        parser.print_help()
        sys.exit(1)

    print(f"Searching Reddit for '{args.brand}'...")
    threads = search_reddit_for_brand(args.brand)
    result = analyze_threads(threads, brand=args.brand)

    if args.json:
        _output_json(result, args.json)
    else:
        print_report(result)


def _output_json(data: dict, dest: str):
    output = json.dumps(data, indent=2, default=str)
    if dest == "-":
        print(output)
    else:
        Path(dest).write_text(output)
        print(f"Saved to {dest}")


if __name__ == "__main__":
    main()
