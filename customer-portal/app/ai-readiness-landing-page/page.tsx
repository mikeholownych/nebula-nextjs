import type { Metadata } from 'next'
import Link from 'next/link'
import Script from 'next/script'

export const metadata: Metadata = {
  title: 'AI Readiness Check for Landing Pages: JSON-LD, OG Tags, and Structured Data | Nebula',
  description:
    'Check if your landing page is readable by AI search engines and citation systems. Nebula audits AI readiness as one of its 9 conversion signals.',
  alternates: { canonical: 'https://nebulacomponents.com/ai-readiness-landing-page' },
}

const faqItems = [
  {
    question: 'What does an AI readiness check for a landing page include?',
    answer:
      'An AI readiness check verifies that the page has valid JSON-LD structured data, correct Open Graph tags, a clean heading hierarchy (one H1 followed by logical H2s), and machine-readable HTML with no broken or hidden content blocks. Nebula checks all four automatically as one of its 9 conversion signals.',
  },
  {
    question: 'Does AI readiness affect my paid traffic conversions?',
    answer:
      'Directly, no. AI readiness does not change your landing page click-to-purchase rate. But in 2026 it affects discovery: ChatGPT, Perplexity, and Google AI Overviews increasingly surface product pages and comparison content based on structured data. Pages that are not machine-readable are invisible to these channels.',
  },
  {
    question: 'How long does an AI readiness check take?',
    answer:
      'Nebula\'s audit checks AI readiness as part of its full 9-signal scan. The whole audit runs in under 2 minutes and is free.',
  },
]

