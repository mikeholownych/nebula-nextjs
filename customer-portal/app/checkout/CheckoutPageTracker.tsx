'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import posthog from '@/app/lib/posthog-browser'

export default function CheckoutPageTracker() {
  const searchParams = useSearchParams()

  useEffect(() => {
    posthog.capture('checkout_page_viewed', {
      audit_id: searchParams.get('audit_id') ?? undefined,
    })
  }, [searchParams])

  return null
}
