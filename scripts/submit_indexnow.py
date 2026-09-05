#!/usr/bin/env python3
"""
IndexNow Submission Helper - Submits core site URLs to IndexNow API (Bing / Yandex)
"""

import sys
import subprocess
from pathlib import Path

ROOT = Path("/home/mike/nebula")
KEY = (ROOT / "nebula2026indexnow.txt").read_text().strip()
HOST = "nebulacomponents.com"
KEY_LOCATION = f"https://{HOST}/nebula-indexnow-key.txt"

URLS = [
    f"https://{HOST}/",
    f"https://{HOST}/pricing",
    f"https://{HOST}/audit",
    f"https://{HOST}/concepts",
    f"https://{HOST}/learning-centre",
    f"https://{HOST}/learning-centre/landing-page-not-converting",
    f"https://{HOST}/learning-centre/paid-traffic-leak-map",
    f"https://{HOST}/learning-centre/mobile-landing-page-leaks",
    f"https://{HOST}/learning-centre/b2b-saas-landing-page-not-converting",
    f"https://{HOST}/learning-centre/above-fold-landing-page",
    f"https://{HOST}/learning-centre/landing-page-bounce-rate-high",
    f"https://{HOST}/resources/citable",
    f"https://{HOST}/what-is-nebula-components",
]

def main():
    cmd = [
        sys.executable,
        "/home/mike/claude-seo/scripts/indexnow_submit.py",
        "--host", HOST,
        "--key", KEY,
        "--key-location", KEY_LOCATION,
        "--urls", *URLS
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    print(res.stdout)
    if res.returncode != 0:
        print(res.stderr, file=sys.stderr)
        sys.exit(res.returncode)

if __name__ == "__main__":
    main()
