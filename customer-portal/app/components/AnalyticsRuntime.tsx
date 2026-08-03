'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import posthog from '@/app/lib/posthog-browser'
import { hasAnalyticsConsent, persistAttribution } from '@/app/lib/client-analytics'

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

export default function AnalyticsRuntime() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const search = searchParams.toString()

  useEffect(() => {
    persistAttribution()
    if (!hasAnalyticsConsent()) return
    const pagePath = `${pathname}${search ? `?${search}` : ''}`
    window.gtag?.('event', 'page_view', {
      page_location: window.location.href,
      page_path: pagePath,
      page_title: document.title,
    })
    posthog.capture('$pageview', {
      $current_url: window.location.href,
      page_path: pagePath,
    })
  }, [pathname, search])

  return null
}
