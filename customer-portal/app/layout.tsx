import type { Metadata, Viewport } from 'next'
import { headers } from 'next/headers'
import { Suspense } from 'react'
import SiteNav from '@/components/SiteNav'
import Footer from '@/components/Footer'
import WebMCP from '@/components/WebMCP'
import LazyCookieConsent from './components/LazyCookieConsent'
import AnalyticsRuntime from './components/AnalyticsRuntime'
import ExitIntentPopup from '@/components/ExitIntentPopup'
import './globals.css'
import { organizationSchema, websiteSchema } from './lib/schema'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  metadataBase: new URL('https://nebulacomponents.com'),
  title: {
    default: 'Nebula Components - Landing Page Conversion Optimization',
    template: '%s',
  },
  description: 'Landing page conversion leak detection for founders spending on paid ads with zero conversions. Free evidence-backed audit - find the specific leaks costing you money.',
  alternates: {
    canonical: 'https://nebulacomponents.com/',
  },
  openGraph: {
    title: 'Nebula Components - Landing Page Conversion Optimization',
    description: 'Landing page conversion leak detection for founders spending on paid ads with zero conversions. Free evidence-backed audit - find the specific leaks costing you money.',
    siteName: 'Nebula Components',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nebula Components - Landing Page Conversion Optimization',
    description: 'Landing page conversion leak detection for founders spending on paid ads with zero conversions. Free evidence-backed audit - find the specific leaks costing you money.',
    creator: '@NebulaCRO',
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    shortcut: '/favicon.svg',
    apple: '/favicon.png',
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const requestHeaders = await headers()
  const country = (
    requestHeaders.get('cf-ipcountry') ||
    requestHeaders.get('x-vercel-ip-country') ||
    requestHeaders.get('x-country-code') ||
    ''
  ).toUpperCase() || null
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Keep Open Graph URL aligned with the requested canonical path. The
            root metadata cannot infer child routes, so the proxy supplies the
            original pathname for this request. */}
        <meta
          property="og:url"
          content={`https://nebulacomponents.com${requestHeaders.get('x-nebula-pathname') || '/'}`}
        />
        {/* Supply a complete image set even when child metadata overrides the
            root Open Graph object. */}
        <meta property="og:image" content="https://nebulacomponents.com/opengraph-image" />
        <meta property="og:image:type" content="image/png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Nebula Components - diagnose landing-page conversion leaks before they burn more ad spend" />
        {/* Agent discovery: llms.txt link tag for crawlers that don't read response headers */}
        <link rel="describedby" href="/llms.txt" type="text/plain" />

        {/*
          Runs before <body> paints so returning visitors who already
          consented (localStorage) never see the cookie banner flash in -
          globals.css hides #cookie-consent-banner on this attribute.
          CONSENT_VERSION (1) must stay in sync with
          app/components/CookieConsent.tsx's CONSENT_VERSION constant.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var raw = localStorage.getItem('nebula-cookie-consent');
                  if (!raw) return;
                  var state = JSON.parse(raw);
                  if (state && state.version >= 1 && (state.level === 'all' || state.level === 'necessary')) {
                    document.documentElement.setAttribute('data-cookie-consent', 'given');
                  }
                } catch (e) {}
              })();
            `
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>
      <body>
        <a href="#main-content" className="skip-link sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-emerald-500 focus:text-black focus:rounded">
          Skip to main content
        </a>
        <SiteNav />
        {children}
        <Footer />
        <LazyCookieConsent country={country} />
        <Suspense fallback={null}><AnalyticsRuntime /></Suspense>
        <ExitIntentPopup />
        <WebMCP />

        {/* RB2B Visitor Identification Pixel (lead gen Stage 2) */}
        <script
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
                window.addEventListener('load', trackPageVisit);
                window.addEventListener('beforeunload', sendVisitorProfile);
                setTimeout(sendVisitorProfile, 300000);
              })();
            `
          }}
        />
      </body>
    </html>
  )
}
