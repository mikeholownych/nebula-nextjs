'use client'

/**
 * Integrations management section (Settings → Integrations).
 * Owns ALL connect/disconnect/configuration for external integrations.
 * Dashboard widgets stay read-only and link here for management.
 */

import DeployHooksSection from './settingsDeployHooks'
import { useCallback, useEffect, useState } from 'react'

interface Ga4Status {
  connected: boolean
  property_id?: string | null
  property_display_name?: string | null
  project_domain?: string | null
}
interface Ga4Property {
  property_id: string
  display_name?: string | null
  selected?: boolean
}
interface GscStatus {
  connected: boolean
  site_url?: string | null
  project_domain?: string | null
}
interface GscSite {
  site_url: string
  permission_level?: string | null
}

const card =
  'rounded-lg border border-border bg-bg-panel p-5 mb-6'
const btn =
  'inline-flex min-h-[36px] items-center rounded px-3 py-1.5 text-sm font-medium transition-opacity hover:opacity-85 disabled:opacity-50'

export default function IntegrationsSection({ email, projectDomain }: { email?: string; projectDomain?: string }) {
  const activeProject = projectDomain && projectDomain !== 'all' ? projectDomain : undefined
  const projectQuery = activeProject ? `?project_domain=${encodeURIComponent(activeProject)}` : ''
  const [ga4, setGa4] = useState<Ga4Status | null>(null)
  const [properties, setProperties] = useState<Ga4Property[]>([])
  const [gsc, setGsc] = useState<GscStatus | null>(null)
  const [gscSites, setGscSites] = useState<GscSite[]>([])
  const [busy, setBusy] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!email) return
    // Each call isolated: one failing integration must never freeze the other
    // into an eternal "Loading..." state.
    try {
      const g = await fetch(`/api/ga4/status${projectQuery}`, { cache: 'no-store' })
      if (g.ok) {
        setGa4(await g.json())
      } else {
        setGa4({ connected: false })
      }
    } catch {
      setGa4({ connected: false })
    }
    try {
      const s = await fetch(`/api/gsc/status${projectQuery}`, { cache: 'no-store' })
      if (s.ok) setGsc(await s.json())
      else setGsc({ connected: false })
    } catch {
      setGsc({ connected: false })
    }
    try {
      const pr = await fetch(`/api/ga4/properties${projectQuery}`, { cache: 'no-store' })
      if (pr.ok) setProperties((await pr.json()).properties ?? [])
    } catch {
      setProperties([])
    }
    try {
      const gs = await fetch('/api/gsc/sites', { cache: 'no-store' })
      if (gs.ok) setGscSites((await gs.json()).sites ?? [])
    } catch {
      setGscSites([])
    }
  }, [email, projectQuery])

  useEffect(() => {
    void load()
  }, [load])

  async function ga4Disconnect() {
    setBusy('ga4-disconnect')
    const r = await fetch('/api/ga4/disconnect', { method: 'DELETE' })
    setToast(r.ok ? 'GA4 disconnected - stored tokens erased.' : 'Disconnect failed.')
    await load()
    setBusy(null)
  }

  async function ga4Select(property_id: string) {
    setBusy('ga4-select')
    const r = await fetch('/api/ga4/select', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ property_id, project_domain: activeProject }),
    })
    setToast(r.ok ? 'GA4 property saved.' : 'Could not save property.')
    await load()
    setBusy(null)
  }

  async function gscSelect(site_url: string) {
    setBusy('gsc-select')
    const r = await fetch('/api/gsc/select', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ site_url, project_domain: activeProject }),
    })
    setToast(r.ok ? 'Search Console site saved.' : 'Could not save Search Console site.')
    await load()
    setBusy(null)
  }

  async function gscDisconnect() {
    setBusy('gsc-disconnect')
    const r = await fetch('/api/gsc/disconnect', { method: 'POST' })
    setToast(r.ok ? 'Search Console disconnected.' : 'Disconnect failed.')
    await load()
    setBusy(null)
  }

  if (!email) return null

  return (
    <section id="integrations" className="mb-10">
      <h2 className="mb-1 text-lg font-semibold text-fg">Integrations</h2>
      <p className="mb-4 text-sm text-fg-muted">
        Read-only connections. We never request write access; disconnecting erases all
        stored tokens immediately.
        {activeProject && <span className="ml-1 font-medium text-fg">Project: {activeProject}</span>}
      </p>
      {toast && (
        <p role="status" className="mb-4 rounded border border-border px-3 py-2 text-sm">
          {toast}
        </p>
      )}

      {/* GA4 */}
      <div className={card}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-fg">Google Analytics 4</h3>
          {ga4 && (
            <span
              className={`text-xs ${ga4.connected ? 'text-signal-teal' : 'text-fg-muted'}`}
            >
              {ga4.connected ? 'Connected' : 'Not connected'}
            </span>
          )}
        </div>

        {!ga4 ? (
          <p className="mt-2 text-sm text-fg-muted">Loading…</p>
        ) : !ga4.connected ? (
          <>
            <p className="mt-2 text-sm text-fg-muted">
              Pull real conversion data to prove your fixes moved the needle. Read-only.
            </p>
            <a href="/api/ga4/connect" className={`${btn} mt-3 bg-accent text-bg`}>
              Connect Google Analytics
            </a>
          </>
        ) : (
          <div className="mt-3 space-y-3">
            {properties.length > 0 && (
              <label className="block text-sm">
                <span className="mb-1 block text-fg-muted">Property</span>
                <select
                  value={ga4.property_id ?? ''}
                  onChange={(e) => void ga4Select(e.target.value)}
                  disabled={busy === 'ga4-select'}
                  className="w-full max-w-md rounded border border-border bg-bg p-2 text-sm"
                >
                  {!ga4.property_id && <option value="">Select a property…</option>}
                  {properties.map((p) => (
                    <option key={p.property_id} value={p.property_id}>
                      {p.display_name ?? p.property_id}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <button
              onClick={() => void ga4Disconnect()}
              disabled={busy !== null}
              className={`${btn} border border-border text-danger`}
            >
              Disconnect GA4
            </button>
          </div>
        )}
      </div>

      {/* GSC */}
      <div className={card}>
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-fg">Google Search Console</h3>
          {gsc && (
            <span
              className={`text-xs ${gsc.connected ? 'text-signal-teal' : 'text-fg-muted'}`}
            >
              {gsc.connected ? `Connected${gsc.site_url ? ` · ${gsc.site_url}` : ''}` : 'Not connected'}
            </span>
          )}
        </div>

        {!gsc ? (
          <p className="mt-2 text-sm text-fg-muted">Loading…</p>
        ) : !gsc.connected ? (
          <>
            <p className="mt-2 text-sm text-fg-muted">
              Overlay real clicks/impressions on your score history. Read-only.
            </p>
            <a href="/api/gsc/connect" className={`${btn} mt-3 border border-border`}>
              Connect Search Console
            </a>
          </>
        ) : (
          <div className="mt-3 space-y-3">
            {gscSites.length > 0 && (
              <label className="block text-sm">
                <span className="mb-1 block text-fg-muted">Search Console site</span>
                <select
                  value={gsc.site_url ?? ''}
                  onChange={(e) => void gscSelect(e.target.value)}
                  disabled={busy !== null}
                  className="w-full max-w-md rounded border border-border bg-bg p-2 text-sm"
                >
                  {!gsc.site_url && <option value="">Select a site…</option>}
                  {gscSites.map((site) => <option key={site.site_url} value={site.site_url}>{site.site_url}</option>)}
                </select>
              </label>
            )}
            <button
              onClick={() => void gscDisconnect()}
              disabled={busy !== null}
              className={`${btn} border border-border text-danger`}
            >
              Disconnect Search Console
            </button>
          </div>
        )}
      </div>
      <DeployHooksSection email={email} />
    </section>
  )
}
