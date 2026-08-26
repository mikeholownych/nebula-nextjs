#!/usr/bin/env python3
"""
Data quality monitoring script.
Checks for missing values, duplicates, and schema violations.
"""
import sqlite3
from pathlib import Path
from datetime import datetime
import json

DB_PATHS = {
    'lead_store': Path('/home/mike/nebula/lead_store.db'),
    'lead_state': Path('/home/mike/nebula/lead_state.db'),
    'mailcheck': Path('/home/mike/nebula/mailcheck_beta.db'),
}

REPORT_DIR = Path('/home/mike/nebula/seo-reports')


def check_completeness(conn, table, required_fields):
    """Check for NULL values in required fields."""
    cur = conn.cursor()
    issues = []
    
    for field in required_fields:
        cur.execute(f"SELECT COUNT(*) FROM {table} WHERE {field} IS NULL")
        null_count = cur.fetchone()[0]
        if null_count > 0:
            issues.append({
                'type': 'completeness',
                'field': field,
                'null_count': null_count,
                'severity': 'high' if null_count > 10 else 'medium',
            })
    
    return issues


def check_uniqueness(conn, table, pk_field):
    """Check for duplicate primary keys."""
    cur = conn.cursor()
    cur.execute(f"SELECT {pk_field}, COUNT(*) as cnt FROM {table} GROUP BY {pk_field} HAVING COUNT(*) > 1")
    duplicates = cur.fetchall()
    
    return [{
        'type': 'duplicate',
        'field': pk_field,
        'count': len(duplicates),
        'severity': 'critical' if len(duplicates) > 0 else 'low',
    }]


def check_stage_transitions(conn):
    """Check for invalid stage transitions."""
    cur = conn.cursor()
    
    # Valid transitions
    valid_transitions = {
        'discovered': ['contacted', 'site_found', 'terminal'],
        'contacted': ['audit_delivered', 'terminal'],
        'site_found': ['audit_delivered', 'terminal'],
        'audit_delivered': ['pitch_sent', 'terminal'],
        'pitch_sent': ['warm', 'warm_replied', 'customer_97', 'terminal'],
        'warm': ['warm_replied', 'customer_97', 'pitch_sent', 'terminal'],
        'warm_replied': ['customer_97', 'pitch_sent', 'terminal'],
        'customer_97': ['customer_997', 'terminal'],
        'customer_997': ['subscriber_197', 'terminal'],
        'subscriber_197': ['customer_sdr', 'terminal'],
    }
    
    cur.execute("SELECT email, stage, updated_at FROM leads ORDER BY email, updated_at")
    leads = cur.fetchall()
    
    issues = []
    for email, stage, updated_at in leads:
        if stage not in valid_transitions:
            issues.append({
                'type': 'invalid_stage',
                'email': email,
                'stage': stage,
                'severity': 'medium',
            })
    
    return issues


def check_timestamps(conn):
    """Check for timestamp consistency."""
    cur = conn.cursor()
    
    # Check for dates in the future
    cur.execute("""
        SELECT email, discovered_at 
        FROM leads 
        WHERE discovered_at > datetime('now')
    """)
    future_dates = cur.fetchall()
    
    return [{
        'type': 'future_date',
        'count': len(future_dates),
        'severity': 'high' if len(future_dates) > 0 else 'low',
    }]


def run_data_quality_checks():
    """Run all data quality checks."""
    results = {
        'generated_at': datetime.now().isoformat(),
        'databases': {},
    }
    
    for name, path in DB_PATHS.items():
        if not path.exists():
            results['databases'][name] = {
                'status': 'missing',
                'path': str(path),
            }
            continue
        
        try:
            conn = sqlite3.connect(str(path))
            
            db_results = {
                'path': str(path),
                'tables': [],
                'issues': [],
            }
            
            cur = conn.cursor()
            cur.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")
            tables = [r[0] for r in cur.fetchall()]
            
            for table in tables:
                table_issues = []
                
                # Completeness check for leads table
                if table == 'leads':
                    required_fields = ['email', 'stage', 'discovered_at', 'updated_at']
                    completeness = check_completeness(conn, table, required_fields)
                    table_issues.extend(completeness)
                    
                    # Uniqueness check
                    uniqueness = check_uniqueness(conn, table, 'email')
                    table_issues.extend(uniqueness)
                    
                    # Stage transitions
                    transitions = check_stage_transitions(conn)
                    table_issues.extend(transitions)
                
                if table_issues:
                    db_results['issues'].append({
                        'table': table,
                        'issues': table_issues,
                    })
                
                db_results['tables'].append(table)
            
            conn.close()
            results['databases'][name] = db_results
            
        except Exception as e:
            results['databases'][name] = {
                'status': 'error',
                'error': str(e),
            }
    
    return results


def generate_report():
    """Generate data quality report."""
    results = run_data_quality_checks()
    
    # Calculate summary
    total_issues = 0
    critical_issues = 0
    high_issues = 0
    
    for db_name, db_data in results['databases'].items():
        if 'issues' in db_data:
            for issue_group in db_data['issues']:
                for issue in issue_group['issues']:
                    total_issues += 1
                    if issue['severity'] == 'critical':
                        critical_issues += 1
                    elif issue['severity'] == 'high':
                        high_issues += 1
    
    report = {
        'generated_at': results['generated_at'],
        'summary': {
            'total_issues': total_issues,
            'critical': critical_issues,
            'high': high_issues,
            'status': 'passing' if critical_issues == 0 else 'needs_attention',
        },
        'databases': results['databases'],
    }
    
    report_path = REPORT_DIR / f'data-quality-{datetime.now().strftime("%Y-%m-%d")}.json'
    report_path.write_text(json.dumps(report, indent=2))
    
    print(f"Report saved: {report_path}")
    print(f"\nData Quality Summary:")
    print(f"  Total Issues: {total_issues}")
    print(f"  Critical: {critical_issues}")
    print(f"  High: {high_issues}")
    print(f"  Status: {report['summary']['status']}")
    
    return report


if __name__ == '__main__':
    generate_report()
