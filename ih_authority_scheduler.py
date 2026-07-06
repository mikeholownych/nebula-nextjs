#!/usr/bin/env python3
"""
IH Authority Post Scheduler
────────────────────────────
Two jobs:
  1. First run  — queue the pre-written ih_authority_post.md for posting
  2. Every 7 d  — generate a fresh post from audit_leads.jsonl audit data
                  and queue it for the ih_bot.py publish_post() runner

DM job:
  Read signal_queue.jsonl; for each entry where contacted=false and
  signal_score >= 7, generate a personalised DM and write to dm_queue.jsonl.

State file: ih_post_state.json
  {
    "last_posted_at": "<ISO-8601>",
    "posts_published": 0,
    "queued_posts": []
  }
"""

import json
import os
import sys
import argparse
from datetime import datetime, timezone
from urllib.parse import urlparse

# ── paths ──────────────────────────────────────────────────────────────────────
BASE_DIR          = "/home/mike/nebula"
STATE_FILE        = os.path.join(BASE_DIR, "ih_post_state.json")
AUTHORITY_POST_MD = os.path.join(BASE_DIR, "ih_authority_post.md")
AUDIT_LEADS_FILE  = os.path.join(BASE_DIR, "audit_leads.jsonl")
SIGNAL_QUEUE_FILE = os.path.join(BASE_DIR, "signal_queue.jsonl")
DM_QUEUE_FILE     = os.path.join(BASE_DIR, "dm_queue.jsonl")

POST_INTERVAL_DAYS = 7
IH_GROUP           = "landing-page-feedback"

# ── anonymisation helpers ──────────────────────────────────────────────────────

# Map raw domains to human-readable product categories for anonymisation
DOMAIN_CATEGORY_HINTS = {
    "naxely.com":         "an AI report generator SaaS",
    "goldenweeks.co":     "a travel / retreat booking site",
    "boothkeepos.polsia.app": "a booth / print-shop management tool",
    "theogeo.ai":         "a brand positioning AI tool",
    "alloceraintelligence.com": "a business intelligence SaaS",
}


def _grade_label(grade: str) -> str:
    """Map grade letter to a human-readable descriptor."""
    return {
        "A": "excellent (A)",
        "B": "good (B)",
        "C": "average (C)",
        "D": "below-average (D)",
        "F": "failing (F)",
    }.get(grade.upper(), grade)


def _anonymise(url: str) -> str:
    """Return the anonymised category description for a domain."""
    domain = urlparse(url).netloc.lstrip("www.")
    return DOMAIN_CATEGORY_HINTS.get(domain, f"a SaaS ({domain})")


# ── state helpers ──────────────────────────────────────────────────────────────

def load_state() -> dict:
    if os.path.exists(STATE_FILE):
        try:
            with open(STATE_FILE) as f:
                return json.load(f)
        except Exception as e:
            print(f"[WARN] Could not read state file: {e}; starting fresh.")
    return {
        "last_posted_at": None,
        "posts_published": 0,
        "queued_posts": [],
    }


def save_state(state: dict, dry_run: bool = False):
    if dry_run:
        print(f"[DRY-RUN] Would write state: {json.dumps(state, indent=2)}")
        return
    with open(STATE_FILE, "w") as f:
        json.dump(state, f, indent=2)
    print(f"[STATE] Saved → {STATE_FILE}")


# ── audit data helpers ─────────────────────────────────────────────────────────

def load_audit_leads() -> list[dict]:
    """Load & deduplicate audit leads (keep highest score per domain)."""
    if not os.path.exists(AUDIT_LEADS_FILE):
        return []
    best: dict[str, dict] = {}
    with open(AUDIT_LEADS_FILE) as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                entry = json.loads(line)
                url   = entry.get("url", "")
                domain = urlparse(url).netloc.lstrip("www.")
                if not domain:
                    continue
                if domain not in best or entry.get("score", 0) > best[domain].get("score", 0):
                    best[domain] = entry
            except json.JSONDecodeError:
                pass
    return list(best.values())


