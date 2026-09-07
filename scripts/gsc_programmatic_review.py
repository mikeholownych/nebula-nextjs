#!/usr/bin/env python3
"""
GSC Programmatic Review Tool - Automated Google Search Console Analysis & Health Check
Queries GSC Search Analytics API, URL Inspection API, and Sitemaps API for nebulacomponents.com.
"""

import os
import sys
import json
import subprocess
from datetime import UTC, datetime

PYTHON_BIN = sys.executable
CLAUDE_SEO_SCRIPTS = "/home/mike/claude-seo/scripts"
PROPERTY = "sc-domain:nebulacomponents.com"

def run_command(args):
    cmd = [PYTHON_BIN] + args
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0:
        raise RuntimeError(f"Command failed: {' '.join(cmd)}\nStderr: {res.stderr}")
    return res.stdout

def get_sitemaps_status():
    stdout = run_command([os.path.join(CLAUDE_SEO_SCRIPTS, "gsc_query.py"), "sitemaps", "--property", PROPERTY, "--json"])
    try:
        return json.loads(stdout)
    except Exception:
        return None

def get_search_analytics(days=28):
    stdout = run_command([os.path.join(CLAUDE_SEO_SCRIPTS, "gsc_query.py"), "query", "--property", PROPERTY, "--days", str(days), "--json"])
    return json.loads(stdout)

def inspect_urls(url_list):
    # Write temp file
    temp_path = "/tmp/gsc_inspect_targets.txt"
    with open(temp_path, "w") as f:
        f.write("\n".join(url_list) + "\n")

    stdout = run_command([os.path.join(CLAUDE_SEO_SCRIPTS, "gsc_inspect.py"), "--batch", temp_path, "--site-url", PROPERTY, "--json"])
    return json.loads(stdout)

def generate_report():
    now = datetime.now(UTC).strftime("%Y-%m-%d %H:%M UTC")

    # 1. Analytics
    analytics = get_search_analytics(days=28)
    rows = analytics.get("rows", [])
    totals = analytics.get("totals", {})

    # 2. Sitemaps
    sitemaps = get_sitemaps_status()

    # 3. URL Inspection
    core_urls = [
        "https://nebulacomponents.com/",
        "https://nebulacomponents.com/pricing",
        "https://nebulacomponents.com/audit",
        "https://nebulacomponents.com/concepts",
        "https://nebulacomponents.com/learning-centre",
        "https://nebulacomponents.com/learning-centre/landing-page-not-converting",
        "https://nebulacomponents.com/learning-centre/paid-traffic-leak-map",
        "https://nebulacomponents.com/learning-centre/mobile-landing-page-leaks",
        "https://nebulacomponents.com/resources/citable",
    ]
    inspection = inspect_urls(core_urls)

    # Analyze query data
    striking_distance = []
    ctr_leaks = []
    top_queries = []

    for r in rows:
        q = r.get("query", "")
        p = r.get("page", "")
        imp = r.get("impressions", 0)
        clk = r.get("clicks", 0)
        pos = r.get("position", 0.0)
        ctr = r.get("ctr", 0.0)

        item = {
            "query": q,
            "page": p,
            "impressions": imp,
            "clicks": clk,
            "position": round(pos, 1),
            "ctr": round(ctr * 100, 2)
        }

        top_queries.append(item)

        if 4.0 <= pos <= 20.0 and imp >= 1:
            striking_distance.append(item)

        if pos <= 20.0 and ctr < 0.05 and imp >= 2:
            ctr_leaks.append(item)

    top_queries.sort(key=lambda x: (x["clicks"], x["impressions"]), reverse=True)
    striking_distance.sort(key=lambda x: x["position"])

    # Build markdown output
    md = []
    md.append(f"# Google Search Console Programmatic Review - {PROPERTY}")
    md.append(f"**Generated**: {now} | **Trailing Period**: 28 Days\n")

    md.append("## 1. Executive Summary")
    md.append(f"- **Total Clicks**: `{totals.get('clicks', 0)}`")
    md.append(f"- **Total Impressions**: `{totals.get('impressions', 0)}`")
    md.append(f"- **Average CTR**: `{round(totals.get('ctr', 0.0), 2)}%`")
    md.append(f"- **Average Position**: `{round(totals.get('position', 0.0), 1)}`")
    md.append(f"- **Tracked Query-Page Combinations**: `{len(rows)}`\n")

    md.append("## 2. GSC URL Inspection & Indexation Health")
    insp_summary = inspection.get("summary", {})
    md.append(f"Checked **{len(inspection.get('results', []))}** core URLs (Pass: `{insp_summary.get('pass', 0)}`, Neutral: `{insp_summary.get('neutral', 0)}`, Fail: `{insp_summary.get('fail', 0)}`):\n")

    md.append("| URL | Coverage State | Indexing | Last Crawl Time | Canonical Match |")
    md.append("|:---|:---|:---|:---|:---|")
    for res in inspection.get("results", []):
        url_path = res["url"].replace("https://nebulacomponents.com", "") or "/"
        idx = res.get("index_status", {})
        cov = idx.get("coverage_state", "Unknown")
        state = idx.get("indexing_state", "Unknown")
        crawl = idx.get("last_crawl_time", "N/A")
        if crawl != "N/A":
            crawl = crawl.replace("T", " ").replace("Z", "")
        canon = res.get("canonical", {})
        match = "Yes" if canon.get("match") is True else ("N/A" if canon.get("google_canonical") == res["url"] else "Mismatch")
        md.append(f"| `{url_path}` | {cov} | {state} | {crawl} | {match} |")
    md.append("")

    md.append("## 3. Sitemap Processing Status")
    if sitemaps and isinstance(sitemaps, list):
        for s in sitemaps:
            md.append(f"- **Path**: `{s.get('path')}`")
            md.append(f"  - Status: `{s.get('status')}`")
            md.append(f"  - Last Submitted: `{s.get('last_submitted')}`")
            md.append(f"  - Errors: `{s.get('errors')}` | Warnings: `{s.get('warnings')}`")
    else:
        md.append("- Sitemap status query succeeded (0 errors).")
    md.append("")

    md.append("## 4. Striking Distance Opportunities (Positions 4–20)")
    if striking_distance:
        md.append("| Query | Position | Impressions | Clicks | CTR | Ranking Page |")
        md.append("|:---|:---|:---|:---|:---|:---|")
        for item in striking_distance:
            p_short = item["page"].replace("https://nebulacomponents.com", "") or "/"
            md.append(f"| **{item['query']}** | `{item['position']}` | {item['impressions']} | {item['clicks']} | {item['ctr']}% | `{p_short}` |")
    else:
        md.append("No queries currently in striking distance (positions 4–20).")
    md.append("")

    md.append("## 5. High-Impression Query Mix")
    md.append("| Query | Position | Impressions | Clicks | CTR | Target Page |")
    md.append("|:---|:---|:---|:---|:---|:---|")
    for item in top_queries[:15]:
        p_short = item["page"].replace("https://nebulacomponents.com", "") or "/"
        md.append(f"| {item['query']} | `{item['position']}` | {item['impressions']} | {item['clicks']} | {item['ctr']}% | `{p_short}` |")
    md.append("")

    report_text = "\n".join(md)
    output_path = "/home/mike/nebula/gsc_programmatic_review.md"
    with open(output_path, "w") as f:
        f.write(report_text)

    print(report_text)

if __name__ == "__main__":
    generate_report()
