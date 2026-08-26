'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'

export interface MonitorEvent {
  id: string
  auditId: string | null
  status: 'improved' | 'regressed' | 'no_change' | 'new_fail' | 'error'
  prevScore: number | null
  newScore: number | null
  summary: string
  createdAt: string | null
}

export interface Monitor {
  id: string
  url: string
  cadence: 'weekly' | 'monthly'
  active: boolean
  nextRunAt: string | null
  lastRunAt: string | null
  lastScore: number | null
  createdAt: string | null
  events: MonitorEvent[]
}

interface EngineDenialDetail {
  message?: string
  upgrade_url?: string
  limit?: number
}

const STATUS_META: Record<
  MonitorEvent['status'],
  { label: string; cls: string; arrow: string }
> = {
  improved: { label: 'Improved', cls: 'bg-accent-dim text-accent border-accent/30', arrow: '↑' },
  regressed: { label: 'Regressed', cls: 'bg-danger-dim text-danger border-danger/30', arrow: '↓' },
  new_fail: { label: 'New critical', cls: 'bg-danger-dim text-danger border-danger/30', arrow: '🚨' },
  no_change: { label: 'No change', cls: 'bg-bg-elevated text-fg-muted border-border', arrow: '→' },
  error: { label: 'Run failed', cls: 'bg-signal-fail/10 text-signal-fail border-signal-fail/30', arrow: '⚠' },
}

