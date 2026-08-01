'use client'

import { useEffect, useState } from 'react'
import type { WorkspaceAudit } from './WorkspaceClient'

interface Finding {
  key: string
  label: string
  impact: number
  effort: number
  quadrant: string | null
  issue?: string
  fix?: string
  evidence?: unknown
}

interface AuditDetail {
  audit_id: string
  url: string
  status: string
  score: number
  grade: string
  composite?: number
  findings: Finding[]
  completed_at?: string | null
  created_at?: string
}

function fmtDate(iso?: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

function impactLabel(impact: number): { label: string; cls: string } {
  if (impact >= 8) return { label: 'Critical', cls: 'text-danger bg-danger-dim border-danger/30' }
  if (impact >= 5) return { label: 'Warning', cls: 'text-signal-fail bg-signal-fail/10 border-signal-fail/30' }
  return { label: 'Advisory', cls: 'text-fg-muted bg-bg-elevated border-border/30' }
}

function domainOf(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, '') } catch { return url }
}

function evidenceText(evidence: unknown): string {
  if (!evidence) return ''
  if (typeof evidence === 'string') return evidence
  if (typeof evidence === 'object') {
    const e = evidence as Record<string, unknown>
    const parts: string[] = []
    if (e.measured) parts.push(`Measured: ${e.measured}`)
    if (e.required) parts.push(`Required: ${e.required}`)
    if (e.delta) parts.push(`Gap: ${e.delta}`)
    return parts.join(' · ')
  }
  return ''
}

export default function ReportView({ audits }: { audits: WorkspaceAudit[] }) {
  const [selectedId, setSelectedId] = useState<string>(audits[0]?.id ?? '')
  const [detail, setDetail] = useState<AuditDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!selectedId) return
    setLoading(true)
    setError(null)
    fetch(`/api/audit/${selectedId}`)
      .then((r) => r.ok ? r.json() : Promise.reject('Failed to load'))
      .then((d) => setDetail(d))
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false))
  }, [selectedId])

  const copyLink = () => {
    const url = `https://nebulacomponents.shop/audit/${selectedId}/results`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  if (audits.length === 0) {
    return (
      <div className="py-16 text-center text-fg-muted">
        No audits yet. Run a{' '}
        <a href="/audit" className="text-accent hover:underline">free audit</a>{' '}
        first — reports appear here automatically.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Controls — print:hidden */}
      <div className="flex flex-wrap items-center gap-4 print:hidden">
        <div className="flex-1 min-w-0">
          <label htmlFor="report-select" className="block text-xs text-fg-muted mb-1">
            Select audit
          </label>
          <select
            id="report-select"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className="w-full rounded-lg border border-border bg-bg-panel px-3 py-2 text-sm text-fg focus:border-accent focus:outline-none"
          >
            {audits.map((a) => (
              <option key={a.id} value={a.id}>
                {domainOf(a.url)} — {a.grade ?? '?'} {a.score != null ? `${a.score}/10` : ''} · {fmtDate(a.completed_at ?? a.created_at)}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-3 pt-5">
          <button
            onClick={copyLink}
            className="rounded-lg border border-border px-4 py-2 text-sm text-fg-muted hover:border-accent hover:text-fg transition-colors"
          >
            {copied ? '✓ Copied' : 'Copy share link'}
          </button>
          <button
            onClick={() => window.print()}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-bg hover:bg-accent-light transition-colors"
          >
            Print / Save as PDF
          </button>
        </div>
      </div>

      {loading && <div className="py-8 text-center text-fg-muted">Loading report…</div>}
      {error && <div className="py-8 text-center text-danger">{error}</div>}

      {/* Report body — shown on screen and in print */}
      {detail && !loading && (
        <div className="rounded-2xl border border-border bg-bg-elevated p-8 print:border-none print:bg-white print:text-bg print:p-0">

          {/* Header */}
          <div className="mb-8 border-b border-border pb-8 print:border-gray-200">
            <p className="text-xs font-semibold uppercase tracking-widest text-accent print:text-emerald-700 mb-2">
              Landing Page Audit Report · Nebula Components
            </p>
            <h1 className="text-2xl font-bold text-fg print:text-bg">{detail.url}</h1>
            <p className="mt-1 text-sm text-fg-muted print:text-fg-dim">
              Audited {fmtDate(detail.completed_at ?? detail.created_at)}
            </p>

            <div className="mt-6 flex flex-wrap gap-6">
              <div>
                <p className="text-xs text-fg-dim print:text-fg-dim uppercase tracking-widest">Score</p>
                <p className="text-4xl font-bold text-fg print:text-bg">
                  {detail.composite ?? detail.score}
                  <span className="text-xl text-fg-muted print:text-fg-dim">/10</span>
                </p>
              </div>
              <div>
                <p className="text-xs text-fg-dim print:text-fg-dim uppercase tracking-widest">Grade</p>
                <p className="text-4xl font-bold text-fg print:text-bg">{detail.grade}</p>
              </div>
              <div>
                <p className="text-xs text-fg-dim print:text-fg-dim uppercase tracking-widest">Findings</p>
                <p className="text-4xl font-bold text-fg print:text-bg">{detail.findings?.length ?? 0}</p>
              </div>
            </div>
          </div>

          {/* Findings */}
          {detail.findings && detail.findings.length > 0 ? (
            <div className="space-y-6">
              <h2 className="text-lg font-bold text-fg print:text-bg">Findings</h2>
              {detail.findings.map((f, i) => {
                const tone = impactLabel(f.impact)
                const ev = evidenceText(f.evidence)
                return (
                  <div key={f.key} className="rounded-xl border border-border print:border-gray-200 p-5">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <p className="text-xs text-fg-dim print:text-fg-dim uppercase tracking-widest mb-0.5">
                          Finding {i + 1}
                        </p>
                        <h3 className="font-bold text-fg print:text-bg">{f.label}</h3>
                      </div>
                      <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${tone.cls}`}>
                        {tone.label} · {f.impact}/10
                      </span>
                    </div>
                    {f.issue && (
                      <p className="text-sm text-fg-muted print:text-gray-700 mb-3">{f.issue}</p>
                    )}
                    {ev && (
                      <div className="rounded-lg bg-bg-panel print:bg-gray-50 border border-border print:border-gray-200 px-4 py-2.5 mb-3">
                        <p className="text-xs text-fg-dim print:text-fg-dim uppercase tracking-widest mb-1">Evidence</p>
                        <p className="text-xs font-mono text-fg-muted print:text-fg-dim">{ev}</p>
                      </div>
                    )}
                    {f.fix && (
                      <div>
                        <p className="text-xs text-fg-dim print:text-fg-dim uppercase tracking-widest mb-1">Recommended fix</p>
                        <p className="text-sm text-fg-muted print:text-gray-700">{f.fix}</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-fg-muted print:text-fg-dim">No findings — all signals passed.</p>
          )}

          {/* Footer */}
          <div className="mt-10 border-t border-border print:border-gray-200 pt-6 text-xs text-fg-dim print:text-fg-muted flex items-center justify-between">
            <span>Generated by Nebula Components · nebulacomponents.shop</span>
            <span>Audit ID: {detail.audit_id}</span>
          </div>
        </div>
      )}
    </div>
  )
}
