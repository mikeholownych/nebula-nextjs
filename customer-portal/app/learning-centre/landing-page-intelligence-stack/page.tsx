import type { Metadata } from 'next'
import Link from 'next/link'
import { createArticleSchema, createBreadcrumbSchema } from '@/app/lib/schema'
import { Card } from '@/components/ui/Card'
import { LinkButton } from '@/components/ui/LinkButton'

const title = 'Landing Page Intelligence Stack: 6 Evidence-Grade Workflows'
const description = 'Download six inspectable workflows for message match, trust, mobile layout, CTA friction, prioritization, and fix verification.'
const canonical = 'https://nebulacomponents.shop/learning-centre/landing-page-intelligence-stack'
const downloadHref = '/downloads/nebula-landing-page-intelligence-stack-v1.zip'

export const metadata: Metadata = {
  title: `${title} | Nebula Components`,
  description,
  alternates: { canonical },
  openGraph: {
    title,
    description,
    url: canonical,
    type: 'article',
  },
}

const workflows = [
  {
    number: '01',
    name: 'Ad-to-page message-match checker',
    output: 'Mismatch map',
    description: 'Compare the ad promise with the rendered headline, hero copy, and primary action without inventing campaign intent.',
  },
  {
    number: '02',
    name: 'Trust-gap detector',
    output: 'Evidence inventory',
    description: 'Map visible claims to inspectable proof while keeping presence, identity, endorsement, and outcome evidence separate.',
  },
  {
    number: '03',
    name: 'Mobile first-scroll analyzer',
    output: 'Viewport failure report',
    description: 'Record what is actually visible and actionable at 375 by 812 CSS pixels using rendered geometry, not source order.',
  },
  {
    number: '04',
    name: 'CTA and form-friction analyzer',
    output: 'Friction sequence',
    description: 'Trace labels, destinations, required fields, and visible errors without submitting forms or creating leads.',
  },
  {
    number: '05',
    name: 'Paid-traffic leak prioritizer',
    output: 'Ranked fix map',
    description: 'Order supported defects by journey impact, reproducibility, and confidence—without manufacturing revenue loss.',
  },
  {
    number: '06',
    name: 'Fix verification workflow',
    output: 'Before-and-after evidence packet',
    description: 'Repeat the original check under comparable conditions and classify the defect as resolved, unchanged, regressed, moved, or not testable.',
  },
]

const articleSchema = createArticleSchema({
  headline: title,
  description,
  url: canonical,
  publishedDate: '2026-07-25',
  modifiedDate: '2026-07-25',
})

const breadcrumbSchema = createBreadcrumbSchema([
  { name: 'Home', url: 'https://nebulacomponents.shop' },
  { name: 'Learning Centre', url: 'https://nebulacomponents.shop/learning-centre' },
  { name: 'Landing Page Intelligence Stack', url: canonical },
])

