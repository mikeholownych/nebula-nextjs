import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Research | Nebula Components',
  description:
    'Published Nebula research on landing page performance. Each report states sample, window, method, and limitations. Findings are observations, not conversion guarantees.',
  alternates: { canonical: 'https://nebulacomponents.com/research' },
}

const STUDIES = [
  {
    href: '/research/landing-page-performance-q3-2026',
    title: 'State of Landing Page Performance Q3 2026',
    description:
      'Audit-engine observations from the Q3 2026 window. Read the sample, method, and limitations on the report page before citing any number.',
  },
]

export default function ResearchIndexPage() {
  return (
    <main id="main-content" className="min-h-screen bg-bg pt-24">
      <section className="border-b border-border px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-accent">
            Research
          </p>
          <h1 className="heading-1 text-fg">Landing page research from the audit engine</h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-fg-muted">
            These reports publish measured observations from Nebula audits. They do not
            claim that any page, repair, or ranking change will produce conversions.
          </p>
        </div>
      </section>
      <section className="px-6 py-14">
        <div className="mx-auto max-w-4xl space-y-4">
          {STUDIES.map((study) => (
            <Link
              key={study.href}
              href={study.href}
              className="block rounded-xl border border-border bg-bg-panel p-6 transition-colors hover:border-accent/40"
            >
              <h2 className="text-lg font-bold text-fg">{study.title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-fg-muted">{study.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  )
}
