'use client'

import { useEffect, useState } from 'react'

type Domain = { id: string; domain: string; status: string; verified_by: string; verification_token?: string | null }

export default function DomainSettings() {
  const [domains, setDomains] = useState<Domain[]>([])
  const [available, setAvailable] = useState(false)
  const [hostname, setHostname] = useState('')
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/organizations/current').then((r) => r.json()).then((org) => setAvailable(org.is_agency === true)).catch(() => undefined)
  }, [])
  useEffect(() => {
    if (available) fetch('/api/domains').then((r) => r.ok ? r.json() : []).then(setDomains).catch(() => undefined)
  }, [available])
  if (!available) return null

  async function add(managed: boolean) {
    const response = await fetch('/api/domains', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(managed ? {} : { hostname: hostname.trim() }) })
    const data = await response.json().catch(() => ({}))
    if (!response.ok) { setMessage(data.detail || data.error || 'Could not add domain'); return }
    setDomains((current) => [data, ...current]); setHostname(''); setMessage('Domain added')
  }
  async function remove(id: string) {
    const response = await fetch(`/api/domains/${id}`, { method: 'DELETE' })
    if (response.ok) { setDomains((current) => current.filter((d) => d.id !== id)); setMessage('Domain revoked') }
  }

  return <section>
    <h2 className="mb-1 text-base font-semibold text-fg">Tenant domains</h2>
    <p className="mb-4 text-sm text-fg-muted">Give clients a managed workspace URL now. Custom domains require Cloudflare verification.</p>
    <div className="rounded-xl border border-border bg-bg-elevated px-5 py-5 space-y-4">
      {domains.map((domain) => <div key={domain.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3 last:border-0 last:pb-0"><div><p className="text-sm font-medium text-fg">{domain.domain}</p><p className="text-xs text-fg-dim">{domain.status} · {domain.verified_by}</p>{domain.verification_token && <p className="mt-1 text-xs font-mono text-fg-dim">TXT token: {domain.verification_token}</p>}</div><button onClick={() => remove(domain.id)} className="rounded border border-danger/30 px-3 py-1.5 text-xs font-semibold text-danger">Revoke</button></div>)}
      <button onClick={() => add(true)} className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-bg">Add managed subdomain</button>
      <div className="flex flex-wrap gap-2"><input value={hostname} onChange={(e) => setHostname(e.target.value)} placeholder="audits.example.com" className="min-w-0 flex-1 rounded-lg border border-border bg-bg-panel px-3 py-2 text-sm text-fg" /><button onClick={() => add(false)} disabled={!hostname.trim()} className="rounded-lg border border-border px-4 py-2 text-sm font-semibold text-fg disabled:opacity-50">Add custom domain</button></div>
      {message && <p className="text-xs text-fg-dim">{message}</p>}
    </div>
  </section>
}
