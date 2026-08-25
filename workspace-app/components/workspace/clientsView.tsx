'use client'

import { useEffect, useState } from 'react'

interface Client {
  id: string
  name: string
  slug: string
  domain: string
  client_email: string
  status: string
  notes: string | null
  created_at: string
}

interface ClientAudit {
  id: string
  url: string
  status: string
  score: number | null
  grade: string | null
  completed_at: string | null
}

export default function ClientsView() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<Client | null>(null)
  const [audits, setAudits] = useState<ClientAudit[]>([])
  const [auditsLoading, setAuditsLoading] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [addName, setAddName] = useState('')
  const [addDomain, setAddDomain] = useState('')
  const [addNotes, setAddNotes] = useState('')
  const [addError, setAddError] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/clients')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setClients(data)
        else setError(data.error || 'Failed to load clients')
      })
      .catch(() => setError('Failed to load clients'))
      .finally(() => setLoading(false))
  }, [])

  async function loadAudits(client: Client) {
    setSelected(client)
    setAudits([])
    setAuditsLoading(true)
    setInviteUrl(null)
    try {
      const r = await fetch(`/api/clients/${client.id}/audits`)
      const data = await r.json()
      setAudits(data.audits || [])
    } catch {
      setAudits([])
    }
    setAuditsLoading(false)
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!addName.trim() || !addDomain.trim()) return
    setAdding(true)
    setAddError(null)
    try {
      const r = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: addName.trim(), domain: addDomain.trim(), notes: addNotes.trim() || undefined }),
      })
      const data = await r.json()
      if (!r.ok) { setAddError(data.detail || data.error || 'Failed to create client'); return }
      setClients(prev => [data, ...prev])
      setAddName(''); setAddDomain(''); setAddNotes('')
      setShowAdd(false)
    } catch {
      setAddError('Request failed')
    } finally {
      setAdding(false)
    }
  }

  async function handleInvite(clientId: string) {
    const r = await fetch(`/api/clients/${clientId}/invite`, { method: 'POST' })
    const data = await r.json()
    if (r.ok) setInviteUrl(data.invite_url)
  }

  async function handleUnlink(client: Client) {
    if (!confirm(`Unlink ${client.name}? Their data is preserved but access is revoked.`)) return
    await fetch(`/api/clients/${client.id}`, { method: 'DELETE' })
    setClients(prev => prev.filter(c => c.id !== client.id))
    if (selected?.id === client.id) { setSelected(null); setAudits([]) }
  }

  if (loading) return <div className="text-fg-dim text-sm">Loading clients...</div>
  if (error && !clients.length) return <div className="text-red-400 text-sm">{error}</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-fg">Clients</h2>
        <button
          onClick={() => setShowAdd(v => !v)}
          className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-bg hover:bg-accent/80"
        >
          {showAdd ? 'Cancel' : 'Add Client'}
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAdd} className="rounded-lg border border-border p-4 space-y-3">
          <h3 className="text-sm font-medium text-fg">New Client</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs text-fg-dim mb-1">Client name</label>
              <input
                className="w-full rounded border border-border bg-surface px-2.5 py-1.5 text-sm text-fg"
                value={addName} onChange={e => setAddName(e.target.value)}
                placeholder="Acme Corp" required
              />
            </div>
            <div>
              <label className="block text-xs text-fg-dim mb-1">Primary domain</label>
              <input
                className="w-full rounded border border-border bg-surface px-2.5 py-1.5 text-sm text-fg"
                value={addDomain} onChange={e => setAddDomain(e.target.value)}
                placeholder="acmecorp.com" required
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-fg-dim mb-1">Notes (optional)</label>
            <input
              className="w-full rounded border border-border bg-surface px-2.5 py-1.5 text-sm text-fg"
              value={addNotes} onChange={e => setAddNotes(e.target.value)}
            />
          </div>
          {addError && <p className="text-xs text-red-400">{addError}</p>}
          <button
            type="submit" disabled={adding}
            className="rounded bg-accent px-3 py-1.5 text-sm font-medium text-bg disabled:opacity-50"
          >
            {adding ? 'Creating...' : 'Create Client'}
          </button>
        </form>
      )}

      {clients.length === 0 ? (
        <p className="text-fg-dim text-sm">No clients yet. Add your first client above.</p>
      ) : (
        <div className="divide-y divide-border rounded-lg border border-border">
          {clients.filter(c => c.status !== 'unlinked').map(client => (
            <div key={client.id}
              className={`flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-surface ${selected?.id === client.id ? 'bg-surface' : ''}`}
              onClick={() => loadAudits(client)}
            >
              <div>
                <p className="text-sm font-medium text-fg">{client.name}</p>
                <p className="text-xs text-fg-dim">{client.domain}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-1.5 py-0.5 rounded ${client.status === 'active' ? 'bg-accent/10 text-accent' : 'bg-border text-fg-dim'}`}>
                  {client.status}
                </span>
                <button onClick={e => { e.stopPropagation(); handleUnlink(client) }}
                  className="text-xs text-fg-dim hover:text-red-400">
                  Unlink
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div className="rounded-lg border border-border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-fg">{selected.name}</h3>
            <button
              onClick={() => handleInvite(selected.id)}
              className="text-xs text-fg-dim hover:text-accent border border-border rounded px-2 py-1"
            >
              Generate Invite Link
            </button>
          </div>
          <p className="text-xs text-fg-dim font-mono">{selected.client_email}</p>
          {inviteUrl && (
            <div className="rounded bg-surface border border-border p-2">
              <p className="text-xs text-fg-dim mb-1">Share this invite link (expires in 7 days):</p>
              <p className="text-xs font-mono text-accent break-all">{inviteUrl}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-fg-dim mb-2">Recent audits</p>
            {auditsLoading ? (
              <p className="text-xs text-fg-dim">Loading...</p>
            ) : audits.length === 0 ? (
              <p className="text-xs text-fg-dim">No audits yet. Run an audit for {selected.domain} to see results here.</p>
            ) : (
              <div className="divide-y divide-border rounded border border-border">
                {audits.map(a => (
                  <div key={a.id} className="flex items-center justify-between px-3 py-2">
                    <p className="text-xs text-fg truncate max-w-[60%]">{a.url}</p>
                    <div className="flex items-center gap-2 shrink-0">
                      {a.score != null && (
                        <span className="text-xs font-medium text-fg">{Math.round(a.score / 10)}/100</span>
                      )}
                      {a.grade && <span className="text-xs text-fg-dim">{a.grade}</span>}
                      <span className={`text-xs ${a.status === 'completed' ? 'text-accent' : 'text-fg-dim'}`}>
                        {a.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
