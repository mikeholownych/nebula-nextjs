import type { Metadata } from 'next'
import Link from 'next/link'
import CategoryAccordion from './CategoryAccordion'
import { getArticles } from './lib/getArticles'

export const metadata: Metadata = {
  title: 'Learning Centre — Fix Landing Page Conversion Leaks | Nebula Components',
  description: "Free conversion guides for founders burning ad spend on pages that don't convert. Diagnose Google, Meta, TikTok, and LinkedIn ad leaks. Start with the free audit.",
  alternates: { canonical: 'https://nebulacomponents.shop/learning-centre' },
}

export default function LearningCentreIndex() {
  const articles = getArticles()

  const categoryOrder = [
    'Landing Page Leaks',
    'Google Ads Leaks',
    'Meta Ads Leaks',
    'TikTok Ads Leaks',
    'LinkedIn Ads Leaks',
    'Paid Traffic Economics',
    'Budget Leaks',
    'Conversion Copy',
    'Message Match',
    'Trust Leaks',
    'Form Leaks',
    'Mobile Leaks',
    'Industry Specific',
  ]

  const categories: Record<string, typeof articles> = Object.fromEntries(categoryOrder.map(c => [c, []]))
  articles.forEach(a => { if (categories[a.category]) categories[a.category].push(a) })

  return (
    <main id="main-content" className="min-h-screen bg-bg pt-[72px]">
      {/* Hero */}
      <section className="border-b border-border px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-accent">
            Nebula Learning Centre
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-fg md:text-6xl">
            Fix the page, not the ad
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-fg-muted">
            Free conversion guides for founders getting clicks but no sales. Start with the leak map. Implement only when the leak is obvious.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              href="/audit"
              className="inline-flex rounded-xl bg-accent px-6 py-3 font-semibold text-bg hover:bg-accent-light transition-colors"
            >
              Run the free audit
            </Link>
            <Link
              href="/learning-centre/paid-traffic-leak-map"
              className="inline-flex rounded-xl border border-accent px-6 py-3 font-semibold text-accent hover:bg-accent/5 transition-colors"
            >
              Open leak map
            </Link>
          </div>
        </div>
      </section>

      {/* Category nav */}
      <section className="border-b border-border px-6 py-6">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-wrap gap-2">
            {categoryOrder.map(cat => (
              <a
                key={cat}
                href={`#${cat.toLowerCase().replace(/\s+/g, '-')}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs font-semibold text-fg-muted transition-colors hover:border-accent hover:text-accent"
              >
                {cat}
                <span className="text-accent">{categories[cat]?.length ?? 0}</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Articles by category */}
      <section className="px-6 py-14">
        <CategoryAccordion categoryOrder={categoryOrder} categories={categories} />
      </section>

      {/* Bottom CTA */}
      <section className="border-t border-border px-6 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl font-bold text-fg">Know which leak to fix. Then fix it.</h2>
          <p className="mt-4 text-fg-muted">
            The free audit checks your landing page URL against these leak patterns automatically. Takes 60 seconds.
          </p>
          <Link
            href="/audit"
            className="mt-8 inline-flex rounded-xl bg-accent px-8 py-4 font-semibold text-bg hover:bg-accent-light transition-colors"
          >
            Run the free audit →
          </Link>
        </div>
      </section>
    </main>
  )
}
