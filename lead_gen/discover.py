"""Hunter.io Discover API — find founders/decision-makers by domain seed.

Implements Stage 1 of the trigger-aware lead gen pipeline:
  Input: domain list (50–100 prospects)
  Output: email + name + job_title + confidence + company_size
  Storage: lead_state.db (prospects table)

Rate limit: 300 requests/day (enforced via local in-memory bucket).
Fail-closed: if rate-limited, skip discovery; don't burn through credits.
"""
import os
import json
import sqlite3
import time
from pathlib import Path
from datetime import datetime, timedelta

DB_PATH = Path(__file__).parent / "lead_state.db"
RATE_LIMIT_WINDOW = 86400  # 1 day
RATE_LIMIT_MAX = 300  # requests/day

# Local in-memory rate limiter
_rate_bucket = {"count": 0, "reset_at": time.time() + RATE_LIMIT_WINDOW}


def init_db():
    """Initialize lead_state.db with prospect + contact tables."""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # Prospects table: core entity
    c.execute("""
        CREATE TABLE IF NOT EXISTS prospects (
            prospect_id TEXT PRIMARY KEY,
            domain TEXT NOT NULL,
            company_name TEXT,
            company_size TEXT,
            intent_score INTEGER DEFAULT 0,
            status TEXT DEFAULT 'discovered',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # Contacts table: email + name + job_title
    c.execute("""
        CREATE TABLE IF NOT EXISTS contacts (
            contact_id TEXT PRIMARY KEY,
            prospect_id TEXT NOT NULL,
            email TEXT UNIQUE,
            first_name TEXT,
            last_name TEXT,
            job_title TEXT,
            confidence REAL,
            last_email_sent TIMESTAMP,
            reply_status TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(prospect_id) REFERENCES prospects(prospect_id)
        )
    """)
    
    conn.commit()
    conn.close()


def _check_rate_limit():
    """Enforce 300 requests/day. Returns True if under limit."""
    global _rate_bucket
    now = time.time()
    if now > _rate_bucket["reset_at"]:
        _rate_bucket = {"count": 0, "reset_at": now + RATE_LIMIT_WINDOW}
    
    if _rate_bucket["count"] >= RATE_LIMIT_MAX:
        return False
    
    _rate_bucket["count"] += 1
    return True


def discover_from_domains(domain_list: list[str], limit=5) -> dict:
    """Query Hunter.io for founders/decision-makers from seed domains.
    
    Args:
        domain_list: list of domains (e.g., ['acme.com', 'startup.io', ...])
        limit: max contacts per domain (typically 1–5 founders)
    
    Returns:
        {
            "discovered": [
                {
                    "prospect_id": "acme_founder1",
                    "domain": "acme.com",
                    "email": "alice@acme.com",
                    "first_name": "Alice",
                    "last_name": "Chen",
                    "job_title": "Co-Founder & CEO",
                    "confidence": 0.95,
                    "company_size": "11-50"
                },
                ...
            ],
            "rate_limited": False,
            "requests_remaining": 245
        }
    """
    import requests
    
    hunter_key = os.environ.get("HUNTER_KEY")
    if not hunter_key:
        raise ValueError("HUNTER_KEY not set in environment")
    
    init_db()
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    discovered = []
    rate_limited = False
    
    for domain in domain_list:
        if not _check_rate_limit():
            rate_limited = True
            break
        
        # Hunter.io Discover API: find people by domain + seniority
        url = "https://api.hunter.io/v2/domain-search"
        params = {
            "domain": domain,
            "limit": limit,
            "type": "personal",  # personal emails (not generic info@)
            "seniority": "founder,manager",  # founders + managers (decision-makers)
        }
        headers = {"Authorization": f"Bearer {hunter_key}"}
        
        try:
            resp = requests.get(url, params=params, headers=headers, timeout=10)
            resp.raise_for_status()
            data = resp.json()
        except Exception as e:
            print(f"[discover] Hunter.io error for {domain}: {e}")
            continue
        
        # Extract contacts
        for contact in data.get("data", {}).get("emails", []):
            prospect_id = f"{domain}_{contact.get('first_name', 'unknown').lower()}"
            email = contact.get("email")
            job_title = contact.get("position", "Founder/CEO")
            confidence = contact.get("confidence", 0.0)
            company_size = data.get("data", {}).get("company_size", "Unknown")
            
            # Store in DB
            try:
                c.execute("""
                    INSERT OR REPLACE INTO prospects (prospect_id, domain, company_name, company_size)
                    VALUES (?, ?, ?, ?)
                """, (prospect_id, domain, contact.get("company"), company_size))
                
                c.execute("""
                    INSERT OR REPLACE INTO contacts
                    (contact_id, prospect_id, email, first_name, last_name, job_title, confidence)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                """, (
                    f"{prospect_id}_{email}",
                    prospect_id,
                    email,
                    contact.get("first_name"),
                    contact.get("last_name"),
                    job_title,
                    confidence
                ))
                
                discovered.append({
                    "prospect_id": prospect_id,
                    "domain": domain,
                    "email": email,
                    "first_name": contact.get("first_name"),
                    "last_name": contact.get("last_name"),
                    "job_title": job_title,
                    "confidence": confidence,
                    "company_size": company_size,
                })
            except sqlite3.IntegrityError:
                pass  # Already exists, skip
    
    conn.commit()
    conn.close()
    
    return {
        "discovered": discovered,
        "rate_limited": rate_limited,
        "requests_remaining": RATE_LIMIT_MAX - _rate_bucket["count"],
    }


def list_prospects(status=None, limit=50) -> list[dict]:
    """List all discovered prospects from lead_state.db."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    
    if status:
        c.execute(
            "SELECT * FROM prospects WHERE status = ? LIMIT ?",
            (status, limit)
        )
    else:
        c.execute("SELECT * FROM prospects LIMIT ?", (limit,))
    
    rows = c.fetchall()
    conn.close()
    
    return [dict(row) for row in rows]


if __name__ == "__main__":
    # Example: discover from seed domains
    import sys
    domains = sys.argv[1:] or ["acme.com", "startup.io"]
    result = discover_from_domains(domains, limit=3)
    print(json.dumps(result, indent=2, default=str))
    print(f"\nProspects stored in {DB_PATH}")
    print(f"Total prospects: {len(list_prospects())}")
