'use client'

/**
 * GA4 Fix-Effectiveness card (Phase 2 surface).
 * Connect/select property, then show pre/post conversion correlation for the
 * most recent completed audit. Consumes the session-auth BFF routes under
 * /api/ga4/* which forward credentials to the Platform API.
 */

import { useCallback, useEffect, useState } from 'react'

interface Ga4Status {
  connected: boolean
  property_id?: string | null
  property_display_name?: string | null
}

interface Property {
  property_id: string
  display_name?: string | null
  selected?: boolean
}

interface Correlation {
  path?: string
  baseline?: { conversion_rate_pct: number | null; sessions: number }
  post?: { conversion_rate_pct: number | null; sessions: number }
  deltas?: {
    conversions_change_pct: number | null
    sessions_change_pct: number | null
    sample_note?: string | null
  }
  signal_change?: { score_before: number; score_after: number } | null
}

const card = 'rounded-lg border border-border bg-bg-panel p-5'
const btn =
  'inline-flex min-h-[36px] items-center rounded px-3 py-1.5 text-sm font-medium transition-opacity hover:opacity-85'

export default function Ga4Widget({
  email,
  latestCompletedAuditId,
}: {
  email?: string
  latestCompletedAuditId?: string | null
}) {
  const [status, setStatus] = useState<Ga4Status | null>(null)
  const [properties, setProperties] = useState<Property[]>([])
  const [correlation, setCorrelation] = useState<Correlation | null>(null)
  const [busy, setBusy] = useState(false)

  const loadStatus = useCallback(async () => {
    const r = await fetch('/api/ga4/status', { cache: 'no-store' })
    if (r.ok) setStatus(await r.json())
  }, [])

  useEffect(() => {
    if (!email) return
    void loadStatus()
  }, [email, loadStatus])

  useEffect(() => {
    if (!status?.connected || correlation) return
    void (async () => {
      const pr = await fetch('/api/ga4/properties', { cache: 'no-store' })
      if (pr.ok) setProperties((await pr.json()).properties ?? [])
    })()
  }, [status?.connected, correlation])

  useEffect(() => {
    if (!status?.connected || !status.property_id || !latestCompletedAuditId) return
    void (async () => {
      setBusy(true)
      const r = await fetch(`/api/ga4/correlation/${latestCompletedAuditId}`, {
        cache: 'no-store',
      })
      if (r.ok) setCorrelation(await r.json())
      setBusy(false)
    })()
  }, [status?.connected, status?.property_id, latestCompletedAuditId])

  async function selectProperty(property_id: string) {
    setBusy(true)
    await fetch('/api/ga4/select', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ property_id }),
    })
    await loadStatus()
    setBusy(false)
  }

  if (!email) return null

  return (
    <section className={card} aria-label="GA4 fix effectiveness">
      <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-fg-muted">
        GA4 · Fix effectiveness
      </h3>

      {!status ? (
        <p className="text-sm text-fg-muted">Loading…</p>
      ) : !status.connected ? (
        <>
          <p className="text-sm text-fg-muted">
            Connect Google Analytics to prove your fixes moved real conversions.
          </p>
          <a href="/api/ga4/connect" className={`${btn} mt-3 bg-accent text-bg`}>
            Connect GA4
          </a>
        </>
      ) : properties.length > 0 && !status.property_id ? (
        <div className="mt-2 space-y-2">
          <p className="text-sm text-fg-muted">Choose a property:</p>
          {properties.map((p) => (
            <button
              key={p.property_id}
              onClick={() => void selectProperty(p.property_id)}
              disabled={busy}
              className={`${btn} w-full justify-between border border-border`}
            >
              <span>{p.display_name ?? p.property_id}</span>
              <span aria-hidden>→</span>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-fg-muted">
            Property: {status.property_display_name ?? status.property_id}
          </p>
          {!latestCompletedAuditId ? (
            <p className="text-sm text-fg-muted">No completed audit yet.</p>
          ) : busy ? (
            <p className="text-sm text-fg-muted">Measuring…</p>
          ) : correlation?.deltas ? (
            <dl className="grid grid-cols-2 gap-3">
              <div>
                <dt className="text-xs text-fg-muted">Baseline conv.</dt>
                <dd className="text-lg font-semibold">
                  {correlation.baseline?.conversion_rate_pct ?? '—'}%
                </dd>
              </div>
              <div>
                <dt className="text-xs text-fg-muted">Post-fix conv.</dt>
                <dd className="text-lg font-semibold text-signal-teal">
                  {correlation.post?.conversion_rate_pct ?? '—'}%
                </dd>
              </div>
              <div className="col-span-2 text-sm">
                Conversions{' '}
                <strong data-testid="ga4-delta">
                  {correlation.deltas.conversions_change_pct === null
                    ? '—'
                    : `${correlation.deltas.conversions_change_pct > 0 ? '+' : ''}${correlation.deltas.conversions_change_pct}%`}
                </strong>{' '}
                (sessions{' '}
                {correlation.deltas.sessions_change_pct === null
                  ? '—'
                  : `${correlation.deltas.sessions_change_pct > 0 ? '+' : ''}${correlation.deltas.sessions_change_pct}%`}
                )
              </div>
              {correlation.deltas.sample_note && (
                <p className="col-span-2 text-xs italic text-fg-muted">
                  {correlation.deltas.sample_note}
                </p>
              )}
              {correlation.signal_change && (
                <p className="col-span-2 text-xs text-fg-muted">
                  Page signal score {correlation.signal_change.score_before} →{' '}
                  {correlation.signal_change.score_after}
                </p>
              )}
            </dl>
          ) : (
            <p className="text-sm text-fg-muted">
              No fix timeline yet — correlation appears after a delivered fix.
            </p>
          )}
        </div>
      )}
    </section>
  )
}
