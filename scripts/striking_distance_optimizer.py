#!/usr/bin/env python3
"""
Striking-Distance Keyword Optimizer
Identifies GSC queries in positions 4-20 and outputs targeted content optimization proposals.
"""

import sys
import os
import json
import subprocess
from datetime import datetime

CLAUDE_SEO_SCRIPTS = "/home/mike/claude-seo/scripts"
PROPERTY = "sc-domain:nebulacomponents.com"

def get_search_analytics():
    cmd = [
        sys.executable,
        os.path.join(CLAUDE_SEO_SCRIPTS, "gsc_query.py"),
        "query",
        "--property", PROPERTY,
        "--days", "28",
        "--json"
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0:
        raise RuntimeError(f"GSC query failed: {res.stderr}")
    return json.loads(res.stdout)

def main():
    now = datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
    analytics = get_search_analytics()
    rows = analytics.get("rows", [])

    striking = []
    for r in rows:
        pos = r.get("position", 0.0)
        if 4.0 <= pos <= 20.0:
            striking.append({
                "query": r.get("query"),
                "page": r.get("page"),
                "position": round(pos, 1),
                "impressions": r.get("impressions", 0),
                "clicks": r.get("clicks", 0),
                "ctr": round(r.get("ctr", 0.0) * 100, 2)
            })

    striking.sort(key=lambda x: x["position"])

    md = []
    md.append(f"# Striking-Distance Keyword Action Plan - {PROPERTY}")
    md.append(f"**Generated**: {now} | **Target Range**: Positions #4 to #20\n")

    if not striking:
        md.append("No queries currently in striking distance.")
    else:
        md.append(f"Found **{len(striking)}** high-potential queries ready for page #1 optimization:\n")
        md.append("| Target Keyword | Current Position | Impressions | Ranking Page | Proposed Content Action |")
        md.append("|:---|:---|:---|:---|:---|")

        for item in striking:
            q = item["query"]
            pos = item["position"]
            imp = item["impressions"]
            page_short = item["page"].replace("https://nebulacomponents.com", "") or "/"

            # Action logic
            if "b2b saas" in q.lower():
                action = "Add dedicated section on B2B SaaS buyer friction & ROI proof signals"
            elif "brand radar" in q.lower():
                action = "Expand Citable documentation with Brand Radar search citation benchmarks"
            elif "fail to convert" in q.lower() or "not converting" in q.lower():
                action = "Insert direct FAQ entity schema for 'why landing pages fail to convert'"
            else:
                action = f"Add dedicated H2 subheading targeting '{q}' and add 2 internal links"

            md.append(f"| **{q}** | `{pos}` | {imp} | `{page_short}` | {action} |")

    report_content = "\n".join(md) + "\n"
    out_file = "/home/mike/nebula/striking_distance_action_plan.md"
    with open(out_file, "w") as f:
        f.write(report_content)

    print(report_content)

if __name__ == "__main__":
    main()
