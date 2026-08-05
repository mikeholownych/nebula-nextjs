"""Deliver a built digest via email (AgentMail) and optional Slack webhook.

Email goes through the existing AgentMailClient infrastructure (same path as
every other outbound platform email). Digests are account product mail for
signed-up users who control the digest_enabled preference, so they use the
transactional scope. A deterministic client_id per (ISO week, recipient)
gives provider-level idempotency on top of the cron's state file.
"""

import hashlib
import json
import urllib.request
import urllib.error
from datetime import datetime, timezone

ACCENT = "#00c2a0"


def _fmt_score(score) -> str:
    return "—" if score is None else f"{round(score)}"


def _fmt_delta(delta) -> str:
    if delta is None:
        return "new"
    sign = "+" if delta > 0 else ""
    return f"{sign}{round(delta)}"


def _score_rows_html(digest: dict) -> str:
    rows = ""
    for c in digest["score_changes"]:
        delta = c["delta"]
        color = "#2e9e5b" if (delta or 0) > 0 else ("#c0392b" if (delta or 0) < 0 else "#888")
        rows += f"""
        <tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #eee; word-break: break-all;">{c['url']}</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #eee; text-align: center;">{_fmt_score(c['old_score'])}</td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #eee; text-align: center;"><strong>{_fmt_score(c['new_score'])}</strong></td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #eee; text-align: center; color: {color}; font-weight: 600;">{_fmt_delta(delta)}</td>
        </tr>"""
    return rows


def _score_lines_text(digest: dict) -> str:
    lines = []
    for c in digest["score_changes"]:
        lines.append(
            f"- {c['url']}: {_fmt_score(c['old_score'])} → {_fmt_score(c['new_score'])} ({_fmt_delta(c['delta'])})"
        )
    return "\n".join(lines)


def build_email_bodies(digest: dict) -> tuple[str, str, str]:
    """Return (subject, text_body, html_body) for a digest."""
    n = len(digest["score_changes"])
    subject = f"Your landing page scores this week — {n} page{'s' if n != 1 else ''} tracked"

    top = digest.get("top_action")
    top_text = ""
    top_html = ""
    if top:
        top_text = f"\nTop recommended action:\n{top['label']} — {top['issue']}\n({top['url']})\n"
        top_html = f"""
        <div style="background: #f4faf8; border-left: 4px solid {ACCENT}; padding: 16px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 6px; color: #1a1a1a;">Top recommended action</h3>
            <p style="margin: 0;"><strong>{top['label']}</strong> — {top['issue']}</p>
            <p style="margin: 6px 0 0; color: #666; font-size: 0.85rem; word-break: break-all;">{top['url']}</p>
        </div>"""

    crit_text = ""
    crit_html = ""
    if digest.get("new_critical_count"):
        crit_text = f"\n⚠ {digest['new_critical_count']} new critical finding(s) this week.\n"
        crit_html = f"""
        <p style="color: #c0392b; font-weight: 600;">
            ⚠ {digest['new_critical_count']} new critical finding(s) this week.
        </p>"""

    if digest["score_changes"]:
        table_html = f"""
        <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
            <thead>
                <tr style="background: #f5f5f5;">
                    <th style="padding: 8px 12px; text-align: left;">Page</th>
                    <th style="padding: 8px 12px;">Last week</th>
                    <th style="padding: 8px 12px;">This week</th>
                    <th style="padding: 8px 12px;">Change</th>
                </tr>
            </thead>
            <tbody>{_score_rows_html(digest)}</tbody>
        </table>"""
        scores_text = _score_lines_text(digest)
    else:
        table_html = "<p>No completed audits in the last 7 days — your previous results are still in the workspace.</p>"
        scores_text = "No completed audits in the last 7 days."

    html = f"""
    <html>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
        <h1 style="font-size: 1.4rem;">Your landing page scores this week</h1>
        <p style="color: #666;">{digest['period']['start']} → {digest['period']['end']}</p>
        {crit_html}
        {table_html}
        {top_html}
        <p style="margin: 28px 0;">
            <a href="{digest['workspace_url']}"
               style="background: {ACCENT}; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                Open workspace
            </a>
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 2rem 0;">
        <p style="color: #999; font-size: 0.85rem;">
            Nebula Components — Conversion optimization for founders wasting money on ads.<br>
            You're receiving this because weekly digest is enabled in your workspace settings.<br>
            <a href="https://nebulacomponents.com/workspace" style="color: #999;">Manage preferences</a>
        </p>
    </body>
    </html>
    """

    text = f"""Your landing page scores this week ({digest['period']['start']} → {digest['period']['end']})
{crit_text}
{scores_text}
{top_text}
Open workspace: {digest['workspace_url']}

--
Nebula Components — weekly digest (disable in workspace settings)
""".strip()

    return subject, text, html


