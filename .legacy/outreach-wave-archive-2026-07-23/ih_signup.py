#!/usr/bin/env python3
"""
ih_signup.py — Autonomously create an IndieHackers account.
Uses AgentMail nebulashop@agentmail.to to receive verification email.
Saves credentials to ~/.hermes/secrets/ih_creds.json on success.

Key insight: IH uses Ember.js — must use .type() NOT .fill() for inputs.
The form has multiple onboarding steps with radio selections.
"""

import sys, time, re, json, requests, random, string
from pathlib import Path
from urllib.parse import quote
from playwright.sync_api import sync_playwright, TimeoutError as PWTimeout

AGENTMAIL_KEY = (Path.home() / ".hermes/secrets/agentmail.key").read_text().strip()
AM_BASE     = "https://api.agentmail.to/v0"
AM_HEADERS  = {"Authorization": f"Bearer {AGENTMAIL_KEY}", "Content-Type": "application/json"}
IH_INBOX_ID = "nebulashop@agentmail.to"
IH_EMAIL    = "nebulashop@agentmail.to"
CREDS_PATH  = Path.home() / ".hermes/secrets/ih_creds.json"

def log(msg): print(f"[ih_signup] {msg}", flush=True)

def pick_first_radio(page):
    """Select the first available radio/option on any step."""
    selectors = [
        "input[type='radio']",
        "label.radio-button:not(.is-selected)",
        "[class*='option']:not([class*='selected'])",
    ]
    for sel in selectors:
        options = page.query_selector_all(sel)
        enabled = [o for o in options if not page.evaluate("el => el.disabled", o)]
        if enabled:
            try:
                enabled[0].click()
                return True
            except Exception:
                continue
    # Try clicking any text label that looks like an option
    labels = page.query_selector_all("label")
    for l in labels:
        txt = l.inner_text().strip()
        if txt and len(txt) < 80:
            try:
                l.click()
                time.sleep(0.3)
                return True
            except Exception:
                continue
    return False

def click_next_or_create(page):
    """Click NEXT, CREATE, JOIN, SIGN UP, or FINISH button. Returns button text clicked."""
    all_btns = page.query_selector_all("button")
    priority = ["CREATE", "SIGN UP", "JOIN", "FINISH", "DONE", "NEXT", "CONTINUE"]
    for target in priority:
        for b in all_btns:
            txt = (b.inner_text() or "").strip().upper()
            if target in txt:
                enabled = not page.evaluate("el => el.disabled", b)
                if enabled:
                    b.click()
                    return txt
    return None

def advance_step(page, step_num):
    """Try to advance past current onboarding step."""
    log(f"  Step {step_num}: picking radio option...")
    pick_first_radio(page)
    time.sleep(0.5)

    # If email field is visible and empty, fill it
    email_inp = page.query_selector("input[type='email']")
    if email_inp:
        visible = page.evaluate("el => { const r=el.getBoundingClientRect(); return r.height>0 && r.top<600; }", email_inp)
        current_val = email_inp.input_value()
        if visible and not current_val:
            email_inp.click()
            email_inp.type(IH_EMAIL, delay=50)
            log(f"  Filled email")
            time.sleep(0.5)

    # If password field is visible and empty, fill it
    pwd_inputs = page.query_selector_all("input[type='password']")
    for pi in pwd_inputs:
        visible = page.evaluate("el => { const r=el.getBoundingClientRect(); return r.height>0; }", pi)
        current_val = pi.input_value()
        if visible and not current_val:
            pi.click()
            pi.type(PW, delay=50)
            log(f"  Filled password")
            time.sleep(0.5)

    # Click next/create
    clicked = click_next_or_create(page)
    log(f"  Clicked: {clicked}")
    time.sleep(2)
    return clicked

