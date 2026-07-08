# Validation Framework — Nebula Components

## Adapted from "The 30-Day SaaS Buildout Blueprint"

The blueprint's Section 5 says: "There's no point building anything if people don't want it."
For Nebula, this means: **validate buying triggers before building new offers.**

### When to Validate

| Scenario | Validation Required | Method |
|----------|-------------------|--------|
| New trigger keyword added | Yes | Run cron, check 5+ real results match intent |
| New offer tier created | Yes | Beta tester program, 5+ signups before building |
| New channel (new platform) | Yes | Manual test 10 prospects, track reply rate |
| New ICP horizontal | Yes | 20+ triggered leads scored, 70%+ match rate |

### The 10-Prospect Test

Before building any new offer or channel:

1. Find 10 prospects via existing triggers
2. Send manual value-first outreach
3. Track: opens, replies, positive signals
4. If 3+ of 10 reply with interest → BUILD
5. If <3 of 10 reply → PIVOT (different angle, not more volume)

### Beta Tester Validation Flow

```
Prospect applies at /beta-tester.html
  → Review criteria:
     - Running paid ads?
     - Conversion under 2%?
     - Own their landing page?
     - Willing to track results for 7 days?
  → If yes: accept, deliver Fix Pack free
  → After delivery:
     - Day 3: check implementation status
     - Day 7: request case study + results
     - Day 14: publish case study (with approval)
  → If case study completed: upgrade to customer_97
```

### What Not to Validate

- Don't validate what's already working (audit pipeline, Fix Pack)
- Don't validate with adjacent markets (test your ICP only)
- Don't validate with "would you use this?" — validate with "will you give me your URL?"

### Validation Evidence Standard

| Signal | Strength | What counts |
|--------|----------|-------------|
| Beta signup | STRONG | Submitted email + URL + company info |
| Audit run | STRONG | Completed audit with scores |
| Reply to outreach | MODERATE | Engaged with value-first message |
| Case study completed | STRONG | Written case study + permission to share |
| $147 purchase | STRONGEST | Actual payment |

---

*Documented: 2026-07-05 — Nebula Components Validation Framework*
