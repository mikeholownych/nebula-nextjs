#!/usr/bin/env python3
"""
model_router.py — cost-tiered model selection for the Nebula pipeline.

Jack Roberts principle: "Fable 5 on Low beats Opus 4.8 on High for 60% less."
Use the right model for the right job. Cheap for bulk, expensive for deep.

Tiers:
    bulk       → DeepSeek Flash / Gemini Flash  (1% cost, 95% perf)
    reasoning  → Opus 4.7 / GPT 5.5              (medium cost)
    deep       → Opus 4.7 / Fable 5 Low           (higher cost, analysis)
    audit      → Fable 5 Low / Opus 4.7           (conversion analysis)
    creative   → GPT 5.5 / Claude 4 Sonnet        (copy, design)

Usage:
    from model_router import pick_model, MODEL_COSTS

    model = pick_model("bulk")        # → "deepseek-chat"
    model = pick_model("audit")       # → "anthropic/claude-opus-4-7"
    model = pick_model("deep")        # → "anthropic/claude-3-5-sonnet"

    cost_per_1k = MODEL_COSTS[model]["input"]
"""

from typing import Optional

# ── Model Tiers ──────────────────────────────────────────────────────────
# Each tier maps to one or more provider models.
# Costs are approximate USD per 1K tokens.
TIERS = {
    "bulk": {
        "description": "Scraping, classification, cold email drafting",
        "models": [
            {"name": "deepseek/deepseek-chat",       "provider": "openrouter", "input_cost": 0.000014, "output_cost": 0.000028},
            {"name": "google/gemini-2.0-flash-001",  "provider": "openrouter", "input_cost": 0.000010, "output_cost": 0.000040},
            {"name": "gpt-4o-mini",                   "provider": "openai",     "input_cost": 0.000150, "output_cost": 0.000600},
        ],
        "fallback_strategy": "cheapest_first",
    },
    "reasoning": {
        "description": "Multi-step reasoning, strategy, lead scoring",
        "models": [
            {"name": "anthropic/claude-opus-4-7",     "provider": "openrouter", "input_cost": 0.015, "output_cost": 0.075},
            {"name": "gpt-5.5",                       "provider": "openai",     "input_cost": 0.010, "output_cost": 0.040},
            {"name": "deepseek/deepseek-r1",          "provider": "openrouter", "input_cost": 0.002,  "output_cost": 0.008},
        ],
        "fallback_strategy": "quality_first",
    },
    "deep": {
        "description": "Deep analysis, code review, vulnerability assessment",
        "models": [
            {"name": "anthropic/claude-opus-4-7",     "provider": "openrouter", "input_cost": 0.015, "output_cost": 0.075},
            {"name": "anthropic/claude-sonnet-4-6",   "provider": "openrouter", "input_cost": 0.003,  "output_cost": 0.015},
        ],
        "fallback_strategy": "quality_first",
    },
    "audit": {
        "description": "Landing page conversion audit — optimization analysis",
        "models": [
            {"name": "anthropic/claude-opus-4-7",     "provider": "openrouter", "input_cost": 0.015, "output_cost": 0.075},
            {"name": "anthropic/claude-sonnet-4-6",   "provider": "openrouter", "input_cost": 0.003,  "output_cost": 0.015},
        ],
        "fallback_strategy": "quality_first",
    },
    "creative": {
        "description": "Email copy, pitch personalization, content generation",
        "models": [
            {"name": "gpt-5.5",                       "provider": "openai",     "input_cost": 0.010, "output_cost": 0.040},
            {"name": "anthropic/claude-sonnet-4-6",   "provider": "openrouter", "input_cost": 0.003,  "output_cost": 0.015},
            {"name": "deepseek/deepseek-chat",        "provider": "openrouter", "input_cost": 0.000014, "output_cost": 0.000028},
        ],
        "fallback_strategy": "quality_first",
    },
}

# Build flat cost lookup
MODEL_COSTS = {}
for tier_name, tier in TIERS.items():
    for m in tier["models"]:
        MODEL_COSTS[m["name"]] = {
            "input": m["input_cost"],
            "output": m["output_cost"],
            "provider": m["provider"],
            "tier": tier_name,
        }


