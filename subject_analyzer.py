#!/usr/bin/env python3
"""
Subject Line Analyzer — Hook Deconstructor for B2B Email Sequences.

Adapted from UGC Ninja's Claude Viral Intelligence Team (Agent 3: Hook Deconstructor).
Applies the same hook archetype analysis to email subject lines instead of TikTok hooks.
"""
import re

ARCHETYPES = {
    "curiosity_gap": {
        "triggers": ["this", "these", "why", "how", "what", "did you", "ever", "secret", "inside", "without"],
        "weight": 0.85,
        "description": "Opens a question the reader must close by opening the email",
        "examples": ["Why your landing page is leaking buyers", "The 3 words costing you signups"],
        "strength": "Curiosity is the highest-performing B2B email open driver. If the subject creates an information gap the reader feels compelled to close, they open.",
        "weakness": "Too vague and it feels like clickbait. Must promise a specific answer inside."
    },
    "bold_claim": {
        "triggers": ["stop", "double", "triple", "cut", "save", "eliminate", "fix", "never", "breakthrough"],
        "weight": 0.75,
        "description": "Makes a strong assertion that challenges the reader's current belief or results",
        "examples": ["Stop losing 80% of visitors before they scroll", "Double your conversion rate this week"],
        "strength": "High attention. Works when the claim is specific and plausible.",
        "weakness": "Overpromising destroys trust. Must be defensible."
    },
    "specific_promise": {
        "triggers": ["minutes", "hours", "days", "percent", "$", "steps", "ways", "fix"],
        "weight": 0.80,
        "description": "Names the exact outcome and timeframe",
        "examples": ["Fix your headline in 15 minutes", "A $97 fix that saved $3k/mo in ad spend"],
        "strength": "Concrete promises convert because the reader can assess the effort vs reward instantly.",
        "weakness": "Must deliver on the exact promise inside the email."
    },
    "problem_callout": {
        "triggers": ["leaking", "losing", "costing", "broken", "wasting", "stuck", "failing", "wrong", "mistake"],
        "weight": 0.80,
        "description": "Names a painful problem the reader knows they have",
        "examples": ["Your landing page is leaking buyers", "The CTA mistake 90% of founders make"],
        "strength": "When they feel the pain, they open to find the solution. Specificity of pain matters.",
        "weakness": "Generic problem statements ('Are you making mistakes?') get filtered as spam."
    },
    "social_proof": {
        "triggers": ["founder", "customer", "company", "case study", "how [name]", "saved", "grew", "increased"],
        "weight": 0.65,
        "description": "Uses someone else's result to imply the reader can achieve the same",
        "examples": ["This founder saved $3k/mo with a $97 fix", "How one SaaS doubled conversions in 24h"],
        "strength": "Social proof de-risks the decision to open and act.",
        "weakness": "If the example feels inapplicable, the reader self-excludes."
    },
    "urgency": {
        "triggers": ["today", "now", "last chance", "ending", "limited", "closing", "expires", "today only"],
        "weight": 0.55,
        "description": "Creates a time-pressure reason to act immediately",
        "examples": ["Your audit expires today", "Last chance for the beta price"],
        "strength": "Works for transactional emails. Poor fit for nurture sequences.",
        "weakness": "Fake urgency destroys trust fast. Only use with real deadlines."
    },
    "personal": {
        "triggers": ["your", "you", "Quick question", "personal note", "for you"],
        "weight": 0.70,
        "description": "Feels like a one-to-one message, not a broadcast",
        "examples": ["Your landing page audit results", "Quick question about [domain]"],
        "strength": "Personal framing increases familiarity and trust. Best for follow-ups.",
        "weakness": "Overused in sales sequences — 'Quick question' is heavily filtered now."
    },
    "pattern_interrupt": {
        "triggers": ["wait", "hold on", "actually", "surprising", "secret", "counterintuitive", "nobody talks about"],
        "weight": 0.60,
        "description": "Breaks the expected sales email pattern with an unexpected angle",
        "examples": ["The counterintuitive reason your page isn't converting", "Nobody tells founders this about landing pages"],
        "strength": "Breaks through inbox blindness. Works best when the reader gets dozens of emails a day.",
        "weakness": "If the pattern interrupt is obviously a sales play, it backfires."
    },
}


