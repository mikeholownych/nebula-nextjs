#!/usr/bin/env python3
"""
monitor_tracks.py — Daily tracking of nurture track metrics.

Run: python3 scripts/monitor_tracks.py

Outputs:
- Leads by track distribution
- Track position distribution
- Nurture sends by track (last 7 days)
- Template usage stats
"""

import json
from pathlib import Path
from datetime import datetime, timezone, timedelta
from collections import Counter, defaultdict

BASE = Path("/home/mike/nebula")
LEADS_FILE = BASE / "ledgers" / "leads.jsonl"
NURTURE_LOG = BASE / "ledgers" / "nurture_log.jsonl"


def load_jsonl(file_path: Path) -> list:
    """Load JSONL file into list of dicts."""
    if not file_path.exists():
        return []
    return [json.loads(line) for line in file_path.read_text().strip().split("\n") if line]


def analyze_leads_by_track():
    """Count leads by nurture track."""
    leads = load_jsonl(LEADS_FILE)
    
    # Group by email (latest record only)
    latest_by_email = {}
    for lead in leads:
        email = lead.get("email", "").lower()
        if email:
            latest_by_email[email] = lead
    
    # Count by track
    track_counts = Counter()
    for lead in latest_by_email.values():
        track = lead.get("nurture_track") or "unassigned"
        track_counts[track] += 1
    
    return track_counts, len(latest_by_email)


def analyze_track_positions():
    """Analyze track position distribution."""
    leads = load_jsonl(LEADS_FILE)
    
    # Group by email
    latest_by_email = {}
    for lead in leads:
        email = lead.get("email", "").lower()
        if email:
            latest_by_email[email] = lead
    
    # Group by track + position
    position_dist = defaultdict(Counter)
    for lead in latest_by_email.values():
        track = lead.get("nurture_track") or "unassigned"
        position = lead.get("track_position_days", 0)
        position_bucket = min(position // 7, 3)  # 0-6, 7-13, 14-20, 21+
        bucket_label = f"{position_bucket * 7}-{(position_bucket + 1) * 7 - 1}"
        position_dist[track][bucket_label] += 1
    
    return position_dist


def analyze_nurture_sends(days=7):
    """Analyze nurture sends by track over last N days."""
    nurture_log = load_jsonl(NURTURE_LOG)
    
    # Filter by date
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    recent_sends = []
    for entry in nurture_log:
        try:
            ts = datetime.fromisoformat(entry.get("timestamp", ""))
            if ts >= cutoff:
                recent_sends.append(entry)
        except (ValueError, TypeError):
            continue
    
    # Count by track
    sends_by_track = Counter()
    for entry in recent_sends:
        track = entry.get("track_id") or "legacy"
        sends_by_track[track] += 1
    
    return sends_by_track, len(recent_sends)


def analyze_template_usage(days=7):
    """Analyze which templates are being used."""
    nurture_log = load_jsonl(NURTURE_LOG)
    
    # Filter by date
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    recent_sends = []
    for entry in nurture_log:
        try:
            ts = datetime.fromisoformat(entry.get("timestamp", ""))
            if ts >= cutoff:
                recent_sends.append(entry)
        except (ValueError, TypeError):
            continue
    
    # Count subject line fingerprints (rough template proxy)
    subject_counts = Counter()
    for entry in recent_sends:
        subject = entry.get("subject", "")[:40]  # First 40 chars
        subject_counts[subject] += 1
    
    return subject_counts


def print_report():
    """Print monitoring report."""
    print("=" * 60)
    print("NURTURE TRACK METRICS")
    print(datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"))
    print("=" * 60)
    
    # Leads by track
    print("\n📊 LEADS BY TRACK")
    print("-" * 40)
    track_counts, total_leads = analyze_leads_by_track()
    for track, count in sorted(track_counts.items(), key=lambda x: -x[1]):
        pct = (count / total_leads * 100) if total_leads > 0 else 0
        bar = "█" * int(pct / 5)
        print(f"{track:20} {count:4} ({pct:5.1f}%) {bar}")
    print(f"{'TOTAL':20} {total_leads:4}")
    
    # Track positions
    print("\n📈 TRACK POSITION DISTRIBUTION")
    print("-" * 40)
    position_dist = analyze_track_positions()
    for track in sorted(position_dist.keys()):
        positions = position_dist[track]
        total = sum(positions.values())
        print(f"\n{track}:")
        for bucket in ["0-6", "7-13", "14-20", "21-27"]:
            count = positions.get(bucket, 0)
            pct = (count / total * 100) if total > 0 else 0
            bar = "░" * int(pct / 10)
            print(f"  {bucket:8} {count:3} ({pct:5.1f}%) {bar}")
    
    # Nurture sends
    print("\n📧 NURTURE SENDS (Last 7 Days)")
    print("-" * 40)
    sends_by_track, total_sends = analyze_nurture_sends(days=7)
    for track, count in sorted(sends_by_track.items(), key=lambda x: -x[1]):
        pct = (count / total_sends * 100) if total_sends > 0 else 0
        bar = "●" * min(count, 20)
        print(f"{track:20} {count:3} ({pct:5.1f}%) {bar}")
    print(f"{'TOTAL':20} {total_sends:3}")
    
    # Template usage
    print("\n📝 TOP TEMPLATE SUBJECTS (Last 7 Days)")
    print("-" * 40)
    subject_counts = analyze_template_usage(days=7)
    for subject, count in subject_counts.most_common(10):
        print(f"{count:3} × {subject}...")
    
    print("\n" + "=" * 60)


if __name__ == "__main__":
    print_report()
