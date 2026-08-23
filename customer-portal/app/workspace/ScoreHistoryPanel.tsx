'use client'

import { useEffect, useState } from 'react'
import ScoreHistoryChart, { type ScoreEvent } from './ScoreHistoryChart'

interface EngineMonitorEvent {
  id: string
  auditId: string | null
  status: string
  prevScore: number | null
  newScore: number | null
  summary: string
  createdAt: string | null
}

interface EngineMonitor {
  id: string
  url: string
  cadence: 'weekly' | 'monthly'
  active: boolean
  nextRunAt: string | null
  lastRunAt: string | null
  lastScore: number | null
  createdAt: string | null
  events: EngineMonitorEvent[]
}

const COLOR_ACCENT = '#c7ff2f'
const COLOR_DANGER = '#ef4444'
const COLOR_WARN = '#f59e0b'
const COLOR_MUTED = '#6b7280'

function gradeFor(score: number): string {
  if (score >= 90) return 'A'
  if (score >= 75) return 'B'
  if (score >= 60) return 'C'
  if (score >= 45) return 'D'
  return 'F'
}

function toScoreEvents(events: EngineMonitorEvent[]): ScoreEvent[] {
  return events
    .filter((e) => e.newScore != null)
    .slice()
    .sort((a, b) => (a.createdAt ?? '').localeCompare(b.createdAt ?? ''))
    .map((e) => ({
      score: e.newScore as number,
      grade: gradeFor(e.newScore as number),
      score_delta:
        e.prevScore != null && e.newScore != null ? e.newScore - e.prevScore : null,
      checked_at: e.createdAt ?? '',
    }))
}

function latestDelta(events: EngineMonitorEvent[]): number | null {
  const sorted = events.slice().sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
  const newest = sorted[0]
  if (!newest || newest.prevScore == null || newest.newScore == null) return null
  return newest.newScore - newest.prevScore
}

function trendArrow(delta: number | null): { arrow: string; color: string } {
  if (delta === null || delta === 0) return { arrow: '→', color: COLOR_MUTED }
  if (delta > 0) return { arrow: '▲', color: COLOR_ACCENT }
  return { arrow: '▼', color: COLOR_DANGER }
}

function gradeColor(score: number | null): string {
  if (score === null) return COLOR_MUTED
  if (score >= 70) return COLOR_ACCENT
  if (score >= 50) return COLOR_WARN
  return COLOR_DANGER
}

export default function ScoreHistoryPanel() {
  const [monitors, setMonitors] = useState<EngineMonitor[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch('/api/monitors-engine')
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load monitors')
        return r.json()
      })
      .then((data: { monitors: EngineMonitor[] }) => {
        if (!cancelled) setMonitors(data.monitors || [])
      })
      .catch((e: Error) => {
        if (!cancelled) setError(e.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [])

  function toggleMonitor(id: string) {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  if (loading) {
    return (
      <div data-testid="score-history-panel-loading" className="text-sm py-8 text-center" style={{ color: COLOR_MUTED }}>
        Loading monitors…
      </div>
    )
  }

  if (error) {
    return (
      <div data-testid="score-history-panel-error" className="text-sm py-8 text-center" style={{ color: COLOR_DANGER }}>
        {error}
      </div>
    )
  }

  if (!monitors || monitors.length === 0) {
    return (
      <div data-testid="score-history-panel-empty" className="text-sm py-8 text-center" style={{ color: COLOR_MUTED }}>
        No monitors yet. Add a page above to start tracking.
      </div>
    )
  }

  return (
    <div data-testid="score-history-panel" className="flex flex-col gap-2">
      {monitors.map((m) => {
        const delta = latestDelta(m.events)
        const { arrow, color: arrowColor } = trendArrow(delta)
        const isOpen = !!expanded[m.id]
        const scoreCol = gradeColor(m.lastScore)

        return (
          <div
            key={m.id}
            className="rounded-lg overflow-hidden"
            style={{ background: '#111111', border: '1px solid #1f1f1f' }}
          >
            {/* Header row - clickable */}
            <button
              type="button"
              onClick={() => toggleMonitor(m.id)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-white/5 transition-colors"
              aria-expanded={!!isOpen}
              data-testid={`monitor-row-${m.id}`}
            >
              {/* URL */}
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-medium truncate" style={{ color: '#ffffff' }}>
                  {m.url}
                </span>
                <span className="block text-xs truncate" style={{ color: COLOR_MUTED }}>
                  {m.active ? `${m.cadence === 'weekly' ? 'Weekly' : 'Monthly'} watch` : 'Paused'}
                </span>
              </span>

              {/* Grade */}
              {m.lastScore != null && (
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded"
                  style={{ color: scoreCol, background: `${scoreCol}18` }}
                  data-testid={`grade-${m.id}`}
                >
                  {gradeFor(m.lastScore)}
                </span>
              )}

              {/* Score */}
              <span className="text-sm font-semibold w-8 text-right" style={{ color: scoreCol }}>
                {m.lastScore != null ? Math.round(m.lastScore) : '-'}
              </span>

              {/* Trend arrow */}
              <span
                className="text-base w-5 text-center"
                style={{ color: arrowColor }}
                aria-label={
                  delta === null || delta === 0
                    ? 'neutral'
                    : delta > 0
                      ? 'improved'
                      : 'declined'
                }
                data-testid={`trend-${m.id}`}
              >
                {arrow}
              </span>

              {/* Expand indicator */}
              <span
                className="text-xs transition-transform"
                style={{
                  color: COLOR_MUTED,
                  transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  display: 'inline-block',
                }}
              >
                ▼
              </span>
            </button>

            {/* Expanded: score history chart */}
            {isOpen && (
              <div className="px-4 pb-4">
                {toScoreEvents(m.events).length === 0 ? (
                  <div className="text-xs py-4 text-center" style={{ color: COLOR_MUTED }}>
                    No scored runs yet
                  </div>
                ) : (
                  <ScoreHistoryChart monitorId={m.id} events={toScoreEvents(m.events)} />
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
