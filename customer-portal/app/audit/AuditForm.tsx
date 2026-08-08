'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card } from '@/components/ui'
import posthog from '@/app/lib/posthog-browser'
import { analyticsHeaders, newAuditAttemptId, rememberAuditAttemptId } from '@/app/lib/client-analytics'

function AuditFormContent() {
  const [url, setUrl] = useState('')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [referrer, setReferrer] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const source = searchParams.get('source')
    const from = searchParams.get('from')
    const attribution = source || (from ? decodeURIComponent(from) : null)
    if (attribution) setReferrer(attribution)
    const prefilled = searchParams.get('url')
    if (prefilled) setUrl(prefilled)
    posthog.capture('audit_page_viewed', {
      referrer: attribution || undefined,
      prefilled: prefilled ? true : undefined,
    })
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

    // Minted here, on the first event of the audit chain, and carried by every
    // step after it — see newAuditAttemptId in client-analytics.
    const auditAttemptId = newAuditAttemptId()

    posthog.capture('audit_submitted', {
      audit_attempt_id: auditAttemptId,
      page_url: processedUrl,
      page_domain: new URL(processedUrl).hostname,
      referrer: referrer ?? null,
      audit_reason: reason.trim() || null,
    })

    try {
      const response = await fetch('/api/audit/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...analyticsHeaders() },
        body: JSON.stringify({
          url: processedUrl,
          referrer: referrer || undefined,
          audit_reason: reason.trim() || undefined,
          audit_attempt_id: auditAttemptId,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to start audit')
      }

      const data = await response.json()

      if (data.audit_id) {
        rememberAuditAttemptId(data.audit_id, auditAttemptId)
        router.push(`/audit/${data.audit_id}/processing`)
      } else {
        setError('Audit completed. Full integration coming soon.')
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      posthog.captureException(error)
      setError(error.message)
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
            Drop your landing page URL — see what's leaking
          </label>
          <input
            id="url"
            type="url"
            name="landing-page-url"
            autoComplete="url"
            required
            placeholder="https://yoursite.com/landing-page"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={loading}
            className="w-full rounded-lg border border-fg-muted/30 bg-bg px-4 py-3 text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none disabled:opacity-50"
          />
        </div>

        <div>
          <label htmlFor="reason" className="mb-2 block text-sm font-medium text-fg-muted">
            What made you run this audit today? <span className="text-fg-muted">(optional)</span>
          </label>
          <textarea
            id="reason"
            name="audit-reason"
            placeholder="e.g. ads aren't converting, launching next week, page feels off…"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            disabled={loading}
            rows={2}
            maxLength={300}
            className="w-full resize-none rounded-lg border border-fg-muted/30 bg-bg px-4 py-3 text-sm text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none disabled:opacity-50"
          />
        </div>

        <button
          type="submit"
          disabled={!url || loading}
          className="w-full rounded-xl bg-accent px-6 py-3 font-semibold text-bg transition-[color,background-color,transform] duration-[160ms] ease-out hover:bg-accent-light active:scale-[0.97] disabled:opacity-50"
        >
          {loading ? 'Starting audit…' : 'Find the Leak'}
        </button>

        <div className={`grid overflow-hidden transition-[grid-template-rows] duration-200 ease-out ${error ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
          <p
            className={`min-h-0 text-sm text-danger text-center transition-opacity duration-150 ease-out ${error ? 'opacity-100' : 'opacity-0'}`}
            role={error ? 'alert' : undefined}
          >
            {error}
          </p>
        </div>
      </form>
    </Card>
  )
}

export default function AuditForm() {
  return (
    <Suspense fallback={<div className="mb-8 h-48 animate-pulse rounded-lg bg-bg-muted/40" />}>
      <AuditFormContent />
    </Suspense>
  )
}
