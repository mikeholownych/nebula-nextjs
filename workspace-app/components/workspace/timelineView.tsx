'use client'

import { useCallback, useEffect, useState } from 'react'

// ── Types ────────────────────────────────────────────────────────────────────

type EventType = 'audit_completed' | 'recommendation_updated' | 'monitor_run'

interface TimelineEvent {
  type: EventType
  created_at: string | null
  url?: string | null
  score?: number | null
  grade?: string | null
  label?: string | null
  status?: string | null
  prev_score?: number | null
  new_score?: number | null
  summary?: string | null
  audit_id?: string | null
}

interface TimelineData {
  email: string
  events: TimelineEvent[]
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '-'
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function fmtScore(n: number | null | undefined): string {
  if (n == null) return '-'
  return n.toFixed(1)
}

// ── Monitor-status colour map ─────────────────────────────────────────────────
const MONITOR_COLORS: Record<string, string> = {
  improved: 'text-accent',
  regressed: 'text-danger',
  no_change: 'text-fg-muted',
  new_fail: 'text-danger',
  error: 'text-yellow-500',
}

const REC_COLORS: Record<string, string> = {
  to_fix: 'text-danger',
  doing: 'text-yellow-400',
  done: 'text-accent',
}

// ── Sub-components ────────────────────────────────────────────────────────────

function AuditDot() {
  return (
    <span
      className="flex-shrink-0 w-3 h-3 rounded-full bg-accent mt-1.5"
      aria-hidden="true"
    />
  )
}

function RecDot({ status }: { status?: string | null }) {
  const color =
    status === 'done'
      ? 'bg-accent'
      : status === 'doing'
      ? 'bg-yellow-400'
      : 'bg-red-500'
  return (
    <span
      className={`flex-shrink-0 w-3 h-3 rounded-full mt-1.5 ${color}`}
      aria-hidden="true"
    />
  )
}

function MonitorDot({ status }: { status?: string | null }) {
  const color =
    status === 'improved'
      ? 'bg-accent'
      : status === 'regressed' || status === 'new_fail'
      ? 'bg-red-500'
      : status === 'error'
      ? 'bg-yellow-400'
      : 'bg-fg-dim'
  return (
    <span
      className={`flex-shrink-0 w-3 h-3 rounded-full mt-1.5 ${color}`}
      aria-hidden="true"
    />
  )
}

function AuditEvent({ ev }: { ev: TimelineEvent }) {
  return (
    <div className="flex gap-3">
      <AuditDot />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-accent">
            Audit completed
          </span>
          {ev.grade && (
            <span className="text-xs font-bold bg-accent-dim text-accent/80 px-1.5 py-0.5 rounded">
              Grade {ev.grade}
            </span>
          )}
          {ev.score != null && (
            <span className="text-xs text-fg-muted">
              Score {fmtScore(ev.score)}/10
            </span>
          )}
        </div>
        {ev.url && (
          <p className="text-sm text-fg-muted mt-0.5 truncate">{ev.url}</p>
        )}
        <p className="text-xs text-fg-dim mt-0.5">{fmtDate(ev.created_at)}</p>
      </div>
    </div>
  )
}

function RecEvent({ ev }: { ev: TimelineEvent }) {
  const statusColor = REC_COLORS[ev.status ?? ''] ?? 'text-fg-muted'
  return (
    <div className="flex gap-3">
      <RecDot status={ev.status} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-blue-400">
            Recommendation
          </span>
          {ev.status && (
            <span className={`text-xs font-medium capitalize ${statusColor}`}>
              → {ev.status.replace('_', ' ')}
            </span>
          )}
        </div>
        {ev.label && (
          <p className="text-sm text-fg-muted mt-0.5">{ev.label}</p>
        )}
        {ev.url && (
          <p className="text-xs text-fg-dim mt-0.5 truncate">{ev.url}</p>
        )}
        <p className="text-xs text-fg-dim mt-0.5">{fmtDate(ev.created_at)}</p>
      </div>
    </div>
  )
}

function MonitorEvent({ ev }: { ev: TimelineEvent }) {
  const statusColor = MONITOR_COLORS[ev.status ?? ''] ?? 'text-fg-muted'
  const scoreDelta =
    ev.prev_score != null && ev.new_score != null
      ? ev.new_score - ev.prev_score
      : null
  return (
    <div className="flex gap-3">
      <MonitorDot status={ev.status} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-purple-400">
            Monitor run
          </span>
          {ev.status && (
            <span className={`text-xs font-medium capitalize ${statusColor}`}>
              {ev.status.replace('_', ' ')}
            </span>
          )}
          {scoreDelta != null && (
            <span
              className={`text-xs font-medium ${
                scoreDelta > 0 ? 'text-accent' : scoreDelta < 0 ? 'text-danger' : 'text-fg-muted'
              }`}
            >
              {scoreDelta > 0 ? '+' : ''}
              {scoreDelta.toFixed(1)} pts
            </span>
          )}
        </div>
        {(ev.prev_score != null || ev.new_score != null) && (
          <p className="text-xs text-fg-muted mt-0.5">
            {fmtScore(ev.prev_score)} → {fmtScore(ev.new_score)}
          </p>
        )}
        {ev.summary && (
          <p className="text-sm text-fg-muted mt-0.5">{ev.summary}</p>
        )}
        {ev.url && (
          <p className="text-xs text-fg-dim mt-0.5 truncate">{ev.url}</p>
        )}
        <p className="text-xs text-fg-dim mt-0.5">{fmtDate(ev.created_at)}</p>
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function TimelineView({ email }: { email: string }) {
  const [data, setData] = useState<TimelineData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(
        `/api/timeline?email=${encodeURIComponent(email)}`
      )
      if (!res.ok) throw new Error('Failed to load timeline')
      const json = await res.json()
      setData(json)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }, [email])

  useEffect(() => {
    if (email) load()
  }, [email, load])

  if (loading) {
    return (
      <div className="text-fg-muted py-12 text-center text-sm">
        Loading timeline…
      </div>
    )
  }

  if (error) {
    return (
      <div className="py-8">
        <p className="text-danger mb-3 text-sm">{error}</p>
        <button
          onClick={load}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-bg"
        >
          Retry
        </button>
      </div>
    )
  }

  if (!data || data.events.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-fg-muted text-sm">No activity recorded yet.</p>
        <p className="text-fg-dim text-xs mt-1">
          Run an audit or set up monitoring to start your timeline.
        </p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold">Activity Timeline</h2>
        <p className="text-sm text-fg-muted mt-1">
          {data.events.length} event{data.events.length !== 1 ? 's' : ''} - most recent first
        </p>
      </div>

      <div className="relative">
        {/* Vertical line */}
        <div
          className="absolute left-1.5 top-2 bottom-0 w-px bg-bg-elevated"
          aria-hidden="true"
        />

        <div className="space-y-6 pl-6">
          {data.events.map((ev, i) => (
            <div key={i}>
              {ev.type === 'audit_completed' && <AuditEvent ev={ev} />}
              {ev.type === 'recommendation_updated' && <RecEvent ev={ev} />}
              {ev.type === 'monitor_run' && <MonitorEvent ev={ev} />}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
