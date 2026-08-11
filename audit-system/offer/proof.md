# Proof Documentation Protocol

Before/after proof is the only thing that compounds.
One verified fix with measured delta → case study → social proof → more audits.

---

## What to Capture

### Before State
```
Date:           [YYYY-MM-DD]
URL:            [full URL including path]
Finding:        [finding key + label]
Measured value: [exact value from evidence.measured]
Score:          [audit score]
Screenshot:     [before-screenshot.png]
```

### After State (30-day re-audit)
```
Date:           [YYYY-MM-DD]
URL:            [same URL]
Finding:        [same finding key]
Measured value: [new measured value]
Score:          [new audit score]
Screenshot:     [after-screenshot.png]
Delta:          [before → after, as numbers]
```

---

## Example Proof Entry

```markdown
## readyform.app - CTA Fix - July 2026

**Before:**
- Date: 2026-07-15
- CTA text: "Get Started"
- Finding: cta / 4.0 impact
- Evidence: Button text "Get Started" - no outcome stated
- Score: 43 / D

**Fix delivered:** 2026-07-15
- Changed to: "Run my free audit"
- Developer time: 10 minutes
- Cost: $97 One-Leak Repair Sprint

**After (30-day re-audit):** 2026-08-14
- CTA text: "Run my free audit"
- Evidence: Button text confirmed - action + outcome present
- Score: 51 / C
- Delta: +8 score points

**Conversion data (founder-reported, unverified):**
"We went from 1.2% to 2.1% conversion in the first two weeks."
```

---

## Case Study Eligibility

A finding becomes a case study when:

1. ✅ Before screenshot with measured value
2. ✅ Fix brief delivered and implemented
3. ✅ After screenshot with verified new state
4. ✅ Score delta ≥ 5 points OR founder-reported conversion lift
5. ✅ Founder consents to publish (explicit or implied by public testimony)

---

## What to Do With It

1. **Tweet the before/after** - "Changed 3 words on a landing page. Score went from 43 to 51."
2. **LinkedIn post** - Results story format (see content-factory/linkedin.md)
3. **Add to nebulacomponents.shop/teardowns** as a real case study
4. **Use in audit delivery emails** as social proof for the Sprint offer
