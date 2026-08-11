'use client'

import { useEffect, useState } from 'react'
import ScoreHistoryChart, { type ScoreEvent } from './ScoreHistoryChart'

interface MonitorSummary {
  id: number
  url: string
  label: string | null
  last_score: number | null
  last_grade: string | null
  last_delta: number | null
  active: boolean
  created_at: string
}

interface MonitorDetail {
  monitor: MonitorSummary
  events: ScoreEvent[]
}

const COLOR_ACCENT = '#00c2a0'
const COLOR_DANGER = '#ef4444'
const COLOR_WARN = '#f59e0b'
const COLOR_MUTED = '#6b7280'

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

interface ExpandedState {
  loading: boolean
  events: ScoreEvent[] | null
  error: string | null
}

export default function ScoreHistoryPanel() {
  const [monitors, setMonitors] = useState<MonitorSummary[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<Record<number, ExpandedState>>({})

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetch('/api/monitors')
      .then((r) => {
        if (!r.ok) throw new Error('Failed to load monitors')
        return r.json()
      })
      .then((data: { monitors: MonitorSummary[] }) => {
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

  async function toggleMonitor(id: number) {
    const cur = expanded[id]

    // Collapse if already open
    if (cur && cur.events !== null) {
      setExpanded((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
      return
    }

    // Already loading - ignore
    if (cur?.loading) return

    // Start loading events
    setExpanded((prev) => ({ ...prev, [id]: { loading: true, events: null, error: null } }))

    try {
      const res = await fetch(`/api/monitors/${id}`)
      if (!res.ok) throw new Error('Failed to load monitor history')
      const data: MonitorDetail = await res.json()
      setExpanded((prev) => ({
        ...prev,
        [id]: { loading: false, events: data.events || [], error: null },
      }))
    } catch (e: unknown) {
      setExpanded((prev) => ({
        ...prev,
        [id]: {
          loading: false,
          events: null,
          error: e instanceof Error ? e.message : 'Unknown error',
        },
      }))
    }
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
        const { arrow, color: arrowColor } = trendArrow(m.last_delta)
        const exp = expanded[m.id]
        const isOpen = exp && exp.events !== null
        const scoreCol = gradeColor(m.last_score)

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
              {/* URL / label */}
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-medium truncate" style={{ color: '#ffffff' }}>
                  {m.label || m.url}
                </span>
                {m.label && (
                  <span className="block text-xs truncate" style={{ color: COLOR_MUTED }}>
                    {m.url}
                  </span>
                )}
              </span>

              {/* Grade */}
              {m.last_grade && (
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded"
                  style={{ color: scoreCol, background: `${scoreCol}18` }}
                  data-testid={`grade-${m.id}`}
                >
                  {m.last_grade}
                </span>
              )}

              {/* Score */}
              <span className="text-sm font-semibold w-8 text-right" style={{ color: scoreCol }}>
                {m.last_score ?? '-'}
              </span>

              {/* Trend arrow */}
              <span
                className="text-base w-5 text-center"
                style={{ color: arrowColor }}
                aria-label={
                  m.last_delta === null || m.last_delta === 0
                    ? 'neutral'
                    : m.last_delta > 0
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
            {exp && (
              <div className="px-4 pb-4">
                {exp.loading && (
                  <div className="text-xs py-4 text-center" style={{ color: COLOR_MUTED }}>
                    Loading history…
                  </div>
                )}
                {exp.error && (
                  <div className="text-xs py-4 text-center" style={{ color: COLOR_DANGER }}>
                    {exp.error}
                  </div>
                )}
                {exp.events !== null && (
                  <ScoreHistoryChart monitorId={m.id} events={exp.events} />
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
