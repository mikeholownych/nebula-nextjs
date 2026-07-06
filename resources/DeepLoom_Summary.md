# DeepLoom Resources Summary – Actionable Playbooks

## 1️⃣ LinkedIn Outreach System (50‑70 calls / month)

**Core Moves**
1. **Signal List** – Pull prospects who showed buying intent in last 30 days (post commenters, profile visitors, job‑change triggers). Use Sales Navigator + PhantomBuster. Target 50‑100 new names per week.
2. **Connection Request** – 200‑char personalized note referencing a specific post or insight. Aim for 55‑70 % acceptance.
3. **Value‑First DM** – Wait 48 h after connection. Send a 3‑sentence DM delivering a framework/resource tailored to the prospect’s recent activity. No ask.
4. **Autonomous CTA** – Route directly to self-serve audit and checkout; no calendar link.
5. **Metrics Tracker** – Track Accept Rate, Reply Rate, Call‑to‑Call (CTC) conversion, Show Rate. Red‑flag thresholds: Accept < 40 %, Reply < 15 %, CTC < 10 %.

**Tools & Costs**
| Tool | Role | Cost/mo |
|---|---|---|
| LinkedIn Sales Navigator | ICP + signal sourcing | $100 |
| PhantomBuster | Automate connection requests | $56 |
| Clay | Enrichment & personalization | $149 |
| n8n (self‑hosted) | Workflow automation | $20 |
| Notion | CRM / pipeline | $16 |
| Calendly | Call booking | $12 |

**Next Steps**
- Create a Notion board named "LinkedIn Outreach" with the four‑move workflow.
- Draft the three message templates (connection, value‑first, soft ask) – see section **Templates** below.
- Set up a weekly n8n workflow: 1) Pull signals → 2) Append to Notion → 3) Trigger PhantomBuster.
- Build a simple dashboard (Notion or Google Sheets) to record the four metrics.

**Templates**
```
Connection Request (≤200 chars):
"Your post on <topic> caught my eye – especially the point about <insight>. I help <ICP> achieve <outcome>. Would love to connect."

Value‑First DM (Day 2):
"Hey <Name> — quick one. Based on your recent <post/company stage>, I thought this <framework/resource> might be useful: <1‑sentence value>. No ask – just wanted to put it on your radar."

Soft Ask (after reply):
"That’s exactly the problem we solve for <niche> founders. We’ve helped <client type> go from <X> to <Y> in <timeframe>. Would a 20‑min call be worth it to see if it applies to you?"
``` 

---

## 2️⃣ Cold Email System (10‑15 qualified calls / week)

**Infrastructure Checklist**
- Register **3‑5 separate sending domains** (e.g., getnebula.io, nebulahq.com) – never use the primary domain.
- Set **SPF**, **DKIM** (2048‑bit), **DMARC** (p=quarantine) for each domain.
- Create **2 inboxes per domain** with real names & signatures.
- Warm‑up each domain for **3‑4 weeks** using Instantly.ai or Mailreach.
- Verify all emails with NeverBounce/ZeroBounce.

**ICP Definition (3‑layer)**
1. **Firmographic** – B2B SaaS, 10‑200 employees, US/CA, $1‑10 M ARR, uses HubSpot.
2. **Behavioral** – Posts weekly on LinkedIn, hiring SDRs, recently launched outbound.
3. **Trigger** – Series A funding, new VP of Sales, Q1 planning.

**Sequence (5 emails / 21 days)**
| Email | Day | Angle | Subject (≤7 words) | Length |
|---|---|---|---|---|
| 1 | 1 | Direct value + social proof | "Quick question on <outcome>" | 4‑6 lines |
| 2 | 4 | Problem agitation | "Re: <subject‑1>" | 3‑5 lines |
| 3 | 8 | Mini case study | "How <similar company> did X" | 5‑7 lines |
| 4 | 14 | Resource offer | "Thought you might find this useful" | 3‑4 lines |
| 5 | 21 | Break‑up / final ask | "Should I close your file?" | 2‑3 lines |

**Personalization Stack**
- Collect **5 signals** per prospect: recent LinkedIn post, website headline, news mention, job title/pain point, growth stage.
- Feed signals to a **Claude** prompt that outputs: opening line, pain point, CTA.
- Human‑review **10 %** of each batch before send.

