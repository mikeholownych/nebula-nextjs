'use client'

import { useCallback, useEffect, useState } from 'react'

export interface MonitorEvent {
  id: string
  monitor_id: string
  audit_id: string | null
  status: 'improved' | 'regressed' | 'no_change' | 'new_fail' | 'error'
  prev_score: number | null
  new_score: number | null
  summary: string
  created_at: string
}

export interface Monitor {
  id: string
  email: string
  url: string
  cadence: 'weekly' | 'monthly'
  active: boolean
  next_run_at: string | null
  last_run_at: string | null
  last_score: number | null
  created_at: string
  updated_at: string
  events: MonitorEvent[]
}

const STATUS_META: Record<
  MonitorEvent['status'],
  { label: string; cls: string; arrow: string }
> = {
  improved: { label: 'Improved', cls: 'bg-accent-dim text-accent border-accent/30', arrow: '▲' },
  regressed: { label: 'Regressed', cls: 'bg-danger-dim text-danger border-danger/30', arrow: '▼' },
  new_fail: { label: 'New critical', cls: 'bg-danger-dim text-danger border-danger/30', arrow: '🚨' },
  no_change: { label: 'No change', cls: 'bg-bg-elevated text-fg-muted border-border', arrow: '→' },
  error: { label: 'Run failed', cls: 'bg-signal-fail/10 text-signal-fail border-signal-fail/30', arrow: '⚠' },
}

const fmtDate = (iso: string | null): string => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const fmtWhen = (iso: string | null): string => {
  if (!iso) return '—'
  const d = new Date(iso)
  const now = new Date()
  const diff = d.getTime() - now.getTime()
  const days = Math.round(diff / 86_400_000)
  if (days < 0) return `${-days}d overdue`
  if (days === 0) return 'today'
  if (days === 1) return 'tomorrow'
  return `in ${days}d`
}

export default function MonitoringView({ email }: { email: string }) {
  const [monitors, setMonitors] = useState<Monitor[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [url, setUrl] = useState('')
  const [cadence, setCadence] = useState<'weekly' | 'monthly'>('weekly')
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [actionBusyId, setActionBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/monitors?email=${encodeURIComponent(email)}`)
      if (!res.ok) throw new Error('Failed to load monitors')
      const data = await res.json()
      setMonitors(data.monitors || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }, [email])

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
      const res = await fetch('/api/monitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, url: trimmed, cadence }),
      })
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
      await fetch(`/api/monitors/${m.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active }),
      })
      await load()
    } finally {
      setActionBusyId(null)
    }
  }

  const setCadenceOf = async (m: Monitor, cad: 'weekly' | 'monthly') => {
    setActionBusyId(m.id)
    try {
      await fetch(`/api/monitors/${m.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cadence: cad }),
      })
      await load()
    } finally {
      setActionBusyId(null)
    }
  }

  const remove = async (m: Monitor) => {
    if (!window.confirm(`Stop monitoring ${m.url}?`)) return
    setActionBusyId(m.id)
    try {
      await fetch(`/api/monitors/${m.id}`, { method: 'DELETE' })
      await load()
    } finally {
      setActionBusyId(null)
    }
  }

  if (loading && !monitors) {
    return <div className="py-12 text-center text-fg-muted">Loading monitors…</div>
  }

  if (error && !monitors) {
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
      <section className="rounded-2xl border border-border bg-bg-elevated p-6">
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
            className="rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-bg hover:bg-accent-light disabled:opacity-50"
          >
            {busy ? 'Adding…' : 'Add monitor'}
          </button>
        </div>
        {formError && <p className="mt-2 text-sm text-danger">{formError}</p>}
      </section>

      {/* Monitors */}
      {!monitors || monitors.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-border p-10 text-center">
          <p className="text-fg font-medium">No monitored pages yet</p>
          <p className="text-sm text-fg-dim mt-1">
            Add a URL above and Nebula will watch its conversion score over time — the same
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
                      {fmtWhen(m.next_run_at)} · last run {fmtDate(m.last_run_at)}
                    </>
                  ) : (
                    <>Paused · last run {fmtDate(m.last_run_at)}</>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {m.last_score != null && (
                  <span className="rounded-lg border border-border bg-bg-panel px-3 py-1 text-sm font-semibold">
                    {Math.round(m.last_score)}/100
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
                      <span className="text-xs text-fg-dim">{fmtDate(e.created_at)}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        ))
      )}

      <p className="text-xs text-fg-dim">
        Monitoring runs on a scheduled watchdog — you'll get a Telegram alert only when the
        score moves meaningfully (≥ 4 points) or a new critical finding appears. Quiet weeks
        stay quiet.
      </p>
    </div>
  )
}
