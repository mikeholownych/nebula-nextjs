'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card } from '@/components/ui'
import posthog from '@/app/lib/posthog-browser'
import { analyticsHeaders, newAuditAttemptId, rememberAuditAttemptId } from '@/app/lib/client-analytics'
import { trackClientFunnelEvent, getOrCreateJourneyId } from '@/app/lib/client-funnel'
import VisibilityBeacon from '@/components/VisibilityBeacon'

function AuditFormContent() {
  const [url, setUrl] = useState('')
  const [reason, setReason] = useState('')
  const [monthlyAdSpend, setMonthlyAdSpend] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [referrer, setReferrer] = useState<string | null>(null)
  const [utmParams, setUtmParams] = useState<Record<string, string>>({})
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const source = searchParams.get('source')
    const from = searchParams.get('from')
    const attribution = source || (from ? decodeURIComponent(from) : null)
    if (attribution) setReferrer(attribution)
    const prefilled = searchParams.get('url')
    if (prefilled) setUrl(prefilled)

    // Capture and persist UTM params for attribution
    const utms: Record<string, string> = {}
    for (const k of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content']) {
      const v = searchParams.get(k)
      if (v) utms[k] = v
    }
    if (Object.keys(utms).length) setUtmParams(utms)

    trackClientFunnelEvent('landing_page_view', {
      landing_path: window.location.pathname,
      referrer_class: attribution || (document.referrer ? 'referral' : 'direct'),
      ...utms,
    })

    posthog.capture('audit_page_viewed', {
      referrer: attribution || undefined,
      prefilled: prefilled ? true : undefined,
      ...utms,
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
    // step after it - see newAuditAttemptId in client-analytics.
    const auditAttemptId = newAuditAttemptId()

    const journeyId = getOrCreateJourneyId()

    trackClientFunnelEvent('audit_url_submitted', {
      audit_attempt_id: auditAttemptId,
      journey_id: journeyId,
      page_domain: new URL(processedUrl).hostname,
      audit_reason_category: reason.trim() || 'none',
      has_spend_bracket: Boolean(monthlyAdSpend),
      referrer_class: referrer || 'direct',
      ...utmParams,
    }, { auditAttemptId })

    posthog.capture('audit_submitted', {
      audit_attempt_id: auditAttemptId,
      journey_id: journeyId,
      page_url: processedUrl,
      page_domain: new URL(processedUrl).hostname,
      referrer: referrer ?? null,
      audit_reason: reason.trim() || null,
      ...utmParams,
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
          journey_id: journeyId,
          monthly_ad_spend: monthlyAdSpend ? parseFloat(monthlyAdSpend) : undefined,
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
    <VisibilityBeacon
      beaconId="audit_form_cta"
      eventName="audit_cta_exposed"
      properties={{ cta_id: 'audit_form_submit', cta_location: 'audit_form_hero' }}
    >
      <Card variant="elevated" className="mb-8">
        {/* Referral welcome banner - only shown when ?from= is present */}
        {referrer && (
          <div className="mb-6 rounded-lg bg-accent/10 border border-accent/30 px-4 py-3 text-sm">
            <p className="font-semibold text-accent">
              {referrer} sent you here.
            </p>
            <p className="mt-0.5 text-fg-muted">
              Your free audit will name the exact leaks on your page - same report they got.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="url" className="mb-2 block text-sm font-semibold text-fg">
            Drop your landing page URL - see what's leaking
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
             What brought you here today? <span className="text-fg-muted">(optional)</span>
           </label>
           <div className="mb-3 flex flex-wrap gap-2" aria-label="Audit reason shortcuts">
             {[
               "Ads are getting clicks but no conversions",
               "Launching a new page soon",
               "The page looks fine but feels off",
             ].map((option) => (
               <button
                 key={option}
                 type="button"
                 onClick={() => {
                   setReason(option)
                   posthog.capture('audit_reason_selected', { reason: option })
                 }}
                 disabled={loading}
                 className={`rounded-full border px-3 py-1.5 text-left text-xs transition-colors ${
                   reason === option
                     ? 'border-accent bg-accent/10 text-accent'
                     : 'border-border text-fg-muted hover:border-accent hover:text-fg'
                 }`}
               >
                 {option}
               </button>
             ))}
           </div>
           <textarea
             id="reason"
             name="audit-reason"
             placeholder="Tell the audit what changed, or choose a shortcut above."
             value={reason}
             onChange={(e) => setReason(e.target.value)}
             disabled={loading}
             rows={2}
             maxLength={300}
             className="w-full resize-none rounded-lg border border-fg-muted/30 bg-bg px-4 py-3 text-sm text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none disabled:opacity-50"
           />
           <p className="mt-2 text-xs leading-5 text-fg-muted">
             This helps the report explain the finding in your context. It does not change the checks.
           </p>
         </div>

         <div>
           <label htmlFor="monthly-ad-spend" className="mb-2 block text-sm font-medium text-fg-muted">
             Monthly ad spend (USD) <span className="text-fg-muted">(optional)</span>
           </label>
           <input
             id="monthly-ad-spend"
             type="number"
             name="monthly-ad-spend"
             placeholder="e.g., 2000"
             value={monthlyAdSpend}
             onChange={(e) => setMonthlyAdSpend(e.target.value)}
             disabled={loading}
             min="0"
             className="w-full rounded-lg border border-fg-muted/30 bg-bg px-4 py-3 text-sm text-fg placeholder:text-fg-muted focus:border-accent focus:outline-none disabled:opacity-50"
           />
           <p className="mt-2 text-xs leading-5 text-fg-muted">
             Helps us provide more accurate estimates of potential revenue impact
           </p>
         </div>

        <button
          type="submit"
          disabled={!url || loading}
          className="w-full rounded bg-accent px-6 py-3 font-semibold text-bg transition-[color,background-color,transform] duration-[160ms] ease-out hover:opacity-85 hover:bg-accent active:scale-[0.97] disabled:opacity-50"
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

        <p className="text-center text-xs text-fg-muted pt-1">
          Want just the score?{' '}
          <a href="/score" className="text-accent hover:underline">See your conversion grade instantly →</a>
        </p>
      </form>
    </Card>
    </VisibilityBeacon>
  )
}

function AuditFormSkeleton() {
  return (
    <Card variant="elevated" className="mb-8 animate-pulse">
      <div className="space-y-4">
        {/* URL Field (~84px) */}
        <div>
          <div className="mb-2 h-5 w-64 rounded bg-border/60 max-w-full" />
          <div className="h-[50px] w-full rounded-lg bg-bg border border-fg-muted/20" />
        </div>
        {/* Reason Field (~240px) */}
        <div>
          <div className="mb-2 h-5 w-48 rounded bg-border/60 max-w-full" />
          <div className="mb-3 flex flex-wrap gap-2">
            <div className="h-[30px] w-64 rounded-full bg-border/30 max-w-full" />
            <div className="h-[30px] w-48 rounded-full bg-border/30 max-w-full" />
            <div className="h-[30px] w-56 rounded-full bg-border/30 max-w-full" />
          </div>
          <div className="h-[74px] w-full rounded-lg bg-bg border border-fg-muted/20" />
          <div className="mt-2 h-4 w-72 rounded bg-border/30 max-w-full" />
        </div>
        {/* Spend Field (~106px) */}
        <div>
          <div className="mb-2 h-5 w-44 rounded bg-border/60 max-w-full" />
          <div className="h-[46px] w-full rounded-lg bg-bg border border-fg-muted/20" />
          <div className="mt-2 h-4 w-80 rounded bg-border/30 max-w-full" />
        </div>
        {/* Submit Button (~52px) */}
        <div className="h-[52px] w-full rounded bg-accent/20" />
        {/* Score Link (~22px) */}
        <div className="pt-1 flex justify-center">
          <div className="h-4 w-52 rounded bg-border/30 max-w-full" />
        </div>
      </div>
    </Card>
  )
}

export default function AuditForm() {
  return (
    <Suspense fallback={<AuditFormSkeleton />}>
      <AuditFormContent />
    </Suspense>
  )
}
