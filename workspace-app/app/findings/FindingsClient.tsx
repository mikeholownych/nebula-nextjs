'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

interface Finding {
  id: number
  public_id: string
  domain: string
  signal_key: string
  label: string | null
  issue: string | null
  fix: string | null
  quadrant: string | null
  impact: number | null
  effort: number | null
  status: string
  evidence_class: string
  first_seen_at: string
  last_seen_at: string
}

const STATUS_ORDER = ['regressed', 'new', 'acknowledged', 'in_progress', 'resolved', 'accepted_risk', 'ignored'] as const

const STATUS_STYLES: Record<string, string> = {
  regressed: 'border-signal-fail text-signal-fail',
  new: 'border-accent text-accent',
  acknowledged: 'border-fg-muted text-fg-muted',
  in_progress: 'border-blue-400 text-blue-400',
  resolved: 'border-emerald-500 text-emerald-500',
  accepted_risk: 'border-purple-400 text-purple-400',
  ignored: 'border-neutral-600 text-neutral-500',
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide ${STATUS_STYLES[status] ?? 'border-neutral-600 text-neutral-400'}`}
    >
      {status.replace('_', ' ')}
    </span>
  )
}

export default function FindingsClient() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const domain = searchParams.get('domain') ?? ''
  const status = searchParams.get('status') ?? ''
  const publicId = searchParams.get('public_id') ?? ''

  const [findings, setFindings] = useState<Finding[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [domains, setDomains] = useState<string[]>([])
  const [busyId, setBusyId] = useState<number | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const qs = new URLSearchParams()
      if (domain) qs.set('domain', domain)
      if (status) qs.set('status', status)
      if (publicId) qs.set('public_id', publicId)
      qs.set('limit', '200')
      const res = await fetch(`/api/findings?${qs.toString()}`, { cache: 'no-store' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `HTTP ${res.status}`)
      }
      const body = await res.json()
      setFindings(body.findings ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load findings')
    } finally {
      setLoading(false)
    }
  }, [domain, status, publicId])

  useEffect(() => {
    load()
  }, [load])

  // Distinct domains from loaded set for the filter dropdown
  useEffect(() => {
    fetch('/api/findings?limit=200', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((body) => {
        if (!body?.findings) return
        const set = new Set<string>((body.findings as Finding[]).map((f) => f.domain))
        setDomains(Array.from(set).sort())
      })
      .catch(() => {})
  }, [])

  const setFilter = useCallback(
    (key: string, value: string) => {
      const qs = new URLSearchParams(searchParams.toString())
      if (value) qs.set(key, value)
      else qs.delete(key)
      router.push(`/findings?${qs.toString()}`, { scroll: false })
    },
    [router, searchParams]
  )

  const transition = useCallback(
    async (findingId: number, findingPublicId: string, nextStatus: string) => {
      setBusyId(findingId)
      try {
        const res = await fetch(`/api/findings/${findingPublicId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: nextStatus }),
        })
        if (!res.ok) {
          const body = await res.json().catch(() => ({}))
          throw new Error(body.error || `HTTP ${res.status}`)
        }
        await load()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Update failed')
      } finally {
        setBusyId(null)
      }
    },
    [load]
  )

  // Required actions summary (spec #6): regressed first, then new
  const actionSummary = useMemo(() => {
    const regressed = findings.filter((f) => f.status === 'regressed').length
    const fresh = findings.filter((f) => f.status === 'new').length
    return { regressed, fresh }
  }, [findings])

  return (
    <div>
      {/* Legacy header pattern: eyebrow + h1 left, counter + accent CTA right */}
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-fg-muted">
            Workspace
          </p>
          <h1 className="text-xl font-semibold tracking-tight text-fg">Findings</h1>
        </div>
        <div className="flex items-center gap-3">
          {(actionSummary.regressed > 0 || actionSummary.fresh > 0) && (
            <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-border bg-bg-surface px-3 py-1 font-mono text-xs text-fg-muted">
              {actionSummary.regressed > 0 && (
                <span className="text-[#b33d38]">{actionSummary.regressed} regressed</span>
              )}
              {actionSummary.regressed > 0 && actionSummary.fresh > 0 && <span>·</span>}
              {actionSummary.fresh > 0 && <span className="font-bold text-accent">{actionSummary.fresh} new</span>}
            </div>
          )}
          <a
            href="https://nebulacomponents.com/audit?utm_source=workspace-top&utm_medium=internal"
            className="rounded-lg bg-accent px-4 py-2 font-mono text-xs font-bold text-bg hover:opacity-90 transition-opacity"
          >
            + Audit URL
          </a>
        </div>
      </header>

      {/* Filters - URL-driven (spec #100) */}
      <div className="mb-5 flex flex-wrap gap-2">
        <select
          value={domain}
          onChange={(e) => setFilter('domain', e.target.value)}
          className="rounded-lg border border-border bg-bg-panel px-3 py-2 text-sm text-fg focus:outline-none"
          aria-label="Filter by domain"
        >
          <option value="">All domains</option>
          {domains.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setFilter('status', e.target.value)}
          className="rounded-lg border border-border bg-bg-panel px-3 py-2 text-sm text-fg focus:outline-none"
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          {STATUS_ORDER.map((s) => (
            <option key={s} value={s}>{s.replace('_', ' ')}</option>
          ))}
        </select>
        {(domain || status || publicId) && (
          <button
            onClick={() => router.push('/findings', { scroll: false })}
            className="rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-fg-muted hover:text-fg"
          >
            Clear filters
          </button>
        )}
      </div>

      {loading && (
        <div className="space-y-2" role="status" aria-label="Loading findings">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-md bg-bg-panel" />
          ))}
        </div>
      )}

      {!loading && error && (
        error.match(/401|Authentication/i) ? (
          <SessionExpiredRedirect />
        ) : (
          <div role="alert" className="rounded-md border border-[#b33d38]/40 bg-bg-elevated px-4 py-3 text-sm text-fg">
            {error}
            <button onClick={load} className="ml-3 underline underline-offset-2 hover:text-accent">
              Retry
            </button>
          </div>
        )
      )}

      {!loading && !error && findings.length === 0 && (
        <EmptyState />
      )}

      {!loading && !error && findings.length > 0 && (
        <ul className="space-y-2">
          {findings.map((f) => (
            <li
              key={f.public_id}
              className="rounded-md border border-border bg-bg-elevated p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-colors hover:border-fg-dim/40"
            >
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="font-mono text-xs text-fg-dim">{f.public_id}</span>
                <StatusBadge status={f.status} />
                <span className="text-sm font-medium text-fg">{f.label ?? f.signal_key}</span>
                <span className="font-mono text-xs text-fg-muted">{f.domain}</span>
                {f.quadrant && (
                  <span className="font-mono text-[10px] uppercase tracking-wide text-fg-dim">{f.quadrant}</span>
                )}
                <span className="ml-auto font-mono text-xs text-fg-muted">
                  impact {f.impact ?? '-'} · effort {f.effort ?? '-'}
                </span>
              </div>
              {f.issue && <p className="mt-2 text-sm leading-relaxed text-fg-muted">{f.issue}</p>}
              {f.fix && (
                <p className="mt-1 text-sm leading-relaxed text-fg">
                  <span className="text-accent">Fix:</span> {f.fix}
                </p>
              )}
              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
                <span className="mr-auto font-mono text-[10px] text-fg-dim">
                  first seen {new Date(f.first_seen_at).toLocaleDateString()} · evidence {f.evidence_class}
                </span>
                {f.status !== 'acknowledged' && f.status !== 'in_progress' && (
                  <button
                    disabled={busyId === f.id}
                    onClick={() => transition(f.id, f.public_id, 'acknowledged')}
                    className="rounded-lg border border-border px-3 py-1.5 font-mono text-xs text-fg-muted hover:border-accent hover:text-accent disabled:opacity-40"
                  >
                    Acknowledge
                  </button>
                )}
                {['new', 'acknowledged'].includes(f.status) && (
                  <button
                    disabled={busyId === f.id}
                    onClick={() => transition(f.id, f.public_id, 'in_progress')}
                    className="rounded-lg border border-border px-3 py-1.5 font-mono text-xs text-fg-muted hover:border-accent hover:text-accent disabled:opacity-40"
                  >
                    Start work
                  </button>
                )}
                {!['resolved'].includes(f.status) && (
                  <button
                    disabled={busyId === f.id}
                    onClick={() => transition(f.id, f.public_id, 'resolved')}
                    className="rounded-lg border border-border px-3 py-1.5 font-mono text-xs text-fg-muted hover:border-emerald-500 hover:text-emerald-500 disabled:opacity-40"
                  >
                    Mark resolved
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="bg-bg-elevated border border-border rounded-lg p-10 text-center shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <h2 className="text-xl font-bold mb-2">No findings yet</h2>
      <p className="mx-auto mb-6 max-w-md text-fg-muted">
        Findings appear here after your audits complete. Each finding keeps a
        durable identity and full history, so progress compounds instead of
        resetting with every audit.
      </p>
      <a
        href="https://nebulacomponents.com/audit?utm_source=workspace&utm_medium=internal"
        className="inline-block rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-bg hover:opacity-85 hover:bg-accent transition-colors"
      >
        Run first audit
      </a>
    </div>
  )
}

function SessionExpiredRedirect() {
  if (typeof window !== 'undefined') {
    window.location.href = '/login?error=session_expired'
  }
  return null
}
