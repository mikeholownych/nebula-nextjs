#!/usr/bin/env python3
"""
ih_signup_full.py — Complete IH signup with all wizard steps handled.
"""
import sys, time, re, json, requests, random, string
from pathlib import Path
from urllib.parse import quote
from playwright.sync_api import sync_playwright

AGENTMAIL_KEY = (Path.home() / ".hermes/secrets/agentmail.key").read_text().strip()
AM_HEADERS = {"Authorization": f"Bearer {AGENTMAIL_KEY}"}
IH_EMAIL    = "nebulashop@agentmail.to"
CREDS_PATH  = Path.home() / ".hermes/secrets/ih_creds.json"
USERNAME    = "croneb" + "".join(random.choices(string.digits, k=5))
PW          = "Neb" + "".join(random.choices(string.ascii_letters + string.digits, k=10)) + "!1"
LOG         = sys.stdout

def log(msg): print(f"[ih] {msg}", flush=True)

def pick_survey_option(page):
    items = page.query_selector_all("li.survey-question__answer")
    if items:
        items[0].click()
        log(f"  picked: {items[0].inner_text()[:40]}")
        time.sleep(0.3)
        return True
    return False

def fill_birthday(page):
    """Select month/day/year dropdowns."""
    selects = page.query_selector_all("select")
    if not selects: return False
    for sel in selects:
        placeholder = page.evaluate("el => el.options[0]?.text?.toLowerCase() || ''", sel)
        if "month" in placeholder:
            page.select_option(sel, index=6)  # June
        elif "day" in placeholder:
            page.select_option(sel, index=15)  # 15th
        elif "year" in placeholder:
            # Select 1990 or similar
            options = page.evaluate("el => Array.from(el.options).map(o=>o.value)", sel)
            if "1990" in options:
                page.select_option(sel, value="1990")
            elif options:
                page.select_option(sel, index=min(30, len(options)-1))
    log("  filled birthday")
    return True

def fill_location(page):
    loc = page.query_selector("input[placeholder*='city' i], input[placeholder*='location' i], input[name*='location' i]")
    if loc:
        loc.click(); loc.type("Toronto", delay=80)
        time.sleep(1)
        # Click first suggestion
        sugs = page.query_selector_all("[class*='suggestion'], [class*='result'], [class*='autocomplete'] li")
        if sugs:
            sugs[0].click()
        log("  filled location: Toronto")
        return True
    return False

def fill_text_fields(page):
    """Fill any visible text inputs that aren't username/email/password."""
    inputs = page.query_selector_all("input[type='text']:not([placeholder*='IndieHacker' i])")
    for inp in inputs:
        vis = page.evaluate("el => el.getBoundingClientRect().height > 0", inp)
        val = inp.input_value()
        placeholder = page.evaluate("el => el.placeholder?.toLowerCase() || ''", inp)
        if vis and not val and "twitter" in placeholder:
            inp.click(); inp.type("nebulaaudit", delay=50)
            log("  filled twitter handle")

def click_next(page):
    btns = page.query_selector_all("button")
    for priority in ["CREATE ACCOUNT", "SIGN UP", "JOIN NOW", "FINISH", "DONE", "NEXT", "CONTINUE"]:
        for b in btns:
            txt = (b.inner_text() or "").strip().upper()
            if priority in txt and not page.evaluate("el=>el.disabled", b):
                b.scroll_into_view_if_needed()
                b.click()
                return txt
    return None

