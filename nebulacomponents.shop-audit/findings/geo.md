# GEO / AI Search Readiness — nebulacomponents.shop

Audited live, read-only, 2026-07-26. This site has unusually extensive AI-discovery
infrastructure for its size (robots.txt AI-crawler segmentation, `/llms.txt` +
`/llms-full.txt`, a full `.well-known/` agent-discovery stack, x402 machine payments).
This review evaluates the **quality and coherence** of that infrastructure, not just
its presence.

## GEO Readiness Score: 69 / 100

| Dimension | Weight | Score | Weighted |
|---|---|---|---|
| Citability | 25% | 82 | 20.5 |
| Structural Readability | 20% | 80 | 16.0 |
| Multi-Modal Content | 15% | 35 | 5.25 |
| Authority & Brand Signals | 20% | 62 | 12.4 |
| Technical Accessibility | 20% | 72 | 14.4 |
| **Total** | | | **68.55 ≈ 69** |

## What Works

- **robots.txt correctly separates AI-training crawlers from AI-answer-engine/retrieval
  crawlers**, rather than blanket-blocking or blanket-allowing all AI bots. `GPTBot`,
  `ClaudeBot`, `Google-Extended`, `CCBot`, `omgili` are disallowed (training); `ChatGPT-User`,
  `OAI-SearchBot`, `anthropic-ai`, `PerplexityBot`, `Perplexity-User`, `GoogleOther`,
  `cohere-ai`, `meta-externalagent` are explicitly allowed (retrieval/citation), plus a
  standard `User-agent: * / Allow: /`. This is the correct split for maximizing AI-search
  visibility while opting out of training — most sites get this wrong in one direction or
  the other.
- Blocking `Google-Extended` does **not** cost this site AI Overviews visibility — Google
  has stated AIO grounding draws on the standard Search index (Googlebot), not the
  Gemini-training-specific `Google-Extended` signal, so this is a "free" opt-out with no
  AIO downside.
- `/llms.txt` and `/llms-full.txt` both exist at root, follow the llmstxt.org spec
  structure correctly, and carry an explicit machine-readable retrieval-vs-training
  distinction (`ai-input=yes`, `ai-train=no`, "Use type: reference"). The content itself
  is well-organized (offer, pricing, target customer, exclusions, founder, open-source
  project, technical architecture) and dated (`Last Updated: 2026-07-19`).
- The `.well-known/` agent-discovery stack (`openapi.json`, `agent.json`,
  `mcp/server-card.json`, `acp.json`, `ucp`, `http-message-signatures-directory`,
  `api-catalog`, `agent-skills/index.json`, `auth.md`) all resolve with HTTP 200 and are
  internally consistent in naming, versioning, and cross-references. The x402 payment
  layer is genuinely functional: `GET /api/v1` and `POST /api/audit/run` both correctly
  return `402 Payment Required` with a well-formed x402 payload (USDC on Base,
  `eip155:8453`), matching the claim in `llms-full.txt`.
- Sampled `/learning-centre` articles (`landing-page-not-converting`, `cta-not-working`,
  `message-match-checklist`, `proof-before-cta`) all lead with a **question-based H1**,
  followed immediately by a 2–3 sentence, self-contained, extractable answer *before* any
  narrative build-up, then a question-based H2 ("Why CTAs Fail: The Commitment Mismatch,"
  "What Message Match Actually Means"). This is exactly the pattern LLMs cite from — direct
  answer in the first ~40–60 words, no burying the conclusion in prose.
- Entity naming is consistent: `"Nebula Components"` is used uniformly in Organization/Person
  JSON-LD, `llms.txt`, `llms-full.txt`, and visible page copy. The `@NebulaCRO` variant is
  correctly confined to the X/Twitter handle only and does not leak into schema or body copy.
- All sampled pages are server-rendered (Next.js App Router; `is_spa: false`, full content
  present in raw HTML) — no JS-execution dependency for AI crawlers to read content, which
  is the single most important technical-accessibility factor and this site gets it right.

## Findings

