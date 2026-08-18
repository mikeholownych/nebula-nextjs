'use client'

import { useState } from 'react'

export interface ScoreEvent {
  score: number
  grade: string
  score_delta: number | null
  checked_at: string
}

export interface ScoreHistoryChartProps {
  monitorId: number
  events: ScoreEvent[]
}

// Brand colors
const COLOR_ACCENT = '#c7ff2f'
const COLOR_DANGER = '#ef4444'
const COLOR_WARN = '#f59e0b'
const COLOR_BG = '#0a0a0a'
const COLOR_GRID = '#1f1f1f'
const COLOR_FG = '#ffffff'
const COLOR_MUTED = '#6b7280'

function getScoreColor(score: number): string {
  if (score >= 70) return COLOR_ACCENT
  if (score >= 50) return COLOR_WARN
  return COLOR_DANGER
}

const W = 560
const H = 200
const PAD = { top: 16, right: 24, bottom: 36, left: 40 }
const PLOT_W = W - PAD.left - PAD.right
const PLOT_H = H - PAD.top - PAD.bottom

function scoreToY(score: number): number {
  // score 0-100 mapped to plot height (top = 100, bottom = 0)
  return PAD.top + PLOT_H - (score / 100) * PLOT_H
}

function indexToX(i: number, total: number): number {
  if (total <= 1) return PAD.left + PLOT_W / 2
  return PAD.left + (i / (total - 1)) * PLOT_W
}

export default function ScoreHistoryChart({ events }: ScoreHistoryChartProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)

  if (!events || events.length === 0) {
    return (
      <div
        data-testid="score-history-empty"
        style={{ background: COLOR_BG }}
        className="rounded-lg flex items-center justify-center h-[200px] text-sm"
      >
        <span style={{ color: COLOR_MUTED }}>No history yet</span>
      </div>
    )
  }

  // Build polyline points for the connected line
  const points = events.map((ev, i) => ({
    x: indexToX(i, events.length),
    y: scoreToY(ev.score),
    score: ev.score,
    grade: ev.grade,
    delta: ev.score_delta,
    date: new Date(ev.checked_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
  }))

  // Build line segments so each can be colored by drop/rise
  const segments = points.slice(1).map((pt, i) => ({
    x1: points[i].x,
    y1: points[i].y,
    x2: pt.x,
    y2: pt.y,
    // color by direction: drop = red, else accent
    color: pt.score < points[i].score ? COLOR_DANGER : COLOR_ACCENT,
  }))

  const GRIDLINES = [25, 50, 75, 100]

  const hovered = hoverIdx !== null ? points[hoverIdx] : null

  return (
    <div
      data-testid="score-history-chart"
      style={{ background: COLOR_BG }}
      className="rounded-lg overflow-visible"
    >
      <svg
        width="100%"
        viewBox={`0 0 ${W} ${H}`}
        aria-label="Score history chart"
        style={{ display: 'block', overflow: 'visible' }}
      >
        {/* Background */}
        <rect width={W} height={H} fill={COLOR_BG} rx={8} />

        {/* Horizontal gridlines at 25 / 50 / 75 / 100 */}
        {GRIDLINES.map((g) => {
          const y = scoreToY(g)
          return (
            <g key={g}>
              <line
                x1={PAD.left}
                y1={y}
                x2={PAD.left + PLOT_W}
                y2={y}
                stroke={COLOR_GRID}
                strokeWidth={1}
              />
              {/* Label */}
              <text
                x={PAD.left - 6}
                y={y + 4}
                textAnchor="end"
                fill={COLOR_MUTED}
                fontSize={10}
              >
                {g}
              </text>
            </g>
          )
        })}

        {/* Line segments colored by drop/rise */}
        {segments.map((seg, i) => (
          <line
            key={i}
            x1={seg.x1}
            y1={seg.y1}
            x2={seg.x2}
            y2={seg.y2}
            stroke={seg.color}
            strokeWidth={2}
            strokeLinecap="round"
          />
        ))}

        {/* Score dots */}
        {points.map((pt, i) => (
          <g key={i}>
            {/* Larger transparent hit area for hover */}
            <circle
              cx={pt.x}
              cy={pt.y}
              r={12}
              fill="transparent"
              onMouseEnter={() => setHoverIdx(i)}
              onMouseLeave={() => setHoverIdx(null)}
              style={{ cursor: 'pointer' }}
            />
            <circle
              cx={pt.x}
              cy={pt.y}
              r={hoverIdx === i ? 6 : 4}
              fill={getScoreColor(pt.score)}
              stroke={COLOR_BG}
              strokeWidth={2}
              style={{ pointerEvents: 'none' }}
            />
          </g>
        ))}

        {/* Hover tooltip */}
        {hovered && hoverIdx !== null && (() => {
          const tipW = 96
          const tipH = 52
          let tipX = hovered.x - tipW / 2
          if (tipX < PAD.left) tipX = PAD.left
          if (tipX + tipW > W - PAD.right) tipX = W - PAD.right - tipW
          const tipY = hovered.y - tipH - 10

          return (
            <g data-testid={`tooltip-${hoverIdx}`} style={{ pointerEvents: 'none' }}>
              <rect
                x={tipX}
                y={tipY}
                width={tipW}
                height={tipH}
                rx={4}
                fill="#1a1a1a"
                stroke="#2a2a2a"
                strokeWidth={1}
              />
              {/* Grade */}
              <text
                x={tipX + tipW / 2}
                y={tipY + 16}
                textAnchor="middle"
                fill={getScoreColor(hovered.score)}
                fontSize={13}
                fontWeight="bold"
              >
                {hovered.grade}
              </text>
              {/* Score */}
              <text
                x={tipX + tipW / 2}
                y={tipY + 30}
                textAnchor="middle"
                fill={COLOR_FG}
                fontSize={11}
              >
                Score {hovered.score}
              </text>
              {/* Date */}
              <text
                x={tipX + tipW / 2}
                y={tipY + 44}
                textAnchor="middle"
                fill={COLOR_MUTED}
                fontSize={10}
              >
                {hovered.date}
              </text>
            </g>
          )
        })()}

        {/* X-axis date labels (first, middle, last) */}
        {events.length >= 2 && [0, events.length - 1].map((idx) => (
          <text
            key={idx}
            x={points[idx].x}
            y={H - 8}
            textAnchor={idx === 0 ? 'start' : 'end'}
            fill={COLOR_MUTED}
            fontSize={10}
          >
            {points[idx].date}
          </text>
        ))}
      </svg>
    </div>
  )
}
