#!/usr/bin/env python3
"""
signal_scrapers.py — Always-on buying signal scrapers for Nebula Components.

Five signals, each independent:
  1. hiring_signal()     — companies posting paid-media/marketing roles (buying intent)
  2. job_change()        — contacts moving companies (urgency window)
  3. competitor_launch() — Zamp/Oxygen shipping features (counter-position fast)
  4. review_gaps()       — 1-3 star G2 reviews of competitors (pitch copy ammo)
  5. event_intel()       — DTC/ecom conference attendee/speaker lists (trigger list)

Each function:
  - Runs Apify actor via REST API
  - Scores/filters results for Nebula ICP relevance
  - Writes qualified leads/insights to signal_leads.jsonl + signal_insights.jsonl
  - Dedupes against lead_state.db (no re-contacting)
  - Returns count of new items found
"""

import json, os, re, sys, time, hashlib
from datetime import datetime, timezone
from pathlib import Path
import requests

BASE = Path('/home/mike/nebula')
sys.path.insert(0, str(BASE))

from lead_store import LeadStore
from source_outcomes import SourceOutcome, classify_http_status, record_outcome

# ── Config ────────────────────────────────────────────────────────────────────
try:
    APIFY_KEY = (Path.home() / '.hermes/secrets/apify.key').read_text().strip()
except FileNotFoundError:
    APIFY_KEY = os.environ.get('APIFY_TOKEN', '')
    if not APIFY_KEY:
        import logging as _l; _l.warning('signal_scrapers: apify.key missing and APIFY_TOKEN not set — Apify signals will be skipped')
APIFY_BASE = 'https://api.apify.com/v2'
HEADERS = {'Authorization': f'Bearer {APIFY_KEY}', 'Content-Type': 'application/json'}

SIGNAL_LEADS_FILE    = BASE / 'signal_leads.jsonl'
SIGNAL_INSIGHTS_FILE = BASE / 'signal_insights.jsonl'
DEDUP_FILE           = BASE / 'signal_dedup.jsonl'
SOURCE_OUTCOMES_FILE = BASE / 'source_outcomes.jsonl'

# Competitors to monitor
COMPETITORS = {
    'zamp':   {'g2_url': 'https://www.g2.com/products/zamp/reviews', 'domain': 'zamp.com'},
    'oxygen': {'g2_url': 'https://www.g2.com/products/oxygen/reviews', 'domain': 'oxygenapp.com'},
}

# Job titles that signal active ad spend scaling
HIRING_TRIGGERS = [
    'paid media manager', 'performance marketing manager',
    'paid acquisition', 'growth marketer', 'paid social manager',
    'digital advertising manager', 'ppc manager', 'sem manager',
    'demand generation manager', 'performance marketing lead',
    'head of growth', 'vp marketing', 'director of marketing',
]

# DTC / ecom events worth scraping
TARGET_EVENTS = [
    'traffic and conversion summit',
    'ecommerce expo',
    'dtc world congress',
    'ecom world',
    'irce',
    'shoptalk',
    'grow your store',
    'blue ribbon mastermind',
]

# ── Helpers ───────────────────────────────────────────────────────────────────

def _load_env():
    env_path = Path.home() / '.hermes/.env'
    if env_path.exists():
        for line in env_path.read_text().splitlines():
            if '=' in line and not line.startswith('#'):
                k, v = line.split('=', 1)
                os.environ.setdefault(k.strip(), v.strip())

def _load_dedup() -> set:
    if not DEDUP_FILE.exists():
        return set()
    seen = set()
    for line in DEDUP_FILE.read_text().splitlines():
        try:
            seen.add(json.loads(line)['key'])
        except Exception:
            pass
    return seen

def _mark_dedup(key: str):
    with open(DEDUP_FILE, 'a') as f:
        f.write(json.dumps({'key': key, 'ts': _now()}) + '\n')

def _now() -> str:
    return datetime.now(timezone.utc).isoformat()

def _save_lead(record: dict):
    with open(SIGNAL_LEADS_FILE, 'a') as f:
        f.write(json.dumps(record) + '\n')

def _save_insight(record: dict):
    with open(SIGNAL_INSIGHTS_FILE, 'a') as f:
        f.write(json.dumps(record) + '\n')

