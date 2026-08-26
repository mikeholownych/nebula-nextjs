#!/home/mike/nebula/.venv/bin/python3
"""
Weekly Marketing Orchestrator — context gatherer for the Monday briefing agent.

Reads all SEO cron outputs, pipeline state, sequence state, funnel metrics,
and content queue from the past 7 days. Prints a structured JSON blob that
the agent cron uses to write the Monday brief and queue decisions.

This script only READS. The agent cron does the writing, deciding, and firing.
"""
import json
import os
import sqlite3
import subprocess
import sys
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

NEBULA = Path('/home/mike/nebula')
SEO_REPORTS = NEBULA / 'seo-reports'
LEAD_STATE_DB = NEBULA / 'lead_gen' / 'lead_state.db'
LEAD_STORE_DB = NEBULA / 'lead_state.db'  # LeadStore — authoritative stage for HOT_LEAD
SIGNAL_QUEUE = NEBULA / 'signal_queue.jsonl'
HOT_LEAD = NEBULA / 'HOT_LEAD.json'
TODAY = date.today().isoformat()
WEEK_AGO = (date.today() - timedelta(days=7)).isoformat()

out = {
    'generated_at': datetime.now(timezone.utc).isoformat(),
    'week_start': WEEK_AGO,
    'week_end': TODAY,
    'seo': {},
    'pipeline': {},
    'content': {},
    'actions_pending': [],
}


# ── SEO: collect this week's cron report summaries ──────────────────────────

def latest_report(prefix: str) -> dict:
    files = sorted(SEO_REPORTS.glob(f'{prefix}-*.json'), reverse=True)
    if not files:
        return {}
    try:
        return json.loads(files[0].read_text())
    except Exception:
        return {}


def latest_report_text(prefix: str) -> str:
    """For text/markdown reports."""
    files = sorted(SEO_REPORTS.glob(f'{prefix}-*'), reverse=True)
    if not files:
        return ''
    try:
        return files[0].read_text()[:2000]
    except Exception:
        return ''


# Site audit — broken links, redirect chains, orphan pages
site_audit = latest_report('site-audit')
out['seo']['site_audit'] = {
    'date': TODAY,
    'broken_urls': site_audit.get('broken', [])[:10],
    'redirect_chains': site_audit.get('redirect_chains', [])[:5],
    'orphan_pages': site_audit.get('orphan_pages', [])[:10],
    'total_urls': site_audit.get('total_pages', 0),
}

# SERP tracking — rank changes
serp = latest_report('serp-tracking')
out['seo']['serp'] = {
    'date': TODAY,
    'keywords_tracked': serp.get('keywords_tracked', 0),
    'ranked_count': serp.get('ranked_count', 0),
    'keywords': serp.get('rankings', [])[:15],
    'moved_up': [k for k in serp.get('significant_moves', []) if k.get('delta', 0) > 0][:5],
    'moved_down': [k for k in serp.get('significant_moves', []) if k.get('delta', 0) < 0][:5],
}

# CWV
cwv = latest_report('cwv')
out['seo']['cwv'] = cwv.get('metrics', cwv)

# Bing crawl
bing = latest_report('bing-crawl')
bing_data = bing.get('data', {})
bing_rows = bing_data.get('d', []) if isinstance(bing_data, dict) else []
out['seo']['bing'] = {
    'crawl_errors': [r for r in bing_rows
                     if isinstance(r, dict) and r.get('Count', 0) > 0][:8],
}

# Keyword gap (Monday only)
kw_gap_files = sorted(SEO_REPORTS.glob('keyword-gap-*.json'), reverse=True)
if kw_gap_files and kw_gap_files[0].stat().st_mtime > (datetime.now().timestamp() - 7 * 86400):
    try:
        kg = json.loads(kw_gap_files[0].read_text())
        out['seo']['keyword_gap'] = kg.get('opportunities', [])[:10]
    except Exception:
        pass

# Content decay (Tuesday only — include if recent)
decay_files = sorted(SEO_REPORTS.glob('content-decay-*.json'), reverse=True)
if decay_files and decay_files[0].stat().st_mtime > (datetime.now().timestamp() - 7 * 86400):
    try:
        cd = json.loads(decay_files[0].read_text())
        out['seo']['content_decay'] = cd.get('decaying', [])[:5]
    except Exception:
        pass

