#!/usr/bin/env python3
"""Ramp pipeline fill: live Reddit scrape via Apify → enrich → send self-serve audit outreach."""
import json, os, re, subprocess, sys, time
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse, quote, unquote

import requests

BASE=Path('/home/mike/nebula')
KEY_FILE = Path.home() / ".hermes/secrets/agentmail_org.key"
APIFY_KEY_FILE = Path.home() / ".hermes/secrets/apify.key"
DEAD_LETTER = BASE / 'dead_letter_queue.jsonl'
REDDIT_DEDUP = BASE / 'reddit_scraped_ids.jsonl'
FIREWALL_LOG = BASE / 'firewall_blocked.jsonl'
FIREWALL_MIN_SCORE = 50  # posts below this get blocked from outreach

# ── ICP Quality Gate ────────────────────────────────────────────────────────
# Only send full audits to leads expressing the BUYING TRIGGER, not just any
# landing page feedback. Self-serve link is in the email body regardless.
ICP_GATE_ENABLED = True

ICP_TRIGGER_PATTERNS = {
    "ad_bleed": [
        r"\bgoogle ads?\b", r"\bfacebook ads?\b", r"\bmeta ads?\b", r"\bpaid traffic\b",
        r"\bad spend\b", r"\bspend(?:ing)?\s+\$?\d+", r"\bbudget\b", r"\bcpc\b", r"\bppc\b",
        r"\$\s?\d{3,}", r"\brunning ads?\b", r"\bgoogle adwords?\b", r"\bsearch ads?\b",
    ],
    "zero_conversions": [
        r"\bzero conversions?\b", r"\b0 conversions?\b", r"\bno conversions?\b",
        r"\bnot converting\b", r"\bno signups?\b", r"\b0 sales\b", r"\bno sales\b",
        r"\bno customers?\b", r"\bclicks? no (sales|conversions|buys?)\b",
        r"\bburning money\b", r"\bthrowing money\b", r"\bwasting money\b",
        r"\bno bookings?\b", r"\bno leads?\b", r"\bzero signups\b",
    ],
    "landing_page_feedback": [
        r"\broast my landing page\b", r"\blanding page feedback\b", r"\bfeedback on my (landing page|site)\b",
        r"\bhomepage feedback\b", r"\bconversion rate(?!\s+optimization)\b", r"\broast my site\b",
    ],
    "founder_signal": [
        r"\bfounder\b", r"\bsolo founder\b", r"\bbootstrapped\b", r"\bindie hacker\b",
        r"\bmy startup\b", r"\bmy saas\b", r"\bjust launched\b",
    ],
}

# Test/sandbox emails that should never receive outreach
TEST_EMAILS = frozenset([
    "mike.holownych@aisyndicate.io",
    "mike.holownych@gmail.com",
    "test@example.com",
    "restart-test@example.com",
    "stripe@example.com",
    "founder@testco.com",
    "nebulashop@agentmail.to",
])


def check_icp_fit(post_text: str, trigger_source: str) -> tuple[bool, str]:
    """Check if a lead expresses the buying trigger (ad_bleed + zero_conversions).
    
    Returns (True, reason) for ICP-fit leads, (False, reason) for non-ICP.
    The self-serve link is always available in outreach — this only gates
    the full automated audit delivery.
    """
    low = post_text.lower()
    triggers_found = []
    score = 0
    
    for trigger, patterns in ICP_TRIGGER_PATTERNS.items():
        if any(re.search(p, low) for p in patterns):
            triggers_found.append(trigger)
            scores = {"ad_bleed": 5, "zero_conversions": 5, "landing_page_feedback": 2, "founder_signal": 2}
            score += scores.get(trigger, 0)
    
    # Bonus for the buying trigger combo
    has_ad_bleed = "ad_bleed" in triggers_found
    has_zero_conv = "zero_conversions" in triggers_found
    has_founder = "founder_signal" in triggers_found
    
    if has_ad_bleed and has_zero_conv:
        score += 3
        return True, f"buying_trigger (ad_bleed+zero_conversions, score={score})"
    
    if (has_ad_bleed or has_zero_conv) and has_founder:
        return True, f"founder_with_pain (triggers={triggers_found}, score={score})"
    
    if has_ad_bleed:
        return True, f"ad_bleed_present (triggers={triggers_found}, score={score})"
    
    if trigger_source in ("reddit_ads_pain", "reddit_zero_sales", "reddit_ads_no_conv"):
        return True, f"high_yield_source ({trigger_source})"
    
    return False, f"no_buying_trigger (triggers={triggers_found}, score={score})"

sys.path.insert(0, str(BASE))

# Content Firewall — synthetic content filter
try:
    from growth_system.content_firewall import filter_lead, firewall_score
    HAS_FIREWALL = True
except ImportError:
    HAS_FIREWALL = False

try:
    from lead_store import LeadStore
    HAS_BOUNCE_DB = True
except ImportError:
    HAS_BOUNCE_DB = False

