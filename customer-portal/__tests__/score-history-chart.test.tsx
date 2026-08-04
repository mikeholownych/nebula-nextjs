/**
 * Tests for ScoreHistoryChart
 * - empty state renders
 * - chart renders with 3 data points
 * - score_delta color logic (line segments)
 */

import React from 'react'
import { render, screen } from '@testing-library/react'
import ScoreHistoryChart, { type ScoreEvent } from '../app/workspace/ScoreHistoryChart'

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

function makeEvent(
  score: number,
  grade: string,
  score_delta: number | null,
  checked_at = '2025-01-01T00:00:00Z',
): ScoreEvent {
  return { score, grade, score_delta, checked_at }
}

// ──────────────────────────────────────────────
// 1. Empty state
// ──────────────────────────────────────────────

describe('ScoreHistoryChart — empty state', () => {
  it('renders "No history yet" when events array is empty', () => {
    render(<ScoreHistoryChart monitorId={1} events={[]} />)
    expect(screen.getByTestId('score-history-empty')).toBeInTheDocument()
    expect(screen.getByText('No history yet')).toBeInTheDocument()
  })

  it('does NOT render the SVG chart when events is empty', () => {
    render(<ScoreHistoryChart monitorId={1} events={[]} />)
    expect(screen.queryByTestId('score-history-chart')).not.toBeInTheDocument()
  })
})

// ──────────────────────────────────────────────
// 2. Chart renders with 3 data points
// ──────────────────────────────────────────────

describe('ScoreHistoryChart — with 3 data points', () => {
  const threeEvents: ScoreEvent[] = [
    makeEvent(80, 'A', null, '2025-01-01T00:00:00Z'),
    makeEvent(65, 'C', -15, '2025-01-08T00:00:00Z'),
    makeEvent(72, 'B', 7, '2025-01-15T00:00:00Z'),
  ]

  it('renders the SVG chart container', () => {
    render(<ScoreHistoryChart monitorId={2} events={threeEvents} />)
    expect(screen.getByTestId('score-history-chart')).toBeInTheDocument()
  })

  it('renders an SVG element', () => {
    const { container } = render(<ScoreHistoryChart monitorId={2} events={threeEvents} />)
    const svg = container.querySelector('svg')
    expect(svg).toBeInTheDocument()
  })

  it('does NOT render the empty state', () => {
    render(<ScoreHistoryChart monitorId={2} events={threeEvents} />)
    expect(screen.queryByTestId('score-history-empty')).not.toBeInTheDocument()
  })

  it('renders exactly 3 visible score dots (circles with pointer-events none)', () => {
    const { container } = render(<ScoreHistoryChart monitorId={2} events={threeEvents} />)
    // Each point has 2 circles: hit area (transparent) + visible dot (pointerEvents none)
    const visibleDots = container.querySelectorAll('circle[style*="pointer-events: none"]')
    expect(visibleDots).toHaveLength(3)
  })

  it('renders exactly 2 line segments', () => {
    const { container } = render(<ScoreHistoryChart monitorId={2} events={threeEvents} />)
    // segments = events.length - 1 = 2; these are <line> elements (not gridlines)
    // gridlines are at 25/50/75/100 → 4 lines; segments are colored accent/danger
    const allLines = container.querySelectorAll('line')
    // Total = 4 gridlines + 2 segments = 6
    expect(allLines).toHaveLength(6)
  })

  it('renders 4 horizontal gridlines (25, 50, 75, 100)', () => {
    const { container } = render(<ScoreHistoryChart monitorId={2} events={threeEvents} />)
    const gridLines = Array.from(container.querySelectorAll('line')).filter(
      (l) => l.getAttribute('stroke') === '#1f1f1f',
    )
    expect(gridLines).toHaveLength(4)
  })
})

// ──────────────────────────────────────────────
// 3. score_delta color logic
// ──────────────────────────────────────────────