def _run_actor(actor_id: str, input_data: dict, timeout_secs: int = 120) -> list:
    """Run an Apify actor synchronously and return items list."""
    url = f'{APIFY_BASE}/acts/{actor_id.replace("/", "~")}/run-sync-get-dataset-items'
    params = {'timeout': timeout_secs, 'memory': 256}
    source = f'apify:{actor_id}'
    try:
        resp = requests.post(url, headers=HEADERS, json=input_data, params=params, timeout=timeout_secs + 30)
        if resp.status_code == 200:
            payload = resp.json()
            items = payload if isinstance(payload, list) else payload.get('items', [])
            record_outcome(SOURCE_OUTCOMES_FILE, SourceOutcome(
                source=source,
                state=classify_http_status(resp.status_code, len(items)),
                items_returned=len(items),
            ))
            return items
        record_outcome(SOURCE_OUTCOMES_FILE, SourceOutcome(
            source=source,
            state=classify_http_status(resp.status_code),
            detail=f'HTTP {resp.status_code}: {resp.text[:200]}',
        ))
        print(f'  [apify] {actor_id} returned {resp.status_code}: {resp.text[:200]}')
        return []
    except requests.Timeout as e:
        record_outcome(SOURCE_OUTCOMES_FILE, SourceOutcome(
            source=source, state='timeout', detail=str(e),
        ))
        print(f'  [apify] {actor_id} error: {e}')
        return []
    except Exception as e:
        record_outcome(SOURCE_OUTCOMES_FILE, SourceOutcome(
            source=source, state='unreachable', detail=str(e),
        ))
        print(f'  [apify] {actor_id} error: {e}')
        return []

def _is_already_contacted(email: str) -> bool:
    if not email:
        return False
    store = LeadStore()
    lead = store.get_lead(email)
    return lead is not None

def _extract_domain(url: str) -> str:
    if not url:
        return ''
    try:
        from urllib.parse import urlparse
        return urlparse(url).netloc.replace('www.', '')
    except Exception:
        return url

def _enrich_contact(domain: str) -> dict:
    """Use Apify contact-info-scraper to get emails/phone from a domain."""
    try:
        items = _run_actor('vdrmota/contact-info-scraper', {
            'startUrls': [{'url': f'https://{domain}'}],
            'maxDepth': 1,
            'maxPages': 3,
        }, timeout_secs=60)
        if not items:
            return {}
        item = items[0] if isinstance(items, list) else items
        emails = item.get('emails', [])
        phones = item.get('phones', [])
        return {
            'email': emails[0] if emails else '',
            'emails': emails,
            'phone': phones[0] if phones else '',
        }
    except Exception as e:
        print(f'    [enrich] {domain}: {e}')
        return {}

# ── Signal 1: Hiring Signal ───────────────────────────────────────────────────

def hiring_signal(max_jobs: int = 50) -> int:
    """
    Find companies posting paid-media/growth roles on LinkedIn.
    These companies are actively scaling ad spend = core ICP trigger.
    Returns count of new qualified leads added.
    """
    print('\n[Signal 1] Hiring signal scrape...')
    seen = _load_dedup()
    store = LeadStore()
    new_count = 0

    for title in HIRING_TRIGGERS[:5]:  # top 5 most relevant titles
        print(f'  Searching: "{title}"')
        # Build LinkedIn Jobs search URL and pass it as the actor expects
        li_url = f"https://www.linkedin.com/jobs/search/?keywords={title.replace(' ', '%20')}&location=United%20States&f_TPR=r604800"
        items = _run_actor('curious_coder/linkedin-jobs-scraper', {
            'urls': [li_url],
            'maxJobs': max_jobs // 5,
        }, timeout_secs=90)

        for item in items:
            company = item.get('companyName', '') or item.get('company', '')
            company_url = item.get('companyUrl', '') or item.get('companyLinkedinUrl', '')
            job_title = item.get('title', '') or item.get('jobTitle', '')
            location = item.get('location', '')
            posted_at = item.get('postedAt', '') or item.get('datePosted', '')

            if not company:
                continue

            dedup_key = hashlib.md5(f'{company}:{job_title}'.lower().encode()).hexdigest()
            if dedup_key in seen:
                continue

            # Score relevance: company size filter (skip enterprises)
            emp_count = item.get('employeeCount', 0) or item.get('companySize', 0) or 0
            if isinstance(emp_count, str):
                # Parse ranges like "11-50"
                nums = re.findall(r'\d+', emp_count)
                emp_count = int(nums[0]) if nums else 0
            if emp_count > 500:  # Skip large corps
                continue

            record = {
                'signal': 'hiring_trigger',
                'company': company,
                'company_url': company_url,
                'job_title': job_title,
                'location': location,
                'posted_at': posted_at,
                'trigger_reason': f'Hiring {job_title} = actively scaling paid media',
                'icp_score': 8,
                'scraped_at': _now(),
                'status': 'new',
            }

            # Enrich: extract contact email from company domain
            domain = _extract_domain(company_url) if company_url else ''
            if domain:
                contact = _enrich_contact(domain)
                if contact.get('email'):
                    record['email'] = contact['email']
                    record['contact_emails'] = contact.get('emails', [])
                    record['contact_phone'] = contact.get('phone', '')

            _save_lead(record)
            _mark_dedup(dedup_key)
            seen.add(dedup_key)
            new_count += 1
            email_found = f" → {record['email']}" if record.get('email') else ''
            print(f'    + {company} hiring {job_title}{email_found}')

    print(f'  [Signal 1] {new_count} new hiring signals')
    return new_count


