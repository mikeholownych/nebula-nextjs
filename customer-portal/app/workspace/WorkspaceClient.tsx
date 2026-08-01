'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { DashboardView, AuditsView, ProjectsView } from './views'
import CompareView from './compareView'
import RecsView from './recsView'
import ExperimentsView from './experimentsView'
import BillingView from './billingView'
import MonitoringView from './monitoringView'
import TimelineView from './timelineView'

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

type TabId = 'dashboard' | 'audits' | 'projects' | 'compare' | 'recommendations' | 'experiments' | 'billing' | 'monitoring' | 'timeline'

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
  const navItems: { id: TabId; label: string }[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'audits', label: 'Audits' },
    { id: 'projects', label: 'Projects' },
    { id: 'compare', label: 'Compare' },
    { id: 'recommendations', label: 'Recommendations' },
    { id: 'experiments', label: 'Experiments' },
    { id: 'billing', label: 'Billing' },
    { id: 'monitoring', label: 'Monitoring' },
    { id: 'timeline', label: 'Timeline' },
  ]

  return (
    <main
      className="min-h-screen bg-[#050505] text-white pt-24"
      id="main-content"
      role="main"
    >
      <div className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <p className="text-sm text-emerald-400 font-medium">Workspace</p>
            <h1 className="text-3xl font-bold">{email}</h1>
          </div>
          <button
            onClick={signOut}
            className="text-sm text-gray-400 hover:text-white transition-colors"
          >
            Sign out
          </button>
        </div>

        <nav
          aria-label="Workspace sections"
          className="flex gap-1 mb-8 border-b border-gray-800"
        >
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              aria-pressed={tab === item.id}
              className={`px-4 py-2.5 text-sm font-medium -mb-px border-b-2 transition-colors ${
                tab === item.id
                  ? 'border-emerald-400 text-white'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {tab === 'dashboard' && (
          <DashboardView audits={audits || []} latestDetail={latestDetail} />
        )}
        {tab === 'audits' && <AuditsView audits={audits || []} />}
        {tab === 'projects' && <ProjectsView audits={audits || []} />}
        {tab === 'compare' && <CompareView audits={audits || []} />}
        {tab === 'recommendations' && <RecsView email={email} />}
        {tab === 'experiments' && <ExperimentsView email={email} />}
        {tab === 'billing' && <BillingView email={email} />}
        {tab === 'monitoring' && <MonitoringView email={email} />}
        {tab === 'timeline' && <TimelineView email={email} />}
      </div>
    </main>
  )
}
