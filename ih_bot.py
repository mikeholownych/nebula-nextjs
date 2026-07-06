"""
IndieHackers Browser Bot
========================
Uses Playwright headless Chromium to:
  1. Log in to IndieHackers
  2. Post a reply to any thread
  3. Publish a new IH post

Exported API
------------
  login(page)                                           – authenticates the page session
  post_reply(thread_url, reply_text, creds_path)        – navigate + submit a comment
  publish_post(title, body_markdown, group_slug, creds_path) – create a new IH post

Credentials file  ~/.hermes/secrets/ih_creds.json
  { "username": "...", "password": "..." }
"""

import json
import logging
import os
import time
from pathlib import Path

from playwright.sync_api import sync_playwright, Page, TimeoutError as PWTimeout

# ─── Configuration ────────────────────────────────────────────────────────────

DEFAULT_CREDS_PATH = Path.home() / ".hermes" / "secrets" / "ih_creds.json"
IH_BASE = "https://www.indiehackers.com"
SIGN_IN_URL = f"{IH_BASE}/sign-in"
NEW_POST_URL = f"{IH_BASE}/new-post"

# Timeouts (ms)
NAV_TIMEOUT = 30_000
ACTION_TIMEOUT = 15_000
SLOW_TIMEOUT = 45_000

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [ih_bot] %(levelname)s %(message)s",
)
log = logging.getLogger("ih_bot")


# ─── Helpers ──────────────────────────────────────────────────────────────────

def load_creds(creds_path: str | Path = DEFAULT_CREDS_PATH) -> dict:
    """Load credentials from JSON file."""
    path = Path(creds_path)
    if not path.exists():
        raise FileNotFoundError(
            f"Credentials file not found: {path}\n"
            "Create it with: {\"username\": \"...\", \"password\": \"...\"}"
        )
    with path.open() as f:
        creds = json.load(f)
    required = {"username", "password"}
    missing = required - creds.keys()
    if missing:
        raise ValueError(f"Credentials file missing keys: {missing}")
    return creds


def _make_browser(playwright_instance, headless: bool = True):
    """Launch headless Chromium with sensible defaults."""
    browser = playwright_instance.chromium.launch(
        headless=headless,
        args=[
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-blink-features=AutomationControlled",
        ],
    )
    context = browser.new_context(
        user_agent=(
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
            "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
        ),
        viewport={"width": 1280, "height": 800},
        locale="en-US",
    )
    context.set_default_navigation_timeout(NAV_TIMEOUT)
    context.set_default_timeout(ACTION_TIMEOUT)
    return browser, context


def _is_logged_in(page: Page) -> bool:
    """Quick check: look for user-avatar or sign-out link."""
    try:
        page.goto(f"{IH_BASE}/", wait_until="domcontentloaded", timeout=NAV_TIMEOUT)
        # If the sign-in button is gone we're authenticated
        sign_in_visible = page.locator('a[href="/sign-in"]').is_visible()
        return not sign_in_visible
    except Exception:
        return False


# ─── Core: login ──────────────────────────────────────────────────────────────

