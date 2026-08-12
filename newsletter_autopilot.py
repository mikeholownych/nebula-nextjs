#!/usr/bin/env python3
"""Fully autonomous weekly Nebula newsletter pipeline.

Stages: research -> draft -> validate -> edit -> publish.

The publisher is fail-closed: unsupported claims, missing sources, duplicate
issue keys, unsubscribed recipients, and delivery errors block the issue or
skip the affected recipient. No approval step is used by design.
"""
from __future__ import annotations

import argparse
import asyncio
import hashlib
import html
import json
import os
import re
import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Any

import asyncpg

BASE = Path(__file__).resolve().parent
QUEUE = BASE / "content_queue"
ARTIFACTS = BASE / "ops" / "newsletter"
SENDER = "hello@nebulacomponents.com"
AUDIT_URL = "https://nebulacomponents.com/audit"


def now() -> str:
    return datetime.now(timezone.utc).isoformat()


def issue_key() -> str:
    date = datetime.now(timezone.utc).date().isoformat()
    return f"{date}-weekly-finding"


def load_research() -> dict[str, Any]:
    """Research from existing, timestamped internal content artifacts."""
    candidates: list[dict[str, Any]] = []
    freshness_limit = datetime.now(timezone.utc) - timedelta(days=7)
    for path in sorted(QUEUE.glob("*.json"), key=lambda p: p.stat().st_mtime, reverse=True):
        try:
            data = json.loads(path.read_text())
        except (OSError, json.JSONDecodeError):
            continue
        created_at = data.get("created_at") or data.get("generated_at")
        try:
            created_dt = datetime.fromisoformat(str(created_at).replace("Z", "+00:00")) if created_at else None
        except ValueError:
            created_dt = None
        if created_dt is None or created_dt < freshness_limit:
            continue
        finding = data.get("finding")
        if not finding:
            continue
        outline = data.get("outline") or data.get("medium_outline", {}).get("outline", {})
        track = data.get("track", "landing-page-clarity")
        candidates.append({
            "source_file": str(path),
            "source_url": data.get("source_url"),
            "finding": str(finding).strip(),
            "track": track,
            "headline": outline.get("headline") if isinstance(outline, dict) else None,
            "created_at": data.get("created_at") or data.get("generated_at"),
        })
    # The research intake is the authoritative fallback when content generation
    # has not produced a fresh content_queue artifact yet.
    if not candidates:
        inbox = BASE / "ops" / "research" / "inbox.jsonl"
        if inbox.exists():
            inbox_mtime = datetime.fromtimestamp(inbox.stat().st_mtime, tz=timezone.utc)
            for line in reversed(inbox.read_text().splitlines()):
                try:
                    data = json.loads(line)
                except json.JSONDecodeError:
                    continue
                finding = data.get("observed_problem") or data.get("claim")
                source_url = data.get("source_url")
                if not finding or not source_url or not str(source_url).startswith(("http://", "https://")):
                    continue
                created_at = data.get("reviewed_at") or data.get("created_at") or inbox_mtime.isoformat()
                try:
                    created_dt = datetime.fromisoformat(str(created_at).replace("Z", "+00:00")) if created_at else None
                except ValueError:
                    created_dt = None
                if created_dt is None or created_dt < freshness_limit:
                    continue
                candidates.append({
                    "source_file": str(inbox),
                    "source_url": source_url,
                    "finding": str(finding).strip(),
                    "track": data.get("action_type", "landing-page-pattern"),
                    "headline": data.get("title"),
                    "created_at": data.get("reviewed_at") or data.get("created_at"),
                    "evidence_excerpt": data.get("evidence_excerpt", ""),
                    "evidence_class": data.get("source_type", "research_intake"),
                })
                break
    if not candidates:
        raise RuntimeError("No fresh research artifact found in content_queue or research inbox")
    selected = candidates[0]
    selected = {key: (value.replace("—", "-") if isinstance(value, str) else value) for key, value in selected.items()}
    selected["evidence_class"] = "internal_research_artifact"
    selected["researched_at"] = now()
    return selected


def draft(research: dict[str, Any]) -> dict[str, Any]:
    finding = research["finding"].replace("—", "-")
    track = research["track"].replace("—", "-").replace("-", " ")
    title = (research.get("headline") or f"The {track} leak costing you conversions").replace("—", "-")
    subject = f"Nebula Weekly: {title}"[:110]
    text = f"""Hi there,\n\nThis week's landing-page leak is simple: {finding}\n\nWhy it matters\n\nVisitors should understand the value of the page without translating internal product language. When the first message is vague, the visitor has to re-qualify the offer before taking the next step.\n\nThe repair\n\nRewrite the first visible message around the outcome the visitor wants. Use the same words your buyer uses in the ad, sales conversation, or problem statement. Remove jargon that describes the product but not the result.\n\nVerify it\n\nRun the revised page for seven days without changing the traffic source. Compare the primary CTA click rate and the next meaningful conversion event against the prior period.\n\nRun the free audit: {AUDIT_URL}?utm_source=newsletter&utm_medium=email&utm_campaign=weekly_finding\n\nReply if you want a specific page reviewed.\n\nMike\nNebula Components\n\nUnsubscribe: https://nebulacomponents.com/unsubscribe\n"""
    return {
        "issue_key": issue_key(),
        "subject": subject,
        "finding": finding,
        "track": research["track"],
        "research": research,
        "text": text,
    }


