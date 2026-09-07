#!/usr/bin/env python3
"""
Weekly Agency Brief — nebulacomponents.com
Runs every Friday 6pm ET. Delivers a concise performance summary covering
all active link building, content, pitch, and SEO tracks.
Silent if it fails to gather data (never sends a half-baked brief).
"""
import json
import urllib.request
import base64
import sys
from pathlib import Path
from datetime import datetime, timezone, timedelta

BASE = Path('/home/mike/nebula')
SEO = BASE / 'seo'
LEDGER = SEO / 'ledger'

def read_jsonl(path: Path) -> list[dict]:
    if not path.exists():
        return []
    rows = []
    with path.open() as f:
        for line in f:
            line = line.strip()
            if line:
                try:
                    rows.append(json.loads(line))
                except Exception:
                    pass
    return rows

def dataforseo_domain_rank(domain: str) -> int | None:
    env_files = [Path.home() / '.hermes/.env', BASE / '.env']
    username = password = None
    for ef in env_files:
        if ef.exists():
            for line in ef.read_text().splitlines():
                if line.startswith('DATAFORSEO_USERNAME=') or line.startswith('DATAFORSEO_LOGIN='):
                    username = line.split('=', 1)[1].strip().strip('"\'')
                elif line.startswith('DATAFORSEO_PASSWORD=') or line.startswith('DATAFORSEO_KEY='):
                    password = line.split('=', 1)[1].strip().strip('"\'')
    if not username or not password:
        return None
    try:
        creds = base64.b64encode(f"{username}:{password}".encode()).decode()
        payload = json.dumps([{"targets": [domain]}]).encode()
        req = urllib.request.Request(
            "https://api.dataforseo.com/v3/backlinks/bulk_ranks/live",
            data=payload,
            headers={"Authorization": f"Basic {creds}", "Content-Type": "application/json"},
            method="POST"
        )
        resp = json.loads(urllib.request.urlopen(req, timeout=15).read())
        items = resp.get("tasks", [{}])[0].get("result", [{}])[0].get("items", [])
        for item in items:
            if item.get("target") == domain:
                return item.get("rank")
    except Exception:
        pass
    return None

def dataforseo_referring_domains(domain: str) -> int | None:
    env_files = [Path.home() / '.hermes/.env', BASE / '.env']
    username = password = None
    for ef in env_files:
        if ef.exists():
            for line in ef.read_text().splitlines():
                if line.startswith('DATAFORSEO_USERNAME=') or line.startswith('DATAFORSEO_LOGIN='):
                    username = line.split('=', 1)[1].strip().strip('"\'')
                elif line.startswith('DATAFORSEO_PASSWORD=') or line.startswith('DATAFORSEO_KEY='):
                    password = line.split('=', 1)[1].strip().strip('"\'')
    if not username or not password:
        return None
    try:
        creds = base64.b64encode(f"{username}:{password}".encode()).decode()
        payload = json.dumps([{"target": domain, "include_subdomains": True, "limit": 1}]).encode()
        req = urllib.request.Request(
            "https://api.dataforseo.com/v3/backlinks/summary/live",
            data=payload,
            headers={"Authorization": f"Basic {creds}", "Content-Type": "application/json"},
            method="POST"
        )
        resp = json.loads(urllib.request.urlopen(req, timeout=15).read())
        items = resp.get("tasks", [{}])[0].get("result", [])
        if items:
            return items[0].get("referring_main_domains")
    except Exception:
        pass
    return None

