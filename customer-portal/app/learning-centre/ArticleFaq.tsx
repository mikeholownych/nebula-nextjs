/**
 * ArticleFaq - reusable FAQ block for learning-centre articles.
 *
 * Renders BOTH the FAQPage JSON-LD (for AI/search citation) and the visible
 * FAQ section (for human readers). The Neogenio audit flagged that ~30
 * learning-centre articles lack FAQ blocks, which is a real AEO gap: structured
 * Q&A is a strong signal for AI assistants choosing what to quote.
 *
 * FAQ items are passed in per-article so each is topic-specific and
 * evidence-safe (no fabricated claims, no conversion-lift promises).
 */

export interface FaqItem {
  question: string
  answer: string
}

export function buildFaqSchema(faqItems: FaqItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }
}

export default function ArticleFaq({ faqItems }: { faqItems: FaqItem[] }) {
  if (!faqItems.length) return null

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildFaqSchema(faqItems)) }}
      />
      <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
        <h2 className="mb-6 text-2xl font-bold text-fg">Frequently asked questions</h2>
        <div className="space-y-6">
          {faqItems.map((item, i) => (
            <div key={i} className="border-b border-border pb-6 last:border-0 last:pb-0">
              <h3 className="mb-2 font-semibold text-fg">{item.question}</h3>
              <p className="leading-relaxed text-fg-muted">{item.answer}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
