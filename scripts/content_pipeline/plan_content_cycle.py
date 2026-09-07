#!/usr/bin/env python3
"""Build a duplicate-aware seven-day blog publishing plan."""
from __future__ import annotations
import argparse, json, re
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
BLOG_ROOT = ROOT / "customer-portal/app/blog/content"
KEYWORDS = ROOT / "memory/sites/nebulacomponents.com/keywords.json"
DEFAULT_OUTPUT = ROOT / "content-ledger/content-plan.json"
DUPLICATE_THRESHOLD = 0.45

def tokens(value: str) -> set[str]:
    ignored = {"why", "what", "how", "your", "this", "about", "the"}
    return {x for x in re.findall(r"[a-z0-9]+", value.lower()) if len(x) > 2 and x not in ignored}

def frontmatter(text: str) -> dict[str, str]:
    if not text.startswith("---") or "\n---" not in text[3:]: return {}
    end = text.find("\n---", 3)
    out = {}
    for line in text[3:end].splitlines():
        if ":" in line:
            key, value = line.split(":", 1); out[key.strip()] = value.strip().strip("\"'")
    return out

def inventory() -> list[dict[str, Any]]:
    out = []
    for path in sorted(BLOG_ROOT.glob("*.md")) if BLOG_ROOT.exists() else []:
        text = path.read_text(encoding="utf-8"); meta = frontmatter(text)
        heading = re.search(r"^#\s+(.+)$", text, re.M)
        title = meta.get("title") or (heading.group(1).strip() if heading else path.stem)
        try: path_name = str(path.relative_to(ROOT))
        except ValueError: path_name = str(path)
        out.append({"path": path_name, "slug": meta.get("slug", path.stem), "title": title,
                    "status": meta.get("status", "unknown"), "content_lane": meta.get("content_lane", "unknown"),
                    "post_type": meta.get("post_type", "unknown"), "words": len(re.findall(r"\b[\w'-]+\b", text)),
                    "topic_tokens": sorted(tokens(title + " " + meta.get("slug", path.stem)))})
    return out

def overlap(a: set[str], b: set[str]) -> float:
    return len(a & b) / min(len(a), len(b)) if a and b else 0.0

def topics() -> list[dict[str, Any]]:
    data = json.loads(KEYWORDS.read_text(encoding="utf-8")) if KEYWORDS.exists() else {}
    return [{"topic": keyword, "intent": intent} for intent, values in data.get("primary_keywords", {}).items() for keyword in values]

def classify(existing: list[dict[str, Any]], raw: list[dict[str, str]]) -> list[dict[str, Any]]:
    result = []; selected: list[set[str]] = []
    for item in raw:
        topic, intent, current = item["topic"], item["intent"], tokens(item["topic"])
        matches = sorted(((overlap(current, set(a["topic_tokens"])), a) for a in existing), key=lambda x: (-x[0], x[1]["slug"]))
        if matches and matches[0][0] >= DUPLICATE_THRESHOLD:
            score, article = matches[0]
            decision = "repurpose" if article["status"] in {"published", "approved"} else "do_not_create"
            reason = "update the canonical article with verified new findings" if decision == "repurpose" else "existing non-public article or fixture; do not create a competing URL"
            result.append({"topic": topic, "intent": intent, "decision": decision, "canonical_article": article["slug"], "overlap": round(score, 3), "reason": reason})
        elif any(overlap(current, prior) >= DUPLICATE_THRESHOLD for prior in selected):
            result.append({"topic": topic, "intent": intent, "decision": "do_not_create", "canonical_article": None, "overlap": 0.0, "reason": "near-duplicate of another new topic in this planning cycle"})
        else:
            selected.append(current)
            result.append({"topic": topic, "intent": intent, "decision": "new", "canonical_article": None, "overlap": 0.0, "reason": "no existing or same-cycle canonical topic exceeds the duplicate threshold"})
    return result

def next_monday(start: date) -> date:
    return start + timedelta(days=(7 - start.weekday()) % 7 or 7)

def build_plan() -> dict[str, Any]:
    existing = inventory(); classified = classify(existing, topics())
    actionable = [x for x in classified if x["decision"] in {"new", "repurpose"}]
    anchor = next_monday(date.today())
    # Seven daily slots. Additional approved topics remain backlog for the next cycle.
    schedule = []
    scheduled_canonicals: set[str] = set()
    for item in actionable:
        canonical = item.get("canonical_article")
        if item["decision"] == "repurpose" and canonical in scheduled_canonicals:
            continue
        if canonical:
            scheduled_canonicals.add(canonical)
        if len(schedule) >= 7:
            break
        entry = dict(item)
        entry["publish_date"] = (anchor + timedelta(days=len(schedule))).isoformat()
        entry["slot"] = len(schedule) + 1
        schedule.append(entry)
    while len(schedule) < 7:
        slot = len(schedule) + 1
        schedule.append({"slot": slot, "publish_date": (anchor + timedelta(days=slot - 1)).isoformat(),
                         "decision": "blocked", "topic": None, "canonical_article": None,
                         "reason": "no additional unique evidence-backed topic is available; do not invent or duplicate content"})
    return {"schema": "nebula.blog.content-plan.v2", "generated_at": datetime.now(timezone.utc).isoformat(),
            "cadence": "daily", "posts_per_week": 7, "duplicate_threshold": DUPLICATE_THRESHOLD,
            "inventory": existing, "topics": classified, "topic_count": len(classified),
            "new_topics": [x for x in classified if x["decision"] == "new"],
            "repurpose_topics": [x for x in classified if x["decision"] == "repurpose"],
            "do_not_create": [x for x in classified if x["decision"] == "do_not_create"],
            "publication_schedule": schedule,
            "unfilled_slots": sum(1 for x in schedule if x["decision"] == "blocked"),
            "backlog": actionable[7:],
            "rule": "One planned post per day for seven days. Repurpose the canonical URL when verified new information exists; never create a duplicate topic or URL."}

def main() -> int:
    p = argparse.ArgumentParser(); p.add_argument("--output", type=Path, default=DEFAULT_OUTPUT); args = p.parse_args()
    plan = build_plan(); args.output.parent.mkdir(parents=True, exist_ok=True); args.output.write_text(json.dumps(plan, indent=2, sort_keys=True) + "\n")
    print(json.dumps({"output": str(args.output), "cadence": plan["cadence"], "posts_per_week": plan["posts_per_week"], "inventory_count": len(plan["inventory"]), "new_count": len(plan["new_topics"]), "repurpose_count": len(plan["repurpose_topics"]), "blocked_count": len(plan["do_not_create"]), "scheduled_count": len(plan["publication_schedule"]), "unfilled_slots": plan["unfilled_slots"]}, indent=2, sort_keys=True))
    return 0

if __name__ == "__main__": raise SystemExit(main())
