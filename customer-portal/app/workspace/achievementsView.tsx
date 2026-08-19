'use client'

import { useEffect, useState } from 'react'

interface Badge {
  id: string
  serial_number: number
  url: string
  before_score: number
  after_score: number
  earned_at: string
}

interface AuditFinding {
  key: string
  label: string
  impact: number
  effort: number
  quadrant: string
}

interface AuditDetail {
  audit_id: string
  url: string
  status: string
  score: number
  grade: string
  findings: AuditFinding[]
}

const SIGNALS = [
  { key: 'headline', label: 'Headline Clarity' },
  { key: 'cta', label: 'CTA Strength' },
  { key: 'above_fold', label: 'Above the Fold' },
  { key: 'social_proof', label: 'Social Proof' },
  { key: 'mobile', label: 'Mobile Experience' },
  { key: 'load_speed', label: 'Load Speed' },
  { key: 'ad_signals', label: 'Ad Signals' },
  { key: 'seo_foundations', label: 'SEO Foundations' },
  { key: 'ai_readiness', label: 'AI Readiness' },
]

interface Props {
  email: string
  latestAuditId: string | null
}

export default function AchievementsView({ email, latestAuditId }: Props) {
  const [badges, setBadges] = useState<Badge[]>([])
  const [detail, setDetail] = useState<AuditDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const badgesRes = await fetch(`/api/badges?email=${encodeURIComponent(email)}`)
        if (!badgesRes.ok) throw new Error('Failed to load badges')
        const badgesData = await badgesRes.json()
        setBadges(badgesData.badges || [])

        if (latestAuditId) {
          const detailRes = await fetch(`/api/audit/${latestAuditId}`)
          if (detailRes.ok) {
            const d = await detailRes.json()
            setDetail(d)
          }
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Something went wrong')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [email, latestAuditId])

  const failedKeys = new Set((detail?.findings || []).map((f) => f.key))
  const passingSignals = SIGNALS.filter((s) => !failedKeys.has(s.key))
  const passingCount = passingSignals.length
  const progressPct = Math.round((passingCount / SIGNALS.length) * 100)

  if (loading) {
    return <p className="text-fg-muted text-sm">Loading achievements…</p>
  }

  if (error) {
    return <p className="text-danger text-sm">{error}</p>
  }

  return (
    <div className="space-y-10">
      {/* ── Earned Badges ──────────────────────────────────────────── */}
      <section>
        <h2 className="text-xl font-bold mb-1">Earned Badges</h2>
        <p className="text-sm text-fg-muted mb-5">
          Pages that passed all 9 conversion signals earn a Nebula Verified badge.
        </p>

        {badges.length === 0 ? (
          <div className="rounded-lg border border-border bg-bg-elevated p-6 text-center text-fg-dim text-sm">
            No badges earned yet. Fix all 9 signals on one of your pages to earn your first badge.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {badges.map((badge) => {
              const earned = new Date(badge.earned_at)
              const displayDate = earned.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })
              return (
                <div
                  key={badge.id}
                  className="rounded border border-accent/30 bg-bg-elevated p-5 flex flex-col gap-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-accent tracking-widest uppercase">
                      Nebula Verified
                    </span>
                    <span className="text-xs text-fg-dim font-mono">
                      #{badge.serial_number}
                    </span>
                  </div>
                  <p
                    className="text-sm text-fg font-medium truncate"
                    title={badge.url}
                  >
                    {badge.url.replace(/^https?:\/\//, '')}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold text-fg">
                      {badge.before_score}
                    </span>
                    <span className="text-fg-dim text-lg">→</span>
                    <span className="text-2xl font-bold text-accent">
                      {badge.after_score}
                    </span>
                    <span className="text-xs text-fg-dim ml-1">score</span>
                  </div>
                  <p className="text-xs text-fg-dim">Earned {displayDate}</p>
                </div>
              )
            })}
          </div>
        )}
      </section>

      {/* ── Signal Checklist ───────────────────────────────────────── */}
      <section>
        <h2 className="text-xl font-bold mb-1">Conversion Signal Checklist</h2>
        <p className="text-sm text-fg-muted mb-2">
          Based on your most recent audit.{' '}
          {!latestAuditId && (
            <span className="text-fg-dim">Run an audit to see your signal status.</span>
          )}
        </p>

        {/* Certification progress bar */}
        <div className="mb-5">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-sm font-medium text-fg-muted">
              Certification Progress
            </span>
            <span className="text-sm font-semibold text-accent">
              {passingCount} / {SIGNALS.length} signals passing
            </span>
          </div>
          <div className="h-2.5 w-full rounded-full bg-bg-elevated">
            <div
              className="h-2.5 rounded-full bg-accent transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          {passingCount === SIGNALS.length && (
            <p className="mt-2 text-xs text-accent font-medium">
              All signals passing - your next completed audit will earn a badge!
            </p>
          )}
        </div>

        <ul className="space-y-2">
          {SIGNALS.map((signal) => {
            const passing = !failedKeys.has(signal.key)
            return (
              <li
                key={signal.key}
                className={`flex items-center justify-between rounded-lg border px-4 py-3 ${
                  passing
                    ? 'border-accent/30 bg-accent-dim'
                    : 'border-border bg-bg-elevated'
                }`}
              >
                <span className="text-sm text-fg">{signal.label}</span>
                {!latestAuditId ? (
                  <span className="text-xs text-fg-dim">-</span>
                ) : passing ? (
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-accent">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Pass
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-danger">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                    Fail
                  </span>
                )}
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