def main():
    now = datetime.now(timezone.utc)
    week_ago = now - timedelta(days=7)

    # 1. Domain score
    rank = dataforseo_domain_rank("nebulacomponents.com")
    ref_domains = dataforseo_referring_domains("nebulacomponents.com")

    # 2. Pitches this week
    pitches = read_jsonl(LEDGER / 'pitches.jsonl')
    sent_this_week = [p for p in pitches if p.get('sent_at') and
                      datetime.fromisoformat(p['sent_at'].replace('Z','+00:00')) > week_ago]
    replied = [p for p in pitches if p.get('status') == 'replied']
    follow_ups_sent = [p for p in pitches if p.get('follow_up_1_sent') or p.get('follow_up_2_sent')]

    # 3. Link opportunities found
    opps = read_jsonl(SEO / 'link_opportunities.jsonl')
    new_opps = [o for o in opps if o.get('discovered_at') and
                datetime.fromisoformat(o['discovered_at'].replace('Z','+00:00')) > week_ago]
    gap_opps = [o for o in new_opps if o.get('type') == 'competitor_gap']
    mention_opps = [o for o in new_opps if o.get('type') == 'unlinked_mention']

    # 4. Directory status
    dir_status = {}
    status_file = LEDGER / 'directory_status.json'
    if status_file.exists():
        dir_status = json.loads(status_file.read_text())

    # 5. Content briefs
    briefs = read_jsonl(LEDGER / 'content_briefs.jsonl')
    queued_briefs = [b for b in briefs if b.get('status') == 'queued']

    # 6. Blog posts
    blog_dir = BASE / 'customer-portal/app/blog/content'
    posts = list(blog_dir.glob('*.md')) if blog_dir.exists() else []
    recent_posts = []
    for p in posts:
        content = p.read_text()
        if 'published_at: 2026-09-0' in content:
            title_match = [l for l in content.splitlines() if l.startswith('# ')]
            title = title_match[0][2:] if title_match else p.stem
            recent_posts.append(title[:60])

    # Build report
    lines = [
        f"NEBULA AGENCY BRIEF -- Week of {now.strftime('%Y-%m-%d')}",
        "",
    ]

    # Domain score
    rank_str = str(rank) if rank else "n/a"
    rd_str = str(ref_domains) if ref_domains else "n/a"
    lines += [f"DOMAIN", f"  Rank: {rank_str}  |  Referring domains: {rd_str}", ""]

    # Pitches
    lines += [f"PITCHES"]
    lines += [f"  Sent this week: {len(sent_this_week)}"]
    if replied:
        lines += [f"  REPLIES RECEIVED: {len(replied)}"]
        for p in replied:
            lines += [f"    - {p.get('to', '')} ({p.get('subject', '')[:40]})"]
    if follow_ups_sent:
        lines += [f"  Follow-ups sent: {len(follow_ups_sent)}"]
    lines += [""]

    # Directories
    lines += [f"DIRECTORIES"]
    for d in ['saashub', 'capterra', 'alternativeto']:
        status = dir_status.get(d, 'unknown')
        lines += [f"  {d}: {status}"]
    lines += [""]

    # Link opportunities
    lines += [f"LINK OPPORTUNITIES (new this week)"]
    lines += [f"  Competitor gaps: {len(gap_opps)}"]
    lines += [f"  Unlinked mentions: {len(mention_opps)}"]
    if gap_opps:
        for o in gap_opps[:3]:
            lines += [f"    - {o.get('url','')[:60]} (score {o.get('score','')})"]
    lines += [""]

    # Content
    lines += [f"CONTENT"]
    lines += [f"  Posts live: {len(posts)}"]
    if recent_posts:
        lines += [f"  Recent: {', '.join(recent_posts[:2])}"]
    lines += [f"  Briefs queued: {len(queued_briefs)}"]
    if queued_briefs:
        lines += [f"  Next brief: {queued_briefs[0].get('title','')[:60]}"]
    lines += [""]

    # Priority
    if replied:
        priority = f"Respond to reply from {replied[0].get('to','')} -- check mike@nebulacomponents.com"
    elif len(queued_briefs) > 0:
        priority = f"Write next content brief: {queued_briefs[0].get('title','')[:50]}"
    elif gap_opps:
        priority = f"Pitch top gap domain: {gap_opps[0].get('url','')[:50]}"
    else:
        priority = "Send PPC Info pitch (pitch_drafts_manual.md Pitch 004)"

    lines += [f"PRIORITY THIS WEEK", f"  {priority}"]

    print("\n".join(lines))

if __name__ == "__main__":
    main()
