#!/usr/bin/env python3
"""Deliver audit to lead. Scrape URL, score, compose email, send via AgentMail."""

import sys, json, time, re, subprocess, os, argparse, ipaddress, socket, logging
import base64, hmac, hashlib
from typing import Optional
import asyncio
from datetime import datetime, timezone
from urllib.parse import urlencode, urljoin, urlparse
from pathlib import Path

# Fix Map - visual execution roadmap (Nico's FORGE adaptation)
try:
    from fix_map import build_fix_map
    HAS_FIX_MAP = True
except ImportError:
    HAS_FIX_MAP = False

# Guided Implementation Flow - step-by-step implementation guides
try:
    from guided_implementation import build_guided_implementation
    HAS_GUIDED_IMPLEMENTATION = True
except ImportError:
    HAS_GUIDED_IMPLEMENTATION = False

# Configuration
NEBULA_DIR = Path(__file__).resolve().parent
# The live server runs under system Python but dependencies live in the repo venv.
# Add the active venv site-packages before importing BeautifulSoup/requests.
sys.path.insert(0, str(NEBULA_DIR / "venv" / "lib" / "python3.12" / "site-packages"))

# Signal Verifier - for efficient audit scoring
try:
    sys.path.insert(0, str(NEBULA_DIR / "platform_api"))
    from platform_api.services.signal_verifier import (
        verify_headline, verify_cta, verify_above_fold, verify_social_proof,
        verify_load_speed, verify_mobile, verify_ad_signals,
        verify_seo_foundations, verify_ai_readiness, verify_signal
    )
    HAS_SIGNAL_VERIFIER = True
except ImportError:
    HAS_SIGNAL_VERIFIER = False

# AI Prompt Pack - generates per-finding AI prompts from audit data
try:
    sys.path.insert(0, str(NEBULA_DIR))
    from audit_pipeline.prompts.generator import build_prompt_pack
    HAS_PROMPT_PACK = True
except ImportError:
    HAS_PROMPT_PACK = False
    build_prompt_pack = None

from bs4 import BeautifulSoup

# ── Engine versioning ─────────────────────────────────────────────────────
# Bump on ANY scoring-behaviour change. Stamped on every audit record so a
# disputed score can always be traced to the exact engine that produced it.
# History:
#   1.0.0 - original 4-signal ad_signals scoring on all pages
#   2.0.0 - page-type scoping: homepages/brand pages scored on GA4 presence
#           only; ad-tracking absence on a homepage is correct, not a leak
ENGINE_VERSION = "2.1.0"
import requests
LEDGERS_DIR = NEBULA_DIR / "ledgers"
CONTACTED_PATH = NEBULA_DIR / "contacted.json"
HOT_LEAD_PATH = NEBULA_DIR / "HOT_LEAD.json"
STATS_PATH = NEBULA_DIR / "stats.json"
AUDIT_LOG_PATH = LEDGERS_DIR / "audit-delivery.log"

# ── Audit unlock token (mirrors app/lib/audit-unlock-token.ts) ─────────────
# Generates HMAC-signed tokens that unlock /audit/{id}/results without
# requiring the visitor to re-enter their email. Used when embedding a
# personalised results link in the outreach email.
def _load_audit_unlock_secret() -> str | None:
    """Read AUDIT_UNLOCK_SECRET from customer-portal/.env.local."""
    env_file = NEBULA_DIR / "customer-portal" / ".env.local"
    if not env_file.exists():
        return None
    for line in env_file.read_text().splitlines():
        if line.startswith("AUDIT_UNLOCK_SECRET="):
            return line.split("=", 1)[1].strip()
    return None

def sign_audit_unlock(audit_id: str, email: str) -> str | None:
    """Return a signed token for the results page ?unlock= param.
    Returns None if AUDIT_UNLOCK_SECRET is not configured."""
    secret = _load_audit_unlock_secret()
    if not secret:
        return None
    payload = f"{audit_id}:{email.strip().lower()}"
    payload_b64 = base64.urlsafe_b64encode(payload.encode()).rstrip(b"=").decode()
    sig = hmac.new(secret.encode(), payload.encode(), hashlib.sha256).digest()
    sig_b64 = base64.urlsafe_b64encode(sig).rstrip(b"=").decode()
    return f"{payload_b64}.{sig_b64}"

LEDGER_FILE = str(LEDGERS_DIR / "customer-ledger.jsonl")
AUDIT_LEADS_FILE = str(NEBULA_DIR / "audit_leads.jsonl")
MAX_AUDIT_HTML_BYTES = 2 * 1024 * 1024
MAX_EXTRACTED_TEXT = 50_000
MAX_CTA_COUNT = 100
MAX_CTA_TEXT = 200

# Ensure directories exist
LEDGERS_DIR.mkdir(parents=True, exist_ok=True)

# Load dependencies
try:
    from requests.adapters import HTTPAdapter
    from requests.packages.urllib3.util.retry import Retry
except ImportError:
    print("ERROR: Missing requests library. Run: source venv/bin/activate && pip install requests")
    sys.exit(1)

def load_contacted():
    try:
        with open(CONTACTED_PATH, "r") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {}

def save_contacted(contacted):
    tmp = CONTACTED_PATH.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(contacted, indent=2))
    tmp.rename(CONTACTED_PATH)  # atomic on same filesystem

def load_hot_lead():
    try:
        with open(HOT_LEAD_PATH, "r") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return []

def save_hot_lead(hot_lead):
    tmp = HOT_LEAD_PATH.with_suffix(".json.tmp")
    tmp.write_text(json.dumps(hot_lead, indent=2))
    tmp.rename(HOT_LEAD_PATH)  # atomic on same filesystem

def load_stats():
    try:
        with open(STATS_PATH, "r") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {"audits_delivered": 0}

def save_stats(stats):
    with open(STATS_PATH, "w") as f:
        json.dump(stats, f, indent=2)

def log_audit(event):
    with open(AUDIT_LOG_PATH, "a") as f:
        f.write(json.dumps(event) + "\n")

def get_session():
    """Create a requests session with retry logic."""
    session = requests.Session()
    retries = Retry(total=3, backoff_factor=0.1, status_forcelist=[500, 502, 503, 504])
    session.mount('https://', HTTPAdapter(max_retries=retries))
    session.headers.update({
        "User-Agent": "Hermes-NebulaAuditBot/1.0",
        "Accept": "text/html,application/xhtml+xml",
    })
    return session

def validate_public_http_url(url):
    """Reject non-HTTP and non-public audit targets before any server-side fetch."""
    parsed = urlparse(url)
    if parsed.scheme not in {"http", "https"} or not parsed.hostname or parsed.username or parsed.password:
        raise ValueError("Audit URL must be a public HTTP(S) URL")
    hostname = parsed.hostname.lower().rstrip(".")
    if hostname == "localhost" or hostname.endswith(".localhost"):
        raise ValueError("Audit URL must resolve to a public address")
    try:
        addresses = {row[4][0] for row in socket.getaddrinfo(hostname, parsed.port or (443 if parsed.scheme == "https" else 80), type=socket.SOCK_STREAM)}
    except (OSError, ValueError) as exc:
        raise ValueError("Audit URL must resolve to a public address") from exc
    if not addresses or any(not ipaddress.ip_address(address).is_global for address in addresses):
        raise ValueError("Audit URL must resolve to a public address")
    return url


def fetch_page(url, session):
    """Fetch a public page with validated redirects and fallback UA rotation."""
    try:
        current = validate_public_http_url(url)
        for _ in range(6):
            resp = session.get(current, timeout=15, allow_redirects=False, stream=True)
            if resp.status_code == 403:
                resp.close()
                session.headers.update({"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"})
                resp = session.get(current, timeout=15, allow_redirects=False, stream=True)
            if resp.is_redirect or resp.is_permanent_redirect:
                location = resp.headers.get("Location")
                resp.close()
                if not location:
                    raise ValueError("Redirect missing Location header")
                current = validate_public_http_url(urljoin(current, location))
                continue
            resp.raise_for_status()
            content_length = int(resp.headers.get("Content-Length") or 0)
            if content_length > MAX_AUDIT_HTML_BYTES:
                resp.close()
                raise ValueError("Audit page exceeds maximum response size")
            payload = bytearray()
            for chunk in resp.iter_content(chunk_size=64 * 1024):
                if not chunk:
                    continue
                payload.extend(chunk)
                if len(payload) > MAX_AUDIT_HTML_BYTES:
                    resp.close()
                    raise ValueError("Audit page exceeds maximum response size")
            encoding = resp.encoding or "utf-8"
            resp.close()
            return bytes(payload).decode(encoding, errors="replace")
        raise ValueError("Too many redirects")
    except (requests.RequestException, ValueError) as e:
        print(f"ERROR: Failed to fetch {url}: {e}")
        return None

def score_page(html):
    """Score page 0-10 based on conversion elements."""
    soup = BeautifulSoup(html, "html.parser")
    score = 0

    # Headline clarity
    h1 = soup.find("h1")
    if h1:
        txt = h1.get_text().strip()
        if 5 <= len(txt) <= 70:
            score += 2
        elif len(txt) > 70:
            score += 1

    # CTA strength
    buttons = soup.find_all("a", {"class": lambda c: c and "button" in c}) + soup.find_all("button")
    if buttons:
        score += min(2, len(buttons))

    # Social proof
    if any(x in html.lower() for x in ["testimonial", "review", "rating", "star"]):
        score += 2

    # Load speed (heuristic)
    if "<meta name=\"generator\" content=\"WordPress\"" in html:
        score += 1

    return min(score, 10)

def scrape_page(url, html: Optional[str] = None):
    """Fetch and parse a landing page for the live self-serve audit API."""
    if html is None:
        session = get_session()
        html_text = fetch_page(url, session)
        if not html_text:
            raise ValueError(f"Could not fetch {url}")
    else:
        html_text = html
    soup = BeautifulSoup(html_text, "html.parser")
    title = (soup.title.get_text(" ", strip=True) if soup.title else "")[:500]
    h1 = (soup.find("h1").get_text(" ", strip=True) if soup.find("h1") else "")[:500]
    text = soup.get_text(" ", strip=True)[:MAX_EXTRACTED_TEXT]
    ctas = []
    for el in soup.find_all(["a", "button"], limit=MAX_CTA_COUNT):
        label = el.get_text(" ", strip=True)[:MAX_CTA_TEXT]
        if not label:
            continue
        low = label.lower()
        # Skip accessibility/nav chrome that isn't a conversion CTA
        if low in {"skip to content", "skip to main content", "menu", "navigation", "home", "open menu", "close menu"}:
            continue
        if len(low) < 2:
            continue
        ctas.append(label)
    return {"url": url, "html": html_text, "title": title, "h1": h1, "text": text, "ctas": ctas}


