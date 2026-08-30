import type { Metadata } from 'next'
import Link from 'next/link'
import Script from 'next/script'

export const metadata: Metadata = {
  title: 'Landing Page Code Fixes: Get Specific Code Changes for Conversion Issues | Nebula',
  description:
    'The Nebula Repair Sprint delivers specific code changes for your highest-impact conversion finding. Not a list of recommendations. Actual code, in 48 hours, for $97.',
  alternates: { canonical: 'https://nebulacomponents.com/landing-page-code-fixes' },
}

const faqItems = [
  {
    question: 'What does the Nebula $97 Repair Sprint include?',
    answer:
      'The Repair Sprint delivers one specific code implementation for the highest-impact finding from your audit. It includes the exact change needed (HTML, CSS, or copy), implementation instructions, and a confidence rating. Delivered in 48 hours. Not a recommendations report.',
  },
  {
    question: 'Can I get code diffs for my landing page conversion issues?',
    answer:
      'Yes. The Nebula Repair Sprint provides a specific, implementable change for one prioritized finding from your audit: the exact code or copy to add, replace, or restructure, not a list of things to consider. If you can paste code into your CMS or page builder, you can implement it.',
  },
  {
    question: 'What kinds of fixes does the Repair Sprint cover?',
    answer:
      'Headline rewrites aligned to the ad message, CTA repositioning for above-the-fold visibility, social proof placement near the primary action, mobile load speed optimizations, structured data additions for AI readiness, and OG tag corrections. The fix is determined by which audit signal scored lowest.',
  },
  {
    question: 'Do I need to buy the audit separately?',
    answer:
      'The audit is free and required first. The Repair Sprint is ordered after the audit identifies the highest-priority finding. The process is: free audit, then Repair Sprint if you want the specific implementation delivered for you.',
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

const fixTypes = [
  {
    type: 'Headline Rewrite',
    desc: 'A new headline copy aligned to the specific ad or search term that sends traffic to the page. Includes the exact wording and placement instruction.',
  },
  {
    type: 'CTA Repositioning',
    desc: 'The button moves above the fold and into thumb-accessible position on mobile. Includes the CSS or layout change needed.',
  },
  {
    type: 'Social Proof Placement',
    desc: 'Testimonials, review counts, or trust indicators are repositioned adjacent to the CTA. Includes the HTML block and placement instruction.',
  },
  {
    type: 'Load Speed Optimization',
    desc: 'The highest-impact load speed fix for your specific page, typically image compression, render-blocking script deferral, or font loading. Includes the exact implementation.',
  },
  {
    type: 'Structured Data Addition',
    desc: 'JSON-LD schema markup for your page type (Product, FAQ, Article, or Organization). Includes the complete script block ready to paste.',
  },
  {
    type: 'OG Tag Correction',
    desc: 'Corrected og:title, og:description, and og:image meta tags for accurate AI and social previews. Includes the exact meta tag code.',
  },
]

export default function LandingPageCodeFixes() {
  return (
    <div className="min-h-screen bg-bg text-fg font-sans">
      <Script
        id="faq-schema"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFaq) }}
      />

      <main className="max-w-[720px] mx-auto px-6 py-12">
        <p className="text-accent text-xs font-bold uppercase tracking-wider mb-4">
          Repair Sprint
        </p>
        <h1 className="text-[clamp(1.8rem,4vw,2.4rem)] font-extrabold leading-tight text-fg mt-4 mb-4">
          Landing Page Code Fixes: Get Specific Code Changes for Conversion Issues
        </h1>
        <p className="text-fg-muted text-lg mb-6">
          Most audits give you a list of problems. The Nebula Repair Sprint gives you the specific
          code change that fixes the highest-impact one.
        </p>

        {/* Answer capsule */}
        <blockquote className="border-l-4 border-accent bg-bg-panel py-4 px-5 rounded-r-lg my-6">
          <p className="mb-0">
            <strong className="text-fg">Quick Answer:</strong> The Nebula $97 Repair Sprint
            delivers a specific code implementation for one prioritized landing page finding. It
            includes the exact change needed, implementation instructions, and a confidence
            rating. Delivered in 48 hours. Not a recommendations report.
          </p>
        </blockquote>

        {/* Section 1 */}
        <h2 className="text-2xl font-bold text-fg mt-12 mb-6">
          The Problem with Conversion Audits
        </h2>
        <p className="text-fg-muted mb-4">
          Most conversion audit tools give you a score and a list. Your headline needs work. Your
          CTA is not visible above the fold. Your social proof is too far down the page. Page
          speed is below benchmark. That is useful context. It is not actionable without more work.
        </p>
        <p className="text-fg-muted mb-4">
          To use a score and a list, you need to know which finding is highest priority, what the
          specific fix is for your page and your traffic source, and how to implement it in
          whatever system your page is built on. That is a non-trivial amount of judgment and
          effort, which is why most audit findings do not get implemented.
        </p>
        <p className="text-fg-muted mb-4">
          The Repair Sprint skips the interpretation step. You get the specific change: the
          headline copy, the CSS repositioning, the JSON-LD block, the image optimization
          instruction. One finding, one implementation, delivered in 48 hours.
        </p>

        {/* Section 2 */}
        <h2 className="text-2xl font-bold text-fg mt-12 mb-6">
          What the Repair Sprint Delivers
        </h2>
        <p className="text-fg-muted mb-4">
          The Repair Sprint is not consulting. There is no discovery call, no strategy document,
          and no deliverable that requires further interpretation. It is a specific, implementable
          artifact for one prioritized finding.
        </p>
        <div className="space-y-4">
          {[
            {
              item: 'The specific change',
              desc: 'Exact HTML, CSS, copy, or script needed. Not a recommendation to "improve" something.',
            },
            {
              item: 'Implementation instructions',
              desc: 'Step-by-step instructions for your page builder, CMS, or codebase. Written for the person making the change, not a developer.',
            },
            {
              item: 'Confidence rating',
              desc: 'How confident Nebula is that this specific fix will improve the failing signal, based on audit data.',
            },
            {
              item: '48-hour delivery',
              desc: 'Delivered within 48 hours of order. No retainer, no ongoing contract.',
            },
          ].map((item) => (
            <div key={item.item} className="flex items-start gap-3">
              <span className="text-accent mt-0.5 font-bold">&#10003;</span>
              <div>
                <span className="text-fg font-semibold">{item.item}:</span>{' '}
                <span className="text-fg-muted text-sm">{item.desc}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Section 3 */}
        <h2 className="text-2xl font-bold text-fg mt-12 mb-6">
          What Kinds of Fixes the Repair Sprint Covers
        </h2>
        <div className="space-y-4">
          {fixTypes.map((item) => (
            <div key={item.type} className="bg-bg-panel border border-border rounded-xl p-5">
              <h3 className="text-base font-semibold text-fg mb-2">{item.type}</h3>
              <p className="text-fg-muted text-sm mb-0">{item.desc}</p>
            </div>
          ))}
        </div>
        <p className="text-fg-muted mt-4 text-sm">
          The fix type is determined by your audit results. The Repair Sprint addresses the
          highest-priority failing signal, not the easiest fix, and not a full-page redesign.
        </p>

        {/* Section 4 */}
        <h2 className="text-2xl font-bold text-fg mt-12 mb-6">
          The Process: Audit to Implementation
        </h2>
        <div className="space-y-4 mt-6">
          {[
            {
              step: '1. Run the free audit',
              desc: 'Paste your landing page URL. Nebula checks 9 conversion signals and returns a scored result in under 2 minutes.',
              action: { label: 'Start the free audit', href: '/audit' },
            },
            {
              step: '2. Review the finding',
              desc: 'The audit identifies which signal is failing and why. The Repair Sprint targets the highest-priority failure.',
              action: null,
            },
            {
              step: '3. Order the Repair Sprint',
              desc: 'One-time $97. No retainer. Delivered in 48 hours.',
              action: { label: 'Order the Repair Sprint', href: '/repair-sprint' },
            },
            {
              step: '4. Implement the fix',
              desc: 'You receive the specific code change and implementation instructions. Paste it in, verify, done.',
              action: null,
            },
          ].map((item, index) => (
            <div key={item.step} className="bg-bg-panel border border-border rounded-xl p-5">
              <div className="flex items-start gap-4">
                <div className="text-accent font-extrabold text-xl min-w-[28px]">
                  {index + 1}.
                </div>
                <div>
                  <h3 className="text-base font-semibold text-fg mb-1">{item.step}</h3>
                  <p className="text-fg-muted text-sm mb-0">{item.desc}</p>
                  {item.action && (
                    <Link
                      href={item.action.href}
                      className="text-accent hover:text-accent-light text-sm inline-block mt-2 transition-colors"
                    >
                      {item.action.label} &rarr;
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

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
              { href: '/ecommerce-landing-page-audit', title: 'Ecommerce Landing Page Audit' },
              {
                href: '/ai-readiness-landing-page',
                title: 'AI Readiness Check for Landing Pages',
              },
              { href: '/headline-optimization', title: 'Landing Page Headline Optimization' },
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

        {/* Dual CTA */}
        <div className="bg-bg-panel shadow-glow border border-border rounded-xl py-10 px-8 text-center mt-12">
          <h2 className="text-2xl font-bold text-fg mb-3">
            Start with the Free Audit
          </h2>
          <p className="text-fg-muted mb-6 max-w-md mx-auto">
            The audit identifies the finding. The Repair Sprint delivers the fix. Start with the
            free audit; you will see exactly what the Repair Sprint would address.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/audit"
              className="inline-block bg-accent-dark text-bg font-bold text-base py-4 px-8 rounded-lg hover:bg-accent transition-colors"
            >
              Run Free Audit
            </Link>
            <Link
              href="/repair-sprint"
              className="inline-block bg-transparent text-accent font-bold text-base py-4 px-8 rounded-lg border border-accent hover:bg-accent hover:text-bg transition-colors"
            >
              View Repair Sprint ($97)
            </Link>
          </div>
          <p className="text-xs text-fg-dim mt-4">
            No account required for the audit. Repair Sprint is one-time, no retainer.
          </p>
        </div>
      </main>
    </div>
  )
}
