import type { Metadata } from 'next'
import Link from 'next/link'
import CompareAuditClient from './CompareAuditClient'
import { createHowToSchema } from '@/app/lib/schema'

export const metadata: Metadata = {
  title: 'Competitor Landing Page Audit: Side-by-Side Conversion Teardown | Nebula',
  description: 'Compare your landing page against any competitor side-by-side. Evaluates 9 conversion signals, ad message match, speed, and AI search citability.',
  alternates: { canonical: 'https://nebulacomponents.com/audit/compare' },
  openGraph: {
    title: 'Competitor Landing Page Audit: Side-by-Side Conversion Teardown | Nebula',
    description: 'Compare your landing page against any competitor side-by-side. Evaluates 9 conversion signals, ad message match, speed, and AI search citability.',
    url: 'https://nebulacomponents.com/audit/compare',
    siteName: 'Nebula Components',
    locale: 'en_US',
    type: 'website',
  },
}

const howToSchema = createHowToSchema({
  name: 'How to compare two landing pages side-by-side for conversion leaks',
  description: 'Use Nebula to run a deterministic 9-signal comparison between your landing page and a competitor.',
  steps: [
    {
      name: 'Enter your landing page URL',
      text: 'Paste the public URL of your primary landing page or ad destination.',
    },
    {
      name: 'Enter the competitor URL',
      text: 'Paste the public URL of the competitor you want to benchmark against.',
    },
    {
      name: 'Review the side-by-side score breakdown',
      text: 'Inspect the 9 conversion signals to see where your page wins and where you have conversion leaks.',
    },
  ],
})

export default function CompareAuditPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />

      <main id="main-content" className="min-h-screen bg-bg pt-24 pb-24">
        <div className="mx-auto max-w-5xl px-6 py-12">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-8">
            <ol className="flex items-center gap-2 text-sm text-fg-muted">
              <li><Link href="/" className="hover:text-fg">Home</Link></li>
              <li aria-hidden="true">/</li>
              <li><Link href="/audit" className="hover:text-fg">Audit</Link></li>
              <li aria-hidden="true">/</li>
              <li className="text-fg" aria-current="page">Competitor Comparison</li>
            </ol>
          </nav>

          <header className="mb-12">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              Head-to-Head Teardown
            </p>
            <h1 className="text-3xl font-extrabold tracking-tight text-fg md:text-5xl">
              Compare Your Landing Page Against Any Competitor
            </h1>
            <p className="mt-4 max-w-3xl text-lg leading-relaxed text-fg-muted">
              Scan two public URLs side-by-side across 9 conversion signals. See exactly where your page has the advantage, where you are leaking paid clicks, and how both pages score for AI search citability.
            </p>
          </header>

          <CompareAuditClient />
        </div>
      </main>
    </>
  )
}
