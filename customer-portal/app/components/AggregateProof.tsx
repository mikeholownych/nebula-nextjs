'use client'

import { useEffect, useState } from 'react'

interface StatsResponse {
  completed_audits: number
}

// Static fallback: real audit count as of 2026-08-17 when this fallback was set.
// Updated from the live API on success; kept on failure so the component never
// renders blank. This is not a marketing claim - it is the actual number at the
// time of writing (API returned {completed_audits: 139, avg_score: null}).
const STATIC_FALLBACK: StatsResponse = { completed_audits: 139 }

/**
 * Real, unfabricated audit volume - not "500+ pages audited" theater.
 * The safe version of "show real evidence, not marketing prose": an
 * aggregate stat instead of publicly displaying redlined critiques of
 * real third-party businesses' pages without their consent, which was
 * the riskier variant this was deliberately built to avoid.
 *
 * Renders immediately with a static fallback (the real count at code-write
 * time) and updates to the live number once the fetch resolves. On failure,
 * keeps the static fallback rather than going blank.
 */
export default function AggregateProof() {
  const [stats, setStats] = useState<StatsResponse>(STATIC_FALLBACK)

  useEffect(() => {
    let cancelled = false
    fetch('/api/audit/stats')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: StatsResponse | null) => {
        if (!cancelled && data && typeof data.completed_audits === 'number') setStats(data)
        // On null/bad response: keep the static fallback already in state.
      })
      .catch(() => {
        // Fetch failed - keep the static fallback already in state; don't go blank.
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <p className="mt-3 font-mono text-xs text-fg-muted">
      {stats.completed_audits}+ landing pages audited
    </p>
  )
}
