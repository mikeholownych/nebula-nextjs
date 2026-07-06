#!/home/mike/nebula/venv/bin/python3
"""
Signal Watcher — Machine 5 Top-of-Funnel
Monitors IndieHackers (via HN Algolia + direct IH attempts), Product Hunt (RSS),
and HN Algolia for buying trigger posts every 30 minutes.

Output: /home/mike/nebula/signal_queue.jsonl  (score >= 6 only)
Dedup:  /home/mike/nebula/signal_seen.json
"""

import json
import os
import re
import sys
import time
import traceback
import html as html_module
from datetime import datetime, timezone, timedelta
from urllib.parse import urlencode, quote_plus
from xml.etree import ElementTree as ET

# ── dependencies ───────────────────────────────────────────────────────────────
try:
    import requests
    from bs4 import BeautifulSoup
except ImportError:
    print("ERROR: requests/bs4 not found. Run: pip install requests beautifulsoup4")
    sys.exit(1)

# ── paths ──────────────────────────────────────────────────────────────────────
BASE_DIR   = "/home/mike/nebula"
QUEUE_FILE = os.path.join(BASE_DIR, "signal_queue.jsonl")
SEEN_FILE  = os.path.join(BASE_DIR, "signal_seen.json")

# ── http session ───────────────────────────────────────────────────────────────
SESSION = requests.Session()
SESSION.headers.update({
    "User-Agent": (
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/json,*/*",
    "Accept-Language": "en-US,en;q=0.9",
})
TIMEOUT = 15


# ══════════════════════════════════════════════════════════════════════════════
# DEDUP HELPERS
# ══════════════════════════════════════════════════════════════════════════════

def load_seen() -> set:
    if os.path.exists(SEEN_FILE):
        try:
            with open(SEEN_FILE) as f:
                data = json.load(f)
                return set(data) if isinstance(data, list) else set(data.keys())
        except Exception:
            pass
    return set()


def save_seen(seen: set):
    with open(SEEN_FILE, "w") as f:
        json.dump(sorted(seen), f, indent=2)


def append_signal(signal: dict):
    with open(QUEUE_FILE, "a") as f:
        f.write(json.dumps(signal) + "\n")


# ══════════════════════════════════════════════════════════════════════════════
# SIGNAL SCORING  (Machine 5 — score 1-10, emit only >= 6)
# ══════════════════════════════════════════════════════════════════════════════

# Tier 9-10: explicit financial/conversion pain
HIGH_PATTERNS = [
    r"traffic\s+but\s+no\s+conv",
    r"(spent|throwing|burned|wasted|blew)\s+\$[\d,]+\s+(on\s+)?ads",
    r"zero\s+sales",
    r"\b0\s+sales\b",
    r"\bno\s+sales\b",
    r"not\s+convert",
    r"no\s+conversions?",
    r"launched\s+(yesterday|today|last\s+week)\b.*\b0\s+sign",
    r"\b0\s+sign.ups?",
    r"zero\s+sign.?ups?",
    r"\$0\s+revenue",
    r"no\s+revenue",
    r"getting\s+traffic\b.*\bno\s+buy",
    r"visitors?\s+but\s+no\s+(convers|buy|sales|sign)",
    r"clicks\s+but\s+no\s+(convers|buy|sales|sign)",
    r"3\d+%\s+bounce",   # high bounce rate signal
    r"conversion\s+rate\s+(is\s+)?(0|0\.)",
]

# Tier 7-8: active help-seeking for landing page
MED_HIGH_PATTERNS = [
    r"roast\s+my\s+landing",
    r"roast\s+my\s+(site|page|startup|product)",
    r"feedback\s+(on|for|wanted|please)\s+my\s+landing",
    r"landing\s+page\s+feedback",
    r"review\s+my\s+landing\s+page",
    r"critique\s+my\s+landing",
    r"help\s+with\s+(my\s+)?landing\s+page",
    r"landing\s+page\s+help",
    r"improve\s+my\s+landing",
    r"no\s+traction",
    r"struggling\s+to\s+get\s+(users|customers|signups|sales)",
    r"can'?t\s+get\s+(users|customers|signups|sales)",
    r"\b0\s+customers\b",
    r"zero\s+customers",
    r"no\s+customers",
    r"conversion\s+rate\s+(is\s+)?(terrible|bad|awful|poor|low)",
    r"why\s+(is\s+)?nobody\s+(buying|signing|converting)",
    r"not\s+getting\s+(any\s+)?(users|customers|sales|signups|traction)",
    r"terrible\s+(conversion|ctr|click)",
    r"landing\s+page\s+not\s+working",
    r"why\s+are\s+(people\s+)?leaving",
]

# Tier 6: Show HN / IH with landing page or launch context (emit-worthy)
SHOW_HN_PATTERNS = [
    r"\bshow\s+hn\b.*\blanding\b",
    r"\bshow\s+ih\b",
    r"\bshow\s+hn\b.*\blaunch",
    r"\bshow\s+hn\b.*\bstartup",
    r"\bshow\s+hn\b.*\bfeedback",
    r"\bask\s+hn\b.*landing\s+page",
    r"\bask\s+hn\b.*\bno\s+(sales|traction|signups)",
    r"free\s+tool.*audit.*landing\s+page",
    r"audit.*landing\s+page",
    r"landing\s+page.*audit",
    r"posting\s+machine.*b2b",   # outbound SaaS founders = prospects
    r"running\s+linkedin.*founders",
]

# Tier 5: general Show HN / launches (below emit threshold on their own)
MED_PATTERNS = [
    r"\bshow\s+hn\b",
    r"\bshow\s+ih\b",
    r"just\s+launched",
    r"recently\s+launched",
    r"feedback\s+wanted",
    r"feedback\s+please",
    r"feedback\s+on\s+my",
    r"what\s+do\s+you\s+think\s+(of|about)",
    r"rate\s+my\s+(landing|page|site|website)",
    r"thoughts\s+on\s+my\s+(landing|page|site)",
    r"check\s+out\s+my\s+(landing|page|site|startup|product)",
    r"new\s+launch",
    r"launched\s+today",
    r"launched\s+yesterday",
    r"seeking\s+feedback",
    r"looking\s+for\s+feedback",
    r"need\s+feedback",
]


def score_signal(headline: str, body: str = "") -> int:
    combined = (headline + " " + body).lower()

    for pat in HIGH_PATTERNS:
        if re.search(pat, combined, re.I):
            return 9

    for pat in MED_HIGH_PATTERNS:
        if re.search(pat, combined, re.I):
            return 7

    for pat in SHOW_HN_PATTERNS:
        if re.search(pat, combined, re.I):
            return 6

    for pat in MED_PATTERNS:
        if re.search(pat, combined, re.I):
            return 5

    return 3  # below threshold


# ══════════════════════════════════════════════════════════════════════════════
# SOURCE 1+2 — IndieHackers via HN Algolia cross-links + IH direct attempts
# ══════════════════════════════════════════════════════════════════════════════

IH_TRIGGER_QUERIES = [
    "site:indiehackers.com landing page feedback",
    "site:indiehackers.com roast landing page",
    "site:indiehackers.com no conversions",
    "site:indiehackers.com no sales not converting",
    "indiehackers landing page feedback roast",
    "indiehackers.com no traction not converting",
]

IH_HN_QUERIES = [
    "indiehackers.com landing page",
    "indiehackers landing page feedback help",
    "roast my landing page indiehackers",
]


def scrape_ih_via_hn_algolia() -> list[dict]:
    """
    Use HN Algolia to find posts that link to or discuss IndieHackers
    landing page / conversion topics. IH's own site is a locked SPA,
    but HN community often shares IH links.
    """
    print("[IH-via-HN] Searching HN Algolia for IH landing page topics...")
    seen_ids = set()
    leads = []
    ninety_days = int(time.time()) - (90 * 86400)

    for query in IH_HN_QUERIES:
        try:
            params = urlencode({
                "query": query,
                "tags": "story",
                "numericFilters": f"created_at_i>{ninety_days}",
                "hitsPerPage": 20,
            })
            r    = SESSION.get(f"https://hn.algolia.com/api/v1/search_by_date?{params}", timeout=TIMEOUT)
            data = r.json() if r.status_code == 200 else {}
            for hit in data.get("hits", []):
                obj_id = hit.get("objectID", "")
                if obj_id in seen_ids:
                    continue
                seen_ids.add(obj_id)
                title    = hit.get("title") or ""
                prod_url = hit.get("url") or ""
                hn_url   = f"https://news.ycombinator.com/item?id={obj_id}"
                story_text = hit.get("story_text") or ""
                if not title:
                    continue
                leads.append({
                    "source": "ih_group",
                    "headline": title,
                    "trigger_text": story_text[:300],
                    "author": hit.get("author") or "",
                    "url": hn_url,
                    "product_url": prod_url,
                })
            time.sleep(0.5)
        except Exception as e:
            print(f"  [IH-via-HN] Error for '{query}': {e}")

    print(f"  [IH-via-HN] {len(leads)} posts")
    return leads


def scrape_ih_direct() -> list[dict]:
    """
    Attempt direct IH scraping. IH is a Firebase Ember SPA behind Cloudflare.
    We probe multiple API paths and fall back gracefully.
    """
    print("[IH-Direct] Attempting direct IndieHackers scrape...")
    leads = []

    # IH Firebase/Ember API candidates
    endpoints = [
        "https://www.indiehackers.com/api/v2/groups/landing-page-feedback/posts?limit=30&orderBy=createdAt&order=desc",
        "https://www.indiehackers.com/api/v1/posts?groupSlug=landing-page-feedback&limit=30",
    ]

    for endpoint in endpoints:
        try:
            r = SESSION.get(endpoint, timeout=TIMEOUT)
            if r.status_code == 200 and r.text.lstrip().startswith("{"):
                data  = r.json()
                posts = (data.get("posts") or data.get("items") or
                         data.get("data") or data.get("results") or [])
                if not isinstance(posts, list):
                    continue
                for post in posts[:20]:
                    title  = post.get("title") or post.get("headline") or ""
                    body   = post.get("body") or post.get("excerpt") or ""
                    slug   = post.get("slug") or post.get("id") or ""
                    user   = post.get("user") or {}
                    author = (user.get("username") if isinstance(user, dict) else str(user)) or post.get("userId") or "unknown"
                    url    = post.get("url") or (f"https://www.indiehackers.com/post/{slug}" if slug else "")
                    if title and url:
                        leads.append({
                            "source": "ih_group",
                            "headline": title,
                            "trigger_text": body[:300],
                            "author": str(author),
                            "url": url,
                            "product_url": "",
                        })
                if leads:
                    break
        except Exception:
            pass

    # Try search endpoint for trigger keywords
    if not leads:
        search_endpoints = [
            "https://www.indiehackers.com/api/v2/search?query={q}&type=posts&limit=20",
            "https://www.indiehackers.com/api/v1/search?query={q}&type=posts&limit=20",
        ]
        kws = ["roast my landing page", "no conversions", "no sales", "not converting"]
        seen_urls = set()
        for kw in kws:
            for tmpl in search_endpoints:
                try:
                    url = tmpl.format(q=quote_plus(kw))
                    r = SESSION.get(url, timeout=TIMEOUT)
                    if r.status_code == 200 and "{" in r.text[:20]:
                        data  = r.json()
                        posts = data.get("posts") or data.get("results") or data.get("hits") or []
                        for post in posts[:10]:
                            title = post.get("title") or post.get("headline") or ""
                            slug  = post.get("slug") or post.get("id") or ""
                            purl  = post.get("url") or (f"https://www.indiehackers.com/post/{slug}" if slug else "")
                            author = post.get("username") or post.get("userId") or "unknown"
                            if title and purl and purl not in seen_urls:
                                seen_urls.add(purl)
                                leads.append({
                                    "source": "ih_search",
                                    "headline": title,
                                    "trigger_text": kw,
                                    "author": str(author),
                                    "url": purl,
                                    "product_url": "",
                                })
                        if leads:
                            break
                except Exception:
                    pass
            time.sleep(0.5)

    print(f"  [IH-Direct] {len(leads)} posts from direct attempt")
    return leads


def scrape_ih_group() -> list[dict]:
    """Source 1: IH Landing Page Feedback group — all strategies."""
    direct = scrape_ih_direct()
    via_hn = scrape_ih_via_hn_algolia()
    # merge, dedup by url
    seen_urls = set()
    merged = []
    for lead in direct + via_hn:
        url = lead.get("url", "")
        if url and url not in seen_urls:
            seen_urls.add(url)
            merged.append(lead)
    print(f"  [IH-Total] {len(merged)} unique IH candidates")
    return merged


def scrape_ih_keywords() -> list[dict]:
    """Source 2: IH keyword search — handled within scrape_ih_group already."""
    # Already integrated into scrape_ih_group's direct strategy
    # Return empty to avoid double-counting
    return []


# ══════════════════════════════════════════════════════════════════════════════
# SOURCE 3 — Product Hunt (Atom RSS feed — no auth needed)
# ══════════════════════════════════════════════════════════════════════════════

PH_ATOM_FEEDS = [
    "https://www.producthunt.com/feed",
    "https://www.producthunt.com/feed?category=tech",
    "https://www.producthunt.com/feed?category=productivity",
    "https://www.producthunt.com/feed?category=developer+tools",
    "https://www.producthunt.com/feed?category=marketing",
]

PH_GQL_ENDPOINT = "https://api.producthunt.com/v2/api/graphql"
PH_GQL_QUERY = """
query NewProducts($postedAfter: DateTime) {
  posts(order: NEWEST, postedAfter: $postedAfter) {
    edges {
      node {
        id name tagline description url votesCount createdAt
        user { username name }
      }
    }
  }
}
"""


def fetch_ph_api(ph_token: str) -> list[dict]:
    """Query PH GraphQL API with bearer token."""
    forty_eight_h_ago = (datetime.now(timezone.utc) - timedelta(hours=48)).isoformat()
    payload = {
        "query": PH_GQL_QUERY,
        "variables": {"postedAfter": forty_eight_h_ago},
    }
    headers = {
        "Authorization": f"Bearer {ph_token}",
        "Content-Type":  "application/json",
        "Accept":        "application/json",
    }
    try:
        r = SESSION.post(PH_GQL_ENDPOINT, json=payload, headers=headers, timeout=TIMEOUT)
        if r.status_code == 200:
            edges = r.json().get("data", {}).get("posts", {}).get("edges", [])
            out   = []
            for edge in edges:
                node  = edge.get("node", {})
                votes = node.get("votesCount", 99)
                if int(votes) <= 5:
                    user = node.get("user") or {}
                    out.append({
                        "name":        node.get("name", ""),
                        "tagline":     node.get("tagline", ""),
                        "votes":       int(votes),
                        "url":         f"https://www.producthunt.com/posts/{node.get('id','')}",
                        "author":      (user.get("username") or user.get("name") or "unknown") if isinstance(user, dict) else "unknown",
                        "product_url": node.get("url", ""),
                        "created_at":  node.get("createdAt", ""),
                    })
            return out
    except Exception as e:
        print(f"  [PH-API] GraphQL error: {e}")
    return []


def parse_ph_atom(xml_text: str, cutoff_dt: datetime) -> list[dict]:
    """Parse PH Atom feed, return entries published after cutoff_dt."""
    results = []
    try:
        root = ET.fromstring(xml_text)
        ns   = {"atom": "http://www.w3.org/2005/Atom"}

        for entry in root.findall("atom:entry", ns):
            # Published date
            pub_raw = (entry.findtext("atom:published", "", ns) or
                       entry.findtext("atom:updated", "", ns))
            try:
                # Handle offset-aware timestamps like 2026-06-24T06:31:44-07:00
                pub_dt = datetime.fromisoformat(pub_raw.replace("Z", "+00:00"))
                if pub_dt.tzinfo is None:
                    pub_dt = pub_dt.replace(tzinfo=timezone.utc)
            except Exception:
                pub_dt = cutoff_dt  # treat as within window if we can't parse

            # Only entries within cutoff window
            if pub_dt < cutoff_dt:
                continue

            title  = entry.findtext("atom:title", "", ns).strip()
            link   = ""
            for lnk in entry.findall("atom:link", ns):
                if lnk.get("rel") == "alternate":
                    link = lnk.get("href", "")
                    break
            if not link:
                link = entry.findtext("atom:id", "", ns)

            author_el = entry.find("atom:author", ns)
            author = author_el.findtext("atom:name", "unknown", ns) if author_el is not None else "unknown"

            content_raw = entry.findtext("atom:content", "", ns)
            # Decode HTML entities in content and extract product URL
            content_decoded = html_module.unescape(content_raw)
            prod_url_match  = re.search(r'href="(https?://[^"]+producthunt\.com/r/[^"]+)"', content_decoded)
            # Alternative: find a non-PH href in content
            all_hrefs = re.findall(r'href="(https?://(?!www\.producthunt)[^"]+)"', content_decoded)
            product_url = all_hrefs[0] if all_hrefs else ""

            tagline = ""
            tag_match = re.search(r'<p>\s*([^<]{10,200})\s*</p>', content_decoded)
            if tag_match:
                tagline = tag_match.group(1).strip()

            results.append({
                "name":        title,
                "tagline":     tagline,
                "votes":       0,  # feed doesn't expose vote count
                "url":         link,
                "author":      author,
                "product_url": product_url,
                "created_at":  pub_raw,
            })
    except ET.ParseError as e:
        print(f"  [PH-RSS] XML parse error: {e}")
    return results


def scrape_product_hunt() -> list[dict]:
    """Source 3: Product Hunt — RSS Atom feeds + API fallback."""
    print("[PH] Fetching Product Hunt new launches...")
    leads = []
    cutoff = datetime.now(timezone.utc) - timedelta(hours=48)

    ph_token = os.environ.get("PH_TOKEN", "")

    raw_posts = []

    # A) Try GraphQL API if token available
    if ph_token:
        print("  [PH-API] Using PH_TOKEN for GraphQL API...")
        raw_posts = fetch_ph_api(ph_token)
        if raw_posts:
            print(f"  [PH-API] {len(raw_posts)} posts with <=5 votes from API")

    # B) RSS Atom feeds (no auth needed — confirmed working)
    if not raw_posts:
        print("  [PH-RSS] Fetching Atom feeds...")
        seen_urls = set()
        for feed_url in PH_ATOM_FEEDS:
            try:
                r = SESSION.get(feed_url, timeout=TIMEOUT)
                if r.status_code == 200 and "<feed" in r.text[:200]:
                    entries = parse_ph_atom(r.text, cutoff)
                    for e in entries:
                        if e["url"] not in seen_urls:
                            seen_urls.add(e["url"])
                            raw_posts.append(e)
                    print(f"    {feed_url.split('=')[-1]}: {len(entries)} new entries in 48h")
                time.sleep(0.5)
            except Exception as exc:
                print(f"  [PH-RSS] Error fetching {feed_url}: {exc}")

        print(f"  [PH-RSS] {len(raw_posts)} total unique PH entries in last 48h")

    # Convert to lead format
    for post in raw_posts:
        name    = post.get("name", "")
        tagline = post.get("tagline", "")
        headline = f"{name} — {tagline}" if tagline else name
        leads.append({
            "source":       "product_hunt",
            "headline":     headline,
            "trigger_text": f"New PH launch: {tagline}",
            "author":       post.get("author", "unknown"),
            "url":          post.get("url", ""),
            "product_url":  post.get("product_url", "") or post.get("url", ""),
        })

    print(f"  [PH] {len(leads)} PH leads total")
    return leads


# ══════════════════════════════════════════════════════════════════════════════
# SOURCE 4 — HN Algolia (fixed — real results)
# ══════════════════════════════════════════════════════════════════════════════

# Queries designed to actually return results (confirmed working)
HN_QUERIES = [
    # Very specific landing page pain
    ("roast my landing page",                    90),   # 90-day window
    ("no conversions landing page",              90),
    ("not converting website",                   90),
    ("landing page feedback help",               30),
    ("zero sales launched",                      90),
    ("why is nobody buying",                     90),
    ("traffic but no conversions",               90),
    ("conversion rate terrible",                 90),
    # Show HN + Ask HN for new launches
    ("Show HN landing page",                     7),    # 7-day — fresh launches
    ("Ask HN landing page critique",             30),
    ("Show HN launch feedback",                  7),
    # Broad with relevant terms
    ("landing page help feedback improve",       14),
    ("website not converting visitors",          90),
]


def scrape_hn_algolia() -> list[dict]:
    """
    Source 4: HN Algolia — search for landing-page / conversion pain.
    Uses variable time windows per query (recent Show HN = 7d, pain signals = 90d).
    """
    print("[HN] Querying HN Algolia for buying trigger posts...")
    seen_ids  = set()
    all_leads = []

    for query, days in HN_QUERIES:
        cutoff = int(time.time()) - (days * 86400)
        try:
            params = urlencode({
                "query":          query,
                "tags":           "story",
                "numericFilters": f"created_at_i>{cutoff}",
                "hitsPerPage":    20,
            })
            r    = SESSION.get(f"https://hn.algolia.com/api/v1/search_by_date?{params}", timeout=TIMEOUT)
            data = r.json() if r.status_code == 200 else {}
            hits = data.get("hits", [])

            for hit in hits:
                obj_id = hit.get("objectID", "")
                if obj_id in seen_ids:
                    continue
                seen_ids.add(obj_id)
                title  = hit.get("title") or ""
                if not title:
                    continue
                all_leads.append({
                    "source":       "hn_algolia",
                    "headline":     title,
                    "trigger_text": (hit.get("story_text") or "")[:300],
                    "author":       hit.get("author") or "",
                    "url":          f"https://news.ycombinator.com/item?id={obj_id}",
                    "product_url":  hit.get("url") or "",
                })

            if hits:
                print(f"  [HN] '{query}' ({days}d): {len(hits)} hits")
            time.sleep(0.4)

        except Exception as e:
            print(f"  [HN] Error for query '{query}': {e}")

    print(f"  [HN] {len(all_leads)} unique HN posts total")
    return all_leads


# ══════════════════════════════════════════════════════════════════════════════
# MAIN
# ══════════════════════════════════════════════════════════════════════════════

def run_all_sources() -> tuple:
    source_counts = {}
    all_leads     = []

    scrapers = [
        ("IH Group+Search", scrape_ih_group),
        ("ProductHunt",     scrape_product_hunt),
        ("HN Algolia",      scrape_hn_algolia),
    ]

    for name, fn in scrapers:
        try:
            leads = fn()
            source_counts[name] = len(leads)
            all_leads.extend(leads)
        except Exception as e:
            print(f"[ERROR] {name} scraper crashed: {e}")
            traceback.print_exc()
            source_counts[name] = 0

    return all_leads, source_counts


def process_leads(all_leads: list, seen: set) -> list:
    new_signals = []

    for lead in all_leads:
        url = lead.get("url", "").strip()
        if not url:
            continue
        if url in seen:
            continue

        headline     = lead.get("headline", "")
        trigger_text = lead.get("trigger_text", "")
        score        = score_signal(headline, trigger_text)

        # PH new launches: minimum score 6 (fresh launch = prime conversion prospect)
        # These founders JUST launched and need conversions — perfect target
        if lead.get("source") == "product_hunt" and score < 6:
            score = 6

        if score < 6:
            continue

        seen.add(url)
        signal = {
            "timestamp":    datetime.now(timezone.utc).isoformat(),
            "source":       lead.get("source", "unknown"),
            "url":          url,
            "author":       lead.get("author", ""),
            "product_url":  lead.get("product_url", ""),
            "headline":     headline,
            "trigger_text": trigger_text[:500],
            "signal_score": score,
            "contacted":    False,
        }
        new_signals.append(signal)

    return new_signals


def main():
    print("=" * 60)
    print(f"Signal Watcher — {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)

    seen               = load_seen()
    initial_seen_count = len(seen)
    print(f"Dedup: {initial_seen_count} URLs already seen\n")

    all_leads, source_counts = run_all_sources()
    print(f"\nRaw candidates: {len(all_leads)} total")

    new_signals = process_leads(all_leads, seen)

    for sig in new_signals:
        append_signal(sig)
    save_seen(seen)

    active_sources = sum(1 for v in source_counts.values() if v > 0)

    print("\n" + "=" * 60)
    print("SOURCE BREAKDOWN:")
    for src, count in source_counts.items():
        print(f"  {src:<20} {count:>3} raw candidates")

    if new_signals:
        print(f"\nNEW SIGNALS (score ≥ 6):")
        for sig in sorted(new_signals, key=lambda x: x["signal_score"], reverse=True):
            print(f"  [{sig['signal_score']}/10] {sig['source']:<16} {sig['headline'][:65]}")
    else:
        print("\n  No new high-signal leads this run (all already seen or score < 6)")

    print("=" * 60)
    print(f"Found {len(new_signals)} new signals (score>=6) from {active_sources} sources")
    print(f"Queue: {QUEUE_FILE}")
    print(f"Seen:  {SEEN_FILE} ({len(seen)} total)")

    return len(new_signals)


if __name__ == "__main__":
    main()
