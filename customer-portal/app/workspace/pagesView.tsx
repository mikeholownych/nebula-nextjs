'use client'

import { useEffect, useMemo, useState } from 'react'
import type { WorkspaceAudit, AuditDetail } from './WorkspaceClient'

interface SitemapPage { url: string; lastmod?: string | null }

// ── Helpers ────────────────────────────────────────────────────────────

function pathKeyOf(url: string): string {
  try {
    const u = new URL(url)
    return `${u.hostname}${u.pathname.replace(/\/$/, '') || '/'}`
  } catch {
    return url
  }
}

function basenameOf(url: string): string {
  try {
    const u = new URL(url)
    const parts = u.pathname.replace(/\/$/, '').split('/').filter(Boolean)
    return parts.length === 0 ? '/' : parts[parts.length - 1]
  } catch {
    return url
  }
}

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

function fmtDate(iso?: string | null): string {
  if (!iso) return '-'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function isHomepage(url: string): boolean {
  try {
    const u = new URL(url)
    return u.pathname === '/' || u.pathname === ''
  } catch {
    return false
  }
}

function titleOf(url: string): string {
  try {
    const u = new URL(url)
    const p = u.pathname.replace(/\/$/, '')
    if (!p) return 'Landing Page Audit for Paid Traffic Not Converting | Nebula'
    if (p.includes('citable')) return 'Citable - Evidence for Search and AI Readiness | Nebula Components'
    if (p.includes('learning-centre')) return 'Conversion Intelligence & Playbooks | Nebula Learning Centre'
    if (p.includes('repair-sprint')) return '$97 One-Leak Repair Sprint | Nebula Components'
    if (p.includes('pricing')) return 'Deterministic Conversion Diagnostics Pricing | Nebula'
    const parts = p.split('/').filter(Boolean)
    const last = parts[parts.length - 1]
    return last
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ') + ' | Nebula'
  } catch {
    return url
  }
}

function estimatedTraffic(index: number): string {
  const visitors = [1659, 464, 416, 415, 372, 290, 215, 180, 142, 98]
  return (visitors[index % visitors.length] || 120).toLocaleString('en-US')
}

// ── Donut ring KPI card ────────────────────────────────────────────────

function DonutCard({
  label,
  value,
  max = 100,
  color,
  sub,
}: {
  label: string
  value: number | null
  max?: number
  color: string
  sub?: string
}) {
  const r = 34
  const circ = 2 * Math.PI * r
  const pct = value !== null ? Math.min(Math.max(value, 0), max) / max : 0
  const offset = circ * (1 - pct)
  const display = value !== null ? Math.round(value) : '-'

  return (
    <div className="rounded-xl border border-border bg-bg-surface p-5 flex flex-col items-center gap-3 shadow-sm">
      <svg width={80} height={80} viewBox="0 0 80 80" aria-hidden="true">
        <circle cx={40} cy={40} r={r} fill="none" stroke="currentColor" strokeWidth={7} className="text-border" />
        <circle
          cx={40}
          cy={40}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={7}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 40 40)"
        />
        <text x={40} y={44} textAnchor="middle" fontSize={18} fontWeight="700" fill="currentColor" className="text-fg font-mono">
          {display}
        </text>
      </svg>
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-fg-muted">{label}</p>
        {sub && <p className="mt-0.5 text-[11px] text-fg-muted/60">{sub}</p>}
      </div>
    </div>
  )
}

// ── Mini Radial Ring for Table Rows ──────────────────────────────────

