import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'SaaS Landing Page Audit: Demo Friction, ICP Clarity & Trial Conversion | Nebula',
  description:
    'B2B SaaS landing pages fail for specific reasons: feature jargon where the ICP statement should be, demo CTAs on self-serve products, and no product UI above the fold. This guide covers each failure with observable evidence and a fix.',
  alternates: {
    canonical: 'https://nebulacomponents.com/saas-landing-page-audit',
  },
  openGraph: {
    title: 'SaaS Landing Page Audit: Demo Friction, ICP Clarity & Trial Conversion | Nebula',
    description:
      'B2B SaaS landing pages fail for specific reasons: feature jargon where the ICP statement should be, demo CTAs on self-serve products, and no product UI above the fold.',
    url: 'https://nebulacomponents.com/saas-landing-page-audit',
    siteName: 'Nebula Components',
    type: 'article',
  },
}

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'SaaS Landing Page Audit: Demo Friction, ICP Clarity & Trial Conversion',
  description:
    'Diagnostic guide for B2B SaaS landing pages — ICP clarity, demo vs trial CTA friction, product proof, and the 9 conversion signals applied to SaaS-specific failure patterns.',
  author: { '@type': 'Organization', name: 'Nebula Components' },
  publisher: { '@type': 'Organization', name: 'Nebula Components' },
  mainEntityOfPage: 'https://nebulacomponents.com/saas-landing-page-audit',
}

const faqItems = [
  {
    q: 'Why does my SaaS landing page get clicks but no trial signups?',
    a: 'The most common causes are message mismatch between the ad and the H1, a demo CTA on a product that should offer a self-serve trial, missing product UI above the fold, and no proof adjacent to the primary action. Each of these is observable in the page HTML — an automated audit surfaces which ones apply.',
  },
  {
    q: 'Should a B2B SaaS page use a demo CTA or a trial CTA?',
    a: 'It depends on the product complexity and sales motion. Products below ~$200/month ACV with self-serve onboarding convert better with a trial CTA. Products requiring implementation, admin setup, or team rollout benefit from a demo. Mismatching the CTA to the actual sales motion is the most common SaaS landing page mistake.',
  },
  {
    q: 'What does "ICP clarity" mean on a landing page?',
    a: 'ICP clarity means the headline explicitly identifies who the product is for. "The all-in-one workspace" has zero ICP clarity. "The project management tool for engineering teams" has it. Cold paid traffic — arriving from an ad that targeted a specific audience — expects the page to confirm immediately that they are in the right place.',
  },
  {
    q: 'Why do SaaS pages score low on social proof signals?',
    a: 'Most SaaS pages put social proof below the fold or rely on logo strips without context. Logos alone do not reduce perceived risk for cold traffic. A named quote with a specific outcome (e.g., "Reduced onboarding time from 4 weeks to 3 days") outperforms a logo strip every time.',
  },
  {
    q: 'What is the biggest H1 mistake on SaaS homepages?',
    a: 'Writing the H1 as a product category rather than a customer outcome. "Collaborative document platform" describes the software. "Write, review, and ship docs without the 14-tab workflow" describes the customer\'s situation. The second version is faster to evaluate for cold traffic.',
  },
]

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqItems.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
}

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://nebulacomponents.com' },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'SaaS Landing Page Audit',
      item: 'https://nebulacomponents.com/saas-landing-page-audit',
    },
  ],
}

