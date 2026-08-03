import type { Metadata } from 'next'
import Link from 'next/link'
import Benchmarks from './Benchmarks'

export const metadata: Metadata = {
  title: 'Landing Page Benchmarks — Real Audit Data | Nebula',
  description:
    'Per-component failure benchmarks from completed landing page audits. Empty states are shown until a verified dataset exists.',
}

export default function BenchmarksPage() {
  return (
    <main id="main-content" className="min-h-screen bg-bg">
      <section className="border-b border-border px-6 py-16">
        <div className="mx-auto max-w-6xl">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-accent">
            Evidence, not projections
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-fg md:text-5xl">
            Landing Page Benchmarks
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-fg-muted md:text-lg">
            This page reports component-level results from completed audits. It never substitutes
            estimates or placeholder averages; when the verified dataset is empty, the page says so.
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
