# A/B Test Plan — Nebula Components Landing Page

## Test 1: Hero Headline
| Variant | Headline | Hypothesis |
|---------|----------|------------|
| **Control** | "Your landing page is leaking money. We'll tell you exactly where — free." | Current baseline |
| **Variant A** | "Stop bleeding ad spend. Get a free diagnosis that shows exactly why your page doesn't convert." | Stronger pain + outcome framing increases form starts |
| **Variant B** | "Spent $10K on ads with zero sales? We'll show you the exact leaks — for free." | Specific dollar trigger matches ICP's reality |

**Metric**: Audit form submission rate | **Duration**: 14 days or 100 submissions

---

## Test 2: Primary CTA Button
| Variant | Text | Hypothesis |
|---------|------|------------|
| **Control** | "Get Your Free Audit Now →" | Current baseline |
| **Variant A** | "Find My Leaks →" | Action-oriented, curiosity-driven |
| **Variant B** | "Yes, Diagnose My Page →" | Commitment framing, higher intent filter |

**Metric**: Click-through rate → form completion rate | **Duration**: 14 days

---

## Test 3: Trust Signal Placement
| Variant | Placement | Hypothesis |
|---------|-----------|------------|
| **Control** | Trust bar below form (Guarantee + Stripe + GDPR) | Current baseline |
| **Variant A** | Trust bar above form + below CTA (double exposure) | Reinforcing trust before commitment increases submits |
| **Variant B** | Social proof counter ("40+ audits delivered") above the CTA, trust bar below | Social proof before action increases conversion |

**Metric**: Form submission completion rate | **Duration**: 14 days

---

## Test 4: Audit Result CTA (Post-Submit)
| Variant | Text | Hypothesis |
|---------|------|------------|
| **Control** | "Get the $147 Fix Pack →" | Current baseline |
| **Variant A** | "Fix these issues now — $147 one-time" | More specific about what they get |
| **Variant B** | "Deploy your fixes → $147" | Action-oriented, implies speed |

**Metric**: Stripe checkout click-through rate | **Duration**: 14 days

---

## Test 5: Urgency Signals
| Variant | Signal | Hypothesis |
|---------|--------|------------|
| **Control** | "3 audits delivered today" in sticky bar | Current baseline |
| **Variant A** | "12 people are viewing this audit right now" | Social proof scarcity increases action |
| **Variant B** | "Your free audit slot expires in [timer]" | Time scarcity increases conversion |

**Metric**: Sticky bar CTA click rate | **Duration**: 14 days

---

## Implementation Method
- Use Google Optimize (deprecated) or server-side cookie-based A/B via [A/B middleware]
- For MVP: manual 2-week split by day-of-week (Mon/Wed/Fri = Control, Tue/Thu = Variant A)
- Track via GA4 events with `ab_test_variant` parameter
- Statistical significance threshold: p < 0.05 (95% confidence)
- Minimum sample: 50 conversions per variant per test
