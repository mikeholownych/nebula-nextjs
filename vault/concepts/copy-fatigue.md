# Copy Fatigue Detection System

## Core Purpose
Identify when copy needs refreshing before performance drops

## Implementation Rules
Use `copy_fatigue_detector.py` before changing anything when reply rate drops:
```python
from copy_fatigue_detector import diagnose_fatigue

d = diagnose_fatigue(
    reply_rate_now=1.1,       # current %
    reply_rate_4w_ago=4.2,    # 4 weeks ago %
    bounce_rate=0.9,          # %
    spam_rate=0.05,           # %
    warmup_score=82,          # 0-100
    drop_is_gradual=True,     # True = 2-6 weeks; False = within days
)
# d['diagnosis']: 'copy_fatigue' | 'infrastructure_breakdown' | 'healthy' | 'ambiguous'
# d['action']: exact prescription
```

## Metric Thresholds (100-Day Scorecard)
| Metric | Green | Yellow | Red |
|--------|-------|--------|-----|
| Positive reply rate | ≥3% | 1-3% | <1% |
| Open rate | ≥40% | 25-40% | <25% |
| Bounce rate | <1.5% | 1.5-2.5% | >2.5% |
| Spam complaints | <0.1% | 0.1-0.3% | >0.3% |
| Warmup score | >70 | 60-70 | <60 |
| Per-inbox sends/day | 10-15 | 15-20 | >20 |

## Action Rules
- **Copy fatigue → action**: Block Monday morning, write 10 new hook lines, test strongest Tuesday
- **Infrastructure breakdown → action**: STOP sending. Fix until all green. New copy will NOT save broken infra

## Critical Rules
- **Open rate <40%** = deliverability issue or subject fatigue (Illingworth)
- **Pass `open_rate=`** to `diagnose_fatigue()` — zones it automatically
- **Diagnose before changing copy**