'use client'

import { useMemo } from 'react'
import type { WorkspaceAudit, AuditDetail } from './WorkspaceClient'

// ── Helpers ───────────────────────────────────────────────────────────

function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

function pathKey(url: string): string {
  try {
    const u = new URL(url)
    return `${u.hostname.replace(/^www\./, '')}${u.pathname.replace(/\/$/, '')}`
  } catch {
    return url
  }
}

function displayUrl(url: string): string {
  try {
    const u = new URL(url)
    return `${u.hostname.replace(/^www\./, '')}${u.pathname === '/' ? '' : u.pathname}`
  } catch {
    return url
  }
}

function fmtDate(iso?: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function scoreOf(a: WorkspaceAudit): number {
  return a.composite ?? a.score ?? 0
}

function severityCounts(findings: AuditDetail['findings']) {
  const counts = { critical: 0, warning: 0, advisory: 0 }
  for (const f of findings || []) {
    if (f.impact >= 8) counts.critical += 1
    else if (f.impact >= 5) counts.warning += 1
    else counts.advisory += 1
  }
  return counts
}

// Sparkline — plain SVG polyline, no chart library.
function Sparkline({ points, width = 260, height = 64 }: { points: number[]; width?: number; height?: number }) {
  if (points.length < 2) return null
  const min = Math.min(...points)
  const max = Math.max(...points)
  const range = max - min || 1
  const step = width / (points.length - 1)
  const coords = points.map((p, i) => {
    const x = i * step
    const y = height - 6 - ((p - min) / range) * (height - 14)
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })
  const area = `M0,${height} L${coords.join(' L')} L${width},${height} Z`
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible" aria-hidden="true">
      <path d={area} fill="rgba(16,185,129,0.10)" />
      <polyline
        points={coords.join(' ')}
        fill="none"
        stroke="#10B981"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {points.map((p, i) => (
        <circle key={i} cx={(i * step).toFixed(1)} cy={(height - 6 - ((p - min) / range) * (height - 14)).toFixed(1)} r="3" fill="#10B981" />
      ))}
    </svg>
  )
}

// ── Dashboard ─────────────────────────────────────────────────────────