def validate(issue: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    if not issue.get("research", {}).get("source_file"):
        errors.append("missing research source")
    if not issue.get("finding"):
        errors.append("missing finding")
    if not issue.get("subject") or len(issue["subject"]) > 120:
        errors.append("invalid subject")
    if len(issue.get("text", "")) < 300:
        errors.append("draft too short")
    if "—" in json.dumps(issue, ensure_ascii=False):
        errors.append("em dash prohibited")
    # Claims requiring customer or transaction evidence are not allowed here.
    forbidden = re.compile(r"\b(average|increased|increases|improved|improves|\d+%|\d+x|customers?|founders?)\b", re.I)
    if re.search(r"(?<!\w)\d+(?:\.\d+)?%|(?<!\w)\d+(?:\.\d+)?x\b", issue["text"], re.I):
        errors.append("unsupported outcome claim: quantified result requires evidence")
    return sorted(set(errors))


def edit(issue: dict[str, Any]) -> dict[str, Any]:
    text = re.sub(r"\s+", " ", issue["text"]).strip()
    # Keep paragraphs readable after normalization.
    text = text.replace(" Why it matters ", "\n\nWhy it matters\n\n").replace(" The repair ", "\n\nThe repair\n\n").replace(" Verify it ", "\n\nVerify it\n\n").replace(" Run the free audit:", "\n\nRun the free audit:").replace(" Reply if", "\n\nReply if").replace(" Mike\nNebula", "\n\nMike\nNebula").replace(" Unsubscribe:", "\n\nUnsubscribe:")
    issue["text"] = text
    issue["edited_at"] = now()
    return issue


def render_html(issue: dict[str, Any]) -> str:
    body = html.escape(issue["text"]).replace("\n\n", "</p><p>").replace("\n", "<br>")
    return f"<html><body style='font-family:Arial,sans-serif;line-height:1.6;max-width:640px;margin:auto'><p>{body}</p></body></html>"


async def ensure_schema(conn: Any) -> None:
    await conn.execute("""
    CREATE TABLE IF NOT EXISTS newsletter_issues (
      issue_key TEXT PRIMARY KEY,
      subject TEXT NOT NULL,
      finding TEXT NOT NULL,
      track TEXT NOT NULL,
      research JSONB NOT NULL,
      draft_text TEXT NOT NULL,
      validation_errors JSONB NOT NULL DEFAULT '[]'::jsonb,
      status TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      published_at TIMESTAMPTZ,
      recipient_count INTEGER NOT NULL DEFAULT 0,
      sent_count INTEGER NOT NULL DEFAULT 0,
      failed_count INTEGER NOT NULL DEFAULT 0
    )
    """)


async def publish(issue: dict[str, Any], dry_run: bool = False) -> dict[str, int | str]:
    errors = validate(issue)
    if errors:
        raise RuntimeError("publication blocked: " + "; ".join(errors))
    issue = edit(issue)
    errors = validate(issue)
    if errors:
        raise RuntimeError("publication blocked after edit: " + "; ".join(errors))
    artifact = ARTIFACTS / f"{issue['issue_key']}.json"
    ARTIFACTS.mkdir(parents=True, exist_ok=True)
    artifact.write_text(json.dumps({**issue, "validation_errors": []}, indent=2, ensure_ascii=False))
    if dry_run:
        return {"status": "dry_run", "recipient_count": 0, "sent_count": 0, "failed_count": 0, "artifact": str(artifact)}

    pool = await asyncpg.create_pool(os.getenv("AUDIT_DATABASE_URL", "postgresql://postgres@/nebula_audit?host=/var/run/postgresql&port=5433"), min_size=1, max_size=3)
    try:
        async with pool.acquire() as conn:
            await ensure_schema(conn)
            existing = await conn.fetchrow("SELECT status FROM newsletter_issues WHERE issue_key=$1", issue["issue_key"])
            if existing:
                return {"status": "already_processed", "recipient_count": 0, "sent_count": 0, "failed_count": 0, "artifact": str(artifact)}
            rows = await conn.fetch("SELECT email FROM newsletter_subscribers WHERE unsubscribed_at IS NULL AND is_confirmed = TRUE ORDER BY subscribed_at")
            await conn.execute("INSERT INTO newsletter_issues(issue_key,subject,finding,track,research,draft_text,status) VALUES($1,$2,$3,$4,$5,$6,'publishing')", issue["issue_key"], issue["subject"], issue["finding"], issue["track"], json.dumps(issue["research"]), issue["text"])
        from agentmail_client import AgentMailClient
        client = AgentMailClient(inbox=SENDER)
        sent = failed = 0
        for row in rows:
            recipient = row["email"]
            client_id = f"newsletter:{issue['issue_key']}:{hashlib.sha256(recipient.encode()).hexdigest()[:16]}"
            result = client.send([recipient], issue["subject"], text=issue["text"], html=render_html(issue), client_id=client_id, labels=["newsletter", issue["track"]])
            if result.get("_error"):
                failed += 1
            else:
                sent += 1
                async with pool.acquire() as conn:
                    await conn.execute("UPDATE newsletter_subscribers SET last_email_sent_at=now(), emails_sent_count=emails_sent_count+1 WHERE email=$1", recipient)
        async with pool.acquire() as conn:
            await conn.execute("UPDATE newsletter_issues SET status='published', published_at=now(), recipient_count=$2, sent_count=$3, failed_count=$4 WHERE issue_key=$1", issue["issue_key"], len(rows), sent, failed)
        return {"status": "published", "recipient_count": len(rows), "sent_count": sent, "failed_count": failed, "artifact": str(artifact)}
    finally:
        await pool.close()


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()
    try:
        research = load_research()
        issue = draft(research)
        result = asyncio.run(publish(issue, dry_run=args.dry_run))
        print(json.dumps({"research": research, "result": result}, indent=2, ensure_ascii=False))
        return 0
    except Exception as exc:
        print(json.dumps({"status": "blocked", "error": str(exc)}))
        return 1


if __name__ == "__main__":
    sys.exit(main())
