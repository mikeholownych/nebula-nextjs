"""
Nebula Components MCP Server
Exposes audit capabilities as MCP tools for Claude Desktop, Hermes, and any MCP client.

Tools:
  run_audit(url)          - Run a full evidence-grade audit against a public URL
  get_audit(audit_id)     - Retrieve a completed audit by ID
  recent_audits(limit)    - List the most recent audits from the database
  compare_audits(url_a, url_b) - Run audits on two URLs and compare findings side by side

Run:
  python3 mcp_server.py                 (stdio - for Claude Desktop / Hermes MCP)
  python3 mcp_server.py --http          (HTTP/SSE on port 8002 - for remote MCP clients)

Usage in Claude Desktop (add to claude_desktop_config.json):
  {
    "mcpServers": {
      "nebula": {
        "command": "/home/mike/nebula/venv/bin/python3",
        "args": ["/home/mike/nebula/mcp_server.py"]
      }
    }
  }

Usage as HTTP server (for Hermes or remote agents):
  python3 mcp_server.py --http --port 8002
  # Add to Hermes: hermes mcp add nebula --url http://localhost:8002/sse
"""

import argparse
import atexit
import json
import os
import signal
import subprocess
import sys
from pathlib import Path

NEBULA_DIR = Path("/home/mike/nebula")
sys.path.insert(0, str(NEBULA_DIR / "venv" / "lib" / "python3.12" / "site-packages"))
sys.path.insert(0, str(NEBULA_DIR))

from dotenv import load_dotenv
load_dotenv(NEBULA_DIR / ".env")

from mcp.server.fastmcp import FastMCP
from posthog import Posthog
from posthog.mcp import instrument

mcp = FastMCP(
    "Nebula Audit Engine",
    instructions=(
        "Evidence-grade landing page audit tool. "
        "Measures headline, CTA, social proof, mobile, SEO, ad signals, and AI readiness. "
        "Every finding includes: measured value, required standard, delta, CSS selector, "
        "confidence level (definitive/high/contextual), and timestamp. "
        "Use run_audit to analyse any public URL. "
        "Use compare_audits to benchmark two pages head-to-head."
    ),
)

# ── PostHog MCP analytics ──────────────────────────────────────────────────────

_posthog_token = os.environ.get("POSTHOG_PROJECT_TOKEN", "")
_posthog_host = os.environ.get("POSTHOG_HOST", "https://us.i.posthog.com")

if not _posthog_token:
    print(
        "POSTHOG_PROJECT_TOKEN variable required by PostHog is missing or "
        "un-configured, this causes events to be silently missed. "
        "This error stops appearing once POSTHOG_PROJECT_TOKEN is configured",
        file=sys.stderr,
    )

posthog = Posthog(_posthog_token, host=_posthog_host)
analytics = instrument(mcp, posthog)

atexit.register(posthog.shutdown)
signal.signal(signal.SIGTERM, lambda *_: sys.exit(0))


# ── API Key rate limiting ──────────────────────────────────────────────────────
#
# Free (no key):  10 audit tool calls per IP per day
# Keyed (nbk_…):  quota enforced by the platform API key service
#
# The MCP server is stateless per-request; we validate against the platform
# API rather than re-implementing the quota logic here.

import collections, threading, time as _time

_FREE_DAILY_LIMIT = 10
_free_usage: dict[str, list[float]] = collections.defaultdict(list)  # ip → timestamps
_free_lock = threading.Lock()

def _check_free_quota(ip: str) -> bool:
    """Return True if the request is within free-tier limits."""
    now = _time.time()
    day_ago = now - 86400
    with _free_lock:
        _free_usage[ip] = [t for t in _free_usage[ip] if t > day_ago]
        if len(_free_usage[ip]) >= _FREE_DAILY_LIMIT:
            return False
        _free_usage[ip].append(now)
    return True


def _validate_api_key(raw_key: str) -> bool:
    """Validate a Bearer key against the platform API. Returns True if valid."""
    import urllib.request, json as _json
    try:
        req = urllib.request.Request(
            "http://127.0.0.1:8001/workspace/api-keys/validate",
            headers={"Authorization": f"Bearer {raw_key}"},
        )
        with urllib.request.urlopen(req, timeout=3) as resp:
            data = _json.loads(resp.read())
            return data.get("valid") is True
    except Exception:
        return False


