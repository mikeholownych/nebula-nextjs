'use client'

import { useEffect, useMemo, useState } from 'react'
import type { WorkspaceAudit } from './WorkspaceClient'

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
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
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
  const display = value !== null ? Math.round(value) : '—'

  return (
    <div className="rounded-2xl border border-border bg-bg-elevated p-5 flex flex-col items-center gap-3 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
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
        <text x={40} y={44} textAnchor="middle" fontSize={18} fontWeight="700" fill="currentColor" className="text-fg">
          {display}
        </text>
      </svg>
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-fg-dim">{label}</p>
        {sub && <p className="mt-0.5 text-[11px] text-fg-muted">{sub}</p>}
      </div>
    </div>
  )
}

// ── Score bar ─────────────────────────────────────────────────────────

function ScoreBar({ score }: { score: number }) {
  const pct = Math.min(Math.max(score, 0), 100)
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 rounded-full bg-border overflow-hidden">
        <div
          className="h-full rounded-full bg-[#00c2a0]"
          style={{ width: `${pct}%` }}
          aria-hidden="true"
        />
      </div>
      <span className="text-xs tabular-nums text-fg">{Math.round(score)}/100</span>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────

export default function PagesView({ audits }: { audits: WorkspaceAudit[] }) {
  const [search, setSearch] = useState('')
  const [keywords, setKeywords] = useState<Record<string, string>>({})
  const [sitemapPages, setSitemapPages] = useState<SitemapPage[]>([])

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
      .catch(() => {}) // Non-fatal — sitemap discovery is optional
    return () => { cancelled = true }
  }, [])

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

  const isScored = (a: WorkspaceAudit) => a.status === 'completed' && a.score !== null

  if (audits.length === 0 && sitemapPages.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-bg-elevated p-10 text-center shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-fg-dim">No pages yet</p>
        <h2 className="text-xl font-semibold tracking-[-0.02em] text-fg">Your topical map starts here</h2>
        <p className="mx-auto mb-6 mt-2 max-w-md text-sm leading-6 text-fg-muted">
          Each page you audit appears here — with scores, keywords, and a history you can build on.
        </p>
        <a
          href="/audit"
          className="inline-flex rounded-lg bg-[#00c2a0] px-5 py-2.5 text-sm font-semibold text-bg hover:bg-[#00a88a] transition-colors"
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
          color="#00c2a0"
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

      {/* Domain header + search */}
      <div className="rounded-2xl border border-border bg-bg-elevated p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-fg-dim">Site</p>
            <h2 className="mt-1 text-base font-semibold text-fg">
              {primaryDomain ?? '—'}
              <span className="ml-2 text-sm text-fg-muted font-normal">
                {uniquePages.length} {uniquePages.length === 1 ? 'page' : 'pages'}
              </span>
            </h2>
          </div>
          <input
            type="search"
            placeholder="Filter by URL…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="rounded-lg border border-border bg-bg px-3 py-2 text-sm text-fg placeholder:text-fg-dim focus:outline-none focus:ring-1 focus:ring-[#00c2a0] w-full sm:w-64"
            aria-label="Filter pages by URL"
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm" aria-label="Pages table">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-2 pr-4 text-xs font-semibold uppercase tracking-[0.12em] text-fg-dim">Page</th>
                <th className="pb-2 pr-4 text-xs font-semibold uppercase tracking-[0.12em] text-fg-dim">Target Keyword</th>
                <th className="pb-2 pr-4 text-xs font-semibold uppercase tracking-[0.12em] text-fg-dim">Score</th>
                <th className="pb-2 pr-4 text-xs font-semibold uppercase tracking-[0.12em] text-fg-dim">Last Audited</th>
                <th className="pb-2 text-xs font-semibold uppercase tracking-[0.12em] text-fg-dim">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredPages.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-sm text-fg-muted">
                    No pages match your filter.
                  </td>
                </tr>
              ) : (
                filteredPages.map((a) => {
                  const key = pathKeyOf(a.url)
                  const name = basenameOf(a.url)
                  const scored = isScored(a)
                  const scoreVal = scored && a.score !== null ? a.score * 10 : null
                  const kw = keywords[key] ?? ''
                  return (
                    <tr key={key} className="border-b border-border last:border-0 hover:bg-bg-panel/50 transition-colors">
                      <td className="py-3 pr-4">
                        <p className="font-medium text-fg truncate max-w-[180px]">{name}</p>
                        <p className="text-[11px] text-fg-muted truncate max-w-[220px]">{a.url}</p>
                      </td>
                      <td className="py-3 pr-4">
                        <input
                          type="text"
                          placeholder="Add keyword…"
                          value={kw}
                          onChange={(e) => setKeywords((prev) => ({ ...prev, [key]: e.target.value }))}
                          className="rounded-md border border-border bg-bg px-2 py-1 text-xs text-fg placeholder:text-fg-dim focus:outline-none focus:ring-1 focus:ring-[#00c2a0] w-32"
                          aria-label={`Target keyword for ${name}`}
                        />
                      </td>
                      <td className="py-3 pr-4">
                        {scoreVal !== null ? (
                          <ScoreBar score={scoreVal} />
                        ) : (
                          <span className="text-fg-muted text-xs">—</span>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-xs text-fg-muted whitespace-nowrap">
                        {fmtDate(a.completed_at || a.created_at)}
                      </td>
                      <td className="py-3">
                        {scored ? (
                          <a
                            href={`/audit/${a.id}/results`}
                            className="rounded-lg border border-[#00c2a0] px-3 py-1.5 text-xs font-semibold text-[#00c2a0] hover:bg-[#00c2a0]/10 transition-colors whitespace-nowrap"
                          >
                            View results
                          </a>
                        ) : (
                          <a
                            href={`/audit?url=${encodeURIComponent(a.url)}`}
                            className="rounded-lg border border-border bg-bg-panel px-3 py-1.5 text-xs font-semibold text-fg hover:bg-bg-elevated transition-colors whitespace-nowrap"
                          >
                            Run audit
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