### 1. Advertised A2A and MCP service endpoints return 404 on every method — discovery/execution incoherence
**Severity: High**
`agent.json` advertises `serviceUrl: https://nebulacomponents.shop/a2a` (A2A protocol) and
`.well-known/mcp/server-card.json` advertises `endpoint: https://nebulacomponents.shop/mcp`.
Both discovery documents return HTTP 200 with well-formed JSON. But the endpoints they
point to return `404` on GET, POST, and OPTIONS — not `405 Method Not Allowed` (which
would suggest "wrong verb"), an actual 404, meaning the routes are not implemented. An AI
agent that follows the discovery chain correctly (read `agent.json` → call `/a2a`; read
`server-card.json` → call `/mcp`) hits a dead end. This is the one place where the
agent-discovery layer is broken rather than just early-stage. By contrast, the x402
endpoints (`/api/v1`, `/api/audit/run`) are genuinely functional, so this isn't a
uniform gap — it's specifically the two newest/most speculative protocols (A2A, MCP)
that are stubbed as metadata only.
**Recommendation:** Either implement minimal handlers at `/a2a` and `/mcp` (even a
protocol-compliant capability-negotiation response with no real tools wired up), or
remove the `Link` header entries and the two `.well-known` files until there's a real
endpoint behind them. Advertising a capability that 404s is worse for agent trust than
not advertising it. Given this site's traffic/authority level, this whole layer (A2A +
MCP specifically) is speculative infrastructure ahead of any evidence it changes buyer
behavior — reasonable to deprioritize fixing it over the items below unless there's a
specific agentic-commerce integration already lined up.

### 2. Founder's "50+ landing pages" claim exists only in the AI-facing files, not on any human-visible page
**Severity: Medium**
`llms.txt` and `llms-full.txt` both state "Built 50+ landing pages, identified 7
recurring conversion killers." This exact claim does not appear anywhere in the visible
text of `/about` or `/about/team` (checked both — no "50" outside cookie-consent/GA4
boilerplate, no "50+" string anywhere on either page), nor in the Person/Organization
JSON-LD on those pages (which only carries name/jobTitle/URL/sameAs, no experience
claims). An AI system citing "Mike Holownych has built 50+ landing pages" would be
citing a claim a skeptical human fact-checker could not corroborate anywhere on the
site itself — a citability-without-substantiation gap.
**Recommendation:** Add the same claim (or a version of it) to the visible founder bio
on `/about/team`, so the AI-facing and human-facing surfaces say the same thing and the
claim is actually load-bearing rather than only existing for AI consumption.

### 3. `/about` and `/about/team` — the pages carrying the primary entity/founder signal — are absent from sitemap.xml
**Severity: Medium**
`sitemap.xml` lists 33 URLs (homepage, pricing, learning-centre articles, resources,
case-studies, audit, legal pages) but does not include `/about` or `/about/team`, even
though both are live, 200-status, indexable pages carrying the site's Organization and
Person JSON-LD (the strongest entity/authority signals on the whole site). `llms.txt`
points to these pages only via a 308-redirecting alias (`/company/about` →
`/about`, `/company/team` → `/about/team`), which resolves fine but means neither the
canonical URL nor the redirect target is declared in the sitemap.
**Recommendation:** Add `/about` and `/about/team` to `sitemap.ts`, and update
`llms.txt`/`llms-full.txt` to reference the canonical `/about` and `/about/team` URLs
directly rather than the `/company/*` redirect aliases (cosmetic, but removes an
unnecessary hop for crawlers that don't follow redirects).

### 4. robots.txt AI-crawler list is well-structured but not fully current for mid-2026
**Severity: Low**
The list correctly separates training (`GPTBot`, `ClaudeBot`, `Google-Extended`, `CCBot`,
`omgili`) from retrieval (`ChatGPT-User`, `OAI-SearchBot`, `anthropic-ai`, `PerplexityBot`,
`Perplexity-User`, `GoogleOther`, `cohere-ai`, `meta-externalagent`). Two gaps for
currency: (a) Anthropic has separated `ClaudeBot` (training-crawl) from `Claude-User`
(user-invoked fetch) and `Claude-SearchBot` (search-index crawl for Claude's web-search
feature) — neither of the retrieval-specific tokens is explicitly allowed, only implied
via the `*` wildcard; (b) `Applebot-Extended` (Apple Intelligence's opt-out token,
distinct from the retrieval-only `Applebot`) is absent from the training-block list,
despite the site otherwise being thorough about naming every other major AI-training
crawler by name. Neither gap currently blocks anything in practice — the wildcard
`Allow: /` at the bottom covers any unmatched crawler by default — but it means the
training-opt-out list isn't quite complete relative to the intent already established
by including `Google-Extended` and `omgili`.
**Recommendation:** Add `Applebot-Extended: Disallow: /` to the training-block section
for completeness, and consider explicit `Allow: /` lines for `Claude-User` and
`Claude-SearchBot` alongside `anthropic-ai` to make the retrieval-vs-training intent
unambiguous rather than relying on wildcard fallthrough.

### 5. EU DSM Article 4 opt-out is asserted in a comment, not carried by a machine-readable mechanism — and RSL 1.0 is absent
**Severity: Low**
robots.txt contains a comment block asserting an "express reservation of rights under
Article 4 of Directive 2019/790." This is legally reasonable framing, but worth a
precision note: comments (`#` lines) are not parsed by any robots.txt consumer — the
actual machine-readable signal is the `Disallow:` directives beneath it, not the
comment text itself. Using robots.txt disallow rules as an Article 4 TDM opt-out is a
commonly-accepted-in-practice approach (both OpenAI's and Google's own crawler
documentation treat it this way), but it is not a codified legal standard, and Article
4(3)'s "machine-readable means" language doesn't specifically name robots.txt as
sufficient — it's a reasonable, low-risk choice, not a legally bulletproof one.
Separately, no RSL 1.0 (Really Simple Licensing) file was found at either `/rsl.xml` or
`/.well-known/rsl.xml`, and neither `llms.txt` nor the `Link` header references one. RSL
is the newer, more granular complement to the informal `ai-input=yes`/`ai-train=no` tags
already in `llms.txt` — it would let the same reservation be expressed in a genuinely
parseable, machine-readable license file rather than only prose.
**Recommendation:** No urgency here — treat as a nice-to-have. If revisited, add a
minimal RSL 1.0 file mirroring the existing `ai-train=no` / `ai-input=yes` position, and
soften the comment's legal framing slightly (e.g., "we treat the disallow directives
below as our Article 4 reservation of rights" rather than implying the comment itself is
the operative mechanism).