# Schema audit (Friday only)
schema_files = sorted(SEO_REPORTS.glob('schema-audit-*.json'), reverse=True)
if schema_files and schema_files[0].stat().st_mtime > (datetime.now().timestamp() - 7 * 86400):
    try:
        sa = json.loads(schema_files[0].read_text())
        out['seo']['schema_issues'] = sa.get('issues', [])[:5]
    except Exception:
        pass

# Internal links (Sunday)
il_files = sorted(SEO_REPORTS.glob('internal-links-*.json'), reverse=True)
if il_files and il_files[0].stat().st_mtime > (datetime.now().timestamp() - 7 * 86400):
    try:
        il = json.loads(il_files[0].read_text())
        out['seo']['internal_link_gaps'] = il.get('gaps', [])[:5]
    except Exception:
        pass

# Competitor differentiation notes
comp_files = sorted(SEO_REPORTS.glob('competitor-differentiation-*.md'), reverse=True)
if comp_files:
    out['seo']['competitor_notes'] = comp_files[0].read_text()[:800]

# Log analysis summary
log_report = latest_report('log-analysis')
out['seo']['log_analysis'] = {
    'top_404s': log_report.get('top_404s', [])[:5],
    'crawl_activity': log_report.get('crawl_activity', {}),
    'total_requests': log_report.get('total_requests', 0),
}


# ── Pipeline state ────────────────────────────────────────────────────────────

# Sequence engine
if LEAD_STATE_DB.exists():
    try:
        db = sqlite3.connect(str(LEAD_STATE_DB))
        db.row_factory = sqlite3.Row
        rows = db.execute("SELECT * FROM sequence_state").fetchall()

        active = [r for r in rows if r['status'] == 'active']
        replied = [r for r in rows if r['replied_at'] and r['replied_at'] >= WEEK_AGO]
        d1_week = [r for r in rows if r['d1_sent_at'] and r['d1_sent_at'] >= WEEK_AGO]
        bounced = [r for r in rows if r['status'] == 'bounced']

        out['pipeline']['sequences'] = {
            'active': len(active),
            'replied_this_week': len(replied),
            'd1_sent_this_week': len(d1_week),
            'bounced_total': len(bounced),
            'active_emails': [r['email'] for r in active[:5]],
            'replied_emails': [r['email'] for r in replied[:5]],
        }
        db.close()
    except Exception as e:
        out['pipeline']['sequences'] = {'error': str(e)}

# Signal queue — uncontacted leads
if SIGNAL_QUEUE.exists():
    try:
        lines = [json.loads(l) for l in SIGNAL_QUEUE.read_text().splitlines() if l.strip()]
        fresh = [l for l in lines if l.get('discovered_at', '') >= WEEK_AGO]
        uncontacted = [l for l in fresh if not l.get('contacted')]
        out['pipeline']['signals'] = {
            'fresh_this_week': len(fresh),
            'uncontacted': len(uncontacted),
            'top_uncontacted': [
                {'email': l.get('email', ''), 'url': l.get('url', ''), 'score': l.get('signal_score', 0),
                 'context': l.get('trigger_context', '')[:120]}
                for l in sorted(uncontacted, key=lambda x: x.get('signal_score', 0), reverse=True)[:5]
            ],
        }
    except Exception as e:
        out['pipeline']['signals'] = {'error': str(e)}

# HOT_LEAD pipeline — cross-reference lead_state.db to get authoritative stage
if HOT_LEAD.exists():
    try:
        leads = json.loads(HOT_LEAD.read_text())
        if isinstance(leads, dict):
            leads = leads.get('leads', [])

        # Build authoritative stage map from lead_state.db
        authoritative_stage: dict = {}
        if LEAD_STORE_DB.exists():
            import sqlite3 as _sqlite3
            db = _sqlite3.connect(str(LEAD_STORE_DB))
            db.row_factory = _sqlite3.Row
            rows = db.execute("SELECT email, stage, dead_at FROM leads").fetchall()
            for r in rows:
                authoritative_stage[r['email']] = {
                    'stage': r['stage'],
                    'dead_at': r['dead_at'],
                }
            db.close()

        # Override HOT_LEAD stage with authoritative stage where available
        for lead in leads:
            email = lead.get('email', '')
            if email in authoritative_stage:
                db_stage = authoritative_stage[email]['stage']
                if db_stage in ('dead', 'bounced', 'terminal'):
                    lead['stage'] = db_stage  # correct stale HOT_LEAD stage

        stage_counts: dict = {}
        for l in leads:
            s = l.get('stage', 'unknown')
            stage_counts[s] = stage_counts.get(s, 0) + 1
        out['pipeline']['hot_leads'] = {
            'total': len(leads),
            'by_stage': stage_counts,
        }
    except Exception as e:
        out['pipeline']['hot_leads'] = {'error': str(e)}

