'use client'

import { useEffect } from 'react'
import posthog from '@/app/lib/posthog-browser'

export default function PurchaseTracker() {
  useEffect(() => {
    posthog.capture('purchase_confirmed_viewed')
  }, [])

  return null
}
