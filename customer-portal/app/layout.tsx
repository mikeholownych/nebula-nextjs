import type { Metadata, Viewport } from 'next'
import { headers } from 'next/headers'
import SiteNav from '@/components/SiteNav'
import Footer from '@/components/Footer'
import WebMCP from '@/components/WebMCP'
import LazyCookieConsent from './components/LazyCookieConsent'
import './globals.css'
import { organizationSchema, websiteSchema } from './lib/schema'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export const metadata: Metadata = {
  metadataBase: new URL('https://nebulacomponents.shop'),
  title: {
    default: 'Nebula Components — Landing Page Conversion Optimization',
    template: '%s',
  },
  description: 'Evidence-backed landing page conversion diagnosis and implementation for founders spending on paid ads with low or zero conversions.',
  alternates: {
    canonical: 'https://nebulacomponents.shop/',
  },
  openGraph: {
    title: 'Nebula Components — Landing Page Conversion Optimization',
    description: 'Evidence-backed landing page conversion diagnosis and implementation for founders spending on paid ads with low or zero conversions.',
    url: 'https://nebulacomponents.shop',
    siteName: 'Nebula Components',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nebula Components — Landing Page Conversion Optimization',
    description: 'Evidence-backed landing page conversion diagnosis and implementation for founders spending on paid ads with low or zero conversions.',
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
        {/* Agent discovery: llms.txt link tag for crawlers that don't read response headers */}
        <link rel="describedby" href="/llms.txt" type="text/plain" />
        {/* DNS prefetch for Cloudflare Web Analytics beacon — CF injects beacon.min.js
            at the edge; dns-prefetch speeds up its connection so it resolves sooner
            and doesn't extend the critical network chain as long. */}
        <link rel="dns-prefetch" href="//static.cloudflareinsights.com" />
        {/*
          Runs before <body> paints so returning visitors who already
          consented (localStorage) never see the cookie banner flash in —
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
        <WebMCP />
      </body>
    </html>
  )
}
