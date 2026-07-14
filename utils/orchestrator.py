"""Workflow orchestrator — loads YAML workflow, loads site memory, generates report."""
import sys, json, yaml, logging, datetime, traceback
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from site_registry import load_site_config, get_keywords, get_competitors, get_ai_queries

WORKFLOWS = Path("/home/mike/nebula/workflows")
REPORTS = Path("/home/mike/nebula/reports")
LOGS = Path("/home/mike/nebula/logs")
SITES = Path("/home/mike/nebula/memory/sites")

LOGS.mkdir(exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(LOGS / "orchestrator.log"),
        logging.StreamHandler(),
    ],
)
log = logging.getLogger("orchestrator")


def load_workflow(path):
    if not Path(path).is_file():
        # Try workflows dir
        path = WORKFLOWS / path
    with open(path) as f:
        return yaml.safe_load(f)


def run_workflow(workflow_path, site, target_url=None):
    started = datetime.datetime.now()
    wf = load_workflow(workflow_path)
    name = wf.get("name", "unknown")
    log.info("Starting workflow '%s' for site '%s'", name, site)

    # Load site context
    try:
        cfg = load_site_config(site)
        brand = cfg.get("brand_name", site)
    except FileNotFoundError:
        log.warning("No site-config.json for '%s', using defaults", site)
        cfg = {}
        brand = site

    kw = get_keywords(site)
    competitors = get_competitors(site)

    results = {"workflow": name, "site": site, "brand": brand, "started": started.isoformat(), "steps": [], "errors": []}

    for step in wf.get("steps", []):
        step_id = step["id"]
        skill = step["skill"]
        args = step.get("args", {})
        # Interpolate
        args_str = json.dumps(args).replace("{target_url}", target_url or "").replace("{site}", site)
        step_args = json.loads(args_str)
        log.info("  Step %s — skill: %s  args: %s", step_id, skill, step_args)
        results["steps"].append({"id": step_id, "skill": skill, "args": step_args, "status": "queued"})

        # Build step prompt
        prompt = f"""You are a specialized SEO agent. Run the `{skill}` skill for site `{site}` (brand: {brand}).

Site context:
- Target keywords: {', '.join(kw[:10])}
- Competitors: {', '.join(competitors)}
- Target URL: {target_url or 'N/A'}

Produce a concise report following the skill's methodology. Output markdown.
"""
        step_report = REPORTS / f"{step_id}_{datetime.date.today().isoformat()}.md"
        step_report.write_text(prompt)
        results["steps"][-1]["report"] = str(step_report)
        results["steps"][-1]["status"] = "prompt_ready"

    # Write consolidated report
    now = datetime.datetime.now()
    report_name = f"{name}_{now.strftime('%Y%m%d_%H%M%S')}.md"
    report_path = REPORTS / report_name

    lines = [f"# {name} — {brand}", f"", f"**Site:** {site}", f"**Run:** {now.isoformat()}"]
    if target_url:
        lines.append(f"**Target:** {target_url}")
    lines += [
        f"",
        f"## Summary",
        f"",
        f"- Steps: {len(results['steps'])}",
        f"- Keywords loaded: {len(kw)}",
        f"- Competitors: {', '.join(competitors)}",
        f"",
        f"## Step Results",
        f"",
    ]
    for s in results["steps"]:
        lines.append(f"### {s['id']} ({s['skill']})")
        lines.append(f"")
        lines.append(f"- Status: {s['status']}")
        lines.append(f"- Report: `{s.get('report', 'N/A')}`")
        lines.append(f"")

    report_path.write_text("\n".join(lines))
    results["report"] = str(report_path)

    elapsed = (datetime.datetime.now() - started).total_seconds()
    log.info("Workflow '%s' complete in %.1fs — report at %s", name, elapsed, report_path)
    return results


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("workflow", help="Workflow YAML path or name")
    parser.add_argument("site", help="Site name (directory under memory/sites/)")
    parser.add_argument("--url", help="Target URL for audit", default="")
    args = parser.parse_args()

    res = run_workflow(args.workflow, args.site, args.url)
    print(f"Result: {json.dumps(res, indent=2, default=str)}")