def score_subject(subject):
    """Score a subject line against all archetypes. Returns scored archetypes + best fit."""
    sl = subject.lower()
    scored = []
    
    for name, arch in ARCHETYPES.items():
        trigger_count = sum(1 for t in arch["triggers"] if t in sl)
        if trigger_count == 0:
            continue
        raw_score = min(1.0, trigger_count / 3.0)
        weighted = round(raw_score * arch["weight"] * 10, 1)
        scored.append({
            "archetype": name,
            "description": arch["description"],
            "trigger_matches": trigger_count,
            "score": weighted,
            "strength": arch["strength"],
            "weakness": arch["weakness"],
            "example": arch["examples"][0],
        })
    
    # Sort by score descending
    scored.sort(key=lambda x: x["score"], reverse=True)
    
    # Overall: best archetype score + bonus for archetype diversity
    if not scored:
        return {
            "score": 0,
            "grade": "F",
            "best_archetype": None,
            "archetypes": [],
            "diagnosis": "No recognizable hook archetype detected. Subject line may be too generic or descriptive.",
            "improvement_hint": "Add a curiosity gap ('why') or specific promise ('in 15 minutes') to trigger an open."
        }
    
    best = scored[0]["score"]
    diversity_bonus = min(2.0, len(scored) * 0.8)
    total = min(10, best + diversity_bonus)
    
    # Grade
    if total >= 8.5:
        grade = "A"
        diagnosis = "Strong subject line. Multiple archetypes at play. High open probability."
    elif total >= 7.0:
        grade = "B"
        diagnosis = f"Good subject. Lead archetype: {scored[0]['archetype']}. Could strengthen with another signal."
    elif total >= 5.0:
        grade = "C"
        diagnosis = f"Average. Primary archetype '{scored[0]['archetype']}' is present but not sharply executed."
    elif total >= 3.0:
        grade = "D"
        diagnosis = "Weak. Archetype signal is faint. Consider rewriting with a clearer hook."
    else:
        grade = "F"
        diagnosis = "Very weak. No clear archetype drives the subject line."
    
    # Improvement hint
    if total < 7.0:
        # Suggest the strongest archetype they're not using
        used = set(s["archetype"] for s in scored)
        suggestions = [n for n in ARCHETYPES if n not in used]
        if suggestions:
            hint = f"Try adding a '{suggestions[0].replace('_', ' ')}' pattern like: \"{ARCHETYPES[suggestions[0]]['examples'][0]}\""
        else:
            hint = "Sharpen the existing archetype. Make the promise more specific."
    else:
        hint = "Good. Consider A/B testing against a different archetype."
    
    return {
        "score": round(total, 1),
        "grade": grade,
        "best_archetype": scored[0]["archetype"] if scored else None,
        "archetypes": scored,
        "diagnosis": diagnosis,
        "improvement_hint": hint,
    }


def analyze_subject_batch(subjects):
    """Score multiple subject lines and return comparison."""
    results = []
    for subj in subjects:
        results.append({
            "subject": subj,
            **score_subject(subj)
        })
    results.sort(key=lambda x: x["score"], reverse=True)
    return results


def test():
    """Test with real sequence subjects and print results."""
    test_subjects = [
        "Your landing page audit results",
        "What the top 1% of landing pages do differently",
        "The 3 most common fixes (and how to get them in 24h)",
        "This founder saved $3k/mo in ad spend with a $97 fix",
        "Your audit shows something interesting about your headline",
        "Quick question about your landing page",
        "Did you see your audit results?",
        "We found 3 conversion leaks on your page",
        "The counterintuitive reason your page isn't converting",
        "How to fix your landing page without hiring an agency",
    ]
    
    results = analyze_subject_batch(test_subjects)
    for r in results:
        print(f"[{r['grade']}] {r['score']}/10  {r['subject']}")
        print(f"       Best: {r['best_archetype']} — {r['diagnosis']}")
        print(f"       Hint: {r['improvement_hint']}")
        print()


if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        subject = " ".join(sys.argv[1:])
        result = score_subject(subject)
        import json
        print(json.dumps(result, indent=2))
    else:
        test()
