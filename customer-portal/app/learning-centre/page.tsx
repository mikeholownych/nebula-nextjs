import type { Metadata } from 'next'
import CategoryAccordion from './CategoryAccordion'
import { getArticles } from './lib/getArticles'
import { createCollectionPageSchema } from '@/app/lib/schema'

export const metadata: Metadata = {
  title: 'Learning Centre - Landing Page Conversion Leaks | Nebula',
  description: "Free conversion guides for founders burning ad spend on pages that don't convert. Diagnose Google, Meta, TikTok, and LinkedIn ad leaks. Start with the free...",
  alternates: { canonical: 'https://nebulacomponents.com/learning-centre' },
}

export default function LearningCentreIndex() {
  const articles = getArticles()

  const collectionSchema = createCollectionPageSchema({
    name: 'Learning Centre - Landing Page Conversion Leaks',
    description: "Free conversion guides for founders burning ad spend on pages that don't convert.",
    url: 'https://nebulacomponents.com/learning-centre',
    items: articles.map((a) => ({
      name: a.title,
      url: `https://nebulacomponents.com/learning-centre/${a.slug}`,
    })),
  })

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
    'Conversion Systems',
  ]

  const categories: Record<string, typeof articles> = Object.fromEntries(categoryOrder.map(c => [c, []]))
  articles.forEach(a => { if (categories[a.category]) categories[a.category].push(a) })

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      <main id="main-content" className="min-h-screen bg-bg pt-24">
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
            <a
              href="/audit"
              className="inline-flex rounded-xl bg-accent px-6 py-3 font-semibold text-bg hover:bg-accent-light transition-colors"
            >
              Run the free audit
            </a>
            <a
              href="/learning-centre/paid-traffic-leak-map"
              className="inline-flex rounded-xl border border-accent px-6 py-3 font-semibold text-accent hover:bg-accent/5 transition-colors"
            >
              Open leak map
            </a>
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
            The free audit checks your landing page URL against these leak patterns automatically. Takes a couple of minutes.
          </p>
          <a
            href="/audit"
            className="mt-8 inline-flex rounded-xl bg-accent px-8 py-4 font-semibold text-bg hover:bg-accent-light transition-colors"
          >
            Run the free audit →
          </a>
        </div>
      </section>
      </main>
    </>
  )
}
