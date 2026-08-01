import type { Metadata } from 'next'
import Link from 'next/link'
import Benchmarks from './Benchmarks'

export const metadata: Metadata = {
  title: 'Landing Page Benchmarks — Real Audit Data | Nebula',
  description:
    'Per-component failure benchmarks from real landing page audits: above-fold clarity, ad signals, SEO foundations, CTA, load speed, social proof, and more. Updated from actual audits, not projections.',
}

export default function BenchmarksPage() {
  return (
    <main className="min-h-screen bg-bg">
      <section className="border-b border-border px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-accent">
            Evidence, not projections
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-fg md:text-5xl">
            Landing Page Benchmarks
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-fg-muted md:text-lg">
            How often each conversion component fails across real audits we have run — and how
            much impact that failure typically carries. This page is generated from actual audit
            findings. Every teardown we publish adds to it.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/audit"
              className="rounded-xl bg-accent px-7 py-3.5 font-semibold text-bg hover:bg-accent-light focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg transition-colors text-base"
            >
              Audit Your Page
            </Link>
            <Link href="/teardowns" className="text-sm text-fg-muted hover:text-fg transition-colors">
              See Full Teardowns &rarr;
            </Link>
          </div>
        </div>
      </section>
      <Benchmarks />
    </main>
  )
}
