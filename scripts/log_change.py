#!/usr/bin/env python3
"""
Log a site change canonically to PostgreSQL acquisition_changes and update CHANGE_LOG.md.
"""

import argparse
from datetime import datetime, timezone
from pathlib import Path
import subprocess
import sys

from acquisition.experiments import generate_change_log_markdown, register_change

CHANGE_LOG_PATH = Path(__file__).parent.parent / "CHANGE_LOG.md"

COHORT_PAGES_MAP = {
    "teardown_index": "/teardowns",
    "individual_teardown": "/teardowns/airtable",
    "case_study": "/case-studies",
    "problem_intent": "/why-is-my-landing-page-not-converting",
    "commercial_comparison": "/vs/screaming-frog",
    "category": "/best-landing-page-audit-tools",
    "vertical_use_case": "/lead-generation-landing-page-audit",
    "product_core": "/",
    "checkout": "/checkout",
    "utility_legal": "/editorial-standards",
    "other": "/concepts",
}


def main():
    parser = argparse.ArgumentParser(description="Log a canonical site acquisition change")
    parser.add_argument("--change", required=True, help="Change summary / description")
    parser.add_argument("--cohort", required=True, help="Target cohort name")
    parser.add_argument("--pages", default="", help="Comma-separated page paths or URLs")
    parser.add_argument("--change-type", default="CONTENT", help="Change classification type")
    parser.add_argument("--commit", default="", help="Git commit SHA")
    parser.add_argument("--expected", default="neutral", choices=["positive", "neutral", "investigative", "defensive"])
    parser.add_argument("--actor-type", default="SYSTEM", choices=["HUMAN", "TERMINAL_AGENT", "AUTOMATION", "SYSTEM"])
    parser.add_argument("--logged-by", default="system", help="Operator or agent identity")

    args = parser.parse_args()

    commit_hash = args.commit
    if not commit_hash:
        try:
            res = subprocess.run(["git", "rev-parse", "HEAD"], capture_output=True, text=True, timeout=5)
            if res.returncode == 0:
                commit_hash = res.stdout.strip()
        except Exception:
            commit_hash = "unknown_commit"

    page_urls = [p.strip() for p in args.pages.split(",") if p.strip()] if args.pages else []
    if not page_urls and args.cohort in COHORT_PAGES_MAP:
        page_urls = [COHORT_PAGES_MAP[args.cohort]]

    now = datetime.now(timezone.utc)
    change_id = f"chg_{now.strftime('%Y%m%d_%H%M%S')}"

    # 1. Persist canonical record in PostgreSQL
    chg = register_change(
        change_id=change_id,
        change_type=args.change_type,
        summary=args.change,
        affected_page_urls=page_urls,
        affected_cohorts=[args.cohort],
        deployed_commit=commit_hash,
        expected_impact=args.expected,
        actor_type=args.actor_type,
        execution_status="DEPLOYED",
        deployed_at=now,
        logged_by=args.logged_by,
    )

    # 2. Regenerate CHANGE_LOG.md
    md_content = generate_change_log_markdown()
    CHANGE_LOG_PATH.write_text(md_content)

    print(f"Successfully registered change '{chg.id}' in PostgreSQL and regenerated CHANGE_LOG.md.")


if __name__ == "__main__":
    main()
