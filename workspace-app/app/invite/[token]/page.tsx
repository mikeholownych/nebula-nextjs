'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

export default function InviteAcceptPage() {
  const params = useParams()
  const token = typeof params?.token === 'string' ? params.token : ''
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!token) {
      setStatus('error')
      setMessage('Invalid invite link.')
      return
    }

    fetch('/api/clients/invite/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then(async r => {
        const data = await r.json().catch(() => ({}))
        if (r.ok) {
          setStatus('success')
          setMessage(`Welcome! You now have access to the ${data.client_name || 'client'} workspace.`)
          setTimeout(() => {
            window.location.replace('/')
          }, 2000)
        } else {
          setStatus('error')
          setMessage(data.detail || data.error || 'This invite link is invalid or has expired.')
        }
      })
      .catch(() => {
        setStatus('error')
        setMessage('Something went wrong. Please try again.')
      })
  }, [token])

  return (
    <main className="min-h-screen bg-bg text-fg flex items-center justify-center px-4">
      <div className="max-w-md w-full rounded-xl border border-border bg-surface p-8 text-center space-y-4">
        {status === 'loading' && (
          <>
            <p className="text-fg font-semibold text-lg">Accepting invite...</p>
            <p className="text-fg-dim text-sm">Please wait a moment.</p>
          </>
        )}
        {status === 'success' && (
          <>
            <p className="text-accent font-semibold text-lg">Invite accepted</p>
            <p className="text-fg-dim text-sm">{message}</p>
            <p className="text-fg-dim text-xs">Redirecting to your workspace...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <p className="text-red-400 font-semibold text-lg">Invite failed</p>
            <p className="text-fg-dim text-sm">{message}</p>
            <a
              href="/login"
              className="inline-block mt-2 rounded bg-accent px-4 py-2 text-sm font-medium text-bg hover:bg-accent/80"
            >
              Go to login
            </a>
          </>
        )}
      </div>
    </main>
  )
}
