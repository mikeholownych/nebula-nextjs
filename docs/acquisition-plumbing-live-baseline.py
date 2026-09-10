"""GET-only public baseline. Never submits audits, subscriptions or payments."""
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from html.parser import HTMLParser
import json
from pathlib import Path
import socket
import urllib.error
import urllib.request
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
ORIGIN = "https://nebulacomponents.com"
PATHS = ["/", "/audit", "/sitemap.xml", "/robots.txt", "/newsletter", "/newsletter/confirmed", "/api/newsletter/confirm", "/api/newsletter/confirm?token=invalid-integrity-check", "/repair-sprint", "/repair-sprint/example", "/proof", "/research/landing-page-performance-q3-2026", "/score", "/roi-calculator", "/funnel-audit", "/paid-traffic-leak-scorecard", "/ads-not-converting-two-percent", "/fix-conversion-leak-before-campaign"] + ["/for/" + s for s in ["saas", "ecommerce", "agencies", "coaching", "fintech", "healthtech", "b2b-software", "lead-gen"]] + ["/compare/" + s for s in ["whyiq", "landing-doctors", "fixroast"]]

class Metadata(HTMLParser):
    def __init__(self):
        super().__init__()
        self.canonical = []
        self.robots = []
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "link" and attrs.get("rel") == "canonical":
            self.canonical.append(attrs.get("href"))
        if tag == "meta" and attrs.get("name") == "robots":
            self.robots.append(attrs.get("content"))


def fetch(path):
    try:
        request = urllib.request.Request(ORIGIN + path, headers={"User-Agent": "Nebula-read-only-integrity-check/1.0"})
        try:
            response = urllib.request.urlopen(request, timeout=30)
        except urllib.error.HTTPError as exc:
            response = exc
        with response:
            text = response.read().decode("utf-8", errors="replace")
            parser = Metadata()
            parser.feed(text)
            row = {"path": path, "status": response.status, "final_url": response.url, "canonical": parser.canonical, "robots": parser.robots, "x_robots_tag": response.headers.get("X-Robots-Tag")}
            if path == "/sitemap.xml":
                row["urls"] = sorted(set(e.text for e in ET.fromstring(text).iter("{http://www.sitemaps.org/schemas/sitemap/0.9}loc")))
                row["count"] = len(row["urls"])
            if path.startswith("/api/") or path == "/robots.txt":
                row["body"] = text
            return row
    except Exception as exc:
        return {"path": path, "error": str(exc)}

if __name__ == "__main__":
    try:
        dns = sorted(set(r[4][0] for r in socket.getaddrinfo("api.nebulacomponents.com", 443)))
    except socket.gaierror as exc:
        dns = {"error": str(exc)}
    with ThreadPoolExecutor(max_workers=4) as pool:
        rows = list(pool.map(fetch, PATHS))
    result = {"captured_at": datetime.now(timezone.utc).isoformat(), "method": "GET only; invalid/missing tokens only", "legacy_confirmation_dns": dns, "routes": rows}
    output = ROOT / "docs/acquisition-plumbing-live-baseline.json"
    output.write_text(json.dumps(result, indent=2) + "\n")
    print(json.dumps({**result, "routes": [{k:v for k,v in row.items() if k not in ("urls", "body")} for row in rows]}, indent=2))
