#!/usr/bin/env python3
"""
IndexNow Submission Helper — Submits core site URLs to IndexNow API (Bing / Yandex)
"""

import sys
import subprocess

KEY = "c8f12a94d30b4e8597f519623e59b671"
HOST = "nebulacomponents.com"
KEY_LOCATION = f"https://{HOST}/{KEY}.txt"

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
