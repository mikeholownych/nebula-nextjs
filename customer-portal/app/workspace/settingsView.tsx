'use client'

import IntegrationsSection from './settingsIntegrations'
import { useCallback, useEffect, useState } from 'react'

const NOTIF_KEY = 'nebula_notification_prefs'
const TZ_KEY = 'nebula_timezone'

interface NotifPrefs {
  regressionAlerts: boolean
  weeklyDigest: boolean
}

function defaultNotifPrefs(): NotifPrefs {
  return { regressionAlerts: true, weeklyDigest: false }
}

function loadLocalPrefs(): NotifPrefs {
  if (typeof window === 'undefined') return defaultNotifPrefs()
  try {
    const raw = window.localStorage.getItem(NOTIF_KEY)
    if (!raw) return defaultNotifPrefs()
    return { ...defaultNotifPrefs(), ...JSON.parse(raw) }
  } catch {
    return defaultNotifPrefs()
  }
}

function browserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone
  } catch {
    return 'UTC'
  }
}

const TIMEZONES: string[] = [
  'Pacific/Honolulu',
  'America/Anchorage',
  'America/Los_Angeles',
  'America/Denver',
  'America/Chicago',
  'America/New_York',
  'America/Sao_Paulo',
  'Atlantic/Azores',
  'UTC',
  'Europe/London',
  'Europe/Paris',
  'Europe/Helsinki',
  'Europe/Moscow',
  'Asia/Dubai',
  'Asia/Karachi',
  'Asia/Dhaka',
  'Asia/Bangkok',
  'Asia/Shanghai',
  'Asia/Tokyo',
  'Australia/Sydney',
  'Pacific/Auckland',
]

