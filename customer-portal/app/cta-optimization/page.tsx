import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Landing Page CTA Optimization | Nebula Components",
  description: "How to write, place, and test calls-to-action that convert cold traffic into leads and buyers.",
}

const faqItems = [
  {
    question: "What is the best CTA text for a landing page?",
    answer: "Action verb + specific outcome. 'View the Evidence-Backed Audit Status' outperforms 'Submit' because it tells the visitor exactly what they get and how fast. The verb should match the commitment level — 'Get' for free offers, 'Start' for trials, 'Buy' only when trust is already established.",
  },
  {
    question: "How many CTAs should a landing page have?",
    answer: "One primary CTA phrase, repeated consistently. Hero CTA, sticky bar CTA, and bottom-of-page CTA should all use the exact same words. Multiple different CTA phrases create decision friction and reduce conversion.",
  },
  {
    question: "Where should the CTA button go on a landing page?",
    answer: "Above the fold (visible without scrolling), in any sticky nav or bar, and again at the bottom of the page. If a visitor has to scroll to find your first CTA, you're losing conversions before they start.",
  },
  {
    question: "Why does CTA button color matter?",
    answer: "Contrast beats brand color. Your CTA button should stand out from the background — high contrast, not matching the page palette. Green or amber on dark backgrounds outperform grey or navy. Test with the squint test: blur your eyes at the page; the CTA should still be obvious.",
  },
]

const relatedArticles = [
  { href: "/why-landing-pages-dont-convert", title: "Why Your Landing Page Isn't Converting" },
  { href: "/ai-sdr-vs-audit", title: "You Don't Need an AI SDR — Fix Your Landing Page First" },
]

export default function CtaOptimizationPage() {
  return (
    <div className="min-h-screen bg-bg text-fg font-sans">
      {/* Header */}
      <header className="max-w-[720px] mx-auto px-6 pt-8 pb-6 flex justify-between items-center border-b border-border">
        <a href="/" className="text-accent-light text-sm font-bold tracking-widest uppercase hover:text-accent transition-colors">
          ● Nebula Components
        </a>
        <a href="/audit" className="bg-accent-dark text-bg text-sm font-semibold px-4 py-2 rounded-md hover:bg-accent transition-colors">
          Run free audit →
        </a>
      </header>

      {/* Main Content */}
      <main className="max-w-[720px] mx-auto px-6 py-12">
        <h1 className="text-[clamp(1.8rem,4vw,2.4rem)] font-extrabold leading-tight text-fg mt-8 mb-4">
          Landing Page CTA Optimization
        </h1>
        <p className="text-fg-muted text-lg mb-6">
          A weak CTA — 'Submit', 'Learn More', 'Get Started' — leaves the visitor guessing what happens next. Vague CTAs are the second-most common conversion killer after weak headlines. The fix is specific: name the action and the outcome in the button text.
        </p>

        {/* Quick Answer Blockquote */}
        <blockquote className="border border-border bg-bg-panel py-4 px-5 rounded-r-lg my-6">
          <p className="mb-0">
            <strong className="text-fg">Quick Answer:</strong> Replace vague CTAs ('Submit', 'Learn More') with action + outcome: 'View the Evidence-Backed Audit Status'. Place it above the fold and repeat it verbatim at the bottom of the page. One consistent CTA phrase across the entire page outperforms multiple competing options.
          </p>
        </blockquote>

        {/* FAQ Section */}
        <h2 className="text-2xl font-bold text-fg mt-12 mb-6">
          Frequently Asked Questions
        </h2>

        <div className="space-y-4">
          {faqItems.map((item, idx) => (
            <div
              key={idx}
              className="bg-bg-panel border border-border rounded-xl p-5"
            >
              <h3 className="text-base font-semibold text-fg mb-2">
                {item.question}
              </h3>
              <p className="text-fg-muted text-sm mb-0">
                {item.answer}
              </p>
            </div>
          ))}
        </div>

        {/* Related Articles */}
        <section className="bg-bg-panel border border-border rounded-xl p-5 mt-12">
          <h3 className="text-sm font-semibold text-fg-muted uppercase tracking-wide mb-3">
            Related Articles
          </h3>
          <div className="space-y-2">
            {relatedArticles.map((article) => (
              <a
                key={article.href}
                href={article.href}
                className="block text-accent hover:text-accent-light text-sm transition-colors"
              >
                {article.title}
              </a>
            ))}
          </div>
        </section>

        {/* CTA Box */}
        <div className="bg-bg-panel shadow-glow border border-border rounded-xl py-10 px-8 text-center mt-12">
          <h2 className="text-2xl font-bold text-fg mb-3">
            See exactly where your page leaks.
          </h2>
          <p className="text-fg-muted mb-6 max-w-md mx-auto">
            Automated audit scoring is live and evidence-backed — no signup required.
          </p>
          <a
            href="/audit"
            className="inline-block bg-accent-dark text-bg font-bold text-base py-4 px-8 rounded-lg hover:bg-accent transition-colors"
          >
            Run free audit →
          </a>
          <p className="text-xs text-fg-dim mt-4">
            Scoring paused · no submission collected
          </p>
        </div>

        {/* Footer */}
        <footer className="border-t border-border mt-16 pt-6 text-center text-sm text-fg-muted">
          <p>
            © 2025 <a href="/" className="text-accent-light hover:text-accent transition-colors">Nebula Components</a> ·{' '}
            <a href="/what-is-landing-page-audit" className="text-accent-light hover:text-accent transition-colors">
              What is a landing page audit?
            </a>{' '}
            ·{' '}
            <a href="/why-landing-pages-dont-convert" className="text-accent-light hover:text-accent transition-colors">
              Why pages don't convert
            </a>
          </p>
        </footer>
      </main>
    </div>
  )
}
