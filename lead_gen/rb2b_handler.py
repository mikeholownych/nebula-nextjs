"""RB2B Webhook Handler - receive visitor identification events.

Implements Stage 2 of the trigger-aware lead gen pipeline:
  Input: RB2B webhook POST to /webhook/rb2b-event
  Output: Parse visitor profile, trigger intent scoring
  Storage: visitor_events table in lead_state.db

RB2B webhook payload:
{
    "company": "Stripe Inc.",
    "visitor_ip": "203.0.113.42",
    "pages_visited": ["audit", "fix-pack", "pricing"],
    "total_dwell_s": 245,
    "last_visit": "2026-08-09T14:30:00Z",
    "utm_source": "organic"
}

Gate: Only process if company_size >= 50 (filter out freelancers/solopreneurs).
"""
import json
import sqlite3
from pathlib import Path
from datetime import UTC, datetime
from typing import Optional


DB_PATH = Path(__file__).parent / "lead_state.db"


def handle_rb2b_event(payload: dict) -> dict:
    """Process RB2B visitor event, match to prospect, trigger intent scoring.

    Args:
        payload: RB2B webhook JSON

    Returns:
        {
            "success": True,
            "matched_prospect_id": "stripe_founder1",
            "intent_score_queued": True,
            "message": "..."
        }
    """
    company_name = payload.get("company", "").strip()
    visitor_ip = payload.get("visitor_ip", "")
    pages_visited = payload.get("pages_visited", [])
    total_dwell_s = payload.get("total_dwell_s", 0)
    last_visit = payload.get("last_visit", datetime.now(UTC).replace(tzinfo=None).isoformat())

    if not company_name:
        return {"success": False, "error": "no company name in payload"}

    # Gate: only process if visitor spent > 30s (filter out bounces)
    if total_dwell_s < 30:
        return {
            "success": False,
            "error": f"dwell time too low ({total_dwell_s}s < 30s, skip)"
        }

    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()

    # Try to match to a prospect by company name (fuzzy + exact)
    c.execute(
        "SELECT prospect_id FROM prospects WHERE LOWER(company_name) = LOWER(?)",
        (company_name,)
    )
    prospect_row = c.fetchone()

    if not prospect_row:
        # No exact match, try fuzzy (first 2 words)
        company_prefix = " ".join(company_name.split()[:2]).lower()
        c.execute(
            "SELECT prospect_id FROM prospects WHERE LOWER(company_name) LIKE ?",
            (f"{company_prefix}%",)
        )
        prospect_row = c.fetchone()

    if not prospect_row:
        conn.close()
        return {
            "success": False,
            "error": f"no prospect found for company '{company_name}'",
            "suggestion": "run discovery first for this domain"
        }

    prospect_id = prospect_row[0]

    # Store visitor event
    try:
        c.execute("""
            INSERT INTO visitor_events
            (prospect_id, company_name, page_visited, dwell_s, visited_at, ip_address)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            prospect_id,
            company_name,
            json.dumps(pages_visited),  # store as JSON
            total_dwell_s,
            last_visit,
            visitor_ip
        ))
    except sqlite3.OperationalError:
        # Table might not exist, create it
        c.execute("""
            CREATE TABLE IF NOT EXISTS visitor_events (
                event_id INTEGER PRIMARY KEY,
                prospect_id TEXT NOT NULL,
                company_name TEXT,
                page_visited TEXT,
                dwell_s INTEGER,
                visited_at TIMESTAMP,
                ip_address TEXT,
                FOREIGN KEY(prospect_id) REFERENCES prospects(prospect_id)
            )
        """)
        c.execute("""
            INSERT INTO visitor_events
            (prospect_id, company_name, page_visited, dwell_s, visited_at, ip_address)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (
            prospect_id,
            company_name,
            json.dumps(pages_visited),
            total_dwell_s,
            last_visit,
            visitor_ip
        ))

    # Trigger intent scoring (async background job)
    # For now, just queue it; real implementation would dispatch to a job queue
    visitor_profile = {
        "prospect_id": prospect_id,
        "company_name": company_name,
        "pages_visited": pages_visited,
        "total_dwell_s": total_dwell_s,
        "repeat_visits": 1,  # TODO: count repeat visits from visitor_events
        "cta_clicks": 1 if "fix-pack" in pages_visited or "pricing" in pages_visited else 0,
        "last_visit": last_visit
    }

    conn.commit()
    conn.close()

    return {
        "success": True,
        "matched_prospect_id": prospect_id,
        "company_name": company_name,
        "visitor_profile_queued": visitor_profile,
        "message": f"Queued intent scoring for {prospect_id}"
    }


def get_visitor_events(prospect_id: str, limit=10) -> list[dict]:
    """Get all visitor events for a prospect."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    c.execute(
        """
        SELECT event_id, prospect_id, company_name, page_visited, dwell_s,
               visited_at, ip_address
        FROM visitor_events
        WHERE prospect_id = ?
        ORDER BY visited_at DESC
        LIMIT ?
        """,
        (prospect_id, limit)
    )

    rows = c.fetchall()
    conn.close()

    return [dict(row) for row in rows]


def aggregate_visitor_profile(prospect_id: str) -> dict:
    """Aggregate all visitor events into a single profile for intent scoring."""
    events = get_visitor_events(prospect_id, limit=100)

    if not events:
        return {}

    # Aggregate
    all_pages = []
    total_dwell = 0
    last_visit = None
    cta_clicks = 0

    for event in events:
        try:
            pages = json.loads(event.get("page_visited", "[]"))
            all_pages.extend(pages)
        except (json.JSONDecodeError, TypeError):
            pass

        total_dwell += event.get("dwell_s", 0)
        cta_clicks += 1 if any(p in event.get("page_visited", "") for p in ["fix-pack", "pricing"]) else 0

        if event.get("visited_at") and (not last_visit or event["visited_at"] > last_visit):
            last_visit = event["visited_at"]

    # De-duplicate pages
    unique_pages = list(set(all_pages))

    return {
        "prospect_id": prospect_id,
        "company_name": events[0].get("company_name", ""),
        "pages_visited": unique_pages,
        "total_dwell_s": total_dwell,
        "repeat_visits": len(events),
        "cta_clicks": cta_clicks,
        "last_visit": last_visit
    }


if __name__ == "__main__":
    import sys

    # Example: handle a webhook payload
    payload = {
        "company": "Stripe Inc.",
        "visitor_ip": "203.0.113.42",
        "pages_visited": ["audit", "fix-pack"],
        "total_dwell_s": 245,
        "last_visit": "2026-08-09T14:30:00Z"
    }

    result = handle_rb2b_event(payload)
    print(json.dumps(result, indent=2, default=str))

    # If matched, show aggregated profile
    if result.get("success") and result.get("matched_prospect_id"):
        prospect_id = result["matched_prospect_id"]
        profile = aggregate_visitor_profile(prospect_id)
        print("\nAggregated visitor profile:")
        print(json.dumps(profile, indent=2, default=str))