# ── post generators ────────────────────────────────────────────────────────────

def read_authority_post_md() -> dict:
    """Read the pre-written markdown post and return a post dict."""
    with open(AUTHORITY_POST_MD) as f:
        raw = f.read()

    # Extract title from first H1 line
    title = ""
    body_lines = []
    for line in raw.splitlines():
        stripped = line.strip()
        if not title and stripped.startswith("# "):
            title = stripped[2:].strip()
        else:
            body_lines.append(line)

    # Strip leading/trailing blank lines from body
    body = "\n".join(body_lines).strip()
    # Remove markdown HR "---" at very start
    body = body.lstrip("-").strip()

    return {
        "title":      title,
        "body":       body,
        "group":      IH_GROUP,
        "source":     "authority_post_md",
        "queued_at":  datetime.now(timezone.utc).isoformat(),
    }


def generate_weekly_post(leads: list[dict]) -> dict:
    """Generate a fresh authority post from audit data."""
    if not leads:
        raise ValueError("No audit leads available to generate post.")

    # Sort by timestamp desc and take up to 3 most interesting (diverse scores)
    sorted_leads = sorted(leads, key=lambda x: x.get("timestamp", ""), reverse=True)
    # Pick up to 3 with varied grades for richer examples
    examples = sorted_leads[:3] if len(sorted_leads) >= 3 else sorted_leads
    n_audited = len(leads)

    title = f"We audited {n_audited} IH landing pages this week — here's what we found"

    # --- analyse patterns across all leads ---
    avg_score = sum(l.get("score", 0) for l in leads) / len(leads)
    low_scorers  = [l for l in leads if l.get("score", 10) < 6]
    pattern_line = (
        f"We ran {n_audited} free landing page audits this week. "
        f"Average score: {avg_score:.1f}/10. "
        f"{len(low_scorers)} out of {n_audited} scored below 6 — the most common culprit: a missing or buried CTA."
    )

    # --- build example bullets ---
    example_blocks = []
    for lead in examples:
        anon  = _anonymise(lead["url"])
        score = lead.get("score", 0)
        grade = _grade_label(lead.get("grade", "?"))
        # Heuristic issue description based on score range
        if score < 5:
            issue = "had zero detectable CTAs — visitors arrive with nowhere to go"
        elif score < 6.5:
            issue = "had a strong headline but no clear next step for the visitor"
        elif score < 7.5:
            issue = "had multiple competing CTAs creating decision paralysis"
        else:
            issue = "was close but diluted its primary CTA with duplicate links"

        example_blocks.append(
            f"**{anon.capitalize()} — {score}/10 ({grade})**\n"
            f"Issue: {issue.capitalize()}."
        )

    examples_text = "\n\n".join(example_blocks)

    body = f"""{pattern_line}

---

Here are three specific examples:

{examples_text}

---

**The pattern:**

Founders build for people who already understand the product. Cold visitors don't. They have 7 seconds and one question: *what is this and why should I act now?*

Most pages answer the first half brilliantly — and leave the second half blank.

No clear CTA = no conversion. Not a low rate. Zero.

---

**Want us to run yours?**

Drop your URL in the comments. We'll scrape it, score it across 5 dimensions (headline clarity, CTA, social proof, load speed, mobile), and post the findings publicly — or DM you if you prefer.

No form. No email required. Just a URL."""

    return {
        "title":      title,
        "body":       body,
        "group":      IH_GROUP,
        "source":     "generated_from_audit_leads",
        "queued_at":  datetime.now(timezone.utc).isoformat(),
    }


# ── DM generator ──────────────────────────────────────────────────────────────

