import Link from 'next/link'
import type { PublishedCaseStudy } from '@/app/lib/public-facts'
import { TEARDOWNS as TEARDOWNS_DATA } from '@/app/teardowns/[slug]/data'

const TEARDOWNS = Object.values(TEARDOWNS_DATA).sort((a, b) => a.score - b.score)

export default function CaseStudiesContent({
  studies,
}: {
  studies: readonly PublishedCaseStudy[]
}) {
  const hasPublishedStudies = studies.length > 0
  return (
    <main id="main-content" role="main" className="min-h-screen bg-bg pt-24">
      <section className="mx-auto max-w-4xl px-6 py-16">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-accent">Case Studies</p>
        <h1 className="text-4xl font-bold tracking-tight text-fg md:text-5xl">
          {hasPublishedStudies
            ? 'Published, evidence-backed case studies'
            : <>No client case studies yet - here is what the engine does instead.</>}
        </h1>
        {hasPublishedStudies ? (
          <p className="mt-6 max-w-2xl text-lg leading-8 text-fg-muted">
            Every entry below passed the public-fact evidence, measurement-window, permission,
            disclosure, and publication checks before appearing here.
          </p>
        ) : (
          <p className="mt-6 max-w-2xl text-lg leading-8 text-fg-muted">
            A client case study requires a real before-and-after number and dates you could
            verify. We don&apos;t have one to publish yet. Instead, we run the same audit engine
            on well-known public pages and publish the raw findings - so you can evaluate the
            tool against pages you already know.
          </p>
        )}
      </section>

      {hasPublishedStudies ? (
        <section className="border-t border-border bg-bg-muted/30 px-6 py-16">
          <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
            {studies.map((study) => (
              <article key={study.slug} className="rounded-2xl border border-border bg-bg-panel p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">
                  {study.eyebrow}
                </p>
                <h2 className="mt-3 text-2xl font-bold text-fg">
                  <Link href={`/case-studies/${study.slug}`} className="hover:text-accent">
                    {study.title}
                  </Link>
                </h2>
                <p className="mt-3 text-fg-muted">{study.description}</p>
                <p className="mt-5 text-2xl font-bold text-accent">{study.outcome}</p>
                <p className="mt-1 text-sm text-fg-muted">{study.outcomeLabel}</p>
                <p className="mt-5 text-xs text-fg-muted">
                  Measurement window: {study.measurementWindow.startedAt} to{' '}
                  {study.measurementWindow.endedAt}
                </p>
                <p className="mt-3 text-xs text-fg-muted">{study.disclosure}</p>
                <a
                  href={study.evidenceUrl}
                  className="mt-5 inline-block text-sm font-semibold text-accent hover:text-accent-light"
                >
                  Inspect evidence →
                </a>
              </article>
            ))}
          </div>
        </section>
      ) : (
        <>
          {/* Public teardowns - evidence of what the engine produces */}
          <section className="border-t border-border px-6 py-16">
            <div className="mx-auto max-w-4xl">
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-accent">
                Public Teardowns
              </p>
              <h2 className="mb-2 text-2xl font-bold text-fg">
                Real audits on well-known pages
              </h2>
              <p className="mb-8 max-w-2xl text-fg-muted leading-7">
                These companies are not Nebula customers. We run the same 9-signal engine on their
                public pages and publish the raw findings - evidence of what the audit produces on
                pages you can verify yourself.
              </p>
              <div className="grid gap-6 md:grid-cols-2">
                {TEARDOWNS.map((t) => {
                  const scoreColor =
                    t.score >= 7
                      ? 'text-green-400'
                      : t.score >= 5
                        ? 'text-amber-400'
                        : 'text-red-400'
                  return (
                    <article
                      key={t.slug}
                      className="rounded-2xl border border-border bg-bg-panel p-6"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-widest text-fg-muted">
                            {t.domain}
                          </p>
                          <h3 className="mt-1 text-2xl font-bold text-fg">{t.name}</h3>
                        </div>
                        <div className="text-right">
                          <p className={`text-3xl font-bold ${scoreColor}`}>
                            {t.score}
                            <span className="text-lg text-fg-muted">/10</span>
                          </p>
                          <p className={`text-sm font-semibold ${scoreColor}`}>Grade {t.grade}</p>
                        </div>
                      </div>
                      <p className="mt-3 text-sm text-fg-muted">{t.findings.length} findings · Audited {t.auditedAt}</p>
                      <p className="mt-2 text-sm text-fg-muted leading-relaxed">{t.findings[0]?.issue.substring(0, 120)}{t.findings[0]?.issue.length > 120 ? '…' : ''}</p>
                      <Link
                        href={`/teardowns/${t.slug}`}
                        className="mt-5 inline-block text-sm font-semibold text-accent hover:text-accent-light"
                      >
                        Read teardown →
                      </Link>
                    </article>
                  )
                })}
              </div>
            </div>
          </section>

          {/* What goes here when we have real clients */}
          <section className="border-t border-border bg-bg-muted/30 px-6 py-16">
            <div className="mx-auto max-w-4xl">
              <h2 className="text-2xl font-bold text-fg">What a client case study looks like</h2>
              <p className="mt-4 max-w-2xl text-fg-muted leading-7">
                The first client case study we publish will name the page (or explain why
                it&apos;s anonymized), state the actual before/after metric, give the measurement
                window, and link the underlying evidence. If we can&apos;t show our work, it
                doesn&apos;t go here.
              </p>
              <p className="mt-4 max-w-2xl text-fg-muted leading-7">
                Until then: run the audit on a page you know well. See whether the findings match
                what you already know is true. That is the fastest way to evaluate the engine.
              </p>
            </div>
          </section>
        </>
      )}

      <section className="mx-auto max-w-4xl px-6 py-16 text-center">
        <h2 className="text-2xl font-bold text-fg">See it on your page</h2>
        <p className="mt-4 text-fg-muted">Same engine. Your URL. No signup required.</p>
        <Link
          href="/audit?utm_source=content&utm_medium=organic-content"
          className="mt-8 inline-block rounded-xl bg-accent px-8 py-4 font-semibold text-bg hover:bg-accent-light focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg transition-colors"
        >
          Find the Leak →
        </Link>
      </section>
    </main>
  )
}

