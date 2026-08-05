'use client'

import { useEffect, useMemo, useState } from 'react'
import type { WorkspaceAudit } from './WorkspaceClient'

interface DiffResult {
  audit_a: string
  audit_b: string
  score_a: number
  score_b: number
  score_delta: number
  findings_added: DiffFinding[]
  findings_removed: DiffFinding[]
  findings_unchanged: DiffFinding[]
}

interface DiffFinding {
  key?: string
  label?: string
  impact?: number
  issue?: string
  fix?: string
}

export default function DiffView({ audits }: { audits: WorkspaceAudit[] }) {
  const [auditA, setAuditA] = useState<string>('')
  const [auditB, setAuditB] = useState<string>('')
  const [diff, setDiff] = useState<DiffResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Group audits by URL for easy selection
  const auditsByUrl = useMemo(() => {
    const map = new Map<string, WorkspaceAudit[]>()
    for (const a of audits) {
      if (a.status !== 'completed' || a.score === null) continue
      const existing = map.get(a.url) || []
      existing.push(a)
      map.set(a.url, existing)
    }
    // Only keep URLs with 2+ audits
    const result = new Map<string, WorkspaceAudit[]>()
    map.forEach((list, url) => {
      if (list.length >= 2) {
        // Sort by date descending
        list.sort((a, b) => {
          const ta = a.completed_at || a.created_at || ''
          const tb = b.completed_at || b.created_at || ''
          return tb.localeCompare(ta)
        })
        result.set(url, list)
      }
    })
    return result
  }, [audits])

  // Auto-suggest most recent pair
  useEffect(() => {
    if (auditsByUrl.size > 0 && !auditA && !auditB) {
      const firstUrl = auditsByUrl.keys().next().value
      if (firstUrl) {
        const list = auditsByUrl.get(firstUrl)!
        if (list.length >= 2) {
          setAuditA(list[1].id)  // older
          setAuditB(list[0].id)  // newer
        }
      }
    }
  }, [auditsByUrl, auditA, auditB])

  // Fetch diff when both audits selected
  useEffect(() => {
    if (!auditA || !auditB || auditA === auditB) {
      setDiff(null)
      return
    }
    let cancelled = false
    setLoading(true)
    setError(null)
    fetch(`/api/audit/diff?audit_a=${encodeURIComponent(auditA)}&audit_b=${encodeURIComponent(auditB)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to load diff')
        const data = await res.json()
        if (!cancelled) setDiff(data)
      })
      .catch((e) => { if (!cancelled) setError(e.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [auditA, auditB])

  // All audits that can be compared (completed with score, have 2+ per URL)
  const comparableAudits = useMemo(() => {
    const all: WorkspaceAudit[] = []
    auditsByUrl.forEach((list) => { all.push(...list) })
    return all
  }, [auditsByUrl])

  // Empty state
  if (auditsByUrl.size === 0) {
    return (
      <div className="rounded-2xl border border-border bg-bg-elevated p-10 text-center shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-fg-dim">No diff available</p>
        <h2 className="text-xl font-semibold tracking-[-0.02em] text-fg">Run a follow-up audit on the same page to see what changed</h2>
        <p className="mx-auto mb-6 mt-2 max-w-md text-sm leading-6 text-fg-muted">
          When you have two or more audits of the same URL, you can compare findings and track your score improvement.
        </p>
        <a
          href="/audit"
          className="inline-flex rounded-lg bg-[#00c2a0] px-5 py-2.5 text-sm font-semibold text-bg hover:bg-[#00a88a] transition-colors"
        >
          Run an audit →
        </a>
      </div>
    )
  }

  const fmtDate = (iso?: string | null) => {
    if (!iso) return '—'
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return '—'
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div className="space-y-6">
      {/* Selectors */}
      <div className="rounded-2xl border border-border bg-bg-elevated p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-fg-dim">Compare two audits</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
          <div className="flex-1">
            <label className="mb-1 block text-xs text-fg-muted">Before (older)</label>
            <select
              value={auditA}
              onChange={(e) => setAuditA(e.target.value)}
              className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg focus:outline-none focus:ring-1 focus:ring-[#00c2a0]"
            >
              <option value="">Select audit…</option>
              {comparableAudits.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.url.replace(/^https?:\/\//, '').slice(0, 40)} — {fmtDate(a.completed_at || a.created_at)} (Score: {a.score !== null ? Math.round(a.score * 10) : '?'})
                </option>
              ))}
            </select>
          </div>
          <span className="hidden text-fg-dim sm:block">→</span>
          <div className="flex-1">
            <label className="mb-1 block text-xs text-fg-muted">After (newer)</label>
            <select
              value={auditB}
              onChange={(e) => setAuditB(e.target.value)}
              className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg focus:outline-none focus:ring-1 focus:ring-[#00c2a0]"
            >
              <option value="">Select audit…</option>
              {comparableAudits.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.url.replace(/^https?:\/\//, '').slice(0, 40)} — {fmtDate(a.completed_at || a.created_at)} (Score: {a.score !== null ? Math.round(a.score * 10) : '?'})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-8 text-sm text-fg-muted">Loading diff…</div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-400">{error}</div>
      )}

      {/* Diff Result */}
      {diff && !loading && (
        <div className="space-y-5">
          {/* Score comparison */}
          <div className="rounded-2xl border border-border bg-bg-elevated p-6 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-fg-dim">Score comparison</p>
            <div className="flex items-center justify-center gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold tabular-nums text-fg">{Math.round(diff.score_a * 10)}</p>
                <p className="mt-1 text-xs text-fg-muted">Before</p>
              </div>
              <span className="text-2xl text-fg-dim">→</span>
              <div className="text-center">
                <p className="text-3xl font-bold tabular-nums text-fg">{Math.round(diff.score_b * 10)}</p>
                <p className="mt-1 text-xs text-fg-muted">After</p>
              </div>
              <div className="ml-4 text-center">
                <p className={`text-2xl font-bold tabular-nums ${diff.score_delta > 0 ? 'text-[#00c2a0]' : diff.score_delta < 0 ? 'text-red-400' : 'text-fg-muted'}`}>
                  {diff.score_delta > 0 ? '+' : ''}{Math.round(diff.score_delta * 10)}
                </p>
                <p className="mt-1 text-xs text-fg-muted">Delta</p>
              </div>
            </div>
          </div>

          {/* Findings diff */}
          <div className="rounded-2xl border border-border bg-bg-elevated p-6 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-fg-dim">Findings diff</p>

            {diff.findings_removed.length > 0 && (
              <div className="mb-4">
                <p className="mb-2 text-xs font-semibold text-[#00c2a0]">✓ Resolved ({diff.findings_removed.length})</p>
                <div className="space-y-1">
                  {diff.findings_removed.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-lg bg-[#00c2a0]/5 px-3 py-2">
                      <span className="text-sm text-[#00c2a0] line-through opacity-70">{f.label || f.key || 'Unknown finding'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {diff.findings_added.length > 0 && (
              <div className="mb-4">
                <p className="mb-2 text-xs font-semibold text-red-400">⚠ New issues ({diff.findings_added.length})</p>
                <div className="space-y-1">
                  {diff.findings_added.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-lg bg-red-500/5 px-3 py-2">
                      <span className="inline-flex rounded-full bg-red-500/20 px-1.5 py-0.5 text-[10px] font-bold text-red-400">NEW</span>
                      <span className="text-sm text-fg">{f.label || f.key || 'Unknown finding'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {diff.findings_unchanged.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold text-fg-dim">Unchanged ({diff.findings_unchanged.length})</p>
                <div className="space-y-1">
                  {diff.findings_unchanged.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-lg px-3 py-2 opacity-50">
                      <span className="text-sm text-fg-muted">{f.label || f.key || 'Unknown finding'}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {diff.findings_removed.length === 0 && diff.findings_added.length === 0 && diff.findings_unchanged.length === 0 && (
              <p className="text-sm text-fg-muted text-center py-4">No findings data available for comparison.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