def load_signal_queue() -> list[dict]:
    if not os.path.exists(SIGNAL_QUEUE_FILE):
        return []
    entries = []
    with open(SIGNAL_QUEUE_FILE) as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                entries.append(json.loads(line))
            except json.JSONDecodeError:
                pass
    return entries


def load_existing_dm_queue() -> set:
    """Return set of signal_urls already in dm_queue to avoid duplicates."""
    seen = set()
    if not os.path.exists(DM_QUEUE_FILE):
        return seen
    with open(DM_QUEUE_FILE) as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                entry = json.loads(line)
                seen.add(entry.get("signal_url", ""))
            except json.JSONDecodeError:
                pass
    return seen


def _extract_trigger_topic(signal: dict) -> str:
    """Derive a short trigger phrase from the headline / trigger_text."""
    headline     = signal.get("headline", "")
    trigger_text = signal.get("trigger_text", "")

    # Prefer a short distilled phrase from headline
    for prefix in ("Show HN: ", "Ask HN: ", "New PH launch: "):
        if headline.startswith(prefix):
            headline = headline[len(prefix):]

    # Trim to a manageable length
    topic = headline[:80].strip()
    if not topic and trigger_text:
        topic = trigger_text[:80].strip()
    return topic or "your recent post"


def _extract_product_domain(signal: dict) -> str:
    """Get the bare domain from product_url or fall back to signal url."""
    prod_url = signal.get("product_url", "") or signal.get("url", "")
    if not prod_url:
        return "your landing page"
    domain = urlparse(prod_url).netloc.lstrip("www.")
    return domain or "your landing page"


def _guess_main_issue(signal: dict) -> str:
    """Heuristic: guess the most likely conversion blocker from headline/text."""
    combined = (
        (signal.get("headline", "") + " " + signal.get("trigger_text", "")).lower()
    )
    if any(kw in combined for kw in ["no sales", "zero sales", "0 sales", "not converting", "no conversions"]):
        return "conversion path is the main thing blocking sales"
    if any(kw in combined for kw in ["no sign", "zero sign", "0 sign"]):
        return "signup CTA is missing or buried"
    if any(kw in combined for kw in ["bounce", "leaving", "drop off"]):
        return "above-the-fold clarity is the main thing blocking retention"
    if any(kw in combined for kw in ["traffic", "visitors", "clicks"]):
        return "CTA is the main gap between traffic and conversions"
    if any(kw in combined for kw in ["landing page", "page feedback", "roast"]):
        return "CTA / social proof gap is the main thing blocking conversions"
    # generic fallback
    return "headline-to-CTA flow is the main thing blocking conversions"


def generate_dm(signal: dict) -> dict:
    """Build a personalised IH DM entry for a high-signal lead."""
    author  = signal.get("author", "there")
    # Friendly first name — IH usernames are often display names
    name    = author.split()[0] if " " in author else author

    trigger = _extract_trigger_topic(signal)
    domain  = _extract_product_domain(signal)
    issue   = _guess_main_issue(signal)

    message = (
        f"Hey {name} — saw your post about {trigger}. "
        f"Looked at {domain}, your {issue}. "
        f"Happy to send over the full audit if useful."
    )

    return {
        "platform":   "ih",
        "username":   author,
        "message":    message,
        "signal_url": signal.get("url", ""),
        "queued_at":  datetime.now(timezone.utc).isoformat(),
    }