describe('ScoreHistoryChart — score_delta / segment color logic', () => {
  /**
   * Color is determined by comparing consecutive scores, not delta value.
   * A drop in score → segment color = #ef4444 (danger/red)
   * A rise or flat   → segment color = #00c2a0 (accent/green)
   */

  it('colors a dropping segment red (#ef4444)', () => {
    const events: ScoreEvent[] = [
      makeEvent(85, 'A', null, '2025-01-01T00:00:00Z'),
      makeEvent(40, 'F', -45, '2025-01-08T00:00:00Z'),
    ]
    const { container } = render(<ScoreHistoryChart monitorId={3} events={events} />)
    const segments = Array.from(container.querySelectorAll('line')).filter(
      (l) => l.getAttribute('stroke') === '#ef4444',
    )
    expect(segments.length).toBeGreaterThanOrEqual(1)
  })

  it('colors a rising segment accent green (#00c2a0)', () => {
    const events: ScoreEvent[] = [
      makeEvent(50, 'C', null, '2025-01-01T00:00:00Z'),
      makeEvent(90, 'A', 40, '2025-01-08T00:00:00Z'),
    ]
    const { container } = render(<ScoreHistoryChart monitorId={4} events={events} />)
    const segments = Array.from(container.querySelectorAll('line')).filter(
      (l) => l.getAttribute('stroke') === '#00c2a0',
    )
    expect(segments.length).toBeGreaterThanOrEqual(1)
  })

  it('colors a high-score dot accent green (#00c2a0)', () => {
    // Score >= 70 → accent green fill
    const events: ScoreEvent[] = [makeEvent(80, 'A', null, '2025-01-01T00:00:00Z')]
    const { container } = render(<ScoreHistoryChart monitorId={5} events={events} />)
    const greenDot = Array.from(container.querySelectorAll('circle')).find(
      (c) => c.getAttribute('fill') === '#00c2a0',
    )
    expect(greenDot).toBeInTheDocument()
  })

  it('colors a mid-range dot amber (#f59e0b) for scores 50–69', () => {
    // Score 50-69 → amber
    const events: ScoreEvent[] = [makeEvent(60, 'C', null, '2025-01-01T00:00:00Z')]
    const { container } = render(<ScoreHistoryChart monitorId={6} events={events} />)
    const amberDot = Array.from(container.querySelectorAll('circle')).find(
      (c) => c.getAttribute('fill') === '#f59e0b',
    )
    expect(amberDot).toBeInTheDocument()
  })

  it('colors a low-score dot red (#ef4444) for scores < 50', () => {
    // Score < 50 → danger red
    const events: ScoreEvent[] = [makeEvent(30, 'F', null, '2025-01-01T00:00:00Z')]
    const { container } = render(<ScoreHistoryChart monitorId={7} events={events} />)
    const redDot = Array.from(container.querySelectorAll('circle')).find(
      (c) => c.getAttribute('fill') === '#ef4444',
    )
    expect(redDot).toBeInTheDocument()
  })

  it('renders mixed-color segments for a sequence with drops and rises', () => {
    const events: ScoreEvent[] = [
      makeEvent(80, 'A', null, '2025-01-01T00:00:00Z'),  // start
      makeEvent(50, 'C', -30, '2025-01-08T00:00:00Z'),   // drop → red
      makeEvent(75, 'B', 25, '2025-01-15T00:00:00Z'),    // rise → green
    ]
    const { container } = render(<ScoreHistoryChart monitorId={8} events={events} />)

    const redSegs = Array.from(container.querySelectorAll('line')).filter(
      (l) => l.getAttribute('stroke') === '#ef4444',
    )
    const greenSegs = Array.from(container.querySelectorAll('line')).filter(
      (l) => l.getAttribute('stroke') === '#00c2a0',
    )
    expect(redSegs.length).toBeGreaterThanOrEqual(1)
    expect(greenSegs.length).toBeGreaterThanOrEqual(1)
  })
})
