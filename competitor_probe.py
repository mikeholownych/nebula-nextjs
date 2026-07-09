#!/usr/bin/env python3
"""Competitor Thread Probe — detect competitor mentions in Reddit posts.

Hooks into the ramp pipeline. Scans processed posts for competitor brand
names and logs matches for outreach/reply opportunities.

Usage (standalone):
    python3 competitor_probe.py --scan-file trigger_leads.jsonl
    python3 competitor_probe.py --recent         # scan recent pipeline data

All competitor data from competitive/ dir is auto-loaded.
"""

import json, re, sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

BASE = Path(__file__).parent
COMPETITIVE_DIR = BASE / "competitive"
TRIGGER_LEADS = BASE / "trigger_leads.jsonl"
OUTREACH_FILE = BASE / "competitor_mentions.jsonl"

# ── Hard-coded competitor patterns ───────────────────────────────────────────
# These augment the auto-loaded list from competitive/ dir.
# Format: {keyword: {"name": "Display Name", "category": "tool_type"}}
# Keywords are matched case-insensitively in post title + body.
COMPETITOR_PATTERNS = {
    # Landing page tools
    "unbounce":       {"name": "Unbounce",         "category": "landing_page_builder"},
    "instapage":      {"name": "Instapage",        "category": "landing_page_builder"},
    "leadpages":      {"name": "Leadpages",        "category": "landing_page_builder"},
    "clickfunnels":   {"name": "ClickFunnels",     "category": "funnel_builder"},
    "swipe pages":    {"name": "Swipe Pages",      "category": "landing_page_builder"},
    "carrd":          {"name": "Carrd",            "category": "landing_page_builder"},
    
    # CRO / analytics
    "hotjar":         {"name": "Hotjar",           "category": "analytics_heatmap"},
    "fullstory":      {"name": "FullStory",        "category": "analytics_session"},
    "lucky orange":   {"name": "Lucky Orange",     "category": "analytics_session"},
    "crazy egg":      {"name": "Crazy Egg",        "category": "analytics_heatmap"},
    "ms clarity":     {"name": "Microsoft Clarity","category": "analytics_heatmap"},
    "vwo":            {"name": "VWO",              "category": "cro_platform"},
    "optimizely":     {"name": "Optimizely",       "category": "cro_platform"},
    "google optimize":{"name": "Google Optimize",  "category": "cro_platform"},
    "convertize":     {"name": "Convertize",       "category": "cro_platform"},
    
    # A/B testing
    "google analytics":{"name": "Google Analytics", "category": "analytics"},
    "amplitude":      {"name": "Amplitude",        "category": "analytics_product"},
    "mixpanel":       {"name": "Mixpanel",         "category": "analytics_product"},
    "plausible":      {"name": "Plausible",        "category": "analytics_privacy"},
    "fathom":         {"name": "Fathom Analytics", "category": "analytics_privacy"},
    
    # AI marketing / agents
    "trustos":        {"name": "TrustOS",          "category": "ai_marketing_agent"},
    "flagstad":       {"name": "Flagstad/TrustOS", "category": "ai_marketing_agent"},
    "swayyem":        {"name": "SwayyEm",          "category": "ai_visibility"},
    "matt shealy":    {"name": "SwayyEm",          "category": "ai_visibility"},
    "psyke":          {"name": "Psyke",            "category": "ai_search_visibility"},
    "guillaume ang":  {"name": "Psyke",            "category": "ai_search_visibility"},
    "instantly":      {"name": "Instantly",        "category": "email_outreach"},
    "smartlead":      {"name": "Smartlead",        "category": "email_outreach"},
    "lemlist":        {"name": "Lemlist",          "category": "email_outreach"},
    "woodpecker":     {"name": "Woodpecker",       "category": "email_outreach"},
    "mailshake":      {"name": "Mailshake",        "category": "email_outreach"},
    "reply.io":       {"name": "Reply.io",         "category": "email_outreach"},
    
    # SEO / content
    "ahrefs":         {"name": "Ahrefs",           "category": "seo_tool"},
    "semrush":        {"name": "Semrush",          "category": "seo_tool"},
    "moz":            {"name": "Moz",              "category": "seo_tool"},
    "screaming frog": {"name": "Screaming Frog",   "category": "seo_technical"},
    "surfer seo":     {"name": "Surfer SEO",       "category": "seo_content"},
    
    # Paid ads
    "metas ads":      {"name": "Meta Ads",         "category": "paid_ads"},
    "google ads":     {"name": "Google Ads",       "category": "paid_ads"},
    "facebook ads":   {"name": "Facebook Ads",     "category": "paid_ads"},
    "linkedin ads":   {"name": "LinkedIn Ads",     "category": "paid_ads"},
    "tiktok ads":     {"name": "TikTok Ads",       "category": "paid_ads"},
    
    # Sales outreach
    "yokr":           {"name": "Yokr",             "category": "sales_outreach_agent"},
    "11x":            {"name": "11x",              "category": "sales_outreach_agent"},
    "artisan":        {"name": "Artisan AI",       "category": "sales_outreach_agent"},
    "clay":           {"name": "Clay",             "category": "sales_enrichment"},
    "apify":          {"name": "Apify",            "category": "web_scraping"},
    "bright data":    {"name": "Bright Data",      "category": "web_scraping"},
}

