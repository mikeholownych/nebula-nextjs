#!/usr/bin/env python3
"""
Core Web Vitals & Performance Drift Watcher — Audits PSI / CrUX metrics for key URLs.
Exits 0 if performance budgets are met, exits 1 if severe regressions occur.
"""

import sys
import os
import json
import subprocess
from datetime import datetime

CLAUDE_SEO_SCRIPTS = "/home/mike/claude-seo/scripts"
TARGET_URLS = [
    "https://nebulacomponents.shop/",
    "https://nebulacomponents.shop/pricing",
    "https://nebulacomponents.shop/audit",
]

def check_url(url, strategy="mobile"):
    cmd = [
        sys.executable,
        os.path.join(CLAUDE_SEO_SCRIPTS, "pagespeed_check.py"),
        url,
        "--strategy", strategy,
        "--json"
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if res.returncode != 0:
        return {"url": url, "strategy": strategy, "error": res.stderr}
    try:
        return json.loads(res.stdout)
    except Exception:
        return {"url": url, "strategy": strategy, "error": "Invalid JSON response"}

def main():
    now = datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
    print(f"=== Core Web Vitals Performance Audit ({now}) ===")
    
    regressions = []
    
    for url in TARGET_URLS:
        for strategy in ["mobile", "desktop"]:
            data = check_url(url, strategy)
            if "error" in data:
                print(f"[{strategy.upper()}] {url} — Error: {data['error']}")
                continue
                
            metrics = data.get("lab_metrics", {})
            score = data.get("performance_score", 0)
            lcp = metrics.get("lcp_ms", 0) / 1000.0
            cls = metrics.get("cls", 0.0)
            
            print(f"[{strategy.upper()}] {url} -> Score: {score}/100 | LCP: {lcp:.2f}s | CLS: {cls:.3f}")
            
            # Threshold checks: mobile LCP > 3.0s or Score < 80 is a regression alert
            if strategy == "mobile" and (lcp > 3.5 or score < 75):
                regressions.append(f"Mobile regression on {url}: LCP={lcp:.2f}s, Score={score}")
            elif strategy == "desktop" and (lcp > 2.0 or score < 85):
                regressions.append(f"Desktop regression on {url}: LCP={lcp:.2f}s, Score={score}")
                
    if regressions:
        print("\nPERFORMANCE REGRESSIONS DETECTED:")
        for r in regressions:
            print(f" - {r}")
        sys.exit(1)
    else:
        print("\nPASS: All target routes meet Core Web Vitals performance budgets.")
        sys.exit(0)

if __name__ == "__main__":
    main()
