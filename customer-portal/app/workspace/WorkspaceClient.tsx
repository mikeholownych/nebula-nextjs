'use client'

import { useCallback, useEffect, useState } from 'react'
import { DashboardView, AuditsView, ProjectsView } from './views'
import CompareView from './compareView'
import RecsView from './recsView'
import PagesView from './pagesView'
import ExperimentsView from './experimentsView'
import ExperimentTrackerView from './experimentTrackerView'
import BillingView from './billingView'
import MonitoringView from './monitoringView'
import DiffView from './diffView'
import TimelineView from './timelineView'
import ReportView from './reportView'
import AchievementsView from './achievementsView'
import AssistantView from './assistantView'
import TeamView from './teamView'
import SettingsView from './settingsView'
import {
  TAB_ACCESS_REQUIREMENTS,
  resolvePlanLevel,
  canAccess,
  LockedTab,
  LockBadge,
  type AccessLevel,
} from './planGate'
import { analytics } from '@heycatch/sdk'

export interface WorkspaceAudit {
  id: string
  url: string
  status: string
  score: number | null
  grade: string | null
  composite?: number | null
  composite_anchor?: number | null
  created_at?: string
  completed_at?: string | null
  screenshot_url?: string | null
}

export interface AuditFinding {
  key: string
  label: string
  impact: number
  effort: number
  quadrant: string
  issue?: string
  fix?: string
  evidence?: unknown
  revenue_impact?: number
}

export interface AuditDetail {
  audit_id: string
  url: string
  status: string
  score: number
  grade: string
  composite?: number
  findings: AuditFinding[]
}

type TabId = 'dashboard' | 'audits' | 'projects' | 'pages' | 'diff' | 'compare' | 'recommendations' | 'experiments' | 'tracker' | 'billing' | 'monitoring' | 'timeline' | 'reports' | 'achievements' | 'assistant' | 'team' | 'settings'

