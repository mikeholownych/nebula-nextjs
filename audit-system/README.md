# Nebula Landing Page Audit System

Every audit produces structured data. That data feeds a content factory, a qualification pipeline, and a $97 fix offer. This is the system behind all three.

---

## What's in Here

```
nebula-audit-system/
│
├── settings.json              ← Voice DNA, ICP thresholds, scoring weights, offer config
│
├── your-audit/
│   ├── findings.json          ← Schema: how every finding is structured (impact, evidence, fix)
│   ├── evidence.md            ← Protocol: measured vs required vs delta
│   └── fix-brief.md           ← Template: developer-ready work orders
│
├── content-factory/
│   ├── angles.md              ← How one audit becomes 20-40 content pieces
│   ├── linkedin.md            ← Post format: physician tone, ICP-specific
│   ├── tiktok.md              ← 30-second script format: hook → problem → reveal → CTA
│   ├── x.md                   ← Sub-240 char format: specificity converts
│   └── reddit.md              ← Organic advice format: never mention brand
│
├── icp-signals/
│   ├── triggers.md            ← Pain keywords, founder signals, scoring logic
│   ├── leads.csv              ← Lead schema: source, score, segment, status
│   └── reddit-monitor.md      ← 15-min scan: alert within 1hr while thread is hot
│
├── offer/
│   ├── sprint.md              ← One-Leak Repair Sprint: one finding, one fix, verified
│   ├── delivery.md            ← Step-by-step: payment → fix brief → email → re-audit
│   └── proof.md               ← Before/after documentation → case study protocol
│
└── pipeline/
    ├── ingest.sh              ← Submit any lead to the scoring engine
    ├── qualify.sh             ← Run qualification gates for a specific email
    └── outreach.sh            ← Generate trigger-based outreach message
```

---

## The Core Loop

```
1. SIGNAL      Reddit/X/HN founder posts about burning ad spend with zero conversions
                ↓
2. INGEST      Pain keywords scored → hot/warm/cold → Telegram alert if hot
                ↓
3. AUDIT       Free landing page audit → structured findings with evidence
                ↓
4. CONTENT     40 platform-specific scripts auto-generated from findings
                ↓
5. QUALIFY     Impact ≥ 4.0 + quick_win quadrant = Sprint candidate
                ↓
6. OFFER       $97 One-Leak Repair Sprint → exact fix brief + 30-day re-audit
                ↓
7. PROOF       Before/after delta documented → case study → more audits
```

---

## Key Principles

**ICP is a moment, not a demographic.**
Founders spending on ads with zero conversions - right now. Not "founders" in general.

**Evidence before creativity.**
Every finding has measured / required / delta. Content comes from real data.

**Specificity converts. Vagueness protects egos.**
CTAs, headlines, posts, and outreach all follow the same rule: say the specific thing.

**One leak at a time.**
The $97 Sprint fixes one finding. Not the whole site. The constraint is the product.

**Content is a byproduct of the audit, not a separate effort.**
One audit → 40 content pieces. Automatically. The audit IS the content strategy.

---

## Automation Layer (n8n)

| Workflow | ID | Trigger |
|----------|----|---------|
| Trigger Engine | `9HGVFfIPDHRYMtuE` | POST /webhook/audit-inbound |
| Reddit Monitor | `G6azfOHMHxlBva3N` | Every 15 minutes |
| Content Extractor | `A47FfOyx1b6D2gg2` | POST /webhook/content-extract |
| LinkedIn Factory | `h3rGZkI9OSsDGitL` | Manual trigger |

---

## Built With

- **Audit engine:** Python + FastAPI at 127.0.0.1:8001
- **Orchestration:** n8n at n8n.mikeholownych.com
- **AI:** AWS Bedrock (Claude Sonnet for angles, Haiku for scripts)
- **Storage:** PostgreSQL - `nebula_audit` db + `content_ops` db
- **Notifications:** Telegram (chat ID in settings.json)
- **Delivery:** AgentMail (nebulashop@agentmail.to)
