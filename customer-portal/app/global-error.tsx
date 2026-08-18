'use client'

import { useEffect } from 'react'

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    const w = window as Window & { posthog?: { captureException?: (e: unknown) => void } }
    w.posthog?.captureException?.(error)
  }, [error])

  return (
    <html lang="en">
      <body style={{ background: '#0a0a0a', color: '#e5e5e5', fontFamily: 'system-ui, sans-serif', padding: '4rem 1.5rem', textAlign: 'center' }}>
        <p style={{ fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#ef4444' }}>Application error</p>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: '1rem 0' }}>Something went wrong</h1>
        <p style={{ color: '#a3a3a3', marginBottom: '2rem' }}>An unexpected error occurred. Please try again.</p>
        <button onClick={reset} type="button" style={{ background: '#c7ff2f', color: '#000', padding: '0.75rem 1.5rem', borderRadius: '0.75rem', border: 'none', fontWeight: 600, cursor: 'pointer' }}>
          Try again
        </button>
      </body>
    </html>
  )
}
