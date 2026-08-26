#!/usr/bin/env python3
"""
Migrate leads from SQLite (lead_state.db) to PostgreSQL (nebula_audit).
Idempotent - can be run multiple times safely.
"""
import sqlite3
import psycopg2
import sys
from pathlib import Path

# SQLite database
SQLITE_PATH = Path('/home/mike/nebula/lead_state.db')

# PostgreSQL connection
PG_HOST = '/var/run/postgresql'
PG_PORT = '5433'
PG_DB = 'nebula_audit'
PG_USER = 'postgres'

def get_postgres_connection():
    """Connect to nebula_audit PostgreSQL database."""
    return psycopg2.connect(
        host=PG_HOST,
        port=PG_PORT,
        database=PG_DB,
        user=PG_USER
    )

def get_sqlite_connection():
    """Connect to SQLite lead_state.db."""
    return sqlite3.connect(str(SQLITE_PATH))

def migrate_leads():
    """Migrate leads from SQLite to PostgreSQL."""
    sqlite_conn = get_sqlite_connection()
    sqlite_conn.row_factory = sqlite3.Row
    sqlite_cur = sqlite_conn.cursor()
    
    pg_conn = get_postgres_connection()
    pg_cur = pg_conn.cursor()
    
    # Extract leads from SQLite
    sqlite_cur.execute("""
        SELECT 
            email, url, stage, source, trigger_context, vertical,
            audit_score, audit_grade, retry_count, error_info,
            discovered_at, site_found_at, contacted_at, audit_delivered_at,
            pitch_sent_at, paid_at, bounced_at, dead_at,
            needs_review_at, bounce_type, bounce_detail,
            lead_score, score_updated_at, updated_at, notes,
            upsell_sent_at, source_partner
        FROM leads
    """)
    
    leads = sqlite_cur.fetchall()
    print(f"Found {len(leads)} leads in SQLite")
    
    inserted = 0
    updated = 0
    
    for lead in leads:
        lead_data = dict(lead)
        
        # Check if lead exists
        pg_cur.execute(
            "SELECT id FROM leads WHERE email = %s",
            (lead_data['email'],)
        )
        
        existing = pg_cur.fetchone()
        
        if existing:
            # Update existing lead
            pg_cur.execute("""
                UPDATE leads SET
                    url = %s,
                    stage = %s,
                    source = %s,
                    trigger_context = %s,
                    vertical = %s,
                    audit_score = %s,
                    audit_grade = %s,
                    retry_count = %s,
                    error_info = %s,
                    discovered_at = %s,
                    site_found_at = %s,
                    contacted_at = %s,
                    audit_delivered_at = %s,
                    pitch_sent_at = %s,
                    paid_at = %s,
                    bounced_at = %s,
                    dead_at = %s,
                    needs_review_at = %s,
                    bounce_type = %s,
                    bounce_detail = %s,
                    lead_score = %s,
                    score_updated_at = %s,
                    updated_at = %s,
                    notes = %s,
                    upsell_sent_at = %s,
                    source_partner = %s
                WHERE email = %s
            """, (
                lead_data['url'],
                lead_data['stage'],
                lead_data['source'],
                lead_data['trigger_context'],
                lead_data['vertical'],
                lead_data['audit_score'],
                lead_data['audit_grade'],
                lead_data['retry_count'],
                lead_data['error_info'],
                lead_data['discovered_at'],
                lead_data['site_found_at'],
                lead_data['contacted_at'],
                lead_data['audit_delivered_at'],
                lead_data['pitch_sent_at'],
                lead_data['paid_at'],
                lead_data['bounced_at'],
                lead_data['dead_at'],
                lead_data['needs_review_at'],
                lead_data['bounce_type'],
                lead_data['bounce_detail'],
                lead_data['lead_score'],
                lead_data['score_updated_at'],
                lead_data['updated_at'],
                lead_data['notes'],
                lead_data['upsell_sent_at'],
                lead_data['source_partner'],
                lead_data['email']
            ))
            updated += 1
        else:
            # Insert new lead
            pg_cur.execute("""
                INSERT INTO leads (
                    email, url, stage, source, trigger_context, vertical,
                    audit_score, audit_grade, retry_count, error_info,
                    discovered_at, site_found_at, contacted_at, audit_delivered_at,
                    pitch_sent_at, paid_at, bounced_at, dead_at,
                    needs_review_at, bounce_type, bounce_detail,
                    lead_score, score_updated_at, updated_at, notes,
                    upsell_sent_at, source_partner
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """, (
                lead_data['email'],
                lead_data['url'],
                lead_data['stage'],
                lead_data['source'],
                lead_data['trigger_context'],
                lead_data['vertical'],
                lead_data['audit_score'],
                lead_data['audit_grade'],
                lead_data['retry_count'],
                lead_data['error_info'],
                lead_data['discovered_at'],
                lead_data['site_found_at'],
                lead_data['contacted_at'],
                lead_data['audit_delivered_at'],
                lead_data['pitch_sent_at'],
                lead_data['paid_at'],
                lead_data['bounced_at'],
                lead_data['dead_at'],
                lead_data['needs_review_at'],
                lead_data['bounce_type'],
                lead_data['bounce_detail'],
                lead_data['lead_score'],
                lead_data['score_updated_at'],
                lead_data['updated_at'],
                lead_data['notes'],
                lead_data['upsell_sent_at'],
                lead_data['source_partner']
            ))
            inserted += 1
    
    pg_conn.commit()
    
    print(f"Migrated: {inserted} inserted, {updated} updated")
    
    sqlite_conn.close()
    pg_conn.close()

if __name__ == '__main__':
    try:
        migrate_leads()
    except psycopg2.Error as e:
        print(f"PostgreSQL error: {e}", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)