def send_email_digest(digest: dict, dry_run: bool = False) -> dict:
    """Send the digest email via the existing AgentMail infrastructure."""
    subject, text, html = build_email_bodies(digest)
    if dry_run:
        print(f"[dry-run] EMAIL to {digest['email']}\n  subject: {subject}")
        return {"status": "dry-run", "subject": subject}

    from agentmail_client import AgentMailClient

    week_iso = f"{datetime.now(timezone.utc).isocalendar().year}W{datetime.now(timezone.utc).isocalendar().week:02d}"
    seed = f"digest:{week_iso}:{digest['email'].strip().lower()}"
    client_id = f"txn:{hashlib.sha256(seed.encode()).hexdigest()[:24]}"

    result = AgentMailClient().send_transactional(
        to=[digest["email"]],
        subject=subject,
        text=text,
        html=html,
        client_id=client_id,
    )
    return {
        "status": "failed" if result.get("_error") else "sent",
        "message_id": result.get("message_id") or result.get("id"),
        "error": result.get("_reason") or result.get("_error"),
    }


def send_slack_digest(webhook_url: str, digest: dict, dry_run: bool = False) -> dict:
    """POST a compact Block Kit message to the user's Slack webhook."""
    top = digest.get("top_action")
    lines = []
    for c in digest["score_changes"]:
        lines.append(
            f"• {c['url']}: {_fmt_score(c['old_score'])} → *{_fmt_score(c['new_score'])}* ({_fmt_delta(c['delta'])})"
        )
    scores_md = "\n".join(lines) if lines else "No completed audits in the last 7 days."
    crit_md = (
        f"\n:warning: *{digest['new_critical_count']} new critical finding(s) this week.*"
        if digest.get("new_critical_count")
        else ""
    )
    top_md = f"\n*Top action:* {top['label']} — {top['issue']}" if top else ""

    payload = {
        "blocks": [
            {
                "type": "header",
                "text": {
                    "type": "plain_text",
                    "text": "Your landing page scores this week",
                },
            },
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"_{digest['period']['start']} → {digest['period']['end']}_{crit_md}\n\n{scores_md}{top_md}",
                },
            },
            {
                "type": "actions",
                "elements": [
                    {
                        "type": "button",
                        "text": {"type": "plain_text", "text": "Open workspace"},
                        "url": digest["workspace_url"],
                        "style": "primary",
                    }
                ],
            },
        ]
    }

    if dry_run:
        print(f"[dry-run] SLACK to {webhook_url[:40]}… ({len(lines)} score rows)")
        return {"status": "dry-run"}

    req = urllib.request.Request(
        webhook_url,
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            ok = 200 <= resp.status < 300
            return {"status": "sent" if ok else "failed", "error": None if ok else f"http_{resp.status}"}
    except urllib.error.HTTPError as e:
        return {"status": "failed", "error": f"http_{e.code}"}
    except Exception as e:
        return {"status": "failed", "error": str(e)}
