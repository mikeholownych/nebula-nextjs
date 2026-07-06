# 7-Day Infrastructure & Offer Hardening Plan
# Target: July 4, 2026 challenge-ready

**Goal:** Zero single points of failure, value-first funnel converting at ≥1 paying customer/week.

**Deadline:** Saturday July 4, 2026 10:36 AM ET (168 hours from now)

**Constraint:** Agent executes autonomously. User approves only complex spend.

---

## Workstream 1 — INFRASTRUCTURE (Days 1-2)
*Eliminate every silent failure mode*

### 1A: Kill the duplicate cloudflared / fix port 8765 systemd
- [ ] Stop the user-level cloudflared duplicate (PID 706361)
- [ ] Create systemd unit for port 8765 (`nebula-site.service`) as mike user
- [ ] Verify both services survive a `kill -9` + auto-restart
- [ ] Test: `curl -s https://nebulacomponents.shop` returns HTTP 200 after simulated crash

### 1B: Stripe webhook as a persistent service
- [ ] Wrap stripe_webhook.py in systemd unit (`nebula-webhook.service`)
- [ ] Verify webhook receives test events from Stripe dashboard
- [ ] Log every payment to `/home/mike/nebula/payments.log`
- [ ] Alert: send email to nebulashop@agentmail.to on every sale

### 1C: Watchdog hardening
- [ ] Replace Python http.server with a proper static file server (busybox httpd or Python with correct MIME types)
- [ ] Single watchdog cron (every 5 min) checks: 8765 up, 8766 up, cloudflared up, webhook up
- [ ] Watchdog uses zero LLM tokens — pure bash
- [ ] On failure: restart + log to `/home/mike/nebula/watchdog.log`

---

## Workstream 2 — OFFER REBUILD (Days 2-3)
*Replace cold-blast-to-payment-link with value-first sequence*

### 2A: Free Audit Delivery System
- [ ] Write `deliver_audit.py` — takes a URL, runs Lighthouse + manual checklist, generates PDF or HTML audit report
- [ ] Audit covers: above-fold clarity, CTA strength, social proof, load time, mobile
- [ ] Report branded: "Nebula Audit" header, 5-10 specific findings, 3 priority fixes
- [ ] Auto-deliver via email within 60 min of warm reply

### 2B: Email sequence rewrite
- [ ] Email 1 (cold): specific observation about THEIR landing page, NO pitch, NO link, ends with question
- [ ] Email 2 (after reply): "I did a quick audit — attaching findings, no strings" + audit PDF
- [ ] Email 3 (after audit delivered, 48h later): "If you want us to implement these, it's $97 flat — one week turnaround"
- [ ] Email 4 (follow-up, 5 days later): "Still available if timing changed"
- [ ] All from nebulashop@agentmail.to

### 2C: Nebula site update
- [ ] Landing page headline: "We audit your landing page free. Pay $97 only if you want us to fix it."
- [ ] Remove the $7 kit as the primary CTA — move to secondary offer below the fold
- [ ] Add: "156 emails sent. 2 replies. 0 sales. Here's what we're changing." — social proof via honest numbers
- [ ] Stripe link for $97 audit implementation service wired to new checkout

---

## Workstream 3 — LEAD ENGINE (Days 3-4)
*Daily pipeline of live intent signals, not static lists*

### 3A: Intent-signal scraper (daily cron)
- [ ] Scrape Indie Hackers "Landing Page Feedback" — extract poster + URL
- [ ] Scrape Reddit r/EntrepreneurRideAlong + r/SideProject — "roast my landing page" + "feedback" posts
- [ ] Optionally: HN "Show HN" posts with landing page links
- [ ] Deduplicate against `/home/mike/nebula/contacted.json`
- [ ] Output: `/home/mike/nebula/leads_YYYY-MM-DD.json`
- [ ] Run: daily at 8 AM ET

### 3B: Personalized outreach cron
- [ ] For each new lead: visit their landing page, extract: headline, CTA, missing social proof
- [ ] Generate email: "I noticed [specific observation about their page]..." — no template feel
- [ ] Send max 10/day (quality > volume)
- [ ] Record sent to `contacted.json`
- [ ] Run: daily at 9 AM ET (1 hour after scraper)

