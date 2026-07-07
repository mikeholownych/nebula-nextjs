#!/usr/bin/env python3
"""
daily_briefing.py — Morning Intelligence Aggregation
Reads Nebula's data sources and outputs a structured daily briefing.
Run at 8:30 AM UTC daily.
"""

import json
import os
import subprocess
import sys
from datetime import datetime, timezone

NEBULA_DIR = "/home/mike/nebula"
GOVERNANCE_DIR = os.path.join(NEBULA_DIR, "governance")

def read_json(path):
    """Read a JSON file or return empty dict."""
    try:
        with open(path) as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {}

def read_file(path):
    """Read a text file or return empty string."""
    try:
        with open(path) as f:
            return f.read().strip()
    except FileNotFoundError:
        return ""

def git_log(days=1):
    """Get recent commits."""
    try:
        result = subprocess.run(
            ["git", "log", f"--since={days} days ago", "--oneline", "--no-decorate"],
            capture_output=True, text=True, cwd=NEBULA_DIR, timeout=5
        )
        return result.stdout.strip()
    except Exception:
        return ""

class DailyBriefing:
    def __init__(self):
        self.date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        self.sections = {}

    def check_pipeline(self):
        """Check pipeline health."""
        ph = read_json(os.path.join(NEBULA_DIR, "pipeline_health.json"))
        nw = read_json(os.path.join(NEBULA_DIR, "night_watch_report.json"))
        sre = read_json(os.path.join(NEBULA_DIR, "sre_state.json"))

        pipeline_ok = ph.get("healthy", None)
        total_contacted = nw.get("summary", {}).get("total_contacted", 0)
        sites_down = nw.get("summary", {}).get("sites_down", 0)
        stuck_leads = sre.get("failures", {}).get("Stuck leads detected", 0)
        sre_actions = sre.get("last_actions", [])

        self.sections["pipeline"] = {
            "healthy": pipeline_ok,
            "total_contacted": total_contacted,
            "sites_down": sites_down,
            "stuck_leads": stuck_leads,
            "sre_actions": sre_actions,
            "passed_checks": ph.get("passed", 0),
            "failed_checks": ph.get("failed", 0),
            "total_checks": ph.get("total", 0),
        }

    def check_revenue(self):
        """No API — manual check via economics doc."""
        eco = read_file(os.path.join(GOVERNANCE_DIR, "ECONOMICS.md"))
        mrr_line = [l for l in eco.split("\n") if "Total MRR" in l]
        self.sections["revenue"] = {
            "mrr": mrr_line[0].split("|")[-2].strip() if mrr_line else "Unknown",
            "note": "Revenue data requires Stripe dashboard check (no API key in file system)",
        }

    def check_infrastructure(self):
        """Check server and tunnel status."""
        # Check agentic server
        server_running = False
        try:
            result = subprocess.run(
                ["curl", "-s", "-o", "/dev/null", "-w", "%{http_code}", "--max-time", "3",
                 "http://localhost:8765/"],
                capture_output=True, text=True, timeout=5
            )
            server_running = result.stdout.strip() == "200"
        except Exception:
            pass

        # Check tunnel via tmux or process
        tunnel_proc = False
        try:
            result = subprocess.run(
                ["pgrep", "-f", "cloudflared"],
                capture_output=True, text=True, timeout=3
            )
            tunnel_proc = result.returncode == 0
        except Exception:
            pass

        self.sections["infrastructure"] = {
            "server_running": server_running,
            "tunnel_process_alive": tunnel_proc,
        }

    def check_experiments(self):
        """List active experiments."""
        exp_dir = os.path.join(GOVERNANCE_DIR, "EXPERIMENTS")
        experiments = []
        if os.path.exists(exp_dir):
            for f in sorted(os.listdir(exp_dir)):
                if f.startswith("EXP-") and f.endswith(".md"):
                    content = read_file(os.path.join(exp_dir, f))
                    status_line = [l for l in content.split("\n") if "Status:" in l]
                    status = status_line[0].split(":")[-1].strip() if status_line else "Unknown"
                    experiments.append({"file": f, "status": status})
        self.sections["experiments"] = {"active": experiments}

    def check_incidents(self):
        """List recent incidents."""
        inc_dir = os.path.join(GOVERNANCE_DIR, "INCIDENTS")
        incidents = []
        if os.path.exists(inc_dir):
            for f in sorted(os.listdir(inc_dir), reverse=True)[:5]:
                incidents.append(f)
        self.sections["incidents"] = {"recent": incidents}

    def check_git(self):
        """Recent git activity."""
        commits = git_log(days=1)
        commit_count = len([c for c in commits.split("\n") if c.strip()])
        self.sections["git"] = {
            "commits_today": commit_count,
            "recent": commits[:500] if commits else "None in last 24h",
        }

    def format_output(self):
        """Format the briefing for Telegram delivery."""
        out = []
        out.append(f"📋 **Daily Briefing — {self.date}**")
        out.append("")

        # Revenue
        rev = self.sections.get("revenue", {})
        out.append("**💰 Revenue**")
        out.append(f"  MRR: {rev.get('mrr', 'Unknown')}")
        out.append(f"  Note: {rev.get('note', '')}")
        out.append("")

        # Pipeline
        pl = self.sections.get("pipeline", {})
        health_icon = "🟢" if pl.get("healthy") else "🔴" if pl.get("healthy") is False else "⚪"
        out.append(f"**{health_icon} Pipeline Health**")
        out.append(f"  Status: {'PASS' if pl.get('healthy') else 'FAIL' if pl.get('healthy') is False else 'No data'}")
        out.append(f"  Checks: {pl.get('passed_checks', 0)}/{pl.get('total_checks', 0)} passed")
        out.append(f"  Stuck leads: {pl.get('stuck_leads', 0)}")
        out.append(f"  Total contacted: {pl.get('total_contacted', 0)}")
        out.append(f"  Sites down: {pl.get('sites_down', 0)}")
        if pl.get('sre_actions'):
            for a in pl['sre_actions'][:3]:
                out.append(f"  SRE: {a}")
        out.append("")

        # Infrastructure
        infra = self.sections.get("infrastructure", {})
        server_icon = "🟢" if infra.get("server_running") else "🔴"
        tunnel_icon = "🟢" if infra.get("tunnel_process_alive") else "🔴"
        out.append(f"**🖥 Infrastructure**")
        out.append(f"  Server: {server_icon} {'Running' if infra.get('server_running') else 'Down'}")
        out.append(f"  Tunnel: {tunnel_icon} {'Alive' if infra.get('tunnel_process_alive') else 'Dead'}")
        out.append("")

        # Experiments
        exp = self.sections.get("experiments", {})
        active_exps = exp.get("active", [])
        out.append(f"**🧪 Experiments ({len(active_exps)} active)**")
        if active_exps:
            for e in active_exps[:5]:
                out.append(f"  • {e['file']} — {e['status']}")
        else:
            out.append("  None active")
        out.append("")

        # Incidents
        inc = self.sections.get("incidents", {})
        recent_inc = inc.get("recent", [])
        if recent_inc:
            out.append(f"**⚠️ Recent Incidents ({len(recent_inc)})**")
            for i in recent_inc[:3]:
                out.append(f"  • {i}")
            out.append("")

        # Git
        git = self.sections.get("git", {})
        out.append(f"**📝 Git — {git.get('commits_today', 0)} commits in 24h**")
        recent_commits = git.get("recent", "")
        if recent_commits and recent_commits != "None in last 24h":
            lines = recent_commits.split("\n")[:5]
            for l in lines:
                if l.strip():
                    sha, _, msg = l.partition(" ")
                    out.append(f"  `{sha[:8]}` {msg[:60]}")
        else:
            out.append("  No commits in last 24h")
        out.append("")

        # Priority
        out.append("**🎯 Today's Priority**")
        eco = read_file(os.path.join(GOVERNANCE_DIR, "MISSION.md"))
        target_line = [l for l in eco.split("\n") if "Target" in l and "MRR" in l]
        out.append(f"  North star: $50k/mo MRR | Current: $0")
        out.append(f"  First paying customer is the critical path.")
        out.append(f"  Check triggers → deliver audit → convert to $97.")

        return "\n".join(out)

    def run(self):
        self.check_pipeline()
        self.check_revenue()
        self.check_infrastructure()
        self.check_experiments()
        self.check_incidents()
        self.check_git()
        return self.format_output()


if __name__ == "__main__":
    briefing = DailyBriefing()
    output = briefing.run()
    print(output)
