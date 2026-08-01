'use client'

import { useEffect, useState } from 'react'

const NOTIF_KEY = 'nebula_notification_prefs'
const TZ_KEY = 'nebula_timezone'

interface NotifPrefs {
  regressionAlerts: boolean
  weeklyDigest: boolean
}

function defaultNotifPrefs(): NotifPrefs {
  return { regressionAlerts: true, weeklyDigest: false }
}

function loadNotifPrefs(): NotifPrefs {
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

// Representative IANA timezone list
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
  const [deleteMsg, setDeleteMsg] = useState(false)

  // Load from localStorage on mount
  useEffect(() => {
    setNotifPrefs(loadNotifPrefs())
    const savedTz = window.localStorage.getItem(TZ_KEY)
    setTimezone(savedTz || browserTimezone())
  }, [])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  function handleNotifChange(key: keyof NotifPrefs, value: boolean) {
    const next = { ...notifPrefs, [key]: value }
    setNotifPrefs(next)
    window.localStorage.setItem(NOTIF_KEY, JSON.stringify(next))
  }

  function handleTimezoneChange(tz: string) {
    setTimezone(tz)
    window.localStorage.setItem(TZ_KEY, tz)
  }

  return (
    <div className="space-y-10 max-w-2xl">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 rounded-lg bg-bg-panel px-5 py-3 text-sm font-medium text-fg shadow-lg">
          {toast}
        </div>
      )}

      {/* Notification Preferences */}
      <section>
        <h2 className="mb-1 text-base font-semibold text-[#171717]">Notification preferences</h2>
        <p className="mb-4 text-sm text-[#777771]">Choose which emails you receive from Nebula.</p>
        <div className="rounded-xl border border-[#e5e5e2] bg-white divide-y divide-[#e5e5e2]">
          {/* Regression alerts */}
          <label className="flex items-start gap-4 px-5 py-4 cursor-pointer">
            <input
              type="checkbox"
              checked={notifPrefs.regressionAlerts}
              onChange={(e) => handleNotifChange('regressionAlerts', e.target.checked)}
              className="mt-0.5 h-4 w-4 cursor-pointer rounded border-border accent-[#171717]"
            />
            <div>
              <p className="text-sm font-medium text-[#171717]">Monitor regression alerts</p>
              <p className="mt-0.5 text-xs text-fg-dim">Email when a monitored page score drops below its baseline.</p>
            </div>
          </label>

          {/* Weekly digest */}
          <label className="flex items-start gap-4 px-5 py-4 cursor-not-allowed opacity-50">
            <input
              type="checkbox"
              checked={false}
              disabled
              className="mt-0.5 h-4 w-4 rounded border-border"
            />
            <div>
              <p className="text-sm font-medium text-[#171717]">
                Weekly digest{' '}
                <span className="ml-1 rounded-full bg-[#f0f0ec] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-fg-dim">Coming soon</span>
              </p>
              <p className="mt-0.5 text-xs text-fg-dim">Weekly summary of your page scores and top fixes.</p>
            </div>
          </label>

          {/* Billing alerts */}
          <div className="flex items-start gap-4 px-5 py-4 opacity-70">
            <input
              type="checkbox"
              checked
              disabled
              className="mt-0.5 h-4 w-4 rounded border-border accent-[#171717]"
            />
            <div>
              <p className="text-sm font-medium text-[#171717]">
                Billing alerts{' '}
                <span className="ml-1 rounded-full bg-[#f0f0ec] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-fg-dim">Always on</span>
              </p>
              <p className="mt-0.5 text-xs text-fg-dim">Receipts and payment failure notices — cannot be disabled.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Account */}
      <section>
        <h2 className="mb-1 text-base font-semibold text-[#171717]">Account</h2>
        <p className="mb-4 text-sm text-[#777771]">Manage your account data.</p>
        <div className="rounded-xl border border-[#e5e5e2] bg-white divide-y divide-[#e5e5e2]">
          {/* Email */}
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-fg-dim">Email</p>
              <p className="mt-0.5 text-sm font-medium text-[#171717]">{email}</p>
            </div>
          </div>

          {/* Export */}
          <div className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="text-sm font-medium text-[#171717]">Request account data export</p>
              <p className="mt-0.5 text-xs text-fg-dim">Download all audit data and account info.</p>
            </div>
            <button
              onClick={() => showToast('Coming soon')}
              className="ml-4 shrink-0 rounded-lg border border-[#e5e5e2] bg-white px-4 py-2 text-xs font-semibold text-[#171717] transition-colors hover:bg-[#f5f5f3]"
            >
              Request export
            </button>
          </div>

          {/* Delete */}
          <div className="flex items-start justify-between px-5 py-4">
            <div>
              <p className="text-sm font-medium text-red-600">Delete account</p>
              <p className="mt-0.5 text-xs text-fg-dim">Permanently remove your account and all data.</p>
              {deleteMsg && (
                <p className="mt-2 text-xs font-medium text-[#777771]">
                  Contact{' '}
                  <a href="mailto:support@nebulacomponents.shop" className="text-[#171717] underline underline-offset-2">
                    support@nebulacomponents.shop
                  </a>{' '}
                  to delete your account.
                </p>
              )}
            </div>
            <button
              onClick={() => setDeleteMsg(true)}
              className="ml-4 shrink-0 rounded-lg border border-red-200 bg-white px-4 py-2 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50"
            >
              Delete account
            </button>
          </div>
        </div>
      </section>

      {/* Timezone */}
      <section>
        <h2 className="mb-1 text-base font-semibold text-[#171717]">Timezone</h2>
        <p className="mb-4 text-sm text-[#777771]">Used for scheduling and report timestamps.</p>
        <div className="rounded-xl border border-[#e5e5e2] bg-white px-5 py-4">
          <label htmlFor="tz-select" className="block text-xs font-semibold uppercase tracking-wide text-fg-dim mb-2">
            Your timezone
          </label>
          <select
            id="tz-select"
            value={timezone}
            onChange={(e) => handleTimezoneChange(e.target.value)}
            className="w-full rounded-lg border border-[#e5e5e2] bg-[#f7f7f5] px-3 py-2 text-sm text-[#171717] focus:border-[#171717] focus:outline-none"
          >
            {/* If the browser tz isn't in the list, show it first */}
            {timezone && !TIMEZONES.includes(timezone) && (
              <option value={timezone}>{timezone} (detected)</option>
            )}
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>{tz}</option>
            ))}
          </select>
          <p className="mt-2 text-xs text-fg-dim">Auto-detected from your browser. Changes save immediately.</p>
        </div>
      </section>
    </div>
  )
}
