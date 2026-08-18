'use client'

import { useState } from 'react'

export default function DownloadForm() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')

  const handleDownload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setStatus('loading')
    const form = e.currentTarget
    const email = (form.querySelector('#email') as HTMLInputElement)?.value
    const name = (form.querySelector('#name') as HTMLInputElement)?.value

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          name: name || undefined,
          utm_source: 'magnet',
          utm_medium: 'content',
          utm_campaign: 'mistakes_checklist',
          referrer: 'mistakes_checklist',
        }),
      })

      if (response.ok) {
        const a = document.createElement('a')
        a.href = '/assets/top-10-mistakes-checklist.pdf'
        a.download = 'Top-10-Landing-Page-Mistakes-Checklist.pdf'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        setStatus('done')
        form.reset()
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleDownload}>
      <div>
        <label htmlFor="name" className="block text-sm font-semibold text-fg mb-2">
          Your name (optional)
        </label>
        <input
          id="name"
          type="text"
          placeholder="You"
          className="w-full rounded-lg border border-fg-muted/30 bg-bg px-4 py-3 text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none"
        />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-semibold text-fg mb-2">
          Your email
        </label>
        <input
          id="email"
          type="email"
          placeholder="you@company.com"
          required
          className="w-full rounded-lg border border-fg-muted/30 bg-bg px-4 py-3 text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none"
        />
      </div>
      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full rounded-lg bg-accent px-6 py-3 font-semibold text-bg transition-colors hover:opacity-85 disabled:opacity-60"
      >
        {status === 'loading' ? 'Sending…' : status === 'done' ? '✓ Check your email' : 'Download Checklist (Free)'}
      </button>
      {status === 'error' && (
        <p className="text-xs text-signal-fail text-center">Something went wrong. Try again.</p>
      )}
      {status !== 'error' && (
        <p className="text-xs text-fg-muted text-center">
          No spam. Unsubscribe anytime.
        </p>
      )}
    </form>
  )
}
