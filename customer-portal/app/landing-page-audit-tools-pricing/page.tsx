import type { Metadata } from 'next'
import Link from 'next/link'
import { PRICING_GUIDES, PRICING_GUIDE_SLUGS } from '../pricing-guides/data'

const PRICING_GUIDE_LIST = PRICING_GUIDE_SLUGS.map((slug) => PRICING_GUIDES[slug])

export const metadata: Metadata = {
  title: 'Landing Page Audit Tool Pricing (2026 Guide) | Nebula',
  description:
    'The real, verified pricing of 8 landing page audit tools - Nebula, Unbounce, Hotjar, Crazy Egg, SEMrush, Screaming Frog, HubSpot Website Grader, PageSpeed Insights - compared head-to-head, with the honest alternative.',
  alternates: {
    canonical: 'https://nebulacomponents.com/landing-page-audit-tools-pricing',
  },
  openGraph: {
    title: 'Landing Page Audit Tool Pricing (2026 Guide) | Nebula',
    description:
      'Verified pricing for 8 landing page audit tools, compared head-to-head. Free options, subscription traps, and the honest alternative.',
    url: 'https://nebulacomponents.com/landing-page-audit-tools-pricing',
  },
}

const PRICING_ROWS = [
  { tool: 'Nebula', price: 'Free audit · $97 one-time fix kit', needsTraffic: 'No', signup: 'No', contract: 'No' },
  { tool: 'Google PageSpeed Insights', price: 'Free', needsTraffic: 'No', signup: 'No', contract: 'No' },
  { tool: 'HubSpot Website Grader', price: 'Free (email-gated)', needsTraffic: 'No', signup: 'Yes', contract: 'No' },
  { tool: 'Screaming Frog SEO Spider', price: 'Free ≤500 URLs · £199/year', needsTraffic: 'No', signup: 'No', contract: 'No' },
  { tool: 'Hotjar', price: 'Free 35 sess/day · $32/mo · $80/mo', needsTraffic: 'Yes', signup: 'Yes', contract: 'No' },
  { tool: 'Crazy Egg', price: '$49/mo · $99/mo · $249/mo', needsTraffic: 'Yes', signup: 'Yes', contract: 'No' },
  { tool: 'Unbounce', price: '$29/mo · $249/mo (Smart Traffic)', needsTraffic: 'No', signup: 'Yes (card trial)', contract: 'No' },
  { tool: 'SEMrush Site Audit', price: '$139.95/mo (platform)', needsTraffic: 'No', signup: 'Yes', contract: 'No' },
]

const HUB_FAQS = [
  {
    q: 'What is the cheapest landing page audit tool?',
    a: 'Nebula (free audit, no signup, $97 optional one-time fix kit), Google PageSpeed Insights (free), and HubSpot Website Grader (free but email-gated, homepage only) are the free options. Screaming Frog is free up to 500 URLs, then £199/year. Hotjar has a free tier limited to 35 sessions per day.',
  },
  {
    q: 'Which landing page audit tools require a subscription?',
    a: 'Hotjar (from $32/month), Crazy Egg (from $49/month), Unbounce (from $29/month, $249/month for Smart Traffic), and SEMrush (from $139.95/month) are subscription-based. Nebula is free for the audit with a one-time $97 fix kit - no subscription.',
  },
  {
    q: 'Is there a free alternative to Crazy Egg or Hotjar?',
    a: 'Yes - Nebula audits any public landing page for free, with no signup and no traffic required. The difference: Nebula checks conversion structure (message match, CTA, trust, above-fold) rather than showing behavior heatmaps, which need existing visitor sessions.',
  },
  {
    q: 'Is Unbounce pricing worth it for a single landing page?',
    a: 'Usually not. Unbounce starts at $29/month and only optimizes pages built inside its platform - the AI Smart Traffic feature that justifies the price requires the $249/month tier. For an existing page, a free conversion audit with a $97 one-time fix kit is the higher-leverage first step.',
  },
  {
    q: 'Why is SEMrush $139.95/month?',
    a: 'SEMrush is a full SEO platform - keyword research, rank tracking, competitor analysis, plus Site Audit as one module. If you only need to know why one landing page is not converting paid traffic, you are paying for a platform you will not use. A conversion audit checks the actual problem for free.',
  },
  {
    q: 'Do any of these tools check conversion structure, not just speed or SEO?',
    a: 'Only Nebula checks 9 observable conversion conditions on the public page: headline message match against the ad, CTA clarity, trust/social proof, above-fold structure, mobile CTA, load speed, ad signals, SEO foundations, and AI citation readiness. Those checks do not predict conversion from paid traffic. PageSpeed checks speed; Hotjar and Crazy Egg show behavior; SEMrush and Screaming Frog check technical SEO.',
  },
]

const HUB_FAQ_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: HUB_FAQS.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
}

