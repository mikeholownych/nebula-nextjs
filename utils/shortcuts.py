"""Shortcut router — maps /commands to workflows."""
import sys, json, logging
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from orchestrator import run_workflow

SHORTCUT_MAP = {
    "audit": "/home/mike/nebula/workflows/audit.yaml",
    "visibility": "/home/mike/nebula/workflows/visibility.yaml",
    "refresh": "/home/mike/nebula/workflows/refresh.yaml",
    "gap": "/home/mike/nebula/workflows/gap.yaml",
    "health": "/home/mike/nebula/workflows/health.yaml",
}

log = logging.getLogger("shortcuts")


def handle_shortcut(shortcut, site, target_url=None):
    wf = SHORTCUT_MAP.get(shortcut.lstrip("/"))
    if not wf:
        available = ", ".join(SHORTCUT_MAP.keys())
        return {"error": f"Unknown shortcut '{shortcut}'. Available: /{available}"}

    log.info("Shortcut /%s → workflow %s  site=%s url=%s", shortcut, wf, site, target_url)
    return run_workflow(wf, site, target_url)


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("shortcut", help="Shortcut name (e.g. audit, visibility, health)")
    parser.add_argument("site", help="Site name (directory under memory/sites/)")
    parser.add_argument("--url", help="Target URL for audit", default="")
    args = parser.parse_args()

    res = handle_shortcut(args.shortcut, args.site, args.url)
    print(json.dumps(res, indent=2, default=str))
