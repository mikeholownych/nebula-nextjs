#!/usr/bin/env python3
"""
reddit_reply_bot.py — Post drafted replies to Reddit threads using Playwright.
Uses stored credentials from ~/.hermes/secrets/reddit_creds.json.

Usage:
  python3 reddit_reply_bot.py --dry-run   # print what would be posted
  python3 reddit_reply_bot.py             # live post (max 5 per run)
"""

import sys, json, time
from pathlib import Path

DRY_RUN   = "--dry-run" in sys.argv
MAX_POSTS = 5
NEBULA    = Path("/home/mike/nebula")
DRAFTS    = NEBULA / "reddit_reply_drafts.jsonl"
CREDS_PATH= Path.home() / ".hermes/secrets/reddit_creds.json"

def log(msg): print(f"[reddit_bot] {msg}", flush=True)

def load_drafts():
    if not DRAFTS.exists():
        return []
    return [json.loads(l) for l in DRAFTS.read_text().splitlines() if l.strip()]

def save_drafts(drafts):
    with open(DRAFTS, "w") as f:
        for d in drafts:
            f.write(json.dumps(d) + "\n")

def post_reply(permalink, reply_text, creds):
    """Navigate to thread and post reply via Playwright."""
    from playwright.sync_api import sync_playwright, TimeoutError as PWTimeout

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
                       "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = ctx.new_page()

        # ── Login ──────────────────────────────────────────────────
        log("Logging in to Reddit...")
        page.goto("https://www.reddit.com/login", timeout=30000)
        time.sleep(2)
        try:
            page.fill("input#loginUsername", creds["username"], timeout=8000)
            page.fill("input#loginPassword", creds["password"], timeout=8000)
            page.click("button[type='submit']", timeout=5000)
            time.sleep(3)
        except PWTimeout:
            log("Login form not found — may already be logged in or blocked")

        if "login" in page.url:
            log(f"BLOCKED: Still on login page after submit. URL: {page.url}")
            page.screenshot(path="/tmp/reddit_login_fail.png")
            browser.close()
            return False

        # ── Navigate to thread ─────────────────────────────────────
        log(f"Navigating to: {permalink[:60]}")
        page.goto(permalink, timeout=30000)
        time.sleep(3)
        page.screenshot(path="/tmp/reddit_thread.png")

        # ── Find reply box ─────────────────────────────────────────
        # Reddit uses a rich text editor; look for the comment textarea
        for sel in [
            "[data-testid='comment-submit-button']",
            "div[contenteditable='true']",
            "textarea[placeholder*='comment' i]",
            ".usertext-edit textarea",
        ]:
            try:
                el = page.wait_for_selector(sel, timeout=5000)
                if el:
                    log(f"Found reply box: {sel}")
                    # Click into it first
                    el.click()
                    time.sleep(1)
                    el.fill(reply_text)
                    time.sleep(1)
                    # Submit
                    for submit_sel in ["button[type='submit']:has-text('Comment')",
                                      "button:has-text('Comment')",
                                      "[data-testid='comment-submit-button']"]:
                        try:
                            page.click(submit_sel, timeout=3000)
                            time.sleep(3)
                            log("Reply submitted.")
                            page.screenshot(path="/tmp/reddit_reply_sent.png")
                            browser.close()
                            return True
                        except Exception:
                            continue
            except PWTimeout:
                continue

        log("Could not find reply box or submit button.")
        page.screenshot(path="/tmp/reddit_reply_fail.png")
        browser.close()
        return False

def main():
    drafts = load_drafts()
    unposted = [d for d in drafts if not d.get("posted")]
    log(f"Unposted drafts: {len(unposted)}")

    if not unposted:
        log("Nothing to post.")
        return

    if DRY_RUN:
        print(f"\n[DRY-RUN] Would post {min(len(unposted), MAX_POSTS)} replies:\n")
        for d in unposted[:MAX_POSTS]:
            print(f"  Thread: {d['permalink'][:70]}")
            print(f"  Reply:  {d['reply'][:120]}...")
            print()
        return

    # Load creds
    if not CREDS_PATH.exists():
        log(f"No credentials at {CREDS_PATH} — run reddit_signup.py first")
        sys.exit(1)
    creds = json.loads(CREDS_PATH.read_text())

    posted = 0
    for d in unposted[:MAX_POSTS]:
        log(f"\nPosting to: {d['permalink'][:70]}")
        ok = post_reply(d["permalink"], d["reply"], creds)
        if ok:
            d["posted"]    = True
            d["posted_at"] = __import__("datetime").datetime.utcnow().isoformat()
            posted += 1
        time.sleep(30)  # Reddit rate limit

    save_drafts(drafts)
    log(f"\nDone. Posted {posted}/{min(len(unposted), MAX_POSTS)}")

if __name__ == "__main__":
    main()
