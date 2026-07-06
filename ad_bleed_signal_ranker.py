#!/usr/bin/env python3
"""Ad Bleed Signal Ranker.

Turns raw GTM signals into a public-reply queue for the Ad Burn Leak Board.
No sending, no posting, no scraping. It ranks, writes, and dedupes.
"""
from __future__ import annotations

import argparse
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable

DEFAULT_BASE = Path('/home/mike/nebula')
BOARD_URL = 'https://nebulacomponents.shop/ad-burn-leaderboard.html'
AUDIT_URL = 'https://nebulacomponents.shop/audit.html'
CHECKOUT_URL = 'https://buy.stripe.com/aFa7sL5E03Iwgyt2Nk43S02'

AD_TERMS = (
    'ad', 'ads', 'ppc', 'google ads', 'facebook ads', 'meta ads',
    'paid traffic', 'cpc', 'ctr', 'campaign', 'clicks', 'landing page views',
)
FAIL_TERMS = (
    'no sales', '0 sales', 'zero sales', 'no conversion', 'no conversions',
    '0 conversion', '0 conversions', 'zero conversions', 'not converting',
    'almost no sales', 'weak conversion', 'low conversion', 'no leads',
)
HELP_TERMS = ('please help', 'what am i missing', 'roast', 'feedback', 'review')
URL_RE = re.compile(r'https?://[^\s\])}>",]+', re.I)
NUMBER_RE = re.compile(r'(?:\$\s?\d[\d,.]*|\d[\d,.]*\s?(?:clicks?|visitors?|views?|impressions?|sales?|conversions?|atc|checkouts?))', re.I)


def load_jsonl(path: Path) -> list[dict]:
    if not path.exists():
        return []
    rows = []
    for line in path.read_text().splitlines():
        if not line.strip():
            continue
        try:
            rows.append(json.loads(line))
        except json.JSONDecodeError:
            continue
    return rows


def write_jsonl_append(path: Path, rows: Iterable[dict]) -> None:
    with path.open('a') as fh:
        for row in rows:
            fh.write(json.dumps(row, ensure_ascii=False) + '\n')


def text_for(record: dict) -> str:
    parts = [
        record.get('title', ''),
        record.get('headline', ''),
        record.get('trigger_text', ''),
        record.get('body_excerpt', ''),
        record.get('fit_reason', ''),
        record.get('trigger', ''),
    ]
    return ' '.join(str(p) for p in parts if p)


def extract_company_url(record: dict, text: str) -> str:
    for key in ('company_url', 'site', 'site_hint', 'product_url', 'url'):
        value = record.get(key)
        if isinstance(value, str) and value.startswith('http'):
            if 'reddit.com' not in value and 'indiehackers.com' not in value and 'producthunt.com' not in value:
                return value.rstrip('., )')
    candidates = record.get('candidate_sites') or []
    if isinstance(candidates, list):
        for value in candidates:
            if isinstance(value, str) and value.startswith('http'):
                return value.rstrip('., )')
    for match in URL_RE.findall(text):
        if not any(domain in match for domain in ('reddit.com', 'indiehackers.com', 'producthunt.com')):
            return match.rstrip('., )')
    return ''


def extract_pain_signal(text: str) -> str:
    numbers = NUMBER_RE.findall(text)
    low = text.lower()
    fail = next((term for term in FAIL_TERMS if term in low), '')
    if numbers and fail:
        return f"{', '.join(numbers[:2])} and {fail}"
    if numbers:
        return ', '.join(numbers[:2])
    if fail:
        return fail
    return (text[:140] + '...') if len(text) > 140 else text


def infer_leak(text: str) -> str:
    low = text.lower()
    if any(x in low for x in ('checkout', 'cart', 'atc', 'add to cart')):
        return 'checkout trust or offer-friction leak'
    if any(x in low for x in ('ctr', 'clicks', 'cpc', 'impressions')):
        return 'message-match leak between ad promise and first screen'
    if any(x in low for x in ('booking', 'calls', 'leads', 'form')):
        return 'CTA friction before enough trust is built'
    if any(x in low for x in ('roast', 'feedback', 'landing page')):
        return 'headline, proof, or CTA clarity leak'
    return 'trust proof gap above the fold'


