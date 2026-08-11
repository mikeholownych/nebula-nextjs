'use client'

import { useEffect, useState } from 'react'

interface StatsResponse {
  completed_audits: number
}

/**
 * Real, unfabricated audit volume - not "500+ pages audited" theater.
 * The safe version of "show real evidence, not marketing prose": an
 * aggregate stat instead of publicly displaying redlined critiques of
 * real third-party businesses' pages without their consent, which was
 * the riskier variant this was deliberately built to avoid.
 */
export default function AggregateProof() {
  const [stats, setStats] = useState<StatsResponse | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/audit/stats')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: StatsResponse | null) => {
        if (!cancelled && data && typeof data.completed_audits === 'number') setStats(data)
      })
      .catch(() => {
        // No stats available - render nothing rather than a fabricated number.
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (!stats || stats.completed_audits === 0) return null

  return (
    <p className="mx-auto mt-4 max-w-lg text-center font-mono text-xs text-fg-muted">
      {stats.completed_audits} verified audit{stats.completed_audits === 1 ? '' : 's'} in the completed sample
      {' '}- not a projection, the actual number
    </p>
  )
}
