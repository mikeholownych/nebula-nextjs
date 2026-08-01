'use client'

// Lazy-loads CookieConsent client-side only. CookieConsent is non-critical:
// it only appears for first-time visitors and only when consent state is unknown.
// Moving it out of the critical bundle reduces unused JS on first paint.
import dynamic from 'next/dynamic'

const CookieConsent = dynamic(() => import('./CookieConsent'), { ssr: false })

export default function LazyCookieConsent() {
  return <CookieConsent />
}
