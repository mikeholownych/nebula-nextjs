import type { Metadata } from 'next'
import Link from 'next/link'

import { createArticleSchema } from '../../lib/schema'

export const metadata: Metadata = {
  title: 'Paid Traffic Leak Map: Where Your Ad Budget Disappears | Nebula Components',
  description:
    'A diagnostic map of every stage where paid traffic leaks before converting. Identify which leak is bleeding your ad budget and get the fix.',
  alternates: {
    canonical: 'https://nebulacomponents.shop/learning-centre/paid-traffic-leak-map',
  },
}

const articleSchema = createArticleSchema({
  headline: 'Paid Traffic Leak Map: Where Your Ad Budget Disappears',
  description: 'A diagnostic map of every stage where paid traffic leaks before converting. Identify which leak is bleeding your ad budget and get the fix.',
  url: 'https://nebulacomponents.shop/learning-centre/paid-traffic-leak-map',
  publishedDate: '2025-07-15',
  modifiedDate: '2026-07-19',
})

const LEAKS = [
  {
    stage: 'Ad → Landing Page',
    title: 'Message-Match Break',
    description:
      'The ad promises one thing; the landing page says something different. The visitor feels deceived and leaves within 3 seconds.',
    signal: 'High CTR, high bounce rate',
    fix: 'Mirror the exact headline from your top ad on the landing page H1.',
  },
  {
    stage: 'Landing Page Load',
    title: 'Slow Page Load',
    description:
      'Every second of load time costs conversions. Pages over 3 seconds on mobile lose a substantial portion of paid visitors before they even see the offer.',
    signal: 'Normal CTR, very high exit rate',
    fix: 'Compress images, defer non-critical scripts, remove unused third-party tools.',
  },
  {
    stage: 'Above Fold',
    title: 'No Proof Before the CTA',
    description:
      'Asking for money, an email, or a phone number before establishing credibility is the single most common landing page leak.',
    signal: 'Good page engagement, low form starts',
    fix: 'Add testimonials or outcome proof above the primary CTA.',
  },
  {
    stage: 'Form / Checkout',
    title: 'High-Friction Form',
    description:
      'Every extra field reduces conversions. Phone number, company size, and job title fields all create friction that costs leads.',
    signal: 'Form views but low submissions',
    fix: 'Cut optional fields. Collect only what is required to start the conversation.',
  },
  {
    stage: 'Mobile Layout',
    title: 'Mobile Friction',
    description:
      'Over 60% of paid traffic arrives on mobile. Broken layouts, oversized images, and obscured CTAs silently filter out the majority of your audience.',
    signal: 'Desktop converts; mobile does not',
    fix: 'Test the page on a real phone. Fix any layout overflow, test tap targets, confirm CTA is visible without scrolling.',
  },
  {
    stage: 'Trust Signals',
    title: 'Missing Compliance & Trust',
    description:
      'Google and Meta evaluate trust signals on your landing page when reviewing ads. Missing privacy policy, physical address, or refund policy can trigger disapprovals.',
    signal: 'Ad disapprovals, low Quality Score',
    fix: 'Add footer with address, email, privacy policy link, and refund/cancellation terms.',
  },
]

export default function PaidTrafficLeakMapPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <main id="main-content" role="main" className="min-h-screen bg-bg pt-[72px]">

      <nav aria-label="Breadcrumb" className="mx-auto max-w-4xl px-6 pt-6">
        <ol className="flex items-center gap-2 text-sm text-fg-muted">
          <li><Link href="/" className="hover:text-fg">Home</Link></li>
          <li aria-hidden="true">/</li>
          <li><Link href="/learning-centre" className="hover:text-fg">Learning Centre</Link></li>
          <li aria-hidden="true">/</li>
          <li className="text-fg" aria-current="page">Paid Traffic Leak Map</li>
        </ol>
      </nav>

      <article className="mx-auto max-w-4xl px-6 py-12">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-accent">Diagnostic Framework</p>
        <h1 className="text-4xl font-bold tracking-tight text-fg md:text-5xl">
          Paid Traffic Leak Map
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-fg-muted">
          Every dollar you spend on ads passes through a series of stages before it either converts or leaks. This map shows you where to look first based on the signals you are seeing.
        </p>

        <section className="mt-12 space-y-6">
          {LEAKS.map((leak, i) => (
            <div key={i} className="rounded-xl border border-border bg-bg-muted/30 p-6">
              <div className="mb-3 flex items-center gap-3">
                <span className="rounded-full border border-accent/30 px-3 py-1 text-xs font-semibold text-accent">{leak.stage}</span>
              </div>
              <h2 className="mb-2 text-xl font-bold text-fg">{leak.title}</h2>
              <p className="mb-4 text-fg-muted leading-relaxed">{leak.description}</p>
              <dl className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-lg bg-bg p-3">
                  <dt className="mb-1 text-xs font-semibold uppercase tracking-wider text-fg-muted">Signal</dt>
                  <dd className="text-sm text-fg">{leak.signal}</dd>
                </div>
                <div className="rounded-lg bg-bg p-3 border border-accent/20">
                  <dt className="mb-1 text-xs font-semibold uppercase tracking-wider text-accent">Fix</dt>
                  <dd className="text-sm text-fg">{leak.fix}</dd>
                </div>
              </dl>
            </div>
          ))}
        </section>

        <section className="mt-16 rounded-xl border border-accent/30 bg-accent/5 p-8 text-center">
          <h2 className="text-2xl font-bold text-fg">Find Your Specific Leak</h2>
          <p className="mt-4 max-w-xl mx-auto text-fg-muted">
            The free audit checks your landing page URL against these leak patterns automatically and returns a specific diagnosis.
          </p>
          <Link
            href="/audit"
            className="mt-6 inline-block rounded-xl bg-accent px-8 py-4 font-semibold text-bg hover:bg-accent-light transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            Run Free Audit →
          </Link>
        </section>

        <div className="mt-8">
          <Link href="/learning-centre" className="text-sm text-fg-muted hover:text-fg">← Learning Centre</Link>
        </div>
      </article>


    </main>
    </>
  )
}