export default function LandingPageIntelligenceStackPage() {
  return (
    <main id="main-content" className="min-h-screen bg-bg pt-24 pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <article className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-10 text-sm text-fg-muted">
          <ol className="flex flex-wrap items-center gap-2">
            <li><Link href="/" className="hover:text-accent">Home</Link></li>
            <li aria-hidden="true">/</li>
            <li><Link href="/learning-centre" className="hover:text-accent">Learning Centre</Link></li>
            <li aria-hidden="true">/</li>
            <li aria-current="page" className="text-fg">Intelligence Stack</li>
          </ol>
        </nav>

        <header className="border-b border-border pb-14">
          <p className="mb-5 text-sm font-semibold uppercase tracking-[0.2em] text-accent">
            Evidence-grade workflow bundle
          </p>
          <h1 className="max-w-4xl text-4xl font-bold leading-tight text-fg sm:text-5xl lg:text-6xl">
            Six landing-page checks. Every conclusion tied to evidence.
          </h1>
          <p className="mt-7 max-w-3xl text-lg leading-8 text-fg-muted sm:text-xl">
            This free stack turns a landing page into six inspectable records: what was observed,
            where it appeared, what it may mean, and what still cannot be proven.
          </p>
          <div className="mt-9 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <LinkButton
              href={downloadHref}
              download
              size="lg"
              data-testid="intelligence-stack-download-link"
            >
              Download the workflow stack
            </LinkButton>
            <span className="text-sm text-fg-muted">ZIP · Markdown + JSON · no email required</span>
          </div>
        </header>

        <section aria-labelledby="workflow-heading" className="py-16">
          <div className="mb-9 max-w-3xl">
            <h2 id="workflow-heading" className="text-3xl font-bold text-fg sm:text-4xl">
              One evidence chain, six bounded outputs
            </h2>
            <p className="mt-4 text-lg leading-8 text-fg-muted">
              Each workflow produces a named artifact that can be inspected, challenged, and repeated.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            {workflows.map((workflow) => (
              <Card key={workflow.number} variant="bordered" padding="lg" className="h-full">
                <div className="flex items-start gap-4">
                  <span className="font-mono text-sm text-accent" aria-hidden="true">{workflow.number}</span>
                  <div>
                    <h3 className="text-xl font-semibold text-fg">{workflow.name}</h3>
                    <p className="mt-2 text-sm font-semibold uppercase tracking-wide text-accent">
                      Output: {workflow.output}
                    </p>
                    <p className="mt-4 leading-7 text-fg-muted">{workflow.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        <section aria-labelledby="rules-heading" className="border-y border-border py-14">
          <h2 id="rules-heading" className="text-3xl font-bold text-fg">Evidence rules</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {[
              ['Separate', 'Observation and interpretation remain separate fields.'],
              ['Fail closed', 'Unknowns become not_testable instead of invented evidence.'],
              ['Bound claims', 'No revenue or conversion result is inferred from a page observation.'],
            ].map(([label, copy]) => (
              <div key={label}>
                <p className="font-semibold text-accent">{label}</p>
                <p className="mt-2 leading-7 text-fg-muted">{copy}</p>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="usage-heading" className="grid gap-10 py-16 lg:grid-cols-2">
          <div>
            <h2 id="usage-heading" className="text-3xl font-bold text-fg">How to use the stack</h2>
            <ol className="mt-7 space-y-4 text-fg-muted">
              <li><strong className="text-fg">1.</strong> Collect the ad, page, viewport, and visible journey inputs.</li>
              <li><strong className="text-fg">2.</strong> Run workflows 1–4 and keep each raw observation intact.</li>
              <li><strong className="text-fg">3.</strong> Rank supported defects with workflow 5.</li>
              <li><strong className="text-fg">4.</strong> Verify changed conditions with workflow 6.</li>
            </ol>
          </div>
          <Card variant="bordered" padding="lg">
            <h2 className="text-2xl font-bold text-fg">Limits</h2>
            <ul className="mt-6 space-y-3 text-fg-muted">
              <li>Public rendered evidence only.</li>
              <li>No private analytics or account access.</li>
              <li>No automated form submission or lead creation.</li>
              <li>No outcome is promised from a recorded page change.</li>
            </ul>
          </Card>
        </section>

        <section aria-labelledby="audit-heading" className="rounded-3xl border border-accent/40 bg-accent-dim p-8 sm:p-12">
          <h2 id="audit-heading" className="text-3xl font-bold text-fg">Want the page inspected now?</h2>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-fg-muted">
            The bundle teaches the method. The live audit applies Nebula&apos;s public checks to a URL and returns inspectable findings.
          </p>
          <div className="mt-8">
            <LinkButton
              href="/audit"
              size="lg"
              data-testid="intelligence-stack-audit-link"
            >
              Run the live audit
            </LinkButton>
          </div>
        </section>

        <div className="mt-12">
          <Link href="/learning-centre" className="font-medium text-accent hover:text-accent-light">
            ← Back to the Learning Centre
          </Link>
        </div>
      </article>
    </main>
  )
}