### 6. Multi-modal content is effectively absent — no images, video, or YouTube presence found
**Severity: Medium**
The sampled learning-centre article (`landing-page-not-converting`) contains zero
`<img>` tags and no video/YouTube embeds; the same is true of `/about`. No YouTube
channel, Reddit presence, or embedded media was found anywhere in the crawled pages.
Per the brand-mention correlation data, YouTube mentions are the single strongest
correlate with AI-engine citation (~0.737) — well ahead of Domain Rating/backlinks
(~0.266) — and this site has none of that signal. This is consistent with a young,
single-founder business (a Wikipedia/Wikidata entry would be disproportionate effort at
this stage and is correctly not something to chase), but a YouTube presence is
realistic and would plug the largest gap in the Multi-Modal and Authority dimensions
simultaneously.
**Recommendation:** Lowest-effort version: a single founder-narrated screen-recording
walkthrough of the free audit tool or the 7-Point Diagnosis, posted to YouTube and
embedded on `/about` or the homepage. Even one video with a transcript captures most of
the available signal — this doesn't need to become a content channel.

## Top 5 Highest-Impact Changes

| # | Change | Impact | Effort |
|---|---|---|---|
| 1 | Add `/about` and `/about/team` to `sitemap.ts` | High (unblocks discovery of the site's only entity/authority pages) | Trivial (~5 min) |
| 2 | Fix or remove the dead `/a2a` and `/mcp` endpoints referenced by `agent.json` / `mcp/server-card.json` | High (closes a real discovery→execution failure for agentic clients) | Low–Medium |
| 3 | Add the "50+ landing pages" founder claim to the visible `/about/team` bio, matching `llms-full.txt` | Medium (removes a citability-without-substantiation risk) | Low |
| 4 | Publish one founder-narrated video (audit walkthrough) on YouTube, embed on `/about` | Medium–High (YouTube is the strongest brand-mention correlate with AI citation, currently at zero) | Medium |
| 5 | Add `Applebot-Extended` to the robots.txt training-block list; reference canonical `/about` URLs (not `/company/*` redirects) in `llms.txt` | Low | Trivial |

## Platform-Specific Visibility (qualitative — no DataForSEO/live-citation tooling was available this session)

| Platform | Est. Score | Basis |
|---|---|---|
| Google AI Overviews | ~70 | Fully crawlable (SSR), schema-rich, `Google-Extended` block doesn't affect AIO grounding; capped by missing sitemap entries for entity pages |
| ChatGPT (search/browsing) | ~65 | Correct `OAI-SearchBot`/`ChatGPT-User` allow + `GPTBot` training block is the right split; capped by weak multi-modal/authority signals |
| Perplexity | ~72 | Both `PerplexityBot` and `Perplexity-User` explicitly allowed; strong fit for Perplexity's preference for direct-answer, well-structured pages |
| Bing Copilot | ~60 | Covered only by wildcard allow (no Bing-specific AI token to configure); Bing weighting leans more on backlink authority, which is this site's weakest area |

Only ~11% of domains are cited by both ChatGPT and Google AI Overviews — the citability
and structural work already done on the learning-centre articles is the right lever to
keep investing in; the agent-protocol layer (A2A/MCP) is not what will move that number.

## Note on FAQ Schema

No FAQ-schema recommendation is made anywhere in this report. FAQ rich results were
retired for all sites (May 7, 2026); any FAQ-shaped opportunity identified during this
review (e.g., the "Quick diagnosis: which leak is it?" section pattern) is framed purely
as content/citability structure, not as a schema recommendation.
