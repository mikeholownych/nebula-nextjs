'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'

export default function NewsletterForm() {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setStatus('submitting')

    const form = e.currentTarget
    const email = (form.querySelector('#nl-email') as HTMLInputElement)?.value
    const role = (form.querySelector('#nl-role') as HTMLSelectElement)?.value

    const params = new URLSearchParams(window.location.search)
    const utm_source = params.get('utm_source') || 'newsletter'
    const utm_medium = params.get('utm_medium') || 'organic'
    const utm_campaign = params.get('utm_campaign') || 'newsletter_signup'

    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          role: role || undefined,
          referrer: utm_source,
          utm_source,
          utm_medium,
          utm_campaign,
        }),
      })
      if (res.ok) {
        setStatus('done')
        setMessage('✓ Subscribed! First issue arrives Monday 8 AM ET.')
        form.reset()
      } else {
        setStatus('error')
        setMessage('Something went wrong. Try again.')
      }
    } catch {
      setStatus('error')
      setMessage('Network error. Try again.')
    }
  }

  if (status === 'done') {
    return (
      <Card variant="bordered" className="p-8 text-center">
        <p className="text-2xl mb-2">✓</p>
        <p className="font-semibold text-fg">{message}</p>
        <p className="text-sm text-fg-muted mt-2">Check your inbox Monday morning.</p>
      </Card>
    )
  }

  return (
    <Card variant="bordered" className="p-8">
      <h2 className="text-2xl font-extrabold text-fg mb-2">
        Get the weekly finding
      </h2>
      <p className="text-fg-muted mb-6">
        Every Monday morning: One pattern, one fix, one real before/after from founders who audited their sites.
      </p>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label htmlFor="nl-email" className="block text-sm font-semibold text-fg mb-2">
            Your email
          </label>
          <input
            id="nl-email"
            type="email"
            placeholder="you@company.com"
            required
            className="w-full rounded-lg border border-fg-muted/30 bg-bg px-4 py-3 text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="nl-role" className="block text-sm font-semibold text-fg mb-2">
            Your role (optional)
          </label>
          <select
            id="nl-role"
            className="w-full rounded-lg border border-fg-muted/30 bg-bg px-4 py-3 text-fg focus:border-accent focus:outline-none"
          >
            <option value="">Select one...</option>
            <option value="founder">Founder</option>
            <option value="marketer">Marketer</option>
            <option value="product">Product Manager</option>
            <option value="designer">Designer</option>
            <option value="developer">Developer</option>
            <option value="agency">Agency</option>
            <option value="other">Other</option>
          </select>
        </div>

        {status === 'error' && (
          <p className="text-sm text-danger">{message}</p>
        )}

        <button
          type="submit"
          disabled={status === 'submitting'}
          className="w-full rounded-lg bg-accent px-6 py-3 font-semibold text-bg transition-colors hover:bg-accent-light disabled:opacity-60"
        >
          {status === 'submitting' ? 'Subscribing...' : 'Subscribe (Free)'}
        </button>

        <p className="text-xs text-fg-muted text-center">
          No spam. One email per week. Unsubscribe anytime.
        </p>
      </form>
    </Card>
  )
}
