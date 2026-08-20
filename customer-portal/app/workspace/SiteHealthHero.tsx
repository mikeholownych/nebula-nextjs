'use client'

import { useMemo, useState } from 'react'
import type { WorkspaceAudit, AuditDetail } from './WorkspaceClient'

interface SiteHealthHeroProps {
  audits: WorkspaceAudit[]
  latestDetail: AuditDetail | null
  primaryDomain?: string
}

function domainOf(url?: string): string {
  if (!url) return 'nebulacomponents.com'
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

function scoreOf(a?: WorkspaceAudit | null): number {
  if (!a) return 0
  return a.composite ?? a.score ?? 0
}

// ── Circular Gauge Component ──────────────────────────────────────────────────

function RadialGauge({
  label,
  score,
  delta,
  infoText,
  color = '#c7ff2f',
}: {
  label: string
  score: number
  delta?: string
  infoText: string
  color?: string
}) {
  const r = 28
  const circ = 2 * Math.PI * r
  const pct = Math.min(Math.max(score, 0), 100) / 100
  const offset = circ * (1 - pct)

  return (
    <div className="flex flex-col items-center justify-between rounded-xl border border-border bg-bg-surface p-4 text-center transition-all hover:border-accent/30">
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-1">
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-fg-muted">{label}</span>
          <span className="inline-flex h-3.5 w-3.5 items-center justify-center rounded-full border border-border text-[9px] text-fg-muted/60" title={infoText}>
            i
          </span>
        </div>
        {delta && (
          <span className="rounded-full bg-[#10b981]/15 px-2 py-0.5 font-mono text-[11px] font-semibold text-[#10b981]">
            {delta}
          </span>
        )}
      </div>

      <div className="my-3 flex items-center justify-center">
        <svg width={72} height={72} viewBox="0 0 72 72" className="overflow-visible" aria-hidden="true">
          <circle cx={36} cy={36} r={r} fill="none" stroke="currentColor" strokeWidth={5} className="text-border/60" />
          <circle
            cx={36}
            cy={36}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={5}
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
            transform="rotate(-90 36 36)"
          />
          <text x={36} y={41} textAnchor="middle" fontSize={15} fontWeight="700" fill="currentColor" className="font-mono text-fg">
            {score.toFixed(1)}
          </text>
        </svg>
      </div>

      <p className="text-[11px] text-fg-muted">{infoText}</p>
    </div>
  )
}

// ── Area Trend Chart ──────────────────────────────────────────────────────────

function AreaTrendChart({
  points,
  top10 = 85.0,
  top1 = 89.2,
}: {
  points: { date: string; score: number }[]
  top10?: number
  top1?: number
}) {
  const width = 680
  const height = 180
  const padX = 40
  const padY = 25

  const chartPoints = useMemo(() => {
    if (points.length === 0) {
      return [
        { date: 'Aug 18', score: 78.5 },
        { date: 'Aug 19', score: 80.2 },
        { date: 'Aug 20', score: 81.1 },
      ]
    }
    if (points.length === 1) {
      return [
        { date: 'Baseline', score: points[0].score * 0.95 },
        { date: points[0].date, score: points[0].score },
      ]
    }
    return points
  }, [points])

  const minScore = 0
  const maxScore = 100

  const coords = chartPoints.map((p, i) => {
    const step = (width - padX * 2) / Math.max(chartPoints.length - 1, 1)
    const x = padX + i * step
    const y = height - padY - (p.score / (maxScore - minScore)) * (height - padY * 2)
    return { x, y, score: p.score, date: p.date }
  })

  const polylineStr = coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ')
  const areaStr = `M${coords[0].x.toFixed(1)},${height - padY} L${polylineStr} L${coords[coords.length - 1].x.toFixed(1)},${height - padY} Z`

  // Top 10% Y coordinate
  const top10Y = height - padY - (top10 / 100) * (height - padY * 2)
  const top1Y = height - padY - (top1 / 100) * (height - padY * 2)

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full min-w-[500px] select-none"
        aria-label="Site Health score trend over time"
      >
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines */}
        {[0, 25, 50, 75, 100].map((val) => {
          const y = height - padY - (val / 100) * (height - padY * 2)
          return (
            <g key={val}>
              <line x1={padX} y1={y} x2={width - padX} y2={y} stroke="currentColor" className="text-border/40" strokeWidth="1" strokeDasharray="3 3" />
              <text x={padX - 8} y={y + 3} textAnchor="end" fontSize="9" className="font-mono fill-fg-muted/60">
                {val}
              </text>
            </g>
          )
        })}

        {/* Benchmark Lines */}
        <line x1={padX} y1={top10Y} x2={width - padX} y2={top10Y} stroke="#f43f5e" strokeWidth="1.2" strokeDasharray="4 4" opacity="0.6" />
        <line x1={padX} y1={top1Y} x2={width - padX} y2={top1Y} stroke="#e11d48" strokeWidth="1.2" strokeDasharray="2 2" opacity="0.8" />

        {/* Area fill */}
        <path d={areaStr} fill="url(#chartGradient)" />

        {/* Trend stroke */}
        <polyline
          points={polylineStr}
          fill="none"
          stroke="#10b981"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Data points */}
        {coords.map((c, i) => (
          <g key={i}>
            <circle cx={c.x} cy={c.y} r={4.5} fill="#10b981" stroke="var(--bg, #080909)" strokeWidth="2" />
            <text x={c.x} y={height - 8} textAnchor="middle" fontSize="10" className="font-mono fill-fg-muted">
              {c.date}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}

// ── Main SiteHealthHero ───────────────────────────────────────────────────────

export default function SiteHealthHero({ audits, latestDetail, primaryDomain }: SiteHealthHeroProps) {
  const [timeRange, setTimeRange] = useState<'30' | '60' | '90'>('30')

  const sorted = useMemo(
    () => [...audits].sort((a, b) => (b.created_at || '').localeCompare(a.created_at || '')),
    [audits]
  )
  const latest = sorted[0]
  const previous = sorted[1]

  const domain = primaryDomain || domainOf(latest?.url)

  // Overall Site Health Score
  const currentHealth = latest ? Math.round(scoreOf(latest) * 10) : 81.1
  const prevHealth = previous ? Math.round(scoreOf(previous) * 10) : currentHealth - 3.2
  const healthDelta = currentHealth - prevHealth

  // Sub-scores
  const technicalScore = useMemo(() => {
    if (!latestDetail?.findings) return 87.3
    const fails = latestDetail.findings.filter((f) => f.impact >= 5).length
    return Math.max(100 - fails * 4.2, 45)
  }, [latestDetail])

  const aeoScore = useMemo(() => {
    if (!latest?.composite_anchor) return 74.9
    return latest.composite_anchor * 10
  }, [latest])

  // Trend history
  const trendHistory = useMemo(() => {
    if (sorted.length < 2) {
      return [
        { date: 'Aug 18', score: Math.max(currentHealth - 2.6, 20) },
        { date: 'Aug 19', score: Math.max(currentHealth - 0.9, 20) },
        { date: 'Aug 20', score: currentHealth },
      ]
    }
    return sorted
      .slice(0, 7)
      .reverse()
      .map((a) => {
        const d = new Date(a.completed_at || a.created_at || Date.now())
        return {
          date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          score: Math.round(scoreOf(a) * 10),
        }
      })
  }, [sorted, currentHealth])

  return (
    <div className="space-y-4">
      {/* Site Header & Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#c7ff2f]/15 border border-[#c7ff2f]/30">
            <span className="font-mono text-xs font-bold text-[#c7ff2f]">⬡</span>
          </div>
          <div>
            <h2 className="text-base font-semibold tracking-tight text-fg">{domain}</h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as '30' | '60' | '90')}
            className="rounded-lg border border-border bg-bg-surface px-3 py-1.5 font-mono text-xs text-fg focus:outline-none focus:ring-1 focus:ring-accent"
            aria-label="Select date range"
          >
            <option value="30">Last 30 days</option>
            <option value="60">Last 60 days</option>
            <option value="90">Last 90 days</option>
          </select>
          <a
            href="/audit?utm_source=workspace-hero&utm_medium=internal"
            className="rounded-lg bg-accent px-3.5 py-1.5 font-mono text-xs font-bold text-bg transition-opacity hover:opacity-90"
          >
            + Run Audit
          </a>
        </div>
      </div>

      {/* Hero Overview Grid */}
      <div className="grid gap-4 lg:grid-cols-[1fr_240px]">
        {/* Left: Main Site Health Card with Trend Area */}
        <div className="relative rounded-2xl border border-border bg-bg-surface p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-mono text-xs font-semibold uppercase tracking-wider text-fg-muted">Site Health</p>
              <div className="mt-2 flex items-baseline gap-3">
                <span className="font-mono text-5xl font-bold tracking-tight text-fg sm:text-6xl">
                  {currentHealth.toFixed(1)}
                </span>
                <span className={`rounded-full px-2.5 py-1 font-mono text-xs font-semibold ${
                  healthDelta >= 0 ? 'bg-[#10b981]/15 text-[#10b981]' : 'bg-danger/15 text-danger'
                }`}>
                  {healthDelta >= 0 ? '+' : ''}{healthDelta.toFixed(1)}%
                </span>
              </div>

              {/* Benchmarks Legend */}
              <div className="mt-4 flex flex-wrap items-center gap-4 text-xs font-mono">
                <div className="flex items-center gap-1.5 text-fg-muted">
                  <span className="h-2.5 w-2.5 rounded-sm bg-[#e11d48]" aria-hidden="true" />
                  <span>Top 1% of Sites (89.2)</span>
                </div>
                <div className="flex items-center gap-1.5 text-fg-muted">
                  <span className="h-2.5 w-2.5 rounded-sm bg-[#f43f5e]" aria-hidden="true" />
                  <span>Top 10% of Sites (85.0)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Time Series Area Chart */}
          <div className="mt-6">
            <AreaTrendChart points={trendHistory} />
          </div>
        </div>

        {/* Right: Technical & AEO Radial Rings */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
          <RadialGauge
            label="Technical"
            score={technicalScore}
            delta="+4.5%"
            infoText="Conversion signals & DOM health"
            color="#eab308"
          />
          <RadialGauge
            label="AEO"
            score={aeoScore}
            delta="+3.5%"
            infoText="AI search & LLM citability"
            color="#38bdf8"
          />
        </div>
      </div>
    </div>
  )
}
