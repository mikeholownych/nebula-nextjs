# ECONOMICS — Nebula Components Financial Operating Context

**Last updated:** 2026-07-13
**Status:** Active
**Owner:** ops-finance agent
**Update cadence:** Weekly (every Monday) or on any pricing change

---

## Revenue

### Offer Ladder

| Tier | Name | Price | Stripe Link | Status |
|---|---|---|---|---|
| 1 | Free Landing Page Audit | $0 | N/A (self-serve) | Live — nebulacomponents.shop/audit |
| 2 | Conversion Fix Pack | $147 | [buy.stripe.com/...](https://buy.stripe.com/6oUfZh7M87YM5TPgEa43S0b) | Live |
| 2b | Legacy Component Pack (not promoted) | $7 | Stripe product prod_UlPk8Awd2ekztb | Live — no longer marketed |
| 3 | Growth Launch (First Customer Guarantee) | $997 | [buy.stripe.com/4gMcN5aYk92Qaa5drY43S09](https://buy.stripe.com/4gMcN5aYk92Qaa5drY43S09) | Live |
| 4 | AI Ops Retainer (monthly) | $1,497/mo | [buy.stripe.com/...](https://buy.stripe.com/00w5kD1nK0wkaa573A43S0c) | Live |
| 5 | Agency Partner (monthly) | $497/mo | [buy.stripe.com/...](https://buy.stripe.com/aFa8wPc2o7YM9613Ro43S0d) | Live |

### Revenue to Date

| Metric | Value |
|---|---|
| Total MRR | **$0** |
| Total transactions | 0 |
| Paying customers | 0 |
| Free audits delivered | Pipeline building (scraping + outreach live) |
| Last transaction | Never |

### Revenue Targets

| Milestone | MRR | Path | Timeline |
|---|---|---|---|
| First paying customer | $147 | Trigger-aware outreach → free audit → $147 fix | July 14+ |
| 5 customers | ~$500 | Same funnel + retargeting | August 2026 |
| 25 customers | ~$2,500 | Multiple channels + retainer upsells | Q4 2026 |
| Target steady state | $50k/mo | Reliable acquisition + retainer base | TBD |

---

## Costs

### Fixed Monthly Costs

| Cost Item | Amount | Provider | Payment Method | Due |
|---|---|---|---|---|
| Apify | ~$50/mo | Apify | Card (Ops-Finance tracks) | Monthly |
| AgentMail | ~$30/mo | AgentMail | Card | Monthly |
| Stripe fees (2.9% + $0.30) | 0 (no revenue) | Stripe | Deducted per transaction | Per transaction |
| Cloudflare Tunnel | $0 (free tier) | Cloudflare | N/A | N/A |
| GitHub | $0 (public repo) | GitHub | N/A | N/A |
| Bedrock API (cron execution) | ~$20-50/mo | AWS Bedrock | Cloud account | Monthly |
| Domain (nebulacomponents.shop) | ~$15/yr | Namecheap/Cloudflare | Card | Annual |
| OpenAI Whisper/TTS | ~$5-10/mo | OpenAI | API creds | Monthly |
| Stripe Link | $0 | Stripe | N/A | N/A |
| FAL (image gen) | ~$0 (Nous sub) | FAL.ai | Nous subscription | N/A |
| **Total estimated monthly burn** | **~$105-155/mo** | | | |

### Variable Costs

| Cost Item | Unit Cost | Volume | Monthly Projection |
|---|---|---|---|
| Apify LinkedIn scraping runs | ~$5-15/run | ~8-12 runs/mo | $40-80/mo |
| Bedrock inference (cron evals) | ~$0.10-0.50/eval | ~200-400/month | $20-50/mo |
| AgentMail sends | ~$0.01/email | ~500-1000/mo | $5-10/mo |
| Stripe fees at $147 transaction | ~$4.56 | Per $147 sale | Scales with revenue |

### Budget Headroom

| Item | Limit | Notes |
|---|---|---|
| Maximum single spend without escalation | **$50** | Any spend > $50 requires Mike approval |
| Maximum daily variable spend | **$20** | Aggregate of all API/variable costs per day |
| Maximum monthly total spend | **$200** | Including fixed + variable |
| Emergency buffer | **$0** (no revenue) | No buffer until first paying customer |

**Spend > $50 requires escalation.** This includes: new paid tools, subscription upgrades, large Apify runs, paid ad tests, contractor payments.

---

## Margins

### Per-Unit Economics (Estimated)

| Offer | Price | Stripe Fee | Delivery Cost | Gross Margin | Notes |
|---|---|---|---|---|---|
| Free Audit | $0 | $0 | ~$0.10 (API + email) | N/A | Loss leader — cost is intentional |
| $147 Fix Pack | $147 | ~$4.56 | ~$2 (AI + email delivery) | ~96% | High margin, scales well |
| $997 Growth Launch | $997 | ~$29.21 | ~$50-100 (intensive AI + human review) | ~90-95% | Labor component needs monitoring |
| $1,497/mo Retainer | $1,497 | ~$43.71 | ~$100-200 (monthly monitoring) | ~87-90% | Best margin at scale |
| $497/mo Agency Partner | $497 | ~$14.71 | ~$50 (white-label delivery) | ~87-90% | Partner-delivered |

### Unit Economics Targets

| Metric | Target | Current | Notes |
|---|---|---|---|
| Gross margin | >80% | ~96% (projected) | SaaS-like margins by design |
| CAC (paid) | <$10 | N/A | Organic only until >$1k MRR |
| LTV (fix pack buyer) | >$1,644 | N/A | $147 fix + 1 month retainer ($1,497) |
| LTV/CAC | >10:1 | N/A | Target for paid acquisition when started |
| Months to recover CAC | <1 | N/A | $147 fix covers most costs immediately |

---

## Pipeline Metrics

| Metric | Value | Source |
|---|---|---|
| Total leads contacted | 111 | `night_watch_report.json` |
| LinkedIn engagers tracked | Active | `linkedin_post_monitor.py` |
| Reddit trigger signals | Active | `reddit_trigger_monitor.py` |
| Audit deliveries | Pipeline building | `deliver_audit.py` |
| Email bounce rate | Tracked | `bounce_detector.py` |
| SRE stuck leads | 14 (auto-cleared per run) | `sre_state.json` |

---

## Runway

| Scenario | Monthly Burn | Runway (assume $0 external) | Notes |
|---|---|---|---|
| Current operations | ~$150/mo | Indefinite (low burn) | No external funding needed |
| With paid tool upgrades | ~$300/mo | Depends on Mike's budget | Requires approval per VALUES.md |
| With paid ads | $500+/mo | Requires revenue first | Not authorized until >$1k MRR |

---

## Key Decisions Log

Significant financial decisions are logged in `governance/DECISIONS/`. Cross-reference:

- **DECISIONS/0001-autonomous-business-os-architecture.md** — Adopted Business OS architecture with governance layer. Impact: directory restructuring, no cost impact.

---

## Files Referenced

- `/home/mike/nebula/stripe_checkout_links.json` — Stripe product/price IDs
- `/home/mike/nebula/stripe_links.py` — current checkout-link resolver and fallback URLs
- `/home/mike/nebula/stripe_997_links.json` — $997 config
- `/home/mike/nebula/sre_state.json` — Operational state
- `/home/mike/nebula/pipeline_health.json` — Pipeline health checks
- `/home/mike/nebula/night_watch_report.json` — Nightly ops report
- `/home/mike/nebula/growth_system/OFFER_MEMO.md` — Offer architecture details