# ── Reddit search queries — trigger-aware ICP signals ───────────────────────
# Rotated each run: pipeline picks N random queries from this pool per run.
REDDIT_QUERY_POOL = [
    # Core buying-trigger queries (always included)
    {'q': 'roast my landing page', 'subreddits': ['SaaS', 'startups', 'Entrepreneur', 'RoastMyWebsite'], 'source': 'reddit_roast', 'weight': 3},
    {'q': 'landing page not converting', 'subreddits': ['PPC', 'Entrepreneur', 'SaaS'], 'source': 'reddit_ads_pain', 'weight': 3},
    {'q': 'ads no sales', 'subreddits': ['PPC', 'Entrepreneur', 'smallbusiness'], 'source': 'reddit_zero_sales', 'weight': 3},
    # Extended buying-trigger queries
    {'q': 'ad spend no conversions', 'subreddits': ['PPC', 'Entrepreneur', 'smallbusiness', 'FacebookAds'], 'source': 'reddit_ad_spend_waste', 'weight': 2},
    {'q': 'spent money on ads nothing', 'subreddits': ['PPC', 'startups', 'Entrepreneur'], 'source': 'reddit_ads_wasted', 'weight': 2},
    {'q': 'Facebook ads zero sales', 'subreddits': ['PPC', 'FacebookAds', 'Entrepreneur', 'smallbusiness'], 'source': 'reddit_fb_ads_zero', 'weight': 2},
    {'q': 'Google ads no conversions', 'subreddits': ['PPC', 'Entrepreneur', 'startups'], 'source': 'reddit_google_ads_zero', 'weight': 2},
    {'q': 'landing page feedback', 'subreddits': ['SaaS', 'startups', 'SideProject', 'indiehackers'], 'source': 'reddit_lp_feedback', 'weight': 2},
    {'q': 'review my landing page', 'subreddits': ['smallbusiness', 'Entrepreneur', 'RoastMyWebsite'], 'source': 'reddit_review_lp', 'weight': 2},
    {'q': 'roast my startup', 'subreddits': ['roastmystartup', 'startups', 'SaaS'], 'source': 'reddit_roast_startup', 'weight': 2},
    {'q': 'my site not converting', 'subreddits': ['SaaS', 'startups', 'smallbusiness', 'Entrepreneur'], 'source': 'reddit_site_not_conv', 'weight': 2},
    {'q': 'paid traffic no results', 'subreddits': ['PPC', 'Entrepreneur', 'smallbusiness'], 'source': 'reddit_traffic_no_results', 'weight': 2},
    {'q': 'getting clicks no sales', 'subreddits': ['PPC', 'Entrepreneur', 'SaaS', 'smallbusiness'], 'source': 'reddit_clicks_no_sales', 'weight': 2},
    # Lower volume but high-signal queries
    {'q': 'burning money on ads', 'subreddits': ['PPC', 'Entrepreneur', 'smallbusiness'], 'source': 'reddit_burning_money', 'weight': 1},
    {'q': 'conversion rate sucks', 'subreddits': ['PPC', 'Entrepreneur', 'SaaS'], 'source': 'reddit_cvr_sucks', 'weight': 1},
    {'q': 'wasting money on facebook ads', 'subreddits': ['PPC', 'FacebookAds', 'smallbusiness'], 'source': 'reddit_wasting_money_fb', 'weight': 1},
    {'q': 'ad account no conversions', 'subreddits': ['PPC', 'FacebookAds', 'Entrepreneur'], 'source': 'reddit_ad_account_zero', 'weight': 1},
    {'q': 'help my landing page', 'subreddits': ['SaaS', 'startups', 'Entrepreneur', 'indiehackers'], 'source': 'reddit_help_lp', 'weight': 1},
    {'q': 'traffic but no signups', 'subreddits': ['SaaS', 'startups', 'Entrepreneur', 'indiehackers'], 'source': 'reddit_traffic_no_signups', 'weight': 1},
    {'q': 'spent 1000 on ads nothing', 'subreddits': ['PPC', 'Entrepreneur', 'smallbusiness'], 'source': 'reddit_spent_1000', 'weight': 1},
    {'q': '0 sales after ads', 'subreddits': ['PPC', 'Entrepreneur', 'smallbusiness', 'SaaS'], 'source': 'reddit_zero_after_ads', 'weight': 1},
]
# Queries used per run: weight=3 always, weight=2 pick 2, weight=1 pick 2
REDDIT_QUERIES = None  # built at runtime by pick_reddit_queries()
APIFY_ACTOR = 'trudax~reddit-scraper-lite'  # ~ separator required in REST API URLs
APIFY_POLL_INTERVAL = 5
APIFY_MAX_WAIT = 15   # ~15s per query — fast-fail: if actor isn't done, next pipeline cycle catches it
MAX_POLL_SECONDS = 60  # hard ceiling — abort entire Reddit scrape after 60s total

# Google ICP query pool — rotated each run
GOOGLE_QUERY_POOL = [
    # Tier 1: DDG-friendly broad queries (always included)
    'roast my landing page reddit',
    'landing page not converting reddit',
    'ads no sales reddit',
    'getting clicks no sales reddit',
    # Tier 2: high-intent paid-traffic pain
    'facebook ads zero sales reddit',
    'google ads no conversions reddit',
    'ad spend no conversions reddit',
    'paid traffic no results reddit',
    'spent money on ads nothing reddit',
    'wasting money on facebook ads reddit',
    'traffic but no signups reddit',
    'ecommerce clicks no sales reddit',
    'shopify no sales after ads reddit',
    'conversion rate sucks reddit',
    # Tier 3: feedback / site-review sources
    'review my landing page reddit',
    'landing page feedback reddit',
    'roast my startup reddit',
    'help my landing page reddit',
    'website not converting reddit',
    'landing page bounce rate reddit',
    'roast my website reddit',
    'startup feedback landing page reddit',
    'PPC landing page advice reddit',
    'small business website not converting reddit',
]
# Subset chosen per run: tier1 always (4), tier2=4, tier3=2
GOOGLE_ICP_QUERIES = None
GOOGLE_ACTOR = None  # switched to local HTTP scraping (no Apify credits needed)
GOOGLE_DEDUP = BASE / 'google_scraped_urls.jsonl'