const SAAS_FAILURES = [
  {
    signal: 'Headline (H1)',
    label: 'ICP statement replaced by category description',
    detail:
      'SaaS H1s typically describe the product category instead of naming who it is for. "The all-in-one workspace" tells a visitor nothing about whether they belong on the page. Cold paid traffic arriving from a targeted ad needs confirmation within the first viewport that the product matches their situation — not a feature description.',
    fix: 'Replace the product category with the buyer\'s situation. Who is this for, and what does it solve for them specifically? One sentence. Test against the ad headline to confirm message continuity.',
  },
  {
    signal: 'CTA',
    label: 'Demo CTA on a self-serve product',
    detail:
      'A demo CTA routes cold traffic into a sales pipeline. That is appropriate for products requiring implementation, procurement, or admin setup. For products below ~$200/month ACV that onboard in minutes, asking for a demo is a commitment mismatch — visitors who could convert in 2 minutes are instead put in a queue for a call. Webflow, Notion, and Calendly all have self-serve products. Their CTAs are correct. SaaS pages with comparable products that default to "Book a demo" are converting their most decisive visitors into waiting leads.',
    fix: 'Match the CTA to the actual sales motion. Self-serve: "Start free" or "Try for free — no card required." Sales-assisted: "See a demo." Do not mix both at equal visual weight in the hero.',
  },
  {
    signal: 'Above the fold',
    label: 'No product UI visible before scroll',
    detail:
      'Software is evaluated differently from physical products. A visitor cannot hold it, try it, or observe it passively. The fastest proxy for product confidence is a screenshot of the actual interface — not an illustration, not a diagram, not an icon grid. Pages that open with a stock gradient and a headline below it are asking visitors to take an action (sign up) before providing any evidence of what they are signing up for.',
    fix: 'Put a real product screenshot above the fold. It does not need to be polished — a genuine interface view signals that the product exists and is specific. Crop to the most recognizable or impressive view.',
  },
  {
    signal: 'Social proof',
    label: 'Logo strip with no outcome context',
    detail:
      'A strip of company logos says "organizations have used this." It does not say what changed for them. For cold traffic evaluating a software purchase, logos create no measurable reduction in perceived risk unless they are recognizable brands the visitor already trusts. A single named quote with a specific outcome ("Closed 3 weeks of backlog in one sprint") does more conversion work than 12 unnamed logos.',
    fix: 'Replace or supplement the logo strip with one to three named quotes that include a specific, verifiable outcome. Job title and company are enough for attribution without requiring a case study.',
  },
  {
    signal: 'Load speed',
    label: 'JavaScript-heavy rendering delays LCP',
    detail:
      'SaaS pages frequently render the primary headline and CTA via JavaScript bundles. This means the page\'s most important content arrives late — or not at all for visitors on slow connections. It also means search engine crawlers and link previewers see a blank page. A missing H1 in static HTML (as observed on Calendly) is the most severe form of this problem.',
    fix: 'Server-render the above-fold content. The H1, primary CTA, and value statement should be in the static HTML response. Run the audit and check the raw source: if the H1 count in static HTML is zero, the headline is rendering client-side.',
  },
  {
    signal: 'SEO foundations',
    label: 'Title tag misaligned with H1 keyword',
    detail:
      'SaaS pages commonly run A/B tests by injecting both headline variants into the DOM simultaneously. This creates two H1 tags — both indexed by Google, both competing for the same ranking signal. Webflow\'s production page was observed with two H1 tags: "Make your website a growth engine" and "Make websites that drive results." Neither can win because both dilute the signal for the other.',
    fix: 'Run A/B tests at the edge or server layer — serve one variant per response. If running client-side A/B tests, ensure only one H1 is in the DOM at any time.',
  },
]

