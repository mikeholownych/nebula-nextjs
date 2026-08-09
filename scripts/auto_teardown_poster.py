#!/usr/bin/env python3
"""Auto-generate LinkedIn teardown posts from new real audit data.

Scans the nebula_audit DB for recently completed audits with real emails
(opted-in via unlock), generates a data-driven LinkedIn post using the
actual findings, and appends it to ops/social_drip_queue.json.

Rules:
- Only audits with email (user unlocked = opted in to follow-up)
- Skip internal/test emails
- Skip if URL already has a queued/posted teardown
- Max 1 new post per run
- Uses LLM to generate post from real finding data
- Must reference at least one specific, measurable finding

Cron: daily 07:00 UTC (fires before the 14:00 drip)
"""
import json
import os
import re
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

NEBULA_DIR = Path("/home/mike/nebula")
sys.path.insert(0, str(NEBULA_DIR))

QUEUE_PATH = NEBULA_DIR / "ops" / "social_drip_queue.json"
POSTED_URLS_PATH = NEBULA_DIR / "ops" / "teardown_posted_urls.json"

INTERNAL_PATTERNS = (
    "mike.holownych@", "@example.com", "@invalid", "@nebulacomponents",
    "agency-pilot@", "audit@nebula", "reddit@reply", "test@",
    "qa-workspace", "e2e-", "verification@",
)

LINKEDIN_ACCOUNT_ID = "6a71436beb10586dadceb928"
BLUESKY_ACCOUNT_ID  = "6a716822eb10586dadd70840"


def is_internal(email: str) -> bool:
    e = (email or "").lower()
    return any(p in e for p in INTERNAL_PATTERNS)


def load_queue():
    if QUEUE_PATH.exists():
        return json.loads(QUEUE_PATH.read_text())
    return {"posted": {}, "queue": []}


def save_queue(q):
    tmp = str(QUEUE_PATH) + ".tmp"
    with open(tmp, "w") as f:
        json.dump(q, f, indent=1)
    os.rename(tmp, str(QUEUE_PATH))


def load_posted_urls() -> set:
    if POSTED_URLS_PATH.exists():
        return set(json.loads(POSTED_URLS_PATH.read_text()))
    return set()


def save_posted_urls(urls: set):
    tmp = str(POSTED_URLS_PATH) + ".tmp"
    with open(tmp, "w") as f:
        json.dump(sorted(urls), f)
    os.rename(tmp, str(POSTED_URLS_PATH))


def get_new_audits(limit=10):
    """Pull recent real-email audits from nebula_audit DB."""
    try:
        import psycopg2
        conn = psycopg2.connect(
            "postgresql://postgres@/nebula_audit?host=/var/run/postgresql&port=5433"
        )
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT url, score, grade, findings, email, created_at
                FROM audits
                WHERE status = 'completed'
                  AND email IS NOT NULL
                  AND email != ''
                  AND score < 80
                  AND created_at > now() - INTERVAL '30 days'
                ORDER BY created_at DESC
                LIMIT %s
                """,
                (limit,),
            )
            cols = [d[0] for d in cur.description]
            rows = [dict(zip(cols, row)) for row in cur.fetchall()]
        conn.close()
        return [r for r in rows if not is_internal(r.get("email", ""))]
    except Exception as e:
        print(f"DB error: {e}", file=sys.stderr)
        return []


def generate_post(url: str, score: float, grade: str, findings: list) -> str:
    """Generate a LinkedIn post from audit data using the LLM."""
    # Sort findings by impact
    top = sorted(findings, key=lambda f: -f.get("impact", 0))[:3]

    # Build a structured prompt for the LLM
    domain = re.sub(r"https?://|www\.", "", url.rstrip("/")).split("/")[0]
    findings_text = "\n".join(
        f"- {f.get('label','?')} (impact {f.get('impact',0)}/10): {f.get('issue','')[:120]}"
        for f in top
    )

    prompt = f"""Write a LinkedIn post in the style of Mike Holownych (founder of Nebula Components).

