#!/usr/bin/env python3
"""Run the real audit engine against nebulacomponents.shop's own homepage
and write a static JSON snapshot the homepage hero reads to play its
self-scan calibration animation — see customer-portal/app/components/
SelfScan.tsx. Not a live per-visitor scan: this is meant to run on a
schedule (see the graduation-gate note below) and the frontend replays
the last recorded snapshot.

Deliberately reuses deliver_audit.py's real scoring path (scrape_page +
score_audit) — the same functions the live self-serve audit API uses —
so this can't quietly diverge into a fake/hand-tuned number.

Usage: venv/bin/python3 scripts/self_scan.py [url]
"""
import json
import sys
import time
from pathlib import Path

NEBULA_DIR = Path("/home/mike/nebula")
sys.path.insert(0, str(NEBULA_DIR))

from deliver_audit import scrape_page, score_audit  # noqa: E402

DEFAULT_URL = "https://nebulacomponents.shop"
OUTPUT_PATH = NEBULA_DIR / "customer-portal" / "public" / "self_scan.json"

DIM_LABELS = {
    "headline": "Headline",
    "cta": "CTA",
    "social_proof": "Social Proof",
    "load_speed": "Load Speed",
    "mobile": "Mobile",
    "seo_foundations": "SEO Foundations",
    "ad_signals": "Ad Tracking",
    "above_fold": "Above Fold",
    "ai_readiness": "AI Citation Readiness",
}


def main():
    url = sys.argv[1] if len(sys.argv) > 1 else DEFAULT_URL

    page = scrape_page(url)
    audit = score_audit(page)

    signals = [
        {
            "key": key,
            "label": DIM_LABELS.get(key, key.replace("_", " ").title()),
            "score": round(dim["score"], 1),
            "pass": dim["score"] >= 7,
        }
        for key, dim in audit["dimensions"].items()
    ]

    snapshot = {
        "url": url,
        "overall": audit["overall"],
        "grade": audit["overall_grade"],
        "signals": signals,
        "scanned_at": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
    }

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    tmp = OUTPUT_PATH.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(snapshot, indent=2))
    tmp.rename(OUTPUT_PATH)  # atomic on same filesystem

    print(f"self-scan: {url} -> {audit['overall']}/10 ({audit['overall_grade']}), "
          f"{sum(1 for s in signals if not s['pass'])} failing signal(s)")
    print(f"written to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
