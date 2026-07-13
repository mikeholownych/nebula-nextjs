#!/usr/bin/env python3
"""Crawl Nebula's public sitemap and critical routes for QA evidence."""
from __future__ import annotations

import concurrent.futures
import json
import re
import sys
import time
import xml.etree.ElementTree as ET
from pathlib import Path
from urllib.parse import urljoin, urlparse

import requests
from bs4 import BeautifulSoup

BASE = "https://nebulacomponents.shop"
OUT = Path("qa-output/artifacts/platform-crawl.json")
CRITICAL = [
    "/", "/audit", "/audit.html", "/thank-you.html", "/ai-ops-retainer.html",
    "/agency-partner.html", "/checkout.html", "/privacy-policy.html",
    "/learning-center/", "/case-studies/", "/robots.txt", "/sitemap.xml",
    "/llms.txt", "/openapi.json", "/.well-known/api-catalog", "/api/health",
    "/api/stats", "/does-not-exist-qa-404",
]
EXPECTED_STRIPE = {
    "6oUfZh7M87YM5TPgEa43S0b": "$147 Conversion Fix Pack",
    "00w5kD1nK0wkaa573A43S0c": "$1,497 AI Ops Retainer",
    "aFa8wPc2o7YM9613Ro43S0d": "$497 Agency Partner",
}
EXPECTED_STATUS = {f"{BASE}/does-not-exist-qa-404": 404}

session = requests.Session()
session.headers.update({"User-Agent": "NebulaPlatformQA/1.0"})


def fetch(url: str) -> dict:
    started = time.monotonic()
    try:
        response = session.get(url, timeout=20, allow_redirects=True)
    except Exception as exc:
        return {"url": url, "error": f"{type(exc).__name__}: {exc}", "elapsed_ms": round((time.monotonic()-started)*1000)}
    result = {
        "url": url,
        "final_url": response.url,
        "status": response.status_code,
        "elapsed_ms": round((time.monotonic()-started)*1000),
        "content_type": response.headers.get("content-type", ""),
        "redirects": [r.status_code for r in response.history],
        "bytes": len(response.content),
    }
    if "text/html" not in result["content_type"]:
        return result
    soup = BeautifulSoup(response.text, "html.parser")
    title = soup.title.get_text(" ", strip=True) if soup.title else ""
    h1s = [h.get_text(" ", strip=True) for h in soup.select("h1")]
    images = soup.select("img")
    inputs = soup.select("input, textarea, select")
    unlabeled = []
    for el in inputs:
        if el.get("type") in {"hidden", "submit", "button"}:
            continue
        ident = el.get("id")
        labelled = bool(el.get("aria-label") or el.get("aria-labelledby") or (ident and soup.select_one(f'label[for="{ident}"]')) or el.find_parent("label"))
        if not labelled:
            unlabeled.append(el.get("name") or ident or el.name)
    external_target_blank = []
    broken_fragments = []
    ids = {tag.get("id") for tag in soup.select("[id]")}
    links = []
    for anchor in soup.select("a[href]"):
        href = anchor.get("href", "").strip()
        if not href or href.startswith(("mailto:", "tel:", "javascript:")):
            continue
        absolute = urljoin(response.url, href)
        links.append(absolute)
        parsed = urlparse(absolute)
        if anchor.get("target") == "_blank" and not set((anchor.get("rel") or [])) & {"noopener", "noreferrer"}:
            external_target_blank.append(href)
        if href.startswith("#") and href[1:] not in ids:
            broken_fragments.append(href)
    result.update({
        "title": title,
        "h1_count": len(h1s),
        "h1s": h1s[:3],
        "forms": len(soup.select("form")),
        "inputs": len(inputs),
        "unlabeled_inputs": unlabeled,
        "images": len(images),
        "images_missing_alt": len([i for i in images if i.get("alt") is None]),
        "internal_links": sorted({u for u in links if urlparse(u).netloc == "nebulacomponents.shop"}),
        "broken_fragments": broken_fragments,
        "unsafe_blank_links": external_target_blank,
        "stripe_slugs": sorted(set(re.findall(r"buy\.stripe\.com/([A-Za-z0-9]+)", response.text))),
        "has_viewport": bool(soup.select_one('meta[name="viewport"]')),
        "html_lang": (soup.html.get("lang") if soup.html else None),
    })
    return result