export default function SettingsView({ email }: { email: string }) {
  const [notifPrefs, setNotifPrefs] = useState<NotifPrefs>(defaultNotifPrefs)
  const [timezone, setTimezone] = useState<string>('')
  const [toast, setToast] = useState<string | null>(null)
  const [deleteState, setDeleteState] = useState<'idle' | 'confirm' | 'requested'>('idle')
  const [deleteDate, setDeleteDate] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [avgCpc, setAvgCpc] = useState<string>('')
  const [monthlyAdSpend, setMonthlyAdSpend] = useState<string>('')
  const [savingRevenue, setSavingRevenue] = useState(false)
  const [agencyName, setAgencyName] = useState<string>('')
  const [agencyLogoUrl, setAgencyLogoUrl] = useState<string>('')
  const [savingBranding, setSavingBranding] = useState(false)
  const [digestEnabled, setDigestEnabled] = useState<boolean>(true)
  const [digestDay, setDigestDay] = useState<string>('monday')
  const [slackWebhookUrl, setSlackWebhookUrl] = useState<string>('')
  const [savingDigest, setSavingDigest] = useState(false)

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  // Debounced server sync
  const syncToServer = useCallback(
    async (prefs: NotifPrefs, tz: string) => {
      setSyncing(true)
      try {
        await fetch('/api/workspace/preferences', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, preferences: prefs, timezone: tz }),
        })
      } catch {
        // Silent - localStorage is the fallback
      } finally {
        setSyncing(false)
      }
    },
    [email]
  )

  // Load: localStorage first (instant), then reconcile from server
  useEffect(() => {
    const localPrefs = loadLocalPrefs()
    const localTz = window.localStorage.getItem(TZ_KEY) || browserTimezone()
    setNotifPrefs(localPrefs)
    setTimezone(localTz)

    fetch(`/api/workspace/preferences?email=${encodeURIComponent(email)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.preferences) {
          const serverPrefs = { ...defaultNotifPrefs(), ...data.preferences }
          setNotifPrefs(serverPrefs)
          window.localStorage.setItem(NOTIF_KEY, JSON.stringify(serverPrefs))
          // Load revenue estimation fields
          if (data.preferences.avg_cpc) setAvgCpc(String(data.preferences.avg_cpc))
          if (data.preferences.monthly_ad_spend) setMonthlyAdSpend(String(data.preferences.monthly_ad_spend))
          // Load agency branding fields
          if (data.preferences.agency_name) setAgencyName(String(data.preferences.agency_name))
          if (data.preferences.agency_logo_url) setAgencyLogoUrl(String(data.preferences.agency_logo_url))
          // Load weekly digest fields
          if (data.preferences.digest_enabled !== undefined) setDigestEnabled(data.preferences.digest_enabled !== false)
          if (data.preferences.digest_day) setDigestDay(String(data.preferences.digest_day))
          if (data.preferences.slack_webhook_url) setSlackWebhookUrl(String(data.preferences.slack_webhook_url))
        }
        if (data.timezone) {
          setTimezone(data.timezone)
          window.localStorage.setItem(TZ_KEY, data.timezone)
        }
      })
      .catch(() => {})
  }, [email])

  function handleNotifChange(key: keyof NotifPrefs, value: boolean) {
    const next = { ...notifPrefs, [key]: value }
    setNotifPrefs(next)
    window.localStorage.setItem(NOTIF_KEY, JSON.stringify(next))
    syncToServer(next, timezone)
  }

  function handleTimezoneChange(tz: string) {
    setTimezone(tz)
    window.localStorage.setItem(TZ_KEY, tz)
    syncToServer(notifPrefs, tz)
  }

  async function handleExport() {
    setExporting(true)
    try {
      const res = await fetch(`/api/workspace/export?email=${encodeURIComponent(email)}`)
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `nebula-export-${email.replace('@', '-at-')}.ndjson`
      a.click()
      URL.revokeObjectURL(url)
      showToast('Export downloaded')
    } catch {
      showToast('Export failed - try again')
    } finally {
      setExporting(false)
    }
  }

  async function handleDelete() {
    if (deleteState === 'idle') {
      setDeleteState('confirm')
      return
    }
    try {
      const res = await fetch('/api/workspace/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (res.ok) {
        setDeleteState('requested')
        setDeleteDate(data.purge_after)
        showToast('Account deletion scheduled')
      } else {
        showToast(data.error || 'Request failed')
      }
    } catch {
      showToast('Request failed - try again')
    }
  }

  async function handleCancelDelete() {
    try {
      const res = await fetch(`/api/workspace/delete-account?email=${encodeURIComponent(email)}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setDeleteState('idle')
        setDeleteDate(null)
        showToast('Deletion cancelled')
      }
    } catch {
      showToast('Cancel failed')
    }
  }

  return (
    <div className="space-y-10 max-w-2xl">
      <IntegrationsSection email={email} />

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-lg bg-bg-panel px-5 py-3 text-sm font-medium text-fg shadow-lg border border-border">
          {toast}
        </div>
      )}

      {/* Notification Preferences */}
      <section>
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-base font-semibold text-fg">Notification preferences</h2>
          {syncing && <span className="text-xs text-fg-dim">Saving…</span>}
        </div>
        <p className="mb-4 text-sm text-fg-muted">Choose which emails you receive from Nebula.</p>
        <div className="rounded-xl border border-border bg-bg-elevated divide-y divide-border">
          <label className="flex items-start gap-4 px-5 py-4 cursor-pointer">
            <input
              type="checkbox"
              checked={notifPrefs.regressionAlerts}
              onChange={(e) => handleNotifChange('regressionAlerts', e.target.checked)}
              className="mt-0.5 h-4 w-4 cursor-pointer rounded border-border accent-accent"
            />
            <div>
              <p className="text-sm font-medium text-fg">Monitor regression alerts</p>
              <p className="mt-0.5 text-xs text-fg-dim">Email when a monitored page score drops below its baseline.</p>
            </div>
          </label>

          <label className="flex items-start gap-4 px-5 py-4 cursor-not-allowed opacity-50">
            <input
              type="checkbox"
              checked={false}
              disabled
              className="mt-0.5 h-4 w-4 rounded border-border"
            />
            <div>
              <p className="text-sm font-medium text-fg">
                Weekly digest{' '}
                <span className="ml-1 rounded-full bg-bg-panel px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-fg-dim">Coming soon</span>
              </p>
              <p className="mt-0.5 text-xs text-fg-dim">Weekly summary of your page scores and top fixes.</p>
            </div>
          </label>

          <div className="flex items-start gap-4 px-5 py-4 opacity-70">
            <input
              type="checkbox"
              checked
              disabled
              className="mt-0.5 h-4 w-4 rounded border-border accent-accent"
            />
            <div>
              <p className="text-sm font-medium text-fg">
                Billing alerts{' '}
                <span className="ml-1 rounded-full bg-bg-panel px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-fg-dim">Always on</span>
              </p>
              <p className="mt-0.5 text-xs text-fg-dim">Receipts and payment failure notices - cannot be disabled.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Account */}
      <section>
        <h2 className="mb-1 text-base font-semibold text-fg">Account</h2>
        <p className="mb-4 text-sm text-fg-muted">Manage your account data.</p>
        <div className="rounded-xl border border-border bg-bg-elevated divide-y divide-border">
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-fg-dim">Email</p>
              <p className="mt-0.5 text-sm font-medium text-fg">{email}</p>
            </div>
          </div>

          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="text-sm font-medium text-fg">Export account data</p>
              <p className="mt-0.5 text-xs text-fg-dim">Download all audit data, preferences, and account info as NDJSON.</p>
            </div>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="ml-4 shrink-0 rounded-lg border border-border bg-bg-elevated px-4 py-2 text-xs font-semibold text-fg transition-colors hover:bg-bg-panel disabled:opacity-50"
            >
              {exporting ? 'Exporting…' : 'Download export'}
            </button>
          </div>

          <div className="flex items-start justify-between px-5 py-4">
            <div>
              <p className="text-sm font-medium text-danger">Delete account</p>
              <p className="mt-0.5 text-xs text-fg-dim">Permanently remove your account and all data after a 7-day grace period.</p>
              {deleteState === 'confirm' && (
                <p className="mt-2 text-xs font-medium text-signal-fail">
                  Are you sure? This will schedule permanent deletion of all your data.
                </p>
              )}
              {deleteState === 'requested' && (
                <div className="mt-2">
                  <p className="text-xs font-medium text-fg-muted">
                    Deletion scheduled. Data will be permanently removed{' '}
                    {deleteDate ? `on ${new Date(deleteDate).toLocaleDateString()}` : 'in 7 days'}.
                  </p>
                  <button
                    onClick={handleCancelDelete}
                    className="mt-1 text-xs font-semibold text-accent hover:underline"
                  >
                    Cancel deletion
                  </button>
                </div>
              )}
            </div>
            {deleteState !== 'requested' && (
              <button
                onClick={handleDelete}
                className="ml-4 shrink-0 rounded-lg border border-danger/30 bg-bg-elevated px-4 py-2 text-xs font-semibold text-danger transition-colors hover:bg-danger-dim"
              >
                {deleteState === 'confirm' ? 'Confirm delete' : 'Delete account'}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Revenue Estimation */}
      <section>
        <h2 className="mb-1 text-base font-semibold text-fg">Revenue Estimation</h2>
        <p className="mb-4 text-sm text-fg-muted">Used to estimate $ impact of each finding.</p>
        <div className="rounded-xl border border-border bg-bg-elevated px-5 py-5 space-y-4">
          <div>
            <label htmlFor="avg-cpc" className="block text-xs font-semibold uppercase tracking-wide text-fg-dim mb-2">
              Average CPC ($)
            </label>
            <input
              id="avg-cpc"
              type="number"
              min="0"
              step="0.01"
              placeholder="e.g. 2.50"
              value={avgCpc}
              onChange={(e) => setAvgCpc(e.target.value)}
              className="w-full rounded-lg border border-border bg-bg-panel px-3 py-2 text-sm text-fg placeholder:text-fg-dim focus:border-accent focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="monthly-ad-spend" className="block text-xs font-semibold uppercase tracking-wide text-fg-dim mb-2">
              Monthly Ad Spend ($) <span className="normal-case font-normal text-fg-dim">- optional</span>
            </label>
            <input
              id="monthly-ad-spend"
              type="number"
              min="0"
              step="1"
              placeholder="e.g. 5000"
              value={monthlyAdSpend}
              onChange={(e) => setMonthlyAdSpend(e.target.value)}
              className="w-full rounded-lg border border-border bg-bg-panel px-3 py-2 text-sm text-fg placeholder:text-fg-dim focus:border-accent focus:outline-none"
            />
          </div>
          <button
            onClick={async () => {
              setSavingRevenue(true)
              try {
                await fetch('/api/workspace/preferences', {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    email,
                    preferences: {
                      avg_cpc: avgCpc ? parseFloat(avgCpc) : null,
                      monthly_ad_spend: monthlyAdSpend ? parseFloat(monthlyAdSpend) : null,
                    },
                  }),
                })
                showToast('Revenue settings saved')
              } catch {
                showToast('Failed to save - try again')
              } finally {
                setSavingRevenue(false)
              }
            }}
            disabled={savingRevenue}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-bg hover:opacity-85 hover:bg-accent transition-colors disabled:opacity-50"
          >
            {savingRevenue ? 'Saving…' : 'Save'}
          </button>
          <p className="text-xs text-fg-dim">
            Your CPC is used to estimate the monthly revenue leak for each audit finding. You can update it anytime.
          </p>
        </div>
      </section>

      {/* Agency Branding */}
      <section>
        <h2 className="mb-1 text-base font-semibold text-fg">Agency Branding</h2>
        <p className="mb-4 text-sm text-fg-muted">Shown on shared reports you send to clients.</p>
        <div className="rounded-xl border border-border bg-bg-elevated px-5 py-5 space-y-4">
          <div>
            <label htmlFor="agency-name" className="block text-xs font-semibold uppercase tracking-wide text-fg-dim mb-2">
              Agency name
            </label>
            <input
              id="agency-name"
              type="text"
              placeholder="e.g. Acme Growth Studio"
              value={agencyName}
              onChange={(e) => setAgencyName(e.target.value)}
              className="w-full rounded-lg border border-border bg-bg-panel px-3 py-2 text-sm text-fg placeholder:text-fg-dim focus:border-accent focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="agency-logo-url" className="block text-xs font-semibold uppercase tracking-wide text-fg-dim mb-2">
              Logo URL <span className="normal-case font-normal text-fg-dim">- optional</span>
            </label>
            <input
              id="agency-logo-url"
              type="url"
              placeholder="https://example.com/logo.png"
              value={agencyLogoUrl}
              onChange={(e) => setAgencyLogoUrl(e.target.value)}
              className="w-full rounded-lg border border-border bg-bg-panel px-3 py-2 text-sm text-fg placeholder:text-fg-dim focus:border-accent focus:outline-none"
            />
          </div>
          <button
            onClick={async () => {
              setSavingBranding(true)
              try {
                await fetch('/api/workspace/preferences', {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    email,
                    preferences: {
                      agency_name: agencyName.trim() || null,
                      agency_logo_url: agencyLogoUrl.trim() || null,
                    },
                  }),
                })
                showToast('Agency branding saved')
              } catch {
                showToast('Failed to save - try again')
              } finally {
                setSavingBranding(false)
              }
            }}
            disabled={savingBranding}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-bg hover:opacity-85 hover:bg-accent transition-colors disabled:opacity-50"
          >
            {savingBranding ? 'Saving…' : 'Save'}
          </button>
          <p className="text-xs text-fg-dim">
            Your agency name and logo replace Nebula branding on shared report pages and PDF exports. A small
            &ldquo;Powered by Nebula&rdquo; footer always remains.
          </p>
        </div>
      </section>

      {/* Competitor Tracking */}
      <CompetitorSection showToast={showToast} />

      {/* Weekly Digest */}
      <section>
        <h2 className="mb-1 text-base font-semibold text-fg">Weekly Digest</h2>
        <p className="mb-4 text-sm text-fg-muted">Score changes and top actions, delivered on your schedule.</p>
        <div className="rounded-xl border border-border bg-bg-elevated px-5 py-5 space-y-4">
          <label htmlFor="digest-enabled" className="flex items-center gap-3 cursor-pointer">
            <input
              id="digest-enabled"
              type="checkbox"
              checked={digestEnabled}
              onChange={(e) => setDigestEnabled(e.target.checked)}
              className="h-4 w-4 rounded border-border accent-[#c7ff2f]"
            />
            <span className="text-sm text-fg">Email me a weekly summary</span>
          </label>
          <div>
            <label htmlFor="digest-day" className="block text-xs font-semibold uppercase tracking-wide text-fg-dim mb-2">
              Delivery day
            </label>
            <select
              id="digest-day"
              value={digestDay}
              onChange={(e) => setDigestDay(e.target.value)}
              className="rounded-lg border border-border bg-bg-panel px-3 py-2 text-sm text-fg focus:border-accent focus:outline-none"
            >
              {['monday','tuesday','wednesday','thursday','friday','saturday','sunday'].map((d) => (
                <option key={d} value={d}>{d.charAt(0).toUpperCase() + d.slice(1)}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="slack-webhook" className="block text-xs font-semibold uppercase tracking-wide text-fg-dim mb-2">
              Slack webhook URL <span className="normal-case font-normal text-fg-dim">- optional</span>
            </label>
            <input
              id="slack-webhook"
              type="url"
              placeholder="https://hooks.slack.com/services/…"
              value={slackWebhookUrl}
              onChange={(e) => setSlackWebhookUrl(e.target.value)}
              className="w-full rounded-lg border border-border bg-bg-panel px-3 py-2 text-sm text-fg placeholder:text-fg-dim focus:border-accent focus:outline-none"
            />
          </div>
          <button
            onClick={async () => {
              setSavingDigest(true)
              try {
                await fetch('/api/workspace/preferences', {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    email,
                    preferences: {
                      digest_enabled: digestEnabled,
                      digest_day: digestDay,
                      slack_webhook_url: slackWebhookUrl.trim() || null,
                    },
                  }),
                })
                showToast('Digest preferences saved')
              } catch {
                showToast('Failed to save - try again')
              } finally {
                setSavingDigest(false)
              }
            }}
            disabled={savingDigest}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-bg hover:opacity-85 hover:bg-accent transition-colors disabled:opacity-50"
          >
            {savingDigest ? 'Saving…' : 'Save'}
          </button>
          <p className="text-xs text-fg-dim">
            Digests include per-page score changes, new critical findings, and your top recommended action.
          </p>
        </div>
      </section>

      {/* Timezone */}
      <section>
        <h2 className="mb-1 text-base font-semibold text-fg">Timezone</h2>
        <p className="mb-4 text-sm text-fg-muted">Used for scheduling and report timestamps.</p>
        <div className="rounded-xl border border-border bg-bg-elevated px-5 py-4">
          <label htmlFor="tz-select" className="block text-xs font-semibold uppercase tracking-wide text-fg-dim mb-2">
            Your timezone
          </label>
          <select
            id="tz-select"
            value={timezone}
            onChange={(e) => handleTimezoneChange(e.target.value)}
            className="w-full rounded-lg border border-border bg-bg-panel px-3 py-2 text-sm text-fg focus:border-accent focus:outline-none"
          >
            {timezone && !TIMEZONES.includes(timezone) && (
              <option value={timezone}>{timezone} (detected)</option>
            )}
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>{tz}</option>
            ))}
          </select>
          <p className="mt-2 text-xs text-fg-dim">Auto-detected from your browser. Changes save automatically.</p>
        </div>
      </section>

      {/* API Keys */}
      <ApiKeysSection email={email} />
    </div>
  )
}

