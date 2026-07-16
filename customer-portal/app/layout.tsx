import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import CookieConsent from './components/CookieConsent'
import './globals.css'
import { organizationSchema, websiteSchema, speakableSchema, auditServiceSchema, faqSchema } from './lib/schema'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Nebula Components',
  description: 'AI-powered landing page optimization and conversion services',
  alternates: {
    canonical: 'https://nebulacomponents.shop',
  },
  openGraph: {
    title: 'Nebula Components — Free Landing Page Audit',
    description: 'Find the leak in your landing page in 60 seconds. Free audit, no signup required.',
    url: 'https://nebulacomponents.shop',
    siteName: 'Nebula Components',
    images: [
      {
        url: 'https://nebulacomponents.shop/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Nebula Components — Stop Burning Cash on Broken Landing Pages',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nebula Components — Free Landing Page Audit',
    description: 'Find the leak in your landing page in 60 seconds. Free audit, no signup required.',
    images: ['https://nebulacomponents.shop/og-image.png'],
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
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-KJ9S3450LH" />
        <script
          dangerouslySetInnerHTML={{
            __html:
              "window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','G-KJ9S3450LH')"
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(speakableSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(auditServiceSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
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