export default function WorkspaceClient() {
  const [email, setEmail] = useState('')
  const [authLoading, setAuthLoading] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [audits, setAudits] = useState<WorkspaceAudit[] | null>(null)
  const [latestDetail, setLatestDetail] = useState<AuditDetail | null>(null)
  // Read searchParams only after mount to avoid SSR/client mismatch
  const [tab, setTab] = useState<TabId>('dashboard')
  const [planLevel, setPlanLevel] = useState<AccessLevel>('free')

  const load = useCallback(async (targetEmail: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(
        `/api/audits/by-email?email=${encodeURIComponent(targetEmail)}`
      )
      if (!res.ok) throw new Error('Failed to load audits')
      const data = await res.json()
      const list: WorkspaceAudit[] = data.audits || []
      setAudits(list)

      if (list.length > 0) {
        const detailRes = await fetch(`/api/audit/${list[0].id}?email=${encodeURIComponent(targetEmail)}`)
        if (detailRes.ok) {
          const detail = await detailRes.json()
          setLatestDetail(detail)
        }
      } else {
        setLatestDetail(null)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetch('/api/auth/me', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) {
          window.location.replace('/login')
          return
        }
        const user = await response.json()
        setEmail(user.email || '')
        if (user.id) {
          analytics.setIdentity(
            user.id,
            { email: user.email, name: user.name, plan: user.plan },
            user.created_at ? { signup_date: user.created_at } : undefined,
          )
        }
      })
      .catch(() => window.location.replace('/login'))
      .finally(() => setAuthLoading(false))
  }, [])

  useEffect(() => {
    if (email) {
      load(email)
      // Fetch billing plan - non-blocking; defaults to 'free' on failure
      fetch(`/api/billing/summary?email=${encodeURIComponent(email)}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (data?.plan) {
            setPlanLevel(resolvePlanLevel(data.plan))
            analytics.setPersonProperties({ plan: data.plan })
          }
        })
        .catch(() => undefined)
    }
  }, [email, load])

  const signOut = async () => {
    analytics.resetIdentity()
    await fetch('/api/auth/logout', { method: 'POST' }).catch(() => undefined)
    window.location.replace('/login')
  }

  // ── Gate ────────────────────────────────────────────────────────────
  if (authLoading) {
    return <main className="min-h-screen bg-bg text-fg pt-24" id="main-content"><div className="max-w-6xl mx-auto px-6 py-16 text-fg-muted">Checking your session…</div></main>
  }

  // ── Loading / error ─────────────────────────────────────────────────
  if (loading && !audits) {
    return (
      <main className="min-h-screen bg-bg text-fg pt-24" id="main-content">
        <div className="max-w-6xl mx-auto px-6 py-16 text-fg-muted">Loading workspace…</div>
      </main>
    )
  }

  if (error && !audits) {
    return (
      <main className="min-h-screen bg-bg text-fg pt-24" id="main-content">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <p className="text-danger mb-4">{error}</p>
          <button
            onClick={() => email && load(email)}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-bg"
          >
            Retry
          </button>
        </div>
      </main>
    )
  }

  // ── Workspace ───────────────────────────────────────────────────────
  const navGroups: { label: string; items: { id: TabId; label: string; icon: string }[] }[] = [
    {
      label: 'Workspace',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: 'grid' },
        { id: 'audits', label: 'Audits', icon: 'scan' },
        { id: 'projects', label: 'Projects', icon: 'folder' },
        { id: 'pages', label: 'Pages', icon: 'map' },
        { id: 'diff', label: 'Audit Diff', icon: 'diff' },
        { id: 'recommendations', label: 'Fix queue', icon: 'check' },
      ],
    },
    {
      label: 'Analyze',
      items: [
        { id: 'compare', label: 'Compare', icon: 'compare' },
        { id: 'experiments', label: 'Component Lab', icon: 'flask' },
        { id: 'tracker', label: 'Experiments', icon: 'pulse' },
        { id: 'monitoring', label: 'Monitoring', icon: 'pulse' },
        { id: 'timeline', label: 'Timeline', icon: 'clock' },
      ],
    },
    {
      label: 'Account',
      items: [
        { id: 'reports', label: 'Reports', icon: 'report' },
        { id: 'billing', label: 'Billing', icon: 'card' },
        { id: 'assistant', label: 'AI Assistant', icon: 'spark' },
        { id: 'team', label: 'Team', icon: 'users' },
        { id: 'settings', label: 'Settings', icon: 'gear' },
      ],
    },
  ]

  return (
    <main className="min-h-screen bg-bg text-fg pt-24" id="main-content">
      <div className="mx-auto flex max-w-[1440px] gap-0 px-4 py-5 sm:px-6 lg:px-8">
        <aside className="hidden w-56 shrink-0 border-r border-border pr-5 lg:block" aria-label="Workspace navigation">
          <div className="sticky top-28">
            <div className="mb-8 px-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-fg-dim">Nebula</p>
              <p className="mt-1 text-sm font-semibold text-fg-dim">Customer workspace</p>
            </div>
            <div className="space-y-7">
              {navGroups.map((group) => (
                <div key={group.label}>
                  <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-fg-dim">{group.label}</p>
                  <div className="space-y-0.5">
                    {group.items.map((item) => {
                        const required = TAB_ACCESS_REQUIREMENTS[item.id] ?? 'free'
                        const locked = !canAccess(planLevel, required as AccessLevel)
                        return (
                          <button
                            key={item.id}
                            onClick={() => setTab(item.id)}
                            aria-current={tab === item.id ? 'page' : undefined}
                            className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[13px] font-medium transition-colors ${
                              tab === item.id ? 'bg-bg-panel text-fg' : 'text-fg-muted hover:bg-bg-elevated hover:text-fg'
                            }`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${tab === item.id ? 'bg-accent' : 'bg-fg-muted'}`} aria-hidden="true" />
                            {item.label}
                            {locked && <LockBadge />}
                          </button>
                        )
                      })}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-10 border-t border-border px-3 pt-4">
              <p className="truncate text-xs text-fg-dim" title={email}>{email}</p>
              <button onClick={signOut} className="mt-2 text-xs font-medium text-fg-muted hover:text-fg">Sign out</button>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1 lg:pl-8">
          <header className="mb-7 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-6">
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-fg-dim">{tab === 'dashboard' ? 'Overview' : 'Workspace'}</p>
              <h1 className="text-2xl font-semibold tracking-[-0.03em] text-fg">{tab === 'dashboard' ? 'Good to see you' : navGroups.flatMap((g) => g.items).find((item) => item.id === tab)?.label}</h1>
              <p className="mt-1 max-w-xl text-sm text-fg-muted">{tab === 'dashboard' ? 'See what changed, what matters, and what to fix next.' : email}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden text-xs text-fg-dim sm:inline">{email}</span>
              <a href="/audit?utm_source=workspace&utm_medium=internal" className="rounded-lg bg-bg-panel px-4 py-2.5 text-sm font-semibold text-fg transition-colors hover:bg-bg-elevated">Run new audit</a>
            </div>
          </header>
          {email && (
            <div className="text-xs text-fg-dim border-t border-border py-2 px-4 -mx-4 mb-4">
              Your workspace is tied to your audit email. Audit findings are about public pages - no private data is stored here.
            </div>
          )}

          <nav className="mb-6 lg:hidden" aria-label="Workspace sections">
            {/* Mobile: select dropdown */}
            <div className="block sm:hidden">
              <select
                value={tab}
                onChange={(e) => setTab(e.target.value as TabId)}
                className="w-full rounded-lg border border-border bg-bg-panel py-2 px-3 text-fg text-sm focus:outline-none"
                aria-label="Navigate workspace"
              >
                {navGroups.flatMap((group) => group.items).map((item) => (
                  <option key={item.id} value={item.id}>{item.label}</option>
                ))}
              </select>
            </div>
            {/* Tablet (640–1023px): horizontal scrollable tab row */}
            <div className="hidden sm:flex gap-1 overflow-x-auto border-b border-border pb-px">
              {navGroups.flatMap((group) => group.items).map((item) => (
                <button key={item.id} onClick={() => setTab(item.id)} aria-current={tab === item.id ? 'page' : undefined} className={`flex items-center gap-1 whitespace-nowrap px-3 py-2 text-xs font-semibold ${tab === item.id ? 'border-b-2 border-fg text-fg' : 'text-fg-dim'}`}>{item.label}{!canAccess(planLevel, (TAB_ACCESS_REQUIREMENTS[item.id] ?? 'free') as AccessLevel) && <LockBadge />}</button>
              ))}
            </div>
          </nav>

          {tab === 'dashboard' && <DashboardView audits={audits || []} latestDetail={latestDetail} email={email} />}
          {tab === 'audits' && <AuditsView audits={audits || []} />}
          {tab === 'projects' && <ProjectsView audits={audits || []} />}
          {tab === 'pages' && <PagesView audits={audits || []} latestDetail={latestDetail} />}
          {tab === 'diff' && <DiffView audits={audits || []} />}
          {tab === 'compare' && (
            canAccess(planLevel, 'pro')
              ? <CompareView audits={audits || []} />
              : <LockedTab tabLabel="Compare" requiredPlan="pro" currentPlan={planLevel} />
          )}
          {tab === 'recommendations' && <RecsView email={email} latestDetail={latestDetail} />}
          {tab === 'experiments' && (
            canAccess(planLevel, 'pro')
              ? <ExperimentsView email={email} />
              : <LockedTab tabLabel="Component Lab" requiredPlan="pro" currentPlan={planLevel} />
          )}
          {tab === 'tracker' && (
            canAccess(planLevel, 'pro')
              ? <ExperimentTrackerView email={email} />
              : <LockedTab tabLabel="Experiment Tracker" requiredPlan="pro" currentPlan={planLevel} />
          )}
          {tab === 'billing' && <BillingView email={email} />}
          {tab === 'monitoring' && (
            canAccess(planLevel, 'pro')
              ? <MonitoringView email={email} />
              : <LockedTab tabLabel="Monitoring" requiredPlan="pro" currentPlan={planLevel} />
          )}
          {tab === 'timeline' && (
            canAccess(planLevel, 'pro')
              ? <TimelineView email={email} />
              : <LockedTab tabLabel="Timeline" requiredPlan="pro" currentPlan={planLevel} />
          )}
          {tab === 'reports' && (
            canAccess(planLevel, 'pro')
              ? <ReportView audits={audits || []} />
              : <LockedTab tabLabel="Reports" requiredPlan="pro" currentPlan={planLevel} />
          )}
          {tab === 'achievements' && <AchievementsView email={email} latestAuditId={audits?.[0]?.id ?? null} />}
          {tab === 'assistant' && <AssistantView email={email} audits={audits || []} />}
          {tab === 'team' && (
            canAccess(planLevel, 'growth')
              ? <TeamView email={email} />
              : <LockedTab tabLabel="Team" requiredPlan="growth" currentPlan={planLevel} />
          )}
          {tab === 'settings' && <SettingsView email={email} />}
        </div>
      </div>
    </main>
  )
}