def _auth_check(tool_name: str = "run_audit") -> str | None:
    """
    Check API key or free-tier quota.
    Returns None if allowed, or an error string if denied.
    FastMCP doesn't yet expose per-request headers in sync tools,
    so we read the NEBULA_API_KEY env var set by the client config,
    or fall back to free-tier IP limiting via a sentinel IP.
    """
    raw_key = os.environ.get("NEBULA_API_KEY", "").strip()
    if raw_key and raw_key.startswith("nbk_"):
        if _validate_api_key(raw_key):
            return None
        return (
            "Invalid or expired API key. "
            "Generate a key at https://nebulacomponents.com/workspace?tab=settings"
        )
    # Free tier - use process-level counter (one MCP server process per client)
    if _check_free_quota("default"):
        return None
    return (
        f"Free tier limit reached ({_FREE_DAILY_LIMIT} audits/day via MCP). "
        "Upgrade at https://nebulacomponents.com/pricing or set NEBULA_API_KEY."
    )


# ── Helpers ────────────────────────────────────────────────────────────────────

def _run_audit_engine(url: str) -> dict:
    """Invoke deliver_audit.py and return parsed JSON."""
    result = subprocess.run(
        [
            str(NEBULA_DIR / "venv" / "bin" / "python3"),
            str(NEBULA_DIR / "deliver_audit.py"),
            url,
            "mcp-agent@nebula.internal",
            "--json",
            "--dry-run",
        ],
        capture_output=True,
        text=True,
        timeout=120,
        cwd=str(NEBULA_DIR),
    )
    if result.returncode != 0:
        raise RuntimeError(f"Audit engine error: {result.stderr[:500]}")
    lines = result.stdout.strip().split("\n")
    for line in reversed(lines):
        if line.strip().startswith("{"):
            return json.loads(line)
    raise RuntimeError("No JSON output from audit engine")


def _format_finding(f: dict) -> str:
    """Format a single finding as readable text."""
    ev = f.get("evidence", {})
    lines = [
        f"**{f['label']}** [{f['quadrant'].replace('_', ' ')}]",
        f"  Issue:    {f['issue']}",
        f"  Fix:      {f['fix']}",
    ]
    if ev:
        lines += [
            f"  Measured: {ev.get('measured', '')}",
            f"  Required: {ev.get('required', '')}",
            f"  Delta:    {ev.get('delta', '')}",
        ]
        if ev.get("selector") and ev["selector"] != "N/A":
            lines.append(f"  Selector: {ev['selector']}")
        lines.append(f"  Confidence: {ev.get('confidence', '?')}")
    return "\n".join(lines)


def _format_audit(audit: dict, url: str) -> str:
    """Format a complete audit result as readable Markdown."""
    score = audit.get("score", audit.get("overall", "?"))
    grade = audit.get("grade", audit.get("overall_grade", "?"))
    findings = audit.get("opp_matrix", audit.get("findings", []))

    lines = [
        f"## Nebula Audit: {url}",
        f"**Score:** {score}/10  **Grade:** {grade}  **Findings:** {len(findings)}",
        "",
    ]
    for f in findings:
        lines.append(_format_finding(f))
        lines.append("")
    return "\n".join(lines)


# ── Tools ──────────────────────────────────────────────────────────────────────

@mcp.tool()
def run_audit(url: str) -> str:
    """
    Run an evidence-grade landing page audit against any public URL.

    Returns score (0–10), letter grade, and structured findings. Each finding
    includes the measured value, required standard, gap delta, CSS selector,
    and confidence level - so results are independently verifiable.

    Args:
        url: The public URL to audit (e.g. https://example.com/landing-page)
    """
    try:
        denied = _auth_check("run_audit")
        if denied:
            return f"⛔ {denied}"
        audit = _run_audit_engine(url)
        return _format_audit(audit, url)
    except Exception as e:
        return f"Audit failed for {url}: {e}"


