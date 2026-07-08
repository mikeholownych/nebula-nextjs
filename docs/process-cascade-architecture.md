# Nebula Components — Automated Process Cascade Architecture

## Overview

Nebula runs on trigger/action cascades. Every customer interaction starts with a
trigger (a real-world signal), not a list. Once triggered, actions cascade
automatically — no human intervention required.

This document maps the full cascade so every part of the system is documented,
testable, and improvable.

---

## The Master Cascade

```
TRIGGER → LEAD → NURTURE → OFFER → FIX → UPSALE → RETENTION
```

Each stage is a separate cascade with its own triggers and actions.

---

## Layer 1: Lead Acquisition Cascade

### Trigger Sources

| Source | Trigger Signal | Detection Method | Priority |
|--------|---------------|-----------------|----------|
| Reddit | "landing page not converting" + "wasting money on ads" | web_search cron (every 4h) | P1 |
| LinkedIn | Post engagement on Nebula content | Apify poller (every 2h) | P1 |
| Inbound | Free Kit request, audit form submit | HTTP POST to server | P0 |
| Cold email | Reply with interest/pain confirmation | AgentMail webhook | P2 |

### Trigger → Action

```
Trigger detected
  → Score lead (0-10 quality score)
  → If score >= 5: generate value-first reply
  → If score >= 7: log as lead_warm, add to outreach queue
  → If score < 5: log as lead_free_kit, add to nurture queue
```

### Domino Chain (First Interaction)

```
Target posts pain on Reddit
  → Cron detects buying trigger keyword
  → Generates reply (value-first, mentions free audit)
  → Logs in lead_manager as "lead_free_kit"
  → Adds to email_sequence_engine "post_audit" sequence
```

---

## Layer 2: Audit Delivery Cascade

### Trigger Sources

| Trigger | Source | Action |
|---------|--------|--------|
| "Run Audit" button click | Website | POST /api/audit |
| Free Kit download + email capture | Checkout page | POST /api/free-kit |
| Direct URL + email in outreach reply | Reply handler | POST /api/audit with params |

### Audit Cascade

```
Audit requested
  → Scrape target URL
  → Score 5 dimensions: headline, CTA, trust, speed, mobile
  → Generate readable report with scores + fixes
  → Compose email with report + offer
  → Send via AgentMail
  → Log in lead_manager at "lead_audit" stage
  → Enroll in post_audit email sequence (Part 1)
  → Log to ledgers/audit-journal.jsonl
```

### 5 Scoring Dimensions

1. **Headline Clarity (0-10)** — Does it describe the problem or the product?
2. **CTA Actionability (0-10)** — Is it a decision or a label?
3. **Trust Proof (0-10)** — Is social proof above the fold?
4. **Page Speed (0-10)** — Load time > 3s = penalty
5. **Mobile Responsiveness (0-10)** — Works on mobile viewport?

Each dimension maps to a specific fix in the $147 Fix Pack.

---

## Layer 3: Nurture Cascade

### Trigger Sources

| Trigger | Stage | Sequence |
|---------|-------|----------|
| Audit completed | lead_audit | post_audit (Part 1: 2 emails over 2 days) |
| Audit sequence completed | lead_warm | offer_sequence (Part 2: 2 emails over 3 days) |
| Offer clicked but not bought | lead_warm | objection_handling (Part 3: 2 emails over 2 days) |
| Checkout page visited | Any | abandoned_checkout (Part 4: 2 emails over 3 days) |

### Email Sequence Cascade

```
Lead enters stage X
  → Auto-enrolled in corresponding sequence
  → Day 0: First email sent immediately
  → Day N: Next email sent when days_since >= step_day
  → When all steps sent: mark sequence complete
  → Promote lead to next stage (if completes_at defined)
```

### Stage Progression

```
lead_free_kit → (runs audit) → lead_audit → (nurtures) → lead_warm → (buys) → customer_97
```

No downgrades. All moves are one-way up.

---

## Layer 4: Checkout & Payment Cascade

### Trigger Sources

| Trigger | Source | Action |
|---------|--------|--------|
| Checkout page loaded with ?email= param | HTTP GET | POST /api/checkout-visit → log + enroll in abandoned_cart |
| Stripe payment confirmed | Stripe webhook | POST /stripe-webhook → upgrade stage |
| Stripe payment failed | Stripe webhook | Log failure, send dunning email |

### Checkout → Purchase Cascade

