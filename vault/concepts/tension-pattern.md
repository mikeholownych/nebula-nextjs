# Tension Pattern Taxonomy

## Core Purpose
Pick one tension pattern Monday morning, build 10 hook lines against it, log them

## Pattern Templates
| Pattern | Template | Maps to archetypes |
|---------|----------|--------------------|
| `authority` | "We've run [volume] across [segment], noticed [contrarian pattern]" | bold_claim, specific_promise, social_proof |
| `contrarian` | "Everyone in [niche] does [X]. We do the opposite and [result]" | pattern_interrupt, bold_claim, curiosity_gap |
| `personal_story` | "[Specific failure]. That's when I realised [insight]" | personal, curiosity_gap, problem_callout |
| `dream_selling` | "If you're [target state], you're probably also [hidden pain]" | problem_callout, curiosity_gap, specific_promise |
| `future_pacing` | "By [timeframe], [prediction]. Here's how we're preparing" | bold_claim, urgency, curiosity_gap |

## Implementation Rules
- **Weekly target**: 10 lines per Monday → 130+ by week 14
- **CLI**: `python3 copy_fatigue_detector.py --bank` shows full hook bank with patterns and test status

## Validation Pattern
```python
from subject_analyzer import suggest_subjects_for_tension, score_with_tension

# Get archetype examples for today's pattern
suggest_subjects_for_tension('contrarian')

# Validate written subject line against the week's chosen pattern
result = score_with_tension('Everyone optimizes campaigns. Wrong lever.', 'contrarian')
print(result['tension_fit'])   # 'strong' | 'partial' | 'weak'

# Log to hook bank
from copy_fatigue_detector import hook_bank_entry, save_hook_entry
save_hook_entry(hook_bank_entry(week=3, lines_written=10,
    chosen_line="Everyone optimizes campaigns. Wrong lever.",
    tension_pattern="contrarian"))
# Persists to /home/mike/nebula/hook_bank.jsonl
```