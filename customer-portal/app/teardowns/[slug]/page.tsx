import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { fetchTeardown, formatAuditedDate } from './data.server'
import { BrowserMockupCard } from '@/components/mockups/BrowserMockupCard'
import { FindingCallout, RoughFilters } from '@/components/mockups/FindingCallout'

export const revalidate = 300

const QUADRANT_COLORS: Record<string, string> = {
  'Quick Win': 'text-accent',
  'Major Project': 'text-amber-400',
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const t = await fetchTeardown(slug)
  if (!t) return {}
  return {
    title: `${t.name} Landing Page Audit: What Nebula Found | Nebula`,
    description: t.summary,
    alternates: { canonical: `https://nebulacomponents.com/teardowns/${t.slug}` },
    openGraph: {
      title: `${t.name} Landing Page Audit: ${t.score}/10 - What the Engine Found`,
      description: t.summary,
      url: `https://nebulacomponents.com/teardowns/${t.slug}`,
    },
  }
}

export default async function TeardownPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const t = await fetchTeardown(slug)
  if (!t) notFound()
  const auditedDisplay = formatAuditedDate(t)

  const scoreColor =
    t.score >= 7 ? 'text-green-400' : t.score >= 5 ? 'text-amber-400' : 'text-red-400'

  const findingWord = t.findings.length === 1 ? 'One Finding' :
    t.findings.length === 2 ? 'Two Findings' :
    t.findings.length === 3 ? 'Three Findings' :
    t.findings.length === 4 ? 'Four Findings' :
    t.findings.length === 5 ? 'Five Findings' :
    `${t.findings.length} Findings`

  return (
    <main id="main-content" className="min-h-screen bg-bg pt-24">
      <RoughFilters />
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
        <p className="mb-4 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
          Public audit / not a customer
        </p>
        <h1 className="heading-1 tracking-tight text-fg md:text-5xl">Discover What the Audit Engine Found on {t.domain}</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-fg-muted">
          Nebula ran its evidence-backed audit on{' '}
          <a
            href={t.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:text-fg"
          >
            {t.domain}
          </a>{' '}
          on {auditedDisplay}. {t.name} is not a Nebula customer. This page shows the raw output of
          the same engine every free scan uses - {t.findings.length} findings, evidence included.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <Link
            href="/audit?utm_source=teardown-detail-hero&utm_medium=hero-cta"
            className="inline-flex min-h-[44px] items-center justify-center rounded bg-accent px-6 py-3 text-sm font-semibold text-bg transition-opacity hover:opacity-85"
          >
            Get your free audit →
          </Link>
          <Link
            href="/repair-sprint"
            className="inline-flex min-h-[44px] items-center justify-center rounded border border-border px-5 py-3 text-sm font-medium text-fg-muted transition-colors hover:border-fg-muted hover:text-fg"
          >
            Explore $97 Repair Sprint
          </Link>
        </div>

        {/* Score card */}
        <div className="mt-8 flex flex-wrap items-center gap-6 rounded-md border border-border bg-bg-panel p-6">
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
            <p className="text-sm font-semibold text-fg">{auditedDisplay}</p>
            <p className="text-xs text-fg-muted">Same engine, public URL</p>
          </div>
        </div>

        {/* Disclosure */}
        <div className="mt-6 rounded-xl border border-amber-400/20 bg-amber-400/5 px-5 py-4 text-sm text-fg-muted">
          <strong className="text-fg">Disclosure: </strong>
          {t.name} did not request this audit and is not affiliated with Nebula Components.
          This teardown is published to demonstrate what the audit engine produces on a real,
          well-known page - not to imply any commercial relationship. All findings are
          evidence-backed; source, selector, and confidence are included per finding.{' '}
          {t.name} may update their page at any time; this reflects a snapshot taken {auditedDisplay}.
        </div>

        {/* Required source-page snapshot */}
        <div className="mt-8">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-fg-muted">
            Page snapshot · {auditedDisplay}
          </p>
          <BrowserMockupCard theme="dark" url={t.domain}>
            <div className="relative h-80 w-full">
              <Image
                src={t.screenshot_path ?? ''}
                alt={`${t.name} landing page snapshot - ${auditedDisplay}`}
                fill
                priority
                className="object-cover object-top"
                sizes="(max-width: 896px) 100vw, 896px"
              />
            </div>
          </BrowserMockupCard>
        </div>

        {/* Findings */}
        <section className="mt-12">
          <h2 className="mb-2 text-2xl font-bold text-fg">{findingWord}</h2>
          <p className="mb-8 text-fg-muted">
            Ranked by observable priority. Each finding includes the evidence Nebula used - no opinion, no estimation. Priority scores are rule-based heuristics for fix order, not predicted conversion loss.
          </p>
          <div className="space-y-6">
            {t.findings.map((f, i) => (
              <div key={f.key} className="rounded-md border border-border bg-bg-panel p-6">
                <div className="mb-3 flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-fg-muted">
                      Finding {i + 1}
                    </p>
                    <h3 className="mt-1 text-xl font-bold text-fg">
{i === 0 ? (
                         <FindingCallout variant="circle" color="text-red-400">{f.label}</FindingCallout>
                       ) : f.priority >= 3.5 ? (
                         <FindingCallout variant="wavy" color="text-accent">{f.label}</FindingCallout>
                       ) : (
                         f.label
                       )}
                    </h3>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent" aria-label="Rule-derived prioritization score based on journey position, severity, reproducibility and confidence. This is not predicted conversion loss.">
                      Priority {f.priority}/10
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

        {/* claim-cta:start */}
        {t.claim?.status === 'active' && t.claim.response_status === 'visible' && (
          <section className="mt-12 border-l-2 border-accent pl-6 py-2">
            <p className="text-xs uppercase tracking-widest text-white/50">
              Verified response from the {t.name} team
            </p>
            <p className="mt-3 text-white/80 whitespace-pre-line">{t.claim.response_text}</p>
          </section>
        )}
        <div className="mt-12 border border-white/10 rounded-lg p-6 flex items-center justify-between gap-4">
          <p className="text-sm text-white/60">
            Work at {t.name}? Verify ownership to manage this teardown in your workspace.
          </p>
          {!t.claim?.status && (
            <a href={`/teardowns/${t.slug}/claim`}
               className="shrink-0 bg-accent text-black font-semibold text-sm px-4 py-2 rounded">
              Claim this teardown
            </a>
          )}
        </div>
        {/* claim-cta:end */}

        {/* CTA */}
        <section className="mt-14 rounded-2xl border border-accent/20 bg-accent/5 p-8 text-center">
          <h2 className="text-2xl font-bold text-fg">See what it finds on your page</h2>
          <p className="mt-3 text-fg-muted">
            Same engine, your URL. Free, no signup. Results in under two minutes.
          </p>
          <Link
            href={`/audit?from=${encodeURIComponent(`/teardowns/${t.slug}`)}`}
            className="mt-6 inline-block rounded bg-accent px-8 py-4 font-semibold text-bg hover:opacity-85 hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg transition-colors"
          >
            Find the Leak →
          </Link>
          <div className="mt-6 pt-6 border-t border-accent/10">
            <p className="text-xs text-fg-muted mb-3">Already know your page has issues? Skip the audit.</p>
            <a
              href="https://buy.stripe.com/5kQbJ1eawdj6eql1Jg43S0h"
              className="inline-block rounded border border-accent/60 px-6 py-3 text-sm font-semibold text-accent hover:bg-accent/10 transition-colors"
            >
              Fix one leak now, $97 →
            </a>
            <p className="mt-2 text-xs text-fg-muted">
              One finding. 48h delivery. No call, no retainer.
            </p>
          </div>
        </section>
      </article>
    </main>
  )
}