@mcp.tool()
def compare_audits(url_a: str, url_b: str) -> str:
    """
    Audit two URLs and compare them side by side.

    Useful for benchmarking your page against a competitor's, or comparing
    two variants of the same page.

    Args:
        url_a: First URL to audit
        url_b: Second URL to audit (comparison target)
    """
    try:
        denied = _auth_check("compare_audits")
        if denied:
            return f"⛔ {denied}"
        audit_a = _run_audit_engine(url_a)
        audit_b = _run_audit_engine(url_b)

        score_a = audit_a.get("score", audit_a.get("overall", 0))
        score_b = audit_b.get("score", audit_b.get("overall", 0))
        grade_a = audit_a.get("grade", audit_a.get("overall_grade", "?"))
        grade_b = audit_b.get("grade", audit_b.get("overall_grade", "?"))
        findings_a = audit_a.get("opp_matrix", audit_a.get("findings", []))
        findings_b = audit_b.get("opp_matrix", audit_b.get("findings", []))

        winner = url_a if score_a >= score_b else url_b
        delta = abs(score_a - score_b)

        lines = [
            "## Nebula Comparative Audit",
            "",
            f"| | {url_a} | {url_b} |",
            "|---|---|---|",
            f"| **Score** | {score_a}/10 | {score_b}/10 |",
            f"| **Grade** | {grade_a} | {grade_b} |",
            f"| **Findings** | {len(findings_a)} | {len(findings_b)} |",
            "",
            f"**Winner:** {winner} (+{delta:.1f} pts)",
            "",
            f"### {url_a} - Findings",
        ]
        for f in findings_a:
            lines.append(_format_finding(f))
            lines.append("")
        lines += [f"### {url_b} - Findings"]
        for f in findings_b:
            lines.append(_format_finding(f))
            lines.append("")

        # Dimension-level comparison
        dims_a = audit_a.get("dimensions", {})
        dims_b = audit_b.get("dimensions", {})
        if dims_a and dims_b:
            lines += ["### Dimension Scores"]
            lines.append(f"| Dimension | {url_a} | {url_b} | Gap |")
            lines.append("|---|---|---|---|")
            all_dims = sorted(set(list(dims_a.keys()) + list(dims_b.keys())))
            for dim in all_dims:
                sa = dims_a.get(dim, {}).get("score", "–")
                sb = dims_b.get(dim, {}).get("score", "–")
                try:
                    gap = f"{float(sa) - float(sb):+.1f}"
                except (ValueError, TypeError):
                    gap = "–"
                lines.append(f"| {dim} | {sa} | {sb} | {gap} |")

        return "\n".join(lines)
    except Exception as e:
        return f"Comparison failed: {e}"


@mcp.tool()
def recent_audits(limit: int = 10) -> str:
    """
    List the most recent audits from the Nebula database.

    Returns URL, score, grade, status, and timestamp for each audit.

    Args:
        limit: Number of recent audits to return (default 10, max 50)
    """
    try:
        import asyncio
        import asyncpg

        limit = min(max(1, limit), 50)

        async def _fetch():
            pool = await asyncpg.create_pool(
                "postgresql://postgres@/nebula_audit?host=/var/run/postgresql&port=5433",
                min_size=1,
                max_size=2,
            )
            async with pool.acquire() as conn:
                rows = await conn.fetch(
                    """
                    SELECT url, score, grade, status, email, created_at, completed_at
                    FROM audits
                    ORDER BY created_at DESC
                    LIMIT $1
                    """,
                    limit,
                )
            await pool.close()
            return [dict(r) for r in rows]

        rows = asyncio.run(_fetch())
        if not rows:
            return "No audits found in database."

        lines = [f"## Recent Audits (last {len(rows)})", ""]
        for r in rows:
            score_str = f"{r['score'] / 10.0:.1f}" if r.get("score") is not None else "pending"
            grade_str = r.get("grade") or "–"
            created = str(r["created_at"])[:16]
            lines.append(
                f"- **{r['url']}** | Score: {score_str} | Grade: {grade_str} | "
                f"Status: {r['status']} | {created}"
            )
        return "\n".join(lines)
    except Exception as e:
        return f"Could not fetch recent audits: {e}"


