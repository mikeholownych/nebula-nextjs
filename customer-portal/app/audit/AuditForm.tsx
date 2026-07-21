'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card } from '@/components/ui'

export default function AuditForm() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [referrer, setReferrer] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const from = searchParams.get('from')
    if (from) setReferrer(decodeURIComponent(from))
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    let processedUrl = url.trim()
    if (!processedUrl) {
      setError('Please enter a URL')
      return
    }

    if (!processedUrl.match(/^https?:\/\//i)) {
      processedUrl = 'https://' + processedUrl
    }

    try {
      new URL(processedUrl)
    } catch {
      setError('Please enter a valid URL')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/audit/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: processedUrl, referrer: referrer || undefined }),
      })

      if (!response.ok) {
        throw new Error('Failed to start audit')
      }

      const data = await response.json()

      if (data.audit_id) {
        router.push(`/audit/${data.audit_id}/processing`)
      } else {
        setError('Audit completed. Full integration coming soon.')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card variant="elevated" className="mb-8">
      {/* Referral welcome banner — only shown when ?from= is present */}
      {referrer && (
        <div className="mb-6 rounded-lg bg-accent/10 border border-accent/30 px-4 py-3 text-sm">
          <p className="font-semibold text-accent">
            {referrer} sent you here.
          </p>
          <p className="mt-0.5 text-fg-muted">
            Your free audit will name the exact leaks on your page — same report they got.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="url" className="mb-2 block text-sm font-semibold text-fg">
            Your landing page URL
          </label>
          <input
            id="url"
            type="url"
            placeholder="https://yoursite.com/landing-page"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={loading}
            className="w-full rounded-lg border border-fg-muted/30 bg-bg px-4 py-3 text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none disabled:opacity-50"
          />
        </div>

        <button
          type="submit"
          disabled={!url || loading}
          className="w-full rounded-xl bg-accent px-6 py-3 font-semibold text-bg transition-colors hover:bg-accent-light disabled:opacity-50"
        >
          {loading ? 'Starting audit…' : 'Audit My Page — Free'}
        </button>

        {error && (
          <p className="text-sm text-danger text-center" role="alert">{error}</p>
        )}
      </form>
    </Card>
  )
}
