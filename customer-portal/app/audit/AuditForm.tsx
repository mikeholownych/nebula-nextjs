'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui'

export default function AuditForm() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Basic URL validation
    let processedUrl = url.trim()
    if (!processedUrl) {
      setError('Please enter a URL')
      return
    }

    // Add https:// if no protocol
    if (!processedUrl.match(/^https?:\/\//i)) {
      processedUrl = 'https://' + processedUrl
    }

    // Validate URL format
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
        body: JSON.stringify({ url: processedUrl })
      })

      if (!response.ok) {
        throw new Error('Failed to start audit')
      }

      const data = await response.json()

      if (data.audit_id) {
        router.push(`/audit/${data.audit_id}/processing`)
      } else {
        // Direct response (current behavior) - show inline
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
      <form onSubmit={handleSubmit}>
        <label htmlFor="url" className="mb-2 block text-sm font-medium text-fg">
          Enter your landing page URL
        </label>
        <div className="flex gap-3">
          <input
            id="url"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="example.com or https://example.com"
            className="flex-1 rounded-xl border border-border bg-bg px-4 py-3 text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-accent px-6 py-3 font-semibold text-bg transition-colors hover:bg-accent-light disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Analyzing...' : 'Run Audit'}
          </button>
        </div>
        {error && (
          <p className="mt-3 text-sm text-danger" role="alert">{error}</p>
        )}
      </form>
    </Card>
  )
}
