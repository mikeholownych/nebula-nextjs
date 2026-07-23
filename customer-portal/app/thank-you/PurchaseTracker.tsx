'use client'

import { useEffect } from 'react'
import posthog from 'posthog-js'

export default function PurchaseTracker() {
  useEffect(() => {
    posthog.capture('purchase_confirmed_viewed')
  }, [])

  return null
}
