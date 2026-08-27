# NebulaSEO Crawler Identity — Architecture Plan

**Date:** 2026-08-27
**Status:** Planning — not yet implemented
**Scope:** What needs to be true before NebulaSEO crawler UA becomes a recognized, trusted,
and well-behaved internet citizen across search engines, security tools, and CDNs.

---

## 1. Why this matters

Today our SEO cron scripts fetch `nebulacomponents.com` using a fake Chrome UA to bypass
Cloudflare bot scoring. That is a workaround, not a solution. It will break when Cloudflare
tightens scoring, and it teaches the system to lie about what it is.

As Nebula grows beyond homelab, three things converge:

- **External crawling** — auditing customer domains and competitor pages at scale
- **Reputation** — being recognized as a legitimate diagnostic tool, not a scraper
- **Trust signals** — appearing in crawl logs as NebulaSEOBot rather than a generic UA

A properly registered crawler also becomes a distributable product surface: the MCP server
can advertise NebulaSEO as the verification agent for audit findings.

---

## 2. What "registered and accepted" actually means per entity

### 2a. Search engines (Google, Bing, others)

There is no formal bot registration with Google. Google identifies bots by:
1. User-Agent string matching (pattern list, not a registry)
2. Reverse DNS verification: request IP must resolve to a known crawler domain

Bing has a similar model. Custom crawlers are accepted when they:
- Declare a consistent, honest UA string
- Respect `robots.txt`
- Pass reverse DNS (`bot.nebulacomponents.com` → IP → `bot.nebulacomponents.com`)
- Observe crawl-delay directives

**Action:** Register a DNS A record for the crawler's egress IP:
```
bot.nebulacomponents.com  A  <egress IP>
```
And configure reverse DNS (`PTR` record) via the hosting provider so:
```
<egress IP>  PTR  bot.nebulacomponents.com
```
This is the primary legitimacy signal. Without it, no engine trusts the UA claim.

### 2b. Cloudflare (the current blocker)

Cloudflare bot scoring is IP + UA + behavioral. For our own site, the fix is a WAF bypass
rule. For external domains we audit, Cloudflare will still block us unless we are either:
- Listed in Cloudflare's verified bot list (formal application required)
- Operating from an IP range that Cloudflare recognizes as low-risk

**Cloudflare verified bot program:**
- Application at `cloudflare.com/application/verified-bots/`
- Requirements: consistent UA, reverse DNS, published crawl policy page, robots.txt compliance
- Approval takes weeks; Cloudflare reviews manually
- Once approved, bypass applies across all CF-protected sites globally — high leverage

**For our own site (short-term):**
WAF rule: `User-Agent contains "NebulaSEOBot"` → Skip managed challenges
This is already actionable today.

### 2c. Security scanners (Akamai, Imperva, AWS WAF, Fastly)

Same requirements as Cloudflare:
- Reverse DNS
- Published crawl policy
- Robots.txt compliance
- Rate limiting behavior (max req/s, respect Retry-After)

Most enterprise WAFs have a verified crawler allowlist. Each requires a separate application.
Priority order when customer domains are being audited: Cloudflare (largest coverage) → Akamai
→ Fastly → AWS WAF.

### 2d. robots.txt community

Declare the bot in our own robots.txt (immediate, already actionable) and publish a crawl
policy page at `nebulacomponents.com/bot` or `nebulacomponents.com/crawler-policy`.

Standard declaration:
```
User-agent: NebulaSEOBot
Allow: /
Crawl-delay: 2
```

This is required by robots.txt convention and expected by aggregators. It also signals that we
follow the rules we ask others to respect.

---

## 3. Architecture requirements before external crawling at scale

Before we register with Cloudflare or crawl customer domains, the crawler needs to meet
minimum standards:

### 3a. Dedicated egress IP

