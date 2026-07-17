'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui'

export default function AuditPage() {
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
    <main className="min-h-screen bg-bg px-6 py-12">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-accent">
            Free Landing Page Audit
          </p>
          <h1 className="mb-4 text-4xl font-bold text-fg">
            Find Out Why Your Ads Aren't Converting
          </h1>
          <p className="text-lg text-fg-muted">
            Get actionable insights in 60 seconds — no signup required to start
          </p>
        </div>

        {/* URL Input Card */}
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
              <p className="mt-3 text-sm text-red-500">{error}</p>
            )}
          </form>
        </Card>

        {/* Trust Signals */}
        <div className="space-y-6">
          <h2 className="text-center text-sm font-semibold uppercase tracking-wider text-fg-muted">
            What You'll Get
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card variant="bordered" className="p-4">
              <h3 className="mb-2 font-semibold text-fg">Evidence-Based Score</h3>
              <p className="text-sm text-fg-muted">
                Not a guess — actual checks for headline clarity, CTAs, trust signals, and load speed
              </p>
            </Card>
            <Card variant="bordered" className="p-4">
              <h3 className="mb-2 font-semibold text-fg">Prioritized Fixes</h3>
              <p className="text-sm text-fg-muted">
                Quick wins you can implement today vs. major projects for later
              </p>
            </Card>
            <Card variant="bordered" className="p-4">
              <h3 className="mb-2 font-semibold text-fg">Conversion Focus</h3>
              <p className="text-sm text-fg-muted">
                Every finding ties back to reducing friction and increasing conversions
              </p>
            </Card>
            <Card variant="bordered" className="p-4">
              <h3 className="mb-2 font-semibold text-fg">No Commitment</h3>
              <p className="text-sm text-fg-muted">
                Start free. Share your email only when you want the full report
              </p>
            </Card>
          </div>
        </div>

        {/* How It Works */}
        <div className="mt-12 text-center">
          <h2 className="mb-6 text-sm font-semibold uppercase tracking-wider text-fg-muted">
            How It Works
          </h2>
          <div className="flex flex-col items-center justify-center gap-6 sm:flex-row sm:gap-12">
            <div className="text-center">
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-xl font-bold text-bg">
                1
              </div>
              <p className="text-sm text-fg-muted">Enter URL</p>
            </div>
            <div className="hidden h-px w-12 bg-border sm:block" />
            <div className="text-center">
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-xl font-bold text-bg">
                2
              </div>
              <p className="text-sm text-fg-muted">We Analyze</p>
            </div>
            <div className="hidden h-px w-12 bg-border sm:block" />
            <div className="text-center">
              <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-xl font-bold text-bg">
                3
              </div>
              <p className="text-sm text-fg-muted">Get Results</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
