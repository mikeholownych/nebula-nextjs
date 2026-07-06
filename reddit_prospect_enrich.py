#!/usr/bin/env python3
"""Enrich Reddit/HN trigger leads into real contact paths.

Reads dm_queue.jsonl / trigger_leads.jsonl, fetches old.reddit post pages, extracts:
- real author username
- original post body
- company/product names
- candidate website URLs from post body or search
- public contact emails from candidate sites

Does not guess emails. Writes reddit_enriched_prospects.jsonl.
"""
from __future__ import annotations

import argparse
import datetime as dt
import html
import json
import pathlib
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from dataclasses import dataclass, asdict

ROOT = pathlib.Path(__file__).resolve().parent
DM_QUEUE = ROOT / "dm_queue.jsonl"
OUT = ROOT / "reddit_enriched_prospects.jsonl"
USER_AGENT = "Mozilla/5.0 NebulaProspectEnrich/1.0"

SKIP_DOMAINS = {
    "reddit.com", "old.reddit.com", "www.reddit.com", "redd.it", "redditmedia.com",
    "google.com", "support.google.com", "youtube.com", "youtu.be", "facebook.com",
    "twitter.com", "x.com", "linkedin.com", "discord.gg", "join.slack.com",
    "slideshare.net", "docs.google.com", "imgur.com", "tiktok.com", "instagram.com",
}
EMAIL_RE = re.compile(r"[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}", re.I)
URL_RE = re.compile(r'https?://[^\s<>)\]"\']+', re.I)


@dataclass
class Prospect:
    source_url: str
    platform: str
    author: str
    title: str
    body_excerpt: str
    segment: str
    score: int
    company_hint: str | None
    candidate_sites: list[str]
    emails: list[str]
    contact_path: str
    status: str
    fit_reason: str
    enriched_at: str


def load_jsonl(path: pathlib.Path):
    if not path.exists():
        return []
    rows = []
    for line in path.read_text().splitlines():
        if line.strip():
            try:
                rows.append(json.loads(line))
            except json.JSONDecodeError:
                pass
    return rows


def fetch(url: str, timeout: int = 25) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read().decode("utf-8", "ignore")


def normalize_reddit_url(url: str) -> str:
    return url.replace("https://www.reddit.com/", "https://old.reddit.com/").replace("https://reddit.com/", "https://old.reddit.com/")


def clean_html(s: str) -> str:
    s = html.unescape(s)
    s = re.sub(r"<br\s*/?>", "\n", s, flags=re.I)
    s = re.sub(r"</p>", "\n", s, flags=re.I)
    s = re.sub(r"<.*?>", " ", s)
    s = re.sub(r"\s+", " ", s)
    return s.strip()


def parse_reddit_post(page: str) -> tuple[str, str, str]:
    # First t3_ thing is the submission.
    thing = re.search(r'<div class="thing[^>]*id="thing_t3_[^"]+"[^>]*>(.*?)<div class="child"', page, re.S)
    block = thing.group(1) if thing else page
    author_m = re.search(r'data-author="([^"]+)"', block) or re.search(r'class="author[^"]*"[^>]*>(.*?)</a>', block, re.S)
    title_m = re.search(r'<a class="title[^"]*"[^>]*>(.*?)</a>', block, re.S)
    body_m = re.search(r'<input type="hidden" name="thing_id" value="t3_[^"]+"/>\s*<div class="usertext-body[^>]*>\s*<div class="md">(.*?)</div>\s*</div>', block, re.S)
    if not body_m:
        bodies = re.findall(r'<div class="usertext-body[^>]*>\s*<div class="md">(.*?)</div>\s*</div>', block, re.S)
        body_html = bodies[0] if bodies else ""
    else:
        body_html = body_m.group(1)
    author = clean_html(author_m.group(1)) if author_m else "OP"
    title = clean_html(title_m.group(1)) if title_m else ""
    body = clean_html(body_html)
    return author, title, body


def domain(url: str) -> str:
    try:
        return urllib.parse.urlparse(url).netloc.lower().lstrip("www.")
    except Exception:
        return ""


def external_urls(text: str) -> list[str]:
    out = []
    for url in URL_RE.findall(text):
        url = url.rstrip(".,)")
        d = domain(url)
        if d and d not in SKIP_DOMAINS and not any(skip in d for skip in ["reddit", "google", "facebook", "linkedin", "twitter"]):
            out.append(url)
    return list(dict.fromkeys(out))