The crawler must not share an IP with the Nebula application server. When a customer audits
their own site, the audit requests should not appear to come from `nebulacomponents.com` the
marketing site. They should come from `bot.nebulacomponents.com`.

Options:
- Separate VPS for crawler workload (cheapest: $4-6/mo Hetzner or Vultr)
- Dedicated Elastic IP on the existing server with a second NIC
- Residential proxy network (expensive, harder to verify)

The separate VPS is the right call at our scale. It also naturally isolates crawler resource
usage from the production application.

### 3b. Rate limiting and crawl budget

The crawler must implement:
- Configurable max requests/second per domain (default: 1 req/2s)
- `Crawl-delay` header and `robots.txt` crawl-delay parsing and respect
- `Retry-After` header respect on 429 responses
- Domain-level concurrency cap (1 connection per domain at a time)

Without this, a customer audit of a small site could trigger their WAF and create a support
incident. This is a credibility and legal risk.

### 3c. Crawl policy page

Published at `nebulacomponents.com/crawler-policy` (or `/bot`). Required by Cloudflare's
verified bot application. Should include:
- What we crawl (only URLs explicitly submitted or discovered via sitemap)
- Why (CRO diagnostics, not indexing or aggregation)
- How to opt out (`Disallow: /` for `NebulaSEOBot` in robots.txt)
- Contact for removal requests
- Rate limits we observe
- IP range or rDNS lookup path

### 3d. Robots.txt parser in the audit engine

The audit engine currently fetches pages directly without checking robots.txt first. Before
external crawling scales, add:
1. Fetch and parse `/robots.txt` before crawling any domain
2. Respect `Disallow` rules for `NebulaSEOBot`
3. Cache robots.txt per domain (TTL: 1 hour)
4. Abort audit with a specific error code when the crawl is disallowed

---

## 4. UA string design

Current: `NebulaSEO/1.0` (informal, not structured)

Recommended format follows the de facto standard used by Googlebot, Bingbot, and other
recognized crawlers:

```
NebulaSEOBot/1.0 (+https://nebulacomponents.com/crawler-policy)
```

Components:
- `NebulaSEOBot` — distinctive name, searchable, consistent
- `/1.0` — version, allows future differentiation
- `(+https://...)` — required by most WAF verified-bot applications; links to crawl policy

The `+https://` URL must resolve and explain the bot's purpose. This is how site admins
identify us when they see the UA in their logs.

---

## 5. Deployment phases

### Phase 0 — Internal hygiene (actionable now, no infra cost)

- [ ] Standardize all SEO scripts to use `http://localhost:3000` for internal Nebula fetches
  (bypasses Cloudflare entirely, no UA games needed)
- [ ] Add `NebulaSEOBot` to `robots.txt` with `Allow: /` and `Crawl-delay: 2`
- [ ] Add WAF bypass rule in Cloudflare for `NebulaSEOBot` UA on `nebulacomponents.com`
- [ ] Publish stub crawl policy page at `/crawler-policy`
- [ ] Update all `NebulaSEO/1.0` strings to `NebulaSEOBot/1.0 (+https://nebulacomponents.com/crawler-policy)`

**Trigger:** Now. Zero cost, zero infra.

### Phase 1 — rDNS and external legitimacy (when we start auditing customer domains at volume)

