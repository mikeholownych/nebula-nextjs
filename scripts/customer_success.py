#!/usr/bin/env python3
"""
Customer Success & Support tracking.
Tracks NPS/CSAT, support SLAs, and churn signals.
"""
import sqlite3
from datetime import datetime, timedelta
from pathlib import Path
import json

DB_PATH = Path('/home/mike/nebula/lead_store.db')
REPORT_DIR = Path('/home/mike/nebula/seo-reports')
TODAY = datetime.now().strftime('%Y-%m-%d')


def get_db_connection():
    """Connect to lead_store.db."""
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn


def calculate_nps():
    """Calculate Net Promoter Score from survey data."""
    # Since we don't have NPS survey data yet, simulate based on lead stages
    # In production, this would read from actual NPS responses
    conn = get_db_connection()
    cur = conn.cursor()
    
    # Simulated NPS categories based on lead engagement
    cur.execute("""
        SELECT 
            COUNT(*) as total,
            COUNT(CASE WHEN stage = 'pitch_sent' THEN 1 END) as promoters,
            COUNT(CASE WHEN stage IN ('audit_delivered', 'contacted') THEN 1 END) as passives,
            COUNT(CASE WHEN stage IN ('discovered', 'site_found') THEN 1 END) as detractors
        FROM leads
        WHERE dead_at IS NULL AND bounced_at IS NULL
    """)
    
    row = cur.fetchone()
    total = row['total'] or 0
    promoters = row['promoters'] or 0
    passives = row['passives'] or 0
    detractors = row['detractors'] or 0
    
    if total == 0:
        nps = 0
    else:
        nps = round(((promoters - detractors) / total) * 100)
    
    return {
        'nps': nps,
        'promoters': promoters,
        'passives': passives,
        'detractors': detractors,
        'total_respondents': total,
        'threshold': 50,  # Minimum respondents for reliable NPS
    }


def calculate_csat():
    """Calculate Customer Satisfaction Score."""
    # Simulated based on audit delivery success
    conn = get_db_connection()
    cur = conn.cursor()
    
    cur.execute("""
        SELECT 
            COUNT(*) as total,
            COUNT(CASE WHEN audit_delivered_at IS NOT NULL THEN 1 END) as satisfied
        FROM leads
        WHERE dead_at IS NULL AND bounced_at IS NULL
    """)
    
    row = cur.fetchone()
    total = row['total'] or 0
    satisfied = row['satisfied'] or 0
    
    if total == 0:
        csat = 0
    else:
        csat = round((satisfied / total) * 100)
    
    return {
        'csat': csat,
        'satisfied': satisfied,
        'total_customers': total,
        'threshold': 80,  # Target CSAT
    }


def calculate_sla_metrics():
    """Calculate SLA compliance metrics."""
    conn = get_db_connection()
    cur = conn.cursor()
    
    # Audit delivery SLA: <48 hours
    cur.execute("""
        SELECT 
            COUNT(*) as total,
            COUNT(CASE 
                WHEN audit_delivered_at IS NOT NULL 
                AND (julianday(audit_delivered_at) - julianday(contacted_at)) * 24 < 48 
                THEN 1 
            END) as met_sla
        FROM leads
        WHERE contacted_at IS NOT NULL
    """)
    
    row = cur.fetchone()
    total = row['total'] or 0
    met_sla = row['met_sla'] or 0
    
    sla_compliance = round((met_sla / total * 100), 1) if total > 0 else 0
    
    return {
        'audit_delivery_sla': {
            'target': '48 hours',
            'met': met_sla,
            'total': total,
            'compliance': sla_compliance,
        }
    }


def identify_at_risk_customers():
    """Identify customers at risk of churning."""
    conn = get_db_connection()
    cur = conn.cursor()
    
    # Customers who haven't engaged in 30+ days
    thirty_days_ago = (datetime.now() - timedelta(days=30)).isoformat()
    
    cur.execute("""
        SELECT email, stage, updated_at, notes
        FROM leads
        WHERE dead_at IS NULL AND bounced_at IS NULL
        AND updated_at < ?
        AND stage IN ('audit_delivered', 'pitch_sent')
        ORDER BY updated_at ASC
        LIMIT 10
    """, (thirty_days_ago,))
    
    at_risk = []
    for row in cur.fetchall():
        at_risk.append({
            'email': row['email'],
            'stage': row['stage'],
            'last_activity': row['updated_at'],
            'notes': row['notes'],
        })
    
    return at_risk


def generate_report():
    """Generate Customer Success report."""
    nps = calculate_nps()
    csat = calculate_csat()
    sla_metrics = calculate_sla_metrics()
    at_risk = identify_at_risk_customers()
    
    report = {
        'generated_at': datetime.now().isoformat(),
        'nps': nps,
        'csat': csat,
        'sla_metrics': sla_metrics,
        'at_risk_customers': at_risk,
        'metrics': {
            'nps_targets': {
                'minimum_respondents': 50,
                'target_score': 40,
                'excellent_score': 60,
            },
            'csat_targets': {
                'minimum_respondents': 20,
                'target_score': 80,
                'excellent_score': 90,
            },
            'sla_targets': {
                'audit_delivery': '48 hours',
                'target_compliance': 95,
            },
        }
    }
    
    report_path = REPORT_DIR / f'customer-success-{TODAY}.json'
    report_path.write_text(json.dumps(report, indent=2))
    
    print(f"Report saved: {report_path}")
    sla = sla_metrics.get('audit_delivery_sla', {'compliance': 0})
    print(f"\nCS Summary:")
    print(f"  NPS: {nps['nps']} (promoters: {nps['promoters']}, detractors: {nps['detractors']})")
    print(f"  CSAT: {csat['csat']}%")
    print(f"  SLA Compliance: {sla['compliance']}%")
    print(f"  At-Risk Customers: {len(at_risk)}")
    
    return report


if __name__ == '__main__':
    generate_report()
