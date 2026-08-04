'use client'

import { useMemo } from 'react'
import type { WorkspaceAudit, AuditDetail } from './WorkspaceClient'
import GscWidget from './gscWidget'

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

export function DashboardView({ audits, latestDetail, email }: { audits: WorkspaceAudit[]; latestDetail: AuditDetail | null; email?: string }) {
  const sorted = useMemo(
    () => [...audits].sort((a, b) => (b.created_at || '').localeCompare(a.created_at || '')),
    [audits]
  )
  const latest = sorted[0]
  const previous = sorted[1]
  const delta = useMemo(() => {
    if (!latest || !previous || pathKey(latest.url) !== pathKey(previous.url)) return null
    // Scores are 0–10 internally; display deltas in /100 units to match the card value
    return Math.round((scoreOf(latest) - scoreOf(previous)) * 10)
  }, [latest, previous])
  const trendPoints = useMemo(() => {
    if (!latest) return []
    const key = pathKey(latest.url)
    return sorted.filter((a) => pathKey(a.url) === key).reverse().map(scoreOf)
  }, [sorted, latest])
  const counts = severityCounts(latestDetail?.findings || [])
  const latestUrl = latest ? displayUrl(latest.url) : '—'
  const auditedPages = new Set(audits.map((audit) => pathKey(audit.url))).size

  if (!latest) {
    return (
      <div className="rounded-2xl border border-border bg-bg-elevated p-10 text-center shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-fg-dim">Your workspace is ready</p>
        <h2 className="text-xl font-semibold tracking-[-0.02em] text-fg">Start with a real page diagnosis</h2>
        <p className="mx-auto mb-6 mt-2 max-w-md text-sm leading-6 text-fg-muted">Run a free audit to establish your first baseline. Scores, findings, and history will appear here without fabricated data.</p>
        <a href="/audit" className="inline-flex rounded-lg bg-bg-panel px-5 py-2.5 text-sm font-semibold text-fg hover:bg-bg-panel">Run first audit</a>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Latest score" value={`${Math.round(scoreOf(latest) * 10)}/100`} detail={delta === null ? 'Baseline established' : `${scoreOf(latest).toFixed(1)}/10 · ${delta >= 0 ? '+' : ''}${Number.isInteger(delta) ? delta : delta.toFixed(1)} since last audit`} tone={delta !== null && delta < 0 ? 'red' : 'dark'} />
        <MetricCard label="Critical findings" value={String(counts.critical)} detail={`${counts.warning} warnings · ${counts.advisory} advisory`} tone={counts.critical > 0 ? 'red' : 'dark'} />
        <MetricCard label="Audited pages" value={String(auditedPages)} detail={`${audits.length} total audit versions`} tone="dark" />
        <MetricCard label="Last audit" value={fmtDate(latest.completed_at || latest.created_at)} detail={latest.grade ? `Grade ${latest.grade}` : 'Completed'} tone="dark" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.45fr_0.85fr]">
        <section className="rounded-2xl border border-border bg-bg-elevated p-6 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-fg-dim">Page health</p>
              <h2 className="mt-2 text-lg font-semibold tracking-[-0.02em] text-fg">{latestUrl}</h2>
              <p className="mt-1 text-sm text-fg-muted">Latest measured score and movement for this page.</p>
            </div>
            <a href={`/audit/${latest.id}/results`} className="rounded-lg border border-border px-3 py-2 text-xs font-semibold text-fg-muted hover:border-border hover:bg-bg-panel">Open report ↗</a>
          </div>
          <div className="mt-8 flex items-end gap-6">
            <div>
              <span className="text-6xl font-semibold tracking-[-0.06em] text-fg">{Math.round(scoreOf(latest) * 10)}</span><span className="ml-1 text-sm text-fg-dim">/100</span>
            </div>
            {delta !== null && <span className={`mb-2 rounded-full px-2.5 py-1 text-xs font-semibold ${delta >= 0 ? 'bg-[#e7f4eb] text-[#28733e]' : 'bg-[#fbe8e7] text-[#a43a35]'}`}>{delta >= 0 ? '↑' : '↓'} {Number.isInteger(delta) ? Math.abs(delta) : Math.abs(delta).toFixed(1)} pts</span>}
          </div>
          {trendPoints.length >= 2 ? <div className="mt-6"><Sparkline points={trendPoints} width={560} height={92} /><p className="mt-2 text-xs text-fg-dim">Score history · {trendPoints.length} audits on this page</p></div> : <div className="mt-6 rounded-xl bg-bg px-4 py-3 text-xs text-fg-muted">Run another audit on this page to create a measured trend.</div>}
        </section>

        <section className="rounded-2xl border border-border bg-bg-panel p-6 text-fg shadow-[0_1px_2px_rgba(0,0,0,0.08)]">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#a8a8a1]">Next best action</p>
          <h2 className="mt-3 text-xl font-semibold tracking-[-0.03em]">Fix the highest-impact leak.</h2>
          <p className="mt-3 text-sm leading-6 text-[#b9b9b2]">Use the latest findings to choose one bounded repair, then re-audit the same page to verify the condition changed.</p>
          <div className="mt-8 flex items-center justify-between border-t border-white/15 pt-4 text-sm"><span className="text-[#b9b9b2]">Latest status</span><span className="font-semibold">{counts.critical > 0 ? `${counts.critical} critical` : 'No critical findings'}</span></div>
          <a href="/recommendations" className="mt-4 inline-flex w-full justify-center rounded-lg bg-bg-elevated px-4 py-2.5 text-sm font-semibold text-fg hover:bg-[#e9e9e5]">Open fix queue →</a>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-bg-elevated p-6 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          <div className="flex items-center justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-fg-dim">Recent audit</p><h2 className="mt-2 text-lg font-semibold text-fg">{latestUrl}</h2></div><span className="text-xs text-fg-dim">{fmtDate(latest.completed_at || latest.created_at)}</span></div>
          <div className="mt-5 flex items-center justify-between rounded-xl bg-bg px-4 py-3"><span className="text-sm text-fg-muted">Grade</span><span className="text-2xl font-semibold text-fg">{latest.grade || '—'}</span></div>
          <a href={`/audit/${latest.id}/results`} className="mt-4 inline-flex text-sm font-semibold text-[#444] hover:text-fg">Review findings →</a>
        </section>
        <section className="rounded-2xl border border-border bg-bg-elevated p-6 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-fg-dim">Keep your baseline current</p>
          <h2 className="mt-2 text-lg font-semibold text-fg">Verify the next change</h2>
          <p className="mt-2 text-sm leading-6 text-fg-muted">Run a follow-up after implementing a fix. New runs are preserved as immutable versions in your audit history.</p>
          <a href={`/audit?url=${encodeURIComponent(latest.url)}`} className="mt-5 inline-flex rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-bg hover:bg-gray-200">Run follow-up audit →</a>
        </section>
      </div>

      {email && <GscWidget email={email} />}
    </div>
  )
}

