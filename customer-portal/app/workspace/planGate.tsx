'use client'

/**
 * Plan gating for workspace features.
 *
 * Philosophy: free users see the tab, click it, and land on a clear
 * upgrade prompt - not a blank screen or a 403. The lock is visible in
 * the nav so they know value exists behind it.
 */

// subscription-plans is the canonical source of truth; imported by consumers
import Link from 'next/link'

export type AccessLevel = 'free' | 'pro' | 'growth' | 'agency'

// Which plan level is required to access each workspace tab
export const TAB_ACCESS_REQUIREMENTS: Record<string, AccessLevel> = {
  aiSearch: 'free',
  roiCalculator: 'free',
  compare: 'free',
  monitoring: 'pro',
  timeline: 'pro',
  reports: 'pro',
  experiments: 'pro',
  tracker: 'pro',
  team: 'growth',
  diff: 'free',
  recommendations: 'free',
  achievements: 'free',
  assistant: 'free',
  audits: 'free',
  projects: 'free',
  pages: 'free',
  dashboard: 'free',
  billing: 'free',
  settings: 'free',
}

const PLAN_RANK: Record<AccessLevel, number> = {
  free: 0,
  pro: 1,
  growth: 2,
  agency: 3,
}

/** Resolve effective plan level from billing summary */
export function resolvePlanLevel(plan: string | null | undefined): AccessLevel {
  if (!plan) return 'free'
  if (plan === 'agency') return 'agency'
  if (plan === 'growth') return 'growth'
  if (plan === 'pro') return 'pro'
  // fix-pack buyers get pro-level access as a courtesy
  if (plan === 'fix-pack') return 'pro'
  return 'free'
}

export function canAccess(userLevel: AccessLevel, required: AccessLevel): boolean {
  return PLAN_RANK[userLevel] >= PLAN_RANK[required]
}

interface LockedTabProps {
  tabLabel: string
  requiredPlan: AccessLevel
  currentPlan: AccessLevel
}

const PLAN_DETAILS: Record<AccessLevel, { name: string; price: string; href: string }> = {
  free: { name: 'Free', price: '$0', href: '/pricing' },
  pro: { name: 'Pro', price: '$29/mo', href: '/pricing#pro' },
  growth: { name: 'Growth', price: '$79/mo', href: '/pricing#growth' },
  agency: { name: 'Agency', price: '$497/mo', href: '/pricing#agency' },
}

export function LockedTab({ tabLabel, requiredPlan, currentPlan }: LockedTabProps) {
  const required = PLAN_DETAILS[requiredPlan]
  const current = PLAN_DETAILS[currentPlan]

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center px-6 py-16 text-center">
      {/* Lock icon */}
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-md border border-border bg-bg-elevated">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="3" y="11" width="18" height="11" rx="2" stroke="currentColor" strokeWidth="1.5" className="text-fg-muted"/>
          <path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-fg-muted"/>
          <circle cx="12" cy="16" r="1.5" fill="currentColor" className="text-fg-muted"/>
        </svg>
      </div>

      <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-accent">
        {required.name} feature
      </p>
      <h2 className="mb-2 text-xl font-extrabold text-fg">{tabLabel} requires {required.name}</h2>
      <p className="mb-6 max-w-sm text-sm leading-relaxed text-fg-muted">
        You&apos;re on the <strong className="text-fg">{current.name}</strong> plan.
        Upgrade to <strong className="text-fg">{required.name}</strong> ({required.price}) to unlock this feature.
      </p>

      <div className="flex flex-col items-center gap-3 sm:flex-row">
        <Link
          href="/pricing"
          className="rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-bg transition-colors hover:opacity-85 hover:bg-accent"
        >
          See plans →
        </Link>
        <Link
          href="https://app.nebulacomponents.com/billing"
          className="rounded-lg border border-border px-6 py-3 text-sm font-semibold text-fg-muted transition-colors hover:border-accent hover:text-fg"
        >
          View billing
        </Link>
      </div>

      {/* Feature hint - what they'd unlock */}
      <p className="mt-8 text-xs text-fg-dim">
        {tabLabel === 'Monitoring' && 'Weekly score-drop alerts and page health tracking for your live URLs.'}
        {tabLabel === 'Compare' && 'Side-by-side before/after audit comparison with finding-level diff.'}
        {tabLabel === 'Timeline' && 'Score history chart and improvement log across all audits.'}
        {tabLabel === 'Reports' && 'Downloadable PDF reports with full evidence and findings.'}
        {tabLabel === 'Experiments' && 'A/B test tracker linked to your audit findings.'}
        {tabLabel === 'Experiment Tracker' && 'Track experiment outcomes and mark winners as production.'}
        {tabLabel === 'Team' && 'Invite team members and share workspace access.'}
        {tabLabel === 'Fix Roadmap' && 'A sequenced two-stage roadmap of quick wins and major projects, rebuilt from your live findings.'}
      </p>
    </div>
  )
}

/** Lock badge for the nav sidebar */
export function LockBadge() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 12 12"
      fill="none"
      aria-label="Requires upgrade"
      className="ml-auto shrink-0 text-fg-dim"
    >
      <rect x="1.5" y="5.5" width="9" height="6" rx="1" stroke="currentColor" strokeWidth="1.2"/>
      <path d="M3.5 5.5V4a2.5 2.5 0 015 0v1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  )
}
