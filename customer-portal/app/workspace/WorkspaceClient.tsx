'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import {
  TAB_ACCESS_REQUIREMENTS,
  resolvePlanLevel,
  canAccess,
  LockedTab,
  LockBadge,
  type AccessLevel,
} from './planGate'
import { analytics } from '@heycatch/sdk'

const DashboardView = dynamic(() => import('./views').then((mod) => mod.DashboardView))
const AuditsView = dynamic(() => import('./views').then((mod) => mod.AuditsView))
const ProjectsView = dynamic(() => import('./views').then((mod) => mod.ProjectsView))
const CompetitorView = dynamic(() => import('./competitorView'))
const ProgramView = dynamic(() => import('./programView'))
const FunnelView = dynamic(() => import('./funnelView'))
const AiSearchView = dynamic(() => import('./aiSearchView'))
const RoiCalculatorView = dynamic(() => import('./roiCalculatorView'))
const RecsView = dynamic(() => import('./recsView'))
const PagesView = dynamic(() => import('./pagesView'))
const ExperimentsView = dynamic(() => import('./experimentsView'))
const ExperimentTrackerView = dynamic(() => import('./experimentTrackerView'))
const BillingView = dynamic(() => import('./billingView'))
const MonitoringView = dynamic(() => import('./monitoringView'))
const DiffView = dynamic(() => import('./diffView'))
const TimelineView = dynamic(() => import('./timelineView'))
const ReportView = dynamic(() => import('./reportView'))
const AchievementsView = dynamic(() => import('./achievementsView'))
const AssistantView = dynamic(() => import('./assistantView'))
const TeamView = dynamic(() => import('./teamView'))
const SettingsView = dynamic(() => import('./settingsView'))

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
  page_intent?: string | null
  intent_confidence?: number | null
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

export interface ClaimedTeardown {
  slug: string
  name: string
  domain: string
  score: number | null
}

type TabId =
  | 'dashboard'
  | 'audits'
  | 'projects'
  | 'pages'
  | 'diff'
  | 'compare'
  | 'program'
  | 'funnel'
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

const VALID_TAB_IDS = new Set<string>([
  'dashboard', 'audits', 'projects', 'pages', 'diff', 'compare',
  'program', 'funnel',
  'recommendations', 'experiments', 'tracker', 'aiSearch',
  'roiCalculator', 'billing', 'monitoring', 'timeline', 'reports',
  'achievements', 'assistant', 'team', 'settings',
])

