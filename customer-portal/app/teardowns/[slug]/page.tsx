import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { TEARDOWNS } from './data'
import { BrowserMockupCard } from '@/components/mockups/BrowserMockupCard'
import { FindingCallout } from '@/components/mockups/FindingCallout'

const QUADRANT_COLORS: Record<string, string> = {
  'Quick Win': 'text-accent',
  'Major Project': 'text-amber-400',
}

export function generateStaticParams() {
  return Object.keys(TEARDOWNS).map((slug) => ({ slug }))
}

export function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  return params.then(({ slug }) => {
    const t = TEARDOWNS[slug]
    if (!t) return {}
    return {
      title: `${t.name} Landing Page Audit: What Nebula Found | Nebula`,
      description: t.summary,
      alternates: {
        canonical: `https://nebulacomponents.shop/teardowns/${t.slug}`,
      },
      openGraph: {
        title: `${t.name} Landing Page Audit: ${t.score}/10 — What the Engine Found`,
        description: t.summary,
        url: `https://nebulacomponents.shop/teardowns/${t.slug}`,
      },
    }
  })
}

export default async function TeardownPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const t = TEARDOWNS[slug]
  if (!t) notFound()

  const scoreColor =
    t.score >= 7 ? 'text-green-400' : t.score >= 5 ? 'text-amber-400' : 'text-red-400'

  const findingWord = t.findings.length === 1 ? 'One Finding' :
    t.findings.length === 2 ? 'Two Findings' :
    t.findings.length === 3 ? 'Three Findings' :
    t.findings.length === 4 ? 'Four Findings' :
    t.findings.length === 5 ? 'Five Findings' :
    `${t.findings.length} Findings`

  return (
    <main id="main-content" role="main" className="min-h-screen bg-bg pt-24">
      <article className="mx-auto max-w-4xl px-6 py-12">

        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-8">
          <ol className="flex items-center gap-2 text-sm text-fg-muted">
            <li><Link href="/" className="hover:text-fg">Home</Link></li>
            <li aria-hidden="true">/</li>
            <li><Link href="/teardowns" className="hover:text-fg">Teardowns</Link></li>
            <li aria-hidden="true">/</li>
            <li className="text-fg" aria-current="page">{t.name}</li>
          </ol>
        </nav>

        {/* Header */}
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-accent">
          Public Audit Teardown
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-fg md:text-5xl">
          {t.domain} — What the Audit Engine Found
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-fg-muted">
          Nebula ran its 7-signal audit on{' '}
          <a
            href={t.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:text-accent-light"
          >
            {t.domain}
          </a>{' '}
          on {t.auditedAt}. {t.name} is not a Nebula customer. This page shows the raw output of
          the same engine every free scan uses — {t.findings.length} findings, evidence included.
        </p>

        {/* Score card */}
        <div className="mt-8 flex flex-wrap items-center gap-6 rounded-2xl border border-border bg-bg-panel p-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-fg-muted">Score</p>
            <p className={`text-5xl font-bold ${scoreColor}`}>
              {t.score}
              <span className="text-2xl text-fg-muted">/10</span>
            </p>
          </div>
          <div className="h-12 w-px bg-border" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-fg-muted">Grade</p>
            <p className={`text-5xl font-bold ${scoreColor}`}>{t.grade}</p>
          </div>
          <div className="h-12 w-px bg-border" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-fg-muted">Findings</p>
            <p className="text-5xl font-bold text-fg">{t.findings.length}</p>
          </div>
          <div className="h-12 w-px bg-border" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-fg-muted">Audited</p>
            <p className="text-sm font-semibold text-fg">{t.auditedAt}</p>
            <p className="text-xs text-fg-muted">Same engine, public URL</p>
          </div>
        </div>

        {/* Disclosure */}
        <div className="mt-6 rounded-xl border border-amber-400/20 bg-amber-400/5 px-5 py-4 text-sm text-fg-muted">
          <strong className="text-fg">Disclosure: </strong>
          {t.name} did not request this audit and is not affiliated with Nebula Components.
          This teardown is published to demonstrate what the audit engine produces on a real,
          well-known page — not to imply any commercial relationship. All findings are
          evidence-backed; source, selector, and confidence are included per finding.{' '}
          {t.name} may update their page at any time; this reflects a snapshot taken {t.auditedAt}.
        </div>

        {/* Browser mockup — shown when a screenshot is available */}
        {t.screenshotUrl && (
          <div className="mt-8">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-fg-muted">
              Page snapshot · {t.auditedAt}
            </p>
            <BrowserMockupCard theme="dark" url={t.domain}>
              <Image
                src={t.screenshotUrl}
                alt={`${t.name} landing page snapshot — ${t.auditedAt}`}
                fill
                className="object-cover object-top"
                sizes="(max-width: 896px) 100vw, 896px"
              />
            </BrowserMockupCard>
          </div>
        )}

        {/* Findings */}
        <section className="mt-12">
          <h2 className="mb-2 text-2xl font-bold text-fg">{findingWord}</h2>
          <p className="mb-8 text-fg-muted">
            Ranked by conversion impact. Each finding includes the evidence Nebula used — no opinion, no estimation.
          </p>
          <div className="space-y-6">
            {t.findings.map((f, i) => (
              <div key={f.key} className="rounded-2xl border border-border bg-bg-panel p-6">
                <div className="mb-3 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-fg-muted">
                      Finding {i + 1}
                    </p>
                    <h3 className="mt-1 text-xl font-bold text-fg">
                      {i === 0 ? (
                        <FindingCallout variant="circle" color="text-red-400">{f.label}</FindingCallout>
                      ) : f.impact >= 3.5 ? (
                        <FindingCallout variant="wavy" color="text-accent">{f.label}</FindingCallout>
                      ) : (
                        f.label
                      )}
                    </h3>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">
                      Impact {f.impact}/10
                    </span>
                    <span className={`text-xs font-semibold ${QUADRANT_COLORS[f.quadrant] ?? 'text-fg-muted'}`}>
                      {f.quadrant}
                    </span>
                  </div>
                </div>
                <p className="text-fg-muted leading-relaxed">{f.issue}</p>
                <div className="mt-4 rounded-xl border border-border bg-bg-muted/30 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-fg-muted">Evidence</p>
                  <p className="mt-1 font-mono text-xs text-fg-muted leading-relaxed">{f.evidence}</p>
                </div>
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-widest text-fg-muted">Recommended Fix</p>
                  <p className="mt-1 text-sm text-fg-muted leading-relaxed">{f.fix}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Context */}
        <section className="mt-14">
          <h2 className="mb-4 text-2xl font-bold text-fg">What This Demonstrates</h2>
          <p className="text-fg-muted leading-relaxed">{t.context}</p>
        </section>

        {/* CTA */}
        <section className="mt-14 rounded-2xl border border-accent/20 bg-accent/5 p-8 text-center">
          <h2 className="text-2xl font-bold text-fg">See what it finds on your page</h2>
          <p className="mt-3 text-fg-muted">
            Same engine, your URL. Free, no signup. Results in under two minutes.
          </p>
          <Link
            href={`/audit?from=${encodeURIComponent(`/teardowns/${t.slug}`)}`}
            className="mt-6 inline-block rounded-xl bg-accent px-8 py-4 font-semibold text-bg hover:bg-accent-light focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg transition-colors"
          >
            Find the Leak →
          </Link>
          <p className="mt-4 text-xs text-fg-muted">
            If it finds something worth fixing, the $97 One-Leak Repair Sprint implements the highest-impact finding.
          </p>
        </section>
      </article>
    </main>
  )
}
