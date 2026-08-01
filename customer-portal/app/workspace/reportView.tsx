'use client'

import { useState, useCallback } from 'react'
import { WorkspaceAudit, AuditDetail, AuditFinding } from './WorkspaceClient'

interface ReportViewProps {
  audits: WorkspaceAudit[]
}

function gradeColor(grade: string | null): string {
  if (!grade) return '#6b7280'
  const g = grade.toUpperCase()
  if (g === 'A' || g === 'A+') return '#10b981'
  if (g === 'B') return '#3b82f6'
  if (g === 'C') return '#f59e0b'
  if (g === 'D') return '#ef4444'
  return '#6b7280'
}

function formatDate(dateStr?: string | null): string {
  if (!dateStr) return '—'
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  } catch {
    return dateStr
  }
}

function evidenceToString(evidence: unknown): string {
  if (!evidence) return ''
  if (typeof evidence === 'string') return evidence
  if (typeof evidence === 'number') return String(evidence)
  if (Array.isArray(evidence)) return evidence.map(evidenceToString).join(', ')
  if (typeof evidence === 'object') {
    try {
      return JSON.stringify(evidence, null, 2)
    } catch {
      return String(evidence)
    }
  }
  return String(evidence)
}

export default function ReportView({ audits }: ReportViewProps) {
  const [selectedId, setSelectedId] = useState<string>('')
  const [detail, setDetail] = useState<AuditDetail | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const fetchDetail = useCallback(async (id: string) => {
    if (!id) {
      setDetail(null)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/audit/${id}`)
      if (!res.ok) throw new Error('Failed to load audit detail')
      const data = await res.json()
      setDetail(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
      setDetail(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const handleSelect = (id: string) => {
    setSelectedId(id)
    fetchDetail(id)
  }

  const handlePrint = () => {
    window.print()
  }

  const handleCopyLink = async () => {
    if (!selectedId) return
    const link = `https://nebulacomponents.shop/audit/${selectedId}/results`
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
      const ta = document.createElement('textarea')
      ta.value = link
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const selectedAudit = audits.find((a) => a.id === selectedId)

  return (
    <div className="space-y-6">
      {/* Controls — hidden when printing */}
      <div className="print:hidden">
        <h2 className="text-2xl font-bold mb-1">Reports &amp; Export</h2>
        <p className="text-gray-400 text-sm mb-6">
          Select an audit to generate a shareable, print-ready report.
        </p>

        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex-1 min-w-[260px]">
            <label htmlFor="audit-select" className="block text-sm text-gray-300 mb-2">
              Select audit
            </label>
            <select
              id="audit-select"
              value={selectedId}
              onChange={(e) => handleSelect(e.target.value)}
              className="w-full rounded-lg border border-gray-700 bg-[#0d0d0d] px-4 py-2.5 text-white focus:border-emerald-500 focus:outline-none"
            >
              <option value="">— Choose an audit —</option>
              {audits.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.url} — {a.grade ?? 'N/A'} — {formatDate(a.completed_at || a.created_at)}
                </option>
              ))}
            </select>
          </div>

          {selectedId && (
            <div className="flex gap-3">
              <button
                onClick={handlePrint}
                disabled={!detail}
                className="rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-black hover:bg-emerald-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Print / Save as PDF
              </button>
              <button
                onClick={handleCopyLink}
                disabled={!selectedId}
                className="rounded-lg border border-gray-700 px-4 py-2.5 text-sm font-medium text-gray-300 hover:text-white hover:border-gray-500 transition-colors"
              >
                {copied ? '✓ Copied!' : 'Copy share link'}
              </button>
            </div>
          )}
        </div>

        {loading && (
          <p className="mt-4 text-gray-400 text-sm">Loading audit detail…</p>
        )}
        {error && (
          <p className="mt-4 text-red-400 text-sm">{error}</p>
        )}

        {audits.length === 0 && (
          <div className="mt-8 rounded-lg border border-gray-800 bg-[#0a0a0a] p-8 text-center text-gray-500">
            No audits found. Run an{' '}
            <a href="/audit" className="text-emerald-400 hover:underline">
              audit
            </a>{' '}
            first.
          </div>
        )}
      </div>

      {/* Report — shown on screen and when printing */}
      {detail && selectedAudit && (
        <div
          id="nebula-report"
          className="bg-white text-gray-900 rounded-xl p-8 print:rounded-none print:p-0 print:shadow-none shadow-lg"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-8 pb-6 border-b border-gray-200">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
                  Nebula Components
                </span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 break-all">
                {detail.url}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Audit report generated {formatDate(selectedAudit.completed_at || selectedAudit.created_at)}
              </p>
            </div>
            <div className="text-right shrink-0 ml-6">
              <div
                className="text-5xl font-black leading-none"
                style={{ color: gradeColor(detail.grade) }}
              >
                {detail.grade ?? '—'}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                Score: {detail.score != null ? `${detail.score}/100` : '—'}
              </div>
              {detail.composite != null && (
                <div className="text-xs text-gray-400 mt-0.5">
                  Composite: {detail.composite}
                </div>
              )}
            </div>
          </div>

          {/* Summary row */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="rounded-lg bg-gray-50 p-4">
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">URL</div>
              <div className="text-sm font-medium text-gray-800 break-all">{detail.url}</div>
            </div>
            <div className="rounded-lg bg-gray-50 p-4">
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Grade</div>
              <div
                className="text-xl font-bold"
                style={{ color: gradeColor(detail.grade) }}
              >
                {detail.grade ?? '—'}
              </div>
            </div>
            <div className="rounded-lg bg-gray-50 p-4">
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Audit Date</div>
              <div className="text-sm font-medium text-gray-800">
                {formatDate(selectedAudit.completed_at || selectedAudit.created_at)}
              </div>
            </div>
          </div>

          {/* Findings */}
          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Findings ({detail.findings?.length ?? 0})
            </h2>

            {(!detail.findings || detail.findings.length === 0) ? (
              <p className="text-gray-500 text-sm">No findings recorded for this audit.</p>
            ) : (
              <div className="space-y-4">
                {detail.findings.map((finding: AuditFinding, idx: number) => (
                  <div
                    key={finding.key || idx}
                    className="rounded-lg border border-gray-200 p-5 break-inside-avoid"
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <h3 className="font-semibold text-gray-900">{finding.label || finding.key}</h3>
                      <div className="flex gap-2 shrink-0">
                        {finding.impact != null && (
                          <span className="rounded-full bg-red-100 text-red-700 px-2.5 py-0.5 text-xs font-medium">
                            Impact {finding.impact}
                          </span>
                        )}
                        {finding.effort != null && (
                          <span className="rounded-full bg-blue-100 text-blue-700 px-2.5 py-0.5 text-xs font-medium">
                            Effort {finding.effort}
                          </span>
                        )}
                        {finding.quadrant && (
                          <span className="rounded-full bg-gray-100 text-gray-600 px-2.5 py-0.5 text-xs font-medium capitalize">
                            {finding.quadrant}
                          </span>
                        )}
                      </div>
                    </div>

                    {finding.issue && (
                      <div className="mb-3">
                        <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                          Issue
                        </div>
                        <p className="text-sm text-gray-700">{finding.issue}</p>
                      </div>
                    )}

                    {finding.evidence != null && (
                      <div className="mb-3">
                        <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                          Evidence
                        </div>
                        <div className="text-sm text-gray-700 bg-gray-50 rounded p-3 font-mono whitespace-pre-wrap break-all">
                          {evidenceToString(finding.evidence)}
                        </div>
                      </div>
                    )}

                    {finding.fix && (
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
                          Recommended Fix
                        </div>
                        <p className="text-sm text-gray-700">{finding.fix}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 pt-6 mt-8 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900">Nebula Components</p>
              <p className="text-xs text-gray-400">nebulacomponents.shop</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">
                Report ID: {detail.audit_id}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                View online:{' '}
                <a
                  href={`https://nebulacomponents.shop/audit/${detail.audit_id}/results`}
                  className="text-emerald-600 hover:underline"
                >
                  nebulacomponents.shop/audit/{detail.audit_id}/results
                </a>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Print-only: show placeholder when nothing selected */}
      {!detail && (
        <div className="hidden print:block text-center py-20 text-gray-400">
          No report selected.
        </div>
      )}
    </div>
  )
}
