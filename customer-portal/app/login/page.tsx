'use client'

import { FormEvent, useState } from 'react'
import { useSearchParams } from 'next/navigation'

export default function LoginPage() {
  const params = useSearchParams()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(params.get('error') ? 'That sign-in link is invalid or expired. Request a new one.' : null)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const response = await fetch('/api/auth/magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.detail || data.error || 'Unable to send sign-in link')
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send sign-in link')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="min-h-screen bg-bg text-fg pt-24" id="main-content">
      <div className="mx-auto max-w-md px-6 py-16">
        <h1 className="text-3xl font-bold">Sign in to your workspace</h1>
        <p className="mt-2 text-fg-muted">We&apos;ll email you a secure, one-time sign-in link.</p>
        <form onSubmit={submit} className="mt-8 rounded-lg border border-border bg-bg-elevated p-6">
          {sent ? (
            <p className="text-sm text-accent">Check your inbox for your sign-in link. It expires in 15 minutes.</p>
          ) : (
            <>
              <label htmlFor="login-email" className="block text-sm text-fg-muted mb-2">Email address</label>
              <input id="login-email" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-lg border border-border bg-bg-panel px-4 py-2.5 text-fg" />
              {error && <p className="mt-2 text-sm text-danger">{error}</p>}
              <button type="submit" disabled={busy} className="mt-4 w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-bg disabled:opacity-50">{busy ? 'Sending…' : 'Email me a sign-in link'}</button>
            </>
          )}
        </form>
      </div>
    </main>
  )
}