def login(page: Page, creds_path: str | Path = DEFAULT_CREDS_PATH) -> bool:
    """
    Authenticate the Playwright page session with IH credentials.

    Args:
        page:       An open Playwright page object (any context).
        creds_path: Path to ih_creds.json.

    Returns:
        True on success, raises on failure.
    """
    creds = load_creds(creds_path)
    username = creds["username"]
    password = creds["password"]

    log.info("Navigating to sign-in page…")
    page.goto(SIGN_IN_URL, wait_until="domcontentloaded", timeout=NAV_TIMEOUT)

    # Accept cookie consent if present
    try:
        consent = page.locator('button:has-text("Accept"), button:has-text("I agree")')
        if consent.is_visible(timeout=3000):
            consent.click()
            log.info("Accepted cookie consent")
    except PWTimeout:
        pass

    # ── Email / username field ──────────────────────────────────────────────
    email_selectors = [
        'input[name="email"]',
        'input[type="email"]',
        'input[placeholder*="email" i]',
        'input[autocomplete="email"]',
    ]
    email_input = None
    for sel in email_selectors:
        loc = page.locator(sel)
        try:
            if loc.is_visible(timeout=3000):
                email_input = loc
                log.info("Found email field: %s", sel)
                break
        except PWTimeout:
            continue
    if email_input is None:
        # Dump a screenshot for debugging
        _save_debug_screenshot(page, "login_email_not_found")
        raise RuntimeError("Could not locate email input on sign-in page")

    email_input.fill(username)

    # ── Password field ──────────────────────────────────────────────────────
    password_selectors = [
        'input[name="password"]',
        'input[type="password"]',
        'input[placeholder*="password" i]',
    ]
    password_input = None
    for sel in password_selectors:
        loc = page.locator(sel)
        try:
            if loc.is_visible(timeout=3000):
                password_input = loc
                log.info("Found password field: %s", sel)
                break
        except PWTimeout:
            continue
    if password_input is None:
        _save_debug_screenshot(page, "login_password_not_found")
        raise RuntimeError("Could not locate password input on sign-in page")

    password_input.fill(password)

    # ── Submit ──────────────────────────────────────────────────────────────
    submit_selectors = [
        'button[type="submit"]',
        'button:has-text("Sign in")',
        'button:has-text("Log in")',
        'input[type="submit"]',
    ]
    submitted = False
    for sel in submit_selectors:
        loc = page.locator(sel)
        try:
            if loc.is_visible(timeout=3000):
                log.info("Clicking submit: %s", sel)
                loc.click()
                submitted = True
                break
        except PWTimeout:
            continue
    if not submitted:
        _save_debug_screenshot(page, "login_submit_not_found")
        raise RuntimeError("Could not locate submit button on sign-in page")

    # ── Wait for redirect away from sign-in ────────────────────────────────
    try:
        page.wait_for_url(lambda url: "/sign-in" not in url, timeout=SLOW_TIMEOUT)
        log.info("Login successful — redirected to: %s", page.url)
    except PWTimeout:
        # Check for error message
        error_loc = page.locator('[class*="error"], [class*="Error"], .alert')
        if error_loc.is_visible(timeout=2000):
            error_text = error_loc.inner_text()
            _save_debug_screenshot(page, "login_error")
            raise RuntimeError(f"Login failed — page error: {error_text}")
        _save_debug_screenshot(page, "login_timeout")
        raise RuntimeError(
            f"Login timed out — still on: {page.url}. "
            "Check credentials or if IH added a CAPTCHA."
        )

    return True


# ─── Core: post_reply ─────────────────────────────────────────────────────────

def post_reply(
    thread_url: str,
    reply_text: str,
    creds_path: str | Path = DEFAULT_CREDS_PATH,
) -> bool:
    """
    Navigate to a thread URL and post a reply comment.

    Args:
        thread_url:  Full URL to the IH thread/post.
        reply_text:  The comment body (plain text or markdown).
        creds_path:  Path to ih_creds.json.

    Returns:
        True on success, raises on failure.
    """
    with sync_playwright() as pw:
        browser, context = _make_browser(pw)
        page = context.new_page()
        try:
            log.info("Logging in before reply…")
            login(page, creds_path)

            log.info("Navigating to thread: %s", thread_url)
            page.goto(thread_url, wait_until="domcontentloaded", timeout=NAV_TIMEOUT)
            page.wait_for_load_state("networkidle", timeout=SLOW_TIMEOUT)

            # ── Find the comment / reply textarea ──────────────────────────
            comment_selectors = [
                'textarea[placeholder*="reply" i]',
                'textarea[placeholder*="comment" i]',
                'textarea[placeholder*="write" i]',
                'div[contenteditable="true"][class*="editor"]',
                'div[contenteditable="true"]',
                'textarea',
            ]
            comment_box = _find_visible(page, comment_selectors, timeout=5000)
            if comment_box is None:
                # Maybe we need to click a "Reply" or "Add a comment" button first
                trigger_selectors = [
                    'button:has-text("Reply")',
                    'button:has-text("Add a comment")',
                    'button:has-text("Write a reply")',
                    'a:has-text("Reply")',
                ]
                trigger = _find_visible(page, trigger_selectors, timeout=3000)
                if trigger:
                    trigger.click()
                    time.sleep(0.5)
                comment_box = _find_visible(page, comment_selectors, timeout=5000)

            if comment_box is None:
                _save_debug_screenshot(page, "reply_no_textarea")
                raise RuntimeError(
                    f"Could not find comment textarea on: {thread_url}"
                )

            log.info("Filling comment box…")
            comment_box.click()
            comment_box.fill(reply_text)

            # ── Submit the comment ─────────────────────────────────────────
            submit_selectors = [
                'button[type="submit"]:has-text("Post")',
                'button[type="submit"]:has-text("Submit")',
                'button[type="submit"]:has-text("Reply")',
                'button:has-text("Post comment")',
                'button:has-text("Post reply")',
                'button[type="submit"]',
            ]
            submit_btn = _find_visible(page, submit_selectors, timeout=5000)
            if submit_btn is None:
                _save_debug_screenshot(page, "reply_no_submit")
                raise RuntimeError("Could not find comment submit button")

            log.info("Submitting reply…")
            submit_btn.click()

            # Wait for the new comment to appear or page to update
            try:
                page.wait_for_load_state("networkidle", timeout=SLOW_TIMEOUT)
            except PWTimeout:
                pass

            log.info("Reply posted successfully on: %s", thread_url)
            return True

        finally:
            context.close()
            browser.close()


