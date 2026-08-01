'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { DashboardView, AuditsView, ProjectsView } from './views'
import CompareView from './compareView'
import RecsView from './recsView'
import ExperimentsView from './experimentsView'
import BillingView from './billingView'
import MonitoringView from './monitoringView'
import TimelineView from './timelineView'
import ReportView from './reportView'
import AchievementsView from './achievementsView'
import AssistantView from './assistantView'
import TeamView from './teamView'
import SettingsView from './settingsView'

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

type TabId = 'dashboard' | 'audits' | 'projects' | 'compare' | 'recommendations' | 'experiments' | 'billing' | 'monitoring' | 'timeline' | 'reports' | 'achievements' | 'assistant' | 'team' | 'settings'

const EMAIL_KEY = 'nebula_ws_email'

export default function WorkspaceClient() {
  const [email, setEmail] = useState<string>(() => {
    if (typeof window === 'undefined') return ''
    return window.localStorage.getItem(EMAIL_KEY) || ''
  })
  const [emailInput, setEmailInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [audits, setAudits] = useState<WorkspaceAudit[] | null>(null)
  const [latestDetail, setLatestDetail] = useState<AuditDetail | null>(null)
  const [tab, setTab] = useState<TabId>('dashboard')

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
        const detailRes = await fetch(`/api/audit/${list[0].id}`)
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
    if (email) {
      load(email)
    }
  }, [email, load])

  const enter = () => {
    const value = emailInput.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setError('Enter a valid email address')
      return
    }
    window.localStorage.setItem(EMAIL_KEY, value)
    setEmail(value)
    setEmailInput('')
  }

  const signOut = () => {
    window.localStorage.removeItem(EMAIL_KEY)
    setEmail('')
    setAudits(null)
    setLatestDetail(null)
    setTab('dashboard')
  }

  // ── Gate ────────────────────────────────────────────────────────────
  if (!email) {
    return (
      <main
        className="min-h-screen bg-[#050505] text-white pt-24"
        id="main-content"
        role="main"
      >
        <div className="max-w-md mx-auto px-6 py-16">
          <h1 className="text-3xl font-bold mb-2">Your Workspace</h1>
          <p className="text-gray-400 mb-8">
            Audit history, project health, and what to work on next — tied to the email
            you used for your audits.
          </p>
          <div className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-6">
            <label htmlFor="ws-email" className="block text-sm text-gray-300 mb-2">
              Email used for your audits
            </label>
            <input
              id="ws-email"
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && enter()}
              placeholder="you@company.com"
              className="w-full rounded-lg border border-gray-700 bg-[#0d0d0d] px-4 py-2.5 text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none"
            />
            {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
            <button
              onClick={enter}
              className="mt-4 w-full rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-black hover:bg-emerald-400 transition-colors"
            >
              Open workspace
            </button>
            <p className="mt-4 text-xs text-gray-500">
              No audits yet? Run a{' '}
              <a href="/audit" className="text-emerald-400 hover:underline">
                free audit
              </a>{' '}
              first — results appear here automatically.
            </p>
          </div>
        </div>
      </main>
    )
  }

  // ── Loading / error ─────────────────────────────────────────────────
  if (loading && !audits) {
    return (
      <main className="min-h-screen bg-[#050505] text-white pt-24" id="main-content" role="main">
        <div className="max-w-6xl mx-auto px-6 py-16 text-gray-400">Loading workspace…</div>
      </main>
    )
  }

  if (error && !audits) {
    return (
      <main className="min-h-screen bg-[#050505] text-white pt-24" id="main-content" role="main">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={() => email && load(email)}
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-black"
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
        { id: 'recommendations', label: 'Fix queue', icon: 'check' },
      ],
    },
    {
      label: 'Analyze',
      items: [
        { id: 'compare', label: 'Compare', icon: 'compare' },
        { id: 'experiments', label: 'Component Lab', icon: 'flask' },
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
    <main className="min-h-screen bg-[#f7f7f5] text-[#171717] pt-24" id="main-content" role="main">
      <div className="mx-auto flex max-w-[1440px] gap-0 px-4 py-5 sm:px-6 lg:px-8">
        <aside className="hidden w-56 shrink-0 border-r border-[#e5e5e2] pr-5 lg:block" aria-label="Workspace navigation">
          <div className="sticky top-28">
            <div className="mb-8 px-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8b8b86]">Nebula</p>
              <p className="mt-1 text-sm font-semibold text-[#222]">Customer workspace</p>
            </div>
            <div className="space-y-7">
              {navGroups.map((group) => (
                <div key={group.label}>
                  <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#a0a09a]">{group.label}</p>
                  <div className="space-y-0.5">
                    {group.items.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setTab(item.id)}
                        aria-current={tab === item.id ? 'page' : undefined}
                        className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[13px] font-medium transition-colors ${
                          tab === item.id ? 'bg-[#e9e9e5] text-[#171717]' : 'text-[#777771] hover:bg-[#efefec] hover:text-[#222]'
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${tab === item.id ? 'bg-[#171717]' : 'bg-[#c7c7c1]'}`} aria-hidden="true" />
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-10 border-t border-[#e5e5e2] px-3 pt-4">
              <p className="truncate text-xs text-[#8b8b86]" title={email}>{email}</p>
              <button onClick={signOut} className="mt-2 text-xs font-medium text-[#777771] hover:text-[#171717]">Sign out</button>
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1 lg:pl-8">
          <header className="mb-7 flex flex-wrap items-end justify-between gap-4 border-b border-[#e5e5e2] pb-6">
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#8b8b86]">{tab === 'dashboard' ? 'Overview' : 'Workspace'}</p>
              <h1 className="text-2xl font-semibold tracking-[-0.03em] text-[#171717]">{tab === 'dashboard' ? 'Good to see you' : navGroups.flatMap((g) => g.items).find((item) => item.id === tab)?.label}</h1>
              <p className="mt-1 max-w-xl text-sm text-[#777771]">{tab === 'dashboard' ? 'See what changed, what matters, and what to fix next.' : email}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden text-xs text-[#999992] sm:inline">{email}</span>
              <a href="/audit" className="rounded-lg bg-[#171717] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#333]">Run new audit</a>
            </div>
          </header>
          {email && (
            <div className="text-xs text-[#8b8b86] border-t border-[#e5e5e2] py-2 px-4 -mx-4 mb-4">
              Your workspace is tied to your audit email. Audit findings are about public pages — no private data is stored here.
            </div>
          )}

          <nav className="mb-6 lg:hidden" aria-label="Workspace sections">
            {/* Mobile: select dropdown */}
            <div className="block sm:hidden">
              <select
                value={tab}
                onChange={(e) => setTab(e.target.value as TabId)}
                className="w-full rounded-lg border border-border bg-bg-muted py-2 px-3 text-fg text-sm focus:outline-none"
                aria-label="Navigate workspace"
              >
                {navGroups.flatMap((group) => group.items).map((item) => (
                  <option key={item.id} value={item.id}>{item.label}</option>
                ))}
              </select>
            </div>
            {/* Tablet (640–1023px): horizontal scrollable tab row */}
            <div className="hidden sm:flex gap-1 overflow-x-auto border-b border-[#e5e5e2] pb-px">
              {navGroups.flatMap((group) => group.items).map((item) => (
                <button key={item.id} onClick={() => setTab(item.id)} aria-current={tab === item.id ? 'page' : undefined} className={`whitespace-nowrap px-3 py-2 text-xs font-semibold ${tab === item.id ? 'border-b-2 border-[#171717] text-[#171717]' : 'text-[#8b8b86]'}`}>{item.label}</button>
              ))}
            </div>
          </nav>

          {tab === 'dashboard' && <DashboardView audits={audits || []} latestDetail={latestDetail} />}
          {tab === 'audits' && <AuditsView audits={audits || []} />}
          {tab === 'projects' && <ProjectsView audits={audits || []} />}
          {tab === 'compare' && <CompareView audits={audits || []} />}
          {tab === 'recommendations' && <RecsView email={email} />}
          {tab === 'experiments' && <ExperimentsView email={email} />}
          {tab === 'billing' && <BillingView email={email} />}
          {tab === 'monitoring' && <MonitoringView email={email} />}
          {tab === 'timeline' && <TimelineView email={email} />}
          {tab === 'reports' && <ReportView audits={audits || []} />}
          {tab === 'achievements' && <AchievementsView email={email} latestAuditId={audits?.[0]?.id ?? null} />}
          {tab === 'assistant' && <AssistantView email={email} audits={audits || []} />}
          {tab === 'team' && <TeamView email={email} />}
          {tab === 'settings' && <SettingsView email={email} />}
        </div>
      </div>
    </main>
  )
}
