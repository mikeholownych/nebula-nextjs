'use client'

import { useEffect, useState } from 'react'

interface RecentFindingData {
  key?: string
  label: string
  issue: string
  impact: number
  quadrant: string
  overall_score: number | null
  grade: string | null
  completed_at: string
}

const DEPRECATED_FINDING_KEYS = new Set(['above_fold', 'ad_signals'])
const DEPRECATED_FINDING_LABELS = new Set(['above fold', 'above-fold clarity', 'ad signals'])

/**
 * Shows the highest-impact finding from the most recently completed audit.
 * Proves the engine is live and running — not a static demo.
 * No URL is exposed — only the finding label, issue, and time-ago.
 * Renders nothing if no data is available (graceful degradation).
 */
export default function RecentFinding() {
  const [finding, setFinding] = useState<RecentFindingData | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/audit/stats/recent-finding')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: RecentFindingData | null) => {
        const normalizedLabel = data?.label.trim().toLowerCase()
        const isDeprecated = Boolean(
          data &&
            ((data.key && DEPRECATED_FINDING_KEYS.has(data.key)) ||
              (normalizedLabel && DEPRECATED_FINDING_LABELS.has(normalizedLabel))),
        )
        if (!cancelled && data && data.label && data.issue && !isDeprecated) setFinding(data)
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
