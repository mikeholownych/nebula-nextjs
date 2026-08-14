#!/usr/bin/env python3
"""Prospect verification gate - run BEFORE any outreach send.

Established because batch 1+2 of agency outreach shipped guessed-pattern
addresses: 9 attempts, ~0 confirmed delivered. Every bounce degrades sender
domain reputation, so list errors compound into deliverability errors and
then into a false read on demand.

Primary verifier: Hunter.io (API key in .env as HUNTER_API_KEY).
  - email-verifier: SMTP-level mailbox check run on Hunter's infrastructure
    (the Nebula host has port-25 egress blocked, so local SMTP probing is
    impossible - Hunter replaces it).
  - domain-search: indexed people at the firm with position, seniority,
    decision_maker flag, and confidence. This is the Keenan-class killer:
    it distinguishes founder/owner/CEO of a paid-media agency from an
    employee at an adjacent firm.

Secondary signals (kept for context, never gating alone):
  - firm's own site: paid-media keywords + mailto: extraction
  - lead_state.db: prior hard bounce from the DSN monitor overrides ALL

Rate-limit hygiene: Hunter free plan = 25 searches + 50 verifications/month.
Results are cached in ops/agency_verify_cache.json; re-runs reuse the cache
unless --fresh is passed.

Verdicts:
  PASS    - deliverable (Hunter) AND person confirmed with decision-maker /
            founder-level role at a paid-media firm
  REVIEW  - deliverable but role unconfirmed (send-blocked until confirmed),
            OR role confirmed but deliverability uncertain
  FAIL    - undeliverable, prior bounce, no person match, or wrong ICP

Usage:
  python verify_prospect.py candidates.json [--fresh]
  candidates.json: [{"name": "...", "email": "...", "domain": "...",
                     "site": "https://...", "linkedin": "..."}]
"""
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from design_partner_feedback import record_feedback
from mailcheck_adapter import MailCheckAdapter, MailCheckError

CACHE_PATH = "ops/agency_verify_cache.json"

PAID_MEDIA_KEYWORDS = [
    "google ads", "ppc", "paid search", "meta ads", "facebook ads",
    "paid media", "performance marketing", "conversion rate optimization",
    "cro", "landing page", "adwords", "media buying", "google ads management",
    "conversion optimization", "ctr", "roas", "ad spend", "paid traffic",
]

# Roles that clear the "founder/decision-maker" bar for the agency ICP.
DM_ROLE_KEYWORDS = [
    "founder", "co-founder", "ceo", "coo", "owner", "principal",
    "managing director", "managing partner", "director", "head of",
    "vice president", "president",
]


def hunter_key():
    key = os.environ.get("HUNTER_API_KEY", "")
    if not key:
        for line in open(".env"):
            if line.startswith("HUNTER_API_KEY="):
                key = line.strip().split("=", 1)[1]
                break
    if not key:
        raise SystemExit("HUNTER_API_KEY not found in .env")
    return key


def hunter_get(path):
    key = hunter_key()
    sep = "&" if "?" in path else "?"
    url = "https://api.hunter.io/v2/" + path + sep + "api_key=" + key
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=25) as r:
        return json.loads(r.read().decode())


def load_cache():
    try:
        with open(CACHE_PATH) as f:
            return json.load(f)
    except Exception:
        return {}


def save_cache(cache):
    os.makedirs(os.path.dirname(CACHE_PATH) or ".", exist_ok=True)
    with open(CACHE_PATH, "w") as f:
        json.dump(cache, f, indent=2)


def verify_email(email, cache, fresh=False):
    """Hunter email-verifier with cache. Returns dict of verdict fields."""
    if not fresh and email in cache.get("emails", {}):
        return cache["emails"][email]
    try:
        d = hunter_get("email-verifier?email=" + urllib.parse.quote(email))
        data = d.get("data", {})
    except urllib.error.HTTPError as e:
        data = {"error": "HTTP %s %s" % (e.code, e.read().decode()[:120])}
    except Exception as e:
        data = {"error": str(e)[:120]}
    cache.setdefault("emails", {})[email] = data
    save_cache(cache)
    return data


