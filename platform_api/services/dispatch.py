"""
Weekly dispatch service - builds and sends workspace activity summaries.
"""

import os
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional

import httpx

from platform_api.services.audit_db import audit_db

logger = logging.getLogger(__name__)


async def build_manifest(email: str, period_days: int = 7) -> Optional[dict]:
    """Build a dispatch manifest for the given workspace email.

    Returns None if below significance threshold (no material changes).
    """
    await audit_db.connect()
    cutoff = datetime.now(timezone.utc) - timedelta(days=period_days)

    async with audit_db.pool.acquire() as conn:
        # Score deltas: compare each audit completed in period to the previous audit for same URL
        recent_audits = await conn.fetch(
            """
            SELECT id, url, score, completed_at
            FROM audits
            WHERE email = $1 AND status = 'completed' AND completed_at >= $2
            ORDER BY completed_at DESC
            """,
            email, cutoff,
        )

        score_changes = []
        for a in recent_audits:
            prev = await conn.fetchrow(
                """
                SELECT score FROM audits
                WHERE email = $1 AND url = $2 AND status = 'completed'
                  AND completed_at < $3
                ORDER BY completed_at DESC LIMIT 1
                """,
                email, a["url"], a["completed_at"],
            )
            if prev and prev["score"] is not None and a["score"] is not None:
                old_score = prev["score"] / 10.0
                new_score = a["score"] / 10.0
                delta = round(new_score - old_score, 1)
                score_changes.append({
                    "url": a["url"],
                    "old_score": old_score,
                    "new_score": new_score,
                    "delta": delta,
                })

        # Recommendations completed in period
        recs_completed = await conn.fetchval(
            """
            SELECT count(*) FROM recommendations
            WHERE email = $1 AND status = 'done' AND updated_at >= $2
            """,
            email, cutoff,
        )

        # New recommendations in period
        recs_new_rows = await conn.fetch(
            """
            SELECT label, impact FROM recommendations
            WHERE email = $1 AND created_at >= $2
            ORDER BY impact DESC
            LIMIT 3
            """,
            email, cutoff,
        )
        recs_new_count = await conn.fetchval(
            """
            SELECT count(*) FROM recommendations
            WHERE email = $1 AND created_at >= $2
            """,
            email, cutoff,
        )

        # Monitor regressions in period
        monitor_alerts = await conn.fetch(
            """
            SELECT me.status, me.prev_score, me.new_score, me.summary, m.url
            FROM monitor_events me
            JOIN monitors m ON m.id = me.monitor_id
            WHERE m.email = $1 AND me.created_at >= $2
              AND me.status IN ('regressed', 'new_fail')
            ORDER BY me.created_at DESC
            """,
            email, cutoff,
        )

    # Significance check
    has_score_move = any(abs(sc["delta"]) >= 0.3 for sc in score_changes)
    has_new_recs = recs_new_count >= 2
    has_regression = len(monitor_alerts) > 0

    if not has_score_move and not has_new_recs and not has_regression:
        return None

    # Build summary sentence
    parts = []
    if score_changes:
        best = max(score_changes, key=lambda s: s["delta"])
        if best["delta"] > 0:
            parts.append(f"score improved +{best['delta']} on {best['url']}")
        else:
            worst = min(score_changes, key=lambda s: s["delta"])
            parts.append(f"score dropped {worst['delta']} on {worst['url']}")
    if recs_new_count:
        parts.append(f"{recs_new_count} new recommendation{'s' if recs_new_count != 1 else ''}")
    if monitor_alerts:
        parts.append(f"{len(monitor_alerts)} regression alert{'s' if len(monitor_alerts) != 1 else ''}")
    overall_summary = "This week: " + "; ".join(parts) + "." if parts else "No significant changes."

    return {
        "email": email,
        "period_days": period_days,
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "score_changes": score_changes,
        "recs_completed": recs_completed or 0,
        "recs_new": {
            "count": recs_new_count or 0,
            "top": [{"label": r["label"], "impact": float(r["impact"])} for r in recs_new_rows],
        },
        "monitor_alerts": [
            {
                "url": r["url"],
                "status": r["status"],
                "prev_score": float(r["prev_score"]) if r["prev_score"] else None,
                "new_score": float(r["new_score"]) if r["new_score"] else None,
                "summary": r["summary"],
            }
            for r in monitor_alerts
        ],
        "overall_summary": overall_summary,
    }


def _format_plaintext(manifest: dict) -> str:
    """Format manifest as clean plaintext email body."""
    lines = [
        "Nebula Weekly Dispatch",
        "=" * 40,
        "",
        manifest["overall_summary"],
        "",
    ]

    if manifest["score_changes"]:
        lines.append("Score Changes:")
        for sc in manifest["score_changes"]:
            direction = "+" if sc["delta"] > 0 else ""
            lines.append(f"  {sc['url']}: {sc['old_score']:.1f} -> {sc['new_score']:.1f} ({direction}{sc['delta']:.1f})")
        lines.append("")

    if manifest["monitor_alerts"]:
        lines.append("Monitor Alerts:")
        for alert in manifest["monitor_alerts"]:
            lines.append(f"  [{alert['status']}] {alert['url']}: {alert['summary']}")
        lines.append("")

    if manifest["recs_new"]["count"]:
        lines.append(f"New Recommendations ({manifest['recs_new']['count']}):")
        for rec in manifest["recs_new"]["top"]:
            lines.append(f"  - {rec['label']} (impact: {rec['impact']:.0f}/10)")
        lines.append("")

    if manifest["recs_completed"]:
        lines.append(f"Recommendations Completed: {manifest['recs_completed']}")
        lines.append("")

    lines.extend([
        "-" * 40,
        "View your workspace: https://nebulacomponents.com/workspace",
        "",
        "-- Nebula Components",
    ])

    return "\n".join(lines)


async def send_dispatch(email: str, manifest: dict) -> bool:
    """Send the dispatch email via SendGrid. Returns True on success."""
    api_key = os.environ.get("SENDGRID_API_KEY")
    if not api_key:
        logger.error("SENDGRID_API_KEY not set - dispatch not sent")
        return False

    text_body = _format_plaintext(manifest)
    subject = f"Nebula Weekly: {manifest['overall_summary'][:60]}"

    body = {
        "personalizations": [{"to": [{"email": email}]}],
        "from": {"email": "audits@nebulacomponents.shop", "name": "Nebula Components"},
        "subject": subject,
        "content": [{"type": "text/plain", "value": text_body}],
    }

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.post(
                "https://api.sendgrid.com/v3/mail/send",
                json=body,
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
            )
        if resp.status_code in (200, 201, 202):
            logger.info(f"Dispatch sent to {email}")
            return True
        logger.error(f"SendGrid returned {resp.status_code} for {email}")
        return False
    except httpx.HTTPError as exc:
        logger.error(f"SendGrid request failed for {email}: {exc}")
        return False
