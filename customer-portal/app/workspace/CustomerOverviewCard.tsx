'use client'

import { useState, useEffect } from 'react'

interface CustomerStats {
  email: string
  joinedAt: string
  totalAudits: number
  paidAudits: number
  creditBalance: number
  referralCode?: string
  referralsCount?: number
  healthScore?: number
  nurtureActive?: boolean
  nurtureNext?: string
}

export function CustomerOverviewCard({ email: propEmail }: { email?: string }) {
  const [email, setEmail] = useState<string | undefined>(propEmail)
  const [stats, setStats] = useState<CustomerStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!email) {
      setLoading(false)
      return
    }

    fetch('/api/dashboard', { 
      credentials: 'include',
      cache: 'no-store',
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.profile) {
          setStats({
            email: data.profile.email,
            joinedAt: data.profile.joinedAt,
            totalAudits: data.profile.totalAudits,
            paidAudits: data.profile.paidAudits,
            creditBalance: data.profile.creditBalance,
            referralCode: data.referrals?.code,
            referralsCount: data.referrals?.referralsCount,
            healthScore: data.health?.healthScore,
            nurtureActive: data.nurture?.activeSequences && data.nurture.activeSequences > 0,
            nurtureNext: data.nurture?.nextSequence,
          })
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [email])

  if (loading) {
    return (
      <section className="rounded-md border border-border bg-bg-elevated p-6 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-fg-dim">Your account</p>
        <div className="mt-4 h-32 flex items-center justify-center text-fg-muted">Loading account data…</div>
      </section>
    )
  }

  if (!stats) {
    return null
  }

  return (
    <section className="rounded-md border border-border bg-bg-elevated p-6 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-fg-dim">Your account</p>
          <h2 className="mt-2 text-lg font-semibold text-fg">{stats.email}</h2>
        </div>
        {stats.referralCode && (
          <span className="rounded-full bg-[#c7ff2f]/10 px-2.5 py-1 text-xs font-semibold text-[#c7ff2f]">
            Referral: {stats.referralCode}
          </span>
        )}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg bg-bg px-4 py-3">
          <p className="text-xs text-fg-muted">Total audits</p>
          <p className="mt-1 text-2xl font-semibold text-fg">{stats.totalAudits}</p>
          <p className="text-xs text-fg-muted">{stats.paidAudits} paid • ${stats.paidAudits * 97} revenue</p>
        </div>
        <div className="rounded-lg bg-bg px-4 py-3">
          <p className="text-xs text-fg-muted">Referrals earned</p>
          <p className="mt-1 text-2xl font-semibold text-fg">{stats.referralsCount || 0}</p>
          <p className="text-xs text-fg-muted">${(stats.referralsCount || 0) * 50} credits pending</p>
        </div>
      </div>

      {stats.healthScore !== undefined && (
        <div className="mt-4 rounded-lg bg-[#c7ff2f]/10 px-4 py-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-fg">Health score</p>
            <span className={`text-sm font-bold ${
              stats.healthScore >= 80 ? 'text-[#28733e]' :
              stats.healthScore >= 60 ? 'text-[#a43a35]' :
              'text-red-600'
            }`}>
              {stats.healthScore}/100
            </span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-[#1f2937]">
            <div
              className={`h-2 rounded-full ${
                stats.healthScore >= 80 ? 'bg-[#c7ff2f]' :
                stats.healthScore >= 60 ? 'bg-[#f59e0b]' :
                'bg-red-600'
              }`}
              style={{ width: `${stats.healthScore}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-fg-muted">
            {stats.nurtureNext && stats.nurtureActive ? `Next: ${stats.nurtureNext}` : 'No active nurture sequences'}
          </p>
        </div>
      )}
    </section>
  )
}