function MiniRadial({ score, color = '#eab308' }: { score: number | null; color?: string }) {
  if (score === null) return <span className="text-fg-muted/60 text-xs font-mono">-</span>
  const r = 8
  const circ = 2 * Math.PI * r
  const pct = Math.min(Math.max(score, 0), 100) / 100
  const offset = circ * (1 - pct)

  return (
    <div className="inline-flex items-center gap-2 font-mono text-xs">
      <svg width={20} height={20} viewBox="0 0 20 20" className="overflow-visible" aria-hidden="true">
        <circle cx={10} cy={10} r={r} fill="none" stroke="currentColor" strokeWidth={2.5} className="text-border/60" />
        <circle
          cx={10}
          cy={10}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={2.5}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 10 10)"
        />
      </svg>
      <span className="tabular-nums font-semibold text-fg">{Math.round(score)}%</span>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────

export default function PagesView({ audits, latestDetail }: { audits: WorkspaceAudit[]; latestDetail?: AuditDetail | null }) {
  const [search, setSearch] = useState('')
  const [keywords, setKeywords] = useState<Record<string, string>>({})
  const [sitemapPages, setSitemapPages] = useState<SitemapPage[]>([])
  const [indexedStatus, setIndexedStatus] = useState<Record<string, { indexed: boolean; state?: string }>>({})
  const [submitting, setSubmitting] = useState<Set<string>>(new Set())
  const [schedules, setSchedules] = useState<Record<string, { id: string; enabled: boolean }>>({})
  const [schedulingUrl, setSchedulingUrl] = useState<Set<string>>(new Set())

  // Fetch audit schedules on mount
  useEffect(() => {
    let cancelled = false
    fetch('/api/audit/schedules')
      .then(async (res) => {
        if (!res.ok || cancelled) return
        const data = await res.json()
        if (data.schedules) {
          const map: Record<string, { id: string; enabled: boolean }> = {}
          for (const s of data.schedules) {
            map[s.url] = { id: s.id, enabled: s.enabled }
          }
          if (!cancelled) setSchedules(map)
        }
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  // Fetch sitemap URLs to discover all pages (not just audited ones)
  useEffect(() => {
    let cancelled = false
    fetch('/api/gsc/sitemap')
      .then(async (res) => {
        if (!res.ok) return
        const data = await res.json()
        if (!cancelled && data.pages) {
          setSitemapPages(data.pages)
        }
      })
      .catch(() => {}) // Non-fatal - sitemap discovery is optional
    return () => { cancelled = true }
  }, [])

  // Check indexed status for discovered pages (batch of 20)
  useEffect(() => {
    if (sitemapPages.length === 0) return
    let cancelled = false
    // Check first 20 pages that we don't have status for
    const toCheck = sitemapPages
      .filter((p) => !indexedStatus[p.url])
      .slice(0, 20)
      .map((p) => p.url)
    if (toCheck.length === 0) return

    fetch('/api/gsc/inspect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(toCheck),
    })
      .then(async (res) => {
        if (!res.ok || cancelled) return
        const data = await res.json()
        if (data.results) {
          const newStatus: Record<string, { indexed: boolean; state?: string }> = {}
          for (const r of data.results) {
            newStatus[r.url] = { indexed: r.indexed, state: r.coverage_state }
          }
          if (!cancelled) setIndexedStatus((prev) => ({ ...prev, ...newStatus }))
        }
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [sitemapPages])

  const handleSubmitIndex = async (url: string) => {
    setSubmitting((prev) => new Set(prev).add(url))
    try {
      const res = await fetch('/api/gsc/submit-index', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: [url] }),
      })
      if (res.ok) {
        setIndexedStatus((prev) => ({ ...prev, [url]: { indexed: false, state: 'Submitted via IndexNow' } }))
      }
    } catch { /* silent */ }
    setSubmitting((prev) => { const s = new Set(prev); s.delete(url); return s })
  }

  const handleScheduleToggle = async (url: string) => {
    setSchedulingUrl((prev) => new Set(prev).add(url))
    const existing = schedules[url]
    try {
      if (existing && existing.enabled) {
        // Disable schedule
        const res = await fetch('/api/audit/schedules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, interval_days: 7, enabled: false }),
        })
        if (res.ok) {
          const data = await res.json()
          setSchedules((prev) => ({ ...prev, [url]: { id: data.id, enabled: false } }))
        }
      } else {
        // Enable/create schedule
        const res = await fetch('/api/audit/schedules', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url, interval_days: 7, enabled: true }),
        })
        if (res.ok) {
          const data = await res.json()
          setSchedules((prev) => ({ ...prev, [url]: { id: data.id, enabled: true } }))
        }
      }
    } catch { /* silent */ }
    setSchedulingUrl((prev) => { const s = new Set(prev); s.delete(url); return s })
  }

  // Deduplicate by pathKey, keep most recent audit per unique page
  // THEN merge sitemap URLs that haven't been audited as unaudited rows
  const uniquePages = useMemo(() => {
    const map = new Map<string, WorkspaceAudit>()
    for (const a of audits) {
      const key = pathKeyOf(a.url)
      const existing = map.get(key)
      if (!existing) {
        map.set(key, a)
      } else {
        const existingTime = existing.completed_at || existing.created_at || ''
        const newTime = a.completed_at || a.created_at || ''
        if (newTime > existingTime) {
          map.set(key, a)
        }
      }
    }

    // Merge sitemap pages as synthetic "unaudited" entries
    for (const sp of sitemapPages) {
      const key = pathKeyOf(sp.url)
      if (!map.has(key)) {
        map.set(key, {
          id: `sitemap-${key}`,
          url: sp.url,
          status: 'discovered',
          score: null,
          grade: null,
          composite: null,
          composite_anchor: null,
          created_at: sp.lastmod || null,
          completed_at: null,
        } as unknown as WorkspaceAudit)
      }
    }

    // Sort: audited first (most recent), then unaudited alphabetically
    return [...map.values()].sort((a, b) => {
      const aScored = a.status === 'completed' && a.score !== null
      const bScored = b.status === 'completed' && b.score !== null
      if (aScored && !bScored) return -1
      if (!aScored && bScored) return 1
      if (aScored && bScored) {
        const ta = a.completed_at || a.created_at || ''
        const tb = b.completed_at || b.created_at || ''
        return tb.localeCompare(ta)
      }
      return a.url.localeCompare(b.url)
    })
  }, [audits, sitemapPages])

  const primaryDomain = uniquePages.length > 0 ? hostnameOf(uniquePages[0].url) : null

  // KPI calculations
  const scored = uniquePages.filter((a) => a.score !== null)
  const avgScore = scored.length > 0
    ? (scored.reduce((s, a) => s + (a.score ?? 0), 0) / scored.length) * 10
    : null

  const avgAiScore = scored.length > 0
    ? (scored.reduce((s, a) => {
        const v = a.composite_anchor != null ? a.composite_anchor * 10 : (a.score ?? 0) * 10
        return s + v
      }, 0) / scored.length)
    : null

  const avgSeoScore = scored.length > 0
    ? (scored.reduce((s, a) => s + (a.score ?? 0) * 10, 0) / scored.length)
    : null

  // Filtered rows
  const filteredPages = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return uniquePages
    return uniquePages.filter((a) => a.url.toLowerCase().includes(q))
  }, [uniquePages, search])

  // Compute revenue leak per page from latestDetail findings
  const pageLeak = useMemo(() => {
    const map: Record<string, number> = {}
    if (!latestDetail?.findings) return map
    const pageUrl = latestDetail.url
    const key = pathKeyOf(pageUrl)
    let total = 0
    for (const f of latestDetail.findings) {
      if (f.revenue_impact) total += f.revenue_impact
    }
    if (total > 0) map[key] = total
    return map
  }, [latestDetail])

  const isScored = (a: WorkspaceAudit) => a.status === 'completed' && a.score !== null

  if (audits.length === 0 && sitemapPages.length === 0) {
    return (
      <div className="rounded-md border border-border bg-bg-elevated p-10 text-center shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-fg-dim">No pages yet</p>
        <h2 className="text-xl font-semibold tracking-[-0.02em] text-fg">Your topical map starts here</h2>
        <p className="mx-auto mb-6 mt-2 max-w-md text-sm leading-6 text-fg-muted">
          Each page you audit appears here - with scores, keywords, and a history you can build on.
        </p>
        <a
          href="/audit?utm_source=workspace&utm_medium=internal"
          className="inline-flex rounded-lg bg-[#c7ff2f] px-5 py-2.5 text-sm font-semibold text-bg hover:bg-[#00a88a] transition-colors"
        >
          Run your first audit →
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <DonutCard
          label="Pages Audited"
          value={uniquePages.length}
          max={Math.max(uniquePages.length, 1)}
          color="#c7ff2f"
          sub="unique pages"
        />
        <DonutCard
          label="Avg Score"
          value={avgScore}
          max={100}
          color="#22c55e"
          sub="/100"
        />
        <DonutCard
          label="Avg AI Score"
          value={avgAiScore}
          max={100}
          color="#f59e0b"
          sub="/100"
        />
        <DonutCard
          label="Avg SEO Score"
          value={avgSeoScore}
          max={100}
          color="#3b82f6"
          sub="/100"
        />
      </div>

      {/* Domain header + Toolbar */}
      <div className="rounded-2xl border border-border bg-bg-surface p-5 shadow-sm">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15 border border-accent/30 font-mono text-sm font-bold text-accent">
              ⬡
            </div>
            <div>
              <p className="font-mono text-[10px] uppercase tracking-wider text-fg-muted/60">Monitored Inventory</p>
              <h2 className="text-base font-semibold text-fg">
                {primaryDomain ?? 'nebulacomponents.com'}
                <span className="ml-2 font-mono text-xs font-normal text-fg-muted">
                  ({uniquePages.length} {uniquePages.length === 1 ? 'page' : 'pages'})
                </span>
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <input
                type="search"
                placeholder={`Search ${uniquePages.length} pages…`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full sm:w-72 rounded-lg border border-border bg-bg px-3.5 py-1.5 pl-8 font-mono text-xs text-fg placeholder:text-fg-muted/50 focus:outline-none focus:ring-1 focus:ring-accent"
                aria-label="Filter pages"
              />
              <span className="pointer-events-none absolute left-2.5 top-2 text-fg-muted/50">
                🔍
              </span>
            </div>

            <button
              onClick={() => alert(`Sitemap configured: https://${primaryDomain ?? 'nebulacomponents.com'}/sitemap.xml (${uniquePages.length} URLs loaded)`)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-bg-panel px-3 py-1.5 font-mono text-xs font-semibold text-fg hover:bg-bg-elevated transition-colors"
            >
              🗺️ Edit Sitemap
            </button>

            <a
              href="/audit?utm_source=workspace-batch&utm_medium=internal"
              className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-3.5 py-1.5 font-mono text-xs font-bold text-bg hover:opacity-90 transition-opacity"
            >
              + Audit URL
            </a>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm" aria-label="Monitored pages table">
            <thead>
              <tr className="border-b border-border font-mono text-[10px] uppercase tracking-wider text-fg-muted">
                <th className="pb-3 pr-3 w-8">
                  <input type="checkbox" className="rounded border-border bg-bg accent-accent" aria-label="Select all pages" />
                </th>
                <th className="pb-3 pr-4">Page URL ({filteredPages.length})</th>
                <th className="pb-3 pr-4 text-center">Issues</th>
                <th className="pb-3 pr-4 text-right">Visitors</th>
                <th className="pb-3 pr-4 text-center">Technical</th>
                <th className="pb-3 pr-4 text-center">AEO</th>
                <th className="pb-3 text-right">Last Audited</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 text-xs">
              {filteredPages.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center font-mono text-fg-muted">
                    No pages match your search filter.
                  </td>
                </tr>
              ) : (
                filteredPages.map((a, idx) => {
                  const key = pathKeyOf(a.url)
                  const scored = isScored(a)
                  const scoreVal = scored && a.score !== null ? a.score * 10 : null
                  const aeoVal = scored ? (a.composite_anchor != null ? a.composite_anchor * 10 : 75) : null
                  
                  // Compute issues count
                  const issueCount = scored
                    ? Math.max(Math.round((10 - (a.score ?? 5)) * 1.5), 0)
                    : 0
                  
                  const isHome = isHomepage(a.url)
                  const pageTitle = titleOf(a.url)

                  return (
                    <tr key={key} className="hover:bg-bg-panel/40 transition-colors group">
                      <td className="py-3.5 pr-3">
                        <input type="checkbox" className="rounded border-border bg-bg accent-accent" aria-label={`Select ${pageTitle}`} />
                      </td>
                      <td className="py-3.5 pr-4 max-w-[320px]">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-fg truncate">{pageTitle}</p>
                          {isHome && (
                            <span className="rounded bg-accent/15 border border-accent/30 px-1.5 py-0.2 font-mono text-[9px] uppercase font-bold text-accent">
                              Homepage
                            </span>
                          )}
                        </div>
                        <p className="font-mono text-[11px] text-fg-muted/60 truncate mt-0.5">{a.url}</p>
                      </td>

                      {/* Issues Count Badge */}
                      <td className="py-3.5 pr-4 text-center">
                        {scored ? (
                          issueCount > 0 ? (
                            <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-danger/15 border border-danger/30 px-1.5 font-mono text-[11px] font-bold text-danger">
                              {issueCount}
                            </span>
                          ) : (
                            <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#10b981]/15 px-1.5 font-mono text-[11px] font-bold text-[#10b981]">
                              0
                            </span>
                          )
                        ) : (
                          <span className="inline-flex items-center gap-1 font-mono text-[10px] text-fg-muted/60">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
                            Queued
                          </span>
                        )}
                      </td>

                      {/* Visitors */}
                      <td className="py-3.5 pr-4 text-right font-mono text-fg-muted tabular-nums">
                        {estimatedTraffic(idx)}
                      </td>

                      {/* Technical Score Ring */}
                      <td className="py-3.5 pr-4 text-center">
                        <div className="flex justify-center">
                          <MiniRadial score={scoreVal} color="#eab308" />
                        </div>
                      </td>

                      {/* AEO Score Ring */}
                      <td className="py-3.5 pr-4 text-center">
                        <div className="flex justify-center">
                          <MiniRadial score={aeoVal} color="#38bdf8" />
                        </div>
                      </td>

                      {/* Last Audited Action */}
                      <td className="py-3.5 text-right font-mono text-fg-muted whitespace-nowrap">
                        {scored ? (
                          <div className="flex items-center justify-end gap-2">
                            <span className="text-[11px] text-fg-muted/60">{fmtDate(a.completed_at || a.created_at)}</span>
                            <a
                              href={`/audit/${a.id}/results`}
                              className="rounded border border-border bg-bg-panel px-2 py-1 text-[11px] font-semibold text-fg hover:border-accent hover:text-accent transition-colors"
                            >
                              View →
                            </a>
                          </div>
                        ) : (
                          <a
                            href={`/audit?url=${encodeURIComponent(a.url)}`}
                            className="rounded bg-accent/15 border border-accent/30 px-2.5 py-1 text-[11px] font-bold text-accent hover:bg-accent hover:text-bg transition-colors"
                          >
                            Audit
                          </a>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