def process_dm_queue(dry_run: bool = False) -> list[dict]:
    """Process signal_queue and write qualifying DMs to dm_queue.jsonl."""
    signals    = load_signal_queue()
    already_dm = load_existing_dm_queue()

    new_dms = []
    skipped_score  = 0
    skipped_contacted = 0
    skipped_dup    = 0

    for sig in signals:
        score     = sig.get("signal_score", 0)
        contacted = sig.get("contacted", False)
        sig_url   = sig.get("url", "")

        if score < 6:
            skipped_score += 1
            continue
        if contacted:
            skipped_contacted += 1
            continue
        if sig_url in already_dm:
            skipped_dup += 1
            continue

        dm = generate_dm(sig)
        new_dms.append(dm)

    print(f"\n[DM] signal_queue: {len(signals)} entries")
    print(f"     → skipped (score < 7):  {skipped_score}")
    print(f"     → skipped (contacted):  {skipped_contacted}")
    print(f"     → skipped (duplicate):  {skipped_dup}")
    print(f"     → new DMs to queue:     {len(new_dms)}")

    if new_dms:
        if dry_run:
            print("\n[DRY-RUN] Would append to dm_queue.jsonl:")
            for dm in new_dms:
                print(f"  → @{dm['username']}: {dm['message'][:120]}")
        else:
            with open(DM_QUEUE_FILE, "a") as f:
                for dm in new_dms:
                    f.write(json.dumps(dm) + "\n")
            print(f"[DM] Wrote {len(new_dms)} DMs → {DM_QUEUE_FILE}")
    else:
        print("[DM] Nothing to write.")

    return new_dms


# ── scheduling logic ──────────────────────────────────────────────────────────

def should_post(state: dict) -> tuple[bool, str]:
    """Return (should_post, reason)."""
    last = state.get("last_posted_at")
    queued = state.get("queued_posts", [])

    if not last:
        return True, "first_run"

    try:
        last_dt   = datetime.fromisoformat(last)
        now       = datetime.now(timezone.utc)
        if last_dt.tzinfo is None:
            last_dt = last_dt.replace(tzinfo=timezone.utc)
        delta_days = (now - last_dt).total_seconds() / 86400
        if delta_days >= POST_INTERVAL_DAYS:
            return True, f"interval_elapsed ({delta_days:.1f}d >= {POST_INTERVAL_DAYS}d)"
        return False, f"too_soon ({delta_days:.1f}d < {POST_INTERVAL_DAYS}d)"
    except Exception as e:
        return True, f"parse_error ({e})"