def main() -> int:
    sitemap = session.get(f"{BASE}/sitemap.xml", timeout=20)
    sitemap.raise_for_status()
    root = ET.fromstring(sitemap.content)
    ns = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
    sitemap_urls = [loc.text.strip() for loc in root.findall(".//sm:loc", ns) if loc.text]
    urls = sorted(set(sitemap_urls + [BASE + p for p in CRITICAL]))
    with concurrent.futures.ThreadPoolExecutor(max_workers=12) as pool:
        pages = list(pool.map(fetch, urls))
    by_url = {p["url"]: p for p in pages}
    failures = [
        p for p in pages
        if p.get("error") or (
            p.get("status", 0) >= 400
            and p.get("status") != EXPECTED_STATUS.get(p["url"])
        )
    ]
    html_pages = [p for p in pages if "text/html" in p.get("content_type", "")]
    missing_titles = [p["url"] for p in html_pages if not p.get("title")]
    missing_h1 = [p["url"] for p in html_pages if p.get("h1_count") != 1]
    unlabeled = {p["url"]: p["unlabeled_inputs"] for p in html_pages if p.get("unlabeled_inputs")}
    missing_alt = {p["url"]: p["images_missing_alt"] for p in html_pages if p.get("images_missing_alt")}
    bad_fragments = {p["url"]: p["broken_fragments"] for p in html_pages if p.get("broken_fragments")}
    unsafe_blank = {p["url"]: p["unsafe_blank_links"] for p in html_pages if p.get("unsafe_blank_links")}
    observed_slugs = sorted({slug for p in html_pages for slug in p.get("stripe_slugs", [])})
    unexpected_slugs = [s for s in observed_slugs if s not in EXPECTED_STRIPE]
    internal_targets = sorted({u.split("#", 1)[0] for p in html_pages for u in p.get("internal_links", [])})
    uncrawled_internal = [
        u for u in internal_targets
        if u not in by_url and urlparse(u).path != "/cdn-cgi/l/email-protection"
    ]
    with concurrent.futures.ThreadPoolExecutor(max_workers=12) as pool:
        link_checks = list(pool.map(fetch, uncrawled_internal))
    broken_internal = [p for p in link_checks if p.get("error") or p.get("status", 0) >= 400]
    report = {
        "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "base": BASE,
        "summary": {
            "sitemap_urls": len(sitemap_urls),
            "routes_checked": len(pages),
            "html_pages": len(html_pages),
            "route_failures": len(failures),
            "internal_targets_checked": len(link_checks),
            "broken_internal_links": len(broken_internal),
            "missing_titles": len(missing_titles),
            "non_single_h1": len(missing_h1),
            "pages_with_unlabeled_inputs": len(unlabeled),
            "pages_with_missing_alt": len(missing_alt),
            "pages_with_broken_fragments": len(bad_fragments),
            "pages_with_unsafe_blank_links": len(unsafe_blank),
            "observed_stripe_slugs": observed_slugs,
            "unexpected_stripe_slugs": unexpected_slugs,
        },
        "failures": failures,
        "broken_internal_links": broken_internal,
        "missing_titles": missing_titles,
        "non_single_h1": missing_h1,
        "unlabeled_inputs": unlabeled,
        "missing_alt": missing_alt,
        "broken_fragments": bad_fragments,
        "unsafe_blank_links": unsafe_blank,
        "pages": pages,
    }
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps(report["summary"], indent=2))
    if failures:
        print("ROUTE FAILURES", json.dumps(failures, indent=2)[:8000])
    if broken_internal:
        print("BROKEN INTERNAL", json.dumps(broken_internal, indent=2)[:8000])
    return 1 if failures or broken_internal or unexpected_slugs else 0


if __name__ == "__main__":
    raise SystemExit(main())