- [ ] Provision a dedicated crawler VPS (Hetzner CX11 or equivalent)
- [ ] Assign a static IP and configure rDNS PTR record to `bot.nebulacomponents.com`
- [ ] Add DNS A record: `bot.nebulacomponents.com → <crawler IP>`
- [ ] Deploy crawler service on that VPS (the audit engine's fetch layer only, not the full API)
- [ ] Apply to Cloudflare verified bot program
- [ ] Add robots.txt parser to audit engine with `NebulaSEOBot` compliance
- [ ] Implement per-domain rate limiting in the crawler

**Trigger:** When customer domain auditing is a product surface (not just self-audits).

### Phase 2 — WAF ecosystem registration (when enterprise customers require it)

- [ ] Apply to Akamai verified crawler program
- [ ] Apply to Fastly bot management allowlist
- [ ] Apply to AWS WAF Bot Control managed rule allowlist
- [ ] Publish IP range to `nebulacomponents.com/.well-known/crawler-ips.json`

**Trigger:** When an enterprise prospect or customer raises "your bot is getting blocked by our
WAF" as a blocker during sales or onboarding.

### Phase 3 — Crawler as product (when NebulaSEOBot becomes a distribution surface)

The verified crawler identity enables:
- AI search engines (ChatGPT, Perplexity, Gemini) citing NebulaSEO audit findings
- Browser extensions that surface NebulaSEO scores for any page
- Sitemap intelligence product (customers can see what bots are crawling their competitors)
- Third-party integrations: "Connect NebulaSEOBot to your domain"

**Trigger:** When the audit engine becomes a public API with external consumers.

---

## 6. Internal vs external fetch routing

Once Phase 1 is live, routing should be explicit:

| Fetch target | Route through | Reason |
|---|---|---|
| `nebulacomponents.com` (our own site) | `localhost:3000` | No Cloudflare, no latency |
| Customer domains (audits) | Crawler VPS | Dedicated IP, rate limiting, rDNS |
| Competitor intelligence | Crawler VPS | Same — legitimate crawl identity |
| Third-party APIs (DataForSEO, GSC) | Application server | Authenticated, no crawl policy needed |

This routing map should be enforced in code as a named constant, not scattered inline UA
decisions per script.

---

## 7. What this unlocks beyond SEO scripts

A verified crawler identity is also a distribution asset:

1. **AI citations** — ChatGPT and Perplexity currently cite pages, not diagnostic tools.
   A verified crawler that publishes audit findings in structured data can become a citable
   source in AI answers about landing page conversion.

2. **Competitive moat** — Cloudflare's verified bot list has ~100 entries. Getting on it puts
   NebulaSEO in a very small category of recognized diagnostic crawlers. That is a trust signal
   that generic SaaS competitors cannot replicate without the same operational investment.

3. **Customer reporting** — When a customer's WAF logs show `NebulaSEOBot/1.0` in recognized
   bots rather than an anonymous IP, it reduces friction in enterprise deployments where IT
   security reviews all inbound crawlers.

---

## 8. Dependencies and risks

| Risk | Mitigation |
|---|---|
| Cloudflare application rejected | Phase 0 WAF bypass covers our own site; external audits degrade gracefully with retry logic |
| rDNS misconfigured (PTR not resolving) | Verify with `dig -x <IP>` before applying to any program |
| Crawler VPS IP listed on a blocklist | Check against MXToolbox and Spamhaus before deploying; use a fresh Hetzner IP in EU |
| Customer robots.txt blocks NebulaSEOBot | Audit returns `robots_disallowed` error; surface in workspace as a known limitation |
| Rate-limit violations causing customer complaints | Rate limiter in Phase 1 is non-negotiable before customer domain crawling goes live |

---

## 9. Decision record

**Why a separate crawler VPS over a proxy network?**
Proxy networks (residential proxies, Smartproxy, Oxylabs) provide anonymity, which is the
opposite of what we want. We want to be identifiable, verifiable, and trusted. A dedicated
VPS with rDNS is the only architecture that supports Cloudflare's verified bot program.

**Why `NebulaSEOBot` over `NebulaSEO`?**
The `Bot` suffix is conventional and signals crawler intent to both humans and parsers.
`NebulaSEO` without `Bot` is ambiguous — looks like a browser extension or tool name.
Cloudflare's program requires a name that unambiguously identifies the agent as a crawler.

**Why publish a crawl policy page?**
Cloudflare's verified bot application requires it. Akamai's requires it. It is also the
right thing to do — site owners deserve to know who is crawling their site and how to opt out.
