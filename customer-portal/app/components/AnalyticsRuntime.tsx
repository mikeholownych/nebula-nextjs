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
    const pagePath = `${pathname}${search ? `?${search}` : ''}`
    const gaPageView = () => {
      window.gtag?.('event', 'page_view', {
        page_location: window.location.href,
        page_path: pagePath,
        page_title: document.title,
      })
    }
    const postHogPageView = () => {
      posthog.capture('$pageview', {
        $current_url: window.location.href,
        page_path: pagePath,
      })
    }
    const onConsent = () => {
      if (!hasAnalyticsConsent()) return
      persistAttribution()
      gaPageView()
      postHogPageView()
    }
    const onPostHogReady = () => {
      if (!hasAnalyticsConsent()) return
      postHogPageView()
    }

    onConsent()
    window.addEventListener('cookie-consent-update', onConsent)
    window.addEventListener('nebula-posthog-ready', onPostHogReady)
    return () => {
      window.removeEventListener('cookie-consent-update', onConsent)
      window.removeEventListener('nebula-posthog-ready', onPostHogReady)
    }
  }, [pathname, search])

  return null
}
