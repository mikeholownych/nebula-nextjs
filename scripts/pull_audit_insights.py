#!/usr/bin/env python3
"""
pull_audit_insights.py — Extract content ideas from recent audit findings.

Usage:
    python3 scripts/pull_audit_insights.py --days 7 --limit 5
    python3 scripts/pull_audit_insights.py --output idea_bank.json

Extracts:
- Finding category (headline-clarity, cta-friction, message-match, social-proof)
- Finding observation (buyer pain in their words)
- Content angle (unique take)
- Working title (draft hook)
"""

import json
import argparse
from pathlib import Path
from datetime import datetime, timezone, timedelta
from collections import Counter

BASE = Path("/home/mike/nebula")
AUDITS_FILE = BASE / "ledgers" / "audits.jsonl"
OUTPUT_FILE = BASE / "idea_bank.json"


def load_recent_audits(days: int = 7) -> list:
    """Load audits from last N days."""
    if not AUDITS_FILE.exists():
        return []
    
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    audits = []
    
    for line in AUDITS_FILE.read_text().strip().split("\n"):
        if not line:
            continue
        try:
            audit = json.loads(line)
            ts_str = audit.get("created_at") or audit.get("timestamp")
            if ts_str:
                ts = datetime.fromisoformat(ts_str.replace("Z", "+00:00"))
                if ts >= cutoff:
                    audits.append(audit)
        except (json.JSONDecodeError, ValueError):
            continue
    
    return audits


def extract_findings(audits: list) -> list:
    """Extract findings from audits."""
    findings = []
    
    for audit in audits:
        audit_findings = audit.get("findings", [])
        url = audit.get("url", "unknown")
        audit_id = audit.get("id", "unknown")
        
        for finding in audit_findings:
            # Handle both dict and string findings
            if isinstance(finding, dict):
                findings.append({
                    "category": finding.get("category", "unknown"),
                    "severity": finding.get("severity", "medium"),
                    "observation": finding.get("observation", ""),
                    "url": url,
                    "audit_id": audit_id,
                })
            elif isinstance(finding, str):
                # Parse string format if needed
                findings.append({
                    "category": "unknown",
                    "severity": "medium",
                    "observation": finding,
                    "url": url,
                    "audit_id": audit_id,
                })
    
    return findings


def categorize_findings(findings: list) -> dict:
    """Group findings by category."""
    by_category = {}
    for f in findings:
        cat = f["category"] or "unknown"
        if cat not in by_category:
            by_category[cat] = []
        by_category[cat].append(f)
    
    return by_category


def generate_content_angle(finding: dict) -> dict:
    """Generate content angle from finding."""
    
    # Problem → angle mapping
    angles = {
        "headline-clarity": "Most founders write category descriptions. Their buyers want outcome promises.",
        "cta-friction": "Your CTA is visible. They just don't know what click commits them to.",
        "message-match": "Your ad promised X. Your headline is about Y. The disconnect kills conversions.",
        "social-proof": "Testimonials are decoration. Evidence requires hierarchy.",
    }
    
    # Problem → hook template
    hook_templates = {
        "headline-clarity": "Your headline says what it is. They're looking for what it does for them.",
        "cta-friction": "Your CTA is visible. Most founders don't know it's their biggest leak.",
        "message-match": "$[X] on ads. Your headline says something different. That's the bleed.",
        "social-proof": "5 testimonials on your page. None of them address the objection that kills your conversions.",
    }
    
    category = finding.get("category", "unknown")
    
    return {
        "finding": finding["observation"][:100] if finding.get("observation") else "No observation",
        "problem": category,
        "angle": angles.get(category, "Real buyer pain, but angle TBD"),
        "working_title": hook_templates.get(category, f"[{category}] Finding from {finding.get('url', 'audit')}"),
        "source_audit": finding.get("audit_id"),
        "source_url": finding.get("url"),
    }


def prioritize_by_severity(findings: list) -> list:
    """Sort findings by severity (high first)."""
    severity_order = {"high": 0, "medium": 1, "low": 2}
    return sorted(findings, key=lambda f: severity_order.get(f.get("severity", "medium"), 1))


def pull_insights(days: int = 7, limit: int = 5, output: Path | None = None) -> list:
    """Main function: pull N insights from last M days."""
    
    # Load audits
    audits = load_recent_audits(days=days)
    
    if not audits:
        print(f"No audits found in last {days} days")
        return []
    
    # Extract findings
    all_findings = extract_findings(audits)
    
    if not all_findings:
        print("No findings in recent audits")
        return []
    
    # Prioritize by severity
    prioritized = prioritize_by_severity(all_findings)
    
    # Category distribution
    cat_counts = Counter(f["category"] for f in prioritized)
    
    # Generate content ideas
    ideas = []
    for finding in prioritized[:limit]:
        idea = generate_content_angle(finding)
        ideas.append(idea)
    
    # Save to output file
    if output:
        output_data = {
            "pulled_at": datetime.now(timezone.utc).isoformat(),
            "days_covered": days,
            "audits_analyzed": len(audits),
            "findings_count": len(all_findings),
            "category_distribution": dict(cat_counts),
            "ideas": ideas,
        }
        output.write_text(json.dumps(output_data, indent=2))
        print(f"✅ Saved {len(ideas)} ideas to {output}")
    
    return ideas


def print_report(ideas: list):
    """Print formatted report."""
    print("\n" + "=" * 60)
    print("AUDIT-BASED CONTENT IDEAS")
    print(datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC"))
    print("=" * 60)
    
    for i, idea in enumerate(ideas, 1):
        print(f"\n{i}. [{idea['problem']}] {idea['working_title'][:60]}...")
        print(f"   Finding: {idea['finding'][:80]}...")
        print(f"   Angle: {idea['angle'][:80]}...")
        print(f"   Source: {idea['source_url']}")
    
    print("\n" + "=" * 60)


# CLI
if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Pull content ideas from audit findings")
    parser.add_argument("--days", type=int, default=7, help="Days to look back (default: 7)")
    parser.add_argument("--limit", type=int, default=5, help="Max ideas to return (default: 5)")
    parser.add_argument("--output", type=Path, default=None, help="Output JSON file")
    parser.add_argument("--quiet", action="store_true", help="Suppress report output")
    
    args = parser.parse_args()
    
    ideas = pull_insights(
        days=args.days,
        limit=args.limit,
        output=args.output or (OUTPUT_FILE if not args.quiet else None),
    )
    
    if not args.quiet:
        print_report(ideas)
