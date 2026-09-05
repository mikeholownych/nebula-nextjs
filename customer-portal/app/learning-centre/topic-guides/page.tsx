import type { Metadata } from 'next'
import Link from 'next/link'
import { createCollectionPageSchema } from '@/app/lib/schema'

export const metadata: Metadata = {
  title: 'Landing Page Topic Guides: Diagnose Paid Traffic Leaks | Nebula',
  description:
    'Evidence-backed topic guides for diagnosing landing page conversion leaks, evaluating CRO tools, improving ad spend decisions, and comparing AI-assisted diagnosis with page builders.',
  alternates: {
    canonical: 'https://nebulacomponents.com/learning-centre/topic-guides',
  },
}

const guides = [
  {
    href: '/learning-centre/topic-guides/landing-page-conversion-leaks',
    title: 'Landing Page Conversion Leaks',
    description:
      'Work through message match, proof, CTA, mobile, speed, and form conditions that can interrupt a paid visitor journey.',
    theme: 'Diagnose the page',
  },
  {
    href: '/learning-centre/topic-guides/conversion-rate-optimization-tools',
    title: 'Conversion Rate Optimization Tools',
    description:
      'Compare page builders, analytics, session recordings, experiments, and audits by the question each tool can answer.',
    theme: 'Choose the right evidence',
  },
  {
    href: '/learning-centre/topic-guides/ad-spend-roi-improvement',
    title: 'Ad Spend ROI Improvement',
    description:
      'Use a page-level diagnostic sequence to make the next paid traffic test more specific without assuming a fixed return.',
    theme: 'Prioritize the next test',
  },
  {
    href: '/learning-centre/topic-guides/ai-traffic-optimization-vs-landing-page-builders',
    title: 'AI Traffic Optimization vs Landing Page Builders',
    description:
      'See how AI-assisted evidence organization differs from the page construction workflow of a traditional builder.',
    theme: 'Understand the categories',
  },
] as const

const collectionSchema = createCollectionPageSchema({
  name: 'Landing Page Topic Guides',
  description:
    'Evidence-backed guides for diagnosing paid traffic conditions on landing pages.',
  url: 'https://nebulacomponents.com/learning-centre/topic-guides',
  items: guides.map(({ title, href }) => ({
    name: title,
    url: `https://nebulacomponents.com${href}`,
  })),
})

export default function TopicGuidesHub() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <main id="main-content" className="min-h-screen bg-bg pt-24">
        <div className="mx-auto max-w-5xl px-6 py-14">
          <nav
            aria-label="Breadcrumb"
            className="mb-8 flex items-center gap-2 text-sm text-fg-muted"
          >
            <Link href="/" className="transition-colors hover:text-accent">
              Home
            </Link>
            <span aria-hidden="true">/</span>
            <Link
              href="/learning-centre"
              className="transition-colors hover:text-accent"
            >
              Learning Centre
            </Link>
            <span aria-hidden="true">/</span>
            <span className="text-fg">Topic Guides</span>
          </nav>

          <header className="mb-10">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-accent">
              Nebula Learning Centre
            </p>
            <h1 className="heading-1 tracking-tight text-fg md:text-6xl">
              Landing Page Topic Guides
            </h1>
            <p className="mt-4 max-w-3xl text-lg leading-relaxed text-fg-muted">
              A practical route through the page conditions that matter when paid
              traffic arrives but meaningful actions do not follow.
            </p>
          </header>

          <section
            data-editorial="answer-first"
            className="rounded-md border border-border bg-bg-panel p-8 md:p-10"
          >
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-accent">
              Direct answer
            </p>
            <h2 className="mb-4 text-2xl font-bold text-fg">
              Direct answer: diagnose the page before changing the campaign
            </h2>
            <p className="leading-relaxed text-fg-muted">
              When paid traffic is not producing the action you need, start with
              the handoff between the campaign promise and the landing page. Check
              message match, offer clarity, proof, CTA visibility, mobile layout,
              speed, and form friction in that order. The first failed check is a
              testable hypothesis, not proof of lost revenue. Use the guides below
              to inspect the condition, choose an appropriate tool, and define the
              next measurement.
            </p>
            <aside
              role="note"
              aria-label="Evidence boundary"
              className="mt-5 rounded-xl border border-border px-5 py-4 text-sm leading-relaxed text-fg-muted"
            >
              <strong className="text-fg">Evidence boundary:</strong> a page
              inspection can identify observable conditions and prioritize a test.
              It cannot establish causality or predict a conversion, ROAS, or
              revenue outcome without controlled measurement.
            </aside>
          </section>

          <section className="mt-12" aria-labelledby="guide-list-heading">
            <div className="mb-6">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-accent">
                Four routes, one diagnostic sequence
              </p>
              <h2 id="guide-list-heading" className="text-3xl font-bold text-fg">
                Choose the question you need to answer
              </h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {guides.map((guide) => (
                <Link
                  key={guide.href}
                  href={guide.href}
                  className="group rounded-md border border-border bg-bg-panel p-6 transition-colors hover:border-accent/50 hover:bg-bg-muted"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">
                    {guide.theme}
                  </p>
                  <h3 className="mt-3 text-xl font-bold text-fg group-hover:text-accent">
                    {guide.title}
                  </h3>
                  <p className="mt-3 leading-relaxed text-fg-muted">
                    {guide.description}
                  </p>
                  <span className="mt-5 inline-flex font-semibold text-accent">
                    Explore {guide.title.toLowerCase()} <span aria-hidden="true">→</span>
                  </span>
                </Link>
              ))}
            </div>
          </section>

          <section className="mt-12 rounded-md border border-accent/30 bg-accent/5 p-8">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-accent">
              Central comparison
            </p>
            <h2 className="text-2xl font-bold text-fg">
              Compare diagnosis with page construction
            </h2>
            <p className="mt-3 max-w-3xl leading-relaxed text-fg-muted">
              The comparison article connects the cluster: it explains what a
              landing page builder, an analytics tool, and a paid-traffic audit can
              each establish, then shows where their workflows differ.
            </p>
            <Link
              href="/best-landing-page-audit-tools"
              className="mt-5 inline-flex font-semibold text-accent transition-colors hover:text-fg"
            >
              Compare landing page audit tools by job to be done <span aria-hidden="true">→</span>
            </Link>
          </section>

          <section className="mt-12 border-t border-border pt-10" aria-labelledby="audit-heading">
            <h2 id="audit-heading" className="text-2xl font-bold text-fg">
              Turn the guide into a page-level check
            </h2>
            <p className="mt-3 max-w-2xl leading-relaxed text-fg-muted">
              Run the free audit to collect observable findings from a public
              landing page before deciding what to change or measure next.
            </p>
            <Link
              href="/audit?utm_source=topic-guides&utm_medium=organic-content"
              className="mt-6 inline-flex min-h-[44px] items-center justify-center rounded bg-accent px-6 py-3 font-semibold text-bg transition-opacity hover:opacity-85"
            >
              Run the free landing page audit <span aria-hidden="true">→</span>
            </Link>
          </section>
        </div>
      </main>
    </>
  )
}