def rank_signal(record: dict) -> dict:
    text = text_for(record)
    low = text.lower()
    company_url = extract_company_url(record, text)
    score = 0

    if any(term in low for term in AD_TERMS):
        score += 3
    if any(term in low for term in FAIL_TERMS):
        score += 4
    if NUMBER_RE.search(text):
        score += 2
    if company_url:
        score += 1
    if any(term in low for term in HELP_TERMS):
        score += 1
    if record.get('score') and isinstance(record.get('score'), (int, float)):
        score += min(2, max(0, int(record['score']) // 6))

    score = min(score, 10)
    is_ad_bleed = score >= 6 and any(term in low for term in FAIL_TERMS)
    if score >= 9:
        priority = 'post_now'
    elif score >= 7:
        priority = 'queue_today'
    else:
        priority = 'watch'

    result = {
        'timestamp': datetime.now(timezone.utc).isoformat(),
        'source_url': record.get('source_url') or record.get('url') or '',
        'platform': record.get('platform') or record.get('source') or '',
        'author': record.get('author') or '',
        'company_url': company_url,
        'score': score,
        'is_ad_bleed': is_ad_bleed,
        'pain_signal': extract_pain_signal(text),
        'likely_leak': infer_leak(text),
        'contact_path': record.get('contact_path') or '',
        'priority': priority,
        'cta': 'public mini-audit first, then audit tool or $97 checkout',
        'source_title': record.get('title') or record.get('headline') or '',
    }
    result['public_reply'] = build_public_reply(result)
    return result


def build_public_reply(ranked: dict) -> str:
    pain = ranked.get('pain_signal') or 'paid traffic with weak conversions'
    leak = ranked.get('likely_leak') or 'trust proof gap above the fold'
    return (
        f"{pain} usually means the page is leaking before the offer gets a fair shot. "
        f"First thing I would check: {leak}. "
        f"I am tracking these here: {BOARD_URL}"
    )


def load_seen(path: Path) -> set[str]:
    if not path.exists():
        return set()
    try:
        data = json.loads(path.read_text())
    except json.JSONDecodeError:
        return set()
    return set(data if isinstance(data, list) else [])


def save_seen(path: Path, seen: set[str]) -> None:
    path.write_text(json.dumps(sorted(seen), indent=2))


def record_key(row: dict) -> str:
    return row.get('source_url') or row.get('company_url') or json.dumps(row, sort_keys=True)[:200]


def run_ranker(base: Path = DEFAULT_BASE, inputs: list[Path] | None = None,
               output_path: Path | None = None, seen_path: Path | None = None) -> dict:
    inputs = inputs or [base / 'reddit_enriched_prospects.jsonl', base / 'signal_queue.jsonl']
    output_path = output_path or base / 'ad_burn_public_reply_queue.jsonl'
    seen_path = seen_path or base / 'ad_burn_public_reply_seen.json'
    seen = load_seen(seen_path)
    written = []
    scanned = 0

    for path in inputs:
        for record in load_jsonl(path):
            scanned += 1
            ranked = rank_signal(record)
            key = record_key(ranked)
            if key in seen or not ranked['is_ad_bleed'] or ranked['score'] < 7:
                continue
            seen.add(key)
            written.append(ranked)

    written.sort(key=lambda r: r['score'], reverse=True)
    write_jsonl_append(output_path, written)
    save_seen(seen_path, seen)
    return {'scanned': scanned, 'written': len(written), 'output': str(output_path)}


def main() -> None:
    parser = argparse.ArgumentParser(description='Rank ad-bleed signals into a public reply queue.')
    parser.add_argument('--base', default=str(DEFAULT_BASE))
    parser.add_argument('--output', default='ad_burn_public_reply_queue.jsonl')
    args = parser.parse_args()
    base = Path(args.base)
    summary = run_ranker(base=base, output_path=base / args.output)
    print(json.dumps(summary, indent=2))


if __name__ == '__main__':
    main()
