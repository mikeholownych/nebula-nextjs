#!/usr/bin/env python3
"""Run the imported 42-skill SDR Desk through Nebula's bounded kanban loop."""
import argparse, hashlib, json, subprocess, sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1] / "growth_system" / "sdr_desk"
MANIFEST = ROOT / "manifest.json"

def load():
    return json.loads(MANIFEST.read_text())

def cmd_create(skill, rendered, key):
    title = f"SDR Desk {skill['number']:02d}: {skill['title']}"
    body = f"""for/g: Produce the verified artifact requested by SDR Desk skill {skill['number']} ({skill['title']}).
verify: Return the requested output plus source/evidence references, uncertainty labels, and the skill's watch-for check.
constraints: Draft/research/classify only. Do not send outbound messages, negotiate price, mutate production, delete records, invent names/quotes/metrics, or bypass bounce/opt-out/approval gates.

JOB: {skill['job']}
PROFILE: {skill['profile']}
SKILL: {skill['id']}

PROMPT:
{rendered}
"""
    return subprocess.run([
        "hermes", "kanban", "create", title,
        "--body", body,
        "--assignee", skill["profile"],
        "--idempotency-key", key,
        "--max-retries", "2",
        "--max-runtime", "20m",
        "--created-by", "sdr-desk",
        "--json",
    ], text=True, capture_output=True, check=False)

def main():
    ap=argparse.ArgumentParser()
    sub=ap.add_subparsers(dest="action", required=True)
    sub.add_parser("list")
    q=sub.add_parser("queue")
    q.add_argument("skill_id")
    q.add_argument("--input-file", required=True)
    q.add_argument("--dry-run", action="store_true")
    args=ap.parse_args(); data=load()
    if args.action == "list":
        for s in data["skills"]:
            print(f"{s['id']}\t{s['profile']}\t{s['title']}\t{s['what_it_does']}")
        return 0
    skill=next((s for s in data["skills"] if s["id"]==args.skill_id),None)
    if not skill:
        print(f"unknown skill: {args.skill_id}",file=sys.stderr); return 2
    inp=Path(args.input_file).read_text()
    skill_text=(ROOT/'skills'/f"{skill['id']}.md").read_text()
    prompt=skill_text.split("## Prompt template\n\n",1)[1].split("\n\n## Watch for",1)[0]
    rendered=prompt.replace("[PASTE]",inp).replace("[PASTE THEM RAW, with sender and date]",inp).replace("[PASTE EVERYTHING UNHANDLED, with dates]",inp)
    digest=hashlib.sha256((skill['id']+'\0'+inp).encode()).hexdigest()[:16]
    key=f"sdr-desk:{skill['id']}:{digest}"
    result={"skill":skill["id"],"profile":skill["profile"],"idempotency_key":key,"input_bytes":len(inp)}
    if args.dry_run:
        result["status"]="dry_run"
        print(json.dumps(result,indent=2)); return 0
    r=cmd_create(skill,rendered,key)
    result["status"]="queued" if r.returncode==0 else "error"
    result["kanban_output"]=(r.stdout or r.stderr).strip()
    print(json.dumps(result,indent=2)); return r.returncode

if __name__ == "__main__": raise SystemExit(main())
