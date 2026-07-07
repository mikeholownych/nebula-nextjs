#!/usr/bin/env python3
"""
notion_agent_link.py — Webhook endpoint for Notion Custom Agent integration.
Allows a Notion Agent to trigger a landing page audit by posting a URL.

Usage (called from Notion's HTTP tool):
  POST /notion/audit {"url": "https://example.com", "notion_db_id": "..."}
Response:
  {"status": "started", "audit_id": "...", "summary": "Audit queued"}

Depends on agentic_server.py running for the webhook listener.
"""

import json, os, sys, datetime, urllib.request, urllib.error
from pathlib import Path

NEBULA = Path("/home/mike/nebula")
LEADS_DB = NEBULA / "ledgers" / "leads.json"
AUDIT_QUEUE = NEBULA / "audit_queue.jsonl"

def queue_audit(url: str, source: str = "notion", notion_db_id: str = "") -> dict:
    """Add an audit job to the processing queue."""
    entry = {
        "url": url,
        "source": source,
        "notion_db_id": notion_db_id,
        "created_at": datetime.datetime.utcnow().isoformat() + "Z",
        "status": "queued",
    }
    AUDIT_QUEUE.parent.mkdir(parents=True, exist_ok=True)
    with open(AUDIT_QUEUE, "a") as f:
        f.write(json.dumps(entry) + "\n")
    
    # Also record in leads DB
    leads = {}
    if LEADS_DB.exists():
        leads = json.loads(LEADS_DB.read_text())
    
    email = f"notion-{hash(url)}@import.nebula"
    if email not in leads:
        leads[email] = {
            "email": email,
            "url": url,
            "stage": "audit_triggered",
            "source": "notion",
            "notion_db_id": notion_db_id,
            "created_at": entry["created_at"],
        }
        LEADS_DB.write_text(json.dumps(leads, indent=2))
    
    return {
        "status": "queued",
        "audit_id": f"audit-{hash(url)}",
        "email": email,
    }

def hook_handler(path: str, body: dict) -> dict:
    """Process incoming webhook from Notion."""
    url = body.get("url", "")
    if not url or not url.startswith(("http://", "https://")):
        return {"status": "error", "message": "Valid URL required"}
    
    result = queue_audit(
        url=url,
        source="notion",
        notion_db_id=body.get("notion_db_id", ""),
    )
    return {"status": "ok", **result}


if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "--register":
        # Print the handler registration info
        print("NOTION WEBHOOK ENDPOINT")
        print("  POST /notion/audit")
        print(f"  Server: http://localhost:8765")
        print(f"  Public: https://nebulacomponents.shop/notion/audit")
        print()
        print("Notion Agent Instructions:")
        print('  "When a new URL is added to the Landing Pages database,')
        print('   POST to https://nebulacomponents.shop/notion/audit')
        print('   with body: {"url": "https://...", "notion_db_id": "<db_id>"}')
        print('   Store the response audit_id in the row."')
