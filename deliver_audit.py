#!/usr/bin/env python3
"""Deliver audit to lead. Scrape URL, score, compose email, send via AgentMail."""

import sys, json, time, re, subprocess, os, argparse
from pathlib import Path

# Fix Map — visual execution roadmap (Nico's FORGE adaptation)
try:
    from fix_map import build_fix_map
    HAS_FIX_MAP = True
except ImportError:
    HAS_FIX_MAP = False

# Configuration
NEBULA_DIR = Path("/home/mike/nebula")
# The live server runs under system Python but dependencies live in the repo venv.
# Add the active venv site-packages before importing BeautifulSoup/requests.
sys.path.insert(0, str(NEBULA_DIR / "venv" / "lib" / "python3.12" / "site-packages"))

from bs4 import BeautifulSoup
import requests
LEDGERS_DIR = NEBULA_DIR / "ledgers"
CONTACTED_PATH = NEBULA_DIR / "contacted.json"
HOT_LEAD_PATH = NEBULA_DIR / "HOT_LEAD.json"
STATS_PATH = NEBULA_DIR / "stats.json"
AUDIT_LOG_PATH = LEDGERS_DIR / "audit-delivery.log"
LEDGER_FILE = str(LEDGERS_DIR / "customer-ledger.jsonl")
AUDIT_LEADS_FILE = str(NEBULA_DIR / "audit_leads.jsonl")

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
    with open(CONTACTED_PATH, "w") as f:
        json.dump(contacted, f, indent=2)

def load_hot_lead():
    try:
        with open(HOT_LEAD_PATH, "r") as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return []

def save_hot_lead(hot_lead):
    with open(HOT_LEAD_PATH, "w") as f:
        json.dump(hot_lead, f, indent=2)

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

def fetch_page(url, session):
    """Fetch page with fallback UA rotation."""
    try:
        resp = session.get(url, timeout=15)
        if resp.status_code == 403:
            # Try with different UA
            session.headers.update({"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"})
            resp = session.get(url, timeout=15)
        resp.raise_for_status()
        return resp.text
    except requests.RequestException as e:
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

