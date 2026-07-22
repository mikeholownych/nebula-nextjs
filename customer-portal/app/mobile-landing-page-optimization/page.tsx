import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: "Mobile Landing Page Optimization | Nebula Components",
  description: "60–70% of landing page traffic is mobile. Here's how to audit and fix your mobile conversion experience.",
  openGraph: {
    title: "Mobile Landing Page Optimization",
    description: "60–70% of landing page traffic is mobile. Here's how to audit and fix your mobile conversion experience.",
    url: "https://nebulacomponents.shop/mobile-landing-page-optimization",
    type: "article",
    images: ["https://nebulacomponents.shop/og-card.png"],
  },
  twitter: {
    card: "summary_large_image",
    images: ["https://nebulacomponents.shop/og-card.png"],
  },
}

const faqItems = [
  {
    question: "Why does my landing page convert on desktop but not mobile?",
    answer: "The most common reasons: CTA is below the fold on mobile, form fields require precision typing unsuited to mobile keyboards, images are too large and slow the page on cellular connections, or tap targets are too small. Responsive CSS prevents layout breakage but doesn't fix conversion experience.",
  },
  {
    question: "What is the minimum tap target size for mobile CTAs?",
    answer: "44×44 CSS pixels is Google's minimum recommendation. Apple's Human Interface Guidelines say the same. Buttons smaller than this get missed clicks and frustrated users. If your CTA button requires pinching to tap accurately, it will cost you conversions.",
  },
  {
    question: "How do I test my landing page on mobile?",
    answer: "Chrome DevTools → Device Toolbar → set width to 390px (iPhone 14 standard). Check: CTA visible above fold, all text readable without zooming, form submittable with one hand, no horizontal scroll, images load. For real-device testing, email yourself the URL and test on an actual phone.",
  },
  {
    question: "What percentage of landing page traffic is mobile?",
    answer: "Industry averages sit between 60–70% for B2B landing pages receiving paid or social traffic. For pages receiving organic Google traffic, mobile share is often 55–65%. If your page converts at 1.2% on desktop and 0.4% on mobile, fixing mobile often has 3x the revenue impact of any desktop improvement.",
  },
]

const relatedArticles = [
  { href: "/why-landing-pages-dont-convert", title: "Why Your Landing Page Isn't Converting" },
  { href: "/what-is-landing-page-audit", title: "What Is a Landing Page Audit?" },
]

export default function MobileLandingPageOptimization() {
  return (
    <div className="min-h-screen bg-bg text-fg-muted font-sans">
      {/* Main Content */}
      <main className="max-w-[720px] mx-auto px-6 py-12">
        <h1 className="text-[clamp(1.8rem,4vw,2.4rem)] font-extrabold leading-tight text-fg mt-8 mb-4">
          Mobile Landing Page Optimization
        </h1>
        <p className="text-fg-muted text-lg mb-6">
          60–70% of B2B landing page traffic arrives on a mobile device. 'Responsive' doesn't mean 'converts on mobile' — it means the layout doesn't break. A page that works on desktop but has tiny tap targets, a buried CTA, and a form requiring desktop-level typing loses most of its mobile visitors before they convert.
        </p>

        {/* Quick Answer Blockquote */}
        <blockquote className="border border-border bg-bg-panel py-4 px-5 rounded-xl my-6">
          <p className="mb-0">
            <strong className="text-fg">Quick Answer:</strong> Check three things first on mobile: (1) Is the CTA visible without scrolling on a 390px-wide screen? (2) Are all tap targets at least 44×44px? (3) Does the form work with one thumb? If any answer is no, you have a mobile conversion leak. Test with Chrome DevTools in device mode before spending another dollar on ads.
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
        <div className="bg-bg-panel border border-border rounded-xl py-10 px-8 text-center mt-12">
          <h2 className="text-2xl font-bold text-fg mb-3">
            See exactly where your page leaks.
          </h2>
          <p className="text-fg-muted mb-6 max-w-md mx-auto">
            Automated audit scoring is live and evidence-backed — no signup required.
          </p>
          <a
            href="/audit"
            className="inline-block bg-accent text-bg font-bold text-base py-4 px-8 rounded-lg hover:bg-accent-light transition-colors"
          >
            Run free audit →
          </a>
          <p className="text-xs text-fg-muted mt-4">
            Free audit live · results in 60 seconds
          </p>
        </div>

      </main>
    </div>
  )
}
