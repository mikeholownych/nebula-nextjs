#!/usr/bin/env python3
"""
night_watch.py — Nebula's "dreaming" engine.

Jack Roberts principle: the OS should work while you sleep, re-reading old data,
finding patterns, and surfacing proactive insights.

This script runs as a daily cron. It:
  1. Reads contacted.json for all leads with URLs
  2. Fetches a lightweight HTML snapshot of each site
  3. Computes a content hash and basic metrics (title, headings, meta)
  4. Compares to stored state from last run
  5. Flags leads whose site materially changed (redesign, new content)
  6. Logs score-relevant signals (page size change, new CTAs)
  7. Produces a concise report → re-engagement targets

Usage:
    python3 night_watch.py                     # full run
    python3 night_watch.py --dry-run            # scan but don't write state
    python3 night_watch.py --since hours=12     # only leads contacted in last N hours
    python3 night_watch.py --quick              # skip hash compare, just report
"""

import hashlib
import json
import os
import re
import sys
import time
from datetime import datetime, timezone, timedelta
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import URLError, HTTPError

NEBULA = Path("/home/mike/nebula")
CONTACTED_PATH = NEBULA / "contacted.json"
STATE_PATH = NEBULA / "night_watch_state.json"
REPORT_PATH = NEBULA / "night_watch_report.json"
ALERT_LOG_PATH = NEBULA / "night_watch_alerts.jsonl"

USER_AGENT = "Mozilla/5.0 (compatible; NebulaNightWatch/1.0; +https://nebulacomponents.shop)"
FETCH_TIMEOUT = 15  # seconds per URL — fast, lightweight
MAX_LEADS_PER_RUN = 50
REPORT_THRESHOLD_CHANGE = 0.15  # 15% hash difference = "changed"


def fetch_page_lightweight(url: str) -> dict | None:
    """Fetch key HTML signals without full DOM parse."""
    try:
        req = Request(url, headers={"User-Agent": USER_AGENT})
        with urlopen(req, timeout=FETCH_TIMEOUT) as resp:
            html = resp.read().decode("utf-8", errors="replace")[:50000]
    except (URLError, HTTPError, OSError, ValueError) as e:
        return {"error": str(e)[:120], "status": "down"}

    # Lightweight extraction — no BeautifulSoup needed
    title = ""
    m = re.search(r"<title[^>]*>(.*?)</title>", html, re.IGNORECASE | re.DOTALL)
    if m:
        title = m.group(1).strip()[:120]

    h1s = re.findall(r"<h1[^>]*>(.*?)</h1>", html, re.IGNORECASE | re.DOTALL)
    h1s = [re.sub(r"<[^>]+>", "", h).strip()[:80] for h in h1s[:3]]

    meta_desc = ""
    m = re.search(r'<meta\s+[^>]*name=["\']description["\'][^>]*content=["\']([^"\']*)["\']', html, re.IGNORECASE)
    if m:
        meta_desc = m.group(1).strip()[:200]

    # Count CTAs (buttons, links with CTA-like text)
    cta_count = len(re.findall(r'(?:class|id)=["\'][^"\']*(?:cta|btn|button|signup|get-started)[^"\']*["\']', html, re.IGNORECASE))

    # Collect all <a href> internal links
    internal_links = len(set(re.findall(r'href=["\'](/[^"\']+)["\']', html)))

    body_text = re.sub(r"<[^>]+>", " ", html)
    body_text = re.sub(r"\s+", " ", body_text).strip()
    content_hash = hashlib.md5(body_text[:30000].encode()).hexdigest()

    return {
        "url": url,
        "status": "ok",
        "title": title,
        "h1s": h1s,
        "meta_description": meta_desc,
        "cta_count": cta_count,
        "internal_links": internal_links,
        "page_size_kb": round(len(html) / 1024, 1),
        "content_hash": content_hash,
        "scraped_at": datetime.now(timezone.utc).isoformat(),
    }


def load_previous_state() -> dict:
    if STATE_PATH.exists():
        try:
            return json.loads(STATE_PATH.read_text())
        except (json.JSONDecodeError, OSError):
            return {}
    return {}


def save_state(state: dict):
    STATE_PATH.write_text(json.dumps(state, indent=2, default=str))


