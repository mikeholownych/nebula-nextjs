'use client'

import { useCallback, useEffect, useState } from 'react'
import { DashboardView, AuditsView, ProjectsView } from './views'
import CompareView from './compareView'
import CompetitorView from './competitorView'
import AiSearchView from './aiSearchView'
import RoiCalculatorView from './roiCalculatorView'
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

type TabId =
  | 'dashboard'
  | 'audits'
  | 'projects'
  | 'pages'
  | 'diff'
  | 'compare'
  | 'recommendations'
  | 'experiments'
  | 'tracker'
  | 'aiSearch'
  | 'roiCalculator'
  | 'billing'
  | 'monitoring'
  | 'timeline'
  | 'reports'
  | 'achievements'
  | 'assistant'
  | 'team'
  | 'settings'

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
  const navGroups: { label: string; items: { id: TabId; label: string; icon: string; badge?: string }[] }[] = [
    {
      label: 'Analytics',
      items: [
        { id: 'dashboard', label: 'Site Health', icon: 'grid' },
        { id: 'audits', label: 'All Audits', icon: 'scan' },
        { id: 'pages', label: 'Monitored Pages', icon: 'map' },
        { id: 'projects', label: 'Projects', icon: 'folder' },
      ],
    },
    {
      label: 'Conversion (CRO)',
      items: [
        { id: 'recommendations', label: 'Fix Queue & Sprint', icon: 'check', badge: latestDetail?.findings?.length ? String(latestDetail.findings.length) : undefined },
        { id: 'diff', label: 'Audit Diff', icon: 'diff' },
        { id: 'experiments', label: 'Component Lab', icon: 'flask' },
        { id: 'tracker', label: 'Experiments', icon: 'pulse' },
      ],
    },
    {
      label: 'AI Search (AEO/GEO)',
      items: [
        { id: 'aiSearch', label: 'AEO Citability Tests', icon: 'spark' },
        { id: 'compare', label: 'Competitor Intel', icon: 'compare' },
      ],
    },
    {
      label: 'Actions & Tools',
      items: [
        { id: 'roiCalculator', label: 'Conversion ROI', icon: 'calculator' },
        { id: 'monitoring', label: 'Monitoring', icon: 'pulse' },
        { id: 'reports', label: 'PDF Reports', icon: 'report' },
        { id: 'timeline', label: 'Score Timeline', icon: 'clock' },
      ],
    },
    {
      label: 'Account & Team',
      items: [
        { id: 'assistant', label: 'AI Fix Agent', icon: 'spark' },
        { id: 'billing', label: 'Billing & Quota', icon: 'card' },
        { id: 'team', label: 'Team', icon: 'users' },
        { id: 'settings', label: 'Settings', icon: 'gear' },
      ],
    },
  ]

  const isAgentMode = tab === 'assistant' || tab === 'recommendations'

  return (
    <main className="min-h-screen bg-bg text-fg pt-24" id="main-content">
      <div className="mx-auto flex max-w-[1440px] gap-0 px-4 py-5 sm:px-6 lg:px-8">
        <aside className="hidden w-60 shrink-0 border-r border-border pr-5 lg:block" aria-label="Workspace navigation">
          <div className="sticky top-28">
            {/* Org Switcher Header */}
            <div className="mb-4 flex items-center justify-between rounded-xl border border-border bg-bg-surface px-3 py-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-accent/20 border border-accent/40 font-mono text-xs font-bold text-accent">
                  ⬡
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold text-fg">Nebula Components</p>
                  <p className="truncate font-mono text-[10px] text-fg-muted/60">Workspace</p>
                </div>
              </div>
              <span className="font-mono text-[10px] text-fg-muted">⌄</span>
            </div>

            {/* Segmented Mode Switcher: Dashboard vs Autonomous Agent */}
            <div className="mb-5 flex rounded-lg border border-border bg-bg p-0.5">
              <button
                onClick={() => setTab('dashboard')}
                className={`flex-1 rounded-md py-1.5 font-mono text-xs font-semibold transition-all ${
                  !isAgentMode
                    ? 'bg-bg-panel text-fg shadow-sm border border-border/50'
                    : 'text-fg-muted hover:text-fg'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setTab('assistant')}
                className={`flex-1 rounded-md py-1.5 font-mono text-xs font-semibold transition-all ${
                  isAgentMode
                    ? 'bg-accent text-bg shadow-sm font-bold'
                    : 'text-fg-muted hover:text-fg'
                }`}
              >
                AI Agent
              </button>
            </div>

            {/* Categorized Navigation */}
            <div className="space-y-5">
              {navGroups.map((group) => (
                <div key={group.label}>
                  <p className="mb-1.5 px-3 font-mono text-[10px] font-bold uppercase tracking-wider text-fg-muted/60">{group.label}</p>
                  <div className="space-y-0.5">
                    {group.items.map((item) => {
                        const required = TAB_ACCESS_REQUIREMENTS[item.id] ?? 'free'
                        const locked = !canAccess(planLevel, required as AccessLevel)
                        return (
                          <button
                            key={item.id}
                            onClick={() => setTab(item.id)}
                            aria-current={tab === item.id ? 'page' : undefined}
                            className={`flex w-full items-center justify-between rounded-lg px-3 py-1.5 text-left text-[13px] font-medium transition-colors ${
                              tab === item.id ? 'bg-bg-panel text-fg border border-border/50' : 'text-fg-muted hover:bg-bg-elevated hover:text-fg'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 truncate">
                              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${tab === item.id ? 'bg-accent' : 'bg-fg-muted/40'}`} aria-hidden="true" />
                              <span className="truncate">{item.label}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {item.badge && (
                                <span className="rounded-full bg-accent/15 px-1.5 py-0.2 font-mono text-[10px] font-bold text-accent">
                                  {item.badge}
                                </span>
                              )}
                              {locked && <LockBadge />}
                            </div>
                          </button>
                        )
                      })}
                  </div>
                </div>
              ))}
            </div>

            {/* Account / Plan Status Card */}
            <div className="mt-5 rounded-xl border border-border bg-bg-surface p-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-fg-muted">Tier</span>
                <span className="rounded bg-accent/15 px-1.5 py-0.5 font-mono text-[10px] font-bold text-accent capitalize">
                  {planLevel}
                </span>
              </div>
              <div className="mt-1.5 font-mono text-xs text-fg-muted">
                <span className="font-semibold text-fg">{audits?.length || 0}</span> audits tracked
              </div>
            </div>

            <div className="mt-3 border-t border-border px-3 pt-3 flex items-center justify-between">
              <p className="truncate font-mono text-[11px] text-fg-muted/60" title={email}>{email}</p>
              <button onClick={signOut} className="font-mono text-[11px] text-fg-muted hover:text-fg">Sign out</button>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1 lg:pl-8">
          <header className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
            <div className="flex items-center gap-3">
              <div>
                <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-fg-muted">
                  {tab === 'dashboard' ? 'Executive Overview' : 'Workspace'}
                </p>
                <h1 className="text-xl font-semibold tracking-tight text-fg">
                  {tab === 'dashboard' ? 'Site Health & Conversion Diagnosis' : navGroups.flatMap((g) => g.items).find((item) => item.id === tab)?.label}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-border bg-bg-surface px-3 py-1 font-mono text-xs text-fg-muted">
                <span>Quota:</span>
                <span className="font-bold text-accent">{audits?.length || 0}/Unlimited</span>
              </div>
              <a
                href="/audit?utm_source=workspace-top&utm_medium=internal"
                className="rounded-lg bg-accent px-4 py-2 font-mono text-xs font-bold text-bg hover:opacity-90 transition-opacity"
              >
                + New Audit
              </a>
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
          {tab === 'compare' && <CompetitorView audits={audits || []} email={email} />}
          {tab === 'aiSearch' && <AiSearchView audits={audits || []} email={email} />}
          {tab === 'roiCalculator' && <RoiCalculatorView />}
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
