#!/usr/bin/env python3
"""
Cohort analysis for Nebula Components.
Tracks leads from audit → email → click → purchase.
Compares pre- vs post-ICP gate (DEC-0002).
"""
import sqlite3
import json
from datetime import datetime, timedelta
from pathlib import Path

DB_PATH = Path('/home/mike/nebula/lead_store.db')
REPORT_DIR = Path('/home/mike/nebula/seo-reports')
TODAY = datetime.now().strftime('%Y-%m-%d')

def get_db_connection():
    """Connect to lead_store.db."""
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn

def calculate_cohorts(conn):
    """Calculate cohort metrics."""
    cur = conn.cursor()
    
    # Get all leads grouped by discovery week
    cur.execute("""
        SELECT 
            strftime('%Y-%W', discovered_at) as cohort_week,
            COUNT(*) as total_leads,
            COUNT(CASE WHEN contacted_at IS NOT NULL THEN 1 END) as contacted,
            COUNT(CASE WHEN audit_delivered_at IS NOT NULL THEN 1 END) as audited,
            COUNT(CASE WHEN pitch_sent_at IS NOT NULL THEN 1 END) as pitched,
            COUNT(CASE WHEN paid_at IS NOT NULL THEN 1 END) as paid
        FROM leads
        WHERE discovered_at IS NOT NULL
        GROUP BY cohort_week
        ORDER BY cohort_week DESC
        LIMIT 12
    """)
    
    cohorts = []
    for row in cur.fetchall():
        cohorts.append({
            'cohort_week': row['cohort_week'],
            'total_leads': row['total_leads'],
            'contacted': row['contacted'],
            'contacted_rate': row['contacted'] / row['total_leads'] if row['total_leads'] > 0 else 0,
            'audited': row['audited'],
            'audit_rate': row['audited'] / row['total_leads'] if row['total_leads'] > 0 else 0,
            'pitched': row['pitched'],
            'pitch_rate': row['pitched'] / row['total_leads'] if row['total_leads'] > 0 else 0,
            'paid': row['paid'],
            'conversion_rate': row['paid'] / row['total_leads'] if row['total_leads'] > 0 else 0,
        })
    
    return cohorts

def calculate_funnel_metrics(conn):
    """Calculate funnel metrics."""
    cur = conn.cursor()
    
    # Get funnel counts
    cur.execute("""
        SELECT
            COUNT(*) as total,
            COUNT(CASE WHEN contacted_at IS NOT NULL THEN 1 END) as contacted,
            COUNT(CASE WHEN audit_delivered_at IS NOT NULL THEN 1 END) as audited,
            COUNT(CASE WHEN pitch_sent_at IS NOT NULL THEN 1 END) as pitched,
            COUNT(CASE WHEN paid_at IS NOT NULL THEN 1 END) as paid
        FROM leads
        WHERE discovered_at IS NOT NULL
    """)
    
    row = cur.fetchone()
    
    total = row['total']
    contacted = row['contacted']
    audited = row['audited']
    pitched = row['pitched']
    paid = row['paid']
    
    return {
        'total_leads': total,
        'contacted': contacted,
        'contact_to_audit_rate': audited / contacted if contacted > 0 else 0,
        'audited': audited,
        'audit_to_pitch_rate': pitched / audited if audited > 0 else 0,
        'pitched': pitched,
        'pitch_to_pay_rate': paid / pitched if pitched > 0 else 0,
        'paid': paid,
        'overall_conversion_rate': paid / total if total > 0 else 0,
    }

def get_stage_distribution(conn):
    """Get current stage distribution."""
    cur = conn.cursor()
    cur.execute("""
        SELECT stage, COUNT(*) as count
        FROM leads
        WHERE dead_at IS NULL AND bounced_at IS NULL
        GROUP BY stage
        ORDER BY count DESC
    """)
    
    return {row['stage']: row['count'] for row in cur.fetchall()}

def generate_report():
    """Generate cohort analysis report."""
    conn = get_db_connection()
    
    cohorts = calculate_cohorts(conn)
    funnel = calculate_funnel_metrics(conn)
    stages = get_stage_distribution(conn)
    
    report = {
        'generated_at': datetime.now().isoformat(),
        'cohorts': cohorts,
        'funnel': funnel,
        'stage_distribution': stages,
    }
    
    report_path = REPORT_DIR / f'cohort-analysis-{TODAY}.json'
    report_path.write_text(json.dumps(report, indent=2))
    
    print(f"Report saved: {report_path}")
    print(f"\nSummary:")
    print(f"  Total leads: {funnel['total_leads']}")
    print(f"  Paid: {funnel['paid']}")
    print(f"  Overall conversion: {funnel['overall_conversion_rate']*100:.2f}%")
    
    conn.close()
    return report

if __name__ == '__main__':
    generate_report()
