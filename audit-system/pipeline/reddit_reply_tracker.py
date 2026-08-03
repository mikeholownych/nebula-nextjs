#!/usr/bin/env python3
"""
pipeline/reddit_reply_tracker.py
Track manual Reddit replies against the 20-reply target.
Logs each reply with post URL, subreddit, and timestamp.
Usage:
  python3 reddit_reply_tracker.py log <reddit_post_url> <subreddit> [notes]
  python3 reddit_reply_tracker.py status
"""
import sys
import sqlite3
import datetime
import os

DB = os.path.expanduser("~/nebula/audit-system/pipeline/reddit_replies.db")

def init_db():
    with sqlite3.connect(DB) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS replies (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                post_url TEXT,
                subreddit TEXT,
                notes TEXT,
                replied_at TEXT DEFAULT (datetime('now')),
                got_response INTEGER DEFAULT 0,
                audit_requested INTEGER DEFAULT 0
            )
        """)
        conn.commit()

def log_reply(post_url, subreddit, notes=""):
    with sqlite3.connect(DB) as conn:
        conn.execute(
            "INSERT INTO replies (post_url, subreddit, notes) VALUES (?, ?, ?)",
            (post_url, subreddit, notes)
        )
        conn.commit()
        count = conn.execute("SELECT COUNT(*) FROM replies").fetchone()[0]
    print(f"✅ Logged reply #{count}/20")
    print(f"   URL: {post_url}")
    print(f"   Subreddit: r/{subreddit}")
    if count >= 20:
        print(f"\n🎯 TARGET REACHED: 20 replies sent. Measure conversion rate.")
    else:
        print(f"   {20 - count} remaining to hit target.")

def show_status():
    with sqlite3.connect(DB) as conn:
        total = conn.execute("SELECT COUNT(*) FROM replies").fetchone()[0]
        responses = conn.execute("SELECT COUNT(*) FROM replies WHERE got_response=1").fetchone()[0]
        audits = conn.execute("SELECT COUNT(*) FROM replies WHERE audit_requested=1").fetchone()[0]
        recent = conn.execute(
            "SELECT subreddit, post_url, replied_at, got_response, audit_requested FROM replies ORDER BY replied_at DESC LIMIT 10"
        ).fetchall()

    print(f"\n=== Reddit Reply Funnel ===")
    print(f"Replies sent:       {total}/20")
    print(f"Got response:       {responses} ({int(responses/total*100) if total else 0}%)")
    print(f"Audit requested:    {audits} ({int(audits/total*100) if total else 0}%)")
    print(f"\n--- Recent replies ---")
    for r in recent:
        sub, url, ts, resp, audit = r
        markers = []
        if resp: markers.append("💬 replied")
        if audit: markers.append("🔍 audit request")
        print(f"  r/{sub} | {ts[:16]} | {' '.join(markers) or 'pending'}")
        print(f"    {url[:80]}")

    if total < 20:
        print(f"\nTarget: 20 replies. {20 - total} to go.")
        print("Post to: r/PPC, r/Entrepreneur, r/SaaS, r/startups, r/googleads")
        print("Trigger: reply within 1hr of new post with specific audit question")

def mark_response(post_url, audit_requested=False):
    with sqlite3.connect(DB) as conn:
        conn.execute(
            "UPDATE replies SET got_response=1, audit_requested=? WHERE post_url=?",
            (1 if audit_requested else 0, post_url)
        )
        conn.commit()
    print(f"✅ Marked response for {post_url}")

if __name__ == "__main__":
    init_db()
    if len(sys.argv) < 2:
        show_status()
    elif sys.argv[1] == "log" and len(sys.argv) >= 4:
        log_reply(sys.argv[2], sys.argv[3], " ".join(sys.argv[4:]) if len(sys.argv) > 4 else "")
    elif sys.argv[1] == "status":
        show_status()
    elif sys.argv[1] == "response" and len(sys.argv) >= 3:
        mark_response(sys.argv[2], "--audit" in sys.argv)
    else:
        print("Usage:")
        print("  python3 reddit_reply_tracker.py status")
        print("  python3 reddit_reply_tracker.py log <post_url> <subreddit> [notes]")
        print("  python3 reddit_reply_tracker.py response <post_url> [--audit]")