Style rules:
- Short punchy sentences. No fluff.
- Lead with ONE specific, measurable finding from the audit (not "the page has issues")
- Reference the domain name once naturally
- End with the audit CTA and URL in comments note
- No hashtags unless highly relevant
- Max 250 words
- Tone: analytical, honest, slightly deadpan
- DO NOT fabricate data — only use the findings below
- DO NOT say the page is "bad" or use subjective language
- Include specific numbers (score, character counts, payload size, etc.) where available

Audit data:
Domain: {domain}
Score: {score:.1f}/10 (Grade {grade})
Top findings:
{findings_text}

CTA line to include at end:
"Run the same audit on your page: https://nebulacomponents.com/audit?utm_source=linkedin&utm_medium=social&utm_campaign=auto-teardown"

Write only the post text. No preamble."""

    try:
        import boto3, json as _json
        client = boto3.client("bedrock-runtime", region_name="us-east-1")
        body = _json.dumps({
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 400,
            "messages": [{"role": "user", "content": prompt}],
        })
        resp = client.invoke_model(
            modelId="us.anthropic.claude-haiku-4-5-20251001-v1:0",
            body=body,
            contentType="application/json",
            accept="application/json",
        )
        result = _json.loads(resp["body"].read())
        return result["content"][0]["text"].strip()
    except Exception as e:
        # Fallback: template-based post
        top_f = top[0] if top else {}
        label = top_f.get("label", "conversion signal")
        issue = top_f.get("issue", "has measurable issues")[:100]
        return (
            f"Audited {domain}.\n\n"
            f"Score: {score:.1f}/10 (Grade {grade})\n\n"
            f"Top finding: {label} — {issue}\n\n"
            f"Run the same audit on your page: "
            f"https://nebulacomponents.com/audit?utm_source=linkedin&utm_medium=social&utm_campaign=auto-teardown\n\n"
            f"(URL in comments)"
        )


def main(dry_run=False):
    queue = load_queue()
    posted_urls = load_posted_urls()

    # Also check URLs already in the queue
    queued_urls = {
        item.get("url", "")
        for item in queue.get("queue", [])
    }

    audits = get_new_audits(limit=20)
    print(f"Found {len(audits)} candidate audit(s)")

    for audit in audits:
        url = audit["url"]
        # Skip if already have a post for this URL
        domain = re.sub(r"https?://|www\.", "", url.rstrip("/")).split("/")[0]
        if url in posted_urls or domain in posted_urls:
            continue
        # Skip if URL is already in queue (any form)
        if any(domain in q for q in queued_urls):
            continue

        findings = audit.get("findings", [])
        if isinstance(findings, str):
            import json as _json
            try:
                findings = _json.loads(findings)
            except Exception:
                findings = []

        if not findings:
            continue

        score = float(audit.get("score", 0)) / 10.0
        grade = audit.get("grade", "?")

        print(f"Generating post for {url} ({score:.1f}/10 {grade})...")
        post_content = generate_post(url, score, grade, findings)

        post_id = f"auto-teardown-{domain}-{datetime.now(timezone.utc).strftime('%Y%m%d')}"

        entry = {
            "id": post_id,
            "url": url,
            "content": post_content,
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "source": "auto_teardown",
        }

        if dry_run:
            print(f"\n[DRY RUN] Would queue:\n{post_content}\n")
        else:
            queue["queue"].append(entry)
            save_queue(queue)
            posted_urls.add(domain)
            save_posted_urls(posted_urls)
            print(f"✓ Queued post: {post_id}")

        # Only one post per run
        break
    else:
        print("No new audits to post about (all already covered or no findings)")


if __name__ == "__main__":
    dry_run = "--dry-run" in sys.argv
    main(dry_run=dry_run)