# ── Signal 2: Job-Change Triggers ─────────────────────────────────────────────

def job_change(profile_urls: list = None) -> int:
    """
    Monitor LinkedIn profiles of previously-contacted leads for company changes.
    When someone moves to a new company, they inherit a broken page + need to prove ROI.
    Returns count of job-change events detected.
    """
    print('\n[Signal 2] Job-change detection...')
    seen = _load_dedup()
    new_count = 0

    # Load previously contacted leads with LinkedIn URLs
    store = LeadStore()
    all_leads = []
    for stage in ['contacted', 'audit_delivered', 'pitch_sent', 'paid']:
        all_leads.extend(store.get_leads_by_stage(stage))
    profiles_to_check = []

    for lead in all_leads:
        li_url = lead.get('linkedin_url', '')
        if li_url and 'linkedin.com/in/' in li_url:
            profiles_to_check.append({'url': li_url, 'email': lead.get('email', ''), 'company': lead.get('company', '')})

    # Also use any explicitly passed profile URLs
    if profile_urls:
        for url in profile_urls:
            profiles_to_check.append({'url': url, 'email': '', 'company': ''})

    if not profiles_to_check:
        print('  No LinkedIn profiles on file yet — will populate as leads are scraped')
        return 0

    print(f'  Checking {len(profiles_to_check)} profiles...')
    items = _run_actor('harvestapi/linkedin-profile-scraper', {
        'profileUrls': [p['url'] for p in profiles_to_check[:20]],  # batch 20
    }, timeout_secs=120)

    for item in items:
        profile_url = item.get('linkedinUrl', '') or item.get('profileUrl', '')
        current_company = item.get('currentCompany', '') or item.get('company', '')
        name = item.get('fullName', '') or item.get('name', '')

        # Find matching lead
        matched = next((p for p in profiles_to_check if p['url'] == profile_url), None)
        if not matched:
            continue

        old_company = matched.get('company', '')
        if not old_company or not current_company:
            continue

        # Detect company change
        if old_company.lower().strip() != current_company.lower().strip():
            dedup_key = hashlib.md5(f'jobchange:{matched["email"]}:{current_company}'.lower().encode()).hexdigest()
            if dedup_key in seen:
                continue

            record = {
                'signal': 'job_change',
                'name': name,
                'email': matched['email'],
                'linkedin_url': profile_url,
                'old_company': old_company,
                'new_company': current_company,
                'trigger_reason': f'Moved from {old_company} to {current_company} — first 90 days, high urgency to prove ROI',
                'icp_score': 9,
                'scraped_at': _now(),
                'status': 'new',
            }
            _save_lead(record)
            _mark_dedup(dedup_key)
            seen.add(dedup_key)
            new_count += 1
            print(f'    + {name}: {old_company} → {current_company}')

    print(f'  [Signal 2] {new_count} job-change events')
    return new_count


# ── Signal 3: Competitor Product Launches ─────────────────────────────────────

