#!/usr/bin/env python3
"""
Migrate leads from lead_state.db to lead_store.db.
lead_store.db has the canonical schema (25 columns).
lead_state.db has 27 columns (includes notes, upsell_sent_at, source_partner).
"""
import sqlite3
from pathlib import Path

LEAD_STATE_PATH = Path('/home/mike/nebula/lead_state.db')
LEAD_STORE_PATH = Path('/home/mike/nebula/lead_store.db')

def get_source_connection():
    """Connect to lead_state.db (source)."""
    conn = sqlite3.connect(str(LEAD_STATE_PATH))
    conn.row_factory = sqlite3.Row
    return conn

def get_target_connection():
    """Connect to lead_store.db (target)."""
    conn = sqlite3.connect(str(LEAD_STORE_PATH))
    conn.row_factory = sqlite3.Row
    return conn

def migrate():
    """Migrate leads from source to target."""
    source = get_source_connection()
    source_cur = source.cursor()
    
    target = get_target_connection()
    target_cur = target.cursor()
    
    # Extract from lead_state.db
    source_cur.execute("""
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
    
    leads = source_cur.fetchall()
    print(f"Found {len(leads)} leads in lead_state.db")
    
    inserted = 0
    skipped = 0
    
    for lead in leads:
        lead_data = dict(lead)
        
        # Check if lead exists in target (email is PK)
        target_cur.execute(
            "SELECT email FROM leads WHERE email = ?", (lead_data['email'],)
        )
        
        if target_cur.fetchone():
            skipped += 1
            continue
        
        # Insert into lead_store.db
        target_cur.execute("""
            INSERT INTO leads (
                email, url, stage, source, trigger_context, vertical,
                audit_score, audit_grade, retry_count, error_info,
                discovered_at, site_found_at, contacted_at, audit_delivered_at,
                pitch_sent_at, paid_at, bounced_at, dead_at,
                needs_review_at, bounce_type, bounce_detail,
                lead_score, score_updated_at, updated_at, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
            lead_data.get('notes', ''),
        ))
        inserted += 1
    
    target.commit()
    
    print(f"Migrated: {inserted} inserted, {skipped} already existed")
    
    source.close()
    target.close()

if __name__ == '__main__':
    migrate()