function MetricCard({ label, value, detail, tone }: { label: string; value: string; detail: string; tone: 'dark' | 'red' }) {
  return <section className="rounded-2xl border border-border bg-bg-elevated p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]"><p className="text-xs font-semibold uppercase tracking-[0.13em] text-fg-dim">{label}</p><p className={`mt-4 text-3xl font-semibold tracking-[-0.04em] ${tone === 'red' ? 'text-[#b33d38]' : 'text-fg'}`}>{value}</p><p className="mt-2 truncate text-xs text-[#888881]">{detail}</p></section>
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
      <div className="bg-bg-elevated border border-border rounded-lg p-10 text-center">
        <h2 className="text-xl font-bold mb-2">No audit history yet</h2>
        <p className="text-fg-muted mb-6">
          Every audit you run is preserved forever — like Git commits for your landing page.
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
    <div className="space-y-8">
      <p className="text-sm text-fg-muted">
        Every audit is immutable — old versions are never overwritten, so you can always see
        where a page started.
      </p>
      {byPath.map(([key, versions]) => (
        <section key={key} className="bg-bg-elevated border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-fg">{displayUrl(versions[0].url)}</h2>
            <span className="text-xs text-fg-dim border border-border rounded-full px-3 py-1">
              {versions.length} {versions.length === 1 ? 'version' : 'versions'}
            </span>
          </div>
          <ol className="space-y-3">
            {versions.map((v, i) => (
              <li key={v.id}>
                <a
                  href={`/audit/${v.id}/results`}
                  className="flex items-center justify-between rounded-lg border border-border bg-bg-panel px-4 py-3 hover:border-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <span className="w-10 h-10 rounded-lg bg-bg-elevated flex items-center justify-center text-sm font-bold text-fg-muted">
                      v{i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-fg">
                        {Math.round(scoreOf(v) * 10)}/100
                        {v.grade ? <span className="text-fg-dim ml-2">Grade {v.grade}</span> : null}
                      </p>
                      <p className="text-xs text-fg-dim">{fmtDate(v.completed_at || v.created_at)}</p>
                    </div>
                  </div>
                  <span className="text-accent text-sm">View →</span>
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
      <div className="bg-bg-elevated border border-border rounded-lg p-10 text-center">
        <h2 className="text-xl font-bold mb-2">No projects yet</h2>
        <p className="text-fg-muted mb-6">Audited pages group into projects by domain automatically.</p>
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
    <div className="grid md:grid-cols-2 gap-4">
      {projects.map((project) => (
        <section key={project.domain} className="bg-bg-elevated border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-semibold text-fg">{project.domain}</h2>
            <span className="text-2xl font-bold text-accent">
              {Math.round(scoreOf(project.latest) * 10)}
            </span>
          </div>
          <p className="text-xs text-fg-dim mb-4">
            {project.paths.length} {project.paths.length === 1 ? 'page' : 'pages'} ·{' '}
            {project.count} {project.count === 1 ? 'audit' : 'audits'} · last{' '}
            {fmtDate(project.latest.completed_at || project.latest.created_at)}
          </p>
          <ul className="space-y-1 mb-4">
            {project.paths.slice(0, 4).map((path) => (
              <li key={path} className="text-sm text-fg-muted truncate">
                {path}
              </li>
            ))}
            {project.paths.length > 4 && (
              <li className="text-xs text-fg-dim">+{project.paths.length - 4} more</li>
            )}
          </ul>
          <a
            href={`/audit?url=${encodeURIComponent(project.latest.url)}`}
            className="text-sm text-accent hover:text-accent-light"
          >
            Run follow-up →
          </a>
        </section>
      ))}
    </div>
  )
}
