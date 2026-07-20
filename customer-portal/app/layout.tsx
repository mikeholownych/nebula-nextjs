import type { Metadata, Viewport } from 'next'
import { Karla } from 'next/font/google'
import Script from 'next/script'
import CookieConsent from './components/CookieConsent'
import SiteNav from '@/components/SiteNav'
import Footer from '@/components/Footer'
import WebMCP from '@/components/WebMCP'
import './globals.css'
import { organizationSchema, websiteSchema } from './lib/schema'

const karla = Karla({
  subsets: ['latin'],
  weight: ['400', '600', '800'],
  display: 'swap',
})

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
    canonical: 'https://nebulacomponents.shop',
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
    creator: '@nebulacomponents',
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* Agent discovery: llms.txt link tag for crawlers that don't read response headers */}
        <link rel="describedby" href="/llms.txt" type="text/plain" />
        {/* GA4 with Consent Mode v2 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments)};
              
              // Default consent to denied (GDPR/CCPA compliant)
              gtag('consent', 'default', {
                'analytics_storage': 'denied',
                'ad_storage': 'denied',
                'ad_user_data': 'denied',
                'ad_personalization': 'denied',
                'functionality_storage': 'granted',
                'security_storage': 'granted',
                'wait_for_update': 500
              });
              
              gtag('js', new Date());
              gtag('config', 'G-KJ9S3450LH', {
                'send_page_view': false
              });
            `
          }}
        />
        {/*
          lazyOnload: GTM's 166KB payload competes with hydration for main-thread
          time (measured ~440ms scripting via Lighthouse) for no benefit, since
          consent is denied by default until CookieConsent resolves — dataLayer.push
          queues calls fine until this arrives on browser idle.
        */}
        <Script
          id="gtag-src"
          src="https://www.googletagmanager.com/gtag/js?id=G-KJ9S3450LH"
          strategy="lazyOnload"
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
      <body className={karla.className}>
        <a href="#main-content" className="skip-link sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-emerald-500 focus:text-black focus:rounded">
          Skip to main content
        </a>
        <SiteNav />
        {children}
        <Footer />
        <CookieConsent />
        <WebMCP />
      </body>
    </html>
  )
}
