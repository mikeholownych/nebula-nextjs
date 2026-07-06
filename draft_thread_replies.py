#!/usr/bin/env python3
"""
draft_thread_replies.py — Nebula Thread Reply Drafter

Reads signal_queue.jsonl, finds uncontacted signals with score >= 7,
scrapes their product URL, runs a quick audit, and drafts a short
builder-to-builder reply (2-3 sentences max).

Output: reply_drafts.jsonl + stdout print for review.
Never auto-posts. Review before sending.

Usage:
    source venv/bin/activate
    python3 draft_thread_replies.py
    python3 draft_thread_replies.py --min-score 7
    python3 draft_thread_replies.py --url https://example.com  # single URL test
"""

import argparse
import json
import os
import re
import sys
from datetime import datetime, timezone
from urllib.parse import urlparse

sys.path.insert(0, "/home/mike/nebula")

try:
    from deliver_audit import scrape_page, score_audit
except ImportError as e:
    print(f"[FATAL] Could not import deliver_audit: {e}")
    print("Make sure you're in /home/mike/nebula and deps are installed.")
    sys.exit(1)

SIGNAL_QUEUE  = "/home/mike/nebula/signal_queue.jsonl"
REPLY_DRAFTS  = "/home/mike/nebula/reply_drafts.jsonl"

# ─── Test data — used if signal_queue.jsonl is missing or empty ───────────────

TEST_SIGNALS = [
    {
        "signal_url": "https://news.ycombinator.com/item?id=test001",
        "product_url": "https://naxely.com",
        "author": "naxely_founder",
        "score": 8,
        "contacted": False,
        "source": "test_data",
    },
    {
        "signal_url": "https://www.indiehackers.com/post/test002",
        "product_url": "https://alloceraintelligence.com",
        "author": "alloc_founder",
        "score": 9,
        "contacted": False,
        "source": "test_data",
    },
]


# ─── Helpers ──────────────────────────────────────────────────────────────────

def load_signals(path: str, min_score: int) -> list[dict]:
    """Load signals from JSONL; fall back to test data if file missing/empty."""
    signals = []

    if os.path.exists(path):
        with open(path) as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    signals.append(json.loads(line))
                except json.JSONDecodeError:
                    continue

    if not signals:
        print(f"[INFO] {path} not found or empty — using built-in test data.")
        signals = TEST_SIGNALS

    eligible = [
        s for s in signals
        if not s.get("contacted", False)
        and s.get("score", 0) >= min_score
        and s.get("product_url")
    ]

    print(f"[INFO] {len(signals)} total signals, {len(eligible)} eligible (uncontacted, score >= {min_score})")
    return eligible


def get_domain(url: str) -> str:
    """Extract clean domain from URL."""
    try:
        parsed = urlparse(url)
        domain = parsed.netloc or parsed.path
        return domain.replace("www.", "")
    except Exception:
        return url


def pick_top_issue(audit: dict) -> tuple[str, dict]:
    """Return the (dim_name, dim_data) with the lowest score."""
    dims = audit.get("dimensions", {})
    if not dims:
        return ("page", {"issue": "no specific issue detected", "fix": "run a full audit for details"})
    sorted_dims = sorted(dims.items(), key=lambda x: x[1]["score"])
    return sorted_dims[0]


DIM_LABEL = {
    "headline":     "headline",
    "cta":          "call-to-action",
    "social_proof": "social proof",
    "speed":        "load speed",
    "mobile":       "mobile readiness",
}


