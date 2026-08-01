# ICP Signal Detection

The ICP is not a demographic. It is a moment.

**The moment:** A founder just burned a budget cycle on ads and got zero conversions.
They are actively looking for an explanation right now. That's who you respond to.

---

## Pain Keywords (scored at +10 each)

These indicate the spending-without-converting problem:

```
not converting        zero conversions      no conversions
low conversions       bad conversions       bleeding money
wasting money         losing money          roas
ad spend              landing page          bounce rate
no leads              no sales              paid traffic
```

## Founder Signals (scored at +8 each)

These confirm they own the product:

```
founder    ceo    my startup    my product    my saas    my landing
```

## Ad-Bleed Keywords (scored at +12 each)

These confirm active ad spend:

```
google ads    facebook ads    fb ads    meta ads
ppc           paid ads        ad budget    spending on ads
```

## Source Multipliers (scored at +15)

```
reddit_explicit_pain    indiehackers    linkedin    referral
```

---

## Scoring Logic

```javascript
// Total ICP score: max 100
score = 0
for keyword in pain_keywords: if found in context: score += 10
for keyword in founder_signals: if found in context: score += 8
for keyword in ad_bleed_keywords: if found in context: score += 12
if email is valid non-generic: score += 10
if email contains founder/ceo/hello: score += 5
if source in high_yield_sources: score += 15
if url is valid non-example: score += 5
score = min(score, 100)
```

## Segment Routing

| Score | Segment | Action |
|-------|---------|--------|
| ≥70 | hot | Immediate Telegram alert + priority outreach |
| 40–69 | warm | Queue for outreach within 24h |
| 20–39 | cold | Monitor, no immediate action |
| <20 | skip | Discard |

---

## Signal Sources Ranked by Quality

1. **Explicit pain post** — founder writes "spent $600 on Google Ads, zero leads"
   → Respond within 1 hour. Thread is live. Direct offer to audit.

2. **Named product + conversion failure** — "my [product name] landing page converts at 0.3%"
   → Highest value. Audience sees the audit. Public social proof opportunity.

3. **Generic complaint** — "landing pages don't convert" without specifics
   → Lower signal. Still worth monitoring. Don't respond unless you have something specific.

4. **Inbound audit request** — they submitted their URL at nebulacomponents.shop
   → Already warm. Move directly to audit delivery.