def pick_model(tier: str, index: int = 0) -> Optional[dict]:
    """
    Pick a model from a tier. Returns model dict or None.

    Args:
        tier:   One of "bulk", "reasoning", "deep", "audit", "creative"
        index:  Which model in the tier (0 = highest priority)

    Returns:
        {"name": "...", "provider": "...", "input_cost": N, "output_cost": N}
        or None if tier doesn't exist.
    """
    if tier not in TIERS:
        return None
    models = TIERS[tier]["models"]
    if index >= len(models):
        # Fallback to first model
        index = 0
    return models[index].copy()


def cheapest_model(tier: str) -> Optional[dict]:
    """Return the cheapest model in a tier."""
    if tier not in TIERS:
        return None
    sorted_models = sorted(TIERS[tier]["models"], key=lambda m: m["input_cost"])
    return sorted_models[0].copy() if sorted_models else None


def estimate_cost(tier: str, input_tokens: int, output_tokens: int) -> float:
    """
    Estimate cost for a task given tier and token counts.

    Args:
        tier:           Task tier name
        input_tokens:   Estimated input tokens
        output_tokens:  Estimated output tokens

    Returns:
        Estimated cost in USD (uses cheapest model in tier).
    """
    model = cheapest_model(tier)
    if not model:
        return 0.0
    return (model["input_cost"] * input_tokens / 1000) + (model["output_cost"] * output_tokens / 1000)


def tier_estimate_table() -> str:
    """Return a formatted cost comparison table for all tiers."""
    lines = ["Tier            | Model                          | Input/1K   | Output/1K",
             "-" * 80]
    for name, tier in TIERS.items():
        first = True
        for m in tier["models"]:
            prefix = name if first else ""
            first = False
            lines.append(f"{prefix:<16}| {m['name']:<30} | ${m['input_cost']:<8.6f} | ${m['output_cost']:<.6f}")
        if first:
            lines.append(f"{name:<16}| (no models)")
        lines.append("-" * 80)
    return "\n".join(lines)


def savings_report(bulk_tokens: int = 100000, output_tokens: int = 20000) -> str:
    """
    Compare cost of running a bulk task on Opus (old way) vs DeepSeek (new way).

    Args:
        bulk_tokens:    Estimated input tokens per task
        output_tokens:  Estimated output tokens per task

    Returns:
        Comparison string.
    """
    opus = TIERS["deep"]["models"][0]
    bulk = cheapest_model("bulk")

    opus_cost = (opus["input_cost"] * bulk_tokens / 1000) + (opus["output_cost"] * output_tokens / 1000)
    bulk_cost = (bulk["input_cost"] * bulk_tokens / 1000) + (bulk["output_cost"] * output_tokens / 1000)
    savings = opus_cost - bulk_cost
    ratio = opus_cost / max(bulk_cost, 0.001)

    return (f"Cost comparison ({bulk_tokens}K in / {output_tokens}K out):\n"
            f"  Opus 4.7 (deep tier):  ${opus_cost:.4f}\n"
            f"  {bulk['name']} (bulk tier): ${bulk_cost:.4f}\n"
            f"  Savings: ${savings:.4f} ({ratio:.0f}x cheaper)")


if __name__ == "__main__":
    import sys
    if "--table" in sys.argv:
        print(tier_estimate_table())
    elif "--savings" in sys.argv:
        print(savings_report())
    else:
        print("Model Router — cost-tiered model selection")
        print(f"Default picks:")
        for tier in TIERS:
            m = pick_model(tier)
            c = cheapest_model(tier)
            if m and c:
                print(f"  {tier:<12} → {m['name']:<30} (cheapest: {c['name']})")
        print(f"\nCost estimation (100K in / 20K out):")
        for tier in TIERS:
            est = estimate_cost(tier, 100000, 20000)
            print(f"  {tier:<12} ~ ${est:.4f}")
        print(f"\n{savings_report()}")