# ─── Core: publish_post ───────────────────────────────────────────────────────

def publish_post(
    title: str,
    body_markdown: str,
    group_slug: str = "",
    creds_path: str | Path = DEFAULT_CREDS_PATH,
) -> bool:
    """
    Publish a new post on IndieHackers.

    Args:
        title:          Post title.
        body_markdown:  Post body (markdown text).
        group_slug:     Optional group slug (e.g. "growth").  If empty, posts
                        to the main feed.
        creds_path:     Path to ih_creds.json.

    Returns:
        True on success, raises on failure.
    """
    post_url = (
        f"{IH_BASE}/{group_slug}/new-post" if group_slug else NEW_POST_URL
    )

    with sync_playwright() as pw:
        browser, context = _make_browser(pw)
        page = context.new_page()
        try:
            log.info("Logging in before publishing post…")
            login(page, creds_path)

            log.info("Navigating to new-post page: %s", post_url)
            page.goto(post_url, wait_until="domcontentloaded", timeout=NAV_TIMEOUT)
            page.wait_for_load_state("networkidle", timeout=SLOW_TIMEOUT)

            # ── Title ──────────────────────────────────────────────────────
            title_selectors = [
                'input[name="title"]',
                'input[placeholder*="title" i]',
                'input[type="text"]',
                'textarea[name="title"]',
            ]
            title_field = _find_visible(page, title_selectors, timeout=8000)
            if title_field is None:
                _save_debug_screenshot(page, "post_no_title")
                raise RuntimeError("Could not find post title field")

            log.info("Filling title…")
            title_field.fill(title)

            # ── Body / editor ──────────────────────────────────────────────
            body_selectors = [
                'div[contenteditable="true"][class*="editor"]',
                'div[contenteditable="true"][class*="ProseMirror"]',
                'div[contenteditable="true"]',
                'textarea[name="body"]',
                'textarea[placeholder*="body" i]',
                'textarea[placeholder*="content" i]',
                'textarea',
            ]
            body_field = _find_visible(page, body_selectors, timeout=5000)
            if body_field is None:
                _save_debug_screenshot(page, "post_no_body")
                raise RuntimeError("Could not find post body editor")

            log.info("Filling post body…")
            body_field.click()
            body_field.fill(body_markdown)

            # ── Group selector (optional) ──────────────────────────────────
            if group_slug:
                group_selectors = [
                    f'option[value="{group_slug}"]',
                    f'[data-value="{group_slug}"]',
                ]
                # Try to find a dropdown
                dropdown = page.locator('select[name="group"], select[name="community"]')
                try:
                    if dropdown.is_visible(timeout=3000):
                        dropdown.select_option(value=group_slug)
                        log.info("Selected group: %s", group_slug)
                except PWTimeout:
                    log.warning("Group selector not found; proceeding without group selection")

            # ── Publish button ─────────────────────────────────────────────
            publish_selectors = [
                'button:has-text("Publish")',
                'button:has-text("Post")',
                'button:has-text("Submit")',
                'button[type="submit"]:has-text("Post")',
                'button[type="submit"]',
            ]
            publish_btn = _find_visible(page, publish_selectors, timeout=5000)
            if publish_btn is None:
                _save_debug_screenshot(page, "post_no_publish_btn")
                raise RuntimeError("Could not find publish button")

            log.info("Clicking publish…")
            publish_btn.click()

            # Wait for navigation away from new-post page
            try:
                page.wait_for_url(
                    lambda url: "new-post" not in url and "sign-in" not in url,
                    timeout=SLOW_TIMEOUT,
                )
                log.info("Post published — now at: %s", page.url)
            except PWTimeout:
                _save_debug_screenshot(page, "post_publish_timeout")
                raise RuntimeError(
                    f"Publish timed out — still on: {page.url}. "
                    "Post may not have been submitted."
                )

            return True

        finally:
            context.close()
            browser.close()


