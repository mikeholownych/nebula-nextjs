'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import type { AccessLevel } from './planGate'
import { SUBSCRIPTION_PLANS } from '@/app/lib/subscription-plans'
import { signalLabel } from './signalLabels'

interface FunnelRun {
  id: string
  domain: string
  status: 'discovering' | 'running' | 'complete' | 'complete_partial' | 'failed' | string
  requested_count: number | null
  discovered_count: number | null
  plan: string | null
  scorecard: FunnelScorecard | null
  coverage_pct: number | null
  created_at: string | null
  completed_at: string | null
}

interface FunnelScorecard {
  domain_avg?: number | null
  signal_pass_rates?: Record<string, number>
  worst_pages?: { url: string; score: number }[]
  recurring_quick_wins?: { finding_key: string; count: number }[]
  error?: string
}

interface FunnelPage {
  url: string
  status: string
  score: number | null
}

interface FunnelViewProps {
  domains: string[]
  initialDomain?: string
  planLevel: AccessLevel
}

const TERMINAL_STATUSES = new Set(['complete', 'complete_partial', 'failed'])

function fmtScore(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1)
}

export default function FunnelView({ domains, initialDomain, planLevel }: FunnelViewProps) {
  const [domain, setDomain] = useState(initialDomain ?? domains[0] ?? '')
  const [inputValue, setInputValue] = useState(initialDomain ?? domains[0] ?? '')
  const [status, setStatus] = useState<{ run: FunnelRun; pages: FunnelPage[] } | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [loadingStatus, setLoadingStatus] = useState(false)
  const [launching, setLaunching] = useState(false)
  const [denial, setDenial] = useState<string | null>(null)
  const [teaserUsed, setTeaserUsed] = useState(false)

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current)
      pollRef.current = null
    }
  }, [])

  const loadStatus = useCallback(async (d: string): Promise<{ run?: FunnelRun }> => {
    if (!d) return {}
    setLoadingStatus(true)
    try {
      const res = await fetch(`/api/funnel/runs/status?domain=${encodeURIComponent(d)}`, { cache: 'no-store' })
      if (res.status === 404) {
        setStatus(null)
        setNotFound(true)
        return {}
      }
      if (!res.ok) {
        setStatus(null)
        setNotFound(false)
        return {}
      }
      const data = await res.json()
      setStatus(data?.run ? { run: data.run, pages: data.pages ?? [] } : null)
      setNotFound(!data?.run)
      return { run: data?.run }
    } catch {
      return {}
    } finally {
      setLoadingStatus(false)
    }
  }, [])

  // Initial + domain-change load; start polling when a run is in flight.
  useEffect(() => {
    stopPolling()
    let cancelled = false
    ;(async () => {
      const { run } = await loadStatus(domain)
      if (cancelled) return
      if (run && !TERMINAL_STATUSES.has(run.status)) {
        stopPolling()
        pollRef.current = setInterval(async () => {
          const { run: next } = await loadStatus(domain)
          if (!cancelled && next && TERMINAL_STATUSES.has(next.status)) stopPolling()
        }, 5000)
      }
    })()
    return () => {
      cancelled = true
      stopPolling()
    }
  }, [domain, loadStatus, stopPolling])

  useEffect(() => () => stopPolling(), [stopPolling])

  const launch = async (e: React.FormEvent) => {
    e.preventDefault()
    const d = inputValue.trim().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '')
    if (!d || d.length < 4) {
      setDenial('Enter a valid domain like example.com')
      return
    }
    setLaunching(true)
    setDenial(null)
    try {
      const res = await fetch('/api/funnel/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: d }),
      })
      if (res.ok) {
        setDomain(d)
        const { run } = await loadStatus(d)
        if (run && !TERMINAL_STATUSES.has(run.status)) {
          stopPolling()
          pollRef.current = setInterval(async () => {
            const { run: next } = await loadStatus(d)
            if (next && TERMINAL_STATUSES.has(next.status)) stopPolling()
          }, 5000)
        }
        return
      }
      const body = await res.json().catch(() => ({}))
      if (res.status === 403 && body?.detail?.upgrade_url) {
        setTeaserUsed(true)
        setDenial(body.detail.message ?? 'Your free teaser funnel has already been used')
      } else if (res.status === 429 && body?.detail?.message) {
        setDenial(body.detail.limit != null ? `${body.detail.message} (${body.detail.limit}/month)` : body.detail.message)
      } else if (res.status === 409) {
        setDenial(body?.detail?.message ?? 'A run is already active for this domain')
        setDomain(d)
        await loadStatus(d)
      } else {
        setDenial(body?.detail ?? body?.error ?? 'Could not start the funnel run.')
      }
    } catch {
      setDenial('Network error starting the run.')
    } finally {
      setLaunching(false)
    }
  }

  const run = status?.run
  const scorecard = run?.scorecard
  const isFree = planLevel === 'free'
  const planAllowance = SUBSCRIPTION_PLANS[planLevel]?.funnelRunsPerMonth ?? null

  // Teaser consumed marker: their latest run snapshot says teaser, or the
  // launcher just returned the upgrade-shaped denial.
  useEffect(() => {
    if (run?.plan === 'teaser') setTeaserUsed(true)
  }, [run?.plan])

  const renderLockedUpsell = (
    <div className="flex min-h-[30vh] flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-md border border-border bg-bg-elevated">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" className="text-fg-muted"/>
          <path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-fg-muted"/>
          <circle cx="12" cy="16" r="1.5" fill="currentColor" className="text-fg-muted"/>
        </svg>
      </div>
      <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-accent">Pro feature</p>
      <h2 className="mb-2 text-xl font-extrabold text-fg">Your free funnel teaser has been used</h2>
      <p className="mb-6 max-w-sm text-sm leading-relaxed text-fg-muted">
        You scanned your whole funnel once on the Free plan. Upgrade to Pro ($29/mo) to run up to 3 full-funnel scans every month and watch your domain average climb.
      </p>
      <div className="flex flex-col items-center gap-3 sm:flex-row">
        <Link href="/pricing" className="rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-bg transition-colors hover:opacity-85">
          See plans →
        </Link>
        <Link href="/workspace?tab=billing" className="rounded-lg border border-border px-6 py-3 text-sm font-semibold text-fg-muted transition-colors hover:border-accent hover:text-fg">
          View billing
        </Link>
      </div>
    </div>
  )

  return (
    <div className="space-y-8">
      {/* Launcher */}
      <div className="rounded-xl border border-border bg-bg-panel p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-xl">
            <h3 className="text-base font-bold text-fg">Full-Funnel Scan</h3>
            <p className="mt-1 text-sm text-fg-muted">
              We read your sitemap and audit every page we can reach, then aggregate a domain-wide scorecard: average score, per-signal pass rates, and your weakest pages.
            </p>
          </div>
          {!isFree && (
            <span className="rounded-full border border-accent/30 bg-accent/10 px-3 py-1 font-mono text-[11px] font-semibold text-accent">
              {planAllowance === null ? 'Unlimited runs/mo' : `${planAllowance} runs/mo on ${SUBSCRIPTION_PLANS[planLevel].name}`}
            </span>
          )}
        </div>
        <form onSubmit={launch} className="mt-4 flex flex-wrap gap-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="yourdomain.com"
            aria-label="Domain to scan"
            className="min-w-[220px] flex-1 rounded-lg border border-border bg-bg px-4 py-2.5 text-sm text-fg placeholder:text-fg-dim focus:border-accent focus:outline-none"
          />
          <button
            type="submit"
            disabled={launching}
            className="rounded-lg bg-accent px-5 py-2.5 text-xs font-bold text-bg hover:opacity-85 disabled:opacity-50"
          >
            {launching ? 'Starting…' : 'Run Funnel Scan →'}
          </button>
        </form>
        {domains.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-fg-dim">From your projects:</span>
            {domains.slice(0, 6).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => { setInputValue(d); }}
                className={`rounded-full border px-2.5 py-0.5 font-mono text-[11px] transition-colors ${d === inputValue ? 'border-accent/50 bg-accent/10 text-accent' : 'border-border text-fg-muted hover:border-accent/40 hover:text-fg'}`}
              >
                {d}
              </button>
            ))}
          </div>
        )}
        {denial && (
          <div className="mt-3 rounded-lg border border-danger/40 bg-danger-dim p-3 text-xs text-danger">{denial}</div>
        )}
      </div>

      {/* Free tier: teaser banner before use, upsell after */}
      {isFree && !teaserUsed && (
        <div className="rounded-xl border border-accent/30 bg-accent/[0.06] p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">Free teaser</p>
          <p className="mt-1.5 text-sm text-fg">
            One free funnel scan, up to 3 pages, on us. See your domain average before deciding anything.
          </p>
        </div>
      )}

      {isFree && teaserUsed && renderLockedUpsell}

      {/* Status area */}
      {!isFree && loadingStatus && !run && <p className="px-1 text-sm text-fg-muted">Checking for existing runs…</p>}

      {!isFree && notFound && (
        <div className="rounded-xl border border-border bg-bg-panel p-10 text-center">
          <h3 className="text-base font-bold text-fg">No funnel run yet for {domain || 'this domain'}</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-fg-muted">Enter a domain above and launch your first full-funnel scan. It discovers pages from your sitemap and audits them one by one.</p>
        </div>
      )}

      {run && (
        <div className="space-y-6">
          {/* Run header */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-bg-panel p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-fg-dim">Domain average</p>
              {scorecard?.domain_avg != null ? (
                <>
                  <p className="mt-2 font-mono text-4xl font-black text-accent">{fmtScore(scorecard.domain_avg)}</p>
                  <p className="mt-1 text-xs text-fg-muted">across scored pages, 0 to 100</p>
                </>
              ) : (
                <p className="mt-2 text-sm text-fg-muted">{TERMINAL_STATUSES.has(run.status) ? 'No scored pages' : 'Scoring in progress…'}</p>
              )}
            </div>
            <div className="rounded-xl border border-border bg-bg-panel p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-fg-dim">Pages</p>
              <p className="mt-2 font-mono text-4xl font-black text-fg">{run.discovered_count ?? status!.pages.length}<span className="text-lg text-fg-muted"> pages</span></p>
              <p className="mt-1 text-xs text-fg-muted">{run.coverage_pct != null ? `${Math.round(run.coverage_pct)}% coverage` : 'coverage pending'}</p>
            </div>
            <div className="rounded-xl border border-border bg-bg-panel p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-fg-dim">Run status</p>
              <p className={`mt-2 font-mono text-lg font-black ${run.status === 'failed' ? 'text-red-400' : 'text-fg'}`}>
                {run.status.replace('_', ' ')}
              </p>
              {!TERMINAL_STATUSES.has(run.status) && (
                <p className="mt-1 flex items-center gap-1.5 text-xs text-fg-muted">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" /> auditing pages…
                </p>
              )}
            </div>
          </div>

          {/* Coverage note for partial completion */}
          {run.status === 'complete_partial' && (
            <div className="rounded-lg border border-border bg-bg-elevated p-4 text-xs leading-relaxed text-fg-muted">
              Some pages failed during this run. Scores and averages cover the pages that completed only, so treat the numbers as partial coverage rather than a full verdict.
            </div>
          )}

          {/* Discovery failure */}
          {scorecard?.error && (
            <div className="rounded-lg border border-danger/40 bg-danger-dim p-4 text-xs text-danger">{scorecard.error}</div>
          )}

          {/* Signal pass rates */}
          {scorecard?.signal_pass_rates && Object.keys(scorecard.signal_pass_rates).length > 0 && (
            <section className="rounded-xl border border-border bg-bg-panel p-6">
              <h3 className="mb-4 text-base font-bold text-fg">Signal pass rates</h3>
              <ul className="space-y-3">
                {Object.entries(scorecard.signal_pass_rates).map(([key, rate]) => (
                  <li key={key}>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-medium text-fg">{signalLabel(key)}</span>
                      <span className="font-mono text-fg-muted">{Math.round(rate * 100)}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-bg-elevated">
                      <div className={`h-full rounded-full ${rate >= 0.5 ? 'bg-accent' : 'bg-red-400'}`} style={{ width: `${Math.max(2, Math.round(rate * 100))}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Worst pages */}
            {scorecard?.worst_pages && scorecard.worst_pages.length > 0 && (
              <section className="rounded-xl border border-border bg-bg-panel p-6">
                <h3 className="mb-3 text-base font-bold text-fg">Weakest pages</h3>
                <ol className="space-y-2">
                  {scorecard.worst_pages.map((p) => (
                    <li key={p.url} className="flex items-center justify-between rounded-lg bg-bg px-3.5 py-2.5">
                      <span className="truncate text-xs text-fg" title={p.url}>{p.url.replace(/^https?:\/\/(www\.)?/, '')}</span>
                      <span className="ml-3 shrink-0 font-mono text-sm font-bold text-red-400">{fmtScore(p.score)}</span>
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {/* Recurring quick wins */}
            {scorecard?.recurring_quick_wins && scorecard.recurring_quick_wins.length > 0 && (
              <section className="rounded-xl border border-border bg-bg-panel p-6">
                <h3 className="mb-3 text-base font-bold text-fg">Recurring quick wins</h3>
                <p className="mb-3 text-xs text-fg-muted">Findings that showed up as quick fixes on more than one page.</p>
                <ul className="space-y-2">
                  {scorecard.recurring_quick_wins.map((q) => (
                    <li key={q.finding_key} className="flex items-center justify-between rounded-lg bg-bg px-3.5 py-2.5">
                      <span className="truncate text-xs font-medium text-fg">{signalLabel(q.finding_key)}</span>
                      <span className="ml-3 shrink-0 rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 font-mono text-[10px] font-bold text-accent">{q.count} pages</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          {/* Pages detail */}
          {status!.pages.length > 0 && (
            <section className="overflow-x-auto rounded-xl border border-border bg-bg-panel">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-bg-elevated/60 text-xs font-semibold uppercase tracking-wider text-fg-dim">
                  <tr>
                    <th className="py-3 px-4">Page</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {status!.pages.map((p) => (
                    <tr key={p.url}>
                      <td className="py-2.5 px-4 max-w-[280px] truncate text-xs text-fg" title={p.url}>{p.url.replace(/^https?:\/\/(www\.)?/, '')}</td>
                      <td className="py-2.5 px-4 text-xs text-fg-muted">{p.status}</td>
                      <td className="py-2.5 px-4 text-right font-mono text-xs font-bold text-fg">{p.score != null ? fmtScore(p.score) : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
