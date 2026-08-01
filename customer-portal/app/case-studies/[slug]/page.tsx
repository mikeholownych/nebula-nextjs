import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPublishedCaseStudies } from '@/app/lib/public-facts'
import { getCaseStudy, type CaseStudy } from './data'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug: string }> }

// ── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params

  // Check rich data.ts entries first
  const rich = getCaseStudy(slug)
  if (rich) {
    return {
      title: `${rich.company} | Nebula Components Case Study`,
      description: rich.challenge,
      alternates: {
        canonical: `https://nebulacomponents.shop/case-studies/${rich.slug}`,
      },
    }
  }

  // Fall back to published public-facts entries
  const study = getPublishedCaseStudies().find((s) => s.slug === slug)
  if (!study) return { title: 'Not Found' }
  return {
    title: `${study.title} | Nebula Components Case Study`,
    description: study.description,
    alternates: {
      canonical: `https://nebulacomponents.shop/case-studies/${study.slug}`,
    },
    openGraph: {
      title: study.title,
      description: study.description,
      url: `https://nebulacomponents.shop/case-studies/${study.slug}`,
    },
  }
}

export function generateStaticParams() {
  const published = getPublishedCaseStudies().map(({ slug }) => ({ slug }))
  // Also include rich data.ts entries so they get statically generated
  const { caseStudies } = require('./data') as { caseStudies: CaseStudy[] }
  const rich = caseStudies.map(({ slug }) => ({ slug }))
  // Dedupe by slug
  const seen = new Set(published.map((p) => p.slug))
  const extra = rich.filter((r) => !seen.has(r.slug))
  return [...published, ...extra]
}

// ── Rich layout (data.ts entries) ────────────────────────────────────────────

