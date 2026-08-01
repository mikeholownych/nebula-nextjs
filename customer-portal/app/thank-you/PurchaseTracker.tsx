'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import posthog from '@/app/lib/posthog-browser'

export default function PurchaseTracker() {
  const searchParams = useSearchParams()

  useEffect(() => {
    posthog.capture('purchase_confirmed_viewed', {
      stripe_session_id: searchParams.get('session_id') ?? undefined,
      amount_usd: 97,
    })
  }, [searchParams])

  return null
}
