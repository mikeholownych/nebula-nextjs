'use client'

import { useCallback, useEffect, useState } from 'react'

export interface LabExperiment {
  id: string
  email: string
  url: string
  label: string
  score: number | null
  grade: string | null
  components: Record<string, { status?: string; score?: number | null }> | null
  ad_copy?: string | null
  status: 'saved' | 'production'
  created_at: string
  updated_at: string
}

type ComponentStatus = 'pass' | 'warning' | 'fail' | 'unknown'

function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

function fmtDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function statusMeta(status?: string): { label: string; cls: string } {
  switch (status as ComponentStatus) {
    case 'pass':
      return { label: 'Pass', cls: 'bg-accent/15 text-accent border-accent/30' }
    case 'warning':
      return { label: 'Warning', cls: 'bg-signal-fail/10 text-signal-fail border-signal-fail/30' }
    case 'fail':
      return { label: 'Fail', cls: 'bg-red-500/15 text-danger border-red-700/50' }
    default:
      return { label: '-', cls: 'bg-bg-elevated text-fg-muted border-border/50' }
  }
}

function ComponentChip({ name, comp }: { name: string; comp?: { status?: string; score?: number | null } }) {
  const meta = statusMeta(comp?.status)
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs">
      <span className="text-fg-dim">{name}</span>
      <span className={`font-medium ${meta.cls.split(' ').slice(1).join(' ')}`}>{meta.label}</span>
      {comp?.score != null && <span className="text-fg-dim">{comp.score}/10</span>}
    </span>
  )
}

export default function ExperimentsView({ email }: { email: string }) {
  const [exps, setExps] = useState<LabExperiment[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [working, setWorking] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/lab-experiments?email=${encodeURIComponent(email)}`)
      if (!res.ok) throw new Error('Failed to load experiments')
      const data = await res.json()
      setExps(data.experiments || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }, [email])

  useEffect(() => {
    load()
  }, [load])

  const setStatus = async (exp: LabExperiment, status: 'saved' | 'production') => {
    setWorking(exp.id)
    try {
      const res = await fetch(`/api/lab-experiments/${exp.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error('Update failed')
      const updated = await res.json()
      setExps((prev) => (prev || []).map((e) => (e.id === updated.id ? { ...e, ...updated } : e)))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Update failed')
    } finally {
      setWorking(null)
    }
  }

  const remove = async (exp: LabExperiment) => {
    if (!window.confirm(`Delete "${exp.label}"?`)) return
    setWorking(exp.id)
    try {
      const res = await fetch(`/api/lab-experiments/${exp.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Delete failed')
      setExps((prev) => (prev || []).filter((e) => e.id !== exp.id))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed')
    } finally {
      setWorking(null)
    }
  }

  if (loading && !exps) {
    return <p className="text-sm text-fg-dim">Loading experiments…</p>
  }

  if (error && !exps) {
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

  if (exps && exps.length === 0) {
    return (
      <div className="bg-bg-elevated border border-border rounded-lg p-10 text-center">
        <h2 className="text-xl font-bold mb-2">No experiments saved yet</h2>
        <p className="text-fg-muted mb-6 max-w-md mx-auto">
          Run a Component Lab check on any landing page, then save it here. Track Headline A vs B
          vs C, and mark the winner as production.
        </p>
        <a
          href="https://nebulacomponents.com/lab"
          className="inline-block rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-bg hover:opacity-85 hover:bg-accent transition-colors"
        >
          Open Component Lab
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-fg-muted">
          Saved Component Lab runs. Every run is a snapshot - compare scores, then mark the winner
          as production.
        </p>
        <a
          href="https://nebulacomponents.com/lab"
          className="text-xs text-accent hover:text-fg"
        >
          Open Lab →
        </a>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="space-y-4">
        {(exps || []).map((exp) => {
          const score100 = exp.score != null ? Math.round(exp.score * 10) : null
          const comps = exp.components || {}
          return (
            <article
              key={exp.id}
              className={`rounded-lg border p-5 ${
                exp.status === 'production'
                  ? 'border-accent/30 bg-accent/5'
                  : 'border-border bg-bg-elevated'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-semibold text-fg">{exp.label}</h3>
                    {exp.status === 'production' && (
                      <span className="rounded-full border border-accent/30 bg-accent/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-accent">
                        Production
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-fg-dim mt-0.5">
                    {domainOf(exp.url)} · {fmtDate(exp.created_at)}
                    {exp.grade ? ` · Grade ${exp.grade}` : ''}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-bold ${exp.status === 'production' ? 'text-accent' : 'text-fg'}`}>
                    {score100 ?? '-'}
                    <span className="text-sm text-fg-dim font-normal">/100</span>
                  </p>
                </div>
              </div>

              {exp.ad_copy && (
                <p className="mt-3 text-xs text-fg-dim">
                  <span className="text-fg-muted">Ad copy:</span> “{exp.ad_copy}”
                </p>
              )}

              {(comps.headline || comps.cta || comps.messageMatch) && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {comps.messageMatch && <ComponentChip name="Message" comp={comps.messageMatch} />}
                  {comps.headline && <ComponentChip name="Headline" comp={comps.headline} />}
                  {comps.cta && <ComponentChip name="CTA" comp={comps.cta} />}
                </div>
              )}

              <div className="mt-4 flex items-center gap-2">
                {exp.status === 'production' ? (
                  <button
                    onClick={() => setStatus(exp, 'saved')}
                    disabled={working === exp.id}
                    className="rounded border border-border px-3 py-1.5 text-xs text-fg-muted hover:text-fg hover:border-border disabled:opacity-30 transition-colors"
                  >
                    Unmark production
                  </button>
                ) : (
                  <button
                    onClick={() => setStatus(exp, 'production')}
                    disabled={working === exp.id}
                    className="rounded-lg bg-accent px-3 py-1.5 text-xs font-semibold text-bg hover:opacity-85 hover:bg-accent disabled:opacity-30 transition-colors"
                  >
                    Mark as production
                  </button>
                )}
                <button
                  onClick={() => remove(exp)}
                  disabled={working === exp.id}
                  className="rounded border border-border px-3 py-1.5 text-xs text-fg-dim hover:text-danger hover:border-red-900 disabled:opacity-30 transition-colors"
                >
                  Delete
                </button>
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}