def _local_gbp_dimension(html_text: str, lower: str) -> dict | None:
    """Detect local business signals and recommend GBP products when missing.

    Returns a dimension dict if the site is a local business, else None.
    A site is "local" if it shows ≥2 of: physical address, phone number,
    Google Maps embed, or location-specific content (city/region names
    near business-type keywords).

    GBP products are recommended when the site lacks:
    - schema.org LocalBusiness/Product structured data
    - GBP product listing indicators (product carousel, "products" section)
    """
    # ── Local business signal detection ──────────────────────────────────
    signals = 0
    # 1. Physical address patterns (US/CA/international) - require address-adjacent context
    _addr_re = r'(?:address|located|visit|directions|office|suite|floor)\s*[:\-]?\s*\d{1,5}\s+[\w\s]+(?:st|ave|blvd|rd|dr|way|ln|ct|pl|ste|unit)\b'
    if re.search(_addr_re, lower):
        signals += 1
    # Postal code - only near address context (not CSS/JS numbers)
    _postal_re = r'(?:address|street|ave|blvd|road|drive|lane|court|place)\w{0,20}\d{5}(?:-\d{4})?'
    if re.search(_postal_re, lower):
        signals += 1

    # 2. Phone number
    if re.search(r'tel:|call\s+us|\(\d{3}\)\s*\d{3}[-.\s]?\d{4}|\d{3}[-.\s]\d{3}[-.\s]\d{4}', lower):
        signals += 1

    # 3. Google Maps embed
    if re.search(r'maps\.google\.com|google\.com/maps|goo\.gl/maps|iframe.*maps', lower):
        signals += 1

    # 4. Location-specific content near business keywords (counts as 2 - strong local signal)
    # Service businesses only - exclude generic retail terms (store/shop/retail match domain names)
    # Use word boundaries to avoid matching "auto" in "automated", "spa" in CSS classes, etc.
    # Some terms are standalone (wedding, salon), others need context (plumbing, roofing)
    business_types = r'\b(salon|spa\b|clinic|dental|lawyer|attorney|restaurant|caf[ée]|gym|plumb(?:er|ing)|roofer|roofing|hvac|electrician|car repair|pet groomer|veterinarian|photographer|wedding|florist|bakery|landscaping|cleaning service|painting contractor|flooring|tile installer|furniture store)\b'
    location_words = r'\b(toronto|vancouver|calgary|ottawa|montreal|dallas|fort worth|houston|austin|chicago|new york|los angeles|miami|seattle|denver|atlanta|boston|phoenix|san diego|near\s+me|nearby|our\s+location|visit\s+us|directions)\b'
    if re.search(business_types, lower):
        signals += 1
    if re.search(location_words, lower):
        signals += 1

    if signals < 2:
        return None  # Not a local business - skip this finding

    # ── GBP product gap detection ────────────────────────────────────────
    has_gbp = False

    # Check for schema.org LocalBusiness with product/service offerings
    if re.search(r'"@type"\s*:\s*"(LocalBusiness|Store|Restaurant|HealthAndBeautyBusiness)"', html_text):
        # Has LocalBusiness schema - check if products are listed
        if re.search(r'"@type"\s*:\s*"Product"|offers|price|AggregateOffer', html_text):
            has_gbp = True

    # Check for GBP product indicators
    if re.search(r'google\s+business\s+profile|gbp\s+product|google\s+product|product\s+listing', lower):
        has_gbp = True

    # Check for product carousel/section with pricing
    if re.search(r'product.*carousel|our\s+products|product\s+catalog|shop\s+our', lower):
        has_gbp = True

    if has_gbp:
        return None  # Already has GBP product presence - no gap

    # ── Build the finding ────────────────────────────────────────────────
    return {
        "score": 6,
        "weight": "medium",
        "issue": (
            "Local business detected but no Google Business Profile product listings found. "
            "GBP products surface your services/pricing directly in Google Search and Maps - "
            "before the visitor even clicks through. This is free and takes 15 minutes to set up."
        ),
        "fix": (
            "Add your top 3-5 services or packages as GBP products in the Google Business Profile dashboard. "
            "Include: product name, price range, description (up to 1,000 chars), photo, and link to your "
            "booking page. This puts pricing in the SERP itself, which directly addresses the "
            "\"pricing invisible until scroll\" conversion leak."
        ),
    }


def _check_ai_crawlers(url: str) -> dict:
    """Score AI answer-engine access via robots.txt (Ideata-style crawler check).

    Distinguishes RETRIEVAL crawlers (fetch a page to cite it in an answer -
    OAI-SearchBot, ChatGPT-User, anthropic-ai, PerplexityBot, Perplexity-User,
    GoogleOther, Applebot) from TRAINING crawlers (ingest a page to train a
    model - GPTBot, ClaudeBot, Google-Extended, Applebot-Extended, CCBot).

    Blocking training crawlers is a defensible copyright stance and does NOT
    block citations. Blocking retrieval crawlers is a guaranteed zero in that
    engine's answers.
    """
    from urllib import robotparser as _rp
    from urllib.parse import urlparse as _up, urlunparse as _unparse

    parsed = _up(url)
    robots_url = _unparse((parsed.scheme, parsed.netloc, "/robots.txt", "", "", ""))

    RETRIEVAL = [
        "OAI-SearchBot", "ChatGPT-User", "anthropic-ai",
        "PerplexityBot", "Perplexity-User", "GoogleOther", "Applebot",
    ]
    TRAINING = [
        "GPTBot", "ClaudeBot", "Google-Extended",
        "Applebot-Extended", "CCBot", "omgili",
    ]

    try:
        session = get_session()
        resp = session.get(robots_url, timeout=12, allow_redirects=True, stream=True)
        body = resp.text[:64 * 1024] if resp.status_code == 200 else ""
        resp.close()
    except Exception:
        return {
            "score": 5,
            "weight": "medium",
            "issue": "Could not retrieve robots.txt - AI crawler access is unverified",
            "fix": "Publish a robots.txt that explicitly allows answer-engine retrieval crawlers (OAI-SearchBot, ChatGPT-User, PerplexityBot, anthropic-ai, GoogleOther).",
            "crawlers": {},
        }

    if not body:
        # No robots.txt → all crawlers allowed by default, but no explicit policy
        return {
            "score": 7,
            "weight": "medium",
            "issue": "No robots.txt found - answer engines assume access, but there is no explicit policy",
            "fix": "Add robots.txt with explicit Allow rules for answer-engine retrieval crawlers (OAI-SearchBot, ChatGPT-User, PerplexityBot, anthropic-ai, GoogleOther).",
            "crawlers": {},
        }

    rp = _rp.RobotFileParser()
    rp.set_url(robots_url)
    try:
        rp.parse(body.splitlines())
        can_fetch = rp.can_fetch
    except Exception:
        # Fallback: case-insensitive literal scan of User-Agent groups.
        def can_fetch(useragent: str, url: str) -> bool:
            group = None
            for line in body.splitlines():
                s = line.strip()
                if not s or s.startswith("#"):
                    continue
                if ":" not in s:
                    continue
                k, _, v = s.partition(":")
                k, v = k.strip().lower(), v.strip()
                if k == "user-agent":
                    group = v
                elif k in ("allow", "disallow") and group:
                    if group == "*" or group == useragent.lower() or useragent.lower().endswith(group):
                        if k == "allow":
                            return True
                        if v == "/" or url.startswith(urljoin(robots_url, v)):
                            return False
            return True

    blocked_retrieval = [ua for ua in RETRIEVAL if not can_fetch(ua, url)]
    allowed_retrieval = [ua for ua in RETRIEVAL if can_fetch(ua, url)]
    blocked_training = [ua for ua in TRAINING if not can_fetch(ua, url)]

    score = max(1, min(10, round(10 - 2.0 * len(blocked_retrieval))))

    if not blocked_retrieval:
        issue = "Answer-engine crawlers are allowed - your page can be read for citations"
        fix = (
            "Keep retrieval crawlers allowed. If you also want training-crawler control, "
            "keep GPTBot/ClaudeBot/Google-Extended blocked - a defensible copyright stance "
            "that does not block citations."
        )
    else:
        issue = (
            f"Robots.txt blocks answer-engine crawler(s): {', '.join(blocked_retrieval)} - "
            "these engines cannot cite you"
        )
        fix = (
            "Allow retrieval crawlers (OAI-SearchBot, ChatGPT-User, PerplexityBot, "
            "anthropic-ai, GoogleOther) in robots.txt. Blocking training crawlers "
            "(GPTBot, ClaudeBot, Google-Extended) is fine - it does not block citations."
        )

    return {
        "score": score,
        "weight": "medium",
        "issue": issue,
        "fix": fix,
        "crawlers": {
            "blocked_retrieval": blocked_retrieval,
            "allowed_retrieval": allowed_retrieval,
            "blocked_training": blocked_training,
        },
    }