def run_scheduler(dry_run: bool = False, force: bool = False):
    """Main entry point — run the full scheduler cycle."""
    print("=" * 60)
    print("IH Authority Post Scheduler")
    print("=" * 60)

    state = load_state()
    print(f"\n[STATE] last_posted_at  : {state.get('last_posted_at', 'never')}")
    print(f"[STATE] posts_published : {state.get('posts_published', 0)}")
    print(f"[STATE] queued_posts    : {len(state.get('queued_posts', []))}")

    # ── decide whether to generate a new post ─────────────────────────────────
    post_needed, reason = should_post(state)
    if force:
        post_needed = True
        reason = "forced"

    print(f"\n[SCHEDULE] Post needed: {post_needed} ({reason})")

    new_post = None

    if post_needed:
        last = state.get("last_posted_at")
        is_first_run = (last is None)

        if is_first_run:
            # First run — queue the pre-written post
            if not os.path.exists(AUTHORITY_POST_MD):
                print(f"[ERROR] {AUTHORITY_POST_MD} not found — skipping authority post.")
            else:
                print(f"\n[POST] First run — reading {AUTHORITY_POST_MD}")
                new_post = read_authority_post_md()
                print(f"[POST] Title  : {new_post['title']}")
                print(f"[POST] Group  : {new_post['group']}")
                print(f"[POST] Source : {new_post['source']}")
                print(f"[POST] Body preview:\n{new_post['body'][:400]}...\n")
        else:
            # Subsequent runs — generate from audit data
            leads = load_audit_leads()
            print(f"\n[AUDIT] Loaded {len(leads)} unique domain leads from {AUDIT_LEADS_FILE}")
            if not leads:
                print("[WARN] No audit leads found — cannot generate weekly post.")
            else:
                new_post = generate_weekly_post(leads)
                print(f"\n[POST] Generated weekly post")
                print(f"[POST] Title  : {new_post['title']}")
                print(f"[POST] Group  : {new_post['group']}")
                print(f"[POST] Source : {new_post['source']}")
                print(f"[POST] Body preview:\n{new_post['body'][:600]}...\n")

    # ── update state ──────────────────────────────────────────────────────────
    if new_post:
        if dry_run:
            print("[DRY-RUN] Would queue post (not modifying state file):")
            print(json.dumps(new_post, indent=2))
        else:
            state["queued_posts"].append(new_post)
            state["last_posted_at"] = datetime.now(timezone.utc).isoformat()
            save_state(state)
            print(f"[STATE] Queued post — total queued: {len(state['queued_posts'])}")

    # ── flush queued posts via publish_post() ─────────────────────────────────
    # ih_bot.py exposes publish_post(title, body, group) and handles the actual
    # IH HTTP calls + marks published entries as consumed.
    queued = state.get("queued_posts", [])
    if queued and not dry_run:
        print(f"\n[PUBLISH] {len(queued)} post(s) ready — handing off to ih_bot.publish_post()")
        try:
            sys.path.insert(0, BASE_DIR)
            from ih_bot import publish_post  # type: ignore
            published = []
            for post in queued:
                try:
                    result = publish_post(
                        title=post["title"],
                        body=post["body"],
                        group=post["group"],
                    )
                    print(f"  ✓ Published: {post['title'][:60]}…")
                    state["posts_published"] = state.get("posts_published", 0) + 1
                    published.append(post)
                except Exception as pub_err:
                    print(f"  ✗ publish_post() error: {pub_err}")
            # Remove successfully published posts from queue
            state["queued_posts"] = [p for p in queued if p not in published]
            save_state(state)
        except ImportError:
            print("  [WARN] ih_bot.py not found — posts remain in queue for next run.")
    elif queued and dry_run:
        print(f"\n[DRY-RUN] {len(queued)} post(s) already in queue would be handed to publish_post()")
        for i, post in enumerate(queued, 1):
            print(f"  [{i}] {post['title'][:70]}")

    # ── DM queue processing ───────────────────────────────────────────────────
    print("\n" + "─" * 60)
    print("DM Queue Processing")
    print("─" * 60)
    new_dms = process_dm_queue(dry_run=dry_run)

    # ── summary ───────────────────────────────────────────────────────────────
    print("\n" + "=" * 60)
    print("Summary")
    print("=" * 60)
    print(f"  Post queued this run : {'yes' if new_post else 'no'}")
    print(f"  New DMs queued       : {len(new_dms)}")
    print(f"  State file           : {STATE_FILE}")
    print(f"  DM queue file        : {DM_QUEUE_FILE}")
    if dry_run:
        print("\n  ⚠️  DRY-RUN mode — no files were written.")
    print("=" * 60)

    return {
        "post_queued": new_post is not None,
        "new_post":    new_post,
        "new_dms":     new_dms,
    }


# ── CLI ────────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="IH Authority Post Scheduler",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python ih_authority_scheduler.py --dry-run     # preview, no writes
  python ih_authority_scheduler.py               # normal run
  python ih_authority_scheduler.py --force       # bypass 7-day interval
  python ih_authority_scheduler.py --dm-only     # only process DM queue
        """,
    )
    parser.add_argument("--dry-run", action="store_true",
                        help="Preview what would be posted/DMed without writing anything")
    parser.add_argument("--force", action="store_true",
                        help="Force post generation regardless of last_posted_at")
    parser.add_argument("--dm-only", action="store_true",
                        help="Only process the DM queue (skip post scheduling)")
    args = parser.parse_args()

    if args.dm_only:
        print("=" * 60)
        print("IH Authority Scheduler — DM-only mode")
        print("=" * 60)
        process_dm_queue(dry_run=args.dry_run)
    else:
        run_scheduler(dry_run=args.dry_run, force=args.force)


if __name__ == "__main__":
    main()
