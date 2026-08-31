import type { Metadata, Viewport } from 'next'
import { Suspense } from 'react'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import SiteNav from '@/components/SiteNav'
import SiteFooter from './components/SiteFooter'
import WebMCP from '@/components/WebMCP'
import GeoConsent from './components/GeoConsent'
import OgUrl from './components/OgUrl'
import AnalyticsRuntime from './components/AnalyticsRuntime'
import FunnelChrome from './components/FunnelChrome'
import './globals.css'
import { organizationSchema, websiteSchema } from './lib/schema'
import { brand } from './lib/brand'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: brand.metadata.themeColor,
  colorScheme: brand.metadata.colorScheme,
}

export const metadata: Metadata = {
  metadataBase: new URL('https://nebulacomponents.com'),
  title: {
    default: 'Find Failed Page Conditions on Your Landing Page | Nebula Components',
    template: '%s',
  },
  description: 'Free landing page audit that finds failed page conditions on public HTML. Evidence-backed, no signup, results in under 2 minutes.',
  alternates: {
    canonical: 'https://nebulacomponents.com/',
  },
  openGraph: {
    title: 'Find Failed Page Conditions on Your Landing Page | Nebula Components',
    description: 'Free landing page audit that finds failed page conditions on public HTML. Evidence-backed, no signup, results in under 2 minutes.',
    siteName: brand.name,
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: brand.assets.ogDefault,
        width: 1200,
        height: 630,
        alt: 'Nebula Components - inspect failed page conditions before spending more on ads',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Find Failed Page Conditions on Your Landing Page | Nebula Components',
    description: 'Free landing page audit that finds failed page conditions on public HTML. Evidence-backed, no signup, results in under 2 minutes.',
    creator: '@NebulaCRO',
    images: [brand.assets.ogDefault],
  },
  icons: {
    icon: [
      { url: brand.assets.faviconSvg, type: 'image/svg+xml' },
      { url: brand.assets.favicon32, sizes: '32x32', type: 'image/png' },
      { url: brand.assets.favicon16, sizes: '16x16', type: 'image/png' },
    ],
    shortcut: brand.assets.faviconSvg,
    apple: brand.assets.appleTouchIcon,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <head>
        {/* OG URL: isolated dynamic component so layout stays statically renderable */}
        <Suspense fallback={<meta property="og:url" content="https://nebulacomponents.com/" />}>
          <OgUrl />
        </Suspense>
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
        {/* Google Preferred Sources , lets readers follow Nebula in Google Search/AI Mode */}
        {/* https://developers.google.com/search/docs/appearance/preferred-sources */}
        <script async src="https://news.google.com/swg/js/v1/publisher.js" />
      </head>
      <body>
        <a href="#main-content" className="skip-link sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-accent focus:text-bg focus:rounded">
          Skip to main content
        </a>
        <SiteNav />
        <div className="nebula-document">
          {children}
          <SiteFooter />
        </div>
        {/* GeoConsent: isolated dynamic component - reads country from x-nebula-country header */}
        <Suspense fallback={null}>
          <GeoConsent />
        </Suspense>
        <Suspense fallback={null}><AnalyticsRuntime /></Suspense>
        <Suspense fallback={null}><FunnelChrome /></Suspense>
        <WebMCP />
      </body>
    </html>
  )
}
