"""Intent Scoring — Claude LLM judges buying trigger from visitor profile.

Implements Stage 3 of the trigger-aware lead gen pipeline:
  Input: visitor_profile {company, pages_visited, time_spent_s, ...}
  Output: intent_score 0–100 + reasoning
  Storage: update prospects.intent_score in lead_state.db

Buying trigger: "actively bleeding money on ads with zero conversions"
Detection via visitor behavior:
  - Viewed audit page (pain point validation)
  - Viewed fix-pack page (solution exploration)
  - High dwell time (serious interest, not tire-kicker)
  - Repeated visits (considering, not dismissing)
"""
import sqlite3
import json
import os
from pathlib import Path
from datetime import datetime


DB_PATH = Path(__file__).parent / "lead_state.db"


def score_intent(visitor_profile: dict) -> dict:
    """Use Claude to score buying intent 0–100.
    
    Args:
        visitor_profile: {
            "prospect_id": "acme_founder1",
            "company_name": "ACME Corp",
            "pages_visited": ["audit", "fix-pack", "pricing"],
            "total_dwell_s": 245,
            "repeat_visits": 3,
            "cta_clicks": 2,
            "last_visit": "2026-08-09T14:30:00Z"
        }
    
    Returns:
        {
            "prospect_id": "acme_founder1",
            "intent_score": 82,
            "reasoning": "Visited audit 3x, spent 4m total, clicked CTA twice. High intent.",
            "buying_trigger_signals": ["pain validation", "solution exploration", "high engagement"]
        }
    """
    import anthropic
    
    prompt = f"""You are an intent-scoring agent. Given a visitor profile, score their buying intent 0–100.

BUYING TRIGGER: "actively bleeding money on ads with zero conversions"

VISITOR PROFILE:
{json.dumps(visitor_profile, indent=2)}

SCORING RUBRIC:
- 0–20: No intent (visited once, bounced)
- 21–50: Low intent (visited audit page, no engagement)
- 51–75: Medium intent (viewed audit + fix-pack, dwell > 1m, no CTA click)
- 76–90: High intent (viewed audit 2+ times, clicked CTA, viewed pricing)
- 91–100: Very high intent (multiple visits, high dwell, CTA clicks, last_visit < 7d)

OUTPUT (JSON):
{{
    "intent_score": <0-100>,
    "reasoning": "<one sentence explaining the score>",
    "buying_trigger_signals": [<list of detected signals>]
}}

Examples of signals:
- "pain validation": visited audit page (acknowledging the problem)
- "solution exploration": visited fix-pack or pricing (exploring solutions)
- "high engagement": dwell > 2m, repeat visits, multiple page views
- "recent activity": last_visit < 7d (fresh interest)
- "low friction": CTA clicks (ready to convert)

Score generously for founders who show ANY two of the above signals.
Be strict (< 50) only if engagement is truly minimal (single visit, < 30s).
"""
    
    client = anthropic.Anthropic()
    response = client.messages.create(
        model="claude-3-5-sonnet-20241022",
        max_tokens=500,
        messages=[
            {"role": "user", "content": prompt}
        ]
    )
    
    text = response.content[0].text
    # Extract JSON from response
    try:
        import re
        json_match = re.search(r'\{.*\}', text, re.DOTALL)
        if json_match:
            result = json.loads(json_match.group())
        else:
            result = {"intent_score": 50, "reasoning": text, "buying_trigger_signals": []}
    except json.JSONDecodeError:
        result = {"intent_score": 50, "reasoning": text, "buying_trigger_signals": []}
    
    result["prospect_id"] = visitor_profile.get("prospect_id")
    return result


def update_prospect_intent(prospect_id: str, intent_score: int, reasoning: str):
    """Update prospect's intent_score in lead_state.db."""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    c.execute(
        "UPDATE prospects SET intent_score = ?, updated_at = CURRENT_TIMESTAMP WHERE prospect_id = ?",
        (intent_score, prospect_id)
    )
    
    conn.commit()
    conn.close()


def get_high_intent_prospects(threshold=75) -> list[dict]:
    """Return prospects with intent_score >= threshold, ready for outbound."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()
    
    c.execute(
        """
        SELECT p.prospect_id, p.domain, p.company_name, p.intent_score,
               c.email, c.first_name, c.last_name, c.job_title
        FROM prospects p
        LEFT JOIN contacts c ON p.prospect_id = c.prospect_id
        WHERE p.intent_score >= ? AND p.status = 'discovered'
        ORDER BY p.intent_score DESC
        """,
        (threshold,)
    )
    
    rows = c.fetchall()
    conn.close()
    
    return [dict(row) for row in rows]


if __name__ == "__main__":
    # Example: score a visitor profile
    profile = {
        "prospect_id": "acme_founder1",
        "company_name": "ACME Corp",
        "pages_visited": ["audit", "fix-pack", "pricing"],
        "total_dwell_s": 245,
        "repeat_visits": 3,
        "cta_clicks": 2,
        "last_visit": "2026-08-09T14:30:00Z"
    }
    
    result = score_intent(profile)
    print(json.dumps(result, indent=2))
    
    # Update DB
    if "prospect_id" in result:
        update_prospect_intent(result["prospect_id"], result["intent_score"], result.get("reasoning", ""))
        print(f"\nUpdated {result['prospect_id']} intent to {result['intent_score']}")
    
    # List high-intent prospects
    high_intent = get_high_intent_prospects(threshold=75)
    print(f"\nHigh-intent prospects (≥75): {len(high_intent)}")
    for p in high_intent[:5]:
        print(f"  {p['email']}: {p['intent_score']} ({p['company_name']})")
