#!/usr/bin/env python3
"""Publish Nebula build-in-public updates to WordPress.

Policy:
- Reads real git commits since the latest WordPress post.
- Publishes only when there is new shipped work.
- Never invents revenue or metrics.
- Uses WP-CLI inside the local WordPress Docker container.
"""
from __future__ import annotations

import argparse
import datetime as dt
import html
import json
import subprocess
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent
STATS = ROOT / "stats.json"
WP_CONTAINER = "blog-wordpress-1"
WP_PATH = "/var/www/html"

PUBLIC_HINTS = {
    "learning": "Learning Center",
    "sitemap": "Discoverability / sitemap",
    "linkedin": "LinkedIn engine",
    "founder": "Founder second-brain",
    "nurture": "Nurture engine",
    "trigger": "Trigger-aware pipeline",
    "lead": "Lead engine",
    "audit": "Audit delivery",
}


def run(cmd: list[str], *, cwd: Path = ROOT, input_text: str | None = None) -> str:
    p = subprocess.run(cmd, cwd=cwd, input=input_text, text=True, capture_output=True, check=True)
    return p.stdout.strip()


def wp(args: list[str], *, input_file: Path | None = None) -> str:
    cmd = ["docker", "exec", "-i", "-u", "www-data", WP_CONTAINER, "wp", *args, f"--path={WP_PATH}"]
    if input_file:
        with input_file.open("r") as f:
            p = subprocess.run(cmd, stdin=f, text=True, capture_output=True, check=True)
    else:
        p = subprocess.run(cmd, text=True, capture_output=True, check=True)
    return p.stdout.strip()


def latest_wp_post_iso() -> dt.datetime:
    out = wp(["post", "list", "--post_type=post", "--post_status=publish", "--fields=post_date", "--format=csv", "--posts_per_page=1", "--orderby=date", "--order=DESC"])
    lines = [l.strip() for l in out.splitlines() if l.strip()]
    if len(lines) < 2:
        return dt.datetime.now(dt.timezone.utc) - dt.timedelta(days=1)
    # WP returns local/mysql style timestamp. Treat it as UTC for commit filtering; conservative enough.
    return dt.datetime.strptime(lines[1].strip().strip('"'), "%Y-%m-%d %H:%M:%S").replace(tzinfo=dt.timezone.utc)


def commits_since(since: dt.datetime) -> list[dict[str, str]]:
    since_arg = since.strftime("%Y-%m-%dT%H:%M:%SZ")
    raw = run(["git", "log", f"--since={since_arg}", "--pretty=format:%h%x1f%s%x1f%cI"])
    commits = []
    for line in raw.splitlines():
        parts = line.split("\x1f")
        if len(parts) == 3:
            commits.append({"sha": parts[0], "subject": parts[1], "date": parts[2]})
    return commits


def stats() -> dict:
    if not STATS.exists():
        return {"revenue": 0}
    return json.loads(STATS.read_text())


def classify(subject: str) -> str:
    s = subject.lower()
    for key, label in PUBLIC_HINTS.items():
        if key in s:
            return label
    return "Build system"


def post_body(commits: list[dict[str, str]], s: dict) -> str:
    groups: dict[str, list[dict[str, str]]] = {}
    for c in commits:
        groups.setdefault(classify(c["subject"]), []).append(c)

    shipped_rows = []
    for category, rows in groups.items():
        items = "".join(
            f"<li><code>{html.escape(c['sha'])}</code> — {html.escape(c['subject'])}</li>"
            for c in rows
        )
        shipped_rows.append(f"<h3>{html.escape(category)}</h3><ul>{items}</ul>")

    revenue = int(s.get("real_revenue", s.get("revenue", 0)) or 0)
    emails = int(s.get("emails_sent", 0) or 0)
    replies = int(s.get("replies", 0) or 0)
    audits = int(s.get("audits_delivered", 0) or 0)
    day = int(s.get("challenge_day", 0) or 0)
    now = dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%d %H:%M UTC")

    return f"""
<!-- wp:paragraph -->
<p><strong>Build-in-public update.</strong> This is the automatic operating log for shipped Nebula work since the last public post. No fake revenue. No vanity wins. Just what changed.</p>
<!-- /wp:paragraph -->

<!-- wp:heading --><h2 class="wp-block-heading">Scoreboard</h2><!-- /wp:heading -->
<!-- wp:table --><figure class="wp-block-table"><table><tbody>
<tr><td>Challenge day</td><td>Day {day}</td></tr>
<tr><td>Revenue</td><td>${revenue}</td></tr>
<tr><td>Emails sent</td><td>{emails}</td></tr>
<tr><td>Replies</td><td>{replies}</td></tr>
<tr><td>Audits delivered</td><td>{audits}</td></tr>
<tr><td>Generated at</td><td>{html.escape(now)}</td></tr>
</tbody></table></figure><!-- /wp:table -->

<!-- wp:heading --><h2 class="wp-block-heading">Shipped since last post</h2><!-- /wp:heading -->
{''.join(shipped_rows)}

<!-- wp:heading --><h2 class="wp-block-heading">Current constraint</h2><!-- /wp:heading -->
<!-- wp:paragraph --><p>The constraint is not whether the agent can build. The constraint is converting shipped systems into visible proof, distribution, and paid Fix Pack demand.</p><!-- /wp:paragraph -->

<!-- wp:heading --><h2 class="wp-block-heading">Next move</h2><!-- /wp:heading -->
<!-- wp:paragraph --><p>Keep turning every useful build into a public asset: learning page, audit proof, outreach angle, or offer improvement.</p><!-- /wp:paragraph -->

<!-- wp:paragraph --><p><a href="https://nebulacomponents.shop/learning-center/">Open the Learning Center</a> · <a href="https://nebulacomponents.shop/audit">Run the free audit</a></p><!-- /wp:paragraph -->
""".strip()


def publish(dry_run: bool = False) -> dict:
    since = latest_wp_post_iso()
    commits = commits_since(since)
    # Ignore this publisher's own housekeeping commits if they are the only changes.
    commits = [c for c in commits if "build-in-public" not in c["subject"].lower() or len(commits) > 1]
    if not commits:
        return {"published": False, "reason": "no_new_commits", "since": since.isoformat()}

    title = f"Build Log: {len(commits)} shipped changes since the last public update"
    slug = "build-log-" + dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%d-%H%M")
    body = post_body(commits, stats())
    if dry_run:
        return {"published": False, "dry_run": True, "title": title, "commits": commits, "body_chars": len(body)}

    with tempfile.NamedTemporaryFile("w", suffix=".html", delete=False) as f:
        f.write(body)
        tmp = Path(f.name)
    try:
        post_id = wp([
            "post", "create", "-", "--post_type=post", "--post_status=publish",
            f"--post_title={title}", f"--post_name={slug}", "--porcelain",
        ], input_file=tmp)
    finally:
        tmp.unlink(missing_ok=True)
    return {"published": True, "post_id": post_id, "title": title, "commit_count": len(commits)}


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    print(json.dumps(publish(dry_run=ap.parse_args().dry_run), indent=2))


if __name__ == "__main__":
    main()