export default function SaasAuditPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <main id="main-content" className="min-h-screen bg-bg pt-24 pb-16">
        <article className="mx-auto max-w-4xl px-6">

          {/* Header */}
          <header className="mb-12">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent mb-2">
              B2B SaaS Conversion
            </p>
            <h1 className="text-3xl font-extrabold tracking-tight text-fg md:text-5xl">
              SaaS Landing Page Audit
            </h1>
            <p className="mt-4 text-lg text-fg-muted leading-relaxed max-w-2xl">
              B2B SaaS landing pages fail in specific, repeatable ways. Feature jargon where the ICP statement belongs. A demo CTA on a product that should offer a trial. No product UI above the fold. This guide covers each pattern with observable evidence and a bounded fix.
            </p>
          </header>

          {/* Six failure patterns */}
          <section className="mb-14">
            <h2 className="text-2xl font-bold tracking-tight text-fg mb-6">
              Six SaaS-specific conversion failures
            </h2>
            <div className="space-y-4">
              {SAAS_FAILURES.map((f, i) => (
                <div key={i} className="rounded-xl border border-border bg-bg-muted/20 p-6">
                  <div className="flex items-start gap-3 mb-3">
                    <span className="shrink-0 font-mono text-xs text-fg-dim mt-0.5">{String(i + 1).padStart(2, '0')}</span>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-accent mb-0.5">{f.signal}</p>
                      <h3 className="text-base font-semibold text-fg">{f.label}</h3>
                    </div>
                  </div>
                  <p className="text-sm text-fg-muted leading-6 mb-3 pl-7">{f.detail}</p>
                  <div className="pl-7 border-l-2 border-accent/30 ml-7">
                    <p className="text-xs font-semibold text-accent uppercase tracking-wider mb-1">Fix</p>
                    <p className="text-sm text-fg-muted leading-6">{f.fix}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Real SaaS teardowns callout */}
          <section className="mb-14 rounded-2xl border border-border bg-bg-surface p-6 md:p-8">
            <h2 className="text-xl font-bold text-fg mb-3">Real SaaS pages audited by the engine</h2>
            <p className="text-sm text-fg-muted leading-6 mb-5">
              Nebula has run its 9-signal audit on several major SaaS products. The engine reads the actual HTML — not a screenshot, not a manual review.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { name: 'Notion', score: '6.1/10 · C', finding: '417KB HTML — 3.4× heuristic max. H1 and title tell different stories.', slug: 'notion' },
                { name: 'Webflow', score: '5.8/10 · C', finding: 'Two H1 tags in DOM via A/B test. Both indexed, neither wins.', slug: 'webflow' },
                { name: 'Calendly', score: '5.8/10 · C', finding: 'No H1 in static HTML. 1.2MB payload — 10× the heuristic ceiling.', slug: 'calendly' },
              ].map((t) => (
                <Link
                  key={t.slug}
                  href={`/teardowns/${t.slug}`}
                  className="group rounded-xl border border-border bg-bg-muted/20 p-4 hover:border-accent/40 transition-colors"
                >
                  <p className="text-xs font-semibold text-fg-muted mb-1">{t.name}</p>
                  <p className="font-mono text-sm text-fg mb-2">{t.score}</p>
                  <p className="text-xs text-fg-muted leading-5">{t.finding}</p>
                  <p className="mt-3 text-xs font-semibold text-accent group-hover:text-accent-light transition-colors">View full report →</p>
                </Link>
              ))}
            </div>
          </section>

          {/* How Nebula checks SaaS pages */}
          <section className="mb-14">
            <h2 className="text-2xl font-bold tracking-tight text-fg mb-4">
              What the audit checks on a SaaS page
            </h2>
            <p className="text-sm text-fg-muted leading-6 mb-6 max-w-2xl">
              Nebula runs the same 9 signals on every URL. For SaaS pages, the three signals that fail most often are headline, CTA, and social proof. The audit returns pass/fail with the raw value from your page — H1 text, CTA label, source-order trust markers — so you can verify the finding yourself.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { signal: 'Headline', pass: 'H1 names who the product is for', fail: 'H1 describes a product category' },
                { signal: 'CTA', pass: 'CTA matches the sales motion (trial vs demo)', fail: 'Demo CTA on a self-serve product' },
                { signal: 'Social proof', pass: '2+ named, outcome-specific trust signals above fold', fail: 'Logo strip with no attribution or context' },
                { signal: 'Above the fold', pass: 'Product UI visible before scroll', fail: 'Hero is a gradient with text only' },
                { signal: 'Load speed', pass: 'LCP < 2.5s, H1 in static HTML', fail: 'H1 rendered by JS bundle' },
                { signal: 'SEO foundations', pass: 'One H1, title aligned with H1 keyword', fail: 'Dual H1 from A/B test, mismatched title' },
              ].map((s) => (
                <div key={s.signal} className="rounded-xl border border-border bg-bg-muted/20 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-accent mb-2">{s.signal}</p>
                  <p className="text-xs text-fg-muted leading-5 mb-1">
                    <span className="text-accent">Pass: </span>{s.pass}
                  </p>
                  <p className="text-xs text-fg-muted leading-5">
                    <span className="text-signal-fail">Fail: </span>{s.fail}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* CTA */}
          <section className="mb-14 rounded-2xl border border-border bg-bg-muted/30 p-8 text-center">
            <h2 className="text-2xl font-bold text-fg mb-3">Audit your SaaS landing page</h2>
            <p className="text-sm text-fg-muted max-w-xl mx-auto mb-6">
              Paste your URL. Nebula checks message match, CTA friction, product proof, and load performance against your actual page — not a template. Free, no signup, under 2 minutes.
            </p>
            <Link
              href="/audit?utm_source=content&utm_medium=organic-content"
              className="inline-block rounded-xl bg-accent px-8 py-4 font-semibold text-bg hover:bg-accent-light transition-colors text-base"
            >
              Run Free SaaS Audit &rarr;
            </Link>
          </section>

          {/* FAQ */}
          <section className="mb-14">
            <h2 className="text-2xl font-bold tracking-tight text-fg mb-6">Common questions</h2>
            <div className="space-y-4">
              {faqItems.map(({ q, a }, i) => (
                <div key={i} className="rounded-xl border border-border bg-bg-muted/20 p-5">
                  <h3 className="text-sm font-semibold text-fg mb-2">{q}</h3>
                  <p className="text-sm text-fg-muted leading-6">{a}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Related */}
          <footer className="border-t border-border pt-8 flex flex-wrap gap-4 text-sm text-fg-muted">
            <span className="font-semibold text-fg">Related audits:</span>
            <Link href="/ecommerce-landing-page-audit" className="hover:text-accent transition-colors">Ecommerce Audit</Link>
            <Link href="/lead-generation-landing-page-audit" className="hover:text-accent transition-colors">Lead Gen Audit</Link>
            <Link href="/why-is-my-landing-page-not-converting" className="hover:text-accent transition-colors">Landing Page Diagnostics</Link>
            <Link href="/teardowns" className="hover:text-accent transition-colors">Public Teardowns</Link>
            <Link href="/pricing" className="hover:text-accent transition-colors">Repair Sprint Pricing</Link>
          </footer>

        </article>
      </main>
    </>
  )
}