# Intent categories — posts mentioning these categories have buying intent
INTENT_CATEGORIES = {
    "cro_platform":  "running a/b tests or heatmap tools — likely to need audit",
    "analytics_heatmap": "session recording — may not know their conversion problem",
    "landing_page_builder": "building landing pages — natural audit prospect",
    "email_outreach": "doing cold email — complementary to landing page audit",
    "paid_ads": "running ads — core ICP signal",
    "analytics": "has analytics — needs conversion diagnosis",
    "seo_tool": "invested in SEO — likely to understand audit value",
    "ai_marketing_agent": "using AI marketing tools — competitive intelligence",
    "ai_search_visibility": "competitor in AEO space — high intelligence value",
    "sales_outreach_agent": "using AI SDR — complementary service",
}


def load_competitors_from_directory() -> dict:
    """Load additional competitor names from competitive/ analysis files."""
    competitors = {}
    if not COMPETITIVE_DIR.exists():
        return competitors

    for f in sorted(COMPETITIVE_DIR.glob("*.jsonl")):
        try:
            for line in f.read_text().splitlines():
                if not line.strip():
                    continue
                data = json.loads(line)
                # Extract site/name
                site = data.get("site") or data.get("competitor") or ""
                name = data.get("name") or data.get("product") or ""
                category = data.get("category", "unknown")

                # Add domain-based pattern
                if site and "." in site and "@" not in site:
                    domain = re.sub(r"https?://", "", site).split("/")[0]
                    base = domain.split(".")[0]
                    if len(base) > 3:
                        competitors[base.lower()] = {
                            "name": domain,
                            "category": category or "competitive_intel",
                            "source_file": f.name,
                        }

                # Add name-based pattern
                if name and len(name) > 3:
                    for word in name.split()[:2]:
                        if len(word) > 3:
                            competitors[word.lower()] = {
                                "name": name,
                                "category": category or "competitive_intel",
                                "source_file": f.name,
                            }
        except Exception:
            continue

    return competitors


def build_patterns() -> dict:
    """Build full competitor pattern dict: keyword → info."""
    patterns = dict(COMPETITOR_PATTERNS)
    # Load from competitive/ dir
    dir_competitors = load_competitors_from_directory()
    for kw, info in dir_competitors.items():
        if kw not in patterns:  # Don't override manual patterns
            patterns[kw] = info
    return patterns


