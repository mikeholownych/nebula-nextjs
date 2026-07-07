#!/usr/bin/env python3
"""
Copy Fatigue Detector — Hormozi Rule of 100 Protocol.

Distinguishes copy fatigue from infrastructure breakdown using
metric trend analysis. Run weekly or integrate with health check.

KEY RULE:
  Infrastructure breaks suddenly (days).
  Copy fatigues gradually (2–6 weeks).

Usage:
  python3 copy_fatigue_detector.py
  from copy_fatigue_detector import diagnose_fatigue
"""

import json
import os
from pathlib import Path
from datetime import datetime, timezone

# ── Metric thresholds (from 100-Day Scorecard) ────────────────────
THRESHOLDS = {
    "reply_rate":  {"green": 3.0, "yellow": 1.0},   # % positive replies
    "open_rate":   {"green": 40.0, "yellow": 25.0},  # % opens — Illingworth: <40% = something wrong
    "bounce_rate": {"red": 2.5,  "yellow": 1.5},     # % bounced
    "spam_rate":   {"red": 0.3,  "yellow": 0.1},     # % spam complaints
    "warmup_score":{"green": 70, "yellow": 60},       # warmup health 0–100
}

# ── Tension pattern taxonomy (for hook bank logging) ──────────────
TENSION_PATTERNS = {
    "authority":      "We've run [volume/credential] across [segment], and noticed [contrarian pattern]",
    "contrarian":     "Everyone in [niche] is [common tactic]. We're doing the opposite and [result]",
    "personal_story": "[Specific situation/failure]. That's when I realised [insight]",
    "dream_selling":  "If you're [target state], you're probably also [hidden pain]. Most teams overlook this",
    "future_pacing":  "By [timeframe], [prediction]. This is how we're preparing for it now",
}


def zone(metric_name: str, value: float) -> str:
    """Return 'green', 'yellow', or 'red' for a metric value."""
    t = THRESHOLDS.get(metric_name, {})
    if metric_name in ("reply_rate", "warmup_score"):
        # Higher is better
        if value >= t.get("green", 0):
            return "green"
        elif value >= t.get("yellow", 0):
            return "yellow"
        else:
            return "red"
    else:
        # Lower is better (bounce_rate, spam_rate)
        if value <= t.get("yellow", 0):
            return "green"
        elif value <= t.get("red", 0):
            return "yellow"
        else:
            return "red"


