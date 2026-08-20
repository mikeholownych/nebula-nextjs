'use client'

import { useEffect, useState } from 'react'

export type BenchmarksData = {
  audit_count: number
  avg_score: number | null
  highest: number | null
  lowest: number | null
  avg_failures_per_page: number | null
  top_leak: { label: string; failures: number; avg_impact: number; share: number } | null
  generated_at: string | null
  components: ComponentStat[]
  distribution: { bucket: string; count: number }[]
}

type ComponentStat = {
  label: string
  failures: number
  avg_impact: number
  share: number
}

const SIGNAL_DESCRIPTIONS: Record<string, string> = {
   'Seo Foundations': 'Title tag, meta description, and single descriptive H1 present',
   Cta: 'One clear primary action with action + outcome copy',
   'Load Speed': 'LCP under 2.5s, CLS under 0.1, INP under 200ms on mobile',
   'Social Proof': 'Named testimonial, review count, or customer logo visible near primary CTA',
   'Ai Readiness': 'JSON-LD, OG tags, and clean DOM hierarchy present for AI citation',
   Headline: 'Ad headline matches page headline and names the buyer outcome',
   Mobile: 'Primary CTA visible and usable on 375px viewport without zoom',
   'Above Fold': 'Primary CTA, ICP-specific headline, and trust signal all visible above fold',
   'Ad Tracking': 'Facebook Pixel, GA4 ID, or UTM-bearing link present in static HTML',
 }

// Pass standards mirror the audit engine's own pass/fail logic
// (deliver_audit.py dimension scoring), so the published statistic
// can always be checked against the actual check that produced it.
const PASS_STANDARDS: Record<string, string> = {
  'Seo Foundations': 'Title tag, meta description, and a single descriptive H1 all present.',
  Cta: 'One primary action with action + outcome copy, visible in the initial viewport.',
  'Load Speed': 'LCP under 2.5s, CLS under 0.1, INP under 200ms on mobile.',
  'Social Proof':
    'Proof near the first CTA: sample output, customer quote, metric, guarantee, or process evidence.',
  'Ai Readiness':
    'Structured signals that make the page citable and understandable to AI systems (JSON-LD, OG tags, clean hierarchy).',
  Headline: 'H1 is 12–90 characters and names the buyer outcome, not a generic claim.',
  Mobile: 'Primary action visible and usable on a 375px viewport.',
}

const VERIFIED_COMPONENT_LABELS = new Set([
   'Seo Foundations',
   'Cta',
   'Load Speed',
   'Social Proof',
   'Ai Readiness',
   'Headline',
   'Mobile',
   'Above Fold',
   'Ad Tracking',
 ])