def pick_reddit_queries():
    """Pick a rotating subset of Reddit queries for this run."""
    import random
    always = [q for q in REDDIT_QUERY_POOL if q['weight'] == 3]
    weighted2 = [q for q in REDDIT_QUERY_POOL if q['weight'] == 2]
    weighted1 = [q for q in REDDIT_QUERY_POOL if q['weight'] == 1]
    
    # Pick 2 from weight=2 (or all if fewer)
    pick2 = random.sample(weighted2, min(2, len(weighted2)))
    # Pick 1 from weight=1 (or all if fewer)
    pick1 = random.sample(weighted1, min(1, len(weighted1)))
    
    result = always + pick2 + pick1
    random.shuffle(result)
    return result


def pick_google_queries():
    """Pick rotating subset of Google queries for this run.
    Tier 1 always runs. Tier 2 and 3 are sampled."""
    import random
    # First 4 are tier 1 (always)
    tier1 = GOOGLE_QUERY_POOL[:4]
    tier2 = GOOGLE_QUERY_POOL[4:14]
    tier3 = GOOGLE_QUERY_POOL[14:]
    
    pick2 = random.sample(tier2, min(4, len(tier2)))
    pick3 = random.sample(tier3, min(2, len(tier3)))
    
    return tier1 + pick2 + pick3


def load_apify_token():
    try:
        return APIFY_KEY_FILE.read_text().strip()
    except Exception as e:
        print(f'  [apify] Cannot read token: {e}')
        return None


def load_scraped_ids():
    """Dedup: post IDs already seen by the scraper."""
    if not REDDIT_DEDUP.exists():
        return set()
    ids = set()
    for line in REDDIT_DEDUP.read_text().splitlines():
        try:
            ids.add(json.loads(line)['id'])
        except Exception:
            pass
    return ids


def mark_scraped(post_id, url):
    with open(REDDIT_DEDUP, 'a') as f:
        f.write(json.dumps({'id': post_id, 'url': url, 'seen_at': datetime.now(timezone.utc).isoformat()}) + '\n')


# ── Reddit profile enrichment ──────────────────────────────────────────────────

def extract_reddit_username(post_url: str, username_field: str = '') -> str:
    """Extract username from post URL or the scraped username field."""
    if username_field and not username_field.startswith('['):
        return username_field
    # /r/u_USERNAME/ pattern (user personal subreddit)
    m = re.search(r'/r/u_([A-Za-z0-9_-]+)', post_url or '')
    if m:
        return m.group(1)
    # /user/USERNAME or /u/USERNAME pattern
    m = re.search(r'/u(?:ser)?[/_]([A-Za-z0-9_-]+)', post_url or '')
    return m.group(1) if m else ''


def get_reddit_user_website(username: str) -> str | None:
    """Fetch old.reddit.com user's personal subreddit page and extract any linked website from bio.

    The JSON API (about.json) now requires OAuth (HTTP 403), so we fall back to
    scraping the HTML of old.reddit.com which still works without authentication.
    The user's public description appears as the first markdown-rendered div (.md)
    on their personal subreddit page (/r/u_{username}/).
    """
    if not username or username.startswith('['):
        return None
    try:
        r = requests.get(
            f'https://old.reddit.com/r/u_{username}/',
            headers={'User-Agent': 'Mozilla/5.0 Nebula/1.0'},
            timeout=10
        )
        if not r.ok:
            return None

        # Find all markdown-rendered divs — the first one is the subreddit's
        # public_description (user bio). Subsequent ones are post/comment bodies.
        md_divs = re.findall(r'<div class="md">(.*?)</div>', r.text, re.DOTALL)
        if not md_divs:
            return None

        desc_html = md_divs[0]

        # Extract URLs from <a href="..."> tags (preserves link targets)
        urls = re.findall(r'<a href="(https?://[^"]+)"', desc_html)
        # Also find bare URLs in rendered text
        text = re.sub(r'<[^>]+>', ' ', desc_html)
        from html import unescape as html_unescape
        text = html_unescape(text)
        urls += re.findall(r'https?://[^\s\)\]"\'<>,]+', text)

        for u in urls:
            domain = urlparse(u).netloc.lower().replace('www.', '')
            if domain and 'reddit' not in domain and 'redd.it' not in domain:
                return u.rstrip('/')
        return None
    except Exception:
        return None


def enrich_reddit_profiles(posts: list) -> list:
    """For posts with no site_hint, hit poster's Reddit profile for website."""
    to_enrich = [p for p in posts if not p.get('site_hint')]
    if not to_enrich:
        return posts
    print(f'  [reddit-profile] Enriching {len(to_enrich)} posts via user profiles...')
    enriched = 0
    for p in to_enrich:
        username = extract_reddit_username(p.get('url', ''), p.get('reddit_username', ''))
        if not username:
            continue
        site = get_reddit_user_website(username)
        if site:
            p['site_hint'] = site
            p['site_hint_source'] = 'reddit_profile'
            enriched += 1
        time.sleep(0.5)  # be gentle with Reddit API
    print(f'  [reddit-profile] Enriched {enriched}/{len(to_enrich)} with site data')
    return posts


# ── PullPush.io Reddit source (free, no auth, high site_hint yield) ───────────
PULLPUSH_SUBS = [
    'RoastMyWebsite',   # explicit site URL required — highest yield
    'roastmystartup',
    'SideProject',
    'EntrepreneurRideAlong',
]
PULLPUSH_PAIN_KW = [
    'landing page', 'ads', 'converting', 'conversions', 'no sales',
    'traffic', 'paid ads', 'google ads', 'facebook ads', 'meta ads',
    'cro', 'bounce', 'roas', 'ad spend',
]
PULLPUSH_DEDUP = BASE / 'pullpush_scraped_ids.jsonl'

