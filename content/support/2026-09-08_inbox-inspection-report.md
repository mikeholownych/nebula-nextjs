# Inbox Inspection Report — 2026-09-08

## Summary

Read-only warm-reply and payment-path reconciliation.
No email sent, no ledger modified, no leads contacted.

---

## Warm-Reply Cohort

**Count: 1 genuine warm-replied lead**

| Field | Value |
|---|---|
| Email | kanzariyamihir@gmail.com |
| URL | https://referralful.com |
| Stage | warm_replied |
| Reply text | "Hey" |
| Classification | soft_interest |
| Replied at | 2026-07-07T12:01:14Z |
| Our response sent | 2026-07-07T23:59:10Z |
| Days since reply | **63 days stale** (as of 2026-09-08) |
| $97 pitch confirmed sent | NO — no pitch_sent_at in record |
| Payment received | NO |

**Supporting warm-inquiry lead (not classified warm_replied):**

| Field | Value |
|---|---|
| Email | hello@ozigi.app |
| URL | https://ozigi.app |
| Stage | recircle_60d |
| Reply text | "What services do you offer?" |
| Classification | positive_inquiry |
| Replied at | 2026-07-07T17:30:07Z |
| Our response sent | 2026-07-07T23:59:10Z |
| Threaded reply sent | 2026-07-08T08:05:00Z |
| Status | pitched |
| Payment received | NO |

---

## Payment Path Status

**Real payments: $0**
**Test payments excluded: 2**

Ledger entries of note:
- `restart-test@example.com` — $97 test payment, 2026-07-03 (excluded)
- `stripe@example.com` — $30 test payment, 2026-07-05 (excluded)
- `mike.holownych@gmail.com` (gofaultline.dev) — implementation kit delivered 2026-08-05, marked `fulfilled` — this is an internal/test fulfillment run, not a real external buyer payment

**Checkout link status:** Stripe $97 link is live and verified:
https://buy.stripe.com/aFa7sL5E03Iwgyt2Nk43S02
Product: LaunchCrate — Done-For-You SaaS Launch

---

## Cohort-Wide Stage Breakdown (HOT_LEAD.json)

| Stage | Count |
|---|---|
| recircle_60d | 19 |
| bounced | 11 |
| terminal | 5 |
| warm_replied | 1 |
| closed | 6 |
| implementation_kit_delivered | 1 |

Total tracked leads: 43

---

## Last-Contact Timestamps

| Lead | Last outbound | Notes |
|---|---|---|
| kanzariyamihir@gmail.com | 2026-07-07 (our response) | 63 days stale, no pitch confirmed |
| hello@ozigi.app | 2026-07-08 (threaded reply) | 62 days stale, pitched |
| recircle_60d cohort (bulk) | 2026-08-10 to 2026-08-14 (upsell sends) | Last touched ~25–29 days ago |

---

## Approved Next Action

**For kanzariyamihir@gmail.com (referralful.com):**

This lead is 63 days stale with no confirmed $97 pitch ever sent post-reply.
The `our_response_sent_at` field shows we replied to their "Hey" on 2026-07-07,
but there is no `pitch_sent_at` or `stage: pitch_sent` in the record.

Recommended action (requires CEO approval before execution):
  Send a single short re-engagement email to kanzariyamihir@gmail.com in-thread,
  referencing their original "Hey" reply, including the $97 checkout link.
  Frame: "Still thinking about referralful.com — here's the one-click path if ready."

This is NOT a cold outreach — they initiated contact. The window is long but the
lead is still the only genuine warm_replied contact in the system.

**For the recircle_60d cohort:**
  No action needed now. Recircle dates were set to 2026-08-17; upsell sends went
  out 2026-08-10 to 2026-08-14. These are in passive monitoring mode.
  Next scheduled recircle window already passed — Growth should confirm whether
  a new wave was triggered or if these need manual review.

---

## Escalation Required

- **CEO:** kanzariyamihir@gmail.com is 63 days stale with no confirmed $97 pitch.
  Approve or reject the re-engagement send before Support acts.
- **Growth:** recircle_60d cohort recircle dates (2026-08-17) have passed.
  Confirm whether automated recircle wave fired or manual action is needed.

---

## Data Sources Checked

- /home/mike/nebula/HOT_LEAD.json
- /home/mike/nebula/ledgers/customer-ledger.jsonl
- /home/mike/nebula/stats.json

Report generated: 2026-09-08 (read-only run, no writes to any ledger)
