'use client'

import { useCallback, useEffect, useState } from 'react'

export interface Recommendation {
  id: string
  email: string
  audit_id: string
  url: string
  finding_key: string
  label: string
  impact: number
  effort: number
  quadrant: string | null
  status: 'to_fix' | 'doing' | 'done'
  verified_at: string | null
  created_at: string
  updated_at: string
}

type Status = Recommendation['status']

const COLUMNS: { id: Status; label: string; hint: string }[] = [
  { id: 'to_fix', label: 'To Fix', hint: 'Flagged by your latest audit' },
  { id: 'doing', label: 'Doing', hint: 'You are working on it' },
  { id: 'done', label: 'Completed', hint: 'Manual or verified by a follow-up audit' },
]

const NEXT: Record<Status, Status | null> = {
  to_fix: 'doing',
  doing: 'done',
  done: null,
}

const PREV: Record<Status, Status | null> = {
  to_fix: null,
  doing: 'to_fix',
  done: 'doing',
}

function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

function severityTone(impact: number): { label: string; cls: string } {
  if (impact >= 8) return { label: 'Critical', cls: 'bg-red-500/15 text-danger border-red-700/50' }
  if (impact >= 5) return { label: 'Warning', cls: 'bg-signal-fail/10 text-signal-fail border-signal-fail/30' }
  return { label: 'Advisory', cls: 'bg-bg-elevated text-fg-muted border-border/50' }
}

function quadrantLabel(q: string | null): string {
  if (!q) return ''
  return q.replace(/_/g, ' ')
}

export default function RecsView({ email }: { email: string }) {
  const [recs, setRecs] = useState<Recommendation[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [moving, setMoving] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/recommendations?email=${encodeURIComponent(email)}`)
      if (!res.ok) throw new Error('Failed to load recommendations')
      const data = await res.json()
      setRecs(data.recommendations || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }, [email])

  useEffect(() => {
    load()
  }, [load])

  const move = async (rec: Recommendation, status: Status) => {
    setMoving(rec.id)
    try {
      const res = await fetch(`/api/recommendations/${rec.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error('Update failed')
      const updated = await res.json()
      setRecs((prev) =>
        (prev || []).map((r) => (r.id === updated.id ? { ...r, ...updated } : r))
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Update failed')
    } finally {
      setMoving(null)
    }
  }

  const cardsByStatus = (status: Status) =>
    (recs || []).filter((r) => r.status === status)

  if (loading && !recs) {
    return <p className="text-sm text-fg-dim">Loading recommendations…</p>
  }

  if (error && !recs) {
    return (
      <div className="bg-bg-elevated border border-border rounded-lg p-8 text-center">
        <p className="text-danger mb-4">{error}</p>
        <button
          onClick={load}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-bg"
        >
          Retry
        </button>
      </div>
    )
  }

  if (recs && recs.length === 0) {
    return (
      <div className="bg-bg-elevated border border-border rounded-lg p-10 text-center">
        <h2 className="text-xl font-bold mb-2">No recommendations yet</h2>
        <p className="text-fg-muted mb-6 max-w-md mx-auto">
          Findings from your audits become cards here. Fix them, move them to Done — and the
          next audit checks whether they actually passed.
        </p>
        <a
          href="/audit"
          className="inline-block rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-bg hover:bg-accent-light transition-colors"
        >
          Run first audit
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-fg-muted">
          Findings tracked as work. Move cards, fix the page, then run a follow-up audit — anything
          it stops flagging is verified automatically.
        </p>
        <button
          onClick={load}
          className="text-xs text-fg-muted hover:text-fg transition-colors"
        >
          ⟳ Refresh
        </button>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="grid md:grid-cols-3 gap-4 items-start">
        {COLUMNS.map((col) => {
          const cards = cardsByStatus(col.id)
          return (
            <section
              key={col.id}
              aria-label={col.label}
              className="bg-bg-elevated border border-border rounded-lg p-4 min-h-[200px]"
            >
              <header className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-semibold text-fg">{col.label}</h3>
                <span className="text-xs text-fg-dim border border-border rounded-full px-2 py-0.5">
                  {cards.length}
                </span>
              </header>
              <p className="text-xs text-fg-dim mb-4">{col.hint}</p>

              <div className="space-y-3">
                {cards.map((rec) => {
                  const tone = severityTone(rec.impact)
                  const next = NEXT[rec.status]
                  const prev = PREV[rec.status]
                  return (
                    <article
                      key={rec.id}
                      className="rounded-lg border border-border bg-bg-panel p-4"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="text-sm font-medium text-fg">{rec.label}</p>
                        <span
                          className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize ${tone.cls}`}
                        >
                          {tone.label}
                        </span>
                      </div>
                      <p className="text-xs text-fg-dim mb-1">
                        {domainOf(rec.url)} · impact {rec.impact.toFixed(1)} ·{' '}
                        {quadrantLabel(rec.quadrant) || '—'}
                      </p>
                      {rec.verified_at && (
                        <p className="text-xs text-accent mb-2">
                          ✓ verified by follow-up audit
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => prev && move(rec, prev)}
                          disabled={!prev || moving === rec.id}
                          aria-label="Move left"
                          className="rounded border border-border px-2 py-1 text-xs text-fg-muted hover:text-fg hover:border-border disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          ←
                        </button>
                        <button
                          onClick={() => next && move(rec, next)}
                          disabled={!next || moving === rec.id}
                          aria-label="Move right"
                          className="rounded border border-border px-2 py-1 text-xs text-fg-muted hover:text-fg hover:border-border disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          →
                        </button>
                        <a
                          href={`/audit/${rec.audit_id}/results`}
                          className="ml-auto text-xs text-accent hover:text-accent-light"
                        >
                          view audit
                        </a>
                      </div>
                    </article>
                  )
                })}
                {cards.length === 0 && (
                  <p className="text-xs text-fg-dim py-4 text-center">Empty</p>
                )}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
