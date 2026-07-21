import type { Metadata } from 'next'
import Link from 'next/link'
import { createArticleSchema } from '../../lib/schema'

export const metadata: Metadata = {
  title: 'Landing Page Not Converting Paid Traffic: Start Here | Nebula Components',
  description: 'A landing page that does not convert paid traffic has at least one of five diagnosable leak patterns. Here is how to find yours.',
  alternates: { canonical: 'https://nebulacomponents.shop/learning-centre/landing-page-not-converting' },
}

const articleSchema = createArticleSchema({
  headline: 'Landing Page Not Converting Paid Traffic: Start Here',
  description: 'A landing page that does not convert paid traffic has at least one of five diagnosable leak patterns. Here is how to find yours.',
  url: 'https://nebulacomponents.shop/learning-centre/landing-page-not-converting',
  publishedDate: '2025-07-15',
  modifiedDate: '2026-07-19',
})

export default function LearningCentrePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <main id="main-content" className="min-h-screen bg-bg pt-[72px]">
        <div className="mx-auto max-w-3xl px-6 py-14">
          <Link href="/learning-centre" className="text-sm font-semibold text-accent hover:text-accent-light transition-colors">
            ← Learning Centre
          </Link>

          <div className="mt-8 rounded-2xl border border-border bg-bg-panel p-8 md:p-10">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-accent">
              Landing Page Leaks · landing page not converting
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-fg md:text-5xl">
              Landing Page Not Converting? Diagnose These 5 Leaks First
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-fg-muted">
              A non-converting landing page is usually not one problem. It is a sequence break: unclear promise, weak proof, CTA friction, mobile drag, or unanswered objections.
            </p>
          </div>

          <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
            <h2 className="mb-4 text-2xl font-bold text-fg">Quick diagnosis</h2>
            <p className="leading-relaxed text-fg-muted">
              A non-converting landing page is usually not one problem. It is a sequence break: unclear promise, weak proof, CTA friction, mobile drag, or unanswered objections.
            </p>
          </section>

          <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
            <h2 className="mb-4 text-2xl font-bold text-fg">Checklist</h2>
            <ul className="space-y-2 text-fg-muted">
              <li className="flex items-start gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                Can a stranger explain the offer in 5 seconds?
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                Is the page built for one audience?
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                Does the CTA match buyer readiness?
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                Is the strongest proof above the fold?
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                Are objections handled before the final ask?
              </li>
            </ul>
          </section>

          <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
            <h2 className="mb-4 text-2xl font-bold text-fg">Example</h2>
            <p className="leading-relaxed text-fg-muted">
              Changing button color will not fix a page where nobody knows what is being sold or why it matters now.
            </p>
          </section>

          <section className="mt-6 rounded-2xl border border-accent/40 bg-bg-panel p-8">
            <h2 className="mb-4 text-2xl font-bold text-fg">Find the leak on your page</h2>
            <p className="mb-6 leading-relaxed text-fg-muted">
              Run the free Nebula audit first. Buy the $97 Fix Pack only when the leak is obvious.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/audit" className="inline-flex rounded-xl bg-accent px-6 py-3 font-semibold text-bg hover:bg-accent-light transition-colors">
                Run the free audit
              </Link>
              <Link href="/learning-centre/paid-traffic-leak-map" className="inline-flex rounded-xl border border-accent px-6 py-3 font-semibold text-accent hover:bg-accent-dim transition-colors">
                Open leak map
              </Link>
            </div>
          </section>

          <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
            <h2 className="mb-4 text-2xl font-bold text-fg">Related leak checks</h2>
            <div className="space-y-1">
              <Link href="/learning-centre/google-ads-clicks-no-sales" className="block border-b border-border py-2.5 text-fg-muted transition-colors last:border-0 hover:text-accent">
                Google Ads Clicks But No Sales: Check The Page Before Budget
              </Link>
              <Link href="/learning-centre/facebook-ads-no-leads" className="block border-b border-border py-2.5 text-fg-muted transition-colors last:border-0 hover:text-accent">
                Facebook Ads Getting Clicks But No Leads
              </Link>
              <Link href="/learning-centre/high-cpc-low-conversion" className="block border-b border-border py-2.5 text-fg-muted transition-colors last:border-0 hover:text-accent">
                High CPC, Low Conversion: Stop Optimizing The Wrong Layer
              </Link>
              <Link href="/learning-centre/traffic-but-no-form-fills" className="block border-b border-border py-2.5 text-fg-muted transition-colors last:border-0 hover:text-accent">
                Traffic But No Form Fills: The Form Is Usually Not The First Leak
              </Link>
            </div>
          </section>
        </div>
      </main>
    </>
  )
}
