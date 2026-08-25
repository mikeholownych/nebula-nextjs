'use client'

/**
 * Deploy webhook management (Settings -> Integrations).
 * Create/revoke capability-token hooks; the full URL is shown ONCE.
 */

import { useCallback, useEffect, useState } from 'react'

const btn =
  'inline-flex min-h-[36px] items-center rounded px-3 py-1.5 text-sm font-medium transition-opacity hover:opacity-85 disabled:opacity-50'
const card = 'rounded-lg border border-border bg-bg-panel p-5 mb-6'

interface Hook {
  id: string
  url: string
  domains: string[]
  revoked: boolean
  use_count: number
  last_used_at?: string | null
}

export default function DeployHooksSection({ email }: { email?: string }) {
  const [hooks, setHooks] = useState<Hook[] | null>(null)
  const [domains, setDomains] = useState('')
  const [created, setCreated] = useState<{ url: string; curl: string } | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    if (!email) return
    const r = await fetch('/api/hooks/deploy', { cache: 'no-store' })
    if (r.ok) setHooks((await r.json()).hooks ?? [])
  }, [email])

  useEffect(() => {
    void load()
  }, [load])

  async function create() {
    setBusy(true)
    const list = domains.split(',').map((d) => d.trim()).filter(Boolean)
    const r = await fetch('/api/hooks/deploy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domains: list }),
    })
    if (r.ok) {
      setCreated(await r.json())
      await load()
    }
    setBusy(false)
  }

  async function revoke(id: string) {
    setBusy(true)
    await fetch(`/api/hooks/deploy/${id}`, { method: 'DELETE' })
    await load()
    setBusy(false)
  }

  if (!email) return null

  return (
    <div className={card}>
      <h3 className="text-sm font-semibold text-fg">Deploy webhook</h3>
      <p className="mt-1 text-sm text-fg-muted">
        Point your CI/CD at this URL after each deploy. We re-verify your open fixes
        against the live page and update their status automatically.
      </p>

      {created && (
        <div className="mt-3 rounded border border-signal-teal/40 bg-bg p-3 text-xs">
          <p className="font-semibold">Copy now - shown once:</p>
          <code className="mt-2 block break-all">{created.url}</code>
          <code className="mt-2 block break-all text-fg-muted">{created.curl}</code>
        </div>
      )}

      {hooks && hooks.filter((h) => !h.revoked).length > 0 && (
        <ul className="mt-4 space-y-2">
          {hooks
            .filter((h) => !h.revoked)
            .map((h) => (
              <li key={h.id} className="flex items-center justify-between text-sm">
                <span className="truncate">
                  {h.domains.join(', ')}{' '}
                  <span className="text-fg-muted">
                    ({h.use_count} use{h.use_count === 1 ? '' : 's'}
                    {h.last_used_at ? '' : ', never fired'})
                  </span>
                </span>
                <button
                  onClick={() => void revoke(h.id)}
                  disabled={busy}
                  className="ml-3 shrink-0 text-danger underline disabled:opacity-50"
                >
                  Revoke
                </button>
              </li>
            ))}
        </ul>
      )}

      <div className="mt-4 flex gap-2">
        <input
          value={domains}
          onChange={(e) => setDomains(e.target.value)}
          placeholder="myshop.com, app.myapp.io"
          className="w-full max-w-md rounded border border-border bg-bg p-2 text-sm"
        />
        <button onClick={() => void create()} disabled={busy || !domains} className={`${btn} bg-accent text-bg`}>
          Create webhook
        </button>
      </div>
    </div>
  )
}