def search_domain(domain, cache, fresh=False):
    """Hunter domain-search with cache. Returns (org_name, emails, pattern)."""
    if not fresh and domain in cache.get("domains", {}):
        return cache["domains"][domain]
    try:
        d = hunter_get("domain-search?domain=" + urllib.parse.quote(domain) + "&limit=10")
        data = d.get("data", {})
        org = data.get("organization", "")
        org_name = org if isinstance(org, str) else (org or {}).get("name", "")
        emails = data.get("emails", [])
        result = {"org": org_name, "pattern": data.get("pattern"),
                  "accept_all": data.get("accept_all"), "emails": emails}
    except urllib.error.HTTPError as e:
        result = {"org": "", "pattern": None, "accept_all": None,
                  "emails": [], "error": "HTTP %s %s" % (e.code, e.read().decode()[:120])}
    except Exception as e:
        result = {"org": "", "pattern": None, "accept_all": None,
                  "emails": [], "error": str(e)[:120]}
    cache.setdefault("domains", {})[domain] = result
    save_cache(cache)
    return result


def lead_state(email):
    """Return (stage, score) for a previously-registered email from lead_state.db."""
    try:
        import sqlite3
        db = sqlite3.connect("lead_state.db")
        row = db.execute(
            "SELECT stage, lead_score FROM leads WHERE email = ? ORDER BY updated_at DESC LIMIT 1",
            (email,)
        ).fetchone()
        db.close()
        if row:
            return row[0], row[1]
    except Exception:
        pass
    return None, None


def fetch_text(url, timeout=12):
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return (r.read().decode("utf-8", errors="replace") or "").lower()[:400000]
    except Exception:
        return ""


def site_paid_media(site):
    """Firm-fit: does the firm's own site sell paid media / conversion work?"""
    pages = [site.rstrip("/") + "/"]
    for slug in ("about", "about-us", "services", "contact"):
        pages.append(site.rstrip("/") + "/" + slug)
    combined = " ".join(fetch_text(p) for p in pages)
    return any(k in combined for k in PAID_MEDIA_KEYWORDS)


def find_mailtos(site):
    found = []
    for slug in ("", "about", "about-us", "team", "contact", "contact-us"):
        txt = fetch_text(site.rstrip("/") + ("/" + slug if slug else ""))
        for m in re.finditer(r"mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})", txt, re.I):
            found.append(m.group(1).lower())
    return sorted(set(found))


def role_ok(position):
    pos = (position or "").lower()
    # "ceo" as a word won't match "Chief Executive Officer" - normalize first.
    if "ceo" in pos or "chief executive" in pos:
        return True
    if "coo" in pos or "chief operating" in pos:
        return True
    return any(k in pos for k in DM_ROLE_KEYWORDS)