export function DashboardView({ audits, latestDetail }: { audits: WorkspaceAudit[]; latestDetail: AuditDetail | null }) {
  const sorted = useMemo(
    () => [...audits].sort((a, b) => (b.created_at || '').localeCompare(a.created_at || '')),
    [audits]
  )
  const latest = sorted[0]
  const previous = sorted[1]

  const delta = useMemo(() => {
    if (!latest || !previous) return null
    const a = scoreOf(latest)
    const b = scoreOf(previous)
    // Only compare when both audits are for the same page
    if (pathKey(latest.url) !== pathKey(previous.url)) return null
    return Math.round((a - b) * 10) / 10
  }, [latest, previous])

  const trendPoints = useMemo(() => {
    if (!latest) return []
    const key = pathKey(latest.url)
    return sorted
      .filter((a) => pathKey(a.url) === key)
      .reverse()
      .map((a) => scoreOf(a))
  }, [sorted, latest])

  const counts = severityCounts(latestDetail?.findings || [])
  const latestUrl = latest ? displayUrl(latest.url) : '—'

  if (!latest) {
    return (
      <div className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-10 text-center">
        <h2 className="text-xl font-bold mb-2">No audits yet</h2>
        <p className="text-gray-400 mb-6 max-w-md mx-auto">
          Run your first free audit — your score, findings, and history will appear here.
        </p>
        <a
          href="/audit"
          className="inline-block rounded-lg bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-black hover:bg-emerald-400 transition-colors"
        >
          Run free audit
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Row 1: score + issues + latest audit */}
      <div className="grid md:grid-cols-3 gap-4">
        <section className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-6">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Overall score</p>
          <div className="flex items-end gap-3">
            <span className="text-5xl font-bold text-emerald-400">
              {Math.round(scoreOf(latest) * 10)}
            </span>
            <span className="text-gray-500 mb-1">/100</span>
          </div>
          {delta !== null ? (
            <p className={`mt-2 text-sm ${delta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {delta >= 0 ? '↑' : '↓'} {Math.abs(delta).toFixed(1)} since last audit
            </p>
          ) : (
            <p className="mt-2 text-sm text-gray-500">First audit — baseline set</p>
          )}
          {trendPoints.length >= 2 && (
            <div className="mt-4">
              <Sparkline points={trendPoints} />
              <p className="text-xs text-gray-500 mt-1">Score over {trendPoints.length} audits</p>
            </div>
          )}
        </section>

        <section className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-6">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Findings</p>
          <div className="flex gap-6 mt-2">
            <div>
              <p className="text-3xl font-bold text-red-400">{counts.critical}</p>
              <p className="text-xs text-gray-500">Critical</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-amber-400">{counts.warning}</p>
              <p className="text-xs text-gray-500">Warnings</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-400">{counts.advisory}</p>
              <p className="text-xs text-gray-500">Advisory</p>
            </div>
          </div>
          <p className="mt-3 text-xs text-gray-500">
            From the latest audit ({latestDetail ? Math.round((latestDetail.composite ?? latestDetail.score) * 10) : '—'}/100)
          </p>
        </section>

        <section className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-6 flex flex-col">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Latest audit</p>
          <p className="text-lg font-semibold text-white">{latestUrl}</p>
          <p className="text-sm text-gray-400">
            {fmtDate(latest.completed_at || latest.created_at)} · Grade {latest.grade || '—'}
          </p>
          <a
            href={`/audit/${latest.id}/results`}
            className="mt-auto pt-4 inline-flex items-center text-sm text-emerald-400 hover:text-emerald-300"
          >
            Review →
          </a>
        </section>
      </div>

      {/* Row 2: suggested next audit + plan */}
      <div className="grid md:grid-cols-2 gap-4">
        <section className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-6">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Suggested next audit</p>
          <p className="text-gray-300 mb-4">
            Re-run the audit on <span className="text-white font-medium">{latestUrl}</span> to
            verify fixes or catch regressions. New runs become new versions in your history.
          </p>
          <a
            href={`/audit?url=${encodeURIComponent(latest.url)}`}
            className="inline-block rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-black hover:bg-emerald-400 transition-colors"
          >
            Run follow-up audit →
          </a>
        </section>

        <section className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-6">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-2">Plan</p>
          <p className="text-lg font-semibold text-white">Pay-per-fix</p>
          <p className="text-sm text-gray-400 mt-1">
            Free audits included. The{' '}
            <a href="/pricing" className="text-emerald-400 hover:underline">$97 One-Leak Repair Sprint</a>{' '}
            implements your highest-confidence fix when you are ready.
          </p>
        </section>
      </div>
    </div>
  )
}

// ── Audits (immutable versions) ───────────────────────────────────────

export function AuditsView({ audits }: { audits: WorkspaceAudit[] }) {
  const byPath = useMemo(() => {
    const map = new Map<string, WorkspaceAudit[]>()
    for (const a of audits) {
      const key = pathKey(a.url)
      const arr = map.get(key) || []
      arr.push(a)
      map.set(key, arr)
    }
    for (const arr of map.values()) {
      arr.sort((a, b) => (a.created_at || '').localeCompare(b.created_at || ''))
    }
    return [...map.entries()].sort(
      (a, b) => (b[1][b[1].length - 1].created_at || '').localeCompare(a[1][a[1].length - 1].created_at || '')
    )
  }, [audits])

  if (audits.length === 0) {
    return (
      <div className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-10 text-center">
        <h2 className="text-xl font-bold mb-2">No audit history yet</h2>
        <p className="text-gray-400 mb-6">
          Every audit you run is preserved forever — like Git commits for your landing page.
        </p>
        <a
          href="/audit"
          className="inline-block rounded-lg bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-black hover:bg-emerald-400 transition-colors"
        >
          Run first audit
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <p className="text-sm text-gray-400">
        Every audit is immutable — old versions are never overwritten, so you can always see
        where a page started.
      </p>
      {byPath.map(([key, versions]) => (
        <section key={key} className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">{displayUrl(versions[0].url)}</h2>
            <span className="text-xs text-gray-500 border border-gray-700 rounded-full px-3 py-1">
              {versions.length} {versions.length === 1 ? 'version' : 'versions'}
            </span>
          </div>
          <ol className="space-y-3">
            {versions.map((v, i) => (
              <li key={v.id}>
                <a
                  href={`/audit/${v.id}/results`}
                  className="flex items-center justify-between rounded-lg border border-gray-800 bg-[#0d0d0d] px-4 py-3 hover:border-emerald-800 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <span className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center text-sm font-bold text-gray-300">
                      v{i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-white">
                        {Math.round(scoreOf(v) * 10)}/100
                        {v.grade ? <span className="text-gray-500 ml-2">Grade {v.grade}</span> : null}
                      </p>
                      <p className="text-xs text-gray-500">{fmtDate(v.completed_at || v.created_at)}</p>
                    </div>
                  </div>
                  <span className="text-emerald-400 text-sm">View →</span>
                </a>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  )
}

// ── Projects (domain grouping) ────────────────────────────────────────

export function ProjectsView({ audits }: { audits: WorkspaceAudit[] }) {
  const projects = useMemo(() => {
    const map = new Map<string, WorkspaceAudit[]>()
    for (const a of audits) {
      const domain = domainOf(a.url)
      const arr = map.get(domain) || []
      arr.push(a)
      map.set(domain, arr)
    }
    return [...map.entries()]
      .map(([domain, list]) => {
        const latest = [...list].sort((a, b) =>
          (b.created_at || '').localeCompare(a.created_at || '')
        )[0]
        const paths = new Set(list.map((a) => displayUrl(a.url)))
        return { domain, count: list.length, paths: [...paths], latest }
      })
      .sort((a, b) => (b.latest.created_at || '').localeCompare(a.latest.created_at || ''))
  }, [audits])

  if (audits.length === 0) {
    return (
      <div className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-10 text-center">
        <h2 className="text-xl font-bold mb-2">No projects yet</h2>
        <p className="text-gray-400 mb-6">Audited pages group into projects by domain automatically.</p>
        <a
          href="/audit"
          className="inline-block rounded-lg bg-emerald-500 px-6 py-2.5 text-sm font-semibold text-black hover:bg-emerald-400 transition-colors"
        >
          Run first audit
        </a>
      </div>
    )
  }

  return (
    <div className="grid md:grid-cols-2 gap-4">
      {projects.map((project) => (
        <section key={project.domain} className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-semibold text-white">{project.domain}</h2>
            <span className="text-2xl font-bold text-emerald-400">
              {Math.round(scoreOf(project.latest) * 10)}
            </span>
          </div>
          <p className="text-xs text-gray-500 mb-4">
            {project.paths.length} {project.paths.length === 1 ? 'page' : 'pages'} ·{' '}
            {project.count} {project.count === 1 ? 'audit' : 'audits'} · last{' '}
            {fmtDate(project.latest.completed_at || project.latest.created_at)}
          </p>
          <ul className="space-y-1 mb-4">
            {project.paths.slice(0, 4).map((path) => (
              <li key={path} className="text-sm text-gray-400 truncate">
                {path}
              </li>
            ))}
            {project.paths.length > 4 && (
              <li className="text-xs text-gray-500">+{project.paths.length - 4} more</li>
            )}
          </ul>
          <a
            href={`/audit?url=${encodeURIComponent(project.latest.url)}`}
            className="text-sm text-emerald-400 hover:text-emerald-300"
          >
            Run follow-up →
          </a>
        </section>
      ))}
    </div>
  )
}
