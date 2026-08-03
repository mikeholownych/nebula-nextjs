'use client'

import { useState } from 'react'
import posthog from '@/app/lib/posthog-browser'
import { analyticsHeaders } from '@/app/lib/client-analytics'

interface Props {
  auditId: string
  endpoint: '/api/checkout'
  offerKey: string
}

const isStripeCheckoutUrl = (value: unknown): value is string => {
  if (typeof value !== 'string') return false
  try {
    const url = new URL(value)
    return (
      url.protocol === 'https:' &&
      url.hostname === 'checkout.stripe.com' &&
      url.port === '' &&
      url.username === '' &&
      url.password === ''
    )
  } catch {
    return false
  }
}

export default function CheckoutCTAButton({ auditId, endpoint, offerKey }: Props) {
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string>()

  const handleClick = async () => {
    if (submitting) return
    setSubmitting(true)
    setError(undefined)
    try {
      posthog.capture('checkout_initiated', {
        offer: offerKey,
        destination: endpoint,
      })
    } catch {
      // Checkout must not depend on client analytics.
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...analyticsHeaders() },
        body: JSON.stringify({ auditId, offerKey }),
      })
      const result: unknown = await response.json()
      const url = (
        typeof result === 'object' &&
        result !== null &&
        'url' in result
      ) ? result.url : undefined

      if (!response.ok || !isStripeCheckoutUrl(url)) {
        throw new Error('Checkout unavailable')
      }
      window.location.assign(url)
    } catch {
      setError('Secure checkout is unavailable right now. Please try again.')
      setSubmitting(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={submitting}
        className="block w-full rounded-2xl bg-accent px-8 py-4 text-center text-lg font-semibold text-bg transition-colors hover:bg-accent-light disabled:cursor-wait disabled:opacity-70"
      >
        {submitting ? 'Opening Secure Checkout…' : 'Continue to Secure Stripe Checkout'}
      </button>
      {error && (
        <p role="alert" className="mt-3 text-center text-sm text-red-700">
          {error}
        </p>
      )}
    </>
  )
}
