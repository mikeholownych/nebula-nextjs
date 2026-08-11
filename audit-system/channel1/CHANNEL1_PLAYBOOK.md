# Channel 1 - Founder-Led Outbound + LinkedIn (90-Day Playbook)

**Primary channel. The other 89 days of this plan live or die on reply rate here.**

Source: external channel plan (2026-07-31) adapted to Nebula's existing stack.
Alignment check: this playbook enforces the Rananjay cold-DM structure already
implemented in `pipeline/send_outreach.py` (4 sentences, one question mark in S4,
pre-send checklist) and the trigger-aware rules in `high-intent-outreach`.

---

## 1. Micro-segment (pick ONE, stay narrow)

**Primary:** B2B SaaS founders/marketers running paid ads to a single landing
page with low or no conversions.

Observable criteria (all must be checkable from public signals):
- They post on LinkedIn about ads, CAC, or landing pages
- They have a visible landing page receiving paid traffic
- They are not already paying a big agency (they'd say so)

**Fallback segments (if Primary is dry):** ecommerce store owners complaining
about ROAS; coaches/consultants running lead-ads to a booking page.

## 2. Prospect list (30–50 for the first 4–6 weeks)

Sources, in order of signal strength:
1. People engaging with your Nebula posts (comments on ad/landing content) - +2 score
2. Commenters on 3–5 creator posts about CRO/landing pages (see `linkedin_post_monitor.py` pattern in high-intent-outreach skill)
3. LinkedIn search: "founder" + "paid ads" / "CAC" / "landing page" in headline or posts
4. Existing signal-watcher queue (Reddit/IH/HN pain posts with LinkedIn profiles)
5. **Reddit official API (PRAW)** - `reddit_monitor_praw.py` → `intake_signal_queue.py --queue reddit_leads.jsonl`. The only lane that surfaces TRUE ad-spend ICP (Tier A) - the HN/PH queue is almost all launch ICP. Needs Reddit script-app creds in `~/.hermes/secrets/reddit.env` (2-min setup)
6. Warm prior contacts (anyone who ran an audit but didn't buy - 30-day recircle)

Track in `channel1/pipeline_sheet.csv` via `channel1/pipeline_sheet.py`:
`name, company, url, linkedin, email, source, trigger, status, first_contact, last_contact, notes`

Statuses = canonical lifecycle: `audience → engaged → audit_requested →
audit_completed → problem_confirmed → commercially_qualified → fix_offered →
fix_purchased → fix_delivered → outcome_measured → case_study_eligible`
(+ terminal: `bounced`, `dead`).

## 3. The offer (no pressure, no call)

1. Free, no-call landing page audit (nebulacomponents.shop/audit).
2. Deliver top 3–5 issues with evidence → then:
   - Implement it themselves (audit findings are the deliverable), or
   - Buy the $97 Fix Pack: targeted AI prompts for their specific failing
     signals, delivered instantly, 30-day re-audit included. Customer implements.

**Critical distinction:** we sell the *repair brief*, not implementation labor.
That is the whole product. Do not drift into "I'll fix it for you" - that's a
different, unbuilt offer.

## 4. Execution cadence (3–4 days/week)

- **Day 1 (daily):** 17-min engagement routine - reply to comments on your posts
  (24h SLA), comment value-only on 3–5 ICP posts, send 3–5 touch-1 DMs.
- **Weekly:** 5–10 new offers. 30–50 prospects in the sheet by week 6.
- **Pre-audit the top tier:** for prospects with score ≥8 (explicit spend pain +
  live URL), run the audit BEFORE outreach ($0.10 USDC each via x402) and lead
  with the measured finding. Cheapest trust builder in the stack.
- **Follow-ups:** exactly 2 (day 3, day 10), then stop. Templates below.
- **Reply SLA:** warm reply → respond within 60 minutes. Ask for URL, run audit,
  deliver. Never pitch a call.

## 5. Measure (the only numbers that matter)

| Metric | Target (6 weeks) | Where it lives |
|---|---|---|
| Offers sent | 5–10/week | pipeline_sheet.csv |
| Audits requested | 5–10 total | pipeline_sheet.csv + PostHog |
| Audits delivered | as requested | pipeline_sheet.csv |
| $97 Fix Packs | 3–5 (goal) | Stripe + ops-finance ledger |
| Reply rate per angle | ≥20% on triggers | reply_diagnostics.jsonl (48h diagnostic) |

**Kill rule:** any message angle with 0 replies after 10 sends gets diagnosed
(via `diagnose_reply` / reply_diagnostics.jsonl) and rewritten - never re-sent
as-is. Volume does not fix a broken S3.

## 6. Channel 2 (bottom-funnel SEO/AEO) - foundations already exist

Already built: Citable stack, technical SEO (search console, sitemaps, schema),
learning centre, audit pages, agent-readiness (llms.txt, releases page).
Remaining Channel 2 work is 3–5 bottom-funnel pages ("AI-powered landing page
audit for SaaS paid ads", "AEO for SaaS landing pages", etc.). **Do not start
these until Channel 1 shows a reply signal OR a week with zero outreach
capacity.** The plan's own advice: Channel 1 brings the first revenue; Channel 2
is the slow compound.

## 7. Do not do (constraints)

- No links in LinkedIn post bodies (algorithm penalty - link-in-first-comment is
  also hidden; DMs are private, links OK there)
- No pitch in touch 1. Value or ask-first, never "I offer X"
- No cold email when a public thread reply exists - thread first, email second
- No Calendly links (no verified scheduler); ask timezone + availability
- No CAN-SPAM violations: email sends go through send_outreach.py with the
  checklist gate + compliance footer
- Never auto-post LinkedIn. Drafts only, manual send from Mike's account.
