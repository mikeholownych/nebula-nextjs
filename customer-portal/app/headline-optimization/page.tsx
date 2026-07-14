import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Landing Page Headline Optimization | Nebula Components",
  description: "Why your headline is the #1 conversion lever — and how to score, rewrite, and test it.",
}

const faqItems = [
  {
    question: "What makes a high-converting landing page headline?",
    answer: "A high-converting headline states the specific outcome the buyer wants, not a description of the product. It answers 'what's in it for me?' in under 8 words. The best headlines name the problem being solved or the result being delivered.",
  },
  {
    question: "How do I test if my headline is weak?",
    answer: "Cover your logo and product name. Read only the headline. Would a cold visitor know what they get, who it's for, and why it matters? If the answer is no to any of these, the headline is weak. Nebula's free audit scores your headline in 30 seconds.",
  },
  {
    question: "What is the money angle for a headline?",
    answer: "The money angle connects the headline directly to financial loss or gain — 'Stop burning ad budget on a page that can't convert.' It works best for cold paid-traffic visitors because it matches the pain they're actively feeling.",
  },
  {
    question: "How long should a landing page headline be?",
    answer: "6–12 words is the sweet spot. Longer than 12 words loses punch. Under 6 words often lacks specificity. The goal is one clear result, stated as concisely as possible.",
  },
]

const relatedArticles = [
  { href: "/why-landing-pages-dont-convert", title: "Why Your Landing Page Isn't Converting" },
  { href: "/what-is-landing-page-audit", title: "What Is a Landing Page Audit?" },
]

export default function HeadlineOptimizationPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-[#e2e8f0] font-sans">
      {/* Header */}
      <header className="max-w-[720px] mx-auto px-6 pt-8 pb-6 flex justify-between items-center border-b border-[#1e1e2e]">
        <a href="/" className="text-[#a5b4fc] text-sm font-bold tracking-widest uppercase hover:text-[#818cf8] transition-colors">
          ● Nebula Components
        </a>
        <a href="/#audit-form-card" className="bg-[#047857] text-white text-sm font-semibold px-4 py-2 rounded-md hover:bg-[#059669] transition-colors">
          Run my free audit →
        </a>
      </header>

      {/* Main Content */}
      <main className="max-w-[720px] mx-auto px-6 py-12">
        <h1 className="text-[clamp(1.8rem,4vw,2.4rem)] font-extrabold leading-tight text-[#f8fafc] mt-8 mb-4">
          Landing Page Headline Optimization
        </h1>
        <p className="text-[#94a3b8] text-lg mb-6">
          Your headline has 3 seconds to tell a cold visitor they're in the right place. If it describes your product instead of their outcome, 40–60% of visitors leave before scrolling. This is the highest-leverage fix on any landing page.
        </p>

        {/* Quick Answer Blockquote */}
        <blockquote className="border-l-4 border-[#6366f1] bg-[#12121c] py-4 px-5 rounded-r-lg my-6">
          <p className="mb-0">
            <strong className="text-[#f8fafc]">Quick Answer:</strong> A strong landing page headline states the specific outcome the buyer gets — not what the product is. 'Stop Losing Deals to Slow Reports' outperforms 'AI-Powered Analytics Dashboard' because it matches the visitor's internal monologue the moment they land.
          </p>
        </blockquote>

        {/* FAQ Section */}
        <h2 className="text-2xl font-bold text-[#f1f5f9] mt-12 mb-6 pl-4 border-l-4 border-[#6366f1]">
          Frequently Asked Questions
        </h2>

        <div className="space-y-4">
          {faqItems.map((item, idx) => (
            <div
              key={idx}
              className="bg-[#12121c] border border-[#1e1e2e] rounded-xl p-5"
            >
              <h3 className="text-base font-semibold text-[#f1f5f9] mb-2">
                {item.question}
              </h3>
              <p className="text-[#94a3b8] text-sm mb-0">
                {item.answer}
              </p>
            </div>
          ))}
        </div>

        {/* Related Articles */}
        <section className="bg-[#0f172a] border border-[#1e1e2e] rounded-xl p-5 mt-12">
          <h3 className="text-sm font-semibold text-[#94a3b8] uppercase tracking-wide mb-3">
            Related Articles
          </h3>
          <div className="space-y-2">
            {relatedArticles.map((article) => (
              <a
                key={article.href}
                href={article.href}
                className="block text-[#818cf8] hover:text-[#a5b4fc] text-sm transition-colors"
              >
                {article.title}
              </a>
            ))}
          </div>
        </section>

        {/* CTA Box */}
        <div className="bg-gradient-to-br from-[#0f172a] to-[#1a2744] border border-[#1e3a5f] rounded-xl py-10 px-8 text-center mt-12">
          <h2 className="text-2xl font-bold text-white mb-3">
            See exactly where your page leaks.
          </h2>
          <p className="text-[#94a3b8] mb-6 max-w-md mx-auto">
            Paste your URL. Get a scored teardown across all 5 dimensions — headline, CTA, trust proof, load speed, and mobile — in 60 seconds. Free.
          </p>
          <a
            href="/#audit-form-card"
            className="inline-block bg-[#047857] text-white font-bold text-base py-4 px-8 rounded-lg hover:bg-[#059669] transition-colors"
          >
            Run my free audit →
          </a>
          <p className="text-xs text-[#6b7280] mt-4">
            Free · 60 seconds · no account required
          </p>
        </div>

        {/* Footer */}
        <footer className="border-t border-[#1e1e2e] mt-16 pt-6 text-center text-sm text-[#94a3b8]">
          <p>
            © 2025 <a href="/" className="text-[#a5b4fc] hover:text-[#818cf8] transition-colors">Nebula Components</a> ·{' '}
            <a href="/what-is-landing-page-audit" className="text-[#a5b4fc] hover:text-[#818cf8] transition-colors">
              What is a landing page audit?
            </a>{' '}
            ·{' '}
            <a href="/why-landing-pages-dont-convert" className="text-[#a5b4fc] hover:text-[#818cf8] transition-colors">
              Why pages don't convert
            </a>
          </p>
        </footer>
      </main>
    </div>
  )
}