BLOCKED_DOMAINS = (
    'play.google.com', 'apps.apple.com', 'itunes.apple.com',
    'twitter.com', 'x.com', 'linkedin.com', 'facebook.com',
    'instagram.com', 'youtube.com', 'reddit.com', 'redd.it', 'redditstatic.com', 'redditmedia.com',
    'github.com', 'medium.com', 'notion.so', 'docs.google.com',
    'sheets.google.com', 'drive.google.com', 'imgur.com', 'i.redd.it',
    'preview.redd.it', 't.co', 'w3.org', 'schema.org',
    # News / media — not landing pages
    'nypost.com', 'nytimes.com', 'washingtonpost.com', 'cnn.com',
    'bbc.com', 'bbc.co.uk', 'theguardian.com', 'forbes.com',
    'techcrunch.com', 'businessinsider.com', 'bloomberg.com',
    'reuters.com', 'apnews.com', 'npr.org', 'nbcnews.com',
    'foxnews.com', 'msn.com', 'yahoo.com', 'huffpost.com',
)


def load_pullpush_seen() -> set:
    if not PULLPUSH_DEDUP.exists():
        return set()
    ids = set()
    for line in PULLPUSH_DEDUP.read_text().splitlines():
        try:
            ids.add(json.loads(line)['id'])
        except Exception:
            pass
    return ids


def mark_pullpush_seen(post_id: str):
    with open(PULLPUSH_DEDUP, 'a') as f:
        f.write(json.dumps({'id': post_id, 'seen_at': datetime.now(timezone.utc).isoformat()}) + '\n')


def scrape_pullpush(limit_per_sub: int = 25) -> list:
    """Scrape Reddit posts via pullpush.io — free, no auth.
    Focuses on subreddits where OP includes their site URL.
    Returns posts where site_hint is extractable from body.
    """
    import re as _re
    seen = load_pullpush_seen()
    leads = []

    for sub in PULLPUSH_SUBS:
        try:
            r = requests.get(
                f'https://api.pullpush.io/reddit/search/submission/?subreddit={sub}&size={limit_per_sub}&sort=desc',
                headers={'User-Agent': 'Mozilla/5.0 Nebula/1.0'},
                timeout=12,
            )
            if not r.ok:
                print(f'  [pullpush] r/{sub}: HTTP {r.status_code}')
                continue
            posts = r.json().get('data', [])
            for p in posts:
                pid = p.get('id', '')
                if pid in seen:
                    continue
                body = (p.get('selftext') or '') + ' ' + (p.get('url') or '')
                title = p.get('title', '')
                combined = (body + ' ' + title).lower()
                # ICP gate: must mention pain keywords
                if not any(kw in combined for kw in PULLPUSH_PAIN_KW):
                    # For RoastMyWebsite, relax — any post is relevant
                    if sub != 'RoastMyWebsite':
                        continue
                # Extract site URL
                site_hint = None
                for u in _re.findall(r'https?://[^\s\)\]"\'<>,]+', body):
                    u = u.rstrip('.,)')
                    domain = urlparse(u).netloc.lower().replace('www.', '')
                    if domain and not any(
                        domain == bd or domain.endswith('.' + bd) for bd in BLOCKED_DOMAINS
                    ):
                        site_hint = normalize_site(u)
                        break
                if not site_hint:
                    continue  # no site = can't audit
                leads.append({
                    'source': f'pullpush_r_{sub}',
                    'trigger': title[:120],
                    'url': f'https://reddit.com/r/{sub}/comments/{pid}/',
                    'site_hint': site_hint,
                    'reddit_username': p.get('author', ''),
                    'post_id': pid,
                    'scraped_at': datetime.now(timezone.utc).isoformat(),
                })
                mark_pullpush_seen(pid)
        except Exception as e:
            print(f'  [pullpush] r/{sub} error: {e}')
            continue

    print(f'  [pullpush] {len(leads)} new leads with site_hint')
    return leads



def load_google_seen() -> set:
    if not GOOGLE_DEDUP.exists():
        return set()
    urls = set()
    for line in GOOGLE_DEDUP.read_text().splitlines():
        try:
            urls.add(json.loads(line)['url'])
        except Exception:
            pass
    return urls


def mark_google_seen(url: str):
    with open(GOOGLE_DEDUP, 'a') as f:
        f.write(json.dumps({'url': url, 'seen_at': datetime.now(timezone.utc).isoformat()}) + '\n')


