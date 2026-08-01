'use client'

import { useEffect, useState } from 'react'

interface RecentFinding {
  label: string
  issue: string
  impact: number
  quadrant: string
  overall_score: number | null
  grade: string | null
  completed_at: string
}

/**
 * Shows the highest-impact finding from the most recently completed audit.
 * Proves the engine is live and running — not a static demo.
 * No URL is exposed — only the finding label, issue, and time-ago.
 * Renders nothing if no data is available (graceful degradation).
 */
export default function RecentFinding() {
  const [finding, setFinding] = useState<RecentFinding | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/audit/stats/recent-finding')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: RecentFinding | null) => {
        if (!cancelled && data && data.label && data.issue) setFinding(data)
      })
      .catch(() => {
        // No data — render nothing rather than fabricating.
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (!finding) return null

  return (
    <div className="mx-auto mt-6 max-w-lg rounded-xl border border-border bg-bg-panel px-5 py-4">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent">
          Last finding — {finding.completed_at}
        </p>
        {finding.overall_score !== null && (
          <span className="text-xs font-mono text-fg-muted">
            {finding.overall_score}/10 · {finding.grade}
          </span>
        )}
      </div>
      <p className="text-sm font-semibold text-fg">{finding.label}</p>
      <p className="mt-1 text-xs leading-relaxed text-fg-muted line-clamp-2">{finding.issue}</p>
      {finding.impact > 0 && (
        <p className="mt-2 text-xs text-fg-muted">
          Impact: <span className="font-semibold text-accent">{finding.impact}/10</span>
          {finding.quadrant && (
            <> · <span className="capitalize">{finding.quadrant.replace('_', ' ')}</span></>
          )}
        </p>
      )}
    </div>
  )
}
