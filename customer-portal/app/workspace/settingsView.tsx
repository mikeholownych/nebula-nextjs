'use client'

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
        // Silent — localStorage is the fallback
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
      showToast('Export failed — try again')
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
      showToast('Request failed — try again')
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
              <p className="mt-0.5 text-xs text-fg-dim">Receipts and payment failure notices — cannot be disabled.</p>
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
              Monthly Ad Spend ($) <span className="normal-case font-normal text-fg-dim">— optional</span>
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
                showToast('Failed to save — try again')
              } finally {
                setSavingRevenue(false)
              }
            }}
            disabled={savingRevenue}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-bg hover:bg-accent-light transition-colors disabled:opacity-50"
          >
            {savingRevenue ? 'Saving…' : 'Save'}
          </button>
          <p className="text-xs text-fg-dim">
            Your CPC is used to estimate the monthly revenue leak for each audit finding. You can update it anytime.
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
    </div>
  )
}
