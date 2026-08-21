'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import Script from 'next/script'
import { usePathname } from 'next/navigation'

const HeyCatch = dynamic(() => import('./HeyCatch'), { ssr: false })
const ExitIntentPopup = dynamic(() => import('@/components/ExitIntentPopup'), { ssr: false })

function onFunnelPath(pathname: string): boolean {
  return pathname === '/' || pathname.startsWith('/audit')
}

function analyticsConsentGranted(): boolean {
  try {
    const raw = localStorage.getItem('nebula-cookie-consent')
    if (raw) {
      const state = JSON.parse(raw) as { version?: number; level?: string }
      if (state && typeof state.version === 'number' && state.version >= 1) {
        return state.level === 'all'
      }
    }
  } catch {
    // malformed consent is treated as not granted
  }
  return document.documentElement.getAttribute('data-analytics-default') === 'accepted'
}

export default function FunnelChrome() {
  const pathname = usePathname() || '/'
  const [consented, setConsented] = useState(false)

  useEffect(() => {
    const sync = () => setConsented(analyticsConsentGranted())
    sync()
    window.addEventListener('cookie-consent-update', sync)
    return () => window.removeEventListener('cookie-consent-update', sync)
  }, [])

  if (!onFunnelPath(pathname) || !consented) return null

  return (
    <>
      <HeyCatch />
      <ExitIntentPopup />
      <Script
        id="searchable-tracking-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `window.sa=window.sa||function(){(sa.q=sa.q||[]).push(arguments)}`,
        }}
      />
      <Script
        id="searchable-tracker"
        strategy="afterInteractive"
        src="https://searchable-tracker.searchable.workers.dev/s.js"
        data-domain="nebulacomponents.com"
        data-site-token="pst_14b9bc17bc3d1a0a51465b65"
      />
      <Script
        id="rb2b-visitor-pixel"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
              (function() {
                const WEBHOOK_URL = '/api/lead-gen/rb2b-event';
                const trackPageVisit = () => {
                  const pagePath = window.location.pathname;
                  let pageCategory = 'other';
                  if (pagePath.includes('/audit')) pageCategory = 'audit';
                  else if (pagePath.includes('/fix-pack') || pagePath.includes('/checkout')) pageCategory = 'fix-pack';
                  else if (pagePath.includes('/pricing')) pageCategory = 'pricing';

                  if (!window.rb2bPageVisits) window.rb2bPageVisits = [];
                  window.rb2bPageVisits.push(pageCategory);
                  window.rb2bSessionStart = window.rb2bSessionStart || Date.now();
                };

                const sendVisitorProfile = async () => {
                  // Honor-decline guard (D6): if consent was revoked after
                  // mount, never transmit the collected profile.
                  if (document.documentElement.getAttribute('data-analytics-default') !== 'accepted') return;
                  if (!window.rb2bPageVisits || window.rb2bPageVisits.length === 0) return;
                  const totalDwell = Math.round((Date.now() - (window.rb2bSessionStart || Date.now())) / 1000);
                  const pages = [...new Set(window.rb2bPageVisits)];
                  const payload = {
                    pages_visited: pages,
                    total_dwell_s: totalDwell,
                    last_visit: new Date().toISOString(),
                    utm_source: new URLSearchParams(window.location.search).get('utm_source') || 'organic',
                  };
                  try {
                    await fetch(WEBHOOK_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
                  } catch (err) {}
                };

                window.rb2bSessionStart = Date.now();
                if (document.readyState === 'complete') {
                  trackPageVisit();
                } else {
                  window.addEventListener('load', trackPageVisit);
                }
                window.addEventListener('beforeunload', sendVisitorProfile);
                setTimeout(sendVisitorProfile, 300000);
              })();
            `,
        }}
      />
    </>
  )
}
