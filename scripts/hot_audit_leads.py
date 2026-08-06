#!/usr/bin/env python3
"""Hot audit lead scanner — finds founders who ran a free audit, have a real
email (claimed/unlocked), a low score, and paid-traffic signal failures.

Qualifies → registers in lead_state.db (stage=audit_delivered) → prints a
Telegram-ready alert with a ready-to-send follow-up draft (Mike's template).
Sending stays approval-gated: Mike says "send", an agent sends via AgentMail.

Cron contract (no_agent): silent when no new hot leads; non-zero exit on error.

Run: venv/bin/python3 scripts/hot_audit_leads.py [--dry-run]
"""
import json
import os
import sqlite3
import sys
from datetime import datetime, timezone

REPO = "/home/mike/nebula"
LEAD_DB = os.path.join(REPO, "lead_state.db")
STATE_PATH = os.path.join(REPO, "ops", "hot_lead_alerts.json")
AUDIT_DSN = os.getenv(
    "AUDIT_DATABASE_URL",
    "postgresql://postgres@/nebula_audit?host=/var/run/postgresql&port=5433",
)

# Never alert on our own test/internal addresses
INTERNAL_PATTERNS = (
    "mike.holownych@",
    "@example.com",
    "@example.invalid",
    "@invalid.nebulacomponents.com",
    "qa-workspace-",
    "ux-audit-test@",
    "pending@example",
    "e2e-",
    ".test",  # reserved test TLD
)

SCORE_CEILING = 60  # 0-100 scale; below 6.0/10 = enough pain to be hot


def load_state() -> dict:
    try:
        with open(STATE_PATH) as f:
            return json.load(f)
    except FileNotFoundError:
        return {"alerted_audit_ids": []}


def save_state(state: dict) -> None:
    tmp = STATE_PATH + ".tmp"
    with open(tmp, "w") as f:
        json.dump(state, f, indent=1)
    os.rename(tmp, STATE_PATH)


def is_internal(email: str) -> bool:
    e = (email or "").lower()
    return any(p in e for p in INTERNAL_PATTERNS)


def lead_exists(email: str) -> bool:
    if not os.path.exists(LEAD_DB):
        return False
    conn = sqlite3.connect(LEAD_DB)
    try:
        cur = conn.execute("SELECT 1 FROM leads WHERE email = ? LIMIT 1", (email.lower(),))
        return cur.fetchone() is not None
    except sqlite3.OperationalError:
        return False
    finally:
        conn.close()


def register_lead(email: str, url: str, score10: float, grade: str) -> None:
    conn = sqlite3.connect(LEAD_DB)
    try:
        cols = [r[1] for r in conn.execute("PRAGMA table_info(leads)")]
        now = datetime.now(timezone.utc).isoformat()
        if "source_partner" not in cols:
            conn.execute("ALTER TABLE leads ADD COLUMN source_partner TEXT")
        conn.execute(
            """INSERT INTO leads
               (email, url, stage, source, trigger_context, audit_score, audit_grade,
                source_partner, discovered_at, updated_at)
               VALUES (?, ?, 'audit_delivered', 'organic_audit', 'hot_audit_lead', ?, ?, NULL, ?, ?)""",
            (email.lower(), url, score10, grade, now, now),
        )
        conn.commit()
    finally:
        conn.close()


def top_finding_oneliner(findings: list) -> str:
    if not findings:
        return "see the full report"
    best = max(findings, key=lambda f: f.get("impact") or 0)
    issue = (best.get("issue") or "").strip()
    return issue[:140] + ("…" if len(issue) > 140 else "")


def draft_email(url: str, score10: float, oneliner: str, audit_id: str) -> str:
    return (
        f"You ran an audit on {url}. Score: {score10:.1f}/10.\n\n"
        f"The biggest leak: {oneliner}\n\n"
        f"That's the fix I'd start with before spending another dollar on ads.\n\n"
        f"Your full report: https://nebulacomponents.com/audit/{audit_id}/results\n"
        f"If you want the #1 leak implemented for you: https://nebulacomponents.com/pricing"
    )


async def scan(dry_run: bool) -> list:
    import asyncpg

    state = load_state()
    alerted = set(state["alerted_audit_ids"])
    new_hot = []

    conn = await asyncpg.connect(AUDIT_DSN, timeout=10)
    try:
        rows = await conn.fetch(
            """SELECT id, email, url, score, grade, findings
               FROM audits
               WHERE status = 'completed'
                 AND score < $1
                 AND created_at > NOW() - INTERVAL '7 days'
               ORDER BY created_at DESC""",
            SCORE_CEILING,
        )
    finally:
        await conn.close()

    for r in rows:
        audit_id = str(r["id"])
        email = (r["email"] or "").lower()
        if audit_id in alerted or not email or email.startswith("anonymous+"):
            continue
        if is_internal(email):
            continue

        findings = r["findings"]
        if isinstance(findings, str):
            findings = json.loads(findings)
        findings = findings or []
        keys = {f.get("key") for f in findings}
        if "ad_signals" not in keys:
            continue  # no paid-traffic evidence → not the ICP trigger
        if lead_exists(email):
            continue

        score10 = round((r["score"] or 0) / 10.0, 1)
        oneliner = top_finding_oneliner(findings)
        new_hot.append({
            "audit_id": audit_id,
            "email": email,
            "url": r["url"],
            "score10": score10,
            "grade": r["grade"],
            "oneliner": oneliner,
        })

    if not dry_run and new_hot:
        for lead in new_hot:
            register_lead(lead["email"], lead["url"], lead["score10"], lead["grade"])
        state["alerted_audit_ids"] = sorted(alerted | {l["audit_id"] for l in new_hot})
        save_state(state)

    return new_hot


def main() -> int:
    dry_run = "--dry-run" in sys.argv
    import asyncio

    hot = asyncio.run(scan(dry_run))
    if dry_run:
        print(f"DRY RUN — {len(hot)} hot lead(s) would alert")
        for l in hot:
            print(f"  {l['email']} | {l['url']} | {l['score10']}/{l['grade']}")
        return 0

    for l in hot:
        print(f"🔥 HOT AUDIT LEAD — {l['email']}")
        print(f"URL: {l['url']} — score {l['score10']}/10 ({l['grade']})")
        print(f"Registered in lead_state.db (stage=audit_delivered). Draft ready to send:")
        print("---")
        print(draft_email(l["url"], l["score10"], l["oneliner"], l["audit_id"]))
        print("---")
        print("Reply 'send' to deliver via AgentMail.")
        print()
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as e:
        print(f"❌ hot_audit_leads failed: {e}", file=sys.stderr)
        sys.exit(1)
