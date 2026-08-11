"""Compose the weekly digest payload for one workspace user.

Compares completed audits from the last 7 days against the previous 7 days
(per URL), counts newly-critical findings (impact >= 8, matching the
workspace UI's "Critical" threshold), and picks the single highest-impact
open finding as the recommended action.

Returns None when the user has no audits at all - we never send an empty
digest.
"""

import os
from datetime import datetime, timedelta, timezone
from typing import Optional

import psycopg

AUDIT_CONNINFO = os.getenv(
    "AUDIT_CONNINFO",
    "host=/var/run/postgresql port=5433 dbname=nebula_audit user=postgres",
)

WORKSPACE_URL = "https://nebulacomponents.com/workspace"
CRITICAL_IMPACT = 8


def _critical_keys(findings) -> set:
    keys = set()
    for f in findings or []:
        if isinstance(f, dict) and (f.get("impact") or 0) >= CRITICAL_IMPACT:
            keys.add(f.get("key"))
    return keys


def build_digest_for_user(user_email: str) -> Optional[dict]:
    """Build the digest dict for a user, or None if they have no audits."""
    now = datetime.now(timezone.utc).replace(tzinfo=None)  # audits.created_at is naive
    week_start = now - timedelta(days=7)
    prev_week_start = now - timedelta(days=14)

    with psycopg.connect(AUDIT_CONNINFO) as conn:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT url, score, findings, created_at
                FROM audits
                WHERE email = %s AND status = 'completed'
                ORDER BY created_at ASC
                """,
                (user_email,),
            )
            rows = cur.fetchall()

    if not rows:
        return None

    # Latest completed audit per URL within each window.
    this_week: dict[str, dict] = {}
    last_week: dict[str, dict] = {}
    latest_overall: Optional[dict] = None

    for url, score, findings, created_at in rows:
        rec = {"url": url, "score": score, "findings": findings or [], "at": created_at}
        latest_overall = rec
        if created_at >= week_start:
            this_week[url] = rec
        elif created_at >= prev_week_start:
            last_week[url] = rec

    score_changes = []
    for url, rec in this_week.items():
        prev = last_week.get(url)
        old_score = prev["score"] if prev else None
        new_score = rec["score"]
        score_changes.append(
            {
                "url": url,
                "old_score": old_score,
                "new_score": new_score,
                "delta": (new_score - old_score) if old_score is not None else None,
            }
        )
    # Biggest movers first; brand-new pages (no prior score) last.
    score_changes.sort(
        key=lambda c: (c["delta"] is None, -(abs(c["delta"]) if c["delta"] is not None else 0))
    )

    new_critical_count = 0
    for url, rec in this_week.items():
        prev = last_week.get(url)
        prev_keys = _critical_keys(prev["findings"]) if prev else set()
        new_keys = _critical_keys(rec["findings"])
        new_critical_count += len(new_keys - prev_keys)

    top_action = None
    if latest_overall and latest_overall["findings"]:
        candidates = [f for f in latest_overall["findings"] if isinstance(f, dict)]
        if candidates:
            best = max(
                candidates,
                key=lambda f: ((f.get("impact") or 0), -(f.get("effort") or 0)),
            )
            top_action = {
                "label": best.get("label") or best.get("key") or "Top finding",
                "issue": best.get("issue") or "",
                "url": latest_overall["url"],
            }

    return {
        "email": user_email,
        "period": {
            "start": week_start.date().isoformat(),
            "end": now.date().isoformat(),
        },
        "score_changes": score_changes,
        "new_critical_count": new_critical_count,
        "top_action": top_action,
        "workspace_url": WORKSPACE_URL,
    }