def diagnose_fatigue(
    reply_rate_now: float,
    reply_rate_4w_ago: float,
    bounce_rate: float,
    spam_rate: float,
    warmup_score: float,
    drop_is_gradual: bool = True,
    open_rate: float | None = None,
) -> dict:
    """
    Run the 5-question fatigue diagnosis from the Copy Fatigue Protocol.

    Args:
        reply_rate_now      : current positive reply rate (%)
        reply_rate_4w_ago   : reply rate 4 weeks ago (%)
        bounce_rate         : current bounce rate (%)
        spam_rate           : current spam complaint rate (%)
        warmup_score        : current warmup health score (0–100)
        drop_is_gradual     : True if drop occurred over 2–6 weeks; False if within days
        open_rate           : current open rate (%) — Illingworth: <40% = something wrong

    Returns dict with:
        diagnosis     : 'copy_fatigue' | 'infrastructure_breakdown' | 'healthy'
        confidence    : 'high' | 'medium' | 'low'
        reply_delta   : % point change
        action        : recommended action
        zones         : per-metric zone summary
    """
    reply_delta = reply_rate_now - reply_rate_4w_ago

    zones = {
        "reply_rate":   zone("reply_rate",   reply_rate_now),
        "bounce_rate":  zone("bounce_rate",  bounce_rate),
        "spam_rate":    zone("spam_rate",    spam_rate),
        "warmup_score": zone("warmup_score", warmup_score),
    }
    if open_rate is not None:
        zones["open_rate"] = zone("open_rate", open_rate)

    infra_red = sum(1 for k in ("bounce_rate", "spam_rate", "warmup_score")
                    if zones[k] == "red")
    infra_yellow = sum(1 for k in ("bounce_rate", "spam_rate", "warmup_score")
                       if zones[k] == "yellow")

    # Healthy: no meaningful drop
    if reply_delta >= -0.5 and zones["reply_rate"] in ("green", "yellow"):
        return {
            "diagnosis": "healthy",
            "confidence": "high",
            "reply_delta": reply_delta,
            "action": "No action needed. Continue current cadence.",
            "zones": zones,
        }

    # Infrastructure breakdown: sudden drop + infra metrics degrading
    if not drop_is_gradual and infra_red >= 1:
        return {
            "diagnosis": "infrastructure_breakdown",
            "confidence": "high",
            "reply_delta": reply_delta,
            "action": (
                "STOP sending. Infrastructure is broken. "
                "Fix until bounce<1.5%, spam<0.1%, warmup>70% — THEN resume. "
                "New copy will not save you."
            ),
            "zones": zones,
        }

    # Infrastructure breakdown: any infra metric in red, regardless of pace
    if infra_red >= 2:
        return {
            "diagnosis": "infrastructure_breakdown",
            "confidence": "medium",
            "reply_delta": reply_delta,
            "action": (
                "STOP sending. 2+ infrastructure metrics in red. "
                "Diagnose and green-light all metrics before resuming."
            ),
            "zones": zones,
        }

    # Copy fatigue: gradual drop, infra clean
    if drop_is_gradual and infra_red == 0 and reply_delta < -0.5:
        confidence = "high" if infra_yellow == 0 else "medium"
        return {
            "diagnosis": "copy_fatigue",
            "confidence": confidence,
            "reply_delta": reply_delta,
            "action": (
                "Copy fatigue detected. Infrastructure is clean. "
                "Block Monday morning: write 10 new hook lines. "
                "Pick a new tension pattern (see TENSION_PATTERNS). "
                "Test strongest new line Tuesday vs current baseline."
            ),
            "zones": zones,
        }

    # Ambiguous
    return {
        "diagnosis": "ambiguous",
        "confidence": "low",
        "reply_delta": reply_delta,
        "action": (
            "Signal unclear. Check whether drop is gradual or sudden. "
            "If gradual + infra clean → copy fatigue. "
            "If sudden + any infra metric degrading → infrastructure."
        ),
        "zones": zones,
    }


def print_diagnosis(d: dict):
    """Pretty-print a diagnosis result."""
    icons = {"green": "✅", "yellow": "⚠️", "red": "🔴"}
    diag_icon = {"healthy": "✅", "copy_fatigue": "🖊️", "infrastructure_breakdown": "🛑", "ambiguous": "❓"}

    print(f"\n{'='*55}")
    print(f"  COPY FATIGUE DIAGNOSIS  [{datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M')}Z]")
    print(f"{'='*55}")
    print(f"  Verdict   : {diag_icon.get(d['diagnosis'],'?')} {d['diagnosis'].upper()} ({d['confidence']} confidence)")
    print(f"  Reply Δ   : {d['reply_delta']:+.1f}%")
    print()
    print("  Metric zones:")
    for k, v in d["zones"].items():
        print(f"    {icons[v]}  {k:<16} {v}")
    print()
    print(f"  ACTION: {d['action']}")
    print(f"{'='*55}")


def hook_bank_entry(
    week: int,
    lines_written: int,
    chosen_line: str,
    tension_pattern: str,
    tested: bool = False,
) -> dict:
    """Create a hook bank log entry for weekly tracking."""
    if tension_pattern not in TENSION_PATTERNS:
        raise ValueError(f"Unknown tension pattern. Use one of: {list(TENSION_PATTERNS)}")
    return {
        "week": week,
        "logged_at": datetime.now(timezone.utc).isoformat(),
        "lines_written": lines_written,
        "chosen_line": chosen_line,
        "tension_pattern": tension_pattern,
        "tension_template": TENSION_PATTERNS[tension_pattern],
        "tested": tested,
    }


def load_hook_bank(path: str = "/home/mike/nebula/hook_bank.jsonl") -> list:
    """Load all hook bank entries from disk."""
    p = Path(path)
    if not p.exists():
        return []
    entries = []
    for line in p.read_text().splitlines():
        line = line.strip()
        if line:
            try:
                entries.append(json.loads(line))
            except json.JSONDecodeError:
                pass
    return entries


