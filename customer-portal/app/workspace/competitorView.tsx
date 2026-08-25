'use client'

import { useCallback, useEffect, useState } from 'react'
import type { WorkspaceAudit } from './WorkspaceClient'
import Link from 'next/link'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import type { AccessLevel } from './planGate'
import { signalLabel } from './signalLabels'

interface CompetitorSignalResult {
  key: string
  label: string
  siteAScore: number
  siteBScore: number
  advantage: 'A' | 'B' | 'tie'
  summary: string
}

interface CompetitorCompareResult {
  urlA: string
  urlB: string
  scoreA: number
  scoreB: number
  winner: 'A' | 'B' | 'tie'
  signals: CompetitorSignalResult[]
}

interface TrackedRival {
  id?: string
  url: string
  label: string | null
  last_score: number | null
  last_audited_at?: string | null
}

interface RivalDiagnostics {
  you?: { url?: string; score?: number | null; grade?: string | null; signals?: Record<string, boolean> }
  rival?: { url?: string; label?: string | null; score?: number | null; grade?: string | null; signals?: Record<string, boolean>; last_score?: number | null }
  your_edge?: string[]
  threats?: string[]
  history?: { date: string; you: number; rival: number }[]
}

interface CompetitorViewProps {
  audits: WorkspaceAudit[]
  email?: string
  planLevel: AccessLevel
}

function PassFail({ value }: { value: boolean }) {
  return value ? (
    <span className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent">
      <svg width="9" height="9" viewBox="0 0 12 12" fill="none" aria-hidden="true"><path d="M2 6.5L4.5 9L10 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
      Pass
    </span>
  ) : (
    <span className="inline-flex items-center rounded-full border border-danger/30 bg-danger-dim px-2 py-0.5 text-[10px] font-semibold text-danger">
      Fail
    </span>
  )
}