def draft_reply(signal: dict, page: dict, audit: dict) -> str:
    """
    Draft a 2-3 sentence reply.
    Format: 'Looked at [domain] — [specific issue]. [One sentence fix]. 
             Happy to run the full audit if useful.'
    """
    domain    = get_domain(signal["product_url"])
    dim_key, dim_data = pick_top_issue(audit)
    dim_label = DIM_LABEL.get(dim_key, dim_key.replace("_", " "))
    overall   = audit.get("overall", "?")

    issue_text = dim_data.get("issue", "")
    fix_text   = dim_data.get("fix", "")

    # Trim issue to a clean single sentence
    issue_sentence = issue_text.split(".")[0].strip()
    if issue_sentence and not issue_sentence.endswith("."):
        issue_sentence += "."

    # Trim fix to one sentence, strip price mentions
    fix_sentence = fix_text.split(".")[0].strip()
    # Scrub any dollar amounts or price references (just in case)
    fix_sentence = re.sub(r"\$\d+[\w]*", "", fix_sentence).strip()
    if fix_sentence and not fix_sentence.endswith("."):
        fix_sentence += "."

    # Build observation with real headline data if available
    headline = page.get("headline", "")
    ctas      = page.get("ctas", [])

    # Enrich the observation with page-specific detail
    if dim_key == "cta":
        if not ctas:
            observation = f"No CTA detected on the page — visitors have nowhere to go after reading."
        elif len(ctas) >= 3:
            observation = (
                f"Found {len(ctas)} competing CTAs ({', '.join(ctas[:2])}, …) — "
                f"too many choices quietly kill conversions."
            )
        else:
            observation = issue_sentence
    elif dim_key == "social_proof":
        proof = page.get("social_proof_signals", [])
        if not proof:
            observation = f"Zero social proof signals on the page — no testimonials, no customer count, no logos."
        else:
            observation = issue_sentence
    elif dim_key == "headline":
        if headline:
            observation = f"Headline ('{headline[:60]}{'...' if len(headline) > 60 else ''}') doesn't clearly state the outcome or who it's for."
        else:
            observation = issue_sentence
    else:
        observation = issue_sentence

    if not observation.endswith("."):
        observation += "."

    reply = (
        f"Looked at {domain} — {observation} "
        f"{fix_sentence} "
        f"Happy to run the full audit if useful."
    )

    return reply.strip()


def append_draft(draft_record: dict):
    """Append a single draft record to reply_drafts.jsonl."""
    with open(REPLY_DRAFTS, "a") as f:
        f.write(json.dumps(draft_record) + "\n")


def print_draft(i: int, record: dict):
    """Pretty-print a single draft for review."""
    print(f"\n{'─'*60}")
    print(f"#{i+1} | {record['author']} | score: {record['score']} | {record['product_url']}")
    print(f"Signal: {record['signal_url']}")
    print(f"Audit:  {record['audit_overall']}/10")
    print(f"\n  DRAFT REPLY:\n")
    print(f"  {record['draft_reply']}")
    print()


# ─── Main ─────────────────────────────────────────────────────────────────────

def run(min_score: int = 7, single_url: str | None = None):
    drafts_written = 0

    if single_url:
        # Single URL test mode
        signals = [{
            "signal_url": single_url,
            "product_url": single_url,
            "author":      "test_run",
            "score":       10,
            "contacted":   False,
            "source":      "cli_test",
        }]
        print(f"[TEST MODE] Auditing single URL: {single_url}")
    else:
        signals = load_signals(SIGNAL_QUEUE, min_score)

    if not signals:
        print("[INFO] No eligible signals to draft replies for.")
        return

    for i, signal in enumerate(signals):
        product_url = signal["product_url"]
        author      = signal.get("author", "unknown")
        domain      = get_domain(product_url)

        print(f"\n[{i+1}/{len(signals)}] Scraping {product_url} ...")

        page = scrape_page(product_url)
        if page.get("error"):
            print(f"  [WARN] Scrape failed for {domain}: {page['error']} — skipping.")
            continue

        audit = score_audit(page)
        reply = draft_reply(signal, page, audit)

        record = {
            "signal_url":    signal["signal_url"],
            "product_url":   product_url,
            "author":        author,
            "draft_reply":   reply,
            "score":         signal.get("score", 0),
            "audit_overall": audit.get("overall"),
            "top_issue":     pick_top_issue(audit)[0],
            "timestamp":     datetime.now(timezone.utc).isoformat(),
        }

        append_draft(record)
        print_draft(i, record)
        drafts_written += 1

    print(f"\n{'='*60}")
    print(f"Done. {drafts_written} draft(s) written to {REPLY_DRAFTS}")
    print(f"Review above before posting anything.")
    print(f"{'='*60}\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Draft IH/HN thread replies from signal queue.")
    parser.add_argument("--min-score", type=int, default=7, help="Minimum signal score to process (default: 7)")
    parser.add_argument("--url", type=str, default=None, help="Single URL to audit in test mode")
    args = parser.parse_args()

    run(min_score=args.min_score, single_url=args.url)
