import { publicFacts } from './public-facts'
import { TEARDOWNS } from '@/app/teardowns/[slug]/data'
import { getArticles } from '@/app/learning-centre/lib/getArticles'

/**
 * Markdown variants for key public pages, served at the same URL + ".md"
 * per the llms.txt proposal (https://llmstxt.org/): "pages that have
 * information that might be useful for LLMs to read provide a clean
 * markdown version of those pages at the same URL as the original page,
 * but with .md appended."
 *
 * Everything here is derived from canonical data sources (public-facts.ts,
 * teardown data) so the mirrors cannot drift from the HTML pages.
 */

const site = 'https://nebulacomponents.com'

function markdownPage(title: string, canonicalPath: string, body: string): string {
  return [
    `# ${title}`,
    '',
    `> Markdown version of ${site}${canonicalPath}`,
    '',
    body.trim(),
    '',
  ].join('\n')
}

export function buildTeardownsIndexMarkdown(): string {
  const entries = Object.values(TEARDOWNS)
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(
      (t) =>
        `- [${t.name}](${site}/teardowns/${t.slug}.md): ${t.domain} - ${t.summary.replace(/Score: \d+(?:\.\d+)?\/10, Grade [A-F]\.\s*/g, '')}`
    )
    .join('\n')

  return markdownPage(
    'Nebula Teardowns',
    '/teardowns',
    `Nebula publishes public landing page teardowns as evidence-based growth content: real pages, cold paid-traffic conditions, documented checks, and annotated findings. Every finding cites the observable condition - not an opinion.

HTML index: ${site}/teardowns

## All Teardowns

${entries}

## Method

Each teardown applies documented checks to page-level conditions for cold paid traffic - not verdicts on the business. Above Fold and Ad Signals are excluded from public aggregate benchmarks pending rendered verification.

Each teardown page is also available in markdown by appending .md to its URL (e.g. ${site}/teardowns/knallhart.md).`
  )
}

export function buildTeardownMarkdown(slug: string): string | null {
  const t = TEARDOWNS[slug]
  if (!t) return null

  const findings = t.findings
    .map((f) => `- **${f.label}** (priority ${f.priority}/10 · ${f.quadrant})\n  - Issue: ${f.issue}\n  - Evidence: ${f.evidence}\n  - Fix: ${f.fix}`)
    .join('\n')

  return markdownPage(
    `${t.name} Landing Page Audit`,
    `/teardowns/${t.slug}`,
    `Nebula ran its documented landing-page audit on ${t.url}.

- Audited: ${t.auditedAt}

${t.summary.replace(/Score: \d+(?:\.\d+)?\/10, Grade [A-F]\.\s*/g, '')}

${t.context}

## Findings

${findings}

---
HTML version: ${site}/teardowns/${t.slug}
Run your own free audit: ${site}/audit`
  )
}

const fixPack = publicFacts.fixPack

const pricingMarkdown = markdownPage(
  'Nebula Pricing',
  '/pricing',
  `Nebula sells one thing: fixing landing page conversion leaks for founders who are spending on ads and not converting.

## One-Leak Repair Sprint - $${(fixPack.priceCents / 100).toFixed(0)} (one-time)

- One landing page, one high-confidence page-level repair selected from your free audit.
- Delivery: ${fixPack.delivery.artifact} via ${fixPack.delivery.method} (${fixPack.delivery.timing}).
- Implementation: ${fixPack.implementation.owner === 'customer_or_developer' ? 'you or your developer' : 'Nebula'} implements; Nebula requires no site access (${fixPack.implementation.nebulaSiteAccess}).
- 30-day re-audit included (${fixPack.reAudit.windowDays} days).
- Price locked through ${fixPack.priceValidUntil}.
- Checkout: https://nebulacomponents.com/checkout (requires a completed, unlocked audit; Nebula creates a Stripe Checkout Session with audit metadata)

## Retainer - $1,497

For founders who want ongoing conversion work: recurring audits, prioritized fixes, and measurement.

## Agency Partner - $497

For agencies that want white-label conversion audits for their clients.

No sales calls. Self-serve checkout. Evidence-first: the audit names the leak before you pay for anything.`
)

const auditMarkdown = markdownPage(
  'Free Landing Page Audit - Nebula',
  '/audit',
  `The free Nebula audit is an under-two-minute automated diagnosis of any public landing page, returning documented conversion checks:

1. Message match
2. Trust signals
3. Mobile CTA visibility
4. Load time
5. CTA clarity
6. SEO foundations
7. AI readiness

Each recorded finding is tied to evidence from the actual page and ranked by priority. Public aggregate benchmarks exclude Above Fold and Ad Signals pending rendered verification.

- No account required to run it
- Initial findings appear before email; email unlocks the full report
- No sales calls

Run it: ${site}/audit`
)

