# Evidence Protocol

Every finding must carry three numbers: **measured**, **required**, and **delta**.
Without all three, you have an opinion. With all three, you have a diagnosis.

---

## The Evidence Format

```
measured:  What we actually found (exact value, tag, text, count)
required:  What needs to be true for this to not be a leak
delta:     The gap - and why it matters in the context of paid traffic
confidence: measured | contextual | inferred
```

---

## Confidence Levels

| Level | Meaning | When to use |
|-------|---------|-------------|
| `measured` | Directly observed in fetched HTML, headers, or DOM | Tag present/absent, text content, status codes |
| `contextual` | Inferred from source proxies - rendered viewport unverified | Above-fold placement, CTA visibility, JS-rendered content |
| `inferred` | Pattern match only | Scoring models, likelihood estimates |

**Rule:** Never present `contextual` findings as `measured`. Label them correctly.
If you can't measure it directly, say so. The audit's credibility depends on this.

---

## Examples by Finding Type

### Headline (measured)
```
measured:  No <h1> tag found in document source
required:  Exactly one <h1>, 12–90 chars, containing primary value proposition
delta:     Missing entirely - Google auto-generates SERP headline from body copy
confidence: measured
```

### Above Fold (contextual)
```
measured:  Hero content begins at character position 8,400 in source HTML
required:  Headline, CTA, and offer term visible within first 3,000 source characters
delta:     Source order proxy only - rendered viewport position unverified
confidence: contextual
note:      "Run Lighthouse or screenshot tool to confirm rendered position"
```

### Ad Tracking (contextual)
```
measured:  0 of 4 expected tracking artifacts found in static HTML
required:  Facebook Pixel init, GA4 measurement ID, UTM-bearing links, conversion events
delta:     Client-side or server-side tracking may exist - static source alone cannot confirm absence
confidence: contextual
note:      "Verify with DevTools Network tab on live page"
```

---

## What Evidence Does for You

1. **Makes the audit defensible.** Founders push back. "My developer says it's fine." You have exact selector, exact value, exact timestamp.

2. **Creates content.** "Measured: Google's SERP result shows Lorem ipsum dolor sit amet as the meta description" is a LinkedIn post. A generic "meta description is missing" is not.

3. **Seeds the fix brief.** The developer gets measured vs required. They know exactly what to change without interpretation.

4. **Enables before/after proof.** Re-audit the same selectors post-fix. Score the delta. That's your case study.

---

## Screenshot Protocol

When capturing evidence for high-impact findings:

1. **Capture the broken state** - full page screenshot + selector highlight
2. **Annotate the finding** - overlay the measured value
3. **Save path format:** `screenshots/{audit_id}/{finding_key}-before.png`
4. **Store URL in findings.json** under `evidence.screenshot_url`

This becomes the visual proof that powers both the fix brief and the case study.