def scrape_icp_via_google(token: str = None) -> list:
    """DuckDuckGo search → Reddit ICP posts (no API key needed).
    
    Uses duckduckgo_search (ddgs) library — free, no rate limits at modest volume.
    Falls back to requests-based DDG HTML scrape if library unavailable.
    """
    from ddgs.ddgs import DDGS
    
    # Rotate queries for this run
    queries = pick_google_queries()
    print(f'  [search] {len(queries)} queries (rotated from pool of {len(GOOGLE_QUERY_POOL)})')
    seen_urls = load_google_seen()
    reddit_urls = []

    with DDGS(timeout=10) as ddgs:
        for q in queries:
            try:
                results = list(ddgs.text(q, max_results=10))
                for r in results:
                    href = r.get('href', '')
                    if '/comments/' in href and href not in seen_urls:
                        reddit_urls.append({'url': href, 'title': r.get('title', '')})
                        seen_urls.add(href)
            except Exception as e:
                print(f'  [search] Error querying "{q[:40]}": {e}')
                continue
    
    print(f'  [search] Found {len(reddit_urls)} new Reddit post URLs')
    # Now scrape each Reddit post URL for username + site_hint
    if not reddit_urls:
        return []

    # Step 2: Scrape each Reddit/IH/PH URL for username + body
    posts = []
    for entry in reddit_urls[:15]:  # cap at 15 posts per run
        url = entry['url']
        title = entry['title']
        try:
            # Indie Hackers: site URL is in the IH post URL or description — no actor needed
            if 'indiehackers.com' in url:
                # IH post pages list the founder's product; extract from Google snippet
                snippet_site = entry.get('site_hint')
                posts.append({
                    'source': 'google_ih',
                    'trigger': title[:120],
                    'url': url,
                    'site_hint': snippet_site,
                    'reddit_username': '',
                    'post_id': url,
                    'scraped_at': datetime.now(timezone.utc).isoformat(),
                })
                mark_google_seen(url)
                continue

            # Product Hunt: result URLs often contain the product URL directly
            if 'producthunt.com' in url:
                posts.append({
                    'source': 'google_ph',
                    'trigger': title[:120],
                    'url': url,
                    'site_hint': None,  # will try web scrape in enrich step
                    'reddit_username': '',
                    'post_id': url,
                    'scraped_at': datetime.now(timezone.utc).isoformat(),
                })
                mark_google_seen(url)
                continue

            # Reddit: extract username from URL if possible, otherwise use Reddit JSON API (fast)
            username = extract_reddit_username(url)
            body = ''
            site_hint = None
            # Try Reddit JSON API (fast, free, no Apify needed)
            try:
                rj = requests.get(
                    f'{url.rstrip("/")}.json',
                    headers={'User-Agent': 'Mozilla/5.0 Nebula/1.0'},
                    timeout=10
                )
                if rj.ok:
                    rjdata = rj.json()
                    post_data = rjdata[0]['data']['children'][0]['data'] if isinstance(rjdata, list) else {}
                    username = post_data.get('author', username)
                    body = post_data.get('selftext', '')
                    is_self = post_data.get('is_self', True)
                    # Extract URLs from body (text posts: URL embedded in selftext)
                    for u in re.findall(r'https?://[^\s\)\]"\'<>,]+', body):
                        domain = urlparse(u).netloc.lower().replace('www.', '')
                        if domain and 'reddit' not in domain and 'redd.it' not in domain and 'preview.' not in domain:
                            site_hint = u.rstrip('/')
                            break
                    # For link posts (roast my website): URL is the post link itself
                    if not site_hint and not is_self:
                        external_url = post_data.get('url', '')
                        ext_domain = urlparse(external_url).netloc.lower().replace('www.', '')
                        if external_url and ext_domain and 'reddit' not in ext_domain:
                            site_hint = external_url.rstrip('/')
            except Exception:
                pass

            # Reddit JSON is often 403/empty. old.reddit HTML still exposes outbound links in the post thing.
            if not site_hint:
                try:
                    from bs4 import BeautifulSoup
                    old_url = url.replace('www.reddit.com', 'old.reddit.com')
                    rh = requests.get(old_url, headers=UA, timeout=12)
                    if rh.ok and rh.text:
                        soup = BeautifulSoup(rh.text, 'lxml')
                        thing = soup.select_one('div.thing.link')
                        if thing:
                            username = username or thing.get('data-author', '')
                            title = title or (thing.select_one('a.title').get_text(' ', strip=True) if thing.select_one('a.title') else '')
                            expando = thing.select_one('div.expando')
                            if expando:
                                body = expando.get_text(' ', strip=True)
                            for a in thing.select('a[href]'):
                                u = a.get('href', '')
                                if not u.startswith('http'):
                                    continue
                                domain = urlparse(u).netloc.lower().replace('www.', '')
                                path = urlparse(u).path.lower()
                                if path.endswith(('.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.ico', '.svg', '.webp')):
                                    continue
                                if domain and not any(domain == bd or domain.endswith('.' + bd) for bd in BLOCKED_DOMAINS):
                                    site_hint = u.rstrip('/')
                                    break
                except Exception:
                    pass

            posts.append({
                'source': 'google_reddit',
                'trigger': title[:120],
                'url': url,
                'site_hint': site_hint,
                'reddit_username': username,
                'body_snippet': body[:300],
                'scraped_at': datetime.now(timezone.utc).isoformat(),
                'post_id': url,
            })
            mark_google_seen(url)
            time.sleep(1)
        except Exception as e:
            print(f'  [google-reddit] Error scraping {url[:60]}: {e}')
            continue

    print(f'  [google-reddit] Scraped {len(posts)} posts')
    return posts