# ─── Private helpers ──────────────────────────────────────────────────────────

def _find_visible(page: Page, selectors: list[str], timeout: int = 3000):
    """Try each selector; return the first visible Locator or None."""
    for sel in selectors:
        try:
            loc = page.locator(sel).first
            if loc.is_visible(timeout=timeout):
                return loc
        except (PWTimeout, Exception):
            continue
    return None


def _save_debug_screenshot(page: Page, tag: str):
    """Save a screenshot to /tmp for debugging."""
    try:
        path = f"/tmp/ih_bot_{tag}_{int(time.time())}.png"
        page.screenshot(path=path)
        log.warning("Debug screenshot saved: %s", path)
    except Exception as e:
        log.debug("Could not save screenshot: %s", e)


# ─── Smoke-test helper (does NOT post anything) ───────────────────────────────

def smoke_test_reach_login():
    """
    Verify that headless Chromium can reach the IH login page.
    Does NOT submit credentials. Returns page title string.
    """
    log.info("Smoke test: checking reachability of %s", SIGN_IN_URL)
    with sync_playwright() as pw:
        browser, context = _make_browser(pw)
        page = context.new_page()
        try:
            page.goto(SIGN_IN_URL, wait_until="domcontentloaded", timeout=NAV_TIMEOUT)
            title = page.title()
            url = page.url
            log.info("Reached: %s  |  title=%r", url, title)

            # Verify login form elements exist
            form_checks = {
                "email_input": page.locator('input[type="email"], input[name="email"]').count(),
                "password_input": page.locator('input[type="password"]').count(),
                "submit_btn": page.locator('button[type="submit"], input[type="submit"]').count(),
            }
            log.info("Form element counts: %s", form_checks)
            return {"url": url, "title": title, "form_checks": form_checks}
        finally:
            context.close()
            browser.close()


# ─── CLI entry point ──────────────────────────────────────────────────────────

if __name__ == "__main__":
    import argparse
    import sys

    parser = argparse.ArgumentParser(description="IndieHackers Bot")
    sub = parser.add_subparsers(dest="cmd")

    # smoke-test
    sub.add_parser("smoke", help="Verify IH login page is reachable (no credentials needed)")

    # reply
    p_reply = sub.add_parser("reply", help="Post a reply to a thread")
    p_reply.add_argument("thread_url")
    p_reply.add_argument("reply_text")
    p_reply.add_argument("--creds", default=str(DEFAULT_CREDS_PATH))

    # publish
    p_pub = sub.add_parser("publish", help="Publish a new IH post")
    p_pub.add_argument("title")
    p_pub.add_argument("body_markdown")
    p_pub.add_argument("--group", default="")
    p_pub.add_argument("--creds", default=str(DEFAULT_CREDS_PATH))

    args = parser.parse_args()

    if args.cmd == "smoke":
        result = smoke_test_reach_login()
        print(json.dumps(result, indent=2))
        sys.exit(0)
    elif args.cmd == "reply":
        post_reply(args.thread_url, args.reply_text, args.creds)
    elif args.cmd == "publish":
        publish_post(args.title, args.body_markdown, args.group, args.creds)
    else:
        parser.print_help()
        sys.exit(1)