// ── Competitor Tracking ───────────────────────────────────────────────

interface TrackedCompetitor {
  id: string
  url: string
  label: string | null
  last_score: number | null
  last_audited_at: string | null
}

const MAX_COMPETITORS = 3

function CompetitorSection({ showToast }: { showToast: (msg: string) => void }) {
  const [competitors, setCompetitors] = useState<TrackedCompetitor[]>([])
  const [loaded, setLoaded] = useState(false)
  const [url, setUrl] = useState('')
  const [label, setLabel] = useState('')
  const [adding, setAdding] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const loadCompetitors = useCallback(async () => {
    try {
      const res = await fetch('/api/competitors', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        setCompetitors(data.competitors || [])
      }
    } catch {
      // Silent - section just shows empty state
    } finally {
      setLoaded(true)
    }
  }, [])

  useEffect(() => {
    loadCompetitors()
  }, [loadCompetitors])

  async function handleAdd() {
    const trimmed = url.trim()
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      showToast('Enter a valid URL (https://…)')
      return
    }
    setAdding(true)
    try {
      const res = await fetch('/api/competitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed, label: label.trim() || null }),
      })
      const data = await res.json().catch(() => ({}))
      if (res.ok) {
        setUrl('')
        setLabel('')
        showToast('Competitor added - first audit running')
        await loadCompetitors()
      } else {
        showToast(data.detail || data.error || 'Failed to add competitor')
      }
    } catch {
      showToast('Failed to add - try again')
    } finally {
      setAdding(false)
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/competitors/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setCompetitors((prev) => prev.filter((c) => c.id !== id))
        showToast('Competitor removed')
      } else {
        showToast('Delete failed')
      }
    } catch {
      showToast('Delete failed')
    } finally {
      setDeletingId(null)
    }
  }

  const atMax = competitors.length >= MAX_COMPETITORS

  return (
    <section>
      <h2 className="mb-1 text-base font-semibold text-fg">Competitor Tracking</h2>
      <p className="mb-4 text-sm text-fg-muted">
        Benchmark your score against up to {MAX_COMPETITORS} competitor pages. Re-audited monthly.
      </p>
      <div className="rounded-xl border border-border bg-bg-elevated divide-y divide-border">
        {loaded && competitors.length === 0 && (
          <p className="px-5 py-4 text-sm text-fg-dim">No competitors tracked yet.</p>
        )}
        {competitors.map((c) => (
          <div key={c.id} className="flex items-center justify-between gap-4 px-5 py-4">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-fg">{c.label || c.url}</p>
              <p className="truncate text-xs text-fg-dim">{c.url}</p>
            </div>
            <div className="flex shrink-0 items-center gap-4">
              <span className="text-sm font-semibold text-fg">
                {c.last_score !== null ? `${Math.round(c.last_score)}/100` : 'Audit pending'}
              </span>
              <button
                onClick={() => handleDelete(c.id)}
                disabled={deletingId === c.id}
                className="rounded-lg border border-danger/30 bg-bg-elevated px-3 py-1.5 text-xs font-semibold text-danger transition-colors hover:bg-danger-dim disabled:opacity-50"
              >
                {deletingId === c.id ? 'Removing…' : 'Remove'}
              </button>
            </div>
          </div>
        ))}

        <div className="px-5 py-4">
          <div className="grid gap-3 sm:grid-cols-[1.4fr_1fr]">
            <input
              type="url"
              placeholder="https://competitor.com/landing-page"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={atMax}
              className="w-full rounded-lg border border-border bg-bg-panel px-3 py-2 text-sm text-fg placeholder:text-fg-dim focus:border-accent focus:outline-none disabled:opacity-50"
            />
            <input
              type="text"
              placeholder="Label (optional, e.g. Competitor A)"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              disabled={atMax}
              className="w-full rounded-lg border border-border bg-bg-panel px-3 py-2 text-sm text-fg placeholder:text-fg-dim focus:border-accent focus:outline-none disabled:opacity-50"
            />
          </div>
          <div className="mt-3 flex items-center justify-between">
            <p className="text-xs text-fg-dim">
              Max {MAX_COMPETITORS} competitors{atMax ? ' - remove one to add another' : ''}
            </p>
            <button
              onClick={handleAdd}
              disabled={adding || atMax || !url.trim()}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-bg hover:opacity-85 hover:bg-accent transition-colors disabled:opacity-50"
            >
              {adding ? 'Adding…' : 'Track competitor'}
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── API Keys ──────────────────────────────────────────────────────────

interface ApiKey {
  id: string
  key_prefix: string
  label: string
  plan: string
  daily_quota: number
  used_today: number
  last_used_at: string | null
  created_at: string
}

interface ApiKeysState {
  keys: ApiKey[]
  plan: string
  limit: number
  quota_per_key_per_day: number
  can_create: boolean
}

const PLAN_LABELS: Record<string, string> = {
  free: 'Free',
  pro: 'Pro',
  growth: 'Growth',
  agency: 'Agency',
}

function ApiKeysSection({ email }: { email: string }) {
  const [state, setState] = useState<ApiKeysState | null>(null)
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [newKey, setNewKey] = useState<string | null>(null)
  const [revoking, setRevoking] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/workspace/api-keys?email=${encodeURIComponent(email)}`)
      if (!res.ok) throw new Error('Failed to load')
      const data = await res.json()
      setState(data)
    } catch {
      setError('Could not load API keys')
    } finally {
      setLoading(false)
    }
  }, [email])

  useEffect(() => { load() }, [load])

  const handleCreate = async () => {
    setCreating(true)
    setError(null)
    setNewKey(null)
    try {
      const res = await fetch('/api/workspace/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, label: newLabel || 'Default' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to create')
      setNewKey(data.key)
      setNewLabel('')
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create key')
    } finally {
      setCreating(false)
    }
  }

  const handleRevoke = async (keyId: string) => {
    setRevoking(keyId)
    try {
      const res = await fetch(
        `/api/workspace/api-keys/${keyId}?email=${encodeURIComponent(email)}`,
        { method: 'DELETE' }
      )
      if (!res.ok) throw new Error('Failed to revoke')
      await load()
    } catch {
      setError('Failed to revoke key')
    } finally {
      setRevoking(null)
    }
  }

  const copyKey = async () => {
    if (!newKey) return
    await navigator.clipboard.writeText(newKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isPaidPlan = state && ['pro', 'growth', 'agency'].includes(state.plan)

  return (
    <section>
      <h2 className="mb-1 text-base font-semibold text-fg">API Keys</h2>
      <p className="mb-4 text-sm text-fg-muted">
        Use API keys to authenticate programmatic access and MCP tool calls.
        Keys are plan-scoped - quota resets daily at UTC midnight.
      </p>

      {/* Upgrade gate for free plan */}
      {!loading && !isPaidPlan && (
        <div className="rounded-xl border border-border bg-bg-elevated px-5 py-5">
          <p className="text-sm text-fg-muted mb-3">
            API key access requires a <strong className="text-fg">Pro plan</strong> or above.
          </p>
          <a
            href="/pricing"
            className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-bg hover:opacity-85 hover:bg-accent transition-colors"
          >
            Upgrade to unlock API access →
          </a>
          <p className="mt-3 text-xs text-fg-dim">
            Pro: 1 key, 50 calls/day · Growth: 3 keys, 200 calls/day · Agency: 10 keys, unlimited
          </p>
        </div>
      )}

      {/* New key banner */}
      {newKey && (
        <div className="mb-4 rounded border border-accent/40 bg-accent/5 px-5 py-4">
          <p className="mb-2 text-sm font-semibold text-accent">
            ⚠️ Copy this key now - it will not be shown again.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded-lg border border-border bg-bg px-3 py-2 text-xs font-mono text-fg break-all">
              {newKey}
            </code>
            <button
              onClick={copyKey}
              className="shrink-0 rounded-lg border border-border bg-bg-elevated px-3 py-2 text-xs font-semibold text-fg transition-colors hover:bg-bg-panel"
            >
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
          <p className="mt-2 text-xs text-fg-dim">
            Set as <code className="bg-bg-panel px-1 rounded text-fg">NEBULA_API_KEY</code> in your MCP client config.
          </p>
        </div>
      )}

      {isPaidPlan && !loading && state && (
        <>
          {/* Existing keys */}
          <div className="rounded-xl border border-border bg-bg-elevated divide-y divide-border mb-4">
            {state.keys.length === 0 && (
              <p className="px-5 py-4 text-sm text-fg-dim">No API keys yet.</p>
            )}
            {state.keys.map((k) => (
              <div key={k.id} className="flex items-center justify-between gap-4 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-fg">{k.label}</span>
                    <code className="text-xs font-mono text-fg-dim bg-bg-panel px-1.5 py-0.5 rounded">
                      {k.key_prefix}…
                    </code>
                    <span className="text-xs text-fg-dim uppercase tracking-wide">
                      {PLAN_LABELS[k.plan] ?? k.plan}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-fg-dim">
                    {k.used_today} / {k.daily_quota === -1 ? '∞' : k.daily_quota} calls today
                    {k.last_used_at && ` · last used ${new Date(k.last_used_at).toLocaleDateString()}`}
                  </p>
                </div>
                <button
                  onClick={() => handleRevoke(k.id)}
                  disabled={revoking === k.id}
                  className="shrink-0 rounded-lg border border-danger/30 bg-bg-elevated px-3 py-1.5 text-xs font-semibold text-danger transition-colors hover:bg-danger-dim disabled:opacity-50"
                >
                  {revoking === k.id ? 'Revoking…' : 'Revoke'}
                </button>
              </div>
            ))}
          </div>

          {/* Create new key */}
          {state.can_create ? (
            <div className="rounded-xl border border-border bg-bg-elevated px-5 py-4">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-fg-dim">
                Create new key ({state.keys.length}/{state.limit})
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Label (e.g. Production, Claude Desktop)"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  className="flex-1 rounded-lg border border-border bg-bg-panel px-3 py-2 text-sm text-fg placeholder:text-fg-dim focus:border-accent focus:outline-none"
                />
                <button
                  onClick={handleCreate}
                  disabled={creating}
                  className="shrink-0 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-bg transition-colors hover:opacity-85 hover:bg-accent disabled:opacity-60"
                >
                  {creating ? 'Creating…' : 'Create key'}
                </button>
              </div>
              <p className="mt-2 text-xs text-fg-dim">
                Each key allows {state.quota_per_key_per_day === -1 ? 'unlimited' : state.quota_per_key_per_day} calls/day.
              </p>
            </div>
          ) : (
            <p className="text-xs text-fg-dim px-1">
              Key limit reached ({state.limit}/{state.limit}). Revoke an existing key to create a new one.
            </p>
          )}

          {error && <p className="mt-3 text-xs text-danger">{error}</p>}
        </>
      )}
    </section>
  )
}
