'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Path = 'email' | 'dns' | 'gsc'

export default function ClaimClient({ slug, domain }: { slug: string; domain: string }) {
  const router = useRouter()
  const [path, setPath] = useState<Path>('email')
  const [email, setEmail] = useState('')
  const [sentTo, setSentTo] = useState('')
  const [dnsValue, setDnsValue] = useState('')
  const [recordName, setRecordName] = useState(`_nebula-verify.${domain}`)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  async function post(pathname: string, body?: unknown) {
    const res = await fetch(pathname, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    })
    return { ok: res.ok, data: await res.json().catch(() => ({})) }
  }

  if (sentTo) {
    return (
      <div className="max-w-xl mx-auto p-8 text-center">
        <h1 className="text-xl font-semibold">Check your inbox</h1>
        <p className="mt-3 text-white/70 text-sm">
          We sent a verification link to {sentTo}. It expires in 15 minutes.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto p-8">
      <h1 className="text-2xl font-semibold">Claim this teardown</h1>
      <p className="mt-2 text-sm text-white/60">
        Prove you represent {domain}. Any one method is enough.
      </p>

      <div className="mt-6 flex gap-2 text-xs">
        {(['email', 'dns', 'gsc'] as Path[]).map((p) => (
          <button key={p} onClick={() => setPath(p)}
            className={`px-3 py-1.5 rounded border ${path === p ? 'border-accent text-accent' : 'border-white/20 text-white/60'}`}>
            {p === 'email' ? 'Work email' : p === 'dns' ? 'DNS record' : 'Search Console'}
          </button>
        ))}
      </div>

      {path === 'email' && !sentTo && (
        <form className="mt-6 space-y-3" onSubmit={async (e) => {
          e.preventDefault(); setBusy(true); setMessage('')
          const { ok, data } = await post(
            `/api/teardowns/${slug}/claim/email-request`, { email })
          setBusy(false)
          if (ok && data.sent) setSentTo(email)
          else setMessage(data.detail || 'Could not send verification')
        }}>
          <input
            id="claim-email"
            type="email"
            autoComplete="email"
            aria-label="Work email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={`you@${domain}`}
            className="w-full bg-white/5 border border-white/15 rounded px-3 py-2 text-sm"
          />
          <button disabled={busy} className="bg-accent text-black font-semibold text-sm px-4 py-2 rounded">
            {busy ? 'Sending...' : 'Send verification link'}
          </button>
        </form>
      )}

      {path === 'dns' && (
        <div className="mt-6 space-y-4 text-sm">
          {!dnsValue ? (
            <button disabled={busy} onClick={async () => {
              setBusy(true)
              const { ok, data } = await post(`/api/teardowns/${slug}/claim/dns-start`)
              setBusy(false)
              if (ok && data.record_name) { setRecordName(data.record_name); setDnsValue(data.value) }
              else setMessage(data.detail || 'Could not start challenge')
            }} className="bg-accent text-black font-semibold px-4 py-2 rounded">
              Start DNS challenge
            </button>
          ) : (
            <>
              <p className="text-white/60">Add this TXT record:</p>
              <pre className="bg-white/5 border border-white/10 rounded p-3 overflow-x-auto text-xs">{recordName}  IN TXT  "{dnsValue}"</pre>
              <button disabled={busy} onClick={async () => {
                setBusy(true); setMessage('')
                const { data } = await post(`/api/teardowns/${slug}/claim/dns-check`, { value: dnsValue })
                setBusy(false)
                if (data.verified) window.location.assign('https://app.nebulacomponents.com')
                else setMessage('Not found yet. DNS can take a few minutes.')
              }} className="bg-accent text-black font-semibold px-4 py-2 rounded">
                Check now
              </button>
            </>
          )}
        </div>
      )}

      {path === 'gsc' && (
        <div className="mt-6">
          <button disabled={busy} onClick={async () => {
            setBusy(true); setMessage('')
            const res = await fetch(`/api/teardowns/${slug}/claim/gsc-check`, { method: 'POST' })
            const data = await res.json().catch(() => ({}))
            setBusy(false)
            if (res.ok && data.claimed) router.push('/workspace')
            else setMessage(data.detail || 'Search Console check failed')
          }} className="bg-accent text-black font-semibold px-4 py-2 rounded">
            Verify via Search Console
          </button>
        </div>
      )}

      {message && <p className="mt-4 text-sm text-red-400">{message}</p>}
    </div>
  )
}