def detect_competitor_mentions(
    text: str,
    title: str = "",
    patterns: Optional[dict] = None,
) -> list[dict]:
    """Scan text for competitor mentions. Returns list of matches."""
    if patterns is None:
        patterns = build_patterns()

    matches = []
    combined = (title + " " + text).lower()

    for keyword, info in patterns.items():
        if keyword in combined:
            matches.append({
                "keyword": keyword,
                "name": info["name"],
                "category": info.get("category", "unknown"),
                "intent": INTENT_CATEGORIES.get(info.get("category", ""), "general"),
            })

    # Deduplicate by name
    seen_names = set()
    deduped = []
    for m in matches:
        if m["name"] not in seen_names:
            seen_names.add(m["name"])
            deduped.append(m)

    return deduped


def scan_lead_file(filepath: Path) -> list[dict]:
    """Scan a trigger_leads.jsonl file for competitor mentions."""
    results = []
    if not filepath.exists():
        return results

    patterns = build_patterns()

    for line in filepath.read_text().splitlines():
        if not line.strip():
            continue
        try:
            record = json.loads(line)
        except json.JSONDecodeError:
            continue

        title = record.get("title", "")
        snippet = record.get("snippet", "")
        source_url = record.get("source_url", "")
        email_copy_body = record.get("email_copy", {}).get("body", "")

        matches = detect_competitor_mentions(
            text=snippet + " " + email_copy_body,
            title=title,
            patterns=patterns,
        )

        if matches:
            entry = {
                "detected_at": datetime.now(timezone.utc).isoformat(),
                "source_url": source_url,
                "title": title,
                "snippet": snippet[:200],
                "mentions": matches,
                "categories": list(set(m["category"] for m in matches)),
                "has_buying_intent": any(
                    m["category"] in ("paid_ads", "landing_page_builder", "analytics_heatmap", "cro_platform")
                    for m in matches
                ),
            }
            results.append(entry)

    return results


def append_outreach_log(entries: list[dict]):
    """Append competitor mentions to the outreach log."""
    for entry in entries:
        OUTREACH_FILE.parent.mkdir(parents=True, exist_ok=True)
        with open(OUTREACH_FILE, "a") as f:
            f.write(json.dumps(entry) + "\n")


def print_report(results: list[dict]):
    """Pretty-print competitor mention results."""
    if not results:
        print("No competitor mentions found.")
        return

    # Group by competitor name
    from collections import Counter
    mention_counts = Counter()
    for r in results:
        for m in r.get("mentions", []):
            mention_counts[m["name"]] += 1

    print(f"\n📊 Competitor Mentions: {len(results)} posts, {len(mention_counts)} unique brands")
    print()
    print("   Most mentioned:")
    for name, count in mention_counts.most_common(10):
        print(f"   • {name}: {count}x")

    buying = [r for r in results if r.get("has_buying_intent")]
    if buying:
        print(f"\n🎯 Posts with buying intent + competitor mention: {len(buying)}")
        for r in buying[:5]:
            names = ", ".join(m["name"] for m in r.get("mentions", []))
            print(f"   • {r['title'][:60]}")
            print(f"     Mentions: {names}")
            if r.get("source_url"):
                print(f"     {r['source_url']}")

    print()
    print(f"Logged to: {OUTREACH_FILE}")


def main():
    import argparse
    parser = argparse.ArgumentParser(
        description="Competitor Thread Probe — detect brand mentions in Reddit posts"
    )
    parser.add_argument("--scan-file", type=str,
                        help="Path to trigger_leads.jsonl to scan")
    parser.add_argument("--recent", action="store_true",
                        help="Scan recent pipeline data (trigger_leads.jsonl)")
    parser.add_argument("--print-patterns", action="store_true",
                        help="Print competitor patterns and exit")

    args = parser.parse_args()

    if args.print_patterns:
        patterns = build_patterns()
        print(f"Competitor patterns ({len(patterns)} keywords):")
        for kw, info in sorted(patterns.items()):
            print(f"  '{kw:20s}' → {info['name']:25s} ({info.get('category','?')})")
        return

    filepath = None
    if args.scan_file:
        filepath = Path(args.scan_file)
    elif args.recent:
        filepath = TRIGGER_LEADS

    if filepath:
        results = scan_lead_file(filepath)
        print_report(results)
        if results:
            append_outreach_log(results)
        return

    parser.print_help()


if __name__ == "__main__":
    main()
