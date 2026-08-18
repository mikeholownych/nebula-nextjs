'use client'

import { useCallback, useEffect, useState } from 'react'

interface Experiment {
  id: string
  url: string
  description: string
  finding_keys: string[]
  started_at: string | null
  concluded_at: string | null
  status: 'running' | 'concluded' | 'inconclusive'
  baseline_score: number | null
  baseline_position: number | null
  baseline_ctr: number | null
  current_score: number | null
  current_position: number | null
  current_ctr: number | null
  created_at: string | null
}

interface AuditOption {
  id: string
  url: string
}

function fmtDate(iso: string | null): string {
  if (!iso) return '-'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function fmtNum(v: number | null, digits = 1): string {
  return v === null || v === undefined ? '-' : v.toFixed(digits)
}

function fmtCtr(v: number | null): string {
  return v === null || v === undefined ? '-' : `${(v * 100).toFixed(2)}%`
}

function Delta({ baseline, current, invert = false, pct = false }: { baseline: number | null; current: number | null; invert?: boolean; pct?: boolean }) {
  if (baseline === null || current === null || baseline === undefined || current === undefined) {
    return <span className="text-fg-dim text-xs">-</span>
  }
  const raw = pct ? (current - baseline) * 100 : current - baseline
  if (Math.abs(raw) < 0.001) return <span className="text-fg-dim text-xs">±0</span>
  const good = invert ? raw < 0 : raw > 0
  const sign = raw > 0 ? '+' : ''
  return (
    <span className={`text-xs font-semibold ${good ? 'text-[#c7ff2f]' : 'text-red-400'}`}>
      {sign}{pct ? raw.toFixed(2) + 'pts' : raw.toFixed(1)}
    </span>
  )
}

export default function ExperimentTrackerView({ email }: { email: string }) {
  const [experiments, setExperiments] = useState<Experiment[] | null>(null)
  const [auditedUrls, setAuditedUrls] = useState<string[]>([])
  const [newUrl, setNewUrl] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [creating, setCreating] = useState(false)
  const [refreshing, setRefreshing] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/experiments')
      if (res.ok) {
        const data = await res.json()
        setExperiments(data.experiments || [])
      } else {
        setExperiments([])
      }
    } catch {
      setError('Failed to load experiments')
      setExperiments([])
    }
  }, [])

  useEffect(() => {
    load()
    // Load audited URLs for the picker
    fetch(`/api/audits/by-email?email=${encodeURIComponent(email)}`)
      .then((r) => (r.ok ? r.json() : { audits: [] }))
      .then((data) => {
        const urls: string[] = []
        const seen = new Set<string>()
        for (const a of (data.audits || []) as AuditOption[]) {
          if (a.url && !seen.has(a.url)) {
            seen.add(a.url)
            urls.push(a.url)
          }
        }
        setAuditedUrls(urls)
      })
      .catch(() => {})
  }, [email, load])

  const createExperiment = async () => {
    if (!newUrl || !newDescription.trim()) return
    setCreating(true)
    try {
      const res = await fetch('/api/experiments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: newUrl, description: newDescription.trim(), finding_keys: [] }),
      })
      if (res.ok) {
        setNewUrl('')
        setNewDescription('')
        await load()
      } else {
        setError('Failed to create experiment')
      }
    } catch {
      setError('Failed to create experiment')
    } finally {
      setCreating(false)
    }
  }

  const refresh = async (id: string) => {
    setRefreshing((prev) => new Set(prev).add(id))
    try {
      await fetch(`/api/experiments/${id}/refresh`, { method: 'POST' })
      await load()
    } catch { /* silent */ }
    setRefreshing((prev) => { const s = new Set(prev); s.delete(id); return s })
  }

  const setStatus = async (id: string, status: 'concluded' | 'inconclusive') => {
    try {
      await fetch(`/api/experiments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      await load()
    } catch { /* silent */ }
  }

  const remove = async (id: string) => {
    try {
      await fetch(`/api/experiments/${id}`, { method: 'DELETE' })
      await load()
    } catch { /* silent */ }
  }

  if (experiments === null) {
    return <p className="text-sm text-fg-dim">Loading experiments…</p>
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>
      )}

      {/* New experiment */}
      <div className="rounded-2xl border border-border bg-bg-elevated p-6">
        <h2 className="text-base font-semibold text-fg">Start an experiment</h2>
        <p className="mt-1 mb-4 text-sm text-fg-muted">
          Log what you changed. Nebula captures a baseline now and tracks whether the numbers move.
        </p>
        <div className="space-y-3">
          <div>
            <label htmlFor="exp-url" className="block text-xs font-semibold uppercase tracking-wide text-fg-dim mb-2">Page</label>
            {auditedUrls.length > 0 ? (
              <select
                id="exp-url"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                className="w-full rounded-lg border border-border bg-bg-panel px-3 py-2 text-sm text-fg focus:border-accent focus:outline-none"
              >
                <option value="">Select an audited page…</option>
                {auditedUrls.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            ) : (
              <input
                id="exp-url"
                type="url"
                placeholder="https://yoursite.com/landing"
                value={newUrl}
                onChange={(e) => setNewUrl(e.target.value)}
                className="w-full rounded-lg border border-border bg-bg-panel px-3 py-2 text-sm text-fg placeholder:text-fg-dim focus:border-accent focus:outline-none"
              />
            )}
          </div>
          <div>
            <label htmlFor="exp-desc" className="block text-xs font-semibold uppercase tracking-wide text-fg-dim mb-2">What changed</label>
            <textarea
              id="exp-desc"
              rows={2}
              placeholder="e.g. Rewrote H1 to lead with the outcome; moved CTA above fold"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              className="w-full rounded-lg border border-border bg-bg-panel px-3 py-2 text-sm text-fg placeholder:text-fg-dim focus:border-accent focus:outline-none"
            />
          </div>
          <button
            onClick={createExperiment}
            disabled={creating || !newUrl || !newDescription.trim()}
            className="rounded-lg bg-[#c7ff2f] px-4 py-2 text-sm font-semibold text-bg hover:bg-[#00a88a] transition-colors disabled:opacity-50"
          >
            {creating ? 'Starting…' : 'Start experiment'}
          </button>
        </div>
      </div>

      {/* Experiment list */}
      {experiments.length === 0 ? (
        <div className="rounded-2xl border border-border bg-bg-elevated p-10 text-center">
          <h3 className="text-lg font-semibold text-fg">Log what you change. Nebula tracks whether it worked.</h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-fg-muted">
            Every experiment captures a baseline score (and GSC position/CTR when connected), then tracks
            current values so you can attribute results to specific changes.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {experiments.map((exp) => (
            <div key={exp.id} className="rounded-2xl border border-border bg-bg-elevated p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    {exp.status === 'running' ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#c7ff2f]/10 px-2.5 py-0.5 text-[11px] font-semibold text-[#c7ff2f]">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#c7ff2f] animate-pulse" aria-hidden="true" />
                        Running
                      </span>
                    ) : exp.status === 'concluded' ? (
                      <span className="inline-flex items-center rounded-full bg-bg-panel px-2.5 py-0.5 text-[11px] font-semibold text-fg-muted">Concluded</span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-400">Inconclusive</span>
                    )}
                    <span className="text-[11px] text-fg-dim">Started {fmtDate(exp.started_at)}</span>
                  </div>
                  <p className="mt-2 text-sm font-medium text-fg">{exp.description}</p>
                  <p className="mt-0.5 truncate text-xs text-fg-muted">{exp.url}</p>
                </div>
                <div className="flex items-center gap-2">
                  {exp.status === 'running' && (
                    <>
                      <button
                        onClick={() => refresh(exp.id)}
                        disabled={refreshing.has(exp.id)}
                        className="rounded-lg border border-border bg-bg-panel px-3 py-1.5 text-xs font-semibold text-fg hover:bg-bg-elevated transition-colors disabled:opacity-50"
                      >
                        {refreshing.has(exp.id) ? 'Refreshing…' : 'Refresh'}
                      </button>
                      <button
                        onClick={() => setStatus(exp.id, 'concluded')}
                        className="rounded-lg border border-[#c7ff2f] px-3 py-1.5 text-xs font-semibold text-[#c7ff2f] hover:bg-[#c7ff2f]/10 transition-colors"
                      >
                        Conclude
                      </button>
                      <button
                        onClick={() => setStatus(exp.id, 'inconclusive')}
                        className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-fg-muted hover:bg-bg-panel transition-colors"
                      >
                        Inconclusive
                      </button>
                    </>
                  )}
                  {exp.status !== 'running' && (
                    <button
                      onClick={() => remove(exp.id)}
                      className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-fg-muted hover:text-red-400 hover:border-red-500/40 transition-colors"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>

              {/* Baseline → current */}
              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-border bg-bg-panel px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-fg-dim">Audit score</p>
                  <p className="mt-1 text-sm text-fg">
                    {fmtNum(exp.baseline_score, 0)} <span className="text-fg-dim">→</span> <strong>{fmtNum(exp.current_score, 0)}</strong>
                  </p>
                  <Delta baseline={exp.baseline_score} current={exp.current_score} />
                </div>
                <div className="rounded-xl border border-border bg-bg-panel px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-fg-dim">GSC position</p>
                  <p className="mt-1 text-sm text-fg">
                    {fmtNum(exp.baseline_position)} <span className="text-fg-dim">→</span> <strong>{fmtNum(exp.current_position)}</strong>
                  </p>
                  {/* Lower position number is better */}
                  <Delta baseline={exp.baseline_position} current={exp.current_position} invert />
                </div>
                <div className="rounded-xl border border-border bg-bg-panel px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-fg-dim">CTR</p>
                  <p className="mt-1 text-sm text-fg">
                    {fmtCtr(exp.baseline_ctr)} <span className="text-fg-dim">→</span> <strong>{fmtCtr(exp.current_ctr)}</strong>
                  </p>
                  <Delta baseline={exp.baseline_ctr} current={exp.current_ctr} pct />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
