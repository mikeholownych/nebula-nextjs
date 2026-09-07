#!/usr/bin/env python3
"""
Directory Listing Status Watcher — nebulacomponents.com
Checks SaaSHub, Capterra, AlternativeTo for listing approval.
Silent if no status changes.
"""
import json
import urllib.request
from pathlib import Path
from datetime import datetime, timezone

LEDGER = Path(__file__).parent.parent / "seo/ledger"
STATUS_FILE = LEDGER / "directory_status.json"
LEDGER.mkdir(parents=True, exist_ok=True)

INITIAL_STATUS = {
    "saashub": "pending",
    "capterra": "pending",
    "alternativeto": "pending"
}

ACTIONS = {
    "saashub": "Add screenshots, request a review, update description at https://www.saashub.com/nebula-components",
    "capterra": "Add screenshots, complete all optional fields, request customer reviews",
    "alternativeto": "Add full description, link to /audit, ask early users to upvote at https://alternativeto.net/software/nebula-components/",
}

def fetch(url: str) -> str:
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        return urllib.request.urlopen(req, timeout=15).read().decode("utf-8", errors="ignore").lower()
    except Exception:
        return ""

def check_saashub() -> str:
    html = fetch("https://www.saashub.com/nebula-components")
    if not html:
        return "pending"
    if any(x in html for x in ["pending", "under review", "waiting"]):
        return "pending"
    if "nebula components" in html and "landing page" in html:
        return "live"
    return "pending"

def check_capterra() -> str:
    html = fetch("https://www.capterra.com/p/search/?query=nebula+components")
    if not html:
        return "pending"
    if "nebula components" in html:
        return "live"
    return "pending"

def check_alternativeto() -> str:
    html = fetch("https://alternativeto.net/software/nebula-components/")
    if not html:
        return "pending"
    if any(x in html for x in ["pending", "waiting to be reviewed", "waiting for approval"]):
        return "pending"
    if "nebula components" in html and ("alternatives" in html or "review" in html):
        return "live"
    return "pending"

def main():
    if STATUS_FILE.exists():
        last = json.loads(STATUS_FILE.read_text())
    else:
        last = dict(INITIAL_STATUS)

    current = {
        "saashub": check_saashub(),
        "capterra": check_capterra(),
        "alternativeto": check_alternativeto(),
        "checked_at": datetime.now(timezone.utc).isoformat(),
    }

    for dir_name in ["saashub", "capterra", "alternativeto"]:
        prev = last.get(dir_name, "pending")
        now = current[dir_name]
        if prev != "live" and now == "live":
            print(f"{dir_name.upper()} LISTING IS LIVE")
            print(f"ACTION: {ACTIONS[dir_name]}")
            print()

    STATUS_FILE.write_text(json.dumps(current, indent=2))

if __name__ == "__main__":
    main()