**Metrics**
- Open ≥ 40 %, Reply 5‑15 %, Positive Reply 2‑8 %, Call Booking 1‑5 %.
- Track weekly; if any metric falls below threshold, run a 30‑min optimization loop (subject line test, ICP tweak, copy revision).

**Next Steps**
- Choose a domain registrar (e.g., Namecheap) and purchase 3 domains.
- Configure DNS records (SPF/DKIM/DMARC) – use Cloudflare for DNS management.
- Set up Instantly.ai workspace, import verified list, schedule warm‑up.
- Build a **Claude** prompt template (see below) and integrate via a small Python script that reads the enrichment CSV and writes the 5‑email JSON for Instantly.

**Claude Prompt (template)**
```
You are an expert B2B copywriter. Write a concise, personalized cold‑email sequence (5 emails) for a prospect with the following data:
- Recent LinkedIn post: {{linkedin_post}}
- Company headline: {{company_headline}}
- Recent news: {{news}}
- Job title/pain point: {{title_pain}}
- Growth stage: {{stage}}
Use a direct, no‑fluff tone. Each email must be plain‑text, 2‑7 lines, and end with a single low‑friction question. Output JSON with keys: subject, body, day.
```

---

## 3️⃣ Agentic Lead‑Gen (5‑Agent Architecture – $200/mo)

**Agents & Responsibilities**
| Agent | Function | Key Tools |
|---|---|---|
| Scout | Find & filter leads (ICP) | Apollo, Clay, LinkedIn Sales Navigator |
| Researcher | Enrich each lead (5 signals) | Clay, Clearbit, LinkedIn, Crunchbase |
| Writer | Generate personalized 5‑email sequence | Claude API, Clay prompt workflow |
| Tracker | Monitor opens/replies/clicks, flag hot signals | Instantly webhook, n8n, HubSpot CRM |
| Closer | Route hot leads, schedule calls, update CRM | Calendly, HubSpot, Claude for follow‑up drafts |

**Data Layer** – Use a **Clay table** as the shared source. Each agent reads/writes JSON rows. n8n/webhooks move data between agents.

**Build Order** (weekly plan)
- **Week 1** – Scout Agent: Apollo query → CSV → Clay → schedule weekly run.
- **Week 2** – Researcher Agent: For each new lead, run Clay enrichment steps, store JSON.
- **Week 3** – Writer Agent: Claude prompt per enriched profile → JSON email sequence → Instantly API.
- **Week 4** – Tracker Agent: Set up Instantly webhook → n8n workflow that scores engagement, pushes hot leads to Closer.
- **Week 5** – Closer Agent: Auto‑send Calendly link on high‑intent opens, create HubSpot deals.

**Weekly Ops (2‑3 h)**
1. Review Writer output sample (random 10 %).
2. Check Tracker alerts for high‑intent signals.
3. Run Closer hand‑off meeting with founder (review hot leads).
4. Update ICP filters in Scout if acceptance/reply rates dip.

**Next Immediate Action**
- Create a **Clay table** named `Agentic_Leads` with columns: `name,email,company,linkedin_post,website_headline,news,role_pain,stage, enrichment_status, email_sequence, engagement_score`.
- Add a **GitHub issue** for “Implement Agentic Lead‑Gen – Scout Agent” (see Todo below).

---

## 📋 Summary of Action Items (to be added to the Hermes TODO list)
1. Draft LinkedIn outreach templates and store in `resources/LinkedIn_Templates.md`.
2. Set up Notion board & metric dashboard for LinkedIn outreach.
3. Purchase & configure 3 sending domains for cold email; create SPF/DKIM/DMARC records.
4. Build Claude prompt template for cold‑email sequence and store in `resources/ColdEmail_ClaudePrompt.txt`.
5. Create Clay table `Agentic_Leads` and initial n8n workflow skeleton.
6. Add GitHub issues for each of the five agents (Scout, Researcher, Writer, Tracker, Closer).
7. Schedule a 30‑min planning sync (already in TODO) to assign owners for each agent.

---

*All numbers are based on DeepLoom case studies; adjust to Nebula’s budget and target volume.*
