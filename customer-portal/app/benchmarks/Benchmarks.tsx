'use client'

import { useEffect, useState } from 'react'

type ComponentStat = {
  label: string
  failures: number
  avg_impact: number
  share: number
}

type BenchmarksData = {
  audit_count: number
  avg_score: number | null
  highest: number | null
  lowest: number | null
  components: ComponentStat[]
  distribution: { bucket: string; count: number }[]
}

const SIGNAL_DESCRIPTIONS: Record<string, string> = {
  'Above Fold': 'Offer and promise visible in the first viewport without scrolling',
  'Ad Signals': 'Recognizable ad-tracking artifacts in the fetched page source',
  'Seo Foundations': 'Title, meta description, and single descriptive H1 present',
  Cta: 'One clear primary action with action + outcome copy',
  'Load Speed': 'LCP under 2.5s, CLS under 0.1, INP under 200ms on mobile',
  'Social Proof': 'Testimonials, reviews, or proof markers near the first CTA',
  'Ai Readiness': 'Signals that make the page citable and understandable to AI systems',
  Headline: 'Headline that repeats the incoming ad promise and names the outcome',
  'Local Gbp': 'Google Business Profile signals for local businesses',
  Mobile: 'Primary action visible and usable on a 375px viewport',
}

// Pass standards mirror the audit engine's own pass/fail logic
// (deliver_audit.py dimension scoring), so the published statistic
// can always be checked against the actual check that produced it.
const PASS_STANDARDS: Record<string, string> = {
  'Above Fold':
    'Visitor understands what is offered, who it\'s for, and what to do next within the first viewport.',
  'Ad Signals':
    'At least one recognized ad-tracking artifact in the fetched page source (pixel, tag manager, GA4, or conversion API reference).',
  'Seo Foundations': 'Title tag, meta description, and a single descriptive H1 all present.',
  Cta: 'One primary action with action + outcome copy, visible above the fold.',
  'Load Speed': 'LCP under 2.5s, CLS under 0.1, INP under 200ms on mobile.',
  'Social Proof':
    'Proof near the first CTA: sample output, customer quote, metric, guarantee, or process evidence.',
  'Ai Readiness': 'Structured signals that make the page citable and understandable to AI systems (JSON-LD, OG tags, clean hierarchy).',
  Headline: 'H1 is 12–90 characters and names the buyer outcome, not a generic claim.',
  'Local Gbp': 'LocalBusiness/Product structured data or GBP product listing indicators present.',
  Mobile: 'Primary action visible and usable on a 375px viewport.',
}

export default function Benchmarks() {
  const [data, setData] = useState<BenchmarksData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/audit/stats/benchmarks')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
  }, [])

  if (error) {
    return (
      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm text-signal-fail">Benchmarks unavailable right now ({error}).</p>
        </div>
      </section>
    )
  }

  if (!data) {
    return (
      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm text-fg-muted">Loading real benchmark data&hellip;</p>
        </div>
      </section>
    )
  }

  const maxFailures = Math.max(1, ...data.components.map((c) => c.failures))

  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-6xl space-y-12">
        {/* Headline stats */}
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { label: 'Audits in sample', value: data.audit_count, suffix: '' },
            { label: 'Average score', value: data.avg_score?.toFixed(1) ?? '—', suffix: '/10' },
            {
              label: 'Range',
              value:
                data.lowest !== null && data.highest !== null
                  ? `${data.lowest.toFixed(1)}–${data.highest.toFixed(1)}`
                  : '—',
              suffix: '/10',
            },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-bg-muted/20 p-5">
              <p className="text-xs font-semibold text-fg-muted">{s.label}</p>
              <p className="mt-2 text-3xl font-bold text-fg">
                {s.value}
                <span className="ml-1 text-sm font-normal text-fg-muted">{s.suffix}</span>
              </p>
            </div>
          ))}
        </div>

        {/* Distribution */}
        <div>
          <h2 className="mb-4 text-xl font-bold tracking-tight text-fg">Score distribution</h2>
          <div className="flex h-10 w-full overflow-hidden rounded-xl border border-border">
            {data.distribution.map((d) => {
              const pct = data.audit_count ? (d.count / data.audit_count) * 100 : 0
              const colors: Record<string, string> = {
                '0-3': 'bg-signal-fail',
                '4-5': 'bg-accent/70',
                '6-7': 'bg-accent/40',
                '8-10': 'bg-accent',
              }
              return (
                <div
                  key={d.bucket}
                  className={`flex items-center justify-center text-xs font-semibold text-bg ${colors[d.bucket] ?? 'bg-fg-muted'}`}
                  style={{ width: `${pct}%` }}
                  title={`${d.bucket}/10: ${d.count} audits`}
                >
                  {pct >= 8 ? d.bucket : ''}
                </div>
              )
            })}
          </div>
          <div className="mt-2 flex flex-wrap gap-4 text-xs text-fg-muted">
            {data.distribution.map((d) => (
              <span key={d.bucket}>
                <span className="mr-1 inline-block h-2 w-2 rounded-full bg-accent/60 align-middle" />
                {d.bucket}/10: {d.count} audits
              </span>
            ))}
          </div>
        </div>

        {/* Component failure rates */}
        <div>
          <h2 className="mb-2 text-xl font-bold tracking-tight text-fg">
            Component failure rates
          </h2>
          <p className="mb-6 max-w-2xl text-sm text-fg-muted">
            Share of audited pages where each component failed its pass standard. A component that
            fails on 100% of pages is where most paid traffic leaks first.
          </p>
          <div className="space-y-3">
            {data.components.map((c) => (
              <div
                key={c.label}
                className="rounded-xl border border-border bg-bg-muted/10 p-4"
              >
                <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-fg">{c.label}</p>
                    <p className="text-xs text-fg-muted">
                      {SIGNAL_DESCRIPTIONS[c.label] ?? 'Conversion component'}
                    </p>
                  </div>
                  <p className="text-xs font-mono text-fg-muted">avg impact{' '}
                    {c.avg_impact.toFixed(1)}/10
                  </p>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-bg-muted">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{ width: `${(c.failures / maxFailures) * 100}%` }}
                  />
                </div>
                <p className="mt-3 text-xs leading-5 text-fg-muted/80">
                  <span className="font-semibold text-fg">Pass:</span>{' '}
                  {PASS_STANDARDS[c.label] ?? 'See audit evidence standard.'}
                </p>
                <p className="mt-1 text-sm font-semibold text-accent">
                  {c.failures} of {data.audit_count} pages failed this standard
                </p>
              </div>
            ))}
          </div>
        </div>

        <p className="border-t border-border pt-6 text-xs text-fg-muted">
          Benchmarks are computed from completed audits only. No page URLs, emails, or personal
          data are shown. Sample size grows with every audit and teardown.
        </p>
      </div>
    </section>
  )
}
