#!/usr/bin/env python3
"""
trigger_lead_engine.py — trigger-aware lead discovery + segmentation + copy.

Finds demonstrated-pain posts (Reddit/HN), scores buying triggers, dedupes against
contacted.json, writes usable leads to trigger_leads.jsonl, and can draft self-serve
audit/checkout copy without human gating.
"""

from __future__ import annotations

import argparse
import html
import json
import re
import time
import urllib.parse
import urllib.request
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable

NEBULA = Path("/home/mike/nebula")
DEFAULT_LEADS = NEBULA / "trigger_leads.jsonl"
DEFAULT_CONTACTED = NEBULA / "contacted.json"

USER_AGENT = "Mozilla/5.0 (compatible; NebulaTriggerLeadEngine/1.0; +https://nebulacomponents.shop)"

TRIGGER_PATTERNS = {
    "ad_bleed": [
        r"\bgoogle ads\b", r"\bfacebook ads\b", r"\bmeta ads\b", r"\bpaid traffic\b",
        r"\bad spend\b", r"\bspend(?:ing)?\s+\$?\d+", r"\bbudget\b", r"\bcpc\b", r"\bppc\b",
    ],
    "zero_conversions": [
        r"\bzero conversions?\b", r"\b0 conversions?\b", r"\bno conversions?\b",
        r"\bnot converting\b", r"\bno signups?\b", r"\b0 sales\b", r"\bno sales\b",
        r"\bno customers?\b", r"\bno users?\b",
    ],
    "landing_page_feedback": [
        r"\broast my landing page\b", r"\blanding page feedback\b", r"\bfeedback on my landing page\b",
        r"\bhomepage feedback\b", r"\bconversion rate\b", r"\bcro\b",
    ],
    "founder_signal": [
        r"\bfounder\b", r"\bsolo founder\b", r"\bbootstrapped\b", r"\bindie hacker\b",
        r"\bmy startup\b", r"\bmy saas\b",
    ],
    "hiring_scaling": [
        r"\bhiring\b", r"\bscaling\b", r"\bnew reps\b", r"\bsdr\b", r"\bsales team\b",
    ],
}

NOISE_EMAIL_PARTS = (
    "noreply", "no-reply", "example.com", "reddit.com", "mailinator", "test@", "admin@",
    "privacy@", "abuse@", "postmaster", "mailer-daemon",
)

SEARCH_QUERIES = [
    'site:reddit.com/r/startups "google ads" "no conversions"',
    'site:reddit.com/r/PPC "landing page" "not converting"',
    'site:reddit.com/r/SaaS "roast my landing page"',
    'site:reddit.com/r/Entrepreneur "zero conversions" "ads"',
    'site:news.ycombinator.com "Ask HN" "landing page" "no conversions"',
    'site:news.ycombinator.com "landing page feedback" "SaaS"',
]

REDDIT_SEARCH_QUERIES = [
    'landing page not converting',
    'google ads no conversions',
    'zero conversions ads',
    'roast my landing page',
    'paid traffic no sales',
]


@dataclass
class TriggerLead:
    source_url: str
    title: str
    snippet: str
    source: str
    score: int
    intent: str
    triggers: list[str]
    segment: str
    email: str | None = None
    author: str | None = None
    discovered_at: str = ""

    def to_dict(self) -> dict:
        data = asdict(self)
        if not data["discovered_at"]:
            data["discovered_at"] = datetime.now(timezone.utc).isoformat()
        return data


def fetch_text(url: str, timeout: int = 15) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        raw = resp.read()
    return raw.decode("utf-8", errors="ignore")