@mcp.tool()
def get_audit(audit_id: str) -> str:
    """
    Retrieve a specific completed audit by its UUID.

    Args:
        audit_id: The UUID of the audit to retrieve
    """
    try:
        import asyncio
        import asyncpg
        from uuid import UUID

        audit_uuid = UUID(audit_id)

        async def _fetch():
            pool = await asyncpg.create_pool(
                "postgresql://postgres@/nebula_audit?host=/var/run/postgresql&port=5433",
                min_size=1,
                max_size=2,
            )
            async with pool.acquire() as conn:
                row = await conn.fetchrow(
                    """
                    SELECT id, url, score, grade, findings, status,
                           email, created_at, completed_at
                    FROM audits WHERE id = $1
                    """,
                    audit_uuid,
                )
            await pool.close()
            return dict(row) if row else None

        row = asyncio.run(_fetch())
        if not row:
            return f"Audit {audit_id} not found."

        findings = row.get("findings") or []
        if isinstance(findings, str):
            findings = json.loads(findings)

        score = (row["score"] / 10.0) if row.get("score") is not None else None
        lines = [
            f"## Audit: {row['url']}",
            f"**ID:** {audit_id}",
            f"**Score:** {score}/10  **Grade:** {row.get('grade', '–')}",
            f"**Status:** {row['status']}",
            f"**Created:** {str(row['created_at'])[:19]}",
            "",
            f"**Findings ({len(findings)}):**",
        ]
        for f in findings:
            lines.append(_format_finding(f))
            lines.append("")
        return "\n".join(lines)
    except ValueError:
        return f"Invalid audit ID format: {audit_id}"
    except Exception as e:
        return f"Could not retrieve audit: {e}"


@mcp.tool()
def get_fix_instructions(target: str) -> str:
    """
    Retrieve direct, actionable conversion and SEO fix instructions for autonomous AI coding agents.

    Accepts either a public URL (e.g. 'https://example.com') or an audit UUID.
    Returns prioritized conversion leaks, exact target DOM selectors, measured vs required evidence,
    remediation steps, and suggested replacement code snippets.

    Args:
        target: Target URL or audit UUID to get fix directives for.
    """
    try:
        denied = _auth_check("get_fix_instructions")
        if denied:
            return f"⛔ {denied}"

        import urllib.request, urllib.parse
        target_param = target.strip()

        if "/" not in target_param and len(target_param) >= 20:
            api_url = f"http://127.0.0.1:3000/api/v1/fixes/{target_param}?format=md"
        else:
            api_url = f"http://127.0.0.1:3000/api/v1/fixes?url={urllib.parse.quote(target_param)}&format=md"

        raw_key = os.environ.get("NEBULA_API_KEY", "").strip()
        headers = {"Accept": "text/markdown"}
        if raw_key:
            headers["Authorization"] = f"Bearer {raw_key}"

        req = urllib.request.Request(api_url, headers=headers)
        with urllib.request.urlopen(req, timeout=30) as resp:
            return resp.read().decode("utf-8")
    except Exception as e:
        return f"Failed to get fix instructions for {target}: {e}"


# ── Entry point ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Nebula MCP Server")
    parser.add_argument("--http", action="store_true", help="Run as HTTP/SSE server")
    parser.add_argument("--port", type=int, default=8002, help="HTTP port (default 8002)")
    parser.add_argument("--host", default="127.0.0.1", help="HTTP host (default 127.0.0.1)")
    args = parser.parse_args()

    if args.http:
        print(f"Starting Nebula MCP HTTP server on {args.host}:{args.port}", file=sys.stderr)
        # FastMCP reads host/port from its settings object
        mcp.settings.host = args.host
        mcp.settings.port = args.port
        # Allow requests coming through the Cloudflare Tunnel public hostname.
        # FastMCP's transport_security blocks any Host header not in allowed_hosts.
        from mcp.server.transport_security import TransportSecuritySettings
        mcp.settings.transport_security = TransportSecuritySettings(
            enable_dns_rebinding_protection=True,
            allowed_hosts=[
                "127.0.0.1",
                "127.0.0.1:*",
                "localhost",
                "localhost:*",
                "[::1]:*",
                "mcp.nebulacomponents.com",
                "mcp.nebulacomponents.com:443",
                "mcp.nebulacomponents.com",
                "mcp.nebulacomponents.com:443",
            ],
            allowed_origins=[
                "http://127.0.0.1:*",
                "http://localhost:*",
                "http://[::1]:*",
                "https://mcp.nebulacomponents.com",
                "https://mcp.nebulacomponents.com",
            ],
        )
        # streamable-http uses POST /mcp - compatible with Hermes mcp add --url
        mcp.run(transport="streamable-http")
    else:
        mcp.run(transport="stdio")
