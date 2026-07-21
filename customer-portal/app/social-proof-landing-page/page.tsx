"use client";

import Link from "next/link";

export default function SocialProofLandingPage() {
  return (
    <div className="min-h-screen bg-bg text-fg-muted leading-relaxed text-[17px]">
      {/* Google Analytics - loaded after consent */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            window['ga-disable-G-KJ9S3450LH'] = true;
            window.GA_MEASUREMENT_ID = 'G-KJ9S3450LH';
          `,
        }}
      />

      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            headline: "Social Proof on Landing Pages",
            description:
              "How to add, place, and structure social proof that converts skeptical visitors — testimonials, numbers, logos.",
            url: "https://nebulacomponents.shop/social-proof-landing-page",
            publisher: {
              "@type": "Organization",
              name: "Nebula Components",
              url: "https://nebulacomponents.shop",
            },
          }),
        }}
      />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: [
              {
                "@type": "Question",
                name: "What counts as social proof on a landing page?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Numbers (clients served, pages audited, average improvement), outcome-specific testimonials, recognisable company logos, media mentions, guarantees, and case study results. Each one answers 'why should I trust this?' in a different way.",
                },
              },
              {
                "@type": "Question",
                name: "Where should social proof go on a landing page?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Immediately adjacent to your primary CTA — ideally directly above the submit button. Also in the hero section (social proof line like '40+ audits delivered · avg score back in 60s'). The worst place is below the fold where skeptics never reach it.",
                },
              },
              {
                "@type": "Question",
                name: "Why don't generic testimonials convert?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Because visitors can't verify them and they don't address the specific concern. 'Amazing tool, highly recommend!' is meaningless. 'Conversion rate went from 1.3% to 3.8% after fixing the headline' is verifiable and outcome-specific — it converts.",
                },
              },
              {
                "@type": "Question",
                name: "What if I don't have testimonials yet?",
                acceptedAnswer: {
                  "@type": "Answer",
                  text: "Use numbers: audit count, response time, guarantee terms. Add a 'no-risk' signal ('30-day money back, no questions'). Show the process outcome in advance (sample audit result). Any specific, verifiable claim beats zero proof.",
                },
              },
            ],
          }),
        }}
      />

      {/* Container */}
      <div className="max-w-[720px] mx-auto px-6 py-12 pb-20">
        {/* Header */}
        <header className="border-b border-border pb-6 mb-12 flex justify-between items-center">
          <Link
            href="/"
            className="text-fg font-bold text-sm tracking-wider uppercase hover:text-accent transition-colors"
          >
            ● Nebula Components
          </Link>
          <Link
            href="/audit"
            className="bg-accent text-bg text-xs font-semibold px-4 py-2 rounded-md hover:bg-accent-light transition-colors"
          >
            Run free audit →
          </Link>
        </header>

        {/* Main Content */}
        <h1 className="text-2xl sm:text-3xl md:text-[2.4rem] font-extrabold leading-tight text-fg mt-8 mb-4">
          Social Proof on Landing Pages
        </h1>

        <p className="text-fg-muted text-lg mb-8">
          Every cold visitor has one unspoken question: 'Why should I trust you?'
          If your page doesn't answer it before asking for anything, conversion
          drops. Social proof — testimonials, numbers, logos, guarantees —
          answers that question before it becomes an objection.
        </p>

        {/* Quick Answer Blockquote */}
        <blockquote className="border border-border bg-bg-panel p-5 rounded-xl my-6">
          <p className="text-fg-muted">
            <strong className="text-fg">Quick Answer:</strong> You need at least one specific proof
            element visible before your first CTA. A verified customer count,
            a result-oriented quote, or a recognisable logo. Generic
            praise doesn't work — specificity creates credibility. 'Great
            service!' is useless. '3.8% conversion rate after fixing our
            headline' converts.
          </p>
        </blockquote>

        {/* FAQ Section */}
        <h2 className="text-xl sm:text-[1.4rem] font-bold text-fg mt-12 mb-4">
          Frequently Asked Questions
        </h2>

        {/* FAQ Items */}
        <div className="space-y-4">
          <div className="bg-bg-panel border border-border rounded-lg p-5 sm:p-6">
            <h3 className="font-bold text-fg mb-2">
              What counts as social proof on a landing page?
            </h3>
            <p className="text-fg-muted text-[0.95rem] m-0">
              Numbers (clients served, pages audited, average improvement),
              outcome-specific testimonials, recognisable company logos, media
              mentions, guarantees, and case study results. Each one answers
              'why should I trust this?' in a different way.
            </p>
          </div>

          <div className="bg-bg-panel border border-border rounded-lg p-5 sm:p-6">
            <h3 className="font-bold text-fg mb-2">
              Where should social proof go on a landing page?
            </h3>
            <p className="text-fg-muted text-[0.95rem] m-0">
              Immediately adjacent to your primary CTA — ideally directly above
              the submit button. Also in the hero section (social proof line like
              a verified customer result). The worst place
              is below the fold where skeptics never reach it.
            </p>
          </div>

          <div className="bg-bg-panel border border-border rounded-lg p-5 sm:p-6">
            <h3 className="font-bold text-fg mb-2">
              Why don't generic testimonials convert?
            </h3>
            <p className="text-fg-muted text-[0.95rem] m-0">
              Because visitors can't verify them and they don't address the
              specific concern. 'Amazing tool, highly recommend!' is
              meaningless. 'Conversion rate went from 1.3% to 3.8% after fixing
              the headline' is verifiable and outcome-specific — it converts.
            </p>
          </div>

          <div className="bg-bg-panel border border-border rounded-lg p-5 sm:p-6">
            <h3 className="font-bold text-fg mb-2">
              What if I don't have testimonials yet?
            </h3>
            <p className="text-fg-muted text-[0.95rem] m-0">
              Use numbers: audit count, response time, guarantee terms. Add a
              'no-risk' signal ('30-day money back, no questions'). Show the
              process outcome in advance (sample audit result). Any specific,
              verifiable claim beats zero proof.
            </p>
          </div>
        </div>

        {/* Related Articles */}
        <section className="bg-bg-panel border border-border rounded-lg p-5 sm:p-6 mt-12">
          <h3 className="text-fg-muted uppercase tracking-wide text-sm mb-3">
            Related Articles
          </h3>
          <Link
            href="/why-landing-pages-dont-convert"
            className="block text-accent hover:text-accent-light text-[0.95rem] mb-2 transition-colors"
          >
            Why Your Landing Page Isn't Converting
          </Link>
          <Link
            href="/what-is-landing-page-audit"
            className="block text-accent hover:text-accent-light text-[0.95rem] transition-colors"
          >
            What Is a Landing Page Audit?
          </Link>
        </section>

        {/* CTA Box */}
        <div className="bg-bg-panel border border-border rounded-xl p-8 sm:p-10 text-center mt-14">
          <h2 className="!text-2xl !font-bold text-fg !m-0 !p-0 !border-none mb-3">
            See exactly where your page leaks.
          </h2>
          <p className="text-fg-muted mb-6">
            Automated audit scoring is live and evidence-backed — no signup required.
          </p>
          <Link
            href="/audit"
            className="inline-block bg-accent text-bg font-bold text-base px-8 py-3.5 rounded-lg hover:bg-accent-light transition-colors"
          >
            Run free audit →
          </Link>
          <p className="text-[13px] text-fg-muted mt-4">
            Free audit live · results in 60 seconds
          </p>
        </div>

        {/* Footer */}
        <footer className="border-t border-border mt-20 pt-6 text-center text-sm text-fg-muted">
          <p>
            © 2025{" "}
            <Link href="/" className="text-accent hover:text-accent-light transition-colors">
              Nebula Components
            </Link>{" "}
            ·{" "}
            <Link
              href="/what-is-landing-page-audit"
              className="text-accent hover:text-accent-light transition-colors"
            >
              What is a landing page audit?
            </Link>{" "}
            ·{" "}
            <Link
              href="/why-landing-pages-dont-convert"
              className="text-accent hover:text-accent-light transition-colors"
            >
              Why pages don't convert
            </Link>
          </p>
        </footer>
      </div>

      {/* Cookie Consent Script */}
      <script src="/cookie-consent.js" defer />
    </div>
  );
}