```
User lands on /checkout.html?email=x@y.com
  → navigator.sendBeacon POST /api/checkout-visit
  → lead_manager.log_checkout_visit(email)
  → Enroll in "abandoned_checkout" sequence
  → Day 0: "Still thinking about it?" email
  → Day 2: "Last call" email

User completes Stripe payment
  → webhook fires → handle_stripe_webhook()
  → Detect product from metadata
  → Upgrade lead stage to customer_97 or customer_997
  → Send confirmation email with delivery timeline
  → Trigger delivery cascade
```

---

## Layer 5: Delivery Cascade

### Trigger Sources

| Trigger | Product | Delivery |
|---------|---------|----------|
| $147 Fix Pack purchase | Fix Pack | Build hero + CTA + trust + FAQ sections |
| $997 Growth Launch purchase | Growth Launch | Fix Pack + 200 triggered prospects + outreach |
| $197/mo pipeline subscription | Pipeline | Monthly triggered prospect delivery |

### Delivery Timeline

```
P0: Payment confirmed → confirmation email sent (immediate)
P1: Fix Pack build started (within 1h of payment)
P2: Fix Pack delivered (within 24h)
P3: Follow-up check-in (day 7)
```

---

## Layer 6: Retention & Recircle Cascade

### Trigger Sources

| Trigger | Action | Cadence |
|---------|--------|---------|
| 30+ days since last contact | Re-enroll in re-engagement sequence | 30-60 day recircle |
| Customer_97 — 60 days post-purchase | Upsell to $997 Growth Launch | One-time |
| Payment failure | Dunning sequence: Day 0, 3, 7 | 3 emails max |

### Recircle Cascade

```
Cron checks list_recircle_candidates(min_age_days=30)
  → For each candidate: generate new audit finding email
  → Send value-first re-engagement
  → If no reply after 3 touches: move to long-term nurture
  → Never re-engage opted-out leads
```

---

## Architecture Diagram

```
                     ┌─────────────────┐
                     │  Buying Trigger  │
                     │  (Reddit/LI/in)  │
                     └────────┬────────┘
                              │
                              ▼
                     ┌─────────────────┐
                     │  Lead Scoring   │
                     │  0-10 quality   │
                     └────────┬────────┘
                              │
                    ┌─────────┴──────────┐
                    ▼                    ▼
           ┌──────────────┐    ┌──────────────┐
           │  Score >= 7   │    │  Score < 5   │
           │  lead_warm    │    │ free_kit      │
           └──────┬───────┘    └──────┬───────┘
                  │                   │
                  ▼                   ▼
           ┌──────────────┐    ┌──────────────┐
           │  Reply with  │    │  Nurture     │
           │  value       │    │  sequence    │
           └──────┬───────┘    └──────┬───────┘
                  │                   │
                  └─────────┬─────────┘
                            │
                            ▼
                   ┌────────────────┐
                   │  Free Audit    │
                   │  30 seconds    │
                   └───────┬────────┘
                           │
                           ▼
                   ┌────────────────┐
                   │  Email Seq 1   │
                   │  Post-Audit    │
                   └───────┬────────┘
                           │
                           ▼
                   ┌────────────────┐
                   │  Email Seq 2   │
                   │  Offer (warm)  │
                   └───────┬────────┘
                           │
               ┌───────────┴───────────┐
               │                       │
               ▼                       ▼
        ┌──────────────┐     ┌────────────────┐
        │  $147 Fix     │     │  Objection     │
        │  Pack        │     │  Handling Seq  │
        └───────┬──────┘     └────────┬───────┘
                │                     │
                ▼                     │
        ┌──────────────┐              │
        │  $997 Growth │              │
        │  Launch      │              │
        └───────┬──────┘              │
                │                     │
                ▼                     │
        ┌──────────────┐              │
        │  Recircle    │◄─────────────┘
        │  30-60 days  │
        └──────────────┘
```

---

## Quality Gates (applied before every cascade step)

| Gate | Check | Fail Action |
|------|-------|-------------|
| Opt-out check | lead.opted_out == true | Skip entirely |
| Stage progression | new_rank > old_rank | Block downgrade |
| Duplicate send | step_id in sent_steps | Skip repeat |
| Content compliance | No fabricated scarcity, no fake testimonials | Block + flag for review |
| CAN-SPAM footer | Every email has physical address + unsubscribe | Block send |

---

## Ledgers (every action writes to at least one)

| Ledger | Cascade Step | Fields |
|--------|-------------|--------|
| `leads-journal.jsonl` | All lead mutations | timestamp, action, email, stage, source |
| `audit-journal.jsonl` | Audit completed | timestamp, url, scores, email |
| `revenue-cost-ledger.jsonl` | Payment events | timestamp, amount, product, email |
| `decision-ledger.jsonl` | Material decisions | timestamp, context, decision, rationale |

---

*Documented: 2026-07-05 — Nebula Components Automated Process Cascade*