function RichCaseStudyPage({ study }: { study: CaseStudy }) {
  const isPlaceholder = study.company === '[Case study coming soon]'

  return (
    <main id="main-content" className="min-h-screen bg-bg">
      <nav aria-label="Breadcrumb" className="mx-auto max-w-4xl px-6 pt-6">
        <ol className="flex items-center gap-2 text-sm text-fg-muted">
          <li><Link href="/" className="hover:text-fg">Home</Link></li>
          <li aria-hidden="true">/</li>
          <li><Link href="/case-studies" className="hover:text-fg">Case Studies</Link></li>
          <li aria-hidden="true">/</li>
          <li className="text-fg" aria-current="page">{study.company}</li>
        </ol>
      </nav>

      <article className="mx-auto max-w-4xl px-6 py-12">
        {/* Industry eyebrow */}
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-accent">
          {study.industry}
        </p>

        {/* Company headline */}
        <h1 className="text-4xl font-bold tracking-tight text-fg md:text-5xl">
          {study.company}
        </h1>

        {/* Challenge */}
        <p className="mt-6 max-w-2xl text-lg leading-8 text-fg-muted">{study.challenge}</p>

        {isPlaceholder && (
          <div className="mt-6 rounded-xl border border-amber-300/30 bg-amber-50/10 px-6 py-4 text-sm text-fg-muted">
            <strong className="text-fg">Coming soon.</strong> This case study is a placeholder. Real data, evidence, and customer permission will be added before publication.
          </div>
        )}

        {/* Before / after hero */}
        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-bg-muted/40 p-5 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-fg-muted mb-1">Score before</p>
            <p className="text-4xl font-bold text-fg">{study.results.scoreBefore || '—'}</p>
          </div>
          <div className="rounded-xl border border-accent/30 bg-accent/10 p-5 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-fg-muted mb-1">Score after</p>
            <p className="text-4xl font-bold text-accent">{study.results.scoreAfter || '—'}</p>
          </div>
          <div className="col-span-2 sm:col-span-1 rounded-xl border border-border bg-bg-muted/40 p-5 text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-fg-muted mb-1">Grade</p>
            <p className="text-4xl font-bold text-fg">{study.results.grade || '—'}</p>
          </div>
        </div>

        {/* Outcome */}
        <div className="mt-6 rounded-xl border border-accent/30 bg-accent/10 px-6 py-4">
          <p className="text-sm font-semibold uppercase tracking-widest text-fg-muted mb-1">Outcome</p>
          <p className="text-lg font-semibold text-fg">{study.results.outcome}</p>
        </div>

        {/* Audit findings table */}
        <section className="mt-12">
          <h2 className="mb-4 text-2xl font-bold text-fg">What the Audit Found</h2>
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="min-w-full text-sm">
              <thead className="bg-bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-fg-muted">Signal</th>
                  <th className="px-4 py-3 text-left font-semibold text-fg-muted">Issue</th>
                  <th className="px-4 py-3 text-left font-semibold text-fg-muted">Evidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {study.auditFindings.map((finding, i) => (
                  <tr key={i} className="bg-bg hover:bg-bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-fg whitespace-nowrap">{finding.signal}</td>
                    <td className="px-4 py-3 text-fg-muted">{finding.issue}</td>
                    <td className="px-4 py-3 text-fg-muted italic">{finding.evidence}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Repairs delivered */}
        <section className="mt-10">
          <h2 className="mb-4 text-2xl font-bold text-fg">Repairs Delivered</h2>
          <div className="space-y-4">
            {study.repairs.map((repair, i) => (
              <div key={i} className="rounded-xl border border-border bg-bg-muted/30 p-5">
                <div className="mb-2 flex items-start gap-2">
                  <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-accent" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-fg-muted mb-0.5">{repair.signal}</p>
                    <p className="text-sm font-medium text-fg">{repair.fix}</p>
                  </div>
                </div>
                {repair.promptUsed && (
                  <details className="mt-3">
                    <summary className="cursor-pointer text-xs font-medium text-fg-muted hover:text-fg">
                      Show prompt used →
                    </summary>
                    <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-bg border border-border p-3 text-xs text-fg-muted font-mono leading-relaxed">
                      {repair.promptUsed}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Testimonial */}
        {study.testimonial && (
          <section className="mt-10 rounded-xl border border-border bg-bg-muted/40 p-6">
            <blockquote className="text-lg italic text-fg-muted leading-relaxed">
              &ldquo;{study.testimonial}&rdquo;
            </blockquote>
          </section>
        )}

        {/* CTA */}
        <section className="mt-16 border-t border-border pt-12 text-center">
          <h2 className="text-2xl font-bold text-fg">Get Your Own Result</h2>
          <p className="mt-4 text-fg-muted">Run the free audit. Find your leaks. Fix them.</p>
          <Link
            href="/audit"
            className="mt-6 inline-block rounded-xl bg-accent px-8 py-4 font-semibold text-bg hover:bg-accent-light focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg transition-colors"
          >
            Run Free Audit →
          </Link>
        </section>

        <section className="mt-12 border-t border-border pt-8">
          <Link href="/case-studies" className="text-sm text-fg-muted hover:text-fg">← All Case Studies</Link>
        </section>
      </article>
    </main>
  )
}

// ── Page entry ────────────────────────────────────────────────────────────────

export default async function CaseStudyPage({ params }: Props) {
  const { slug } = await params

  // Try rich data.ts entry first
  const rich = getCaseStudy(slug)
  if (rich) return <RichCaseStudyPage study={rich} />

  // Fall back to published public-facts entry
  const study = getPublishedCaseStudies().find((s) => s.slug === slug)
  if (!study) notFound()

  return (
    <main id="main-content" className="min-h-screen bg-bg">
      <nav aria-label="Breadcrumb" className="mx-auto max-w-4xl px-6 pt-6">
        <ol className="flex items-center gap-2 text-sm text-fg-muted">
          <li><Link href="/" className="hover:text-fg">Home</Link></li>
          <li aria-hidden="true">/</li>
          <li><Link href="/case-studies" className="hover:text-fg">Case Studies</Link></li>
          <li aria-hidden="true">/</li>
          <li className="text-fg" aria-current="page">{study.eyebrow}</li>
        </ol>
      </nav>

      <article className="mx-auto max-w-4xl px-6 py-12">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-accent">{study.eyebrow}</p>
        <h1 className="text-4xl font-bold tracking-tight text-fg md:text-5xl">{study.title}</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-fg-muted">{study.description}</p>

        <div className="mt-8 inline-flex items-center gap-3 rounded-xl border border-accent/30 bg-accent/10 px-6 py-4">
          <span className="text-3xl font-bold text-accent">{study.outcome}</span>
          <span className="text-sm text-fg-muted">{study.outcomeLabel}</span>
        </div>

        <section className="mt-12">
          <h2 className="mb-4 text-2xl font-bold text-fg">The Situation</h2>
          <p className="text-fg-muted leading-relaxed">{study.situation}</p>
        </section>

        <section className="mt-10">
          <h2 className="mb-4 text-2xl font-bold text-fg">What the Audit Found</h2>
          <p className="text-fg-muted leading-relaxed">{study.diagnosis}</p>
        </section>

        <section className="mt-10">
          <h2 className="mb-4 text-2xl font-bold text-fg">Fixes Applied</h2>
          <ul className="space-y-3">
            {study.fixes.map((fix, i) => (
              <li key={i} className="flex items-start gap-3 text-fg-muted">
                <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-accent" />
                {fix}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-10 rounded-xl border border-accent/30 bg-bg-muted/40 p-6">
          <h2 className="mb-3 text-xl font-bold text-fg">Result</h2>
          <p className="text-fg-muted leading-relaxed">{study.result}</p>
        </section>

        <section className="mt-16 border-t border-border pt-12 text-center">
          <h2 className="text-2xl font-bold text-fg">Get Your Own Result</h2>
          <p className="mt-4 text-fg-muted">Run the free audit. Find your leaks. Fix them.</p>
          <Link
            href="/audit"
            className="mt-6 inline-block rounded-xl bg-accent px-8 py-4 font-semibold text-bg hover:bg-accent-light focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg transition-colors"
          >
            Run Free Audit →
          </Link>
        </section>

        <section className="mt-12 border-t border-border pt-8">
          <Link href="/case-studies" className="text-sm text-fg-muted hover:text-fg">← All Case Studies</Link>
        </section>
      </article>
    </main>
  )
}