const fmtDate = (iso: string | null): string | null => {
  if (!iso) return null
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function Benchmarks({ initialData }: { initialData?: BenchmarksData | null }) {
  const [data, setData] = useState<BenchmarksData | null>(initialData ?? null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (data) return
    fetch('/api/audit/stats/benchmarks')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load'))
  }, [data])

  if (error) {
    return (
      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm text-signal-fail">Leak Index unavailable right now ({error}).</p>
        </div>
      </section>
    )
  }

  if (!data) {
    return (
      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl space-y-12 animate-pulse min-h-[600px]">
          <div className="h-12 w-full rounded border border-border/30 bg-bg-muted/10" />
          <div className="h-44 w-full rounded-2xl border border-border/30 bg-bg-muted/20" />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="h-24 rounded-xl border border-border/30 bg-bg-muted/10" />
            <div className="h-24 rounded-xl border border-border/30 bg-bg-muted/10" />
          </div>
          <div className="h-72 w-full rounded-xl border border-border/30 bg-bg-muted/10" />
        </div>
      </section>
    )
  }

  if (data.audit_count === 0) {
    return (
      <section className="px-6 py-16">
        <div className="mx-auto max-w-6xl rounded-md border border-border bg-bg-muted/10 p-8">
          <h2 className="text-xl font-bold text-fg">No verified audit data yet</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-fg-muted">
            The Leak Index appears after completed audits are added to the published evidence
            dataset. We will not substitute sample averages or placeholder charts.
          </p>
          <a href="/audit?utm_source=content&utm_medium=organic-content" className="mt-5 inline-flex rounded bg-accent px-5 py-3 text-sm font-semibold text-bg">
            Run the first audit →
          </a>
        </div>
      </section>
    )
  }

  const verifiedComponents = data.components.filter((c) => VERIFIED_COMPONENT_LABELS.has(c.label))
  const maxFailures = Math.max(1, ...verifiedComponents.map((c) => c.failures))
  const updated = fmtDate(data.generated_at)

  return (
    <section className="px-6 py-16">
      <div className="mx-auto max-w-6xl space-y-12">
        <p className="rounded border border-accent/20 bg-accent/5 px-5 py-3 text-sm leading-6 text-fg-muted">
          Verified sample only: this page publishes rates from the current nine-signal registry.
          Deprecated source-only checks are omitted until rendered verification is available.
        </p>

        {/* The citable stat */}
        <div className="rounded-2xl border border-accent/30 bg-accent/5 p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent">
            The headline leak
          </p>
          <p className="mt-3 text-2xl font-bold leading-tight tracking-tight text-fg md:text-4xl">
            The average landing page leaks{' '}
            <span className="text-accent">
              {data.avg_failures_per_page !== null && data.avg_failures_per_page !== undefined
                ? data.avg_failures_per_page.toFixed(1)
                : '-'}{' '}
              recorded findings per page
            </span>
            .
          </p>
<p className="mt-3 max-w-2xl text-sm leading-6 text-fg-muted">
             {data.top_leak ? (
               <>
                 The most common leak: <span className="font-semibold text-fg">{data.top_leak.label}</span>,
                 failing on {data.top_leak.share}% of audited pages. Failure rate shows how frequently each condition appears across completed audits.
               </>
             ) : (
               'No single leak dominates the sample yet.'
             )}
           </p>
          {updated && (
            <p className="mt-4 text-xs text-fg-muted">
              Updated {updated} · {data.audit_count} completed audits
            </p>
          )}
        </div>

        {/* Headline stats */}
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { label: 'Audits in sample', value: data.audit_count, suffix: '' },
            {
              label: 'Top leak failure rate',
              value: data.top_leak ? `${data.top_leak.share}%` : '-',
              suffix: data.top_leak ? data.top_leak.label : '',
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

        {/* Distribution - unavailable while the composite includes deprecated checks. */}
        {data.distribution.length > 0 && <div>
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
        </div>}

        {/* Component failure rates - where paid traffic leaks first */}
        <div>
          <h2 className="mb-2 text-xl font-bold tracking-tight text-fg">
            Where audited pages most often fail
          </h2>
<p className="mb-6 max-w-2xl text-sm text-fg-muted">
             Failure rate describes prevalence in the audited sample. It does not establish that a failed condition caused conversion loss.
           </p>
          <div className="space-y-3">
            {verifiedComponents.map((c) => (
              <div key={c.label} className="rounded-xl border border-border bg-bg-muted/10 p-4">
                <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-fg">{c.label}</p>
                    <p className="text-xs text-fg-muted">
                      {SIGNAL_DESCRIPTIONS[c.label] ?? 'Conversion component'}
                    </p>
                  </div>
                  <p className="text-xs font-mono text-fg-muted">
                    avg priority {c.avg_impact.toFixed(1)}/10
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

        {/* Methodology */}
        <div className="rounded-md border border-border bg-bg-muted/10 p-8">
          <h2 className="text-xl font-bold tracking-tight text-fg">Methodology</h2>
          <div className="mt-4 grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold text-fg">How the data is collected</h3>
              <p className="mt-2 text-sm leading-6 text-fg-muted">
                Each completed audit fetches a public landing page, runs the documented conversion and
                applicable technical checks, and records a 0–10 score plus the findings produced. The
                Leak Index aggregates only audits marked <span className="font-semibold text-fg">completed</span> -
                no drafts, no estimates, no placeholder averages.
              </p>
              <p className="mt-3 text-sm leading-6 text-fg-muted">
                Pass standards are published on this page so every statistic can be checked against
                the exact check that produced it. A signal is reported as failed only when the
                fetched evidence does not meet the standard.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-fg">Privacy</h3>
              <p className="mt-2 text-sm leading-6 text-fg-muted">
                No page URLs, emails, or personal data are shown. Only aggregate failure rates,
                average priority scores across verified documented checks are published.
              </p>
              <h3 className="mt-5 text-sm font-semibold text-fg">Freshness</h3>
              <p className="mt-2 text-sm leading-6 text-fg-muted">
                The index updates continuously as audits complete. The sample size grows with every
                audit and teardown. The JSON endpoint used by this page is{' '}
                <a href="/api/audit/stats/benchmarks" className="text-accent underline underline-offset-2">
                  /api/audit/stats/benchmarks
                </a>
                .
              </p>
            </div>
          </div>
          <div className="mt-6 border-t border-border pt-5 text-xs text-fg-muted">
            Benchmarks are computed from completed audits only. This is aggregate data, not
            individualized conversion advice - see the{' '}
            <a href="/audit?utm_source=content&utm_medium=organic-content" className="text-accent underline underline-offset-2">
              free audit
            </a>{' '}
            for a page-level diagnosis.
          </div>
        </div>

        <p className="border-t border-border pt-6 text-xs text-fg-muted">
          The Landing Page Leak Index is computed from completed audits only. No page URLs, emails,
          or personal data are shown. Sample size grows with every audit and teardown.
        </p>
      </div>
    </section>
  )
}