def poll_verification(max_wait=240):
    log("Polling for verification email...")
    deadline = time.time() + max_wait
    seen = set()
    while time.time() < deadline:
        r = requests.get(f"{AM_BASE}/inboxes/{quote(IH_INBOX_ID,safe='')}/messages",
                        headers=AM_HEADERS, timeout=15)
        if r.status_code == 200:
            for msg in r.json().get("messages", []):
                mid = msg.get("id","")
                if mid in seen: continue
                seen.add(mid)
                subj = msg.get("subject","")
                if any(x in subj.lower() for x in ["indiehack","verify","confirm","welcome"]):
                    log(f"  Got email: '{subj}'")
                    r2 = requests.get(f"{AM_BASE}/inboxes/{quote(IH_INBOX_ID,safe='')}/messages/{quote(mid,safe='')}",
                                     headers=AM_HEADERS, timeout=15)
                    body = r2.json().get("body_html","") + r2.json().get("body_text","")
                    links = re.findall(r'https?://[^\s"<>]*(?:verif|confirm|token|auth|click)[^\s"<>]*', body, re.I)
                    if links:
                        log(f"  Link found: {links[0][:80]}")
                        return links[0]
        time.sleep(10)
    return None

def main():
    USERNAME = "crobot" + "".join(random.choices(string.digits, k=6))
    global PW
    PW = "Neb" + "".join(random.choices(string.ascii_letters + string.digits, k=10)) + "!1"
    log(f"Starting signup: username={USERNAME}")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
            viewport={"width": 1280, "height": 900}
        )
        page = ctx.new_page()
        page.goto("https://www.indiehackers.com/sign-up", timeout=30000)
        time.sleep(3)

        # ── Step 1: Username ────────────────────────────────────────
        log("Step 1: username")
        inp = page.wait_for_selector("input[placeholder*='IndieHacker' i]", timeout=8000)
        inp.click()
        inp.type(USERNAME, delay=80)
        time.sleep(3)  # Let Firebase check username availability
        
        btns = page.query_selector_all("button")
        next_btn = next((b for b in btns if "NEXT" in (b.inner_text() or "").upper()), None)
        if next_btn:
            next_btn.click()
            time.sleep(3)
        
        # ── Steps 2-10: Onboarding wizard ──────────────────────────
        prev_wizard = ""
        for step in range(2, 15):
            wizard = page.evaluate(
                "() => document.querySelector('[class*=\"auth-wizard\"]')?.innerText?.substring(0,200) || ''"
            )
            log(f"Step {step} wizard: {wizard[:80].strip()}")
            
            # Detect final success states
            if any(x in page.url for x in ["/dashboard", "/feed", "/groups", "/products"]):
                log(f"SUCCESS: Reached {page.url}")
                break
            if "sign-up" not in page.url and page.url != "https://www.indiehackers.com/":
                log(f"Redirected to: {page.url}")
                break
            
            # Detect email verification screen
            if "check your email" in wizard.lower() or "check your email" in page.content().lower():
                log("Email verification screen detected")
                break
            
            # No change → stuck
            if wizard == prev_wizard and step > 3:
                log("Wizard didn't change — trying forced radio pick + NEXT")
            prev_wizard = wizard
            
            result = advance_step(page, step)
            if not result:
                log("No button to click — done with wizard or stuck")
                break
            
            if any(x in (result or "") for x in ["CREATE", "SIGN UP", "JOIN", "FINISH", "DONE"]):
                log("Final submission clicked")
                time.sleep(5)
                break

        final_url = page.url
        log(f"Final URL: {final_url}")
        page.screenshot(path="/tmp/ih_final_state.png")

        # Save creds
        creds = {"username": USERNAME, "password": PW, "email": IH_EMAIL, "verified": False}
        CREDS_PATH.parent.mkdir(parents=True, exist_ok=True)
        CREDS_PATH.write_text(json.dumps(creds, indent=2))
        CREDS_PATH.chmod(0o600)
        log(f"Creds saved: {USERNAME}")

        # Check if verification email needed
        content = page.content().lower()
        if "check your email" in content or "verify" in content or "verif" in final_url:
            link = poll_verification(240)
            if link:
                log(f"Navigating verification link...")
                page.goto(link, timeout=30000)
                time.sleep(3)
                log(f"Verified. URL: {page.url}")
                creds["verified"] = True
                CREDS_PATH.write_text(json.dumps(creds, indent=2))
            else:
                log("No verification email received in time")
        elif any(x in final_url for x in ["/dashboard", "/feed", "indiehackers.com/"]) and "sign-up" not in final_url:
            log("Account created and active — no email verify needed")
            creds["verified"] = True
            CREDS_PATH.write_text(json.dumps(creds, indent=2))
        
        log(f"Done. verified={creds['verified']}")
        browser.close()

if __name__ == "__main__":
    main()
