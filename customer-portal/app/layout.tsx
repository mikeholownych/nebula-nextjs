import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import CookieConsent from './components/CookieConsent'
import './globals.css'
import { organizationSchema, websiteSchema } from './lib/schema'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://nebulacomponents.shop'),
  title: 'Nebula Components',
  description: 'Evidence-backed landing-page conversion guidance and implementation services',
  alternates: {
    canonical: 'https://nebulacomponents.shop',
  },
  openGraph: {
    title: 'Nebula Components — Audit Engine Rebuild',
    description: 'Landing-page audit scoring is paused while the evidence-backed engine is rebuilt.',
    url: 'https://nebulacomponents.shop',
    siteName: 'Nebula Components',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nebula Components — Audit Engine Rebuild',
    description: 'Landing-page audit scoring is paused while the evidence-backed engine is rebuilt.',
    creator: '@nebulacomponents',
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
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-KJ9S3450LH" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>
      <body className={inter.className}>
        <a href="#main-content" className="skip-link sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-emerald-500 focus:text-black focus:rounded">
          Skip to main content
        </a>
        {children}
        <CookieConsent />
      </body>
    </html>
  )
}