def save_hook_entry(entry: dict, path: str = "/home/mike/nebula/hook_bank.jsonl") -> None:
    """Append a hook bank entry to the JSONL file."""
    with open(path, "a") as f:
        f.write(json.dumps(entry) + "\n")


# ══════════════════════════════════════════════════════════════════
# A/B Variation Registry
# Source: Illingworth SOPs — "A/B test 2 variations for every step"
#   Track: subject line, CTA phrasing, tone (casual vs structured)
#   Log per step, per week, with opens/replies/positives/booked
# ══════════════════════════════════════════════════════════════════

AB_REGISTRY_PATH = "/home/mike/nebula/ab_registry.jsonl"


def log_ab_send(
    campaign: str,
    step: int,
    variation: str,            # e.g. "A", "B", or label like "casual"
    subject: str,
    cta: str,
    tone: str,                 # "casual" | "structured"
    email: str,
    week: int | None = None,
    path: str = AB_REGISTRY_PATH,
) -> dict:
    """
    Log one email send to the A/B registry.
    Call this at send time for every outbound email.

    Returns the entry dict for chaining.
    """
    entry = {
        "ts": datetime.now(timezone.utc).isoformat(),
        "week": week or _iso_week(),
        "campaign": campaign,
        "step": step,
        "variation": variation,
        "subject": subject,
        "cta": cta,
        "tone": tone,
        "email": email,
        # outcomes filled in later via log_ab_outcome()
        "opened": False,
        "replied": False,
        "positive": False,
        "booked": False,
    }
    with open(path, "a") as f:
        f.write(json.dumps(entry) + "\n")
    return entry


def log_ab_outcome(
    email: str,
    campaign: str,
    step: int,
    outcome: str,              # "opened" | "replied" | "positive" | "booked"
    path: str = AB_REGISTRY_PATH,
) -> int:
    """
    Mark an outcome for a previously logged send.
    Rewrites matching lines in the JSONL.
    Returns count of entries updated.
    """
    if not os.path.exists(path):
        return 0
    updated = 0
    lines = []
    with open(path) as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            entry = json.loads(line)
            if entry.get("email") == email and entry.get("campaign") == campaign and entry.get("step") == step:
                entry[outcome] = True
                updated += 1
            lines.append(json.dumps(entry))
    with open(path, "w") as f:
        f.write("\n".join(lines) + "\n")
    return updated


def _iso_week() -> int:
    import datetime
    return datetime.date.today().isocalendar()[1]


def weekly_performance_sheet(
    week: int | None = None,
    path: str = AB_REGISTRY_PATH,
) -> list[dict]:
    """
    Return per-step × per-variation performance rows for a given ISO week.
    If week is None, returns all weeks.

    Row schema:
        campaign, step, variation, tone, sent, opens, open_rate,
        replies, reply_rate, positives, booked, top_subject
    """
    if not os.path.exists(path):
        return []

    from collections import defaultdict

    buckets: dict = defaultdict(lambda: {
        "sent": 0, "opens": 0, "replies": 0, "positives": 0, "booked": 0,
        "subjects": []
    })

    with open(path) as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            e = json.loads(line)
            if week is not None and e.get("week") != week:
                continue
            key = (e.get("campaign", ""), e.get("step", 0), e.get("variation", "A"), e.get("tone", ""))
            b = buckets[key]
            b["sent"] += 1
            if e.get("opened"):  b["opens"] += 1
            if e.get("replied"): b["replies"] += 1
            if e.get("positive"): b["positives"] += 1
            if e.get("booked"):  b["booked"] += 1
            subj = e.get("subject", "")
            if subj and subj not in b["subjects"]:
                b["subjects"].append(subj)

    rows = []
    for (campaign, step, variation, tone), b in sorted(buckets.items()):
        sent = b["sent"]
        rows.append({
            "campaign":   campaign,
            "step":       step,
            "variation":  variation,
            "tone":       tone,
            "sent":       sent,
            "opens":      b["opens"],
            "open_rate":  round(b["opens"] / sent * 100, 1) if sent else 0.0,
            "replies":    b["replies"],
            "reply_rate": round(b["replies"] / sent * 100, 1) if sent else 0.0,
            "positives":  b["positives"],
            "booked":     b["booked"],
            "top_subject": b["subjects"][0] if b["subjects"] else "",
        })
    return rows


