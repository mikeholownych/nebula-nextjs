'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

interface ProgramStep {
  id: string
  seq: number
  stage: 1 | 2
  finding_key: string
  url: string
  title: string
  impact: number | null
  effort: number | null
  quadrant: string | null
  status: 'pending' | 'active' | 'done' | 'verified' | 'dismissed' | string
}

interface ProgramPayload {
  program?: { id?: string; domain?: string; generated_at?: string | null }
  steps?: ProgramStep[]
}

interface ProgramViewProps {
  domains: string[]
  initialDomain?: string
}

const STAGE_META: Record<1 | 2, { chip: string; blurb: string }> = {
  1: { chip: 'Quick Wins', blurb: 'High impact, low effort. Clear these first.' },
  2: { chip: 'Major Projects', blurb: 'Bigger lifts, ordered by payoff per hour invested.' },
}

function isDone(status: string): boolean {
  return status === 'done' || status === 'verified'
}

export default function ProgramView({ domains, initialDomain }: ProgramViewProps) {
  const [domain, setDomain] = useState(initialDomain ?? domains[0] ?? '')
  const [data, setData] = useState<ProgramPayload | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [denial, setDenial] = useState<{ message?: string; upgrade_url?: string } | null>(null)
  const [dismissing, setDismissing] = useState<string | null>(null)

  const load = useCallback(async (d: string) => {
    if (!d) return
    setLoading(true)
    setError(null)
    setDenial(null)
    try {
      const res = await fetch(`/api/analytics/program?domain=${encodeURIComponent(d)}`, { cache: 'no-store' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        if (res.status === 403 && body?.detail?.message) {
          setDenial(body.detail)
        } else {
          setError(body?.detail || body?.error || 'Could not load your roadmap.')
        }
        setData(null)
        return
      }
      setData(await res.json())
    } catch {
      setError('Network error loading the roadmap.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load(domain)
  }, [domain, load])

  const dismiss = async (stepId: string) => {
    setDismissing(stepId)
    try {
      const res = await fetch('/api/analytics/program/dismiss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stepId }),
      })
      if (res.ok) {
        // Local update keeps the roadmap snappy; next load reconciles.
        setData((prev) =>
          prev
            ? { ...prev, steps: prev.steps?.map((s) => (s.id === stepId ? { ...s, status: 'dismissed' } : s)) }
            : prev
        )
      }
    } finally {
      setDismissing(null)
    }
  }

  const steps = useMemo(() => data?.steps ?? [], [data])
  const active = useMemo(() => steps.filter((s) => !isDone(s.status) && s.status !== 'dismissed'), [steps])
  const completedCount = useMemo(() => steps.filter((s) => isDone(s.status)).length, [steps])
  const progressPct = useMemo(() => {
    const denominator = completedCount + active.length
    return denominator > 0 ? Math.round((completedCount / denominator) * 100) : 0
  }, [completedCount, active])

  const stage1 = active.filter((s) => s.stage === 1)
  const stage2 = active.filter((s) => s.stage === 2)

  return (
    <div className="space-y-8">
      {/* Domain picker */}
      <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-bg-panel p-5">
        <div className="min-w-[220px] flex-1">
          <label htmlFor="program-domain" className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-fg-dim">
            Domain
          </label>
          <select
            id="program-domain"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg focus:border-accent focus:outline-none"
          >
            {(domains.length > 0 ? domains : [domain]).map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold uppercase tracking-wider text-fg-dim">Roadmap progress</p>
          <p className="mt-1 font-mono text-2xl font-bold text-accent">{progressPct}%</p>
          <p className="text-[11px] text-fg-muted">{completedCount} of {completedCount + active.length} steps complete</p>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-bg-elevated sm:w-auto sm:min-w-[220px] sm:flex-1" role="progressbar" aria-valuenow={progressPct} aria-valuemin={0} aria-valuemax={100} aria-label="Roadmap progress">
          <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${progressPct}%` }} />
        </div>
      </div>

      {loading && <p className="px-1 text-sm text-fg-muted">Loading your roadmap…</p>}

      {error && (
        <div className="rounded-lg border border-danger/40 bg-danger-dim p-4 text-sm text-danger">{error}</div>
      )}

      {denial && (
        <div className="rounded-xl border border-border bg-bg-panel p-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">Pro feature</p>
          <p className="mt-2 text-sm text-fg-muted">{denial.message ?? 'Remediation programs are a paid feature.'}</p>
          <Link href={denial.upgrade_url ?? '/pricing'} className="mt-4 inline-block rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-bg hover:opacity-85">
            See plans →
          </Link>
        </div>
      )}

      {!loading && !error && !denial && steps.length === 0 && (
        <div className="rounded-xl border border-border bg-bg-panel p-10 text-center">
          <h3 className="text-base font-bold text-fg">Nothing to fix right now</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-fg-muted">
            Every open finding for this domain is either resolved or dismissed. Run a fresh audit after your changes land and this roadmap rebuilds from whatever the new audit finds.
          </p>
          <Link href={`/audit?url=https://${encodeURIComponent(domain)}`} className="mt-5 inline-block rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-bg hover:opacity-85">
            Re-audit {domain || 'your domain'} →
          </Link>
        </div>
      )}

      {([1, 2] as const).map((stage) => {
        const stageSteps = stage === 1 ? stage1 : stage2
        if (stageSteps.length === 0 && steps.length > 0) return null
        return (
          <section key={stage}>
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className={`rounded-md border px-2.5 py-1 font-mono text-[11px] font-bold ${stage === 1 ? 'border-accent/40 bg-accent/15 text-accent' : 'border-border bg-bg-elevated text-fg-muted'}`}>
                  Stage {stage}
                </span>
                <h3 className="text-base font-bold text-fg">{STAGE_META[stage].chip}</h3>
              </div>
              <span className="font-mono text-[11px] text-fg-muted">{stageSteps.length} open</span>
            </div>
            <p className="mb-3 text-xs text-fg-dim">{STAGE_META[stage].blurb}</p>
            {stageSteps.length === 0 ? (
              <p className="rounded-lg border border-border bg-bg-panel px-4 py-3 text-xs text-fg-muted">All clear in this stage.</p>
            ) : (
              <ol className="space-y-2.5">
                {stageSteps.map((s) => (
                  <li key={s.id} className="rounded-xl border border-border bg-bg-panel p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-[11px] font-bold text-fg-muted">#{s.seq}</span>
                          <p className="truncate text-sm font-semibold text-fg">{s.title}</p>
                          {s.quadrant === 'quick_win' && (
                            <span className="rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent">Quick Win</span>
                          )}
                          {s.status === 'verified' && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent">
                              <svg width="9" height="9" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M2 6.5L4.5 9L10 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                              Verified
                            </span>
                          )}
                        </div>
                        <p className="mt-1 truncate text-xs text-fg-muted" title={s.url}>{s.url}</p>
                        <div className="mt-1.5 flex gap-3 font-mono text-[10px] text-fg-dim">
                          <span>impact {s.impact != null ? s.impact.toFixed(2) : '-'}</span>
                          <span>effort {s.effort != null ? s.effort.toFixed(2) : '-'}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => dismiss(s.id)}
                        disabled={dismissing === s.id}
                        className="shrink-0 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-fg-muted transition-colors hover:border-danger hover:text-danger disabled:opacity-50"
                      >
                        {dismissing === s.id ? 'Dismissing…' : 'Dismiss'}
                      </button>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </section>
        )
      })}
    </div>
  )
}