# Purchases — check platform DB
try:
    result = subprocess.run(
        ['psql', '-h', '/var/run/postgresql', '-p', '5433', '-U', 'postgres',
         '-d', 'nebula_audit', '-t', '-c',
         f"SELECT COUNT(*), COALESCE(SUM(amount_cents),0) FROM purchases "
         f"WHERE created_at >= '{WEEK_AGO}'"],
        capture_output=True, text=True, timeout=10
    )
    if result.returncode == 0:
        parts = result.stdout.strip().split('|')
        if len(parts) >= 2:
            out['pipeline']['purchases_this_week'] = {
                'count': int(parts[0].strip() or 0),
                'revenue_cents': int(parts[1].strip() or 0),
            }
except Exception:
    pass

# Audit volume this week
try:
    result = subprocess.run(
        ['psql', '-h', '/var/run/postgresql', '-p', '5433', '-U', 'postgres',
         '-d', 'nebula_audit', '-t', '-c',
         f"SELECT COUNT(*) FROM audits WHERE created_at >= '{WEEK_AGO}' "
         f"AND email NOT ILIKE '%holownych%' AND email NOT ILIKE '%@invalid%' "
         f"AND url NOT ILIKE '%example.com%'"],
        capture_output=True, text=True, timeout=10
    )
    if result.returncode == 0:
        out['pipeline']['real_audits_this_week'] = int(result.stdout.strip() or 0)
except Exception:
    pass


# ── Content queue ─────────────────────────────────────────────────────────────

try:
    result = subprocess.run(
        ['psql', '-h', '10.0.8.220', '-p', '5432', '-U', 'content_ops_app',
         '-d', 'content_ops', '-t', '-c',
         "SELECT id, platform, LEFT(angle_title,80), status FROM content_queue "
         "ORDER BY id DESC LIMIT 10"],
        capture_output=True, text=True, timeout=10,
        env={**os.environ, 'PGPASSWORD': os.environ.get('CONTENT_OPS_PG_PASSWORD', '')}
    )
    if result.returncode == 0:
        out['content']['queue'] = result.stdout.strip()
except Exception:
    pass


# ── Actions pending (surface blockers) ───────────────────────────────────────

# Broken URLs
if out['seo']['site_audit'].get('broken_urls'):
    out['actions_pending'].append({
        'type': 'seo_broken_urls',
        'count': len(out['seo']['site_audit']['broken_urls']),
        'urls': [u.get('url', u) for u in out['seo']['site_audit']['broken_urls'][:5]],
    })

# SERP drops
drops = out['seo']['serp'].get('moved_down', [])
if drops:
    out['actions_pending'].append({
        'type': 'serp_drops',
        'keywords': [k.get('keyword', '') + ' (' + str(k.get('delta', '')) + ')' for k in drops[:3]],
    })

# Uncontacted signals
unc = out['pipeline'].get('signals', {}).get('uncontacted', 0)
if unc > 0:
    out['actions_pending'].append({
        'type': 'uncontacted_signals',
        'count': unc,
    })

# No active sequences
active_seq = out['pipeline'].get('sequences', {}).get('active', 0)
d1_week = out['pipeline'].get('sequences', {}).get('d1_sent_this_week', 0)
if active_seq < 5 and d1_week == 0 and unc > 0:
    out['actions_pending'].append({
        'type': 'pipeline_starvation',
        'active_sequences': active_seq,
        'uncontacted_signals': unc,
        'recommendation': 'Send D1 to top uncontacted signals this week',
    })

print(json.dumps(out, indent=2, default=str))