def extract_company_hint(title: str, body: str) -> str | None:
    patterns = [
        r"my company\s+([A-Z][A-Za-z0-9 .&'-]{2,40})",
        r"launched\s+(?:my company|my startup|our startup)?\s*([A-Z][A-Za-z0-9 .&'-]{2,40})",
        r"built\s+(?:my first product|a product|an app)?\s*([A-Z][A-Za-z0-9 .&'-]{2,40})",
        r"company\s+([A-Z][A-Za-z0-9 .&'-]{2,40})",
    ]
    hay = f"{title}. {body}"
    for pat in patterns:
        m = re.search(pat, hay)
        if m:
            hint = re.sub(r"\s+", " ", m.group(1)).strip(" .,-")
            hint = re.split(r"\b(?:and|but|because|that|where|which|with|until)\b", hint)[0].strip(" .,-")
            if 2 < len(hint) < 50:
                return hint
    return None


def public_emails_from_site(url: str) -> list[str]:
    emails: set[str] = set()
    pages = [url]
    base = urllib.parse.urlunparse(urllib.parse.urlparse(url)._replace(path="", params="", query="", fragment=""))
    pages += [base + p for p in ["/contact", "/about", "/support"]]
    for p in list(dict.fromkeys(pages))[:4]:
        try:
            text = fetch(p, timeout=12)
        except Exception:
            continue
        for e in EMAIL_RE.findall(text):
            low = e.lower()
            if not any(bad in low for bad in ["example.com", "sentry", "wixpress", "domain.com", ".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp"]):
                emails.add(low)
    return sorted(emails)


def enrich(rows: list[dict], limit: int) -> list[Prospect]:
    prospects = []
    seen = set()
    recent = [r for r in rows if r.get("platform") == "reddit"][-limit:]
    for row in recent:
        src = row.get("signal_url") or row.get("source_url")
        if not src or src in seen:
            continue
        seen.add(src)
        try:
            page = fetch(normalize_reddit_url(src))
            author, title, body = parse_reddit_post(page)
        except Exception as exc:
            prospects.append(Prospect(src, "reddit", row.get("username", "OP"), "", "", row.get("segment", ""), int(row.get("score", 0)), None, [], [], "reddit_dm_only", f"fetch failed: {exc}", dt.datetime.now(dt.timezone.utc).isoformat()))
            continue
        sites = external_urls(body)
        hint = extract_company_hint(title or row.get("message", ""), body)
        emails = []
        for site in sites[:3]:
            emails.extend(public_emails_from_site(site))
        emails = sorted(set(emails))
        if emails:
            contact_path = "email"
            status = "email_found"
        elif sites:
            contact_path = "website_manual_contact"
            status = "site_found_no_email"
        else:
            contact_path = f"reddit_dm:u/{author}"
            status = "reddit_dm_only"
        fit = row.get("segment") or "trigger pain"
        prospects.append(Prospect(
            source_url=src,
            platform="reddit",
            author=author,
            title=title or re.sub(r'^Hey — saw your post: "|"\..*$', '', row.get("message", ""), flags=re.S),
            body_excerpt=body[:900],
            segment=row.get("segment", ""),
            score=int(row.get("score", 0) or 0),
            company_hint=hint,
            candidate_sites=sites,
            emails=emails,
            contact_path=contact_path,
            status=status,
            fit_reason=f"{fit}: public post shows paid traffic/conversion pain; outreach should offer free 3-point teardown, not a call.",
            enriched_at=dt.datetime.now(dt.timezone.utc).isoformat(),
        ))
        time.sleep(0.8)
    return prospects


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=15)
    args = ap.parse_args()
    rows = load_jsonl(DM_QUEUE)
    prospects = enrich(rows, args.limit)
    with OUT.open("w") as f:
        for p in prospects:
            f.write(json.dumps(asdict(p), ensure_ascii=False) + "\n")
    counts = {}
    for p in prospects:
        counts[p.status] = counts.get(p.status, 0) + 1
    print(json.dumps({"prospects": len(prospects), "status_counts": counts, "out": str(OUT), "email_found": [asdict(p) for p in prospects if p.emails][:5]}, indent=2))


if __name__ == "__main__":
    main()