def extract_emails(text: str) -> list[str]:
    emails = re.findall(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b", text or "")
    clean: list[str] = []
    for email in emails:
        low = email.lower().strip(".,;:)]}")
        if any(part in low for part in NOISE_EMAIL_PARTS):
            continue
        if low not in clean:
            clean.append(low)
    return clean


def score_trigger_signal(text: str) -> dict:
    low = html.unescape(text or "").lower()
    triggers: list[str] = []
    score = 0
    weights = {
        "ad_bleed": 4,
        "zero_conversions": 4,
        "landing_page_feedback": 3,
        "founder_signal": 2,
        "hiring_scaling": 1,
    }
    for trigger, patterns in TRIGGER_PATTERNS.items():
        if any(re.search(p, low) for p in patterns):
            triggers.append(trigger)
            score += weights[trigger]

    if "ad_bleed" in triggers and "zero_conversions" in triggers:
        score += 3
    if "landing_page_feedback" in triggers and "founder_signal" in triggers:
        score += 2
    if re.search(r"\$\s?\d{3,}|\d+\s?(?:k|grand)", low):
        score += 1

    intent = "cold"
    if score >= 9:
        intent = "hot"
    elif score >= 5:
        intent = "warm"
    return {"score": score, "triggers": triggers, "intent": intent}


def is_bad_fit(text: str) -> bool:
    low = (text or "").lower()
    bad_phrases = [
        "facebook ads expert", "google ads expert", "ads management", "managed google ads",
        "ama", "i will roast", "i'll roast", "free analyzer", "zero ad spend",
        "what is the highest converting", "best roast my landing page service",
    ]
    return any(p in low for p in bad_phrases)


def is_high_pain_fit(text: str, scored: dict) -> bool:
    low = (text or "").lower()
    has_active_money = any(p in low for p in ["spent", "spend", "$", "budget", "clicks", "cpc", "ppc", "ads", "ad spend"])
    has_conversion_failure = any(p in low for p in ["no conversions", "zero conversions", "0 conversions", "not converting", "no sales", "0 sales", "zero sales", "no signups"])
    has_hand_raise = any(p in low for p in ["roast my landing page", "landing page feedback", "review my landing page", "help my landing page"])
    return scored.get("score", 0) >= 7 and ((has_active_money and has_conversion_failure) or has_hand_raise)


def segment_lead(lead: dict) -> dict:
    text = " ".join(str(lead.get(k, "")) for k in ("title", "snippet", "body", "author"))
    scored = score_trigger_signal(text)
    triggers = set(scored["triggers"])
    low = text.lower()

    if {"ad_bleed", "zero_conversions"}.issubset(triggers) and (
        "founder_signal" in triggers or re.search(r"\b(my|our)\s+(startup|saas|business|landing page)\b", low)
    ):
        return {
            "segment": "founder_ad_bleed",
            "lead_with": "specific ad-spend leak + fast audit",
            "avoid": "enterprise proof or calendar ask",
            "cta_style": "self_serve_audit",
        }
    if "landing_page_feedback" in triggers:
        return {
            "segment": "feedback_seeker",
            "lead_with": "their public request for page feedback",
            "avoid": "generic CRO advice",
            "cta_style": "self_serve_audit",
        }
    if "hiring_scaling" in triggers:
        return {
            "segment": "hiring_scaling",
            "lead_with": "speed and pipeline leakage",
            "avoid": "DIY founder language",
            "cta_style": "self_serve_audit",
        }
    return {
        "segment": "general_conversion_pain",
        "lead_with": "observed conversion friction",
        "avoid": "book-a-call CTA",
        "cta_style": "self_serve_audit",
    }


def build_low_friction_email(lead: dict) -> dict:
    title = re.sub(r"\s+", " ", lead.get("title") or "your post").strip()[:90]
    scored = score_trigger_signal(f"{lead.get('title','')} {lead.get('snippet','')}")
    seg = segment_lead(lead)

    if "ad_bleed" in scored["triggers"] and "zero_conversions" in scored["triggers"]:
        subject = "ads not converting?"
        pain = "paid traffic hitting a page that isn't turning into signups"
        value = "the self-serve audit will show the first leaks to fix"
    elif seg["segment"] == "feedback_seeker":
        subject = "quick page teardown"
        pain = "you asked for landing page feedback"
        value = "the self-serve audit will show the top above-the-fold fixes"
    else:
        subject = "quick conversion idea"
        pain = "your post sounded like a conversion problem"
        value = "the self-serve audit will show one concrete fix before any pitch"

    body = (
        "Hey — saw your post: \"{title}\".\n\n"
        "Looks like {pain}.\n\n"
        "{value}.\n\n"
        "Run it here: https://nebulacomponents.shop/audit.html\n"
        "If you want implementation, checkout is here: https://buy.stripe.com/aFa7sL5E03Iwgyt2Nk43S02\n\n"
        "— Nebula Audit Agent"
    ).format(title=title, pain=pain, value=value)

    # Hard guardrails from the playbook.
    words = body.split()
    if len(words) > 80:
        body = " ".join(words[:72]) + "\nhttps://nebulacomponents.shop/audit.html\n\n— Nebula Audit Agent"
    return {"subject": subject.lower(), "body": body, "segment": seg["segment"], "score": scored["score"]}


class LeadStore:
    def __init__(self, leads_path: Path = DEFAULT_LEADS, contacted_path: Path = DEFAULT_CONTACTED):
        self.leads_path = Path(leads_path)
        self.contacted_path = Path(contacted_path)
        self.leads_path.parent.mkdir(parents=True, exist_ok=True)

    def load(self) -> list[dict]:
        if not self.leads_path.exists():
            return []
        return [json.loads(line) for line in self.leads_path.read_text().splitlines() if line.strip()]

    def contacted_emails(self) -> set[str]:
        if not self.contacted_path.exists():
            return set()
        try:
            raw = json.loads(self.contacted_path.read_text() or "{}")
        except json.JSONDecodeError:
            return set()
        if isinstance(raw, dict):
            return {str(k).lower() for k in raw.keys()}
        if isinstance(raw, list):
            return {str(x.get("email", "")).lower() for x in raw if x.get("email")}
        return set()

    def add(self, lead: dict) -> bool:
        source_url = lead.get("source_url") or lead.get("url") or ""
        email = (lead.get("email") or "").lower()
        existing = self.load()
        existing_urls = {(x.get("source_url") or x.get("url") or "") for x in existing}
        if source_url and source_url in existing_urls:
            return False
        if email and email in self.contacted_emails():
            return False
        record = dict(lead)
        record.setdefault("discovered_at", datetime.now(timezone.utc).isoformat())
        with self.leads_path.open("a") as f:
            f.write(json.dumps(record, sort_keys=True) + "\n")
        return True


def parse_duckduckgo_results(page: str, query: str) -> list[dict]:
    results: list[dict] = []
    blocks = re.findall(r'<a rel="nofollow" class="result__a" href="([^"]+)"[^>]*>(.*?)</a>', page, flags=re.S)
    snippets = re.findall(r'<a class="result__snippet"[^>]*>(.*?)</a>', page, flags=re.S)
    for idx, (href, title_html) in enumerate(blocks):
        url = html.unescape(href)
        if "uddg=" in url:
            parsed = urllib.parse.urlparse(url)
            qs = urllib.parse.parse_qs(parsed.query)
            url = qs.get("uddg", [url])[0]
        title = re.sub(r"<.*?>", "", html.unescape(title_html)).strip()
        snippet = ""
        if idx < len(snippets):
            snippet = re.sub(r"<.*?>", "", html.unescape(snippets[idx])).strip()
        if any(host in url for host in ("reddit.com", "news.ycombinator.com", "indiehackers.com")):
            results.append({"source_url": url, "title": title, "snippet": snippet, "source": "ddg", "query": query})
    return results


def parse_old_reddit_results(page: str, query: str) -> list[dict]:
    """Parse old.reddit.com/search HTML; works without JS and avoids Reddit JSON 403."""
    results: list[dict] = []
    blocks = re.findall(r'<div class="\s*search-result[^>]*>.*?(?=<div class="\s*search-result|</div></div></div></div>)', page, flags=re.S)
    if not blocks:
        blocks = [m.group(0) for m in re.finditer(r'<a [^>]*class="search-title[^"]*"[^>]*>.*?</a>', page, flags=re.S)]

    for block in blocks:
        title_m = re.search(r'<a [^>]*href="([^"]+)"[^>]*class="search-title[^"]*"[^>]*>(.*?)</a>', block, flags=re.S)
        if not title_m:
            title_m = re.search(r'<a [^>]*class="search-title[^"]*"[^>]*href="([^"]+)"[^>]*>(.*?)</a>', block, flags=re.S)
        if not title_m:
            continue
        href, title_html = title_m.groups()
        url = html.unescape(href)
        if url.startswith("/"):
            url = "https://old.reddit.com" + url
        if "/comments/" not in url:
            continue
        title = re.sub(r"<.*?>", "", html.unescape(title_html)).strip()
        snippet_m = re.search(r'<div class="search-result-body[^>]*>(.*?)</div>', block, flags=re.S)
        snippet = re.sub(r"<.*?>", "", html.unescape(snippet_m.group(1))).strip() if snippet_m else ""
        results.append({"source_url": url.replace("old.reddit.com", "www.reddit.com"), "title": title, "snippet": snippet, "source": "old_reddit", "query": query})
    return results


def discover_from_old_reddit(queries: Iterable[str] = REDDIT_SEARCH_QUERIES, sleep_s: float = 1.0) -> list[dict]:
    candidates: list[dict] = []
    seen: set[str] = set()
    for query in queries:
        url = "https://old.reddit.com/search?q=" + urllib.parse.quote_plus(query) + "&sort=new"
        try:
            page = fetch_text(url)
        except Exception as exc:
            print(f"[old_reddit] failed query={query[:50]} error={exc}")
            continue
        for item in parse_old_reddit_results(page, query):
            if item["source_url"] in seen:
                continue
            seen.add(item["source_url"])
            text_for_fit = f"{item['title']} {item['snippet']}"
            if is_bad_fit(text_for_fit):
                continue
            scored = score_trigger_signal(text_for_fit)
            if not is_high_pain_fit(text_for_fit, scored):
                continue
            seg = segment_lead(item)
            item.update(scored)
            item.update(seg)
            candidates.append(item)
        time.sleep(sleep_s)
    candidates.sort(key=lambda x: x.get("score", 0), reverse=True)
    return candidates


def discover_from_search(queries: Iterable[str] = SEARCH_QUERIES, sleep_s: float = 1.0) -> list[dict]:
    candidates: list[dict] = []
    seen: set[str] = set()
    for query in queries:
        url = "https://html.duckduckgo.com/html/?q=" + urllib.parse.quote_plus(query)
        try:
            page = fetch_text(url)
        except Exception as exc:
            print(f"[search] failed query={query[:50]} error={exc}")
            continue
        for item in parse_duckduckgo_results(page, query):
            if item["source_url"] in seen:
                continue
            seen.add(item["source_url"])
            text_for_fit = f"{item['title']} {item['snippet']}"
            if is_bad_fit(text_for_fit):
                continue
            scored = score_trigger_signal(text_for_fit)
            if not is_high_pain_fit(text_for_fit, scored):
                continue
            seg = segment_lead(item)
            item.update(scored)
            item.update(seg)
            candidates.append(item)
        time.sleep(sleep_s)
    candidates.sort(key=lambda x: x.get("score", 0), reverse=True)
    return candidates


NOISE_DOMAINS = frozenset([
    "reddit.com", "google.com", "twitter.com", "linkedin.com", "facebook.com",
    "youtube.com", "github.com", "wikipedia.org", "imgur.com", "i.redd.it",
    "v.redd.it", "preview.redd.it", "amazon.com", "apple.com", "microsoft.com",
])

def _extract_site_urls(text: str) -> list[str]:
    """Pull https?://domain.tld URLs from free text, excluding social/noise domains."""
    raw = re.findall(r'https?://[^\s\)\]\>\"\']+', text or "")
    seen, results = set(), []
    for u in raw:
        u = u.rstrip(".,;:)>]\"'")
        try:
            from urllib.parse import urlparse
            d = urlparse(u).netloc.lower().lstrip("www.")
        except Exception:
            continue
        if not d or d in NOISE_DOMAINS or d in seen:
            continue
        seen.add(d)
        results.append(u)
    return results


def _find_email_for_site(site_url: str) -> str | None:
    """HTTP-scrape common contact paths on site_url and return first valid email."""
    import urllib.request, urllib.error
    BAD = frozenset(['example','schema','sentry','w3.org','google','twitter',
                     'noreply','user@','test@','email@','your@','placeholder',
                     'yourname','john@company','company@','hello@example',
                     'email@domain','name@','owner@','webmaster@'])
    try:
        from urllib.parse import urlparse
        base = f"https://{urlparse(site_url).netloc}"
    except Exception:
        return None
    paths = ["", "/contact", "/about", "/privacy", "/support"]
    domain = urlparse(site_url).netloc.lstrip("www.").split(":")[0]
    for path in paths:
        try:
            req = urllib.request.Request(
                base + path,
                headers={"User-Agent": "Mozilla/5.0 (compatible; NebulaCrawler/1.0)"},
            )
            with urllib.request.urlopen(req, timeout=6) as r:
                text = r.read(32_000).decode("utf-8", errors="ignore")
            emails = re.findall(r'\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b', text)
            for e in emails:
                low = e.lower()
                if any(b in low for b in BAD):
                    continue
                # Prefer domain-matching or common contact prefixes
                if domain in low or any(low.startswith(p) for p in
                        ("hello@", "support@", "contact@", "founder@", "team@", "info@", "hi@")):
                    return low
        except Exception:
            continue
    return None


def enrich_reddit_json(lead: dict) -> dict:
    url = lead.get("source_url", "")
    if "reddit.com" not in url or "/comments/" not in url:
        return lead
    # Reddit JSON API now requires OAuth (HTTP 403). Fall back to old.reddit.com HTML.
    post_id_match = re.search(r'/comments/([a-z0-9]+)', url)
    if not post_id_match:
        return lead
    post_id = post_id_match.group(1)
    html_url = f"https://old.reddit.com/r/all/comments/{post_id}/"
    try:
        raw = fetch_text(html_url, timeout=10)
        # Extract post body from the HTML
        body_match = re.search(r'<div class="md"[^>]*><p>(.*?)</p>', raw, re.DOTALL)
        body = ""
        if body_match:
            body = re.sub(r'<[^>]+>', ' ', body_match.group(1))
            body = html.unescape(body)[:1000]
        # Extract author
        author_match = re.search(r'class="author"[^>]*>([^<]+)<', raw)
        if author_match:
            lead["author"] = author_match.group(1).strip()
        lead["body"] = body
        # 1. Email directly in post body
        emails = extract_emails(body)
        if emails:
            lead["email"] = emails[0]
        # 2. Extract linked site URLs from body; scrape for contact email
        if not lead.get("email"):
            site_urls = _extract_site_urls(body + " " + lead.get("title", "") + " " + lead.get("snippet", ""))
            for su in site_urls[:3]:  # cap at 3 sites per lead
                found = _find_email_for_site(su)
                if found:
                    lead["email"] = found
                    lead["site_url"] = su
                    break
        scored = score_trigger_signal(" ".join([lead.get("title", ""), lead.get("snippet", ""), body]))
        lead.update(scored)
        lead.update(segment_lead(lead))
    except Exception as exc:
        lead["enrich_error"] = str(exc)[:160]
    return lead


def run_discovery(limit: int = 25, dry_run: bool = False) -> list[dict]:
    store = LeadStore()
    candidates = discover_from_search()
    # DuckDuckGo HTML can return a bot/landing page with zero results. Fall back to
    # old.reddit.com search, which is static HTML and currently reliable from cron.
    if not candidates:
        candidates = discover_from_old_reddit()
    saved: list[dict] = []
    for lead in candidates[:limit]:
        if "reddit.com" in lead.get("source_url", ""):
            lead = enrich_reddit_json(lead)
        lead["email_copy"] = build_low_friction_email(lead)
        lead.setdefault("discovered_at", datetime.now(timezone.utc).isoformat())
        if dry_run:
            saved.append(lead)
        elif store.add(lead):
            saved.append(lead)
    return saved


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=25)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    leads = run_discovery(limit=args.limit, dry_run=args.dry_run)
    mode = "DRY-RUN" if args.dry_run else "SAVED"
    print(f"trigger_lead_engine {mode}: {len(leads)} leads")
    for lead in leads[:10]:
        email = lead.get("email") or "no-email"
        print(f"score={lead.get('score',0):>2} {lead.get('intent','?'):<4} {lead.get('segment','?'):<22} {email:<24} {lead.get('title','')[:70]}")


if __name__ == "__main__":
    main()