/** Pro diagnostics for one tracked rival: signal table + gaps + history chart. */
function RivalDiagnosticsPanel() {
  const [rivals, setRivals] = useState<TrackedRival[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [data, setData] = useState<RivalDiagnostics | null>(null)
  const [loadingList, setLoadingList] = useState(true)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/competitors', { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setRivals(d?.competitors ?? []))
      .catch(() => setRivals([]))
      .finally(() => setLoadingList(false))
  }, [])

  const loadDiagnostics = useCallback(async (trackingId: string) => {
    setLoadingDetail(true)
    setError(null)
    setData(null)
    try {
      const res = await fetch(`/api/competitors/comparison/${encodeURIComponent(trackingId)}`, { cache: 'no-store' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(body?.error ?? body?.detail ?? 'Diagnostics unavailable.')
        return
      }
      setData(await res.json())
    } catch {
      setError('Network error loading diagnostics.')
    } finally {
      setLoadingDetail(false)
    }
  }, [])

  const selected = rivals.find((r) => r.id === selectedId) ?? null
  const hasSignals = Boolean(
    data && Object.keys(data.you?.signals ?? {}).length > 0 &&
    Object.keys(data.rival?.signals ?? {}).length > 0
  )
  const history = data?.history ?? []
  const edge = data?.your_edge ?? []
  const threats = data?.threats ?? []

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-1.5 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-0.5 text-[11px] font-semibold text-accent">
            Pro diagnostics
          </div>
          <h3 className="text-lg font-bold text-fg">Rival Signal Diagnostics</h3>
          <p className="text-sm text-fg-muted">Per-signal pass maps against each tracked rival, your edges, their threats, and paired score history.</p>
        </div>
        <Link href="/workspace?tab=settings" className="text-xs font-semibold text-fg-muted underline-offset-2 hover:text-accent hover:underline">
          Manage rivals in Settings →
        </Link>
      </div>

      {/* Rival selector */}
      <div className="rounded-xl border border-border bg-bg-panel p-4">
        {loadingList ? (
          <p className="text-xs text-fg-muted">Loading tracked rivals…</p>
        ) : rivals.length === 0 ? (
          <p className="text-xs text-fg-muted">
            No tracked rivals yet. Add competitors in Settings and their first audit fills this panel automatically.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {rivals.map((r) => (
              <button
                key={r.id ?? r.url}
                type="button"
                onClick={() => {
                  if (!r.id) return
                  setSelectedId(r.id)
                  loadDiagnostics(r.id)
                }}
                className={`rounded-full border px-3 py-1 font-mono text-[11px] transition-colors ${
                  selectedId === r.id ? 'border-accent/50 bg-accent/10 text-accent' : 'border-border text-fg-muted hover:border-accent/40 hover:text-fg'
                }`}
              >
                {r.label || r.url.replace(/^https?:\/\/(www\.)?/, '')}
              </button>
            ))}
          </div>
        )}
      </div>

      {loadingDetail && <p className="text-sm text-fg-muted">Crunching the head-to-head…</p>}
      {error && <div className="rounded-lg border border-danger/40 bg-danger-dim p-3 text-xs text-danger">{error}</div>}

      {data && !loadingDetail && (
        <>
          {!hasSignals ? (
            <div className="rounded-xl border border-border bg-bg-panel p-6 text-sm text-fg-muted">
              No linked completed audit on one side yet for{' '}
              <strong className="text-fg">{selected?.label || selected?.url}</strong>. Diagnostics appear once both your latest audit and this rival&apos;s audit have completed.
            </div>
          ) : (
            <div className="space-y-5">
              {/* Score header */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-border bg-bg-panel p-5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-fg-dim">You</p>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="font-mono text-4xl font-black text-accent">{Math.round(data.you?.score ?? 0)}</span>
                    {data.you?.grade && <span className="text-xs text-fg-muted">Grade {data.you.grade}</span>}
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-bg-panel p-5">
                  <p className="truncate text-xs font-semibold uppercase tracking-wider text-fg-dim">{data.rival?.label || data.rival?.url || 'Rival'}</p>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="font-mono text-4xl font-black text-fg">{Math.round(data.rival?.score ?? data.rival?.last_score ?? 0)}</span>
                    {data.rival?.grade && <span className="text-xs text-fg-muted">Grade {data.rival.grade}</span>}
                  </div>
                </div>
              </div>

              {/* Edge / threat lists */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-accent/30 bg-accent/[0.06] p-5">
                  <h4 className="text-sm font-bold text-accent">Your edge</h4>
                  {edge.length === 0 ? (
                    <p className="mt-2 text-xs text-fg-muted">No signals where you pass and they fail.</p>
                  ) : (
                    <ul className="mt-2 space-y-1.5">
                      {edge.map((k) => (
                        <li key={k} className="flex items-center gap-2 text-xs text-fg">
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" /> {signalLabel(k)}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="rounded-xl border border-danger/40 bg-danger-dim p-5">
                  <h4 className="text-sm font-bold text-danger">Threats</h4>
                  {threats.length === 0 ? (
                    <p className="mt-2 text-xs text-fg-muted">No signals where they pass and you fail.</p>
                  ) : (
                    <ul className="mt-2 space-y-1.5">
                      {threats.map((k) => (
                        <li key={k} className="flex items-center gap-2 text-xs text-fg">
                          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-danger" /> {signalLabel(k)}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Signal side-by-side table */}
              <div className="overflow-x-auto rounded-xl border border-border bg-bg-panel">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-border bg-bg-elevated/60 text-xs font-semibold uppercase tracking-wider text-fg-dim">
                    <tr>
                      <th className="py-3 px-4">Signal</th>
                      <th className="py-3 px-4 text-center">You</th>
                      <th className="py-3 px-4 text-center">{data.rival?.label || 'Rival'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {Object.keys(data.you?.signals ?? {}).map((key) => {
                      const youPass = Boolean(data.you?.signals?.[key])
                      const rivalPass = Boolean(data.rival?.signals?.[key])
                      return (
                        <tr key={key} className="transition-colors hover:bg-bg-elevated/40">
                          <td className="py-3 px-4 font-medium text-fg">{signalLabel(key)}</td>
                          <td className="py-3 px-4 text-center"><PassFail value={youPass} /></td>
                          <td className="py-3 px-4 text-center"><PassFail value={rivalPass} /></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Paired history line chart */}
              {history.length >= 2 && (
                <section className="rounded-xl border border-border bg-bg-panel p-6">
                  <h4 className="mb-4 text-base font-bold text-fg">Score history</h4>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={history.map((h) => ({ date: h.date.slice(5), You: Math.round(h.you * 10), Rival: Math.round(h.rival * 10) }))} margin={{ top: 8, right: 16, bottom: 0, left: -16 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#242a26" />
                        <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#888881' }} tickLine={false} axisLine={false} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#888881' }} tickLine={false} axisLine={false} />
                        <Tooltip
                          contentStyle={{ background: '#10140f', border: '1px solid #242a26', borderRadius: 8, fontSize: 12 }}
                          labelStyle={{ color: '#888881' }}
                        />
                        <Line type="monotone" dataKey="You" stroke="#c7ff2f" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="Rival" stroke="#888881" strokeWidth={2} dot={false} strokeDasharray="4 3" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="mt-2 text-center font-mono text-[10px] text-fg-dim">composite score, 0 to 100 scale</p>
                </section>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default function CompetitorView({ audits, planLevel }: CompetitorViewProps) {
  const initialUrlA = audits[0]?.url || 'https://example.com'
  const [urlA, setUrlA] = useState(initialUrlA)
  const [urlB, setUrlB] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<CompetitorCompareResult | null>(null)
  const [copied, setCopied] = useState(false)

  const handleCompare = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!urlA || !urlB) {
      setError('Please provide both your URL and your competitor’s URL.')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch('/api/audit/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urlA, urlB }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to compare URLs.')
      }

      setResult(data)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred.')
    } finally {
      setLoading(false)
    }
  }

  const copyBattlecard = () => {
    if (!result) return
    const winsA = result.signals.filter((s) => s.advantage === 'A').length
    const winsB = result.signals.filter((s) => s.advantage === 'B').length
    const ties = result.signals.filter((s) => s.advantage === 'tie').length

    const text = [
      `# Head-to-Head Conversion Battlecard`,
      `**Your Site (${result.urlA}):** ${result.scoreA}/100`,
      `**Competitor (${result.urlB}):** ${result.scoreB}/100`,
      `**Outcome:** ${result.winner === 'A' ? 'Your page wins!' : result.winner === 'B' ? 'Competitor has the advantage' : 'Dead heat tie'}`,
      `**Signal Scorecard:** You won ${winsA}, Competitor won ${winsB}, ${ties} tied.`,
      '',
      `### Key Signal Breakdown:`,
      ...result.signals.map(
        (s) =>
          `- ${s.label}: You (${s.siteAScore}) vs Competitor (${s.siteBScore}) → [${
            s.advantage === 'A' ? 'WIN' : s.advantage === 'B' ? 'LOSS' : 'TIE'
          }] ${s.summary}`
      ),
      '',
      `Generated by Nebula Conversion Intelligence: https://nebulacomponents.com`,
    ].join('\n')

    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const winsCount = result?.signals.filter((s) => s.advantage === 'A').length || 0
  const totalSignals = result?.signals.length || 9
  const winRate = Math.round((winsCount / totalSignals) * 100)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="rounded-2xl border border-border bg-bg-panel p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent mb-3">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
              Competitor Intelligence Engine
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-fg mb-2">
              Head-to-Head Competitor Comparison
            </h2>
            <p className="text-sm text-fg-muted leading-relaxed">
              Compare your landing page side-by-side against any competitor. Inspect 9 deterministic conversion signals to see where you outperform them and where they are capturing your leads.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/vs/fixroast"
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-bg-elevated px-4 py-2.5 text-xs font-semibold text-fg hover:border-accent hover:text-accent transition-colors"
            >
              <span>View Nebula vs FixRoast ↗</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Comparison Input Form */}
      <div className="rounded-xl border border-border bg-bg-panel p-6">
        <h3 className="text-base font-bold text-fg mb-4">Run Live Competitor Audit</h3>
        <form onSubmit={handleCompare} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-fg-dim mb-1.5">
                Your Page URL
              </label>
              <div className="space-y-2">
                <input
                  type="url"
                  required
                  value={urlA}
                  onChange={(e) => setUrlA(e.target.value)}
                  placeholder="https://yourdomain.com"
                  className="w-full rounded-lg border border-border bg-bg px-4 py-2.5 text-sm text-fg placeholder:text-fg-dim focus:border-accent focus:outline-none"
                />
                {audits.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-fg-dim">From audits:</span>
                    <select
                      onChange={(e) => setUrlA(e.target.value)}
                      value={urlA}
                      className="rounded border border-border bg-bg-elevated px-2 py-0.5 text-[11px] text-fg focus:outline-none"
                    >
                      {audits.map((a) => (
                        <option key={a.id} value={a.url}>
                          {a.url}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-fg-dim mb-1.5">
                Competitor URL
              </label>
              <input
                type="url"
                required
                value={urlB}
                onChange={(e) => setUrlB(e.target.value)}
                placeholder="https://competitor.com"
                className="w-full rounded-lg border border-border bg-bg px-4 py-2.5 text-sm text-fg placeholder:text-fg-dim focus:border-accent focus:outline-none"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-danger/40 bg-danger-dim p-3 text-xs text-danger">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-fg-dim">
              Inspects CTA contrast, mobile responsiveness, social proof, speed, and form friction.
            </p>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-2.5 text-xs font-bold text-bg hover:opacity-85 disabled:opacity-50 transition-opacity"
            >
              {loading ? (
                <>
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-bg border-t-transparent" />
                  Auditing Both Sites…
                </>
              ) : (
                'Run Head-to-Head Comparison →'
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Results Section */}
      {result && (
        <div className="space-y-6">
          {/* Win Rate & Overview Cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-bg-panel p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-fg-dim">Your Score</p>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-4xl font-black text-accent">{result.scoreA}</span>
                <span className="text-xs text-fg-muted">/ 100</span>
              </div>
              <p className="text-xs text-fg-muted mt-2 truncate" title={result.urlA}>
                {result.urlA.replace(/^https?:\/\/(www\.)?/, '')}
              </p>
            </div>

            <div className="rounded-xl border border-border bg-bg-panel p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-fg-dim">Competitor Score</p>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-4xl font-black text-fg">{result.scoreB}</span>
                <span className="text-xs text-fg-muted">/ 100</span>
              </div>
              <p className="text-xs text-fg-muted mt-2 truncate" title={result.urlB}>
                {result.urlB.replace(/^https?:\/\/(www\.)?/, '')}
              </p>
            </div>

            <div className="rounded-xl border border-border bg-bg-panel p-6">
              <p className="text-xs font-semibold uppercase tracking-wider text-fg-dim">Conversion Win Rate</p>
              <div className="flex items-baseline gap-2 mt-2">
                <span className={`text-4xl font-black ${winRate >= 50 ? 'text-accent' : 'text-signal-fail'}`}>
                  {winRate}%
                </span>
                <span className="text-xs text-fg-muted">
                  ({winsCount}/{totalSignals} signals won)
                </span>
              </div>
              <p className="text-xs text-fg-muted mt-2">
                {result.winner === 'A'
                  ? 'Your page out-converts the competitor overall.'
                  : result.winner === 'B'
                  ? 'Competitor holds the conversion advantage.'
                  : 'Pages are closely matched.'}
              </p>
            </div>
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-bg-elevated p-4">
            <div className="text-xs text-fg-muted">
              Differential breakdown across 9 conversion &amp; discovery dimensions
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={copyBattlecard}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-bg px-3.5 py-1.5 text-xs font-semibold text-fg hover:border-accent hover:text-accent transition-colors"
              >
                {copied ? '✓ Copied Battlecard' : '📋 Copy Battlecard'}
              </button>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-1.5 text-xs font-bold text-bg hover:opacity-85 transition-opacity"
              >
                Claim $97 Repair Sprint →
              </Link>
            </div>
          </div>

          {/* Signal Differential Table */}
          <div className="overflow-x-auto rounded-xl border border-border bg-bg-panel">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-bg-elevated/60 text-xs font-semibold uppercase tracking-wider text-fg-dim">
                <tr>
                  <th className="py-3.5 px-4">Signal Dimension</th>
                  <th className="py-3.5 px-4 text-center">Your Page</th>
                  <th className="py-3.5 px-4 text-center">Competitor</th>
                  <th className="py-3.5 px-4 text-center">Advantage</th>
                  <th className="py-3.5 px-4">Diagnostic Insight</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {result.signals.map((sig) => (
                  <tr key={sig.key} className="hover:bg-bg-elevated/40 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-fg">{sig.label}</td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-fg">
                      {sig.siteAScore}/100
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-fg-muted">
                      {sig.siteBScore}/100
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {sig.advantage === 'A' ? (
                        <span className="inline-flex items-center rounded-full bg-accent/15 border border-accent/30 px-2.5 py-0.5 text-xs font-semibold text-accent">
                          +Win
                        </span>
                      ) : sig.advantage === 'B' ? (
                        <span className="inline-flex items-center rounded-full bg-danger-dim border border-danger/30 px-2.5 py-0.5 text-xs font-semibold text-danger">
                          -Loss
                        </span>
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-bg-elevated border border-border px-2.5 py-0.5 text-xs font-medium text-fg-dim">
                          =Tie
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-fg-muted leading-relaxed">
                      {sig.summary}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tracked-rival diagnostics (Pro) or legacy-only note (free tier) */}
      {planLevel === 'free' ? (
        <div className="rounded-xl border border-border bg-bg-panel p-6 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-accent">Pro feature</p>
          <h3 className="mt-1 text-base font-bold text-fg">Rival Signal Diagnostics</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-fg-muted">
            Per-signal pass maps against every tracked rival, your edge, their threats, and paired score history. Upgrade to Pro ($29/mo) to unlock it.
          </p>
          <Link href="/pricing" className="mt-4 inline-block rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-bg hover:opacity-85">
            See plans →
          </Link>
        </div>
      ) : (
        <RivalDiagnosticsPanel />
      )}
    </div>
  )
}