def print_weekly_sheet(week: int | None = None, path: str = AB_REGISTRY_PATH) -> None:
    """Print the weekly A/B performance table to stdout."""
    rows = weekly_performance_sheet(week=week, path=path)
    if not rows:
        label = f"week {week}" if week else "all weeks"
        print(f"No A/B data for {label}.")
        return

    label = f"Week {week}" if week else "All Weeks"
    header = f"{'Campaign':<14} {'Step':>4} {'Var':>4} {'Tone':<12} {'Sent':>5} {'Opens':>6} {'OR%':>5} {'Replies':>8} {'RR%':>5} {'Pos':>4} {'Booked':>7}  Subject"
    print(f"\n=== A/B Performance — {label} ===")
    print(header)
    print("─" * len(header))
    for r in rows:
        print(
            f"{r['campaign']:<14} {r['step']:>4} {r['variation']:>4} {r['tone']:<12} "
            f"{r['sent']:>5} {r['opens']:>6} {r['open_rate']:>5} {r['replies']:>8} "
            f"{r['reply_rate']:>5} {r['positives']:>4} {r['booked']:>7}  {r['top_subject'][:45]}"
        )




# ── CLI ──────────────────────────────────────────────────────────
if __name__ == "__main__":
    import sys

    if "--bank" in sys.argv:
        bank = load_hook_bank()
        print(f"\nHook Bank: {len(bank)} entries")
        for e in bank[-10:]:
            tested = "✅" if e.get("tested") else "  "
            print(f"  W{e['week']:02d} {tested} [{e['tension_pattern']}] {e['chosen_line'][:60]}")
        total = sum(e.get("lines_written", 0) for e in bank)
        print(f"\n  Total lines logged: {total} (target: 130+ by week 14)")
        sys.exit(0)

    if "--ab" in sys.argv:
        # Smoke test: log 4 synthetic sends, mark outcomes, print sheet
        import tempfile, os
        tmp = tempfile.mktemp(suffix=".jsonl")
        log_ab_send("cold", 1, "A", "Your ads are leaking", "Want me to check?", "casual",  "a@x.com", week=1, path=tmp)
        log_ab_send("cold", 1, "B", "Found something on {domain}", "Worth a look?",    "structured", "b@x.com", week=1, path=tmp)
        log_ab_send("cold", 1, "A", "Your ads are leaking", "Want me to check?", "casual",  "c@x.com", week=1, path=tmp)
        log_ab_send("cold", 2, "A", "re: the fix for {issue1}", "Should I send it?",   "casual",  "d@x.com", week=1, path=tmp)
        log_ab_outcome("a@x.com", "cold", 1, "opened", path=tmp)
        log_ab_outcome("a@x.com", "cold", 1, "replied", path=tmp)
        log_ab_outcome("a@x.com", "cold", 1, "positive", path=tmp)
        log_ab_outcome("c@x.com", "cold", 1, "opened", path=tmp)
        log_ab_outcome("b@x.com", "cold", 1, "opened", path=tmp)
        print_weekly_sheet(week=1, path=tmp)
        os.unlink(tmp)
        sys.exit(0)

    # Demo diagnosis
    print("Demo: gradual reply rate drop, clean infrastructure")
    d = diagnose_fatigue(
        reply_rate_now=1.1,
        reply_rate_4w_ago=4.2,
        bounce_rate=0.9,
        spam_rate=0.05,
        warmup_score=82,
        drop_is_gradual=True,
    )
    print_diagnosis(d)

    print("\nDemo: sudden drop with infra degradation")
    d2 = diagnose_fatigue(
        reply_rate_now=0.3,
        reply_rate_4w_ago=3.8,
        bounce_rate=3.1,
        spam_rate=0.22,
        warmup_score=58,
        drop_is_gradual=False,
    )
    print_diagnosis(d2)

    print("\nTension patterns available:")
    for k, v in TENSION_PATTERNS.items():
        print(f"  {k:<18}: {v}")