def verify(candidate, cache, fresh=False):
    name = candidate.get("name", "?")
    email = (candidate.get("email", "") or "").lower()
    domain = candidate.get("domain", "").lower()
    site = candidate.get("site", "")
    linkedin = candidate.get("linkedin", "")

    print("\n== %s <%s> (domain %s) ==" % (name, email, domain))

    # 0. Domain match
    if not email or email.split("@")[-1] != domain:
        print("  verdict: FAIL (email domain does not match firm domain)")
        return {"name": name, "email": email, "verdict": "FAIL", "reason": "domain_mismatch"}

    # 0b. Prior bounce overrides everything
    stage, lscore = lead_state(email)
    if stage == "bounced":
        print("  verdict: FAIL (prior hard bounce on file)")
        return {"name": name, "email": email, "verdict": "FAIL", "reason": "prior_bounce"}

    # 1. Hunter email-verifier (SMTP-level, run on Hunter's infra)
    ev = verify_email(email, cache, fresh=fresh)
    status = ev.get("status")
    result = ev.get("result")
    score = ev.get("score")
    smtp = ev.get("smtp_check")
    print("  hunter verifier: status=%s result=%s score=%s smtp=%s" % (status, result, score, smtp))
    try:
        mc_decision = MailCheckAdapter().verify_for_outreach(
            email,
            lead_id="verify-prospect:" + email,
            source="scripts.verify_prospect",
        )
        mailcheck_observation = {
            "verification_id": mc_decision.verification_id,
            "classification": mc_decision.classification,
            "decision": mc_decision.decision,
            "allowed": mc_decision.allowed,
            "reason": mc_decision.reason,
        }
        print("  mailcheck: classification=%s decision=%s allowed=%s" % (
            mc_decision.classification, mc_decision.decision, mc_decision.allowed))
    except (MailCheckError, ValueError) as exc:
        mailcheck_observation = {"error": "MAILCHECK_UNAVAILABLE"}
        print("  mailcheck: unavailable")
    deliverable = result == "deliverable" or status in ("valid", "accept_all") and smtp is True
    if not mailcheck_observation.get("allowed", False):
        deliverable = False
    undeliverable = result == "undeliverable" or status == "invalid"

    # 2. Hunter domain-search: person + role at the firm
    ds = search_domain(domain, cache, fresh=fresh)
    record_feedback(
        feedback_type="coverage_gap",
        capability="hunter_domain_search_person_enrichment",
        workflow="scripts.verify_prospect",
        observation="Hunter supplies indexed people, roles, seniority, decision-maker, and confidence fields; MailCheck currently supplies verification evidence but not this enrichment surface.",
        impact="Nebula uses this data to distinguish a founder or decision-maker from an employee before outreach.",
        evidence={"domain": domain, "email_hash": MailCheckAdapter._email_hash(email)},
    )
    person = None
    parts = [p for p in name.lower().replace(".", " ").split() if len(p) > 1]
    first, last = (parts[0] if parts else ""), (parts[-1] if len(parts) > 1 else "")
    for e in ds.get("emails", []):
        if (e.get("value") or "").lower() == email:
            person = e
            break
    if person is None:
        for e in ds.get("emails", []):
            ef, el = (e.get("first_name") or "").lower(), (e.get("last_name") or "").lower()
            if (first and last) and (ef == first and el == last):
                person = e
                break
            if (first and last) and (ef == first and (not el or el == last)):
                person = e
                break
    if person:
        print("  hunter person: %s %s | pos=%s | seniority=%s | dm=%s | conf=%s | %s" % (
            person.get("first_name"), person.get("last_name"), person.get("position"),
            person.get("seniority"), person.get("decision_maker"),
            person.get("confidence"), person.get("value")))
    else:
        print("  hunter person: NOT FOUND for '%s' at %s (indexed: %s)" % (
            name, domain, ", ".join(e.get("value") for e in ds.get("emails", [])[:5]) or "none"))

    # 3. Firm fit from the firm's own site
    paid = site_paid_media(site)
    print("  site paid-media signal:", paid)

    # 4. Verdict
    if undeliverable:
        verdict, reason = "FAIL", "undeliverable"
    elif stage == "bounced":
        verdict, reason = "FAIL", "prior_bounce"
    elif deliverable and person and role_ok(person.get("position")):
        if paid:
            verdict, reason = "PASS", "deliverable_dm_paid_firm"
        else:
            verdict, reason = "REVIEW", "deliverable_dm_no_paid_signal"
    elif deliverable and person and not role_ok(person.get("position")):
        verdict, reason = "REVIEW", "deliverable_employee_role"
    elif deliverable and not person:
        verdict, reason = "REVIEW", "deliverable_person_unconfirmed"
    elif not deliverable and status == "accept_all":
        verdict, reason = "REVIEW", "accept_all_risky"
    else:
        verdict, reason = "REVIEW", "mixed_signals"

    print("  verdict:", verdict, "(", reason, ")")
    return {
        "name": name, "email": email, "verdict": verdict, "reason": reason,
        "hunter": {"status": status, "result": result, "score": score, "smtp": smtp},
        "mailcheck": mailcheck_observation,
        "person": (person or {}).get("value") if person else None,
        "person_position": (person or {}).get("position") if person else None,
        "site_paid_media": paid,
    }


def main():
    if len(sys.argv) < 2:
        print("usage: verify_prospect.py candidates.json [--fresh]")
        return 1
    fresh = "--fresh" in sys.argv
    with open(sys.argv[1]) as f:
        candidates = json.load(f)
    cache = load_cache()
    results = [verify(c, cache, fresh=fresh) for c in candidates]
    save_cache(cache)
    print("\n=== SUMMARY ===")
    for r in results:
        print("  [%s] %s <%s> - %s" % (r["verdict"], r["name"], r["email"], r["reason"]))
    return 0


if __name__ == "__main__":
    sys.exit(main())