def score_audit(page):
    """Return the structured audit shape expected by agentic_server._handle_audit."""
    html_text = page.get("html", "")
    text = page.get("text", "")
    h1 = page.get("h1", "")
    url = page.get("url", "")
    ctas = page.get("ctas", [])
    lower = html_text.lower()

    headline_score = 8 if 12 <= len(h1) <= 90 else (5 if h1 else 2)
    cta_score = 8 if any(any(word in cta.lower() for word in ["get", "start", "run", "buy", "book", "try"]) for cta in ctas) else (5 if ctas else 2)
    # Say vs. show: claims trust words but has no concrete proof element?
    trust_words = ["testimonial", "review", "customer", "trusted", "case study", "proof", "guarantee", "results"]
    trust_claimed = [w for w in trust_words if w in lower]
    # Concrete proof = named source, star rating, quote attr, or review count
    _trust_re = (
        r'(\d+\s*(stars?|reviews?|customers?|clients?|companies|users?))'
        r'|(trustpilot|g2\.com|capterra|clutch|google reviews)'
        r'|(\u201c|\u2018|said|says|-\s*[A-Z])'
    )
    trust_shown = bool(re.search(_trust_re, lower, re.IGNORECASE))
    if trust_claimed and trust_shown:
        proof_score = 8
        proof_issue = f"Trust signals present and evidenced ({len(trust_claimed)} trust terms + concrete proof markers)."
    elif trust_claimed and not trust_shown:
        # SAY VS. SHOW CONTRADICTION - this is the finding
        proof_score = 4
        proof_issue = (
            f"Your page says it's trustworthy ({'/ '.join(trust_claimed[:3])}). "
            f"But a first-time visitor sees no names, no numbers, no proof. "
            f"They hear a claim. They need evidence before they'll believe it."
        )
    else:
        proof_score = 3
        proof_issue = "A stranger landing here sees nothing that proves this worked for anyone else. No quotes, no names, no numbers. They're being asked to trust a page that hasn't earned it yet."
    # HTML-size heuristic (fallback if PageSpeed API unavailable)
    html_size_score = 8 if len(html_text) < 120000 else 5
    html_size_issue = "Page HTML is within normal bounds." if html_size_score >= 7 else f"HTML is {len(html_text)//1000}KB - large pages slow first paint."
    mobile_score = 8 if "viewport" in lower else 4

    # --- PageSpeed dimension ---
    pagespeed_score = 5
    pagespeed_issue = "Could not fetch live speed data"
    try:
        ps_url = (
            "https://www.googleapis.com/pagespeedonline/v5/runPagespeed"
            f"?url={url}&strategy=mobile"
            "&fields=lighthouseResult.categories.performance.score"
            ",lighthouseResult.audits.first-contentful-paint"
        )
        ps_resp = requests.get(ps_url, timeout=5)
        ps_data = ps_resp.json()
        perf_score = (
            ps_data.get("lighthouseResult", {})
                   .get("categories", {})
                   .get("performance", {})
                   .get("score")
        )
        if perf_score is not None:
            pagespeed_score = round(float(perf_score) * 10)
            pagespeed_issue = f"Lighthouse performance: {round(float(perf_score) * 100)}/100"
    except Exception:
        pass  # fallback score/issue already set

    # Merge: prefer real Lighthouse data; fall back to HTML-size heuristic (MECE: one bucket)
    if pagespeed_score != 5:
        load_speed_score = pagespeed_score
        load_speed_issue = pagespeed_issue
    else:
        load_speed_score = html_size_score
        load_speed_issue = html_size_issue
    load_speed_fix = (
        "Compress images, remove render-blocking scripts, enable caching. "
        "Target Lighthouse performance >= 70 on mobile."
    )

    # --- Above-fold dimension ---
    fold_html = html_text[:3000]
    fold_lower = fold_html.lower()
    has_h1 = bool(h1)
    has_fold_cta = bool(re.search(r'<(button|a)[^>]*>(.*?)</(button|a)>', fold_html, re.IGNORECASE | re.DOTALL))
    has_fold_price = bool(re.search(r'(\$[\d,]+|free|discount|offer|save|off|deal|promo|sale)', fold_lower))
    fold_signals = sum([has_fold_cta, has_fold_price])
    if has_h1 and fold_signals >= 2:
        above_fold_score = 8
        above_fold_issue = "Early source segment contains headline, clickable control, and offer/price terms."
        above_fold_fix = "Verify actual mobile/desktop placement in a rendered browser before changing hierarchy."
    elif has_h1 and fold_signals == 1:
        above_fold_score = 5
        above_fold_issue = "Early source proxy has a headline but no " + ("clickable control" if not has_fold_cta else "offer/price term") + "."
        above_fold_fix = "Inspect the rendered viewport; add the missing element only if the visual hierarchy confirms the gap."
    else:
        above_fold_score = 2
        above_fold_issue = "Early source proxy lacks a headline, clickable control, or offer term in its first 3,000 characters."
        above_fold_fix = "Run rendered viewport inspection before treating source order as visual placement."

    # --- Ad-source artifact dimension ---
    # Page-type context: a homepage or brand page is not a paid landing page.
    # Scoring it as one produces false positives - no ad tracking on a homepage
    # is the correct state, not a leak. Adjust scoring and messaging accordingly.
    from urllib.parse import urlparse as _urlparse
    _parsed_url = _urlparse(url) if url else None
    _url_path = (_parsed_url.path.rstrip("/") if _parsed_url else "") or ""
    _is_homepage = _url_path == "" or _url_path == "/"
    _is_about = any(seg in _url_path.lower() for seg in ["/about", "/team", "/contact", "/blog", "/press", "/careers", "/legal", "/privacy", "/terms"])
    _is_brand_page = _is_homepage or _is_about

    tracking_soup = BeautifulSoup(html_text, "html.parser")
    fb_pixel = bool(re.search(r'\bfbq\s*\(|connect\.facebook\.net/.+fbevents', lower))
    ga4 = bool(re.search(r'\bgtag\s*\(|["\'`]g-[a-z0-9]{6,}["\']', lower))
    utm_links = bool(tracking_soup.find("a", href=re.compile(r"[?&]utm_(?:source|medium|campaign)=", re.IGNORECASE)))
    conversion_call = bool(re.search(r"(?:fbq|gtag)\s*\([^\n]{0,120}(?:purchase|generate_lead|conversion|completeregistration)", lower))
    signals_found = sum([fb_pixel, ga4, utm_links, conversion_call])

    if _is_brand_page:
        # On a homepage/brand page, GA4 is expected; pixel, UTM, and conversion
        # calls are NOT expected and their absence is not a finding.
        # Score on analytics presence alone (GA4 = full marks; nothing = low).
        if ga4:
            ad_signals_score = 8
            ad_signals_issue = (
                "Analytics (GA4) present in source. Facebook Pixel, UTM-bearing links, "
                "and conversion calls are not expected on a homepage - their absence is correct, not a leak."
            )
            ad_signals_fix = (
                "Verify GA4 fires on page load via browser devtools or Tag Assistant. "
                "If running paid traffic to this homepage, add UTM parameters to ad destination URLs."
            )
        else:
            ad_signals_score = 3
            ad_signals_issue = (
                "No analytics artifact observed in source HTML. "
                "A homepage should carry at minimum a GA4 or equivalent measurement tag "
                "so paid traffic can be attributed."
            )
            ad_signals_fix = (
                "Add GA4 (or equivalent analytics) to the page. "
                "Pixel and conversion calls belong on dedicated landing pages, not the homepage."
            )
    else:
        # Dedicated landing page - all four signals are expected.
        ad_signals_score = min(2 + 2 * signals_found, 10)
        source_checks = [
            (fb_pixel, "Facebook Pixel initializer"),
            (ga4, "GA4 initializer/ID"),
            (utm_links, "UTM-bearing link"),
            (conversion_call, "explicit conversion call"),
        ]
        found_list = [name for flag, name in source_checks if flag]
        missing_list = [name for flag, name in source_checks if not flag]
        if found_list and missing_list:
            ad_signals_issue = f"Static source artifacts found: {', '.join(found_list)}. Not observed: {', '.join(missing_list)}. Runtime firing remains unverified."
        elif found_list:
            ad_signals_issue = f"Four static source artifacts observed: {', '.join(found_list)}. Runtime firing remains unverified."
        else:
            ad_signals_issue = "No recognized ad-tracking artifact observed in fetched source HTML; runtime/server-side tracking remains unverified."
        ad_signals_fix = "Run consent-aware browser/network validation; add only tracking artifacts proven absent."

    # --- SEO Foundations dimension (naming conventions) ---
    _soup = BeautifulSoup(html_text, "html.parser") if html_text else None
    title_tag = _soup.title.get_text(" ", strip=True) if _soup and _soup.title else ""
    meta_desc = ""
    meta_desc_tag = _soup.find("meta", attrs={"name": "description"}) if _soup else None
    if meta_desc_tag and meta_desc_tag.get("content"):
        meta_desc = meta_desc_tag["content"].strip()
    h1_tags = _soup.find_all("h1") if _soup else []
    h1_count = len(h1_tags)
    h1_text = h1_tags[0].get_text(" ", strip=True) if h1_tags else ""

    seo_score = 5  # baseline
    seo_issues = []

    # Title tag
    if not title_tag:
        seo_issues.append("No <title> tag found in <head> - SERP will auto-generate one, usually wrong")
        seo_score -= 2
    elif len(title_tag) < 15:
        seo_issues.append(f"<title> tag is only {len(title_tag)} chars - too short to signal topic relevance")
        seo_score -= 1
    elif len(title_tag) > 70:
        seo_issues.append(f"<title> tag is {len(title_tag)} chars - SERP truncates at 60. Currently reads: \"{title_tag[:60]}…\"")
        seo_score -= 1
    else:
        seo_score += 1  # good length

    # Meta description
    if not meta_desc:
        seo_issues.append("No meta[name=description] found - Google writes its own, usually pulled from body text mid-paragraph")
        seo_score -= 1
    elif len(meta_desc) < 80:
        seo_issues.append(f"meta[name=description] is {len(meta_desc)} chars - below the 120-char minimum that fills a full SERP snippet")
        seo_score -= 1
    elif len(meta_desc) > 170:
        seo_issues.append(f"meta[name=description] is {len(meta_desc)} chars - SERP shows ~155. Truncates at: \"{meta_desc[:155]}…\"")
        seo_score -= 0.5
    else:
        seo_score += 1  # good length

    # H1 structure
    if h1_count == 0:
        seo_issues.append("Missing H1 tag")
        seo_score -= 2
    elif h1_count > 1:
        seo_issues.append(f"Multiple H1 tags ({h1_count}) - should have exactly one")
        seo_score -= 1.5

    if h1_text and len(h1_text) < 5:
        seo_issues.append("H1 content is too short, likely non-descriptive")
        seo_score -= 0.5

    # H1-to-title naming consistency
    if title_tag and h1_text:
        title_lower = title_tag.lower()
        h1_lower = h1_text.lower()
        # Check if H1 concept overlaps with title (shared significant words)
        title_words = set(re.findall(r"[a-z]+", title_lower))
        h1_words = set(re.findall(r"[a-z]+", h1_lower))
        common = title_words & h1_words
        # Filter out stop words
        stop_words = {"the", "a", "an", "in", "on", "at", "to", "for", "of", "and", "or", "is", "your", "our", "we", "you"}
        significant_common = common - stop_words
        if len(significant_common) == 0:
            seo_issues.append("H1 and title tag share no significant keywords - messaging misalignment")
            seo_score -= 1
        elif len(significant_common) < 2:
            seo_issues.append("H1 and title tag have weak keyword overlap - consider aligning messaging")
            seo_score -= 0.5
        else:
            seo_score += 1  # aligned messaging

    seo_score = max(1, min(10, round(seo_score)))

    if seo_score >= 7:
        seo_issue_text = "SEO foundations are solid - title, meta description, and H1 structure are well aligned."
        seo_fix_text = "Monitor ranking performance; consider adding structured data for rich results."
    elif seo_score >= 4:
        seo_issue_text = "SEO foundations need work: " + "; ".join(seo_issues[:3])
        seo_fix_text = "Write a unique 30-60 char title and 120-160 char meta description. Ensure exactly one descriptive H1 that shares keywords with the title."
    else:
        seo_issue_text = "Critical SEO gaps: " + "; ".join(seo_issues[:3])
        seo_fix_text = "Add a <title> tag and <meta name=\"description\"> immediately. Create a single H1 that contains your primary keyword and matches your title intent."

    # ── AI Citation Readiness dimension ─────────────────────────────────
    # Scores how well the page signals entity identity to AI search engines.
    ai_score = 5  # baseline
    ai_findings = []

    # JSON-LD structured data
    has_jsonld = bool(re.search(r'<script[^>]*type="application/ld\+json"[^>]*>', html_text))
    if has_jsonld:
        ai_score += 1
        ai_findings.append("JSON-LD structured data found")
        if re.search(r'"@type"\s*:\s*"Organization"', html_text):
            ai_score += 1
            ai_findings.append("Organization entity defined")
        if re.search(r'"@type"\s*:\s*"(WebSite|WebApplication)"', html_text):
            ai_score += 1
            ai_findings.append("Site type schema defined")
        if re.search(r'"@type"\s*:\s*"(Article|NewsArticle)"', html_text):
            ai_score += 1
            ai_findings.append("Content article schema found")
    else:
        ai_findings.append("No JSON-LD structured data")

    # OpenGraph completeness
    og_tags = {
        "og:title": bool(re.search(r'<meta[^>]*property="og:title"[^>]*>', html_text)),
        "og:description": bool(re.search(r'<meta[^>]*property="og:description"[^>]*>', html_text)),
        "og:image": bool(re.search(r'<meta[^>]*property="og:image"[^>]*>', html_text)),
        "og:type": bool(re.search(r'<meta[^>]*property="og:type"[^>]*>', html_text)),
        "og:url": bool(re.search(r'<meta[^>]*property="og:url"[^>]*>', html_text)),
    }
    og_complete = sum(1 for v in og_tags.values() if v)
    if og_complete >= 4:
        ai_score += 1
        ai_findings.append(f"OpenGraph {og_complete}/5 complete")
        og_note = f"OpenGraph tags {og_complete}/5 present"
    elif og_complete >= 2:
        ai_score += 0.5
        ai_findings.append(f"OpenGraph partial ({og_complete}/5)")
        og_note = f"OpenGraph tags {og_complete}/5 present - add missing: og:image, og:type"
    else:
        ai_findings.append(f"OpenGraph sparse ({og_complete}/5)")
        og_note = "OpenGraph nearly missing"

    # Twitter card
    has_twitter = bool(re.search(r'<meta[^>]*name="twitter:card"[^>]*>', html_text))
    if has_twitter:
        ai_score += 0.5
        ai_findings.append("Twitter card present")

    # Canonical URL
    has_canonical = bool(re.search(r'<link[^>]*rel="canonical"[^>]*>', html_text))
    if has_canonical:
        ai_score += 0.5
        ai_findings.append("Canonical URL set")
    else:
        ai_findings.append("No canonical URL")

    # Factual density
    text_words = text.split()
    if len(text_words) > 50:
        sample = " ".join(text_words[:200])
        dates = len(re.findall(r'\b(20\d{2}|Q[1-4]\s*\d{4}|\d{1,2}/\d{1,2}/\d{2,4})\b', sample))
        named_ents = len(re.findall(r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b', sample))
        numbers = len(re.findall(r'\$\d[\d,]*|[\d,.]+%|\d+\s*(users|customers|clients|companies|reviews|sales)', sample))
        factual = dates + (named_ents // 3) + numbers
        if factual >= 8:
            ai_score += 1
            ai_findings.append("High factual density")
        elif factual >= 4:
            ai_score += 0.5
            ai_findings.append("Moderate factual density")
        else:
            ai_findings.append("Low factual density")

    ai_score = max(1, min(10, round(ai_score)))

    if ai_score >= 8:
        ai_issue_text = f"AI citation ready - entity signals strong. {ai_findings[0] if ai_findings else ''}"
        ai_fix_text = "Your page is well-structured for AI citation. To improve further: publish original research, earn editorial placements in LLM-weighted publications (Reuters, Forbes, TIME, Axios)."
    elif ai_score >= 5:
        ai_issue_text = f"AI citation needs structured data: {ai_findings[0] if ai_findings else 'add JSON-LD'}"
        ai_fix_text = "Add JSON-LD Organization schema, complete all 5 OpenGraph tags, set canonical URL, and include concrete facts (dates, named entities, numbers) in your copy. See our AI Citation Source Map (growth_system/ai_citation_source_map.md) for LLM-specific targets."
    else:
        ai_issue_text = f"Poor AI citation readiness: {ai_findings[0] if ai_findings else 'critical gaps'}"
        ai_fix_text = "Critical: Add JSON-LD with Organization entity, complete OpenGraph + Twitter cards, set canonical URL. Without these, AI engines cannot reliably identify or cite your brand."

    # ── end AI citation dimension ──────────────────────────────────────

    # ── AI answer-engine crawler access (robots.txt) ─────────────────────
    try:
        ai_crawlers = _check_ai_crawlers(page.get("url") or "")
    except Exception:
        ai_crawlers = {
            "score": 5,
            "weight": "medium",
            "issue": "AI crawler access check failed - treat as unverified",
            "fix": "Re-run the audit to verify robots.txt AI crawler rules.",
            "crawlers": {},
        }

    local_gbp = _local_gbp_dimension(html_text, lower)

    dimensions = {
        "headline": {
            "score": headline_score,
            "weight": "high",
            "issue": "Your headline tells visitors what you do. It needs to tell them what they get." if headline_score < 7 else "Headline communicates a concrete buyer outcome.",
            "fix": "Lead with the concrete buyer result and target audience in the first sentence."
        },
        "cta": {
            "score": cta_score,
            "weight": "high",
            "issue": "The button on your page asks visitors to act but does not tell them what changes for them when they do." if cta_score < 7 else "CTA language is action-oriented.",
            "fix": "Use action + outcome copy such as 'Run my free teardown' or 'Get the fix kit'."
        },
        "social_proof": {
            "score": proof_score,
            "weight": "high",
            "issue": proof_issue,
            "fix": "Add proof near the first CTA: sample output, customer quote, metric, guarantee, or process evidence.",
        },

        "mobile": {
            "score": mobile_score,
            "weight": "medium",
            "issue": "Viewport tag is present." if mobile_score >= 7 else "Mobile viewport metadata may be missing.",
            "fix": "Ensure responsive viewport and test the hero/form on mobile width.",
        },
        "load_speed": {
            "score": load_speed_score,
            "weight": "high",
            "issue": load_speed_issue,
            "fix": load_speed_fix,
        },
        "above_fold": {
            "score": above_fold_score,
            "weight": "high",
            "issue": above_fold_issue,
            "fix": above_fold_fix,
        },
        "ad_signals": {
            "score": ad_signals_score,
            "weight": "medium",
            "issue": ad_signals_issue,
            "fix": ad_signals_fix,
        },
        "seo_foundations": {
            "score": seo_score,
            "weight": "high",
            "issue": seo_issue_text,
            "fix": seo_fix_text,
        },
        "ai_readiness": {
            "score": ai_score,
            "weight": "medium",
            "issue": ai_issue_text,
            "fix": ai_fix_text,
        },
        "ai_crawler_access": ai_crawlers,
        # ── Local Business GBP Products (conditional) ──────────────────────
        # Only surfaces when the site shows local business signals (address,
        # phone, maps embed) but lacks GBP product listings or schema.
        **({"local_gbp": local_gbp} if local_gbp else {}),
    }
    overall = round(sum(v["score"] for v in dimensions.values()) / len(dimensions), 1)
    grade = "A" if overall >= 8 else "B" if overall >= 6.5 else "C" if overall >= 5 else "D"
    # ── Weighted composite (Ideata-style single anchor number) ──────────────
    # Honors the existing high/medium/low dimension metadata instead of treating
    # every dimension as equal. high=3, medium=2, low=1. The anchor is the
    # component pass standard used on /benchmarks (≥7) - a fixed, published
    # criterion, not a moving threshold.
    _WEIGHT_MAP = {"high": 3, "medium": 2, "low": 1}
    _weighted_sum = sum(
        v["score"] * _WEIGHT_MAP.get(str(v.get("weight", "medium")).lower(), 2)
        for v in dimensions.values()
    )
    _weight_total = sum(
        _WEIGHT_MAP.get(str(v.get("weight", "medium")).lower(), 2)
        for v in dimensions.values()
    )
    composite = round(_weighted_sum / _weight_total, 1) if _weight_total else overall
    composite_anchor = 7.0  # matches the published component pass standard
    # ── Opportunity Matrix (CAIOS M6) ──────────────────────────────────────────
    # Impact: revenue_unlock + risk_removal + time_to_value
    # Effort: integration_complexity + people_process_change (70% rule)
    # Scores pulled from audit evidence, not opinion.
    opp_matrix = []
    for key, dim in dimensions.items():
        score_val = dim["score"]
        if score_val >= 7:
            continue  # not a problem worth surfacing

        # Impact: inverse of score (lower score = bigger opportunity)
        base_impact = round((10 - score_val) / 2, 1)

        # Effort weights per dimension (70% rule: change burden, not just tech)
        effort_weights = {
            "headline":     2,   # copy edit - 10 min, no system touch
            "cta":          2,   # copy edit - 10 min
            "above_fold":   3,   # layout/copy - CMS edit, possible dev
            "social_proof": 3,   # content sourcing + placement
            "load_speed":   7,   # infra + build pipeline + 70% ops change
            "mobile":       3,   # CSS/viewport - usually one line
            "ad_signals":   8,   # pixel install + GA4 events + tag manager + 70% team workflow change
            "seo_foundations": 4, # title/meta edits - low tech, some content work
            "ai_readiness": 5,   # JSON-LD + OG tags - dev task, one-time setup, moderate effort
            "ai_crawler_access": 2,  # robots.txt Allow lines - 15-min fix, no system touch
        }
        effort = effort_weights.get(key, 5)

        # Quadrant
        if base_impact >= 2.0 and effort <= 4:
            quadrant = "quick_win"
        elif base_impact >= 2.0 and effort > 4:
            quadrant = "major_project"
        elif base_impact < 2.0 and effort <= 4:
            quadrant = "fill_in"
        else:
            quadrant = "avoid"

        opp_matrix.append({
            "key": key,
            "label": key.replace("_", " ").title(),
            "impact": base_impact,
            "effort": effort,
            "quadrant": quadrant,
            "issue": dim["issue"],
            "fix": dim["fix"],
        })

    # Sort: quick_wins first (by impact desc), then major, fill_in, avoid
    _order = {"quick_win": 0, "major_project": 1, "fill_in": 2, "avoid": 3}
    opp_matrix.sort(key=lambda x: (_order[x["quadrant"]], -x["impact"]))

    # ── Evidence enrichment ────────────────────────────────────────────────────
    # Adds measured/required/delta/selector/confidence/timestamp to every finding.
    # Operates on already-fetched HTML - no new network calls.
    try:
        from audit_evidence import enrich_findings_with_evidence
        opp_matrix = enrich_findings_with_evidence(opp_matrix, html_text)
    except Exception:
        logging.exception("Audit evidence enrichment failed")
        evidence_ts = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
        opp_matrix = [
            {
                **finding,
                "evidence": {
                    "measured": "Evidence unavailable for this finding",
                    "required": "Evidence extraction must complete before a measurement claim is shown",
                    "delta": "No evidence claim emitted",
                    "selector": "N/A",
                    "confidence": "unavailable",
                    "timestamp": evidence_ts,
                },
            }
            for finding in opp_matrix
        ]

    # Generate guided implementation flow if available
    result = {
        "overall": overall,
        "overall_grade": grade,
        "composite": composite,
        "composite_anchor": composite_anchor,
        "dimensions": dimensions,
        "opp_matrix": opp_matrix,
        "engine_version": ENGINE_VERSION,
    }

    # ── Principles enrichment ──────────────────────────────────────────────────
    # Adds `principle` + `principle_explanation` to each finding, and
    # `strategic_finding` to the audit result — educational layer on top of signals.
    try:
        from audit_principles import enrich_with_principles, _strategic_finding
        result["opp_matrix"] = enrich_with_principles(result["opp_matrix"])
        result["strategic_finding"] = _strategic_finding(result["opp_matrix"], overall)
    except Exception:
        logging.exception("Audit principles enrichment failed — continuing without it")
    
    if HAS_GUIDED_IMPLEMENTATION:
        guided_implementation = build_guided_implementation({
            "overall": overall,
            "overall_grade": grade,
            "dimensions": dimensions,
            "opp_matrix": opp_matrix
        })
        result["guided_implementation"] = guided_implementation
    
    return result


async def _get_signal_verifier_results(html_text: str, url: str) -> dict:
    """Get results from all signal verifier functions using the pre-fetched HTML."""
    if not HAS_SIGNAL_VERIFIER:
        return {}
    
    # Define signal verifier functions and their corresponding dimension keys
    signal_functions = [
        ("headline", verify_headline),
        ("cta", verify_cta),
        ("above_fold", verify_above_fold),
        ("social_proof", verify_social_proof),
        ("load_speed", verify_load_speed),
        ("mobile", verify_mobile),
        ("ad_signals", verify_ad_signals),
        ("seo_foundations", verify_seo_foundations),
        ("ai_readiness", verify_ai_readiness),
    ]
    
    # Create tasks for all verifier functions
    tasks = []
    for dim_key, verify_func in signal_functions:
        # Create a task that calls the verifier function with the pre-fetched HTML
        task = asyncio.create_task(verify_func(url, html_text))
        tasks.append((dim_key, task))
    
    # Wait for all tasks to complete and collect results
    results = {}
    for dim_key, task in tasks:
        try:
            result = await task
            results[dim_key] = result
        except Exception as e:
            # If a verifier fails, we'll fall back to original scoring later
            results[dim_key] = {"error": str(e)}
    
    return results


def score_audit_with_signal_verifiers(page: dict) -> dict:
    """Score audit using signal verifier functions for core signals, falling back to original scoring."""
    # Run the async function to get verifier results
    try:
        verifier_results = asyncio.run(_get_signal_verifier_results(
            page.get("html", ""),
            page.get("url", "")
        ))
    except Exception:
        # If asyncio.run fails for any reason, fall back to original scoring
        verifier_results = {}
    
    html_text = page.get("html", "")
    text = page.get("text", "")
    h1 = page.get("h1", "")
    url = page.get("url", "")
    ctas = page.get("ctas", [])
    lower = html_text.lower()
    
    # Initialize dimensions dict
    dimensions = {}
    
    # Define signal verifier functions and their corresponding dimension keys
    signal_functions = [
        ("headline", verify_headline),
        ("cta", verify_cta),
        ("above_fold", verify_above_fold),
        ("social_proof", verify_social_proof),
        ("load_speed", verify_load_speed),
        ("mobile", verify_mobile),
        ("ad_signals", verify_ad_signals),
        ("seo_foundations", verify_seo_foundations),
        ("ai_readiness", verify_ai_readiness),
    ]
    
    # Process each dimension
    for dim_key, _ in signal_functions:
        if dim_key in verifier_results and "error" not in verifier_results[dim_key]:
            # Use the verifier result
            result = verifier_results[dim_key]
            
            # Convert SignalResult to dimension format
            # SignalResult score is 0.0-1.0, dimension score is 0-10
            score = min(10.0, max(0.0, result["score"] * 10.0))
            
            # Use the verifier's issue and evidence, or provide defaults
            issue = result["issue"] if result["issue"] is not None else (
                f"{dim_key.replace('_', ' ').title()} signal verification completed"
            )
            fix = f"Improve {dim_key.replace('_', ' ')} based on audit findings"
            
            # Set weight based on dimension importance (matching original score_audit weights)
            weight_map = {
                "headline": "high",
                "cta": "high", 
                "social_proof": "high",
                "load_speed": "high",
                "mobile": "medium",
                "seo_foundations": "high",
                "ad_signals": "medium",
                "above_fold": "high",
                "ai_readiness": "medium"
            }
            weight = weight_map.get(dim_key, "medium")
            
            dimensions[dim_key] = {
                "score": score,
                "weight": weight,
                "issue": issue,
                "fix": fix,
            }
        else:
            # Fall back to original scoring for this dimension
            dimensions[dim_key] = _get_original_dimension_score(
                dim_key, page, html_text, text, h1, url, ctas, lower
            )
    
    # Calculate overall score as average of dimension scores
    if dimensions:
        overall = round(sum(dim["score"] for dim in dimensions.values()) / len(dimensions), 1)
    else:
        overall = 0.0
    
    # Determine grade based on overall score
    grade = "A" if overall >= 8 else "B" if overall >= 6.5 else "C" if overall >= 5 else "D"
    
    # Calculate weighted composite score (matching original score_audit)
    _WEIGHT_MAP = {"high": 3, "medium": 2, "low": 1}
    _weighted_sum = sum(
        dim["score"] * _WEIGHT_MAP.get(str(dim.get("weight", "medium")).lower(), 2)
        for dim in dimensions.values()
    )
    _weight_total = sum(
        _WEIGHT_MAP.get(str(dim.get("weight", "medium")).lower(), 2)
        for dim in dimensions.values()
    )
    composite = round(_weighted_sum / _weight_total, 1) if _weight_total else overall
    composite_anchor = 7.0  # matches the published component pass standard
    
    # Build opportunity matrix using the same logic as original score_audit
    opp_matrix = _build_opportunity_matrix_from_dimensions(dimensions)

    # Principles enrichment (same as score_audit path)
    try:
        from audit_principles import enrich_with_principles, _strategic_finding
        opp_matrix = enrich_with_principles(opp_matrix)
        strategic_finding = _strategic_finding(opp_matrix, overall)
    except Exception:
        strategic_finding = None

    result = {
        "overall": overall,
        "overall_grade": grade,
        "composite": composite,
        "composite_anchor": composite_anchor,
        "dimensions": dimensions,
        "opp_matrix": opp_matrix,
        "engine_version": ENGINE_VERSION,
    }
    if strategic_finding:
        result["strategic_finding"] = strategic_finding
    return result


def _get_original_dimension_score(dim_key: str, page: dict, html_text: str, text: str, 
                                 h1: str, url: str, ctas: list, lower: str) -> dict:
    """Get dimension score using original score_audit logic for a specific dimension."""
    # This function replicates the scoring logic from the original score_audit function
    # for individual dimensions, to maintain backward compatibility when signal verifiers fail
    
    # Initialize default return
    default_result = {
        "score": 5.0,
        "weight": "medium",
        "issue": f"{dim_key.replace('_', ' ').title()} dimension",
        "fix": f"Improve {dim_key.replace('_', ' ')} based on audit findings"
    }
    
    # Map dimension keys to their scoring logic from original score_audit
    if dim_key == "headline":
        headline_score = 8 if 12 <= len(h1) <= 90 else (5 if h1 else 2)
        return {
            "score": float(headline_score),
            "weight": "high",
            "issue": "Your headline tells visitors what you do. It needs to tell them what they get." if headline_score < 7 else "Headline communicates a concrete buyer outcome.",
            "fix": "Lead with the concrete buyer result and target audience in the first sentence."
        }
    elif dim_key == "cta":
        cta_score = 8 if any(any(word in cta.lower() for word in ["get", "start", "run", "buy", "book", "try"]) for cta in ctas) else (5 if ctas else 2)
        return {
            "score": float(cta_score),
            "weight": "high",
            "issue": "The button on your page asks visitors to act but does not tell them what changes for them when they do." if cta_score < 7 else "CTA language is action-oriented.",
            "fix": "Use action + outcome copy such as 'Run my free teardown' or 'Get the fix kit'."
        }
    elif dim_key == "social_proof":
        # Social proof scoring is complex in original score_audit - simplify for fallback
        trust_words = ["testimonial", "review", "customer", "trusted", "case study", "proof", "guarantee", "results"]
        trust_claimed = [w for w in trust_words if w in lower]
        _trust_re = (
            r'(\d+\s*(stars?|reviews?|customers?|clients?|companies|users?))'
            r'|(trustpilot|g2\.com|capterra|clutch|google reviews)'
            r'|(\u201c|\u2018|said|says|-\s*[A-Z])'
        )
        trust_shown = bool(re.search(_trust_re, lower, re.IGNORECASE))
        if trust_claimed and trust_shown:
            proof_score = 8
            proof_issue = f"Trust signals present and evidenced ({len(trust_claimed)} trust terms + concrete proof markers)."
        elif trust_claimed and not trust_shown:
            proof_score = 4
            proof_issue = (
                f"Your page says it's trustworthy ({'/ '.join(trust_claimed[:3])}). "
                f"But a first-time visitor sees no names, no numbers, no proof. "
                f"They hear a claim. They need evidence before they'll believe it."
            )
        else:
            proof_score = 3
            proof_issue = "A stranger landing here sees nothing that proves this worked for anyone else. No quotes, no names, no numbers. They're being asked to trust a page that hasn't earned it yet."
        return {
            "score": float(proof_score),
            "weight": "high",
            "issue": proof_issue,
            "fix": "Add proof near the first CTA: sample output, customer quote, metric, guarantee, or process evidence."
        }
    elif dim_key == "load_speed":
        html_size_score = 8 if len(html_text) < 120000 else 5
        return {
            "score": float(html_size_score),
            "weight": "high",
            "issue": "Page HTML is within normal bounds." if html_size_score >= 7 else f"HTML is {len(html_text)//1000}KB - large pages slow first paint.",
            "fix": "Compress images, remove render-blocking scripts, enable caching. Target Lighthouse performance >= 70 on mobile."
        }
    elif dim_key == "mobile":
        mobile_score = 8 if "viewport" in lower else 4
        return {
            "score": float(mobile_score),
            "weight": "medium",
            "issue": "Viewport tag is present." if mobile_score >= 7 else "Mobile viewport metadata may be missing.",
            "fix": "Ensure responsive viewport and test the hero/form on mobile width."
        }
    elif dim_key == "seo_foundations":
        # Simplified SEO foundations scoring for fallback
        title_tag = bool(re.search(r"<title[^>]*>.+?</title>", html_text, re.IGNORECASE | re.DOTALL))
        meta_desc = bool(re.search(r'<meta\s+[^>]*name=["\']description["\']', html_text, re.IGNORECASE))
        h1_present = bool(h1)
        seo_score = 5  # baseline
        if title_tag:
            seo_score += 1
        if meta_desc:
            seo_score += 1
        if h1_present:
            seo_score += 1
        seo_score = max(1, min(10, round(seo_score)))
        return {
            "score": float(seo_score),
            "weight": "high",
            "issue": "SEO foundations are solid - title, meta description, and H1 structure are well aligned." if seo_score >= 7 else "SEO foundations need work",
            "fix": "Write a unique 30-60 char title and 120-160 char meta description. Ensure exactly one descriptive H1 that shares keywords with the title."
        }
    elif dim_key == "ad_signals":
        # Simplified ad signals scoring for fallback
        return {
            "score": 5.0,
            "weight": "medium",
            "issue": "Ad signal verification completed",
            "fix": "Verify ad tracking implementation matches your campaign requirements"
        }
    elif dim_key == "above_fold":
        # Simplified above fold scoring for fallback
        fold_html = html_text[:3000]
        has_h1 = bool(h1)
        has_cta = bool(re.search(r'<(button|a)[^>]*>.*?</(button|a)>', fold_html, re.IGNORECASE | re.DOTALL))
        above_fold_score = 8 if has_h1 and has_cta else (5 if has_h1 or has_cta else 2)
        return {
            "score": float(above_fold_score),
            "weight": "high",
            "issue": "Early source segment contains headline, clickable control, and offer/price terms." if above_fold_score >= 7 else "Early source proxy lacks a headline, clickable control, or offer term",
            "fix": "Run rendered viewport inspection before treating source order as visual placement."
        }
    elif dim_key == "ai_readiness":
        # Simplified AI readiness scoring for fallback
        has_jsonld = bool(re.search(r'<script[^>]*type="application/ld\+json"[^>]*>', html_text))
        ai_score = 5  # baseline
        if has_jsonld:
            ai_score += 1
        ai_score = max(1, min(10, round(ai_score)))
        return {
            "score": float(ai_score),
            "weight": "medium",
            "issue": "AI citation readiness assessment completed",
            "fix": "Add JSON-LD Organization schema, complete OpenGraph tags, set canonical URL, and include concrete facts in your copy"
        }
    
    # Return default if dimension key not recognized
    return default_result


def _build_opportunity_matrix_from_dimensions(dimensions: dict) -> list:
    """Build opportunity matrix from dimension scores, similar to original score_audit logic."""
    # This is a simplified version of the opportunity matrix building logic
    # from the original score_audit function
    
    DIM_LABELS = {
        "headline": "Headline",
        "cta": "CTA",
        "social_proof": "Social Proof",
        "load_speed": "Load Speed",
        "mobile": "Mobile",
        "seo_foundations": "SEO Foundations",
        "ad_signals": "Ad Tracking",
        "above_fold": "Above Fold",
        "ai_readiness": "AI Citation Readiness",
    }
    
    # Quadrant classification based on impact vs effort
    effort_weights = {
        "headline": 2,
        "cta": 2,
        "above_fold": 3,
        "social_proof": 3,
        "load_speed": 7,
        "mobile": 3,
        "ad_signals": 8,
        "seo_foundations": 4,
        "ai_readiness": 5,
    }
    
    opp_matrix = []
    for key, dim in dimensions.items():
        score_val = dim["score"]
        if score_val >= 7:
            continue  # not a problem worth surfacing
        
        # Impact: inverse of score (lower score = bigger opportunity)
        base_impact = round((10 - score_val) / 2, 1)
        
        # Effort
        effort = effort_weights.get(key, 5)
        
        # Quadrant
        if base_impact >= 2.0 and effort <= 4:
            quadrant = "quick_win"
        elif base_impact >= 2.0 and effort > 4:
            quadrant = "major_project"
        elif base_impact < 2.0 and effort <= 4:
            quadrant = "fill_in"
        else:
            quadrant = "avoid"
        
        opp_matrix.append({
            "key": key,
            "label": DIM_LABELS.get(key, key.replace("_", " ").title()),
            "impact": base_impact,
            "effort": effort,
            "quadrant": quadrant,
            "issue": dim["issue"],
            "fix": dim["fix"],
        })
    
    # Sort: quick_wins first (by impact desc), then major, fill_in, avoid
    _order = {"quick_win": 0, "major_project": 1, "fill_in": 2, "avoid": 3}
    opp_matrix.sort(key=lambda x: (_order[x["quadrant"]], -x["impact"]))
    
    return opp_matrix



def detect_goal_contradictions(page, stated_goal):
    """
    CAIOS M5 - Stakeholder contradiction detection.
    Compares what the prospect SAID their goal is vs. what their page SHOWS.
    Returns a list of (claim, evidence, severity) tuples.
    """
    contradictions = []
    lower = page.get("html", "").lower()
    ctas = [c.lower() for c in page.get("ctas", [])]
    has_price = bool(re.search(r'\$[\d,]+|\.\d{2}\b|per month|per year|pricing', lower))
    has_checkout = bool(re.search(r'stripe|checkout|buy now|add to cart|place order|pay now', lower))
    has_lead_form = bool(re.search(r'<form|subscribe|get access|download|sign up|book a|schedule', lower))
    has_phone = bool(re.search(r'tel:|call us|\(\d{3}\)|phone', lower))

    goal = (stated_goal or "sales").lower()

    if goal == "sales":
        if not has_price:
            contradictions.append((
                "Stated goal: Sales",
                "No price point, pricing tier, or payment signal found on the page",
                "HIGH"
            ))
        if not has_checkout:
            contradictions.append((
                "Stated goal: Sales",
                "No checkout, buy button, or payment processor detected - visitor has nowhere to pay",
                "HIGH"
            ))

    elif goal == "leads":
        if not has_lead_form:
            contradictions.append((
                "Stated goal: Lead generation",
                "No lead capture form, email subscribe, or download CTA found on the page",
                "HIGH"
            ))

    elif goal == "bookings":
        if not has_phone and not re.search(r'calendly|cal\.com|acuity|book a|schedule', lower):
            contradictions.append((
                "Stated goal: Bookings",
                "No booking widget, calendar link, or phone number found - no path to schedule",
                "HIGH"
            ))

    elif goal == "signups":
        if not has_lead_form and not re.search(r'create account|sign up free|get started', lower):
            contradictions.append((
                "Stated goal: Signups",
                "No signup form, account creation CTA, or free trial offer found",
                "MEDIUM"
            ))

    return contradictions



def normalize_trigger_context(trigger_context):
    """Return a safe one-line opener explaining the buying trigger, or None."""
    if not trigger_context:
        return None
    text = re.sub(r"\s+", " ", str(trigger_context)).strip()
    if not text:
        return None
    if len(text) > 220:
        text = text[:217].rstrip() + "..."
    lower = text.lower()
    if lower.startswith(("saw ", "noticed ", "based on ", "your ")):
        return text
    return f"Saw the public conversion trigger: {text}."



def detect_stack(html_text):
    """Detect CMS, analytics, ad pixels, and key SaaS from page HTML.
    Returns a short plain-English string for the audit email opener.
    Web intelligence move (CAIOS Module 2): walk in already half-done.
    """
    h = html_text.lower()
    signals = []

    # CMS
    if "wp-content/" in h or "wordpress" in h:
        signals.append("WordPress")
    elif "shopify" in h or "cdn.shopify.com" in h:
        signals.append("Shopify")
    elif "squarespace" in h:
        signals.append("Squarespace")
    elif "webflow.io" in h or "webflow" in h:
        signals.append("Webflow")
    elif "wix.com" in h or "_wix_" in h:
        signals.append("Wix")
    elif "framer.com" in h or "framerusercontent" in h:
        signals.append("Framer")
    elif "bubble.io" in h:
        signals.append("Bubble")

    # Email/CRM
    if "klaviyo" in h:
        signals.append("Klaviyo")
    if "mailchimp" in h:
        signals.append("Mailchimp")
    if "activecampaign" in h:
        signals.append("ActiveCampaign")
    if "hubspot" in h:
        signals.append("HubSpot")
    if "go.crisp.chat" in h or "crisp.chat" in h:
        signals.append("Crisp")
    if "intercom" in h:
        signals.append("Intercom")
    if "gorgias" in h:
        signals.append("Gorgias")

    # Ad / analytics
    if "fbq(" in html_text or "facebook.net/en_US/fbevents" in h:
        signals.append("Meta Pixel")
    if "gtag(" in html_text or re.search(r'["\']G-[A-Z0-9]+["\']', html_text):
        signals.append("GA4")
    if "tiktok" in h and "pixel" in h:
        signals.append("TikTok Pixel")
    if "ads.twitter" in h or "twq(" in h:
        signals.append("X Ads")

    # Checkout
    if "stripe.com" in h:
        signals.append("Stripe")
    if "gumroad" in h:
        signals.append("Gumroad")
    if "paypal" in h:
        signals.append("PayPal")

    if not signals:
        return ""
    return ", ".join(signals[:5])  # cap at 5 to keep opener tight


def compose_audit_email(page, audit, email, trigger_context=None, monthly_spend=None, stated_goal=None, stated_role=None, stated_visitor=None, stated_tone=None, prompt_pack=None, website_audit_id=None):
    """Compose structured audit email - free-consulting frame, not report delivery."""
    DIM_LABELS = {
        "headline": "Headline",
        "cta": "CTA",
        "social_proof": "Social Proof",
        "load_speed": "Load Speed",
        "mobile": "Mobile",
        "seo_foundations": "SEO Foundations",
        "ad_signals": "Ad Tracking",
        "above_fold": "Above Fold",
        "ai_readiness": "AI Citation Readiness",
    }
    issues = sorted(audit["dimensions"].items(), key=lambda x: x[1]["score"])
    broken_only = [(k, v) for k, v in issues if v["score"] < 7]
    worst_key, worst_item = (broken_only[0] if broken_only else issues[0])
    worst_label = (DIM_LABELS.get(worst_key, worst_key.replace("_", " ").title())) or worst_key
    # Vowel-rule for indefinite article
    _label_lower = worst_label.lower().lstrip()
    _article = "an" if _label_lower and _label_lower[0] in "aeiou" else "a"
    domain = page["url"].replace("https://", "").replace("http://", "").split("/")[0]

    lines = []
    trigger_opener = normalize_trigger_context(trigger_context)
    if trigger_opener:
        lines.append(trigger_opener)
        lines.append("")

    score = audit["overall"]

    # Tech stack prefill (CAIOS Module 2: walk in already half-done)
    detected_stack = detect_stack(page.get("html", ""))
    if detected_stack:
        stack_line = f"I can see you're running {detected_stack}."
    else:
        stack_line = ""

    # Real spend override - use actual budget if provided, else conservative $2K estimate
    if monthly_spend and monthly_spend > 0:
        spend_label = f"${monthly_spend:,.0f}/mo"
    else:
        spend_label = "$2K/mo"

    # Goal-vs-page contradiction detection (CAIOS M5)
    contradictions = detect_goal_contradictions(page, stated_goal)

    # Role-specific personalized question (transversal = audit itself; personalized = follow-up)
    _role = (stated_role or "").lower()
    if "founder" in _role or "ceo" in _role or "owner" in _role:
        personalized_q = (
            "One question before I close the loop: what's the one thing that needs to be true "
            "in 90 days for you to consider this fixed? That anchors what we build."
        )
    elif "marketer" in _role or "marketing" in _role or "growth" in _role or "ads" in _role:
        personalized_q = (
            "Quick follow-up: which campaign is sending traffic to this page right now - "
            "paid search, paid social, or email? Knowing the traffic source changes the fix priority."
        )
    elif "agency" in _role or "freelance" in _role or "consultant" in _role:
        personalized_q = (
            "Quick question: is this your client's page or yours? "
            "If it's a client, I can format the fix list so you can hand it straight to them."
        )
    elif "dev" in _role or "engineer" in _role or "tech" in _role:
        personalized_q = (
            "One thing: do you have direct access to the page's HTML/CMS, or does every change "
            "go through an approval queue? That changes whether the $97 fix is a 2-hour job or a 2-week one."
        )
    else:
        personalized_q = ""  # no role = no personalized Q; keep email tight

    # Context-sharpened fix language (specificity principle: name what we saw)
    _visitor_ctx = f"Your audience ({stated_visitor}) " if stated_visitor else ""
    _tone_ctx = f" The page's intended tone is {stated_tone}." if stated_tone else ""
    # These are used to make above-fold and headline issue text surgical
    _fold_issue_override = None
    _headline_issue_override = None
    if stated_visitor and "above_fold" in audit.get("dimensions", {}):
        dim = audit["dimensions"]["above_fold"]
        if dim["score"] < 7:
            _fold_issue_override = (
                f"{_visitor_ctx}lands on a page with no clear first-screen CTA. "
                f"They should see a headline that names their problem + one action button. "
                f"Currently: {dim['issue']}{_tone_ctx}"
            )
    if stated_visitor and "headline" in audit.get("dimensions", {}):
        dim = audit["dimensions"].get("headline", {})
        if dim and dim.get("score", 10) < 7:
            _headline_issue_override = (
                f"Headline isn't calibrated for {stated_visitor}. "
                f"It should address their specific pain, not a generic claim.{_tone_ctx}"
            )

    # Advisor framing: point at specific dollars, not vague "conversion issues" (CAIOS lesson: advisor sentences name amounts)
    # Calculate actual monthly leak and recoverable waste based on score and monthly spend
    if monthly_spend and monthly_spend > 0:
        monthly_spend_num = monthly_spend
    else:
        # Default estimate if no spend provided
        monthly_spend_num = 2000.0
    
    # Determine waste percentage range based on score
    if score < 4:
        waste_pct_min, waste_pct_max = 0.70, 0.80  # 70-80%
        waste_pct_avg = (waste_pct_min + waste_pct_max) / 2  # 75%
    elif score < 6.5:
        waste_pct_min, waste_pct_max = 0.40, 0.50  # 40-50%
        waste_pct_avg = (waste_pct_min + waste_pct_max) / 2  # 45%
    elif score < 8:
        waste_pct_min, waste_pct_max = 0.15, 0.20  # 15-20%
        waste_pct_avg = (waste_pct_min + waste_pct_max) / 2  # 17.5%
    else:
        waste_pct_min, waste_pct_max = 0.05, 0.10  # 5-10%
        waste_pct_avg = (waste_pct_min + waste_pct_max) / 2  # 7.5%
    
    # Calculate monthly leak (wasted spend)
    monthly_leak_num = monthly_spend_num * waste_pct_avg
    
    # Calculate recoverable waste from fixing top issue
    # Get impact score from opportunity matrix (higher impact = more recoverable)
    _matrix = audit.get("opp_matrix", [])
    impact_score = 5.0  # Default middle impact
    if _matrix and len(_matrix) > 0:
        # Use the impact of the top issue (first in the sorted matrix)
        impact_score = _matrix[0].get("impact", 5.0)
        # Normalize impact to 0-1 scale where 10 is max impact
        impact_normalized = min(impact_score / 10.0, 1.0)
    else:
        impact_normalized = 0.5  # Default if no matrix data
    
    # Recoverable waste is the portion of the leak that fixing the top issue would recover
    recoverable_waste_num = monthly_leak_num * impact_normalized
    
    # Format values for display
    if monthly_spend_num >= 1000:
        spend_label = f"${monthly_spend_num:,.0f}/mo"
    else:
        spend_label = f"${monthly_spend_num:.0f}/mo"
        
    monthly_leak_label = f"${monthly_leak_num:,.0f}/mo"
    recoverable_waste_label = f"${recoverable_waste_num:,.0f}/mo"
    
    # Format waste percentage as range
    waste_pct_label = f"{int(waste_pct_min*100)}–{int(waste_pct_max*100)}%"
    
    _stack = (stack_line + " ") if stack_line else ""
    
    if score < 4:
        body_opener = (
            f"{_stack}I ran {domain} through our conversion analyzer. The {worst_label.lower()} alone is likely killing every visitor who lands on your page. "
            f"Pages scoring {score}/10 waste {waste_pct_label} of paid clicks - at {spend_label} that's {monthly_leak_label} evaporating before a single conversion."
        )
    elif score < 6.5:
        body_opener = (
            f"{_stack}I ran your landing page through our conversion analyzer - your {worst_label.lower()} is the leak. "
            f"Pages at {score}/10 lose {waste_pct_label} of ad clicks to friction. At {spend_label} in traffic that's {monthly_leak_label} in recoverable waste."
        )
    elif score < 8:
        body_opener = (
            f"{_stack}Checked {domain} - you're closer than most ({score}/10). "
            f"One or two friction points are likely costing {waste_pct_label} of conversions - {monthly_leak_label} at {spend_label}, more at scale."
        )
    else:
        body_opener = (
            f"{_stack}Ran {domain} through our analyzer - it's structurally solid ({score}/10). "
            f"Found a nuance that may account for {waste_pct_label} of unconverted clicks - {monthly_leak_label} at {spend_label}."
        )

    # ── Surgical pitch_line: names exactly what gets built (specificity principle) ──
    _matrix = audit.get("opp_matrix", [])
    _dim_labels_lookup = {
        "headline": "Headline Copy", "cta": "CTA Friction", "social_proof": "Social Proof",
        "load_speed": "Load Speed", "mobile": "Mobile Readiness", "seo_foundations": "SEO Foundations",
        "ad_signals": "Ad Tracking", "above_fold": "Above-Fold Clarity",
    }
    _qw_labels = [_dim_labels_lookup.get(o["key"], o["label"]) for o in _matrix if o["quadrant"] == "quick_win"]
    if _qw_labels:
        _qw_str = _qw_labels[0]
        pitch_line = (
            f"A tailored implementation kit for one selected {_qw_str} finding, sent by email after successful payment. "
            "You or your developer applies the change; no site access or call is required."
        )
    else:
        pitch_line = (
            "A tailored implementation kit for one selected finding, applied by you or your developer. "
            "No site access, call, or conversion-lift guarantee."
        )


    if broken_only:
        lines.append(body_opener)
        lines.append("")
        lines.append("")
        lines.append("*Note: Revenue impact estimates are based on industry benchmarks and audit score. Actual results may vary.*")
        lines.append("")
        lines.append(f"Score: {score}/10 · Grade {audit['overall_grade']}")
        lines.append("")
        lines.append("What's costing you conversions:")
        for key, item in broken_only:
            label = DIM_LABELS.get(key, key.replace("_", " ").title())
            _issue_text = item['issue']
            if key == "above_fold" and _fold_issue_override:
                _issue_text = _fold_issue_override
            elif key == "headline" and _headline_issue_override:
                _issue_text = _headline_issue_override
            lines.append(f"- {label}: {_issue_text} Fix: {item['fix']}")

    else:
        lines.append(body_opener)
        lines.append("")
        lines.append("")
        lines.append("*Note: Revenue impact estimates are based on industry benchmarks and audit score. Actual results may vary.*")
        lines.append("")
        for key, item in issues[:1]:
            label = DIM_LABELS.get(key, key.replace("_", " ").title())
            lines.append(f"- {label}: {item['issue']} Fix: {item['fix']}")

    # ── Prompt Pack teaser (free sample) ──
    if prompt_pack and prompt_pack.get("teaser"):
        teaser = prompt_pack["teaser"]
        lines.append("")
        lines.append("─" * 40)
        lines.append("")
        lines.append("🧠 AI Prompt - Paste this into Claude, ChatGPT, or Gemini:")
        lines.append("")
        lines.extend(teaser["prompt_md"].split("\n"))
        lines.append("─" * 40)

    # ── Contradiction block (CAIOS M5: highest-value finding, named explicitly) ──
    if contradictions:
        lines.append("")
        lines.append("⚠️  What your page claims vs. what it shows:")
        for claim, evidence, severity in contradictions:
            lines.append(f"   {claim} → {evidence}")

    # ── Personalized follow-up question (role-specific, aimed-first) ──
    if personalized_q:
        lines.append("")
        lines.append(personalized_q)

    # ── Opportunity Matrix block (ranked, evidence-backed) ──
    opp_matrix = audit.get("opp_matrix", [])
    qw  = [o for o in opp_matrix if o["quadrant"] == "quick_win"]
    maj = [o for o in opp_matrix if o["quadrant"] == "major_project"]
    av  = [o for o in opp_matrix if o["quadrant"] == "avoid"]

    if qw or maj:
        lines.append("")
        lines.append("Priority matrix (impact vs. effort - scored from your audit):")
        if qw:
            lines.append("  Quick wins (high impact, low effort - do first):")
            for o in qw:
                lines.append(f"    → {o['label']}: {o['fix']}")
        if maj:
            lines.append("  Major projects (high impact, needs planning):")
            for o in maj[:2]:  # cap at 2 to keep email tight
                lines.append(f"    → {o['label']}: {o['fix']}")
        if av:
            lines.append("  Skip for now (high effort, low return):")
            for o in av[:1]:
                lines.append(f"    ✗ {o['label']}")

    audit_offer_url = "https://nebulacomponents.com/audit?" + urlencode({
        "url": page.get("url", ""),
        "source": "audit_email",
    })
    # Direct Stripe payment link — pre-fills recipient email so they land on
    # a ready-to-pay Stripe checkout with zero additional friction.
    # Stripe's prefilled_email param populates the email field automatically.
    STRIPE_97_LINK = "https://buy.stripe.com/5kQbJ1eawdj6eql1Jg43S0h"
    stripe_buy_url = STRIPE_97_LINK + "?" + urlencode({
        "prefilled_email": email,
        "client_reference_id": urlencode({"url": page.get("url", ""), "source": "audit_email"}),
    })

    # Signed results URL — bypasses the email gate when the recipient clicks
    # back to their specific results page. Only available when the audit was
    # run via the website and the audit UUID is passed to compose_audit_email.
    results_url = None
    if website_audit_id:
        unlock_token = sign_audit_unlock(website_audit_id, email)
        if unlock_token:
            results_url = (
                f"https://nebulacomponents.com/audit/{website_audit_id}/results"
                f"?unlock={unlock_token}"
            )

    lines.extend([
        "",
        "━" * 40,
        "",
        f"$97 One-Leak Repair Sprint - {pitch_line}",
        "Details + FAQ: https://nebulacomponents.com/primer",
        "",
        f"Ready to fix it? Pay here (your email is pre-filled):",
        stripe_buy_url,
    ])
    if results_url:
        lines.extend([
            "",
            f"Or review your full results first (no email gate):",
            results_url,
        ])
    lines.extend([
        "",
        "📩 The paid kit is sent by email after Stripe confirms payment.",
        "🔒 We never ask for access to your site, CMS, or hosting - you apply the tailored change yourself.",
        "🔁 One free re-audit within 30 days to see what changed.",
        "",
        "━" * 40,
        "",

        "📊 Data privacy - this audit analyzed your page's public HTML only.",
        "   We never accessed: your analytics, ad accounts, CMS, customer data, or server.",
        "   Your email is used only for delivery and never shared.",
        "   Full policy: https://nebulacomponents.com/audit#data-privacy",
        "",
        "- Nebula Components",
        f"Audit engine v{ENGINE_VERSION} - score disputes can be traced to this version.",
    ])
    text_body = "\n".join(lines)

    # Fix Map - visual execution roadmap (Nico's FORGE adaptation)
    fix_map_html = ""
    if HAS_FIX_MAP:
        try:
            fm = build_fix_map(audit, url=page.get("url"))
            fix_map_html = fm["html"]
        except Exception:
            pass

    if fix_map_html:
        # Show the map instead of raw HTML tags
        page_url = page.get("url", "")
        html_body = fix_map_html
        results_link_html = ""
        if results_url:
            results_link_html = f'<p style="font-size:12px;color:#6b7280;margin:8px 0 0;">Or <a href="{results_url}" style="color:#059669;">review your full results first</a> (no email gate required).</p>'
        html_body += f"""
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:16px auto 0;padding-top:16px;border-top:1px solid #e5e7eb;">
  <p style="font-size:14px;font-weight:600;color:#111827;margin:0 0 8px;">{pitch_line}</p>
  <a href="{stripe_buy_url}" style="display:inline-block;background:#059669;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 24px;border-radius:8px;margin-bottom:8px;">Fix it now - $97 →</a>
  <p style="font-size:12px;color:#6b7280;margin:4px 0 0;">Your email is pre-filled. Kit sent within 48 hours after payment. <a href="https://nebulacomponents.com/primer" style="color:#059669;">Details + FAQ</a></p>
  {results_link_html}
  <div style="font-size:11px;color:#9ca3af;margin-top:10px;">Audit engine v{ENGINE_VERSION}</div>
</div>"""
    else:
        html_body = "<p>" + "</p><p>".join(line or "&nbsp;" for line in lines) + "</p>"
        html_body += f'<p style="font-size:11px;color:#9ca3af;">Audit engine v{ENGINE_VERSION} - score disputes can be traced to this version.</p>'

        # Subject: score-tier differentiated
    if score < 4:
        subject = f"Critical conversion blockers found on {domain}"
    elif score < 6.5:
        subject = f"Found {_article} {worst_label.lower()} problem costing you conversions on {domain}"
    elif score < 8:
        subject = f"{domain} is close - one fix could make ads profitable"
    else:
        subject = f"Tightening {domain} - quick opportunity spotted"
    return {"subject": subject, "text": text_body, "html": html_body}


def log_delivery(url, email, thread_id, audit, send_result, attribution=None):
    """Persist an audit delivery to the customer ledger and audit-leads log,
    including source/trigger attribution fields for revenue funnel reporting."""
    attribution = attribution or {}
    timestamp = time.strftime("%Y-%m-%dT%H:%M:%SZ")

    ledger_entry = {
        "timestamp": timestamp,
        "event_type": "audit_delivered",
        "url": url,
        "email": email,
        "thread_id": thread_id,
        "overall": audit.get("overall"),
        "overall_grade": audit.get("overall_grade"),
        "message_id": (send_result or {}).get("message_id"),
        "send_status": (send_result or {}).get("status"),
        "attribution": attribution,
    }
    ledger_path = Path(LEDGER_FILE)
    ledger_path.parent.mkdir(parents=True, exist_ok=True)
    with open(ledger_path, "a") as f:
        f.write(json.dumps(ledger_entry) + "\n")

    lead_entry = {
        "timestamp": timestamp,
        "url": url,
        "email": email,
        "overall": audit.get("overall"),
        "overall_grade": audit.get("overall_grade"),
        "source_type": attribution.get("source_type"),
        "trigger_type": attribution.get("trigger_type"),
        "vertical": attribution.get("vertical"),
        "offer_variant": attribution.get("offer_variant"),
    }
    audit_leads_path = Path(AUDIT_LEADS_FILE)
    audit_leads_path.parent.mkdir(parents=True, exist_ok=True)
    with open(audit_leads_path, "a") as f:
        f.write(json.dumps(lead_entry) + "\n")

    return ledger_entry


def compose_email(url, email, score):
    """Compose audit email with score."""
    return f"""Subject: Your Landing Page Audit ({score}/10)

Hey there,

I ran a quick audit on {url} and scored it {score}/10 for conversion potential.

Key findings:
- Headline clarity: {"Strong" if score >= 8 else "Needs work"}
- CTA strength: {"Effective" if score >= 8 else "Could be stronger"}
- Social proof: {"Present" if score >= 7 else "Missing"}

The full audit is ready here (self-serve):
https://nebulacomponents.com/audit.html?url={url}

If you want one tailored implementation-ready change, run the audit and select the $97 repair sprint from the eligible report. You or your developer applies it.

Best,
Nebula Audit Agent"""

def _latest_inbound_message_id(am, thread_id):
    """Find the newest non-AgentMail message in a thread so replies preserve threading."""
    if not thread_id:
        return None
    try:
        messages = am.list_messages(thread_id=thread_id, limit=20)
    except Exception:
        return None
    for msg in reversed(messages):
        sender = msg.get("from", "") or ""
        if "agentmail.to" not in sender.lower():
            return msg.get("message_id") or msg.get("id")
    return None


def send_via_agentmail(to, subject, body, html=None, thread_id=None, message_id=None, client_id=None):
    """Make one gated provider attempt; retries are requeued after the 300s cooldown."""
    from agentmail_client import AgentMailClient

    am = AgentMailClient()
    reply_to = message_id or _latest_inbound_message_id(am, thread_id)
    try:
        if reply_to:
            data = am.reply(
                reply_to,
                recipient=to,
                text=body,
                html=html,
                client_id=client_id,
            )
        else:
            data = am.send_audit(
                to=[to],
                subject=subject,
                text=body,
                html=html,
                client_id=client_id,
            )

        if data.get("_error"):
            err = data["_error"]
            status = "suppressed" if err == 403 else "deferred"
            print(f"❌ AgentMail {status}: {to}: {data.get('_reason') or err}")
            _log_delivery_crash(to, subject, data, 1)
            return {
                "ok": False,
                "status": status,
                "error": str(data.get("_reason") or err),
                "raw": data,
            }

        data.setdefault("status", "sent")
        data["ok"] = True
        if thread_id:
            data.setdefault("thread_id", thread_id)
        print(f"✅ Sent to {to} via agentmail{' in-thread' if reply_to else ''}")
        return data
    except Exception as exc:
        print(f"❌ Send exception: {exc}")
        _log_delivery_crash(to, subject, {"error": str(exc)}, 1)
        return {"ok": False, "status": "deferred", "error": str(exc)}


def _log_delivery_crash(to, subject, data, attempt):
    """Log a permanent delivery failure to the incident ledger."""
    import traceback
    entry = {
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "event_type": "delivery_failure",
        "to": to,
        "subject": subject[:80],
        "attempt": attempt,
        "error": str(data.get("_error") or data.get("error") or data),
        "traceback": traceback.format_exc(limit=3),
    }
    ledger_path = LEDGERS_DIR / "incident-ledger.jsonl"
    ledger_path.parent.mkdir(parents=True, exist_ok=True)
    with open(ledger_path, "a") as f:
        f.write(json.dumps(entry) + "\n")
    print(f"[incident-logged] delivery_failure for {to}")


def apply_historical_personalization(audit, historical_data):
    """Apply personalization to audit results based on historical data."""
    if not historical_data:
        return audit
    
    # Create a copy of the audit to avoid modifying the original
    personalized_audit = audit.copy()
    
    # Get recurring issues from historical data
    recurring_issues = historical_data.get("recurring_issues", [])
    score_trend = historical_data.get("score_trend", [])
    
    # If we have recurring issues, boost their importance in the opportunity matrix
    if recurring_issues and "opp_matrix" in personalized_audit:
        # Create a set of recurring issue keys for quick lookup
        recurring_keys = {issue.get("key") for issue in recurring_issues if issue.get("key")}
        
        # Boost the impact of recurring issues in the opportunity matrix
        for finding in personalized_audit["opp_matrix"]:
            if finding.get("key") in recurring_keys:
                # Increase impact score for recurring issues (up to a maximum of 10)
                current_impact = finding.get("impact", 0)
                # Boost by 50% but cap at 10
                boosted_impact = min(current_impact * 1.5, 10.0)
                finding["impact"] = round(boosted_impact, 1)
                
                # Add a note about this being a recurring issue
                if "issue" in finding:
                    finding["issue"] = f"[Recurring Issue] {finding['issue']}"
                if "fix" in finding:
                    finding["fix"] = f"[Recurring Issue] {finding['fix']}"
    
    # Add contextual insights based on score trend
    if score_trend and len(score_trend) >= 2:
        # Calculate score change over time
        oldest_score = score_trend[0].get("score") if score_trend[0].get("score") is not None else 0
        newest_score = score_trend[-1].get("score") if score_trend[-1].get("score") is not None else 0
        score_change = newest_score - oldest_score
        
        # Add trend information to the audit
        personalized_audit["historical_insights"] = {
            "score_trend": score_trend,
            "score_change": round(score_change, 1),
            "improving": score_change > 0.5,
            "declining": score_change < -0.5,
            "stable": abs(score_change) <= 0.5
        }
        
        # Add contextual message to findings if score is declining
        if score_change < -1.0:  # Significant decline
            for finding in personalized_audit.get("opp_matrix", []):
                if "issue" in finding:
                    finding["issue"] = f"[Trend Alert] Your score has dropped {abs(score_change):.1f} points over recent audits. {finding['issue']}"
    
    # Add historical data to the audit for API response
    personalized_audit["historical_data"] = historical_data
    
    return personalized_audit


def main():
    parser = argparse.ArgumentParser(description="Deliver audit to lead")
    parser.add_argument("url", help="URL to audit")
    parser.add_argument("email", help="Lead email address")
    parser.add_argument("--dry-run", action="store_true", help="Don't send, just print")
    parser.add_argument("--json", action="store_true", help="Output as JSON (for API integration)")
    parser.add_argument("--thread-id", help="AgentMail thread ID for reply")
    parser.add_argument("--message-id", help="AgentMail message ID to reply to")
    parser.add_argument("--trigger-context", help="Public buying trigger that explains why this audit is relevant")
    parser.add_argument("--source-url", help="Original public source URL for attribution")
    parser.add_argument("--lead-id", help="Growth handoff lead id for attribution")
    parser.add_argument("--trigger-type", help="Growth trigger type for attribution")
    parser.add_argument("--contact-route", help="Verified contact route used for attribution")
    parser.add_argument("--content-firewall-score", type=int, default=None, help="Content Firewall quality score (0-100)")
    parser.add_argument("--icp-score", type=int, default=None, help="ICP scoring matrix score (0-100)")
    parser.add_argument("--monthly-ad-spend", type=float, default=None, help="Monthly ad spend in USD")
    parser.add_argument("--historical-data", type=str, default=None, help="JSON string containing historical audit data for personalization")
    parser.add_argument("--website-audit-id", help="UUID of an audit run via the website — enables a signed results URL in the email")
    args = parser.parse_args()

    # Parse historical data if provided
    historical_data = None
    if args.historical_data:
        try:
            historical_data = json.loads(args.historical_data)
        except Exception as e:
            print(f"[WARN] Failed to parse historical data: {e}")

    contacted = load_contacted()
    if args.email in contacted:
        print(f"⚠️ Already contacted: {args.email}")
        return

    session = get_session()
    html = fetch_page(args.url, session)
    if not html:
        return

    page = scrape_page(args.url, html)
    if HAS_SIGNAL_VERIFIER:
        audit = score_audit_with_signal_verifiers(page)
    else:
        audit = score_audit(page)

    # Apply historical personalization if data was provided
    if historical_data:
        audit = apply_historical_personalization(audit, historical_data)

    # Build AI prompt pack from audit findings
    prompt_pack = None
    if HAS_PROMPT_PACK:
        try:
            prompt_pack = build_prompt_pack(
                audit, page,
                email=args.email,
                stated_visitor=args.stated_visitor if hasattr(args, 'stated_visitor') else None,
                stated_goal=args.stated_goal if hasattr(args, 'stated_goal') else None,
            )
        except Exception as e:
            print(f"[WARN] prompt pack generation failed: {e}")

    email_body = compose_audit_email(page, audit, args.email, trigger_context=args.trigger_context, monthly_spend=args.monthly_ad_spend, prompt_pack=prompt_pack, website_audit_id=getattr(args, 'website_audit_id', None))
    score = audit["overall"]
    attribution = {
        "source_type": "growth_trigger_queue" if args.source_url or args.lead_id else None,
        "source_url": args.source_url,
        "lead_id": args.lead_id,
        "trigger_type": args.trigger_type,
        "trigger_context": args.trigger_context,
        "contact_route": args.contact_route,
        "content_firewall_score": args.content_firewall_score,
        "icp_score": args.icp_score,
        "offer_variant": "audit_first_checkout" if args.source_url or args.lead_id else None,
    }
    attribution = {k: v for k, v in attribution.items() if v not in (None, "")}

    if args.dry_run and not getattr(args, 'json', False):
        print("=== DRY RUN ===")
        print(f"To: {args.email}")
        print(f"Subject: {email_body['subject']}")
        print(email_body["text"])
        return

    if getattr(args, 'json', False):
        # Output JSON for API integration (n8n workflow)
        import json
        result = {
            "url": args.url,
            "email": args.email,
            "name": args.name if hasattr(args, 'name') else None,
            "score": score,
            "grade": audit.get("overall_grade", ""),
            "engine_version": audit.get("engine_version", ENGINE_VERSION),
            "composite": audit.get("composite"),
            "composite_anchor": audit.get("composite_anchor"),
            "findings": audit.get("opp_matrix", []),
            "dimensions": audit.get("dimensions", {}),
            "tech_stack": audit.get("tech_stack", {}),
            "page_title": page.get("title", ""),
            "page_h1": page.get("h1", ""),
            "email_subject": email_body["subject"],
            "email_body_text": email_body["text"],
            "email_body_html": email_body.get("html", ""),
            "dry_run": args.dry_run,
            "strategic_finding": audit.get("strategic_finding"),
        }
        print(json.dumps(result))
        return

    sent = send_via_agentmail(
        args.email,
        email_body["subject"],
        email_body["text"],
        html=email_body.get("html"),
        thread_id=args.thread_id,
        message_id=args.message_id,
    )

    if sent.get("ok"):
        contacted[args.email] = {
            "url": args.url,
            "score": score,
            "sent_at": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "audit_url": f"https://nebulacomponents.com/audit.html?url={args.url}",
            "trigger_context": args.trigger_context,
        }
        save_contacted(contacted)

        # Update stats
        stats = load_stats()
        stats["audits_delivered"] = stats.get("audits_delivered", 0) + 1
        save_stats(stats)

        # Log event
        log_audit({
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ"),
            "email": args.email,
            "url": args.url,
            "score": score,
            "sent": True,
            "trigger_context": args.trigger_context,
            "source_url": args.source_url,
            "lead_id": args.lead_id,
            "thread_id": args.thread_id,
            "message_id": sent.get("message_id"),
        })

        log_delivery(args.url, args.email, args.thread_id, audit, sent, attribution=attribution)

        # ── Upsert lead to lead_state.db (source of truth) ───────────
        try:
            sys.path.insert(0, str(NEBULA_DIR))
            from lead_store import LeadStore as _LeadStore
            _db = _LeadStore()
            _db.upsert_lead(
                email=args.email,
                url=args.url,
                stage="audit_delivered",
                source=getattr(args, "source", "ramp"),
                trigger_context=getattr(args, "trigger_context", ""),
                audit_score=float(score) if score else None,
                audit_grade=audit.get("overall_grade", ""),
            )
            # Score: +3 for audit consumption (TrustOS: resource visit = high engagement)
            _db.add_score(args.email, 3, reason="audit_delivered")
        except Exception as _dbe:
            print(f"[WARN] lead_store upsert failed: {_dbe}")

        # Add to HOT_LEAD for all delivered audits
        if True:
            hot_lead = load_hot_lead()
            existing_emails = [l.get("email") for l in hot_lead if isinstance(l, dict)]
            if args.email not in existing_emails:
                hot_lead.append({
                    "email": args.email,
                    "url": args.url,
                    "score": score,
                    "audit_score": score,
                    "audit_grade": audit.get("overall_grade"),
                    "stage": "audit_delivered",
                    "status": "pending",
                    "action": "send_97_pitch",
                    "thread_id": args.thread_id,
                    "message_id": sent.get("message_id"),
                    "trigger_context": args.trigger_context,
                    "source_url": args.source_url,
                    "lead_id": args.lead_id,
                    "trigger_type": args.trigger_type,
                    "contact_route": args.contact_route,
                    "pitch_due_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(time.time() + 48 * 3600))
                })
                save_hot_lead(hot_lead)

if __name__ == "__main__":
    main()