def competitor_launch() -> int:
    """
    Monitor LinkedIn posts from Zamp and Oxygen for feature announcements.
    Detect when they ship so we can counter-position in outreach copy within days.
    Returns count of new launch signals.
    """
    print('\n[Signal 5] Competitor launch monitoring...')
    seen = _load_dedup()
    new_count = 0

    competitor_queries = [
        'Zamp new feature',
        'Zamp launch',
        'Oxygen app update',
        'Oxygen new feature',
        'landing page optimization tool launch',
        'CRO tool launch',
    ]

    for query in competitor_queries:
        items = _run_actor('apimaestro/linkedin-posts-search-scraper-no-cookies', {
            'searchQuery': query,
            'maxPosts': 10,
            'datePosted': 'past-week',
        }, timeout_secs=90)

        for item in items:
            text = item.get('text', '') or item.get('content', '')
            post_url = item.get('postUrl', '') or item.get('url', '')
            author = item.get('authorName', '') or item.get('author', '')
            posted_at = item.get('postedAt', '') or item.get('date', '')

            if not text or len(text) < 50:
                continue

            # Filter: only posts mentioning feature launches
            launch_keywords = ['launch', 'new feature', 'just shipped', 'announcing', 'introducing', 'now available', 'update']
            if not any(kw in text.lower() for kw in launch_keywords):
                continue

            dedup_key = hashlib.md5(f'launch:{post_url}'.encode()).hexdigest()
            if dedup_key in seen:
                continue

            record = {
                'signal': 'competitor_launch',
                'query': query,
                'author': author,
                'post_url': post_url,
                'text_snippet': text[:300],
                'posted_at': posted_at,
                'action': 'Update outreach copy to counter-position within 48h',
                'scraped_at': _now(),
            }
            _save_insight(record)
            _mark_dedup(dedup_key)
            seen.add(dedup_key)
            new_count += 1
            print(f'    + Launch signal: {author}: {text[:80]}...')

    print(f'  [Signal 5] {new_count} competitor launch signals')
    return new_count


# ── Signal 4: G2 Review Gap Analysis ──────────────────────────────────────────

def review_gaps() -> int:
    """
    Scrape 1-3 star G2 reviews of Zamp and Oxygen.
    Extracts pain points for pitch copy, and frustrated users as direct leads.
    Returns count of insights saved.
    """
    print('\n[Signal 8] G2 review gap analysis...')
    seen = _load_dedup()
    new_count = 0

    for comp_name, comp_data in COMPETITORS.items():
        print(f'  Scraping {comp_name} G2 reviews...')
        items = _run_actor('zen-studio/g2-reviews-scraper', {
            'startUrls': [{'url': comp_data['g2_url']}],
            'maxReviews': 50,
            'minRating': 1,
            'maxRating': 3,
        }, timeout_secs=120)

        pain_themes = {}

        for item in items:
            review_id = item.get('reviewId', '') or item.get('id', '')
            rating = item.get('rating', 0) or item.get('stars', 0)
            review_text = item.get('review', '') or item.get('text', '') or item.get('body', '')
            cons = item.get('cons', '') or item.get('dislikedAbout', '') or ''
            reviewer_title = item.get('reviewerTitle', '') or item.get('jobTitle', '')

            if not review_text and not cons:
                continue

            full_text = f'{review_text} {cons}'.strip()

            dedup_key = hashlib.md5(f'g2:{comp_name}:{review_id}'.encode()).hexdigest()
            if dedup_key in seen:
                continue

            # Extract pain themes
            pain_keywords = {
                'pricing': ['expensive', 'price', 'cost', 'cheap', 'afford'],
                'setup': ['setup', 'onboarding', 'difficult', 'complicated', 'hard to'],
                'results': ['no results', "doesn't work", 'not working', 'ineffective', 'waste'],
                'support': ['support', 'customer service', 'response time', 'ignored'],
                'features': ['missing', 'lacks', 'need', 'wish', 'should have'],
            }
            themes_found = [theme for theme, words in pain_keywords.items()
                          if any(w in full_text.lower() for w in words)]

            record = {
                'signal': 'review_gap',
                'competitor': comp_name,
                'rating': rating,
                'reviewer_title': reviewer_title,
                'pain_themes': themes_found,
                'text_snippet': full_text[:400],
                'copy_angle': f'Unlike {comp_name}, Nebula: ' + (', '.join(themes_found) if themes_found else 'fixes core issues'),
                'scraped_at': _now(),
            }
            _save_insight(record)
            _mark_dedup(dedup_key)
            seen.add(dedup_key)
            new_count += 1

            for theme in themes_found:
                pain_themes[theme] = pain_themes.get(theme, 0) + 1

        if pain_themes:
            sorted_pains = sorted(pain_themes.items(), key=lambda x: -x[1])
            print(f'    {comp_name} top pains: {sorted_pains}')

    print(f'  [Signal 8] {new_count} review insights saved')
    return new_count


