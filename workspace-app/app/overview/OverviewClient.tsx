'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'

interface AttentionItem {
  public_id: string
  domain: string
  signal_key: string
  label: string | null
  status: string
  impact: number | null
  effort: number | null
  last_seen_at: string
}
interface ActivityItem {
  event_type: string
  old_status: string | null
  new_status: string | null
  actor_email: string | null
  occurred_at: string
  public_id: string
  label: string | null
  domain: string
}

interface Overview {
  properties: number
  countsByStatus: Record<string, number>
  requiresAttention: AttentionItem[]
  recentActivity: ActivityItem[]
}

const OPEN_STATUSES = ['new', 'acknowledged', 'in_progress'] as const

export default function OverviewClient() {
  const [data, setData] = useState<Overview | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/overview', { cache: 'no-store' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `HTTP ${res.status}`)
      }
      setData(await res.json())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  if (error) {
    const sessionGone = /401|Authentication/i.test(error)
    if (sessionGone) {
      // Session expired or revoked: send to login instead of a dead-end error box.
      window.location.href = '/login?error=session_expired'
      return null
    }
    return (
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div role="alert" className="rounded-md border border-signal-fail/40 bg-bg-elevated px-4 py-3 text-sm text-fg">
          {error}
          <button onClick={load} className="ml-3 underline underline-offset-2 hover:text-accent">Retry</button>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-6xl space-y-3 px-4 py-8 sm:px-6" role="status" aria-label="Loading overview">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-md bg-bg-panel" />
        ))}
      </div>
    )
  }

  const open =
    OPEN_STATUSES.reduce((n, s) => n + (data.countsByStatus[s] ?? 0), 0)
  const regressed = data.countsByStatus['regressed'] ?? 0
  const resolved =
    (data.countsByStatus['resolved'] ?? 0) + (data.countsByStatus['accepted_risk'] ?? 0)

  return (
    <div>
      {/* Legacy header pattern: eyebrow + h1 left, counters + accent CTA right */}
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-fg-muted">
            Executive Overview
          </p>
          <h1 className="text-xl font-semibold tracking-tight text-fg">Site Health &amp; Conversion Diagnosis</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-border bg-bg-surface px-3 py-1 font-mono text-xs text-fg-muted">
            <span>Findings:</span>
            <span className="font-bold text-accent">{open}</span>
          </div>
          <a
            href="https://nebulacomponents.com/audit?utm_source=workspace-top&utm_medium=internal"
            className="rounded-lg bg-accent px-4 py-2 font-mono text-xs font-bold text-bg hover:opacity-90 transition-opacity"
          >
            + Audit URL
          </a>
        </div>
      </header>

      <div className="space-y-6">
        {/* Metric strip - legacy MetricCard anatomy */}
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Properties" value={String(data.properties)} detail="domains in your workspace" tone="dark" />
          <MetricCard label="Open findings" value={String(open)} detail="new, acknowledged, in progress" tone={open > 0 ? 'red' : 'dark'} />
          <MetricCard label="Regressed" value={String(regressed)} detail="fixed issues that broke again" tone={regressed > 0 ? 'red' : 'dark'} />
          <MetricCard label="Settled" value={String(resolved)} detail="resolved or accepted risk" tone="dark" />
        </div>

        {/* Required actions */}
        <section aria-labelledby="attention-heading">
          <div className="mb-3 flex items-baseline justify-between">
            <h2 id="attention-heading" className="text-lg font-semibold tracking-[-0.02em] text-fg">Required actions</h2>
            <Link href="/findings?status=new" className="font-mono text-xs text-fg-muted underline-offset-2 hover:text-accent hover:underline">
              All findings →
            </Link>
          </div>
          {data.requiresAttention.length === 0 ? (
            <p className="rounded-md border border-border bg-bg-elevated px-4 py-5 text-sm text-fg-muted shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
              Nothing waiting. New audit results land here.
            </p>
          ) : (
            <ul className="space-y-2">
              {data.requiresAttention.map((f) => (
                <li key={f.public_id}>
                  <Link
                    href={`/findings?public_id=${f.public_id}`}
                    className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border border-border bg-bg-elevated px-4 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-colors hover:border-accent/50"
                  >
                    <span
                      className={`inline-flex items-center rounded px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide ${
                        f.status === 'regressed'
                          ? 'bg-[#fbe8e7] text-[#a43a35]'
                          : 'bg-accent/15 text-accent'
                      }`}
                    >
                      {f.status}
                    </span>
                    <span className="text-sm font-medium text-fg">{f.label ?? f.signal_key}</span>
                    <span className="font-mono text-xs text-fg-muted">{f.domain}</span>
                    <span className="ml-auto font-mono text-xs text-fg-dim">impact {f.impact ?? '-'}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Recent movement */}
        <section aria-labelledby="activity-heading" className="rounded-md border border-border bg-bg-elevated p-6 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-fg-dim">Recent activity</p>
          {data.recentActivity.length === 0 ? (
            <p className="mt-3 text-sm leading-6 text-fg-muted">
              No workspace changes yet. Transitions you make on findings show up here with who made them and when.
            </p>
          ) : (
            <ul className="mt-4 space-y-1.5">
              {data.recentActivity.map((a, i) => (
                <li key={`${a.public_id}-${a.occurred_at}-${i}`} className="flex flex-wrap items-center gap-x-2 py-1 font-mono text-xs text-fg-muted">
                  <span className="text-fg-dim">{new Date(a.occurred_at).toLocaleString()}</span>
                  <span className="text-fg">{a.actor_email ?? 'system'}</span>
                  <span>
                    moved{' '}
                    <Link href={`/findings?public_id=${a.public_id}`} className="underline underline-offset-2 hover:text-accent">
                      {a.label ?? a.public_id}
                    </Link>{' '}
                    {a.old_status ? `from ${a.old_status} ` : ''}to {a.new_status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}

function MetricCard({ label, value, detail, tone }: { label: string; value: string; detail: string; tone?: 'dark' | 'red' }) {
  return (
    <section className="rounded-md border border-border bg-bg-elevated p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <p className="text-xs font-semibold uppercase tracking-[0.13em] text-fg-dim">{label}</p>
      <p className={`mt-4 text-3xl font-semibold tracking-[-0.04em] ${tone === 'red' ? 'text-[#b33d38]' : 'text-fg'}`}>{value}</p>
      <p className="mt-2 truncate text-xs text-[#888881]">{detail}</p>
    </section>
  )
}