---

## Workstream 4 — INBOX INTELLIGENCE (Days 4-5)
*Every warm reply gets a real response within 60 minutes*

### 4A: Triage system
- [ ] `check_inbox.py` classifies replies: warm / cold / bounce / unsubscribe
- [ ] Warm = any reply that isn't "remove me" or auto-bounce
- [ ] Warm replies: log to `/home/mike/nebula/warm_leads.json` with timestamp + content
- [ ] Cold/unsubscribe: log, do not respond

### 4B: Audit auto-trigger
- [ ] On warm reply detection: extract their URL from the original email context
- [ ] Trigger `deliver_audit.py` automatically
- [ ] Send audit email within 60 min (cron runs every 15 min)
- [ ] Log: audit delivered timestamp, lead name, URL

### 4C: Follow-up sequencer
- [ ] Track each lead state: contacted → replied → audit_sent → pitch_sent → closed
- [ ] State machine in `/home/mike/nebula/lead_states.json`
- [ ] Cron checks states daily: send next sequence email if state warrants it

---

## Workstream 5 — BLOG / SOCIAL PROOF (Days 5-6)
*Build-in-public engine that generates trust while we sleep*

### 5A: Live stats API
- [ ] Endpoint at `/api/stats` (served by webhook server): returns JSON with real metrics
- [ ] Metrics: revenue, emails_sent, replies, open_convos, uptime
- [ ] Blog theme fetches this dynamically with JS — no more hardcoded HTML

### 5B: Automated blog posts
- [ ] Weekly auto-post: every Saturday AM, publish challenge recap with real numbers
- [ ] Format: "Week N: X emails, Y replies, Z revenue — what we learned"
- [ ] Cron: Saturdays 9 AM ET

### 5C: SEO basics
- [ ] Submit blog sitemap to Google Search Console
- [ ] Add meta descriptions to all posts
- [ ] Internal link: blog posts → nebulacomponents.shop audit offer

---

## Workstream 6 — JULY 4 DRY RUN (Day 7)
*Prove everything works before the clock starts*

### 6A: Full system smoke test
- [ ] Kill and restart all services — verify auto-recovery within 2 min
- [ ] Send 1 test outreach email through full pipeline — verify delivery + inbox logging
- [ ] Trigger 1 test warm reply — verify audit auto-generated + delivered
- [ ] Hit Stripe test checkout — verify payment log + sale notification email

### 6B: Challenge brief document
- [ ] Write `/home/mike/nebula/docs/challenge-july4-brief.md`:
  - Target: 1 paying customer ($97) within 7 days
  - Daily cadence: 8 AM scrape, 9 AM send, check inbox every 15 min
  - Success criteria: Stripe payment + delivered implementation
  - Escalation: anything requiring spend > $20 → notify user

---

## Daily Execution Schedule (Agent-run, no user input needed)

| Day | Date | Workstreams |
|-----|------|-------------|
| 1 | Jun 28 | 1A, 1B |
| 2 | Jun 29 | 1C, 2A |
| 3 | Jun 30 | 2B, 2C, 3A |
| 4 | Jul 1  | 3B, 4A |
| 5 | Jul 2  | 4B, 4C |
| 6 | Jul 3  | 5A, 5B, 5C |
| 7 | Jul 4  | 6A, 6B — challenge brief + dry run |

---

## Definition of "Bulletproof"

Infrastructure is bulletproof when:
- Any single process can be killed and restarts within 120 seconds automatically
- The public site returns HTTP 200 within 30 seconds of a crash
- A Stripe payment creates a log entry and sends a notification email
- The inbox is checked every 15 minutes and warm replies are acted on within 60 minutes

Offers are bulletproof when:
- The funnel sequence is: observation email → free audit → $97 ask
- Every step is automated — no human execution required
- Reply-to-audit latency < 60 minutes
- Lead source refreshes daily with new intent signals
