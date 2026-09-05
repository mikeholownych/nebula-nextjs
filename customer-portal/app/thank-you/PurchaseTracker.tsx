'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import posthog from '@/app/lib/posthog-browser'

export default function PurchaseTracker() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')

  useEffect(() => {
    posthog.capture('purchase_confirmed_viewed', {
      stripe_session_id: sessionId ?? undefined,
      amount_usd: 97,
    })

    if (!sessionId) return
    try {
      window.opinly?.track('purchase', {
        value: 97,
        currency: 'USD',
      }, {
        externalEventId: sessionId,
      })
    } catch {
      // Confirmation rendering must not depend on analytics delivery.
    }
  }, [sessionId])

  return null
}
