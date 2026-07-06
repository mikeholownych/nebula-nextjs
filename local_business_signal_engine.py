#!/usr/bin/env python3
"""Local business trigger discovery for Nebula audits.

Implements the playbook's Local Business Discovery signal without paid tools:
- pulls businesses with public websites from OpenStreetMap/Overpass
- screens landing/home pages with existing deliver_audit scorer
- extracts public emails from site/contact/about pages
- writes qualified weak-page prospects to local_business_prospects.jsonl

No guessed emails. No sending. Use deliver_audit.py for verified sends.
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import pathlib
import re
import time
import urllib.parse
import urllib.request
from dataclasses import asdict, dataclass

from deliver_audit import scrape_page, score_audit

ROOT = pathlib.Path(__file__).resolve().parent
OUT = ROOT / "local_business_prospects.jsonl"
USER_AGENT = "NebulaLocalBusinessSignal/1.0 (+https://nebulacomponents.shop)"
EMAIL_RE = re.compile(r"[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}", re.I)

# Dallas/Fort Worth test box. Expand by adding named bboxes once this proves ROI.
BBOXES = {
    "dallas": "32.65,-97.02,32.95,-96.60",
    "fort_worth": "32.62,-97.55,32.95,-97.10",
}
VERTICAL_PATTERNS = {
    "med_spa_wellness": r"(med spa|medical spa|aesthetic|aesthetics|wellness|trt|hormone|botox|laser)",
    "law_firm": r"(law|lawyer|attorney|injury|divorce|criminal defense)",
    "dental": r"(dentist|dental|orthodont|implant)",
    "home_services": r"(roofing|plumbing|hvac|air conditioning|garage door|foundation repair)",
}
NOISE_EMAIL_PARTS = (
    "example.com", "sentry", "wixpress", "domain.com", ".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp",
    "noreply", "no-reply", "my_email@", "your_email@", "you@email", "email@example", "example@gmail.com", "test@",
)


@dataclass
class LocalProspect:
    business: str
    vertical: str
    city: str
    url: str
    emails: list[str]
    phone: str | None
    score: float
    grade: str
    weak_points: list[str]
    ctas: list[str]
    headline: str
    trigger: str
    source: str
    discovered_at: str


def fetch(url: str, data: bytes | None = None, timeout: int = 25) -> str:
    req = urllib.request.Request(url, data=data, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read().decode("utf-8", "ignore")


def normalize_url(url: str) -> str:
    url = (url or "").strip()
    if not url:
        return ""
    if not url.startswith(("http://", "https://")):
        url = "https://" + url
    return url.rstrip("/")


def root_url(url: str) -> str:
    p = urllib.parse.urlparse(url)
    return urllib.parse.urlunparse((p.scheme, p.netloc, "", "", "", ""))


def extract_public_emails(url: str) -> list[str]:
    base = root_url(url)
    candidates = [url, base, base + "/contact", base + "/contact-us", base + "/about", base + "/privacy-policy"]
    emails: set[str] = set()
    for page in list(dict.fromkeys(candidates))[:6]:
        try:
            text = fetch(page, timeout=10)
        except Exception:
            continue
        for email in EMAIL_RE.findall(text):
            low = email.lower().strip(".,;:)]}")
            if any(bad in low for bad in NOISE_EMAIL_PARTS):
                continue
            emails.add(low)
        time.sleep(0.25)
    return sorted(emails)


def overpass_query(city: str, bbox: str, vertical: str, pattern: str, limit: int) -> list[dict]:
    q = f'''[out:json][timeout:25];(
      nwr["website"]({bbox})["name"~"{pattern}",i];
      nwr["contact:website"]({bbox})["name"~"{pattern}",i];
    );out tags center {limit};'''
    raw = fetch("https://overpass-api.de/api/interpreter", data=q.encode(), timeout=45)
    data = json.loads(raw)
    rows = []
    for e in data.get("elements", []):
        tags = e.get("tags", {}) or {}
        website = normalize_url(tags.get("website") or tags.get("contact:website") or "")
        name = tags.get("name") or ""
        if not name or not website:
            continue
        rows.append({"city": city, "vertical": vertical, "name": name, "website": website, "phone": tags.get("phone") or tags.get("contact:phone"), "source": f"overpass:{city}"})
    return rows


def audit_weak_points(audit: dict) -> tuple[float, str, list[str]]:
    overall = float(audit.get("overall") or audit.get("overall_score") or 0)
    grade = audit.get("overall_grade", "?")
    weak = []
    for key, finding in (audit.get("dimensions") or audit.get("findings") or {}).items():
        try:
            if float(finding.get("score", 10)) <= 6:
                weak.append(f"{key}: {finding.get('issue', '')}"[:180])
        except Exception:
            pass
    return overall, grade, weak[:3]


def discover(limit_per_vertical: int = 20, max_audits: int = 30) -> list[LocalProspect]:
    raw_rows = []
    for city, bbox in BBOXES.items():
        for vertical, pattern in VERTICAL_PATTERNS.items():
            try:
                raw_rows.extend(overpass_query(city, bbox, vertical, pattern, limit_per_vertical))
            except Exception as exc:
                print(json.dumps({"overpass_error": str(exc), "city": city, "vertical": vertical}))
            time.sleep(1)

    seen = set()
    prospects: list[LocalProspect] = []
    for row in raw_rows:
        url = row["website"]
        host = urllib.parse.urlparse(url).netloc.lower().lstrip("www.")
        if host in seen:
            continue
        seen.add(host)
        try:
            page = scrape_page(url)
            if page.get("error"):
                continue
            audit = score_audit(page)
            score, grade, weak = audit_weak_points(audit)
        except Exception as exc:
            print(json.dumps({"audit_error": str(exc), "url": url}))
            continue
        # Keep only pages with visible conversion leakage, not just every local business.
        if score > 7.2 and len(weak) < 2:
            continue
        emails = extract_public_emails(url)
        if not emails:
            continue
        trigger = f"local {row['vertical']} business with weak conversion page ({grade}, {score}/10)"
        prospects.append(LocalProspect(
            business=row["name"], vertical=row["vertical"], city=row["city"], url=url,
            emails=emails[:3], phone=row.get("phone"), score=score, grade=grade,
            weak_points=weak, ctas=page.get("ctas", [])[:5], headline=page.get("headline", "")[:160],
            trigger=trigger, source=row["source"], discovered_at=dt.datetime.now(dt.timezone.utc).isoformat()
        ))
        print(json.dumps({"qualified": row["name"], "url": url, "score": score, "email": emails[:1]}))
        if len(prospects) >= max_audits:
            break
        time.sleep(0.5)
    prospects.sort(key=lambda p: (p.score, -len(p.weak_points)))
    return prospects


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit-per-vertical", type=int, default=20)
    ap.add_argument("--max-audits", type=int, default=20)
    args = ap.parse_args()
    prospects = discover(args.limit_per_vertical, args.max_audits)
    with OUT.open("w") as f:
        for p in prospects:
            f.write(json.dumps(asdict(p), ensure_ascii=False, sort_keys=True) + "\n")
    print(json.dumps({"prospects": len(prospects), "out": str(OUT), "top": [asdict(p) for p in prospects[:5]]}, indent=2))


if __name__ == "__main__":
    main()
