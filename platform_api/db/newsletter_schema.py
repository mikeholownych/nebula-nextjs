"""Newsletter Subscribers Table Schema

Create in lead_state.db:

```sql
CREATE TABLE newsletter_subscribers (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT,  -- founder, marketer, product, designer, developer, agency, other
  referrer TEXT,  -- utm_source, audit_id, page referrer
  subscribed_at TEXT NOT NULL,  -- ISO 8601
  unsubscribed_at TEXT,  -- ISO 8601 (NULL = currently subscribed)
  last_email_sent_at TEXT,  -- ISO 8601
  confirmation_sent_at TEXT,  -- ISO 8601
  confirmation_token TEXT,  -- For email verification
  is_confirmed BOOLEAN DEFAULT FALSE,
);

CREATE INDEX idx_newsletter_subscribers_email ON newsletter_subscribers(email);
CREATE INDEX idx_newsletter_subscribers_unsubscribed ON newsletter_subscribers(unsubscribed_at);
```

Usage:

1. POST /api/newsletter/subscribe
   → INSERT new subscriber
   → Send confirmation email (AgentMail)

2. GET /api/newsletter/subscribers/count
   → SELECT COUNT(*) FROM newsletter_subscribers WHERE unsubscribed_at IS NULL

3. POST /api/newsletter/unsubscribe?email=...
   → UPDATE newsletter_subscribers SET unsubscribed_at = now() WHERE email = ...

4. Cron job: Send weekly newsletter
   → SELECT * FROM newsletter_subscribers WHERE unsubscribed_at IS NULL AND is_confirmed = TRUE
   → Send email via AgentMail
   → UPDATE last_email_sent_at
"""

import sqlite3
from pathlib import Path


def create_newsletter_table(db_path: str = "/home/mike/nebula/platform_api/lead_state.db"):
    """Create newsletter_subscribers table if it doesn't exist."""
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    # Create table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS newsletter_subscribers (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE NOT NULL,
            role TEXT,
            referrer TEXT,
            subscribed_at TEXT NOT NULL,
            unsubscribed_at TEXT,
            last_email_sent_at TEXT,
            confirmation_sent_at TEXT,
            confirmation_token TEXT,
            is_confirmed BOOLEAN DEFAULT FALSE
        )
    """)
    
    # Create indexes
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_newsletter_email 
        ON newsletter_subscribers(email)
    """)
    
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_newsletter_unsubscribed 
        ON newsletter_subscribers(unsubscribed_at)
    """)
    
    conn.commit()
    conn.close()
    
    print("✓ Newsletter subscribers table created")


if __name__ == "__main__":
    create_newsletter_table()