const jsonLdFaq = {
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

export default function AIReadinessLandingPage() {
  return (
    <div className="min-h-screen bg-bg text-fg font-sans">
      <Script
        id="faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFaq) }}
      />

      <main className="max-w-[720px] mx-auto px-6 py-12">
        <p className="text-accent text-xs font-bold uppercase tracking-wider mb-4">
          AI Search Optimization
        </p>
        <h1 className="text-[clamp(1.8rem,4vw,2.4rem)] font-extrabold leading-tight text-fg mt-4 mb-4">
          AI Readiness Check for Landing Pages: JSON-LD, OG Tags, and Structured Data
        </h1>
        <p className="text-fg-muted text-lg mb-6">
          Whether ChatGPT, Perplexity, and Google AI Overviews can read and cite your page is now a
          measurable signal, not a theory.
        </p>

        {/* Answer capsule */}
        <blockquote className="border-l-4 border-accent bg-bg-panel py-4 px-5 rounded-r-lg my-6">
          <p className="mb-0">
            <strong className="text-fg">Quick Answer:</strong> An AI readiness check for a landing
            page verifies that the page has structured data (JSON-LD), correct Open Graph tags, a
            clean heading hierarchy, and machine-readable content. Nebula checks AI readiness
            automatically as one of its 9 conversion signals. Free, runs in under 2 minutes.
          </p>
        </blockquote>

        {/* Section 1 */}
        <h2 className="text-2xl font-bold text-fg mt-12 mb-6">
          What AI Readiness Actually Means for a Landing Page
        </h2>
        <p className="text-fg-muted mb-4">
          Traditional SEO readiness means Google can crawl and index your page. AI readiness is a
          different problem. It means that language models, including ChatGPT, Perplexity, and Google AI
          Overviews, can parse your page, extract the core claim, and cite it accurately in
          response to a user query.
        </p>
        <p className="text-fg-muted mb-4">
          For paid traffic campaigns, this matters because the buyer journey in 2026 increasingly
          starts with an AI answer, not a search results page. A visitor who sees your product
          cited in a ChatGPT response arrives with context. A visitor who cannot find your product
          in AI results never arrives at all.
        </p>
        <p className="text-fg-muted mb-4">
          AI readiness is not about keyword density or backlinks. It is about machine-readable
          structure: does your page have schema markup, correct metadata, and clean HTML that a
          language model can parse without guessing?
        </p>

        {/* Section 2 */}
        <h2 className="text-2xl font-bold text-fg mt-12 mb-6">
          The 4 Signals Nebula Checks for AI Readiness
        </h2>
        <div className="space-y-4">
          {[
            {
              label: 'JSON-LD Schema Markup',
              detail:
                'Valid structured data using schema.org types (Product, FAQPage, Article, Organization). Without it, AI engines must guess your page\'s context and often get it wrong.',
            },
            {
              label: 'Open Graph Tags',
              detail:
                'Correct og:title, og:description, og:image, and og:url. These are the fallback representation of your page when structured data is absent and the primary source for social and AI preview cards.',
            },
            {
              label: 'Heading Hierarchy',
              detail:
                'One H1 that states the page\'s core claim. Logical H2s that organize supporting content. A broken hierarchy (multiple H1s, skipped levels) degrades how AI systems understand your page topic.',
            },
            {
              label: 'Clean HTML Structure',
              detail:
                'Body copy in semantic HTML elements (paragraphs, lists, tables), not trapped in JavaScript-rendered components. Pages that require JS execution to reveal content are partially invisible to AI crawlers.',
            },
          ].map((item) => (
            <div key={item.label} className="bg-bg-panel border border-border rounded-xl p-5">
              <h3 className="text-base font-semibold text-fg mb-2">{item.label}</h3>
              <p className="text-fg-muted text-sm mb-0">{item.detail}</p>
            </div>
          ))}
        </div>

        {/* Section 3 */}
        <h2 className="text-2xl font-bold text-fg mt-12 mb-6">
          Why AI Readiness Matters for Paid Traffic in 2026
        </h2>
        <p className="text-fg-muted mb-4">
          The standard argument for landing page optimization has always been post-click: get the
          visitor to your page, then convert them. AI readiness adds a pre-click layer: get your
          product surfaced in the AI answers your buyers are already reading.
        </p>
        <p className="text-fg-muted mb-4">
          Google AI Overviews now appear for a large share of commercial queries. Perplexity is a
          primary research tool for SaaS buyers and ecommerce shoppers who want a quick comparison
          before committing to a product page. ChatGPT is used directly for purchase research,
          especially in B2B and higher-ticket categories.
        </p>
        <p className="text-fg-muted mb-4">
          Pages with valid schema and clean structure are more likely to be cited as sources in
          these AI answers. Pages without it are invisible to these channels even if they rank
          highly in traditional search.
        </p>
        <div className="bg-bg-panel border border-border rounded-xl p-5 mt-6">
          <p className="text-accent font-semibold text-sm mb-2">The compound effect</p>
          <p className="text-fg-muted text-sm mb-0">
            A landing page that converts paid traffic AND gets cited in AI answers compounds its
            return. The paid channel brings immediate buyers. The AI channel brings organic, warm
            visitors at zero marginal cost per click.
          </p>
        </div>

        {/* Section 4 */}
        <h2 className="text-2xl font-bold text-fg mt-12 mb-6">
          How to Check Your Page's AI Readiness
        </h2>
        <p className="text-fg-muted mb-4">
          Nebula audits AI readiness as one of its 9 conversion signals. The audit is free, runs
          in under 2 minutes, and returns a scored result for each signal including specific
          findings for any missing or malformed structured data.
        </p>
        <p className="text-fg-muted mb-4">
          To check your page: paste the URL into the audit form, submit, and review the AI
          Readiness signal in your results. The finding will identify exactly which of the 4
          checks failed and what needs to be fixed.
        </p>
        <p className="text-fg-muted mb-4">
          If the AI Readiness signal shows a failure, the $97 Repair Sprint covers implementation
          of the specific fix: whether that is adding JSON-LD schema, correcting OG tags, or
          restructuring the heading hierarchy.
        </p>

        {/* FAQ */}
        <h2 className="text-2xl font-bold text-fg mt-12 mb-6">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {faqItems.map((item) => (
            <div key={item.question} className="bg-bg-panel border border-border rounded-xl p-5">
              <h3 className="text-base font-semibold text-fg mb-2">{item.question}</h3>
              <p className="text-fg-muted text-sm mb-0">{item.answer}</p>
            </div>
          ))}
        </div>

        {/* Related */}
        <section className="bg-bg-panel border border-border rounded-xl p-5 mt-12">
          <h3 className="text-sm font-semibold text-fg-muted uppercase tracking-wide mb-3">
            Related Resources
          </h3>
          <div className="space-y-2">
            {[
              { href: '/what-is-landing-page-audit', title: 'What Is a Landing Page Audit?' },
              { href: '/headline-optimization', title: 'Landing Page Headline Optimization' },
              { href: '/social-proof-landing-page', title: 'Social Proof on Landing Pages' },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block text-accent hover:text-accent-light text-sm transition-colors"
              >
                {link.title} &rarr;
              </Link>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="bg-bg-panel shadow-glow border border-border rounded-xl py-10 px-8 text-center mt-12">
          <h2 className="text-2xl font-bold text-fg mb-3">
            Check Your Page's AI Readiness Now
          </h2>
          <p className="text-fg-muted mb-6 max-w-md mx-auto">
            Free audit. 9 signals including AI readiness, structured data, and heading hierarchy.
            Results in under 2 minutes.
          </p>
          <Link
            href="/audit"
            className="inline-block bg-accent-dark text-bg font-bold text-base py-4 px-8 rounded-lg hover:bg-accent transition-colors"
          >
            Run Free Audit
          </Link>
          <p className="text-xs text-fg-dim mt-4">No account required. Instant results.</p>
        </div>
      </main>
    </div>
  )
}
