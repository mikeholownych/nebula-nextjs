'use client'

import { useEffect, useMemo, useState } from 'react'
import type { WorkspaceAudit, AuditDetail, AuditFinding } from './WorkspaceClient'
import { SIGNAL_GROUPS } from '../audit/[id]/results/reportArchitecture'

// ── Helpers ───────────────────────────────────────────────────────────

function severityOfImpact(impact: number): Severity {
  if (impact >= 8) return 'critical'
  if (impact >= 5) return 'warning'
  return 'advisory'
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

type Severity = 'clear' | 'critical' | 'warning' | 'advisory'

function groupStatus(findings: AuditFinding[], keys: string[]): Severity {
  const severities = findings.filter((f) => keys.includes(f.key)).map((f) => severityOfImpact(f.impact))
  if (severities.includes('critical')) return 'critical'
  if (severities.includes('warning')) return 'warning'
  if (severities.includes('advisory')) return 'advisory'
  return 'clear'
}

function severityRank(s: Severity): number {
  return s === 'critical' ? 3 : s === 'warning' ? 2 : s === 'advisory' ? 1 : 0
}

function movementText(before: Severity, after: Severity): { label: string; tone: 'good' | 'bad' | 'neutral' } | null {
  const diff = severityRank(after) - severityRank(before)
  if (diff === 0) return null
  if (diff > 0) return { label: 'Worsened', tone: 'bad' }
  return { label: 'Improved', tone: 'good' }
}

const STATUS_STYLES: Record<Severity, string> = {
  clear: 'bg-accent/15 text-accent border-accent/30',
  critical: 'bg-red-500/15 text-danger border-red-700/50',
  warning: 'bg-signal-fail/10 text-signal-fail border-signal-fail/30',
  advisory: 'bg-bg-elevated text-fg-muted border-border/50',
}

function StatusChip({ status }: { status: Severity }) {
  return (
    <span
      className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[status]}`}
    >
      {status}
    </span>
  )
}

// ── Compare view ──────────────────────────────────────────────────────

export default function CompareView({ audits }: { audits: WorkspaceAudit[] }) {
  const sorted = useMemo(
    () => [...audits].sort((a, b) => (b.created_at || '').localeCompare(a.created_at || '')),
    [audits]
  )

  // Default: two most recent audits of the same page
  const defaultPair = useMemo(() => {
    const key = sorted[0] ? pathKey(sorted[0].url) : null
    if (!key) return { beforeId: null, afterId: null }
    const same = sorted.filter((a) => pathKey(a.url) === key)
    if (same.length < 2) {
      // Fall back to the two most recent overall
      return { beforeId: sorted[1]?.id ?? null, afterId: sorted[0]?.id ?? null }
    }
    return { beforeId: same[1].id, afterId: same[0].id }
  }, [sorted])

  const [beforeId, setBeforeId] = useState<string | null>(null)
  const [afterId, setAfterId] = useState<string | null>(null)
  const [details, setDetails] = useState<Record<string, AuditDetail | null>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (defaultPair.beforeId && defaultPair.afterId) {
      setBeforeId(defaultPair.beforeId)
      setAfterId(defaultPair.afterId)
    }
  }, [defaultPair.beforeId, defaultPair.afterId])

  const before = sorted.find((a) => a.id === beforeId) || null
  const after = sorted.find((a) => a.id === afterId) || null

  // Fetch full details for both selected audits
  useEffect(() => {
    const ids = [beforeId, afterId].filter(Boolean) as string[]
    if (ids.length === 0) return
    setLoading(true)
    Promise.all(
      ids.map(async (id) => {
        if (details[id]) return
        try {
          const res = await fetch(`/api/audit/${id}`)
          if (!res.ok) return
          const data = await res.json()
          setDetails((prev) => ({ ...prev, [id]: data }))
        } catch {
          /* keep null */
        }
      })
    ).finally(() => setLoading(false))
  }, [beforeId, afterId])

  if (sorted.length < 2) {
    return (
      <div className="bg-bg-elevated border border-border rounded-lg p-10 text-center">
        <h2 className="text-xl font-bold mb-2">Compare needs two versions</h2>
        <p className="text-fg-muted mb-6 max-w-md mx-auto">
          Run a follow-up audit on the same page — the diff shows exactly what changed, like a pull
          request for your landing page.
        </p>
        {sorted[0] && (
          <a
            href={`/audit?url=${encodeURIComponent(sorted[0].url)}`}
            className="inline-block rounded-lg bg-accent px-6 py-2.5 text-sm font-semibold text-bg hover:bg-accent-light transition-colors"
          >
            Run follow-up audit
          </a>
        )}
      </div>
    )
  }

  const beforeDetail = before ? details[before.id] : null
  const afterDetail = after ? details[after.id] : null

  const beforeScore = before ? scoreOf(before) : 0
  const afterScore = after ? scoreOf(after) : 0
  // Scores are 0–10 internally; display in /100 units consistently
  const delta = before && after ? Math.round((afterScore - beforeScore) * 10) : null
  const samePage = before && after && pathKey(before.url) === pathKey(after.url)

  // Signal group diff
  const signalRows = SIGNAL_GROUPS.map((group) => {
    const bStatus = beforeDetail ? groupStatus(beforeDetail.findings, group.keys) : 'clear'
    const aStatus = afterDetail ? groupStatus(afterDetail.findings, group.keys) : 'clear'
    const movement = movementText(bStatus, aStatus)
    return { group, bStatus, aStatus, movement }
  })

  // Finding diff by key
  const findingDiff = useMemo(() => {
    const bList = beforeDetail?.findings || []
    const aList = afterDetail?.findings || []
    const byKey = new Map<string, { before?: AuditFinding; after?: AuditFinding }>()
    bList.forEach((f) => byKey.set(f.key, { before: f }))
    aList.forEach((f) => {
      const existing = byKey.get(f.key) || {}
      byKey.set(f.key, { ...existing, after: f })
    })
    const fixed: AuditFinding[] = []
    const fresh: AuditFinding[] = []
    const improved: AuditFinding[] = []
    const worsened: AuditFinding[] = []
    const unchanged: AuditFinding[] = []
    for (const { before: b, after: a } of byKey.values()) {
      if (b && !a) fixed.push(b)
      else if (!b && a) fresh.push(a)
      else if (b && a) {
        if (a.impact < b.impact - 0.05) improved.push(a)
        else if (a.impact > b.impact + 0.05) worsened.push(a)
        else unchanged.push(a)
      }
    }
    const byImpact = (arr: AuditFinding[]) => [...arr].sort((x, y) => y.impact - x.impact)
    return { fixed: byImpact(fixed), fresh: byImpact(fresh), improved: byImpact(improved), worsened: byImpact(worsened), unchanged: byImpact(unchanged) }
  }, [beforeDetail, afterDetail])

  const selectOptions = (_excludeId?: string | null) =>
    sorted.map((a) => (
      <option key={a.id} value={a.id}>
        {displayUrl(a.url)} · {fmtDate(a.completed_at || a.created_at)} · {Math.round(scoreOf(a) * 10)}/100
      </option>
    ))

  return (
    <div className="space-y-6">
      {/* Selectors */}
      <div className="grid md:grid-cols-[1fr_auto_1fr] gap-4 items-end">
        <div>
          <label htmlFor="compare-before" className="block text-xs text-fg-dim uppercase tracking-widest mb-2">
            Before
          </label>
          <select
            id="compare-before"
            value={beforeId || ''}
            onChange={(e) => setBeforeId(e.target.value || null)}
            className="w-full rounded-lg border border-border bg-bg-panel px-3 py-2.5 text-sm text-fg focus:border-accent focus:outline-none"
          >
            {selectOptions(afterId)}
          </select>
        </div>
        <div className="hidden md:flex items-center justify-center pb-2">
          <span className="text-2xl text-accent">→</span>
        </div>
        <div>
          <label htmlFor="compare-after" className="block text-xs text-fg-dim uppercase tracking-widest mb-2">
            After
          </label>
          <select
            id="compare-after"
            value={afterId || ''}
            onChange={(e) => setAfterId(e.target.value || null)}
            className="w-full rounded-lg border border-border bg-bg-panel px-3 py-2.5 text-sm text-fg focus:border-accent focus:outline-none"
          >
            {selectOptions(beforeId)}
          </select>
        </div>
      </div>

      {/* Score movement */}
      <section className="bg-bg-elevated border border-border rounded-lg p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1">
            <p className="text-xs text-fg-dim uppercase tracking-widest mb-1">Before</p>
            <p className="text-4xl font-bold text-fg-muted">
              {Math.round(beforeScore * 10)}
              <span className="text-base text-fg-dim font-normal">/100</span>
            </p>
            <p className="text-xs text-fg-dim mt-1">
              {before ? fmtDate(before.completed_at || before.created_at) : '—'}
              {before?.grade ? ` · Grade ${before.grade}` : ''}
            </p>
          </div>
          <div className="text-center px-4">
            {delta !== null && (
              <>
                <p className={`text-3xl font-bold ${delta > 0 ? 'text-accent' : delta < 0 ? 'text-danger' : 'text-fg-muted'}`}>
                  {delta > 0 ? '+' : ''}
                  {Number.isInteger(delta) ? delta : delta.toFixed(1)}
                </p>
                <p className="text-xs text-fg-dim mt-1">score movement</p>
                {samePage ? (
                  <p className="text-xs text-accent/80 mt-1">same page</p>
                ) : (
                  <p className="text-xs text-signal-fail/80 mt-1">different page</p>
                )}
              </>
            )}
          </div>
          <div className="flex-1 text-right">
            <p className="text-xs text-fg-dim uppercase tracking-widest mb-1">After</p>
            <p className="text-4xl font-bold text-accent">
              {Math.round(afterScore * 10)}
              <span className="text-base text-fg-dim font-normal">/100</span>
            </p>
            <p className="text-xs text-fg-dim mt-1">
              {after ? fmtDate(after.completed_at || after.created_at) : '—'}
              {after?.grade ? ` · Grade ${after.grade}` : ''}
            </p>
          </div>
        </div>
        {loading && <p className="text-xs text-fg-dim mt-4">Loading findings…</p>}
      </section>

      {/* Visual diff — screenshots side by side if available */}
      {before?.screenshot_url && after?.screenshot_url && samePage && (
        <section className="rounded-xl border border-border bg-bg-elevated p-5">
          <h3 className="mb-4 text-sm font-semibold text-fg-muted uppercase tracking-widest">Page snapshots</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-fg-dim mb-2">Before · {fmtDate(before.completed_at || before.created_at)}</p>
              <div className="rounded-lg border border-border overflow-hidden">
                <img src={before.screenshot_url} alt="Before" className="w-full object-cover object-top" />
              </div>
            </div>
            <div>
              <p className="text-xs text-fg-dim mb-2">After · {fmtDate(after.completed_at || after.created_at)}</p>
              <div className="rounded-lg border border-border overflow-hidden">
                <img src={after.screenshot_url} alt="After" className="w-full object-cover object-top" />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Signal group diff */}
      <section className="bg-bg-elevated border border-border rounded-lg p-6">
        <h3 className="text-sm font-semibold text-fg mb-4">Components</h3>
        <div className="space-y-3">
          {signalRows.map(({ group, bStatus, aStatus, movement }) => (
            <div key={group.id} className="flex items-center justify-between gap-3 py-2 border-b border-border last:border-0">
              <div className="min-w-0">
                <p className="text-sm text-fg">{group.label}</p>
                <p className="text-xs text-fg-dim truncate">{group.description}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <StatusChip status={bStatus} />
                <span className="text-fg-dim text-xs">→</span>
                <StatusChip status={aStatus} />
                {movement && (
                  <span
                    className={`text-xs font-medium ${
                      movement.tone === 'good' ? 'text-accent' : movement.tone === 'bad' ? 'text-danger' : 'text-fg-dim'
                    }`}
                  >
                    {movement.label}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Findings diff */}
      <section className="bg-bg-elevated border border-border rounded-lg p-6">
        <h3 className="text-sm font-semibold text-fg mb-4">Findings</h3>

        {findingDiff.fixed.length > 0 && (
          <div className="mb-5">
            <p className="text-xs font-medium text-accent uppercase tracking-widest mb-2">
              Fixed · {findingDiff.fixed.length}
            </p>
            <ul className="space-y-2">
              {findingDiff.fixed.map((f) => (
                <li key={`fixed-${f.key}`} className="flex items-center justify-between rounded-lg border border-accent/20 bg-accent/5 px-4 py-2.5">
                  <div>
                    <p className="text-sm text-fg">{f.label}</p>
                    <p className="text-xs text-fg-dim">was impact {f.impact.toFixed(1)}</p>
                  </div>
                  <span className="text-xs text-accent">✓ no longer flagged</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {findingDiff.fresh.length > 0 && (
          <div className="mb-5">
            <p className="text-xs font-medium text-danger uppercase tracking-widest mb-2">
              New · {findingDiff.fresh.length}
            </p>
            <ul className="space-y-2">
              {findingDiff.fresh.map((f) => (
                <li key={`fresh-${f.key}`} className="flex items-center justify-between rounded-lg border border-red-900/40 bg-danger-dim px-4 py-2.5">
                  <div>
                    <p className="text-sm text-fg">{f.label}</p>
                    <p className="text-xs text-fg-dim">impact {f.impact.toFixed(1)} · {f.quadrant?.replace(/_/g, ' ') || ''}</p>
                  </div>
                  <span className="text-xs text-danger">new</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {findingDiff.worsened.length > 0 && (
          <div className="mb-5">
            <p className="text-xs font-medium text-signal-fail uppercase tracking-widest mb-2">
              Worsened · {findingDiff.worsened.length}
            </p>
            <ul className="space-y-2">
              {findingDiff.worsened.map((f) => (
                <li key={`worsened-${f.key}`} className="flex items-center justify-between rounded-lg border border-signal-fail/20 bg-signal-fail/5 px-4 py-2.5">
                  <div>
                    <p className="text-sm text-fg">{f.label}</p>
                    <p className="text-xs text-fg-dim">impact {f.impact.toFixed(1)} · {f.quadrant?.replace(/_/g, ' ') || ''}</p>
                  </div>
                  <span className="text-xs text-signal-fail">regressed</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {findingDiff.improved.length > 0 && (
          <div className="mb-5">
            <p className="text-xs font-medium text-accent uppercase tracking-widest mb-2">
              Improved · {findingDiff.improved.length}
            </p>
            <ul className="space-y-2">
              {findingDiff.improved.map((f) => (
                <li key={`improved-${f.key}`} className="flex items-center justify-between rounded-lg border border-border bg-bg-panel px-4 py-2.5">
                  <div>
                    <p className="text-sm text-fg">{f.label}</p>
                    <p className="text-xs text-fg-dim">impact {f.impact.toFixed(1)} · {f.quadrant?.replace(/_/g, ' ') || ''}</p>
                  </div>
                  <span className="text-xs text-accent">lower impact</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {findingDiff.unchanged.length > 0 && (
          <div>
            <p className="text-xs font-medium text-fg-dim uppercase tracking-widest mb-2">
              Unchanged · {findingDiff.unchanged.length}
            </p>
            <ul className="space-y-2">
              {findingDiff.unchanged.map((f) => (
                <li key={`unchanged-${f.key}`} className="flex items-center justify-between rounded-lg border border-border bg-bg-panel/60 px-4 py-2.5">
                  <div>
                    <p className="text-sm text-fg-muted">{f.label}</p>
                    <p className="text-xs text-fg-dim">impact {f.impact.toFixed(1)} · {f.quadrant?.replace(/_/g, ' ') || ''}</p>
                  </div>
                  <span className="text-xs text-fg-dim">no change</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {!loading && beforeDetail && afterDetail && findingDiff.fixed.length === 0 && findingDiff.fresh.length === 0 && findingDiff.worsened.length === 0 && findingDiff.improved.length === 0 && (
          <p className="text-sm text-fg-dim">No change between these runs.</p>
        )}
      </section>
    </div>
  )
}
