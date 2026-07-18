#!/usr/bin/env python3
"""Agent logging infrastructure for Nebula Components multi-agent fleet.

Adapted from Komputer Mechanic's Hermes Mission Control tutorial.
https://komputermechanic.com/tutorials/hermes-mission-control

SQLite schema for inter-agent communication and audit trail.
"""
import sqlite3
from pathlib import Path
from datetime import datetime, timedelta

DB_PATH = Path("/home/mike/nebula/agent-logs/agent-logs.db")
RETENTION_DAYS = 7

SCHEMA = """
CREATE TABLE IF NOT EXISTS agent_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp TEXT NOT NULL,
    agent TEXT NOT NULL,
    action TEXT NOT NULL,
    target TEXT,
    detail TEXT,
    status TEXT DEFAULT 'pending',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_agent_logs_timestamp ON agent_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_agent_logs_agent ON agent_logs(agent);
CREATE INDEX IF NOT EXISTS idx_agent_logs_status ON agent_logs(status);
"""

def init_db():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.executescript(SCHEMA)
    conn.close()
    print(f"✓ Initialized {DB_PATH}")

def prune_old():
    """Delete logs older than RETENTION_DAYS."""
    cutoff = (datetime.now() - timedelta(days=RETENTION_DAYS)).isoformat()
    conn = sqlite3.connect(DB_PATH)
    cur = conn.execute("DELETE FROM agent_logs WHERE timestamp < ?", (cutoff,))
    deleted = cur.rowcount
    conn.commit()
    conn.close()
    return deleted

def log(agent: str, action: str, target: str = None, detail: str = None, status: str = "pending"):
    """Insert a log entry."""
    conn = sqlite3.connect(DB_PATH)
    conn.execute(
        "INSERT INTO agent_logs (timestamp, agent, action, target, detail, status) VALUES (?, ?, ?, ?, ?, ?)",
        (datetime.now().isoformat(), agent, action, target, detail, status)
    )
    conn.commit()
    conn.close()

def get_pending(agent: str = None):
    """Get pending tasks, optionally filtered by agent."""
    conn = sqlite3.connect(DB_PATH)
    if agent:
        cur = conn.execute(
            "SELECT id, timestamp, agent, action, target, detail FROM agent_logs WHERE status = 'pending' AND agent = ? ORDER BY timestamp",
            (agent,)
        )
    else:
        cur = conn.execute(
            "SELECT id, timestamp, agent, action, target, detail FROM agent_logs WHERE status = 'pending' ORDER BY timestamp"
        )
    rows = cur.fetchall()
    conn.close()
    return rows

def mark_complete(log_id: int, status: str = "complete"):
    """Mark a task complete."""
    conn = sqlite3.connect(DB_PATH)
    conn.execute("UPDATE agent_logs SET status = ? WHERE id = ?", (status, log_id))
    conn.commit()
    conn.close()

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "prune":
        deleted = prune_old()
        print(f"✓ Pruned {deleted} old entries (>{RETENTION_DAYS} days)")
    else:
        init_db()
