import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'About Nebula Components — Evidence-Backed Conversion Optimization',
  description:
    'Nebula Components diagnoses landing page conversion failures for founders running paid ads. We identify message-match gaps, trust signal problems, and CTA friction — then fix them.',
  alternates: {
    canonical: 'https://nebulacomponents.shop/about',
  },
}

export default function AboutPage() {
  return (
    <main id="main-content" className="min-h-screen bg-bg text-fg">
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="mb-6 text-4xl font-bold">About Nebula Components</h1>
        <p className="mb-6 text-lg leading-relaxed text-fg-muted">
          Nebula Components provides evidence-backed landing page conversion diagnosis and bounded implementation work for founders running paid traffic.
        </p>

        <section className="mb-10 rounded-2xl border border-border bg-bg-panel p-6">
          <h2 className="mb-3 text-2xl font-bold text-accent">What we do</h2>
          <p className="mb-4 text-fg-muted">
            We run a structured audit against your landing page — checking message-match, trust signals, mobile layout, form friction, load time, and compliance — and deliver a prioritised fix list with specific instructions. If you want implementation, we do that too, at a flat rate, with no retainer required.
          </p>
          <p className="text-fg-muted">
            Everything we publish starts from a documented case. If a claim appears on this site, there is a recorded outcome behind it.
          </p>
        </section>

        <section className="mb-10 rounded-2xl border border-border bg-bg-panel p-6">
          <h2 className="mb-3 text-2xl font-bold text-accent">Who we work with</h2>
          <p className="mb-4 text-fg-muted">
            Founders and operators who are actively spending on paid ads — Google, Meta, LinkedIn — and not seeing the conversions the click-through rate should produce. The problem is almost always on the landing page, not the ad.
          </p>
          <ul className="space-y-2 text-fg-muted">
            {[
              'Ecommerce brands with strong CTR and weak checkout conversion',
              'B2B SaaS companies with high demo-request bounce rates',
              'Coaches and consultants with zero form fills from paid campaigns',
              'Agencies managing client accounts with disapproval and quality score problems',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-10 rounded-2xl border border-border bg-bg-panel p-6">
          <h2 className="mb-3 text-2xl font-bold text-accent">Current audit status</h2>
          <p className="text-fg-muted">
            Automated URL submission and scoring are paused while the audit engine is rebuilt and independently verified. No automated score is issued during this period.
          </p>
          <Link href="/audit" className="mt-4 inline-block font-semibold text-accent hover:underline">
            View audit status →
          </Link>
        </section>

        <section className="mb-10 rounded-2xl border border-border bg-bg-panel p-6">
          <h2 className="mb-3 text-2xl font-bold text-accent">Contact</h2>
          <p className="text-fg-muted">
            Email is a reliable way to reach us. Response time is typically within one business day.
          </p>
          <p className="mt-3 text-accent">{'hello\u0040nebulacomponents.shop'}</p>
        </section>

        <div className="flex gap-4">
          <Link href="/audit" className="inline-block rounded-xl bg-accent px-6 py-3 font-semibold text-bg hover:opacity-90 transition-opacity">
            Run Free Audit
          </Link>
          <Link href="/learning-centre" className="inline-block rounded-xl border border-border px-6 py-3 font-semibold text-fg hover:border-accent transition-colors">
            Learning Centre
          </Link>
        </div>
      </div>
    </main>
  )
}
