# Evidence Dispatch Template

Create one file per dispatch under `content/evidence-dispatch/`.

```yaml
---
dispatch_id: <lowercase-id>
format: audit_pattern # audit_pattern | founder_teardown | ai_visibility_check | build_note
title: <specific, non-clickbait title>
status: draft

trigger:
  source_url: <URL>
  source_type: live_html # live_html | founder_statement | audit_record | production_event | internal_build
  observed_at: <YYYY-MM-DD>
  exact_quote: "<verbatim trigger or problem statement>"

evidence:
  page_url: <URL>
  captured_at: <YYYY-MM-DD>
  capture_hash: <optional hash>
  items:
    - claim: <observable claim>
      verbatim_quote: "<exact source text>"
      locator: <selector, line, screenshot region, event id, or record id>
      status: verified

finding:
  statement: <what is visibly or programmatically true>
  limitation: <what this evidence does not prove>
  bounded_fix: <one concrete next action>

distribution:
  channels: [site]
  approval_required: true
  approved: false
  notes: <no-send or channel constraints>

measurement:
  ledger_slug: <existing teardown ledger slug or dispatch slug>
  baseline_metrics:
    referral_visits: 0
    audit_starts: 0
    audit_completions: 0
    repair_purchases: 0
  success_signal: <response, share, qualified audit, completion, or purchase>
  review_after_days: 7

review:
  reviewer: <person>
  decision: pending
  reviewed_at: <YYYY-MM-DD>
  notes: <review notes>
---

## Hook

<one specific, evidence-backed opening line>

## What the evidence shows

<quote the source and explain only what it establishes>

## Why it matters

<bounded interpretation; do not claim causation without measurement>

## One fix

<one concrete, scoped recommendation>

## CTA

<value-first next step; no unapproved outreach or price claim>
```

## Publication gate

Do not move to `published` or `measuring` until:

- every finding is verified against the current source;
- limitations are stated;
- no causal claim exceeds the evidence;
- the distribution approval is recorded;
- the existing ledger has a matching `ledger_slug`;
- baseline metrics are recorded as observed values, including zero;
- the CTA and channel are verified to exist.