# ── Signal 5: Event Intel ─────────────────────────────────────────────────────

def event_intel() -> int:
    """
    Scrape DTC/ecom conference speaker and attendee lists from Eventbrite + web.
    These are founders actively investing in growth = buying trigger.
    Returns count of new leads added.
    """
    print('\n[Signal 15] Event intel scrape...')
    seen = _load_dedup()
    new_count = 0

    # Eventbrite scrape for DTC/ecom events
    items = _run_actor('apify/web-scraper', {
        'startUrls': [
            {'url': 'https://www.eventbrite.com/d/online/ecommerce-marketing/'},
            {'url': 'https://www.eventbrite.com/d/online/dtc-marketing/'},
            {'url': 'https://www.eventbrite.com/d/online/landing-page-optimization/'},
        ],
        'maxRequestsPerCrawl': 20,
        'pageFunction': '''async function pageFunction(context) {
            const { $, request } = context;
            const events = [];
            $(".event-card").each((i, el) => {
                events.push({
                    title: $(el).find(".event-card__title").text().trim(),
                    url: $(el).find("a").attr("href"),
                    date: $(el).find(".event-card__date").text().trim(),
                });
            });
            return events;
        }''',
    }, timeout_secs=90)

    for item in items:
        title = item.get('title', '')
        event_url = item.get('url', '')
        date = item.get('date', '')

        if not title or not event_url:
            continue

        # Filter for relevant events
        relevant = any(kw in title.lower() for kw in [
            'ecommerce', 'dtc', 'shopify', 'landing page', 'conversion',
            'paid ads', 'performance marketing', 'growth', 'email marketing',
        ])
        if not relevant:
            continue

        dedup_key = hashlib.md5(f'event:{event_url}'.encode()).hexdigest()
        if dedup_key in seen:
            continue

        record = {
            'signal': 'event_intel',
            'event_title': title,
            'event_url': event_url,
            'event_date': date,
            'trigger_reason': 'Attendees are founders actively investing in growth/ads',
            'action': 'Scrape speaker list + attendee list for outreach',
            'icp_score': 7,
            'scraped_at': _now(),
            'status': 'new',
        }
        _save_lead(record)
        _mark_dedup(dedup_key)
        seen.add(dedup_key)
        new_count += 1
        print(f'    + Event: {title} ({date})')

    print(f'  [Signal 15] {new_count} event leads saved')
    return new_count


# ── Main ──────────────────────────────────────────────────────────────────────

def run_all(dry_run: bool = False):
    _load_env()
    print(f'\n{"="*60}')
    print(f'Signal scrapers — {_now()}')
    print(f'{"="*60}')

    if dry_run:
        print('[DRY-RUN] Would run: hiring_signal, job_change, competitor_launch, review_gaps, event_intel')
        return

    results = {}
    results['hiring_signal']     = hiring_signal()
    results['job_change']        = job_change()
    results['competitor_launch'] = competitor_launch()
    results['review_gaps']       = review_gaps()
    results['event_intel']       = event_intel()

    total = sum(results.values())
    print(f'\n{"="*60}')
    print(f'Total new signals: {total}')
    for k, v in results.items():
        print(f'  {k}: {v}')
    print(f'Leads → {SIGNAL_LEADS_FILE.name}')
    print(f'Insights → {SIGNAL_INSIGHTS_FILE.name}')

    return results


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser(description='Nebula signal scrapers')
    parser.add_argument('--dry-run', action='store_true')
    parser.add_argument('--signal', choices=['hiring', 'job_change', 'competitor', 'reviews', 'events'])
    args = parser.parse_args()

    _load_env()

    if args.signal == 'hiring':
        hiring_signal()
    elif args.signal == 'job_change':
        job_change()
    elif args.signal == 'competitor':
        competitor_launch()
    elif args.signal == 'reviews':
        review_gaps()
    elif args.signal == 'events':
        event_intel()
    else:
        run_all(dry_run=args.dry_run)