def scrape_reddit_live(token: str) -> list:
    """Run Apify reddit scraper for each query, return flat list of posts."""
    import time as _time
    queries = pick_reddit_queries()
    print(f'  [reddit] {len(queries)} queries (rotated from pool of {len(REDDIT_QUERY_POOL)})')
    api = 'https://api.apify.com/v2'
    headers = {'Authorization': f'Bearer {token}', 'Content-Type': 'application/json'}
    seen_ids = load_scraped_ids()
    posts = []
    scraper_failures = 0  # circuit breaker counter

    for q_config in queries:
        query = q_config['q']
        source = q_config['source']
        subreddits = q_config['subreddits']

        # Build Reddit search URLs for each subreddit
        start_urls = []
        for sub in subreddits:
            encoded_q = query.replace(' ', '+')
            start_urls.append({
                'url': f'https://www.reddit.com/r/{sub}/search/?q={encoded_q}&sort=new&t=week'
            })

        payload = {
            'startUrls': start_urls,
            'maxItems': 5,  # small batch — speed over volume, pipeline runs every 2h
        }

        try:
            _run_start = _time.time()
            r = requests.post(
                f'{api}/acts/{APIFY_ACTOR}/runs?waitForFinish={APIFY_MAX_WAIT}',
                json=payload, headers=headers, timeout=APIFY_MAX_WAIT + 10
            )
            if _time.time() - _run_start > MAX_POLL_SECONDS:
                print(f'  [apify] {query}: exceeded MAX_POLL_SECONDS={MAX_POLL_SECONDS}, skipping')
                scraper_failures += 1
                if scraper_failures >= len(queries):
                    print('  [circuit-breaker] All scrapers failed — aborting scrape_reddit_live')
                    break
                continue
            if not r.ok:
                print(f'  [apify] {query}: HTTP {r.status_code}')
                scraper_failures += 1
                if scraper_failures >= len(queries):
                    print('  [circuit-breaker] All scrapers failed — aborting scrape_reddit_live')
                    break
                continue

            run = r.json().get('data', {})
            dataset_id = run.get('defaultDatasetId')
            if not dataset_id:
                print(f'  [apify] {query}: no dataset returned')
                continue

            items_r = requests.get(
                f'{api}/datasets/{dataset_id}/items?clean=true&limit=50',
                headers=headers, timeout=30
            )
            if not items_r.ok:
                continue

            items = items_r.json()
            for item in (items if isinstance(items, list) else []):
                post_id = item.get('id') or item.get('postId') or ''
                url = item.get('url') or item.get('link') or ''
                title = item.get('title', '')
                body = item.get('body') or item.get('selftext', '')
                reddit_username = item.get('username') or item.get('author') or ''
                # Extract URLs mentioned in title+body as site_hints
                all_text = f'{title} {body}'
                urls_in_text = re.findall(r'https?://[^\s\)\]"\'<>,]+', all_text)
                site_hint = None
                for u in urls_in_text:
                    domain = urlparse(u).netloc.lower().replace('www.', '')
                    if domain and not any(
                        domain == bd or domain.endswith('.' + bd) for bd in BLOCKED_DOMAINS
                    ):
                        site_hint = normalize_site(u)
                        break

                if post_id in seen_ids:
                    continue

                # ICP relevance gate — must contain founder pain keywords
                ICP_KW = ['landing page', 'ads', 'converting', 'conversions', 'no sales',
                          'paid traffic', 'google ads', 'facebook ads', 'meta ads',
                          'cro', 'bounce', 'roas', 'ad spend', 'not converting',
                          'roast my', 'feedback on my', 'review my']
                combined = (title + ' ' + body).lower()
                if not any(kw in combined for kw in ICP_KW):
                    continue

                posts.append({
                    'source': source,
                    'trigger': title[:120],
                    'url': url,
                    'site_hint': site_hint,
                    'post_id': post_id,
                    'reddit_username': reddit_username,
                    'body_snippet': body[:300],
                    'scraped_at': datetime.now(timezone.utc).isoformat(),
                })
                mark_scraped(post_id, url)

            print(f'  [reddit] "{query}": {len(items)} posts, {sum(1 for p in posts if p["source"] == source)} new')
            time.sleep(1)  # Rate limit between queries

        except Exception as e:
            print(f'  [apify] {query}: {e}')
            continue

    print(f'  [reddit] Total new posts this run: {len(posts)}')
    return posts
BAD=('example','schema','sentry','w3.org','google','twitter','noreply','user@','test@','email@','your@','placeholder','yourname','john@company','company@','hello@example','email@domain','name@','owner@','webmaster@','png','jpg','jpeg','svg','ico')
UA={'User-Agent':'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/124 Safari/537.36'}
MAX_RETRIES = 3

def normalize_site(u):
    if not u: return None
    if not u.startswith('http'): u='https://'+u
    # Filter out non-landing-page URLs (app stores, social platforms, news, etc.)
    domain = urlparse(u).netloc.lower().replace('www.', '')
    if not domain:
        return None
    if any(domain == h or domain.endswith('.' + h) for h in BLOCKED_DOMAINS):
        return None
    return u.rstrip('/')

def find_email(site):
    if not site: return None, []
    found=[]
    root=normalize_site(site)
    paths=['','/contact','/about','/privacy','/terms','/support','/imprint']
    for path in paths:
        try:
            r=requests.get(root+path,headers=UA,timeout=10,allow_redirects=True)
            if not r.ok or not r.text: continue
            emails=re.findall(r'\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b', r.text)
            dom=urlparse(r.url).netloc.lower().replace('www.','')
            for e in emails:
                e=e.strip('.,;:)').lower()
                if any(b in e for b in BAD): continue
                if dom.split(':')[0] in e.split('@')[-1] or e.startswith(('hello@','support@','contact@','founder@','team@','info@')):
                    if e not in found: found.append(e)
        except Exception:
            pass
    return (found[0] if found else None), found

def load_contacted():
    p=BASE/'contacted.json'
    try: raw=json.loads(p.read_text())
    except Exception: return set()
    if isinstance(raw,dict): return {k.lower() for k in raw.keys()}
    return {x.get('email','').lower() for x in raw if isinstance(x,dict)}

def already_audited(email):
    if not email: return False
    p=BASE/'audit_leads.jsonl'
    if not p.exists(): return False
    return email.lower() in p.read_text().lower()

RETRY_FILE = BASE / 'ramp_retries.json'

