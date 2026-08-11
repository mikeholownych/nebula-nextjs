'use client'

import { useEffect, useState } from 'react'

interface GscStatus {
  connected: boolean
  site_url?: string | null
}

interface DailyRow {
  date: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

interface GscMetrics {
  totals?: {
    clicks: number
    impressions: number
    ctr: number
    position: number
  }
  rows?: DailyRow[]
  site_url?: string | null
}

// ── Mini sparkline for clicks ──────────────────────────────────────────

function ClicksSparkline({ rows }: { rows: DailyRow[] }) {
  if (rows.length < 2) return null
  const values = rows.map((r) => r.clicks)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const W = 200
  const H = 40
  const step = W / (values.length - 1)
  const pts = values
    .map((v, i) => {
      const x = (i * step).toFixed(1)
      const y = (H - 4 - ((v - min) / range) * (H - 8)).toFixed(1)
      return `${x},${y}`
    })
    .join(' ')

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      className="overflow-visible"
      aria-hidden="true"
    >
      <path d={`M0,${H} L` + values.map((v, i) => `${(i * step).toFixed(1)},${(H - 4 - ((v - min) / range) * (H - 8)).toFixed(1)}`).join(' L') + ` L${W},${H} Z`} fill="rgba(0,194,160,0.10)" />
      <polyline
        points={pts}
        fill="none"
        stroke="#00c2a0"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// ── Stat card ─────────────────────────────────────────────────────────

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-bg p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-fg-dim">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-fg">{value}</p>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────

export default function GscWidget({ email }: { email: string }) {
  const [status, setStatus] = useState<GscStatus | null>(null)
  const [metrics, setMetrics] = useState<GscMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [disconnecting, setDisconnecting] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    fetch('/api/gsc/status')
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to check GSC status')
        const data: GscStatus = await res.json()
        if (cancelled) return
        setStatus(data)
        if (data.connected) {
          const siteUrl = data.site_url
          if (siteUrl) {
            const mRes = await fetch(`/api/gsc/metrics?days=28&site_url=${encodeURIComponent(siteUrl)}`)
            if (!cancelled && mRes.ok) {
              const m: GscMetrics = await mRes.json()
              setMetrics(m)
            }
          }
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Connection error')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [email])

  const handleDisconnect = async () => {
    setDisconnecting(true)
    try {
      const res = await fetch('/api/gsc/disconnect', { method: 'POST' })
      if (!res.ok) throw new Error('Disconnect failed')
      setStatus({ connected: false, site_url: null })
      setMetrics(null)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Disconnect failed')
    } finally {
      setDisconnecting(false)
    }
  }

  // Loading
  if (loading) {
    return (
      <div className="rounded-2xl border border-border bg-bg-elevated p-6 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <p className="text-sm text-fg-muted">Checking Search Console connection…</p>
      </div>
    )
  }

  // Error
  if (error && !status) {
    return (
      <div className="rounded-2xl border border-border bg-bg-elevated p-6 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <p className="text-sm text-danger">{error}</p>
      </div>
    )
  }

  // NOT connected
  if (!status?.connected) {
    return (
      <div className="rounded-2xl border border-border bg-bg-elevated p-6 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-fg-dim">Integrations</p>
            <h2 className="mt-2 text-lg font-semibold tracking-[-0.02em] text-fg">Google Search Console</h2>
            <p className="mt-1 text-sm text-fg-muted">See your real traffic data alongside your audit scores.</p>
          </div>
          <a
            href="/api/gsc/connect"
            className="inline-flex items-center gap-2 rounded-lg bg-[#00c2a0] px-4 py-2.5 text-sm font-semibold text-bg hover:bg-[#00a88a] transition-colors"
          >
            Connect Search Console →
          </a>
        </div>

        <ul className="mt-6 space-y-2">
          {[
            'Real clicks & impressions from Google',
            'Average position per page',
            'Track organic growth over time',
          ].map((item) => (
            <li key={item} className="flex items-center gap-2 text-sm text-fg-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-[#00c2a0] shrink-0" aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    )
  }

  // CONNECTED
  const t = metrics?.totals
  const siteUrl = metrics?.site_url || status.site_url || '-'
  const rows = metrics?.rows || []

  return (
    <div className="rounded-2xl border border-border bg-bg-elevated p-6 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-fg-dim">Integrations · Last 28 days</p>
          <h2 className="mt-2 text-lg font-semibold tracking-[-0.02em] text-fg">Google Search Console</h2>
          {siteUrl !== '-' && (
            <p className="mt-0.5 text-sm text-fg-muted">{siteUrl}</p>
          )}
        </div>
        <button
          onClick={handleDisconnect}
          disabled={disconnecting}
          className="rounded-lg border border-border px-3 py-2 text-xs font-semibold text-fg-muted hover:border-border hover:bg-bg-panel disabled:opacity-40 transition-colors"
        >
          {disconnecting ? 'Disconnecting…' : 'Disconnect'}
        </button>
      </div>

      {error && <p className="mb-4 text-sm text-danger">{error}</p>}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Clicks" value={t ? t.clicks.toLocaleString() : '-'} />
        <StatCard label="Impressions" value={t ? t.impressions.toLocaleString() : '-'} />
        <StatCard label="Avg CTR" value={t ? `${(t.ctr * 100).toFixed(1)}%` : '-'} />
        <StatCard label="Avg Position" value={t ? t.position.toFixed(1) : '-'} />
      </div>

      {rows.length >= 2 && (
        <div className="mt-5">
          <p className="mb-2 text-xs text-fg-dim">Clicks over time</p>
          <ClicksSparkline rows={rows} />
        </div>
      )}
    </div>
  )
}