export default function ToolPricingPage() {
  return (
    <main id="main-content" className="min-h-screen bg-bg pt-24 pb-24">
      <article className="mx-auto max-w-4xl px-6 py-12">

        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-8">
          <ol className="flex items-center gap-2 text-sm text-fg-muted">
            <li><Link href="/" className="hover:text-fg">Home</Link></li>
            <li aria-hidden="true">/</li>
            <li><Link href="/vs" className="hover:text-fg">Comparisons</Link></li>
            <li aria-hidden="true">/</li>
            <li className="text-fg" aria-current="page">Tool Pricing</li>
          </ol>
        </nav>

        {/* Header */}
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-accent">
          Tool Pricing · Updated August 2026
        </p>
        <h1 className="heading-1 tracking-tight text-fg md:text-5xl">
          Landing Page Audit Tool Pricing (2026): What 8 Tools Really Cost
        </h1>

        {/* BLUF */}
        <section aria-label="Bottom line" className="mt-8 rounded-2xl border border-accent/20 bg-accent/5 p-6">
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Bottom line up front</h2>
          <p className="mt-3 text-lg leading-8 text-fg">
            Most “audit” tools charge a subscription for an adjacent job: Unbounce from $29/month (builder),
            Hotjar from $32/month (behavior), Crazy Egg from $49/month (heatmaps), SEMrush $139.95/month (SEO
            platform). Only Nebula audits the conversion layer itself - free, no signup, no traffic required -
            with a $97 one-time fix kit instead of a monthly bill. Free utilities that do not check conversion:
            PageSpeed Insights, HubSpot Website Grader (email-gated), Screaming Frog (500-URL free tier).
          </p>
        </section>

        {/* Price comparison table */}
        <section className="mt-12 overflow-x-auto">
          <h2 className="mb-6 text-2xl font-bold text-fg">Price comparison table</h2>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="py-3 pr-6 text-left text-xs font-semibold uppercase tracking-widest text-fg-muted">Tool</th>
                <th className="py-3 pr-6 text-left text-xs font-semibold uppercase tracking-widest text-fg-muted">Price</th>
                <th className="py-3 pr-6 text-left text-xs font-semibold uppercase tracking-widest text-fg-muted">Needs traffic</th>
                <th className="py-3 pr-6 text-left text-xs font-semibold uppercase tracking-widest text-fg-muted">Signup</th>
                <th className="py-3 text-left text-xs font-semibold uppercase tracking-widest text-fg-muted">Contract</th>
              </tr>
            </thead>
            <tbody>
              {PRICING_ROWS.map((row) => (
                <tr key={row.tool} className="border-b border-border/50">
                  <td className="py-4 pr-6 font-medium text-fg">{row.tool}</td>
                  <td className="py-4 pr-6 text-fg-muted">{row.price}</td>
                  <td className="py-4 pr-6 text-fg-muted">{row.needsTraffic}</td>
                  <td className="py-4 pr-6 text-fg-muted">{row.signup}</td>
                  <td className="py-4 text-fg-muted">{row.contract}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-4 text-xs text-fg-muted">
            Pricing verified from vendor public pages as of August 2026. Prices change - verify before deciding.
          </p>
        </section>

        {/* Detailed pricing guides */}
        <section className="mt-14">
          <h2 className="mb-6 text-2xl font-bold text-fg">Detailed pricing breakdowns</h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {PRICING_GUIDE_LIST.map((guide) => (
              <Link
                key={guide.slug}
                href={`/pricing-guides/${guide.slug}`}
                className="group rounded-md border border-border bg-bg-panel p-6 transition-colors hover:border-accent"
              >
                <p className="text-xs font-semibold uppercase tracking-widest text-fg-muted">{guide.category}</p>
                <h3 className="mt-2 text-xl font-bold text-fg group-hover:text-accent transition-colors">
                  {guide.toolName} Pricing
                </h3>
                <p className="mt-3 text-sm text-fg-muted leading-relaxed">{guide.bluf}</p>
                <p className="mt-4 text-xs text-accent">Read the pricing breakdown →</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Why pricing matters for paid-traffic founders */}
        <section className="mt-14 rounded-md border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">Why pricing matters when you are bleeding ad spend</h2>
          <p className="text-fg-muted leading-relaxed">
            A founder running paid traffic to a page that does not convert is paying twice: the ad cost every day,
            and a subscription for a tool that does not diagnose the actual problem. Before you add a recurring
            bill, run a free conversion audit. If the leak is message match, CTA, or trust - the most common
            causes - no heatmap or SEO crawl will name it. The fix is usually a one-time change, not a monthly
            platform.
          </p>
        </section>

        {/* FAQs */}
        <section className="mt-14" aria-label="Frequently asked questions">
          <h2 className="mb-6 text-2xl font-bold text-fg">Frequently asked questions</h2>
          <div className="divide-y divide-border rounded-md border border-border bg-bg-panel">
            {HUB_FAQS.map((faq) => (
              <details key={faq.q} className="group px-6 py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left font-semibold text-fg">
                  {faq.q}
                  <span aria-hidden="true" className="shrink-0 text-accent transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-fg-muted leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* FAQPage JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(HUB_FAQ_SCHEMA) }}
        />

        {/* CTA */}
        <section className="mt-14 rounded-2xl border border-accent/20 bg-accent/5 p-8 text-center">
          <h2 className="text-2xl font-bold text-fg">See what Nebula finds on your page</h2>
          <p className="mt-3 text-fg-muted">
            Free, no signup. Results in under 2 minutes.
          </p>
          <Link
            href="/audit?utm_source=pricing-hub&utm_medium=organic-content"
            className="mt-6 inline-block rounded bg-accent px-8 py-4 font-semibold text-bg hover:opacity-85 hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg transition-colors"
          >
            Find the Leak →
          </Link>
          <p className="mt-3 text-xs text-fg-muted">
            Under 2 minutes · no signup · no sales call
          </p>
        </section>

      </article>
    </main>
  )
}