const aboutMarkdown = markdownPage(
  'About Nebula',
  '/about',
  `Mike Holownych founded Nebula Components to provide evidence-backed landing page diagnosis and bounded remediation materials. The operating premise: most landing page failures are diagnosable, they follow repeating patterns, and they can be fixed. The problem is not the ad - it is the page.

The free audit returns documented conversion checks with observable evidence. The One-Leak Repair Sprint ($97) supplies a tailored change for one high-confidence finding; the customer or their developer implements it, with a 30-day re-audit included. Nebula publishes public teardowns as evidence-based content and maintains Citable, an open-source CLI for search and AI discoverability governance.

LinkedIn: https://linkedin.com/in/mikeholownych
GitHub: https://github.com/mikeholownych`
)

const learningCentreMarkdown = markdownPage(
  'Learning Centre - Nebula',
  '/learning-centre',
  `${getArticles().length} articles diagnosing specific landing page failure patterns for founders running paid traffic: landing pages not converting, Google Ads clicks without sales, Facebook ads getting no leads, B2B SaaS and eCommerce conversion problems, high CPC with low conversion rate, bounce rate analysis, mobile optimization, CTA failures, message-match checklists, proof-before-CTA frameworks, and the paid traffic leak map.

Every article is available as a clean markdown mirror at /learning-centre/<slug>.md:

${getArticles()
  .sort((a, b) => a.title.localeCompare(b.title))
  .map((a) => `- [${a.title}](https://nebulacomponents.com/learning-centre/${a.slug}.md) - ${a.category}`)
  .join('\n')}

HTML article index: ${site}/learning-centre`
)

const playbooksMarkdown = markdownPage(
  'Playbooks - Nebula',
  '/playbooks',
  `Founder productivity and AI-ops guides published by Nebula. Topics cover working with AI agents, automation workflows, and operating systems for solo founders.

Index: ${site}/playbooks`
)

const caseStudiesMarkdown = markdownPage(
  'Case Studies - Nebula',
  '/case-studies',
  `Nebula publishes a customer case study only when it meets four requirements: a real client (or a documented reason for anonymization), an actual before/after metric, a defined measurement window, and inspectable supporting evidence.

As of ${new Date().toISOString().slice(0, 10)}, zero case studies are approved for publication. Nebula does not publish illustrative outcomes as customer results.

Index: ${site}/case-studies`
)

const privacyMarkdown = markdownPage(
  'Privacy Policy - Nebula',
  '/privacy-policy',
  `Nebula collects only what it needs to run the audit service:

- Audit submissions are processed server-side; results pages require no account.
- Analytics: cohort/persona aggregates only; no individual visitor profiling. GA4 runs with Consent Mode v2, default denied.
- Email addresses submitted to unlock results are used to deliver the report and (optionally) post-audit follow-up; opt-out available.
- No data sold. No individual visitor profiles.

Full policy: ${site}/privacy-policy`
)

const citableRelease = publicFacts.citable.release
const citableMarkdown = markdownPage(
  'Citable - Open-Source AI Discoverability Governance',
  '/resources/citable',
  `Citable is an open-source CLI for search and AI discoverability governance: auditing whether a site is actually retrievable by search engines and AI systems, with evidence rather than opinions.

- Version: ${citableRelease.version}
- License: ${citableRelease.license}
- npm: ${citableRelease.package}
- GitHub: https://github.com/mikeholownych/citable
- Documentation: ${site}/resources/citable

Citable is the open evidence layer beneath Nebula, not a second SaaS competing with it. Citable defines what evidence can support an observation, whether a claim is reproducible, and what remains unknown. Nebula is the commercial application that turns verified evidence into landing-page diagnostics, recommendations, repairs, and follow-up decisions.

Citable runs ${citableRelease.detectorCount} detectors across ${citableRelease.namespaceCount} namespaces and ${citableRelease.registryCount} schema-validated registries, covering crawl, page, SEO, AEO, GEO, entity, claims, evidence, schema, agent, lifecycle, corroboration, and architecture signals. Each run produces an evidence package: raw observations, detector logic, and findings with severity, confidence, and remediation.

What Citable does not prove: that a page will be crawled, ranked, cited, or that any remediation will produce a measurable outcome. Those are probabilistic outcomes influenced by factors outside the page.`
)

export const LLMS_MARKDOWN: Record<string, string> = {
  audit: auditMarkdown,
  pricing: pricingMarkdown,
  about: aboutMarkdown,
  'learning-centre': learningCentreMarkdown,
  teardowns: buildTeardownsIndexMarkdown(),
  playbooks: playbooksMarkdown,
  'case-studies': caseStudiesMarkdown,
  'privacy-policy': privacyMarkdown,
  'resources/citable': citableMarkdown,
}