def scrape_page(url):
    """Fetch and parse a landing page for the live self-serve audit API."""
    session = get_session()
    html_text = fetch_page(url, session)
    if not html_text:
        raise ValueError(f"Could not fetch {url}")
    soup = BeautifulSoup(html_text, "html.parser")
    title = (soup.title.get_text(" ", strip=True) if soup.title else "")
    h1 = (soup.find("h1").get_text(" ", strip=True) if soup.find("h1") else "")
    text = soup.get_text(" ", strip=True)
    ctas = [el.get_text(" ", strip=True) for el in soup.find_all(["a", "button"]) if el.get_text(" ", strip=True)]
    return {"url": url, "html": html_text, "title": title, "h1": h1, "text": text, "ctas": ctas}


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
    proof_score = 8 if any(word in lower for word in ["testimonial", "review", "customer", "trusted", "case study", "proof"]) else 3
    speed_score = 8 if len(html_text) < 120000 else 5
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
            pagespeed_issue = f"Performance score: {round(float(perf_score) * 100)}/100"
    except Exception:
        pass  # fallback score/issue already set

    # --- Above-fold dimension ---
    fold_html = html_text[:3000]
    fold_lower = fold_html.lower()
    has_h1 = bool(h1)
    has_fold_cta = bool(re.search(r'<(button|a)[^>]*>(.*?)</(button|a)>', fold_html, re.IGNORECASE | re.DOTALL))
    has_fold_price = bool(re.search(r'(\$[\d,]+|free|discount|offer|save|off|deal|promo|sale)', fold_lower))
    fold_signals = sum([has_fold_cta, has_fold_price])
    if has_h1 and fold_signals >= 2:
        above_fold_score = 8
        above_fold_issue = "Hero section has headline, CTA, and offer/price signal."
        above_fold_fix = "Strong above-fold setup — consider A/B testing urgency triggers."
    elif has_h1 and fold_signals == 1:
        above_fold_score = 5
        above_fold_issue = "Hero has a headline but is missing " + ("a CTA" if not has_fold_cta else "a price/offer signal") + " in the first viewport."
        above_fold_fix = "Add a visible CTA button and a price or value signal above the fold to reduce decision friction."
    else:
        above_fold_score = 2
        above_fold_issue = "Above-fold content is weak: missing headline, CTA, or offer signal in first 3000 chars."
        above_fold_fix = "Place H1 headline, primary CTA button, and price/offer context all within the first viewport."

    # --- Ad signals dimension ---
    fb_pixel = bool(re.search(r'fbq\(|facebook\.net/en_US/fbevents', html_text))
    ga4 = bool(re.search(r'gtag\(|["\']G-[A-Z0-9]+["\']', html_text))
    utm_links = bool(re.search(r'\?utm_', html_text))
    thankyou = bool(re.search(r'thank[-_]you|/success', html_text, re.IGNORECASE))
    signals_found = sum([fb_pixel, ga4, utm_links, thankyou])
    ad_signals_score = min(2 + 2 * signals_found, 10)
    found_list = [name for flag, name in [
        (fb_pixel, "Facebook Pixel"), (ga4, "GA4"), (utm_links, "UTM params"), (thankyou, "Thank-you page signal")
    ] if flag]
    missing_list = [name for flag, name in [
        (fb_pixel, "Facebook Pixel"), (ga4, "GA4"), (utm_links, "UTM params"), (thankyou, "Thank-you page signal")
    ] if not flag]
    if found_list and missing_list:
        ad_signals_issue = f"Found: {', '.join(found_list)}. Missing: {', '.join(missing_list)}."
    elif found_list:
        ad_signals_issue = f"All key signals present: {', '.join(found_list)}."
    else:
        ad_signals_issue = "No ad tracking signals detected (Facebook Pixel, GA4, UTM, thank-you page)."
    ad_signals_fix = "Install Facebook Pixel + GA4 conversion events on thank-you page to measure true ROAS"

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
        seo_issues.append("Missing <title> tag")
        seo_score -= 2
    elif len(title_tag) < 15:
        seo_issues.append(f"Title tag too short ({len(title_tag)} chars)")
        seo_score -= 1
    elif len(title_tag) > 70:
        seo_issues.append(f"Title tag may truncate in SERP ({len(title_tag)} chars)")
        seo_score -= 1
    else:
        seo_score += 1  # good length

    # Meta description
    if not meta_desc:
        seo_issues.append("Missing meta description")
        seo_score -= 1
    elif len(meta_desc) < 80:
        seo_issues.append(f"Meta description too short ({len(meta_desc)} chars)")
        seo_score -= 1
    elif len(meta_desc) > 170:
        seo_issues.append(f"Meta description may truncate in SERP ({len(meta_desc)} chars)")
        seo_score -= 0.5
    else:
        seo_score += 1  # good length

    # H1 structure
    if h1_count == 0:
        seo_issues.append("Missing H1 tag")
        seo_score -= 2
    elif h1_count > 1:
        seo_issues.append(f"Multiple H1 tags ({h1_count}) — should have exactly one")
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
            seo_issues.append("H1 and title tag share no significant keywords — messaging misalignment")
            seo_score -= 1
        elif len(significant_common) < 2:
            seo_issues.append("H1 and title tag have weak keyword overlap — consider aligning messaging")
            seo_score -= 0.5
        else:
            seo_score += 1  # aligned messaging

    seo_score = max(1, min(10, round(seo_score)))

    if seo_score >= 7:
        seo_issue_text = "SEO foundations are solid — title, meta description, and H1 structure are well aligned."
        seo_fix_text = "Monitor ranking performance; consider adding structured data for rich results."
    elif seo_score >= 4:
        seo_issue_text = "SEO foundations need work: " + "; ".join(seo_issues[:3])
        seo_fix_text = "Write a unique 30-60 char title and 120-160 char meta description. Ensure exactly one descriptive H1 that shares keywords with the title."
    else:
        seo_issue_text = "Critical SEO gaps: " + "; ".join(seo_issues[:3])
        seo_fix_text = "Add a <title> tag and <meta name=\"description\"> immediately. Create a single H1 that contains your primary keyword and matches your title intent."

    dimensions = {
        "headline": {
            "score": headline_score,
            "weight": "high",
            "issue": "Headline is outcome-specific enough." if headline_score >= 7 else "Headline may not state the buyer outcome clearly above the fold.",
            "fix": "Lead with the concrete buyer result and target audience in the first sentence."
        },
        "cta": {
            "score": cta_score,
            "weight": "high",
            "issue": "CTA language is action-oriented." if cta_score >= 7 else "CTA language may be vague or missing above the fold.",
            "fix": "Use action + outcome copy such as 'Run my free teardown' or 'Get the fix kit'."
        },
        "social_proof": {
            "score": proof_score,
            "weight": "high",
            "issue": "Trust proof is visible." if proof_score >= 7 else "Trust proof appears weak or missing before the conversion ask.",
            "fix": "Add proof near the first CTA: sample output, customer quote, metric, guarantee, or process evidence."
        },
        "speed": {
            "score": speed_score,
            "weight": "medium",
            "issue": "Page weight appears reasonable from HTML size." if speed_score >= 7 else "Page may be heavy enough to create load friction.",
            "fix": "Compress images, defer non-essential scripts, and keep the first screen lightweight."
        },
        "mobile": {
            "score": mobile_score,
            "weight": "medium",
            "issue": "Viewport tag is present." if mobile_score >= 7 else "Mobile viewport metadata may be missing.",
            "fix": "Ensure responsive viewport and test the hero/form on mobile width.",
        },
        "pagespeed": {
            "score": pagespeed_score,
            "weight": "high",
            "issue": pagespeed_issue,
            "fix": "Compress images, remove render-blocking scripts, enable caching",
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
    }
    overall = round(sum(v["score"] for v in dimensions.values()) / len(dimensions), 1)
    grade = "A" if overall >= 8 else "B" if overall >= 6.5 else "C" if overall >= 5 else "D"
    return {"overall": overall, "overall_grade": grade, "dimensions": dimensions}


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


def compose_audit_email(page, audit, email, trigger_context=None):
    """Compose structured audit email — free-consulting frame, not report delivery."""
    DIM_LABELS = {
        "headline": "Headline",
        "cta": "CTA",
        "social_proof": "Social Proof",
        "speed": "Speed",
        "mobile": "Mobile",
        "seo_foundations": "SEO Foundations",
        "ad_signals": "Ad Tracking",
        "pagespeed": "Page Speed",
        "above_fold": "Above Fold",
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

    # Advisor framing: point at specific dollars, not vague "conversion issues" (CAIOS lesson: advisor sentences name amounts)
    if score < 4:
        monthly_leak = "~$1,600–$4,000/mo"
        waste_pct = "70–80%"
        body_opener = (
            f"I ran {domain} through our conversion analyzer. The {worst_label.lower()} alone is likely killing every visitor who lands on your page. "
            f"Pages scoring {score}/10 waste {waste_pct} of paid clicks — at a $2K/mo ad budget that's {monthly_leak} evaporating before a single conversion."
        )
        pitch_line = "The diagnosis is above. The $97 is the prescription — we ship every fix in 24h, no call required."
    elif score < 6.5:
        monthly_leak = "~$800–$1,800/mo"
        waste_pct = "40–50%"
        body_opener = (
            f"I ran your landing page through our conversion analyzer — your {worst_label.lower()} is the leak. "
            f"Pages at {score}/10 lose {waste_pct} of ad clicks to friction. At $2K/mo in traffic that's {monthly_leak} in recoverable waste."
        )
        pitch_line = "The diagnosis is above. The $97 is the prescription — plug these leaks in 24h and your ad spend starts working."
    elif score < 8:
        monthly_leak = "~$250–$700/mo"
        waste_pct = "15–20%"
        body_opener = (
            f"Checked {domain} — you're closer than most ({score}/10). "
            f"One or two friction points are likely costing {waste_pct} of conversions — {monthly_leak} at a $2K ad budget, more at scale."
        )
        pitch_line = "The diagnosis is above. The $97 is the prescription — surgical fixes, not a rebuild, shipped in 24h."
    else:
        monthly_leak = "~$100–$300/mo"
        waste_pct = "5–10%"
        body_opener = (
            f"Ran {domain} through our analyzer — it's structurally solid ({score}/10). "
            f"Found a nuance that may account for {waste_pct} of unconverted clicks — {monthly_leak} at typical spend levels."
        )
        pitch_line = "The $97 implements the fix in 24h. Might be the highest-ROI move you make this week. No call required."

    # ── Retainer seed (transition beats before $97 pitch) ──
    retainer_lines = [
        "",
        "─" * 40,
        "",
        "That leak is real, and it won't fix itself.",
        "Pages decay. Campaigns change. Content drifts.",
        "The fix you apply today needs monitoring, or you redo this audit in 12 months.",
        "",
        "AI Ops Retainer — $1,497/mo:",
        "• Monthly audit refresh — catch drift before it costs you",
        "• Up to 4 fixes per month — no per-ticket negotiation",
        "• AI governance — know which models touch your data, where, and why",
        "• Priority support — direct line, <30 min response, 24/7",
        "",
        "3-month pilot. No long-term contract. Cancel anytime.",
        "Full details: https://nebulacomponents.shop/ai-ops-retainer.html",
        "",
        "─" * 40,
    ]

    if broken_only:
        lines.append(body_opener)
        lines.append("")
        lines.append(f"Score: {score}/10 · Grade {audit['overall_grade']}")
        lines.append("")
        lines.append("What's costing you conversions:")
        for key, item in broken_only:
            label = DIM_LABELS.get(key, key.replace("_", " ").title())
            lines.append(f"- {label}: {item['issue']} Fix: {item['fix']}")
    else:
        lines.append(body_opener)
        lines.append("")
        for key, item in issues[:1]:
            label = DIM_LABELS.get(key, key.replace("_", " ").title())
            lines.append(f"- {label}: {item['issue']} Fix: {item['fix']}")

    lines.extend(retainer_lines)

    lines.extend([
        "",
        "DIY kit (free): https://nebulacomponents.shop/checkout.html",
        "Full breakdown: https://nebulacomponents.shop/7-systems.html (the 7 systems every page needs)",
        "",
        f"$97 — {pitch_line}",
        "Details + FAQ: https://nebulacomponents.shop/primer.html",
        "One-click checkout: https://buy.stripe.com/aFa7sL5E03Iwgyt2Nk43S02",
        "",
        "— Nebula Components",
    ])
    text_body = "\n".join(lines)
    
    # Fix Map — visual execution roadmap (Nico's FORGE adaptation)
    fix_map_html = ""
    if HAS_FIX_MAP:
        try:
            fm = build_fix_map(audit, url=page.get("url"))
            fix_map_html = fm["html"]
        except Exception:
            pass
    
    if fix_map_html:
        # Show the map instead of raw HTML tags
        html_body = fix_map_html
        html_body += f"""
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:560px;margin:16px auto 0;padding-top:16px;border-top:1px solid #e5e7eb;text-align:center;">
  <div style="font-size:13px;color:#6b7280;">
    <a href="https://nebulacomponents.shop/checkout.html?email={email}" style="color:#059669;text-decoration:underline;">View DIY fix kit →</a>
  </div>
</div>"""
    else:
        html_body = "<p>" + "</p><p>".join(line or "&nbsp;" for line in lines) + "</p>"
    
        # Subject: score-tier differentiated
    if score < 4:
        subject = f"Critical conversion blockers found on {domain}"
    elif score < 6.5:
        subject = f"Found {_article} {worst_label.lower()} problem costing you conversions on {domain}"
    elif score < 8:
        subject = f"{domain} is close — one fix could make ads profitable"
    else:
        subject = f"Tightening {domain} — quick opportunity spotted"
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
https://nebulacomponents.shop/audit.html?url={url}

If you'd like me to implement these fixes for $97 (done in 24h), just reply "YES" and I'll get started.

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


def send_via_agentmail(to, subject, body, html=None, thread_id=None, message_id=None):
    """Send or reply via the repo AgentMail REST client with 3-attempt retry + Resend fallback.

    Attempt 1: AgentMail (auto-fails to Resend on 5xx in the client).
    Attempts 2-3: AgentMail-only (Resend already tried).
    403 (suppressed) is NOT retried.
    Logs failures to incident ledger after 3 failed attempts.
    """
    from agentmail_client import AgentMailClient
    am = AgentMailClient()
    reply_to = message_id or _latest_inbound_message_id(am, thread_id)

    last_error = None
    for attempt in range(1, 4):
        if attempt > 1:
            import time
            delay = attempt * 15  # 30s, 45s backoff
            print(f"[retry {attempt}/3] waiting {delay}s before retry...")
            time.sleep(delay)

        try:
            if reply_to:
                data = am.reply(reply_to, text=body, html=html)
            else:
                data = am.send(to=[to], subject=subject, text=body, html=html)

            if data.get("_error"):
                err = data["_error"]
                # 403 = suppressed — do NOT retry
                if err == 403:
                    print(f"❌ AgentMail 403 (suppressed): {to}")
                    return {"ok": False, "status": "suppressed", "error": "403 suppressed"}
                # 5xx or network — will retry unless it's attempt 3
                if attempt < 3 and isinstance(err, int) and err >= 500:
                    print(f"⚠️  AgentMail {err} on attempt {attempt}/3 for {to}")
                    last_error = data
                    continue
                # Other errors — log and move on
                print(f"❌ AgentMail error: {data.get('_error')} {data.get('_body', '')}")
                if attempt == 3:
                    _log_delivery_crash(to, subject, data, attempt)
                return {"ok": False, "status": "error", "error": str(err), "raw": data}

            data.setdefault("status", "sent")
            data["ok"] = True
            if thread_id:
                data.setdefault("thread_id", thread_id)
            via = data.get("_via", "agentmail")
            print(f"✅ Sent to {to} via {via}{' in-thread' if reply_to else ''}")
            if attempt > 1:
                print(f"  (succeeded on retry {attempt})")
            return data

        except Exception as e:
            last_error = str(e)
            print(f"❌ Send exception (attempt {attempt}/3): {e}")
            if attempt == 3:
                _log_delivery_crash(to, subject, {"error": str(e)}, attempt)

    # All 3 attempts failed
    print(f"❌❌ All 3 attempts failed for {to}")
    return {"ok": False, "status": "failed", "error": str(last_error)}


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

def main():
    parser = argparse.ArgumentParser(description="Deliver audit to lead")
    parser.add_argument("url", help="URL to audit")
    parser.add_argument("email", help="Lead email address")
    parser.add_argument("--dry-run", action="store_true", help="Don't send, just print")
    parser.add_argument("--thread-id", help="AgentMail thread ID for reply")
    parser.add_argument("--message-id", help="AgentMail message ID to reply to")
    parser.add_argument("--trigger-context", help="Public buying trigger that explains why this audit is relevant")
    parser.add_argument("--source-url", help="Original public source URL for attribution")
    parser.add_argument("--lead-id", help="Growth handoff lead id for attribution")
    parser.add_argument("--trigger-type", help="Growth trigger type for attribution")
    parser.add_argument("--contact-route", help="Verified contact route used for attribution")
    args = parser.parse_args()

    contacted = load_contacted()
    if args.email in contacted:
        print(f"⚠️ Already contacted: {args.email}")
        return

    session = get_session()
    html = fetch_page(args.url, session)
    if not html:
        return

    page = scrape_page(args.url)
    audit = score_audit(page)
    email_body = compose_audit_email(page, audit, args.email, trigger_context=args.trigger_context)
    score = audit["overall"]
    attribution = {
        "source_type": "growth_trigger_queue" if args.source_url or args.lead_id else None,
        "source_url": args.source_url,
        "lead_id": args.lead_id,
        "trigger_type": args.trigger_type,
        "trigger_context": args.trigger_context,
        "contact_route": args.contact_route,
        "offer_variant": "audit_first_97_checkout" if args.source_url or args.lead_id else None,
    }
    attribution = {k: v for k, v in attribution.items() if v not in (None, "")}

    if args.dry_run:
        print("=== DRY RUN ===")
        print(f"To: {args.email}")
        print(f"Subject: {email_body['subject']}")
        print(email_body["text"])
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
            "audit_url": f"https://nebulacomponents.shop/audit.html?url={args.url}",
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