def poll_verification():
    log("Polling AgentMail for verification email...")
    deadline = time.time() + 240
    seen = set()
    while time.time() < deadline:
        try:
            r = requests.get(
                f"https://api.agentmail.to/v0/inboxes/{quote(IH_EMAIL,safe='')}/messages",
                headers=AM_HEADERS, timeout=15)
            if r.status_code == 200:
                for msg in r.json().get("messages", []):
                    mid = msg.get("id","")
                    if mid in seen: continue
                    seen.add(mid)
                    subj = msg.get("subject","")
                    if any(x in subj.lower() for x in ["indiehack","verify","confirm","welcome"]):
                        log(f"  Email: {subj}")
                        r2 = requests.get(
                            f"https://api.agentmail.to/v0/inboxes/{quote(IH_EMAIL,safe='')}/messages/{quote(mid,safe='')}",
                            headers=AM_HEADERS, timeout=15)
                        body = r2.json().get("body_html","") + r2.json().get("body_text","")
                        links = [l for l in re.findall(r'https?://[^\s"<>]+', body) if "indiehacker" in l.lower()]
                        if links:
                            log(f"  Link: {links[0][:80]}")
                            return links[0]
        except Exception as e:
            log(f"  Poll error: {e}")
        time.sleep(10)
    return None

def main():
    log(f"Signup start: {USERNAME}")
    creds = {"username": USERNAME, "password": PW, "email": IH_EMAIL, "verified": False}

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
            viewport={"width": 1280, "height": 900})
        page = ctx.new_page()
        page.goto("https://www.indiehackers.com/sign-up", timeout=30000)
        time.sleep(3)

        # Step 1: username
        log("Step 1: username")
        inp = page.wait_for_selector("input[placeholder*='IndieHacker' i]", timeout=8000)
        inp.click(); inp.type(USERNAME, delay=80); time.sleep(3)
        click_next(page); time.sleep(3)

        for step in range(2, 40):
            prompt = page.evaluate("() => document.querySelector('.survey-question__prompt')?.innerText?.trim() || ''")
            url = page.url
            content = page.content().lower()
            log(f"Step {step}: {prompt[:60]} | {url[-35:]}")

            if "sign-up" not in url:
                log(f"Redirected: {url}"); break
            if "check your email" in content:
                log("Email verify screen"); break

            # Handle birthday step
            if page.query_selector("select"):
                fill_birthday(page)
                time.sleep(0.5)

            # Handle location
            fill_location(page)

            # Handle twitter/text fields
            fill_text_fields(page)

            # Handle email field
            for ei in page.query_selector_all("input[type='email']"):
                h = page.evaluate("el => el.getBoundingClientRect().height", ei)
                if h > 0 and not ei.input_value():
                    ei.click(); ei.type(IH_EMAIL, delay=50)
                    log("  filled email")

            # Handle password field
            for pi in page.query_selector_all("input[type='password']"):
                h = page.evaluate("el => el.getBoundingClientRect().height", pi)
                if h > 0 and not pi.input_value():
                    pi.click(); pi.type(PW, delay=50)
                    log("  filled password")

            # Click survey option
            pick_survey_option(page)
            time.sleep(0.3)

            result = click_next(page)
            log(f"  → {result or 'NO BUTTON'}")
            if not result:
                log("Stuck"); break
            time.sleep(2)
            if result not in ["NEXT", "CONTINUE"]:
                log(f"Submission: {result}"); time.sleep(5); break

        log(f"Final URL: {page.url}")
        page.screenshot(path="/tmp/ih_final_full.png")

        CREDS_PATH.parent.mkdir(parents=True, exist_ok=True)
        CREDS_PATH.write_text(json.dumps(creds, indent=2)); CREDS_PATH.chmod(0o600)

        content = page.content().lower()
        if "check your email" in content or "verify" in content:
            link = poll_verification()
            if link:
                page.goto(link, timeout=30000); time.sleep(3)
                creds["verified"] = True
                CREDS_PATH.write_text(json.dumps(creds, indent=2))
                log(f"Verified: {page.url}")
            else:
                log("No verification email in 4min")
        elif "sign-up" not in page.url:
            creds["verified"] = True
            CREDS_PATH.write_text(json.dumps(creds, indent=2))
            log("Active — no email verify needed")

        browser.close()
    log(f"DONE: {USERNAME} verified={creds['verified']}")
    print(json.dumps(creds))

if __name__ == "__main__":
    main()