const fmtDate = (iso: string | null): string => {
  if (!iso) return '-'
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const fmtWhen = (iso: string | null): string => {
  if (!iso) return '-'
  const d = new Date(iso)
  const now = new Date()
  const diff = d.getTime() - now.getTime()
  const days = Math.round(diff / 86_400_000)
  if (days < 0) return `${-days}d overdue`
  if (days === 0) return 'today'
  if (days === 1) return 'tomorrow'
  return `in ${days}d`
}

export default function MonitoringView({ email: _email }: { email: string }) {
  const [monitors, setMonitors] = useState<Monitor[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [url, setUrl] = useState('')
  const [cadence, setCadence] = useState<'weekly' | 'monthly'>('weekly')
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [upgradeUrl, setUpgradeUrl] = useState<string | null>(null)
  const [actionBusyId, setActionBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/monitors-engine')
      if (res.status === 403) {
        const denial = await res.json().catch(() => ({})) as { detail?: EngineDenialDetail }
        setUpgradeUrl(denial.detail?.upgrade_url ?? '/pricing')
        setError(denial.detail?.message ?? 'Monitoring is a paid feature')
        return
      }
      if (!res.ok) throw new Error('Failed to load monitors')
      const data = await res.json()
      setMonitors(data.monitors || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const addMonitor = async () => {
    const trimmed = url.trim()
    if (!/^https?:\/\/[^\s]+$/.test(trimmed)) {
      setFormError('Enter a full URL starting with https://')
      return
    }
    setFormError(null)
    setBusy(true)
    try {
      const res = await fetch('/api/monitors-engine/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed, cadence }),
      })
      if (res.status === 403) {
        const denial = await res.json().catch(() => ({})) as { detail?: EngineDenialDetail }
        setUpgradeUrl(denial.detail?.upgrade_url ?? '/pricing')
        setFormError(denial.detail?.message ?? 'Monitoring is a paid feature')
        return
      }
      if (res.status === 429) {
        const denial = await res.json().catch(() => ({})) as { detail?: EngineDenialDetail }
        const limit = denial.detail?.limit
        setFormError(
          limit != null
            ? `Your plan includes ${limit} monitored page${limit === 1 ? '' : 's'}. Upgrade to watch more.`
            : denial.detail?.message ?? 'Plan limit reached'
        )
        return
      }
      if (res.status === 400) {
        const denial = await res.json().catch(() => ({})) as { detail?: EngineDenialDetail }
        setFormError(denial.detail?.message ?? 'Could not add monitor on your plan')
        return
      }
      if (!res.ok) throw new Error('Failed to add monitor')
      setUrl('')
      await load()
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  const setActive = async (m: Monitor, active: boolean) => {
    setActionBusyId(m.id)
    try {
      const res = await fetch(`/api/monitors-engine/${m.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active }),
      })
      if (res.status === 403 || res.status === 400) {
        const denial = await res.json().catch(() => ({})) as { detail?: EngineDenialDetail }
        if (res.status === 403) setUpgradeUrl(denial.detail?.upgrade_url ?? '/pricing')
        setFormError(denial.detail?.message ?? 'Monitoring is a paid feature')
      }
      await load()
    } finally {
      setActionBusyId(null)
    }
  }

  const setCadenceOf = async (m: Monitor, cad: 'weekly' | 'monthly') => {
    setActionBusyId(m.id)
    try {
      const res = await fetch(`/api/monitors-engine/${m.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cadence: cad }),
      })
      if (res.status === 403 || res.status === 400) {
        const denial = await res.json().catch(() => ({})) as { detail?: EngineDenialDetail }
        if (res.status === 403) setUpgradeUrl(denial.detail?.upgrade_url ?? '/pricing')
        setFormError(denial.detail?.message ?? 'Cadence not available on your plan')
      }
      await load()
    } finally {
      setActionBusyId(null)
    }
  }

  const remove = async (m: Monitor) => {
    if (!window.confirm(`Stop monitoring ${m.url}?`)) return
    setActionBusyId(m.id)
    try {
      await fetch(`/api/monitors-engine/${m.id}`, { method: 'DELETE' })
      await load()
    } finally {
      setActionBusyId(null)
    }
  }

  if (loading && !monitors) {
    return <div className="py-12 text-center text-fg-muted">Loading monitors…</div>
  }

  if (error && !monitors) {
    if (upgradeUrl) {
      return (
        <div className="flex min-h-[40vh] flex-col items-center justify-center px-6 py-16 text-center">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-md border border-border bg-bg-elevated">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" className="text-fg-muted"/>
              <path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-fg-muted"/>
              <circle cx="12" cy="16" r="1.5" fill="currentColor" className="text-fg-muted"/>
            </svg>
          </div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-accent">Paid feature</p>
          <h2 className="mb-2 text-xl font-extrabold text-fg">{error}</h2>
          <p className="mb-6 max-w-sm text-sm leading-relaxed text-fg-muted">
            Monitoring keeps watch on your live pages and alerts you when the score
            moves or a critical signal regresses.
          </p>
          <Link
            href={upgradeUrl}
            className="rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-bg transition-colors hover:opacity-85 hover:bg-accent"
          >
            See plans →
          </Link>
        </div>
      )
    }
    return (
      <div className="py-12 text-center">
        <p className="text-danger mb-4">{error}</p>
        <button onClick={load} className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-bg">
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Add monitor */}
      <section className="rounded-md border border-border bg-bg-elevated p-6">
        <h2 className="text-lg font-semibold mb-1">Watch a page</h2>
        <p className="text-sm text-fg-muted mb-4">
          Nebula re-runs the audit on your cadence and alerts you when the score moves or a
          critical signal regresses. First run happens immediately after you add it.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addMonitor()}
            placeholder="https://your-landing-page.com"
            className="flex-1 rounded-lg border border-border bg-bg-panel px-4 py-2.5 text-fg placeholder-fg-dim focus:border-accent focus:outline-none"
          />
          <select
            value={cadence}
            onChange={(e) => setCadence(e.target.value as 'weekly' | 'monthly')}
            className="rounded-lg border border-border bg-bg-panel px-4 py-2.5 text-fg focus:border-accent focus:outline-none"
          >
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
          <button
            onClick={addMonitor}
            disabled={busy}
            className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-bg hover:opacity-85 hover:bg-accent disabled:opacity-50"
          >
            {busy ? 'Adding…' : 'Add monitor'}
          </button>
        </div>
        {formError && <p className="mt-2 text-sm text-danger">{formError}</p>}
        {upgradeUrl && (
          <div className="mt-4 rounded-xl border border-border bg-bg-panel p-5 text-center">
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-accent">Upgrade</p>
            <p className="mb-4 max-w-md mx-auto text-sm leading-relaxed text-fg-muted">
              Page monitoring is available on paid plans. Upgrade to watch your live
              pages and get alerted when the score moves.
            </p>
            <Link
              href={upgradeUrl}
              className="inline-block rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-bg transition-colors hover:opacity-85 hover:bg-accent"
            >
              See plans →
            </Link>
          </div>
        )}
      </section>

      {/* Monitors */}
      {!monitors || monitors.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-border p-10 text-center">
          <p className="text-fg font-medium">No monitored pages yet</p>
          <p className="text-sm text-fg-dim mt-1">
            Add a URL above and Nebula will watch its conversion score over time - the same
            way Ahrefs watches rankings.
          </p>
        </section>
      ) : (
        monitors.map((m) => (
          <section
            key={m.id}
            className={`rounded-2xl border bg-bg-elevated p-6 ${m.active ? 'border-border' : 'border-border/40 opacity-60'}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold truncate">{m.url}</p>
                <p className="text-xs text-fg-dim mt-1">
                  {m.active ? (
                    <>
                      {m.cadence === 'weekly' ? 'Weekly' : 'Monthly'} · next run{' '}
                      {fmtWhen(m.nextRunAt)} · last run {fmtDate(m.lastRunAt)}
                    </>
                  ) : (
                    <>Paused · last run {fmtDate(m.lastRunAt)}</>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {m.lastScore != null && (
                  <span className="rounded-lg border border-border bg-bg-panel px-3 py-1 text-sm font-semibold">
                    {Math.round(m.lastScore)}/100
                  </span>
                )}
                <select
                  value={m.cadence}
                  disabled={actionBusyId === m.id || !m.active}
                  onChange={(e) => setCadenceOf(m, e.target.value as 'weekly' | 'monthly')}
                  className="rounded-lg border border-border bg-bg-panel px-2 py-1 text-xs text-fg-muted focus:outline-none disabled:opacity-50"
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
                <button
                  onClick={() => setActive(m, !m.active)}
                  disabled={actionBusyId === m.id}
                  className="rounded-lg border border-border bg-bg-panel px-3 py-1 text-xs font-medium text-fg-muted hover:bg-bg-elevated disabled:opacity-50"
                >
                  {m.active ? 'Pause' : 'Resume'}
                </button>
                <button
                  onClick={() => remove(m)}
                  disabled={actionBusyId === m.id}
                  className="rounded-lg border border-danger/30 bg-danger-dim px-3 py-1 text-xs font-medium text-danger hover:bg-danger/10 disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            </div>

            {m.events.length > 0 && (
              <div className="mt-4 space-y-2">
                {m.events.map((e) => {
                  const meta = STATUS_META[e.status] ?? STATUS_META.no_change
                  return (
                    <div
                      key={e.id}
                      className="flex items-center gap-3 rounded-lg border border-border bg-bg-panel px-3 py-2 text-sm"
                    >
                      <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${meta.cls}`}>
                        {meta.arrow} {meta.label}
                      </span>
                      <span className="flex-1 text-fg-muted">{e.summary}</span>
                      <span className="text-xs text-fg-dim">{fmtDate(e.createdAt)}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        ))
      )}

      <p className="text-xs text-fg-dim">
        Monitoring runs on a scheduled watchdog - you'll get a Telegram alert only when the
        score moves meaningfully (≥ 4 points) or a new critical finding appears. Quiet weeks
        stay quiet.
      </p>
    </div>
  )
}
