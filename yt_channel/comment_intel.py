#!/usr/bin/env python3
"""YouTube comment demand harvesting — the "scrape the comments" move from
Chris Koerner's Ron story (l0Vqm0ZIySc).

Ron scraped 200 "I want a Ron" comments and pivoted his whole product to
that demand. The same signal sits in @NebulaAudits comment sections:
people literally ask for audits ("audit my site", "do mine next", "check
out [domain]"). Those are warm, high-intent leads — currently uncollected.

This script:
  1. Lists the channel's recent videos (Data API)
  2. Pulls comment threads for each
  3. Classifies demand signals (audit request, domain mention, "do mine",
     "next", CTA engagement)
  4. Appends matches to yt_channel/logs/comment_demand.jsonl (deduped)
  5. Sends hot leads to Telegram for manual reply (human-in-the-loop,
     never auto-replies — same posture as reddit_signal_alerter)

Usage:
  venv/bin/python yt_channel/comment_intel.py [--videos N] [--send]
Exit 0 = ok (even if 0 signals found); 1 = auth/API failure (fail-closed).
"""
from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from yt_channel.upload import _get_authenticated_service  # noqa: E402

NEBULA_DIR = Path(__file__).resolve().parent.parent
LOG_DIR = NEBULA_DIR / "yt_channel" / "logs"
LOG_DIR.mkdir(parents=True, exist_ok=True)
DEMAND_LOG = LOG_DIR / "comment_demand.jsonl"
TELEGRAM_TARGET = "telegram:5920497760"

# ── Demand classification ─────────────────────────────────────────────
# Patterns that signal a warm, actionable request in a comment.
AUDIT_REQUEST = re.compile(
    r"\b(audit|review|teardown|check(ing| out)?|look at|fix|analy[sz]e|"
    r"score|diagnos[et])\b",
    re.IGNORECASE,
)
SELF_REFERRAL = re.compile(
    r"\b(mine|my site|my page|my landing|my website|my store|my business|"
    r"my saas|my app|me next|do me|my link|my url)\b",
    re.IGNORECASE,
)
DOMAIN_MENTION = re.compile(
    r"\b((?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+"
    r"(?:com|io|co|net|org|shop|dev|ai|app|me|xyz|site))\b",
    re.IGNORECASE,
)
NEXT_REQUEST = re.compile(r"\b(next|one more|this one|same for|do this)\b", re.IGNORECASE)
QUESTION_MARK = re.compile(r"\?")
# Comments that are pure spam / self-promo noise.
SPAM_HINTS = re.compile(
    r"\b(subscribe to my|check my channel|follow me|dm me|promo|"
    r"free followers|earn money fast)\b",
    re.IGNORECASE,
)


def classify(text: str) -> tuple[str | None, list[str]]:
    """Return (signal_type, reasons) or (None, []) for non-signal."""
    if SPAM_HINTS.search(text):
        return None, ["spam"]
    reasons = []
    if AUDIT_REQUEST.search(text) and SELF_REFERRAL.search(text):
        reasons.append("audit_self_request")
    if DOMAIN_MENTION.search(text):
        reasons.append("domain_mentioned")
    if NEXT_REQUEST.search(text):
        reasons.append("next_request")
    if QUESTION_MARK.search(text):
        reasons.append("question")
    if len(reasons) >= 1:
        return ("hot" if "audit_self_request" in reasons or "domain_mentioned" in reasons
                else "warm"), reasons
    return None, []


def load_seen() -> set[str]:
    if not DEMAND_LOG.exists():
        return set()
    seen = set()
    for line in DEMAND_LOG.read_text().splitlines():
        try:
            seen.add(json.loads(line)["comment_id"])
        except Exception:
            continue
    return seen


def append_signal(sig: dict) -> None:
    with open(DEMAND_LOG, "a", encoding="utf-8") as f:
        f.write(json.dumps(sig, ensure_ascii=False) + "\n")


def telegram(msg: str) -> bool:
    res = subprocess.run(
        ["hermes", "send", "--to", TELEGRAM_TARGET, msg],
        capture_output=True, text=True, timeout=30,
    )
    return res.returncode == 0


def main() -> int:
    ap = argparse.ArgumentParser(description="YouTube comment demand harvesting")
    ap.add_argument("--videos", type=int, default=10, help="recent videos to scan")
    ap.add_argument("--send", action="store_true", help="send hot leads to Telegram")
    args = ap.parse_args()

    try:
        svc = _get_authenticated_service()
    except Exception as e:
        print(f"AUTH FAIL: {e}", file=sys.stderr)
        return 1

    # 1. Channel's uploads.
    channels = svc.channels().list(part="contentDetails", mine=True).execute()
    if not channels.get("items"):
        print("NO CHANNEL", file=sys.stderr)
        return 1
    uploads_id = channels["items"][0]["contentDetails"]["relatedPlaylists"]["uploads"]

    playlist = svc.playlistItems().list(
        part="snippet", playlistId=uploads_id, maxResults=args.videos,
    ).execute()
    videos = []
    for item in playlist.get("items", []):
        snip = item["snippet"]
        videos.append({
            "id": snip["resourceId"]["videoId"],
            "title": snip["title"],
        })
    if not videos:
        print("No recent videos to scan.")
        return 0

    # 2-4. Comment threads per video.
    seen = load_seen()
    found, alerted = 0, 0
    for v in videos:
        try:
            threads = svc.commentThreads().list(
                part="snippet", videoId=v["id"], maxResults=100,
            ).execute()
        except Exception as e:
            print(f"  comments for {v['id']}: {e}")
            continue

        for thread in threads.get("items", []):
            top = thread["snippet"]["topLevelComment"]["snippet"]
            cid = top["id"]
            if cid in seen:
                continue
            text = (top.get("textDisplay") or "").replace("\n", " ")
            author = top.get("authorDisplayName", "?")
            signal, reasons = classify(text)
            if signal is None:
                continue

            rec = {
                "comment_id": cid,
                "video_id": v["id"],
                "video_title": v["title"][:120],
                "author": author,
                "signal": signal,
                "reasons": reasons,
                "text": text[:300],
                "ts": datetime.now(timezone.utc).isoformat(),
            }
            append_signal(rec)
            seen.add(cid)
            found += 1
            print(f"  [{signal}] {author}: {text[:90]}")

            if args.send and signal == "hot":
                ok = telegram(
                    f"🔥 YouTube demand signal — manual reply\n\n"
                    f"Video: {v['title'][:80]}\n"
                    f"Author: {author}\n"
                    f"Signal: {', '.join(reasons)}\n\n"
                    f"“{text[:220]}”\n\n"
                    f"Reply to this person (never auto-reply)."
                )
                if ok:
                    alerted += 1

    print(f"\ncomment_intel: {found} signal(s) found, {alerted} hot lead(s) sent.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