function getDomain(url?: string): string {
  if (!url) return ''
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

export default function WorkspaceClient() {
  const [email, setEmail] = useState('')
  const [authLoading, setAuthLoading] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [audits, setAudits] = useState<WorkspaceAudit[] | null>(null)
  const [claims, setClaims] = useState<ClaimedTeardown[]>([])
  const [latestDetail, setLatestDetail] = useState<AuditDetail | null>(null)
  const [selectedProject, setSelectedProject] = useState<string>('all')
  const [projectMenuOpen, setProjectMenuOpen] = useState(false)
  // Read searchParams only after mount to avoid SSR/client mismatch.
  // Initial state below is corrected by the mount effect; changes are written
  // back to the URL so tab + project survive page refreshes.
  const [tab, setTab] = useState<TabId>('dashboard')
  const [planLevel, setPlanLevel] = useState<AccessLevel>('free')

  // Merge whole-domain attach results into the by-email list: dedupe by
  // audit id, sort newest first.
  const mergeAudits = useCallback(
    (base: WorkspaceAudit[], extra: WorkspaceAudit[]): WorkspaceAudit[] => {
      const seen = new Set(base.map((a) => a.id))
      const merged = [...base]
      for (const a of extra) {
        if (!seen.has(a.id)) {
          seen.add(a.id)
          merged.push(a)
        }
      }
      return merged.sort((x, y) =>
        (y.created_at ?? '').localeCompare(x.created_at ?? '')
      )
    },
    []
  )

  const load = useCallback(async (targetEmail: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(
        `/api/audits/by-email?email=${encodeURIComponent(targetEmail)}`
      )
      if (!res.ok) throw new Error('Failed to load audits')
      const data = await res.json()
      let list: WorkspaceAudit[] = data.audits || []

      // Claimed teardowns: attach every audit across the claimed domain
      // (server-side auth via session email; best-effort, never blocks load).
      try {
        const claimsRes = await fetch('/api/teardowns/claims')
        if (claimsRes.ok) {
          const claimsData = await claimsRes.json()
          const owned: ClaimedTeardown[] = claimsData.claims || []
          setClaims(owned)
          for (const c of owned) {
            if (!c.domain) continue
            const dRes = await fetch(
              `/api/audits/by-domain?domain=${encodeURIComponent(c.domain)}`
            )
            if (dRes.ok) {
              const dData = await dRes.json()
              list = mergeAudits(list, dData.audits || [])
            }
          }
        }
      } catch {
        // claim attach is additive only
      }

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
  }, [mergeAudits])

  // --- URL state sync: tab + project survive refreshes and back/forward ---
  // Read once on mount (client-only to avoid SSR mismatch), then keep the URL
  // in step with state via replaceState so refresh restores the exact view.
  const urlHydrated = useRef(false)
  useEffect(() => {
    if (urlHydrated.current) return
    urlHydrated.current = true
    try {
      const params = new URLSearchParams(window.location.search)
      const t = params.get('tab') as TabId | null
      if (t && VALID_TAB_IDS.has(t)) setTab(t)
      const p = params.get('project')
      if (p) setSelectedProject(p)
    } catch {
      // malformed URL: fall back to defaults silently
    }
  }, [])

  const syncUrl = useCallback((next: { tab?: TabId; project?: string }) => {
    try {
      const params = new URLSearchParams(window.location.search)
      if (next.tab) {
        params.set('tab', next.tab)
        setTab(next.tab)
      }
      if (next.project !== undefined) {
        if (next.project === 'all') params.delete('project')
        else params.set('project', next.project)
        setSelectedProject(next.project)
      }
      const qs = params.toString()
      window.history.replaceState(null, '', qs ? `/workspace?${qs}` : '/workspace')
    } catch {
      // never let URL bookkeeping break the UI
    }
  }, [])

  const goTab = useCallback((t: TabId) => syncUrl({ tab: t }), [syncUrl])
  const goProject = useCallback((d: string) => syncUrl({ project: d }), [syncUrl])

  // Unique projects/domains
  const projectsList = useMemo(() => {
    if (!audits || audits.length === 0) return []
    const map = new Map<string, { domain: string; count: number; latestScore: number | null; latestId: string }>()
    for (const a of audits) {
      const domain = getDomain(a.url)
      if (!domain) continue
      const existing = map.get(domain)
      const score = a.composite ?? a.score ?? null
      if (!existing) {
        map.set(domain, {
          domain,
          count: 1,
          latestScore: score != null ? Math.round(score * 10) : null,
          latestId: a.id,
        })
      } else {
        existing.count += 1
      }
    }
    return [...map.values()]
  }, [audits])

  // Filter audits for the active project
  const displayedAudits = useMemo(() => {
    if (!audits) return []
    if (selectedProject === 'all') return audits
    return audits.filter((a) => getDomain(a.url) === selectedProject)
  }, [audits, selectedProject])

  // Project-specific detail findings
  const [projectDetail, setProjectDetail] = useState<AuditDetail | null>(null)

  useEffect(() => {
    if (selectedProject === 'all') {
      setProjectDetail(latestDetail)
      return
    }
    const firstInProject = displayedAudits[0]
    if (!firstInProject) {
      setProjectDetail(null)
      return
    }
    if (latestDetail && latestDetail.audit_id === firstInProject.id) {
      setProjectDetail(latestDetail)
      return
    }
    if (email) {
      fetch(`/api/audit/${firstInProject.id}?email=${encodeURIComponent(email)}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => setProjectDetail(d))
        .catch(() => setProjectDetail(null))
    }
  }, [selectedProject, displayedAudits, latestDetail, email])

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
        { id: 'program', label: 'Fix Roadmap', icon: 'check' },
        { id: 'funnel', label: 'Funnel Scan', icon: 'funnel' },
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
            {/* Top Pill: Interactive Project Selector */}
            <div className="relative mb-4">
              <button
                type="button"
                onClick={() => setProjectMenuOpen((v) => !v)}
                className="flex w-full items-center justify-between rounded-xl border border-border bg-bg-surface px-3 py-2 text-left transition-all hover:border-accent/40 focus:outline-none focus:ring-1 focus:ring-accent"
                aria-label="Select Project"
                aria-haspopup="listbox"
                aria-expanded={projectMenuOpen}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-accent/20 border border-accent/40 font-mono text-xs font-bold text-accent">
                    ⬡
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-fg">
                      {selectedProject === 'all' ? 'All Projects' : selectedProject}
                    </p>
                    <p className="truncate font-mono text-[10px] text-fg-muted/60">
                      {displayedAudits.length} {displayedAudits.length === 1 ? 'page / audit' : 'pages / audits'}
                    </p>
                  </div>
                </div>
                <span className="font-mono text-[11px] text-fg-muted">⌄</span>
              </button>

              {/* Project Selection Dropdown Menu */}
              {projectMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setProjectMenuOpen(false)}
                    aria-hidden="true"
                  />
                  <div className="absolute left-0 top-full z-50 mt-1.5 w-full rounded-xl border border-border bg-bg-surface p-1.5 shadow-xl">
                    <div className="px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-fg-muted/60">
                      Projects ({projectsList.length})
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedProject('all')
                        setProjectMenuOpen(false)
                      }}
                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs font-medium transition-colors ${
                        selectedProject === 'all'
                          ? 'bg-accent/15 text-accent font-semibold'
                          : 'text-fg hover:bg-bg-panel'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="font-mono text-xs">🌐</span>
                        <span className="truncate">All Projects</span>
                      </div>
                      <span className="font-mono text-[10px] text-fg-muted">
                        {audits?.length || 0}
                      </span>
                    </button>

                    {projectsList.length > 0 && <div className="my-1 border-t border-border/50" />}

                    <div className="max-h-48 overflow-y-auto space-y-0.5">
                      {projectsList.map((p) => (
                        <button
                          key={p.domain}
                          type="button"
                          onClick={() => {
                            setSelectedProject(p.domain)
                            setProjectMenuOpen(false)
                          }}
                          className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs font-medium transition-colors ${
                            selectedProject === p.domain
                              ? 'bg-accent/15 text-accent font-semibold'
                              : 'text-fg hover:bg-bg-panel'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                            <span className="truncate">{p.domain}</span>
                          </div>
                          <div className="flex items-center gap-1 font-mono text-[10px]">
                            {p.latestScore !== null && (
                              <span className="rounded bg-bg-panel px-1 text-fg-muted">
                                {p.latestScore}
                              </span>
                            )}
                            <span className="text-fg-muted/60">({p.count})</span>
                          </div>
                        </button>
                      ))}
                    </div>

                    <div className="my-1 border-t border-border/50" />

                    <a
                      href="/audit?utm_source=project-selector&utm_medium=internal"
                      className="flex w-full items-center justify-center rounded-lg bg-bg-panel py-1.5 font-mono text-[11px] font-semibold text-fg hover:bg-bg-elevated hover:text-accent transition-colors"
                    >
                      + Audit New Domain
                    </a>
                  </div>
                </>
              )}
            </div>

            {/* Segmented Mode Switcher: Dashboard vs Autonomous Agent */}
            <div className="mb-5 flex rounded-lg border border-border bg-bg p-0.5">
              <button
                onClick={() => goTab('dashboard')}
                className={`flex-1 rounded-md py-1.5 font-mono text-xs font-semibold transition-all ${
                  !isAgentMode
                    ? 'bg-bg-panel text-fg shadow-sm border border-border/50'
                    : 'text-fg-muted hover:text-fg'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => goTab('assistant')}
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
                            onClick={() => goTab(item.id)}
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
                <span className="font-semibold text-fg">{displayedAudits.length}</span> {displayedAudits.length === 1 ? 'audit' : 'audits'} in view
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
                  {selectedProject !== 'all' && (
                    <span className="ml-2 rounded bg-accent/15 px-1.5 py-0.5 font-mono text-[10px] font-bold text-accent">
                      {selectedProject}
                    </span>
                  )}
                </p>
                <h1 className="text-xl font-semibold tracking-tight text-fg">
                  {tab === 'dashboard' ? 'Site Health & Conversion Diagnosis' : navGroups.flatMap((g) => g.items).find((item) => item.id === tab)?.label}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-border bg-bg-surface px-3 py-1 font-mono text-xs text-fg-muted">
                <span>Audits:</span>
                <span className="font-bold text-accent">{displayedAudits.length}</span>
              </div>
              <a
                href={selectedProject !== 'all' ? `/audit?url=https://${encodeURIComponent(selectedProject)}` : '/audit?utm_source=workspace-top&utm_medium=internal'}
                className="rounded-lg bg-accent px-4 py-2 font-mono text-xs font-bold text-bg hover:opacity-90 transition-opacity"
              >
                + Audit URL
              </a>
            </div>
          </header>
          {email && (
            <div className="text-xs text-fg-dim border-t border-border py-2 px-4 -mx-4 mb-4">
              Your workspace is tied to your audit email. Audit findings are about public pages - no private data is stored here.
            </div>
          )}

          <nav className="mb-6 lg:hidden" aria-label="Workspace sections">
            {/* Mobile: Project + Section Selectors */}
            <div className="space-y-2 block sm:hidden">
              <select
                value={selectedProject}
                onChange={(e) => goProject(e.target.value)}
                className="w-full rounded-lg border border-border bg-bg-panel py-2 px-3 text-fg text-sm focus:outline-none"
                aria-label="Select active project"
              >
                <option value="all">All Projects ({audits?.length || 0})</option>
                {projectsList.map((p) => (
                  <option key={p.domain} value={p.domain}>{p.domain} ({p.count})</option>
                ))}
              </select>

              <select
                value={tab}
                onChange={(e) => goTab(e.target.value as TabId)}
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
                <button key={item.id} onClick={() => goTab(item.id)} aria-current={tab === item.id ? 'page' : undefined} className={`flex items-center gap-1 whitespace-nowrap px-3 py-2 text-xs font-semibold ${tab === item.id ? 'border-b-2 border-fg text-fg' : 'text-fg-dim'}`}>{item.label}{!canAccess(planLevel, (TAB_ACCESS_REQUIREMENTS[item.id] ?? 'free') as AccessLevel) && <LockBadge />}</button>
              ))}
            </div>
          </nav>

          {tab === 'dashboard' && claims.length > 0 && (
            <div className="mb-6 rounded-lg border border-accent/30 bg-white/[0.03] p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-widest text-accent">Claimed teardown</p>
                  {claims.map((claim) => (
                    <div key={claim.slug} className="flex items-center justify-between gap-4">
                      <p className="text-sm text-white/80">
                        {claim.name} &middot; {claim.score}/10
                      </p>
                      <Link
                        className="text-xs underline text-white/60"
                        href={`/teardowns/${claim.slug}`}
                      >
                        View public page
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          {tab === 'dashboard' && <DashboardView audits={displayedAudits} latestDetail={projectDetail} email={email} />}
          {tab === 'audits' && <AuditsView audits={displayedAudits} />}
          {tab === 'projects' && <ProjectsView audits={audits || []} onSelectProject={(d) => { goProject(d); goTab('dashboard'); }} />}
          {tab === 'pages' && <PagesView audits={displayedAudits} latestDetail={projectDetail} />}
          {tab === 'diff' && <DiffView audits={displayedAudits} />}
  {tab === 'program' && (
    canAccess(planLevel, 'pro')
      ? <ProgramView domains={projectsList.map((p) => p.domain)} initialDomain={selectedProject !== 'all' ? selectedProject : undefined} />
      : <LockedTab tabLabel="Fix Roadmap" requiredPlan="pro" currentPlan={planLevel} />
  )}
  {tab === 'funnel' && (
    <FunnelView
      domains={projectsList.map((p) => p.domain)}
      initialDomain={selectedProject !== 'all' ? selectedProject : undefined}
      planLevel={planLevel}
    />
  )}
          {tab === 'compare' && <CompetitorView audits={displayedAudits} email={email} planLevel={planLevel} />}
          {tab === 'aiSearch' && <AiSearchView audits={displayedAudits} email={email} />}
          {tab === 'roiCalculator' && <RoiCalculatorView />}
          {tab === 'recommendations' && <RecsView email={email} latestDetail={projectDetail} />}
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
              ? <ReportView audits={displayedAudits} />
              : <LockedTab tabLabel="Reports" requiredPlan="pro" currentPlan={planLevel} />
          )}
          {tab === 'achievements' && <AchievementsView email={email} latestAuditId={displayedAudits[0]?.id ?? null} />}
          {tab === 'assistant' && <AssistantView email={email} audits={displayedAudits} />}
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