def detect_changes(current: dict, previous: dict | None) -> dict | None:
    """Compare current snapshot to previous. Return change summary or None."""
    if previous is None:
        return None  # first scan, no baseline

    changes = {}
    prev_hash = previous.get("content_hash", "")
    cur_hash = current.get("content_hash", "")

    if prev_hash and cur_hash and prev_hash != cur_hash:
        changes["content_changed"] = True

    prev_size = previous.get("page_size_kb", 0)
    cur_size = current.get("page_size_kb", 0)
    if prev_size and cur_size:
        pct = abs(cur_size - prev_size) / max(prev_size, 1)
        if pct > REPORT_THRESHOLD_CHANGE:
            changes["size_delta_kb"] = round(cur_size - prev_size, 1)
            changes["size_delta_pct"] = round(pct * 100, 1)

    # Title change = major signal
    if previous.get("title", "") and current.get("title", "") != previous.get("title", ""):
        changes["title_changed"] = {"from": previous["title"], "to": current["title"]}

    # CTA count change = likely redesign
    prev_cta = previous.get("cta_count", 0)
    cur_cta = current.get("cta_count", 0)
    if prev_cta and prev_cta != cur_cta:
        changes["cta_count_changed"] = {"from": prev_cta, "to": cur_cta}

    if current.get("status") == "down" and previous.get("status") == "ok":
        changes["status_changed"] = "down"

    if current.get("status") == "ok" and previous.get("status") == "down":
        changes["status_changed"] = "back_up"

    return changes if changes else None


def should_process_lead(email: str, lead: dict, since_hours: int | None) -> bool:
    """Skip leads without URLs, skip recently-processed if --since set."""
    url = lead.get("url", "").strip()
    if not url or url == "None":
        return False
    
    # Quick filter: domain-only urls (no scheme) need fixing
    if not url.startswith("http"):
        url = "https://" + url
        lead["url"] = url

    if since_hours:
        sent_at = lead.get("sent_at", "")
        if sent_at and sent_at != "None":
            try:
                sent_dt = datetime.fromisoformat(sent_at.replace("Z", "+00:00"))
                if datetime.now(timezone.utc) - sent_dt > timedelta(hours=since_hours):
                    return False
            except (ValueError, TypeError):
                pass
    return True


def main():
    import argparse
    parser = argparse.ArgumentParser(description="Nebula Night Watch — re-scan old leads for site changes")
    parser.add_argument("--dry-run", action="store_true", help="Scan but don't write state")
    parser.add_argument("--quick", action="store_true", help="Skip hash compare, just report current state")
    parser.add_argument("--since", type=int, default=None, help="Only leads contacted in last N hours")
    args = parser.parse_args()

    if not CONTACTED_PATH.exists():
        print("NIGHT_WATCH: contacted.json not found — nothing to scan")
        return

    contacted = json.loads(CONTACTED_PATH.read_text())
    previous = {} if args.quick else load_previous_state()
    state = {}
    changes = []
    total = 0
    scanned = 0
    down_sites = 0
    changed = 0

    print(f"NIGHT_WATCH: scanning {len(contacted)} contacted leads...")

    for email, lead in list(contacted.items())[:MAX_LEADS_PER_RUN]:
        total += 1
        if not should_process_lead(email, lead, args.since):
            continue

        url = lead["url"]
        past = previous.get(email)
        snapshot = fetch_page_lightweight(url)
        if snapshot is None:
            continue

        scanned += 1
        if snapshot["status"] == "down":
            down_sites += 1

        if not args.quick and past:
            delta = detect_changes(snapshot, past)
            if delta:
                changed += 1
                changes.append({
                    "email": email,
                    "url": url,
                    "current_title": snapshot.get("title", ""),
                    "changes": delta,
                })

        state[email] = {
            "url": url,
            "title": snapshot.get("title", ""),
            "status": snapshot["status"],
            "page_size_kb": snapshot.get("page_size_kb", 0),
            "cta_count": snapshot.get("cta_count", 0),
            "content_hash": snapshot.get("content_hash", ""),
            "scraped_at": snapshot.get("scraped_at", ""),
        }

        # Rate limit — be polite
        if scanned % 5 == 0:
            time.sleep(0.3)

    # Build report
    report = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "summary": {
            "total_contacted": len(contacted),
            "scanned": scanned,
            "sites_down": down_sites,
            "sites_changed": changed,
        },
        "changes": changes,
        "state_saved": not args.dry_run,
    }

    REPORT_PATH.write_text(json.dumps(report, indent=2, default=str))
    print(json.dumps(report["summary"], indent=2))

    if changes:
        print(f"\n🔔 {len(changes)} site(s) with material changes detected:")
        for c in changes[:5]:
            print(f"  {c['email']:<30} {c['current_title'][:40]}")
            for k, v in c["changes"].items():
                print(f"    └ {k}: {v}")

        # Log alerts for downstream ingestion
        if not args.dry_run:
            with open(ALERT_LOG_PATH, "a") as f:
                for c in changes:
                    f.write(json.dumps({"type": "site_change", **c}) + "\n")

    if not args.dry_run:
        save_state(state)
        print(f"NIGHT_WATCH: state saved ({len(state)} entries), report → {REPORT_PATH.name}")

    # If changes found, print actionable suggestion
    if changed > 0:
        print(f"\n→ Suggested: run re-engagement for {changed} lead(s)")
        print(f"  python3 followup_sequence.py --re-engage-targets")


if __name__ == "__main__":
    main()