def load_agentmail_key():
    """Read AgentMail SMTP key from secure file — avoids env-var dependency in cron."""
    try:
        return KEY_FILE.read_text().strip()
    except Exception as e:
        print(f"ERROR: Cannot read AgentMail key from {KEY_FILE}: {e}")
        return None

def load_retries():
    """Persistent retry counter: {(site, email): count}."""
    try:
        return json.loads(RETRY_FILE.read_text())
    except Exception:
        return {}

def save_retries(retries):
    RETRY_FILE.write_text(json.dumps(retries, indent=2))

def increment_retry(site, email, retries):
    """Add one to retry counter for this prospect and persist."""
    key = f"{site}|{email}"
    retries[key] = retries.get(key, 0) + 1
    save_retries(retries)
    return retries[key]

def get_retry_count(site, email, retries):
    key = f"{site}|{email}"
    return retries.get(key, 0)

def retry_key_exists(site, email, retries):
    key = f"{site}|{email}"
    return key in retries

def append_jsonl(path,obj):
    with open(path,'a') as f: f.write(json.dumps(obj,ensure_ascii=False)+"\n")

def main():
    api_key = load_agentmail_key()
    if not api_key:
        print('FATAL: Cannot run without AgentMail API key')
        sys.exit(1)

    apify_token = load_apify_token()
    if not apify_token:
        print('FATAL: No Apify token, aborting all sources')
        sys.exit(1)

    # ── Source 1: DuckDuckGo Search → Reddit ICP posts (highest yield, run first) ─
    print('── Source 1: Search → Reddit ICP ──')
    google_posts = scrape_icp_via_google()  # no Apify token needed — uses direct HTTP
    if google_posts:
        google_posts = enrich_reddit_profiles(google_posts)

    # ── Source 2: Reddit posts via Apify (supplemental) ───────────────────────
    print('── Source 2: Reddit posts ──')
    reddit_posts = scrape_reddit_live(apify_token)
    if reddit_posts:
        reddit_posts = enrich_reddit_profiles(reddit_posts)

    # ── Source 3: PullPush.io — high-yield site_hint from RoastMyWebsite etc ──
    pullpush_posts = scrape_pullpush()

    all_posts = (reddit_posts or []) + (pullpush_posts or []) + (google_posts or [])

    if not all_posts:
        print('No new candidates from any source — pipeline done')
        return

    print(f'── Total candidates: {len(all_posts)} (reddit={len(reddit_posts)}, pullpush={len(pullpush_posts)}, google_reddit={len(google_posts)}) ──')
    contacted=load_contacted()
    sent=[]; queued=[]; skipped=[]; error=[]
    for c in all_posts:
        site=normalize_site(c.get('site_hint'))
        email, all_emails=find_email(site) if site else (None,[])
        rec={**c,'site':site,'email':email,'emails':all_emails,'checked_at':datetime.now(timezone.utc).isoformat()}
        if not site:
            rec['status']='needs_site_extraction'; queued.append(rec); continue
        if not email:
            rec['status']='site_found_no_email'; queued.append(rec); continue
        # Skip hard-bounced emails
        if HAS_BOUNCE_DB:
            try:
                db = LeadStore()
                if db.is_bounced(email):
                    rec['status'] = 'skipped_bounced'
                    rec['reason'] = 'Email hard-bounced in lead store'
                    skipped.append(rec)
                    print(f"  BOUNCED {email} ({site}) — skipped")
                    continue
            except Exception as be:
                print(f"  [BOUNCE CHECK ERROR] {be}")
        if email in contacted or already_audited(email):
            rec['status']='skipped_duplicate'; skipped.append(rec); continue

        # Dedup guard: skip if this Reddit post URL already processed
        if HAS_BOUNCE_DB:
            try:
                db = LeadStore()
                existing = db.get_lead(email)
                if existing and existing.get('stage') in ('contacted', 'audit_delivered', 'pitch_sent', 'paid'):
                    rec['status'] = 'skipped_duplicate_db'
                    rec['reason'] = f"Lead already in DB at stage={existing['stage']}"
                    skipped.append(rec)
                    print(f"  DB-DEDUP {email} ({site}) — already at stage={existing['stage']}")
                    continue
            except Exception as de:
                print(f"  [DB DEDUP ERROR] {de}")

        # Check retry count — stop hammering failed prospects
        retries = load_retries()
        retry_count = get_retry_count(site, email, retries)
        if retry_count >= MAX_RETRIES:
            rec['status'] = 'max_retries_exceeded'
            rec['retry_count'] = retry_count
            rec['reason'] = f'Delivery failed {retry_count} times; max is {MAX_RETRIES}'
            queued.append(rec)
            # Dead letter: prospect permanently stalled
            append_jsonl(DEAD_LETTER, {'timestamp':datetime.now(timezone.utc).isoformat(),'site':site,'email':email,'reason':rec['reason'],'retry_count':retry_count,'source':'ramp_pipeline_fill'})
            print(f"  MAX_RETRIES {email} ({site}) — {retry_count} failures, skipping")
            continue

        # Content Firewall — block synthetic / vendor-camouflage content
        post_text = f"{c.get('title', '')} {c.get('body', '')} {c.get('selftext', '')}"
        fw_result = filter_lead(post_text, url=c.get('url', ''), min_score=FIREWALL_MIN_SCORE) if HAS_FIREWALL else {'passed': True, 'score': 100}
        rec['firewall_score'] = fw_result.get('score', 100)
        rec['firewall_verdict'] = fw_result.get('verdict', 'human')
        if not fw_result.get('passed', True):
            rec['status'] = 'firewall_blocked'
            rec['reason'] = f"Content firewall blocked — score={fw_result['score']}/100 ({fw_result['verdict']}), violations: {[v['type'] for v in fw_result.get('violations', [])]}"
            queued.append(rec)
            append_jsonl(FIREWALL_LOG, {'timestamp':datetime.now(timezone.utc).isoformat(),'url':c.get('url',''),'site':site,'email':email,'score':fw_result['score'],'verdict':fw_result['verdict'],'violations':[v['type'] for v in fw_result.get('violations', [])],'trigger':c.get('trigger','')[:80],'source':'ramp_pipeline_fill'})
            print(f"  FIREWALL-BLOCKED {rec.get('email','?')} ({rec.get('site','?')}) — score={fw_result['score']}/100, verdict={fw_result['verdict']}")
            continue

        # ICP Quality Gate — skip non-buying-trigger leads
        if ICP_GATE_ENABLED:
            # Skip test emails — they inflate stuck-lead detection
            email_lower = (email or '').lower()
            if email_lower in TEST_EMAILS:
                rec['status'] = 'icp_filtered'
                rec['reason'] = 'Test/sandbox email — excluded from outreach'
                queued.append(rec)
                print(f"  ICP-FILTERED {email} ({site}) — test email excluded")
                continue

            # Score the post content for buying trigger signals
            icp_passed, icp_reason = check_icp_fit(post_text, c.get('source', ''))
            rec['icp_result'] = icp_reason
            if not icp_passed:
                rec['status'] = 'icp_filtered'
                rec['reason'] = f"ICP gate: {icp_reason}"
                rec['icp_passed'] = False
                queued.append(rec)
                print(f"  ICP-FILTERED {email} ({site}) — {icp_reason}")
                continue
            rec['icp_passed'] = True

        cmd=[
            '/home/mike/nebula/venv/bin/python3',
            '/home/mike/nebula/deliver_audit.py',
            site,
            email,
            '--trigger-context',
            f"Saw your public post: {c['trigger']}",
            '--content-firewall-score',
            str(rec.get('firewall_score', 100)),
            '--source-url',
            c.get('url', ''),
        ]
        # Inject AGENTMAIL_API_KEY into subprocess env — cron doesn't have it
        sub_env = {**os.environ, 'AGENTMAIL_API_KEY': api_key}
        res=subprocess.run(cmd, capture_output=True, text=True, timeout=160, env=sub_env)
        rec['deliver_exit']=res.returncode
        rec['deliver_stdout']=res.stdout[-800:]
        rec['deliver_stderr']=res.stderr[-400:]

        # Check for real success: exit 0 + "Sent" or "✅" in stdout + no error keyword
        stdout_lower = res.stdout.lower()
        stderr_lower = res.stderr.lower()
        has_error_keyword = ('error' in stdout_lower and 'agentmail_api_key' in stdout_lower) \
                            or 'traceback' in stderr_lower \
                            or 'error' in stderr_lower
        has_success_keyword = '✅ sent' in stdout_lower or 'sent to' in stdout_lower

        if res.returncode == 0 and not has_error_keyword and has_success_keyword:
            rec['status']='audit_sent'
            sent.append(rec)
            append_jsonl(BASE/'outreach_evidence.jsonl',{
              'timestamp':datetime.now(timezone.utc).isoformat(),'action':'ramp_audit_sent','prospect':urlparse(site).netloc,'url':site,'contact':email,'trigger':c['trigger'],'source_url':c['url'],'status':'sent','evidence':res.stdout[-500:]})
        else:
            rec['status']='delivery_failed'
            if has_error_keyword:
                rec['fail_reason'] = 'agentmail_key_error' if 'agentmail_api_key' in stdout_lower else 'subprocess_error'
            else:
                rec['fail_reason'] = 'deliver_script_failure'
            increment_retry(site, email, retries)
            new_count = get_retry_count(site, email, retries)
            if new_count >= MAX_RETRIES:
                append_jsonl(DEAD_LETTER, {'timestamp':datetime.now(timezone.utc).isoformat(),'site':site,'email':email,'reason':f'Delivery just failed for the {new_count}th time; max is {MAX_RETRIES}','retry_count':new_count,'source':'ramp_pipeline_fill','last_error':rec.get('fail_reason')})
            queued.append(rec)
        time.sleep(2)

    out={'timestamp':datetime.now(timezone.utc).isoformat(),'sent':sent,'queued':queued,'skipped':skipped,'counts':{'sent':len(sent),'queued':len(queued),'skipped':len(skipped)}}
    (BASE/'ramp_pipeline_report.json').write_text(json.dumps(out,indent=2,ensure_ascii=False))
    print(json.dumps(out['counts'],indent=2))
    for x in sent: print('SENT',x['email'],x['site'])
    for x in queued[:20]: print('QUEUE',x.get('status'),x.get('site'),x.get('email'))
    for x in skipped[:5]: print('SKIP',x.get('status'),x.get('email'))

    # ── Competitor probe ─────────────────────────────────────────────────────
    _run_competitor_probe()


def _run_competitor_probe():
    """Scan pipeline output for competitor mentions and log them."""
    try:
        from competitor_probe import scan_lead_file, append_outreach_log
        trigger_file = BASE / 'trigger_leads.jsonl'
        if trigger_file.exists():
            matches = scan_lead_file(trigger_file)
            if matches:
                append_outreach_log(matches)
                print(f'  [competitor-probe] {len(matches)} post(s) with competitor mentions logged')
            else:
                print('  [competitor-probe] No competitor mentions in this cycle')
    except ImportError:
        print('  [competitor-probe] Skipped (competitor_probe.py not found)')
    except Exception as e:
        print(f'  [competitor-probe] Error: {e}')


if __name__=='__main__': main()
