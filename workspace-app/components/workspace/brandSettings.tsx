'use client'

import { useEffect, useState } from 'react'

interface BrandProfile {
  display_name: string
  logo_url: string | null
  logo_dark_url: string | null
  primary_color: string
  support_email: string | null
  footer_text: string | null
  published: boolean
}

const DEFAULTS: BrandProfile = {
  display_name: '',
  logo_url: null,
  logo_dark_url: null,
  primary_color: '#c7ff2f',
  support_email: null,
  footer_text: null,
  published: false,
}

export default function BrandSettings() {
  const [profile, setProfile] = useState<BrandProfile>(DEFAULTS)
  const [exists, setExists] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [available, setAvailable] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    fetch('/api/organizations/current')
      .then((r) => r.json())
      .then((org) => setAvailable(org.is_agency === true))
      .catch(() => setAvailable(false))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!available) return
    fetch('/api/brand')
      .then(async (r) => {
        if (r.status === 404) return
        const data = await r.json()
        if (r.ok) {
          setProfile({ ...DEFAULTS, ...data })
          setExists(true)
        }
      })
      .catch(() => setMessage('Could not load brand profile'))
  }, [available])

  if (loading || !available) return null

  async function save() {
    setSaving(true)
    setMessage(null)
    try {
      const response = await fetch('/api/brand', {
        method: exists ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.detail || data.error || 'Could not save brand profile')
      setProfile({ ...DEFAULTS, ...data })
      setExists(true)
      setMessage('Brand profile saved')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save brand profile')
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    if (!window.confirm('Delete this brand profile?')) return
    const response = await fetch('/api/brand', { method: 'DELETE' })
    if (response.ok) {
      setProfile(DEFAULTS)
      setExists(false)
      setMessage('Brand profile deleted')
    } else {
      setMessage('Could not delete brand profile')
    }
  }

  async function uploadLogo(file: File) {
    const allowed = ['image/png', 'image/svg+xml', 'image/webp']
    if (!allowed.includes(file.type)) {
      setMessage('Logo must be PNG, SVG, or WebP')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setMessage('Logo must be 2 MB or smaller')
      return
    }
    setUploading(true)
    setMessage(null)
    try {
      const urlResponse = await fetch(`/api/brand/logo-upload-url?content_type=${encodeURIComponent(file.type)}`, { method: 'POST' })
      const upload = await urlResponse.json().catch(() => ({}))
      if (!urlResponse.ok) throw new Error(upload.detail || upload.error || 'Could not prepare logo upload')
      const putResponse = await fetch(upload.upload_url, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      })
      if (!putResponse.ok) throw new Error('Could not upload logo')
      const saveResponse = await fetch('/api/brand', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logo_url: upload.public_url }),
      })
      const saved = await saveResponse.json().catch(() => ({}))
      if (!saveResponse.ok) throw new Error(saved.detail || saved.error || 'Could not save logo')
      setProfile({ ...DEFAULTS, ...saved })
      setExists(true)
      setMessage('Logo uploaded')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not upload logo')
    } finally {
      setUploading(false)
    }
  }

  return (
    <section>
      <h2 className="mb-1 text-base font-semibold text-fg">Workspace branding</h2>
      <p className="mb-4 text-sm text-fg-muted">Draft the identity your clients will see when branded tenant routing ships.</p>
      <div className="rounded-xl border border-border bg-bg-elevated px-5 py-5 space-y-4">
        <div>
          <label htmlFor="brand-display-name" className="block text-xs font-semibold uppercase tracking-wide text-fg-dim mb-2">Display name</label>
          <input id="brand-display-name" value={profile.display_name} onChange={(e) => setProfile({ ...profile, display_name: e.target.value })} placeholder="Acme Growth Studio" className="w-full rounded-lg border border-border bg-bg-panel px-3 py-2 text-sm text-fg" />
        </div>
        <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
          <div>
            <label htmlFor="brand-primary-color" className="block text-xs font-semibold uppercase tracking-wide text-fg-dim mb-2">Primary color</label>
            <input id="brand-primary-color" value={profile.primary_color} onChange={(e) => setProfile({ ...profile, primary_color: e.target.value })} placeholder="#c7ff2f" className="w-full rounded-lg border border-border bg-bg-panel px-3 py-2 text-sm font-mono text-fg" />
          </div>
          <div className="flex items-end gap-2 pb-1">
            <input aria-label="Color preview" type="color" value={/^#[0-9a-fA-F]{6}$/.test(profile.primary_color) ? profile.primary_color : '#c7ff2f'} onChange={(e) => setProfile({ ...profile, primary_color: e.target.value })} className="h-10 w-16 cursor-pointer rounded border border-border bg-bg-panel" />
            <span className="text-xs text-fg-dim">Preview</span>
          </div>
        </div>
        <div>
          <label htmlFor="brand-support-email" className="block text-xs font-semibold uppercase tracking-wide text-fg-dim mb-2">Support email</label>
          <input id="brand-support-email" type="email" value={profile.support_email ?? ''} onChange={(e) => setProfile({ ...profile, support_email: e.target.value || null })} placeholder="support@example.com" className="w-full rounded-lg border border-border bg-bg-panel px-3 py-2 text-sm text-fg" />
        </div>
        <div>
          <label htmlFor="brand-footer-text" className="block text-xs font-semibold uppercase tracking-wide text-fg-dim mb-2">Footer text</label>
          <input id="brand-footer-text" value={profile.footer_text ?? ''} onChange={(e) => setProfile({ ...profile, footer_text: e.target.value || null })} placeholder="Powered by Acme Growth Studio" className="w-full rounded-lg border border-border bg-bg-panel px-3 py-2 text-sm text-fg" />
        </div>
        <div>
          <label htmlFor="brand-logo" className="block text-xs font-semibold uppercase tracking-wide text-fg-dim mb-2">Logo</label>
          <div className="flex flex-wrap items-center gap-3">
            <input id="brand-logo" type="file" accept="image/png,image/svg+xml,image/webp" disabled={uploading} onChange={(e) => { const file = e.target.files?.[0]; if (file) void uploadLogo(file) }} className="block w-full max-w-md text-sm text-fg-dim file:mr-3 file:rounded-md file:border-0 file:bg-bg-panel file:px-3 file:py-2 file:text-sm file:font-semibold file:text-fg" />
            {profile.logo_url && <img src={profile.logo_url} alt="Current brand logo" className="h-10 max-w-40 object-contain" />}
          </div>
          <p className="mt-2 text-xs text-fg-dim">PNG, SVG, or WebP. Maximum 2 MB.</p>
        </div>
        <label className="flex items-center gap-3 text-sm text-fg">
          <input type="checkbox" checked={profile.published} onChange={(e) => setProfile({ ...profile, published: e.target.checked })} className="h-4 w-4 accent-accent" />
          Publish when custom tenant routing is enabled
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={save} disabled={saving || !profile.display_name.trim()} className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-bg disabled:opacity-50">{saving ? 'Saving...' : exists ? 'Save branding' : 'Create profile'}</button>
          {exists && <button onClick={remove} className="rounded-lg border border-danger/30 px-4 py-2 text-sm font-semibold text-danger">Delete profile</button>}
          {message && <span className="text-xs text-fg-dim">{message}</span>}
        </div>
         <p className="text-xs text-fg-dim">Logo uploads use a private signed upload and are published only when the brand profile is published.</p>
      </div>
    </section>
  )
}
