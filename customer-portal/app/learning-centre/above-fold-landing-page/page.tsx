import type { Metadata } from 'next'
import Link from 'next/link'
import { createArticleSchema } from '../../lib/schema'

export const metadata: Metadata = {
  title: 'Above The Fold Landing Page: What Paid Traffic Decides In 3 Seconds | Nebula Components',
  description: '80% of mobile users never scroll below the fold. If your above-fold section doesn\'t close the case in 3 seconds, paid traffic leaves before the page sells anything.',
  alternates: { canonical: 'https://nebulacomponents.shop/learning-centre/above-fold-landing-page' },
}

const articleSchema = createArticleSchema({
  headline: 'Above The Fold: The 3-Second Window That Determines If Paid Traffic Converts',
  description: '80% of mobile users never scroll below the fold. If your above-fold section doesn\'t close the case in 3 seconds, paid traffic leaves before the page sells anything.',
  url: 'https://nebulacomponents.shop/learning-centre/above-fold-landing-page',
  publishedDate: '2026-07-21',
  modifiedDate: '2026-07-21',
})

export default function AboveFoldLandingPagePage() {
  return (
    <main id="main-content" className="min-h-screen bg-bg pt-[72px]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <div className="mx-auto max-w-3xl px-6 py-14">
        <Link href="/learning-centre" className="text-sm font-semibold text-accent hover:text-accent-light transition-colors">
          ← Learning Centre
        </Link>

        {/* Hero card */}
        <div className="mt-8 rounded-2xl border border-border bg-bg-panel p-8 md:p-10">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-accent">
            Landing Page Leaks · above the fold conversion
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-fg md:text-5xl">
            Above The Fold: The 3-Second Window That Determines If Paid Traffic Converts
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-fg-muted">
            The fold is not a design concept — it's the boundary between the ad spend that worked and the ad spend that was wasted. Eighty percent of mobile users never scroll below it. For cold paid traffic, the above-fold section is the entire page. If it doesn't convert the decision in under 3 seconds, nothing below it matters.
          </p>
        </div>

        {/* Section 1 */}
        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">The 5 Elements Required Above The Fold</h2>
          <p className="leading-relaxed text-fg-muted">
            Cold paid traffic arrives with no prior brand relationship and no patience. They need to answer five questions the moment the page loads — and the page has to answer them without requiring any action from the user.
          </p>
          <ul className="mt-4 space-y-3 text-fg-muted">
            <li className="flex gap-3">
              <span className="text-accent font-bold shrink-0 text-lg leading-relaxed">1.</span>
              <span><strong className="text-fg">Headline (what it is and who it's for):</strong> Not your brand tagline. Not a clever play on words. A direct statement of the outcome you deliver, for the person you deliver it to. "We help SaaS founders reduce churn" is a headline. "Grow beyond limits" is noise.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-accent font-bold shrink-0 text-lg leading-relaxed">2.</span>
              <span><strong className="text-fg">Subheadline (the mechanism):</strong> One sentence that explains how you deliver the outcome. Specificity here does the trust-building work. Vague subheads ("with the power of AI") destroy credibility.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-accent font-bold shrink-0 text-lg leading-relaxed">3.</span>
              <span><strong className="text-fg">Proof signal:</strong> A single, credible data point or social indicator. Number of customers, a recognisable logo, a specific result. Not a 5-star rating with no context.</span>
            </li>
            <li className="flex gap-3">
              <span className="text-accent font-bold shrink-0 text-lg leading-relaxed">4.</span>
              <span><strong className="text-fg">Primary CTA:</strong> Visible without scrolling. One action. Clear label that describes the outcome of clicking, not the mechanics ("Start my free trial" not "Submit").</span>
            </li>
            <li className="flex gap-3">
              <span className="text-accent font-bold shrink-0 text-lg leading-relaxed">5.</span>
              <span><strong className="text-fg">Trust element:</strong> A risk-reducer. A guarantee, a security badge, a "no credit card required" line. Something that lowers the perceived cost of taking the CTA action.</span>
            </li>
          </ul>
          <p className="mt-4 leading-relaxed text-fg-muted">
            If any of these five are missing or positioned below the fold, you have a structural conversion leak that no amount of targeting optimisation will fix.
          </p>
        </section>

        {/* Section 2 */}
        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">The Most Common Above-Fold Failures</h2>
          <p className="leading-relaxed text-fg-muted">
            These are the patterns that consistently show up as conversion leaks on paid traffic landing pages. They're not subtle design errors — they're structural choices that make the above-fold section do no selling work at all.
          </p>
          <ul className="mt-4 space-y-2 text-fg-muted">
            <li className="flex gap-2"><span className="text-accent font-bold shrink-0">—</span><span><strong className="text-fg">Company name as H1:</strong> "Welcome to Acme Inc." tells the visitor nothing about what they're about to get. The H1 is the most-read element on the page. Wasting it on your brand name is a first-impression failure.</span></li>
            <li className="flex gap-2 mt-2"><span className="text-accent font-bold shrink-0">—</span><span><strong className="text-fg">Generic hero image:</strong> A stock photo of a smiling team, an abstract background, or a product screenshot with no context consumes above-fold real estate without communicating anything. The image should reinforce the headline claim, not decorate it.</span></li>
            <li className="flex gap-2 mt-2"><span className="text-accent font-bold shrink-0">—</span><span><strong className="text-fg">CTA below the fold:</strong> If the user has to scroll to find out what to do next, a percentage of them won't. On mobile, a CTA that's 1200px down the page might as well not exist for cold traffic.</span></li>
            <li className="flex gap-2 mt-2"><span className="text-accent font-bold shrink-0">—</span><span><strong className="text-fg">No proof in the first viewport:</strong> A page that asks for action before it gives evidence is asking for trust it hasn't earned. Even a single, specific social proof element above the fold changes the trust calculus.</span></li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">The Fold Is Different on Every Device — You Need to Test Both</h2>
          <p className="leading-relaxed text-fg-muted">
            "Above the fold" is not a fixed pixel height. On a 375px iPhone with a browser chrome, your visible viewport might be 580px tall. On a 1024px laptop with a 72px navigation bar, it's roughly 950px. What you see as "above the fold" in your desktop design tool may be deep below the fold on the phone your traffic is using.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            The diagnostic protocol is straightforward:
          </p>
          <ul className="mt-3 space-y-2 text-fg-muted">
            <li className="flex gap-2"><span className="text-accent font-bold shrink-0">—</span><span>Open your landing page in Chrome DevTools. Set device to iPhone 12 Pro (390 × 844). Screenshot what's visible without scrolling. Do all 5 required elements appear?</span></li>
            <li className="flex gap-2"><span className="text-accent font-bold shrink-0">—</span><span>Repeat at 375px width (iPhone SE / older Android). If your layout breaks or key elements disappear, that's a specific technical fix required.</span></li>
            <li className="flex gap-2"><span className="text-accent font-bold shrink-0">—</span><span>Check 1024px width for tablet/small laptop. The CTA especially tends to disappear at tablet breakpoints due to layout reflows.</span></li>
          </ul>
          <p className="mt-4 leading-relaxed text-fg-muted">
            If your paid traffic is primarily mobile (check your analytics — most paid social is), optimise for 375–390px first. Desktop performance is secondary to the device your users are actually on.
          </p>
        </section>

        {/* Section 4 */}
        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">Visual Hierarchy: What's Bigger Gets Read First</h2>
          <p className="leading-relaxed text-fg-muted">
            The eye doesn't read a landing page — it scans it. Size, contrast, and position determine the reading order, and that reading order determines whether the above-fold section makes its argument in the right sequence.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            Audit your visual hierarchy by asking: if a user reads only the three largest elements on your above-fold section, do they understand what you do, who it's for, and what to do next? If those three largest elements are your logo, a decorative image, and a generic tagline — your hierarchy is selling nothing.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            The correct hierarchy for paid traffic landing pages is: headline → proof signal or subheadline → CTA. Everything else should be visually subordinate. Competing visual weights — multiple large elements at the same size, multiple CTAs, complex navigation — split attention and reduce the probability that the primary CTA is what the user's eye lands on.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            Simplifying the above-fold section — removing elements rather than adding them — is consistently the highest-leverage above-fold intervention for pages with visual hierarchy problems.
          </p>
        </section>

        {/* CTA section */}
        <section className="mt-6 rounded-2xl border border-accent/40 bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">Find the leak on your page</h2>
          <p className="mb-6 leading-relaxed text-fg-muted">
            Run the free Nebula audit to see exactly where your page breaks the chain from click to conversion.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/audit" className="inline-flex rounded-xl bg-accent px-6 py-3 font-semibold text-bg hover:bg-accent-light transition-colors">
              Run the free audit
            </Link>
            <Link href="/learning-centre" className="inline-flex rounded-xl border border-accent px-6 py-3 font-semibold text-accent hover:bg-accent-dim transition-colors">
              Browse all leaks
            </Link>
          </div>
        </section>

        {/* Related links */}
        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">Related leak checks</h2>
          <div className="space-y-1">
            <Link href="/learning-centre/landing-page-not-converting" className="block py-2 text-accent hover:text-accent-light transition-colors font-medium">
              → Landing Page Not Converting
            </Link>
            <Link href="/learning-centre/mobile-landing-page-leaks" className="block py-2 text-accent hover:text-accent-light transition-colors font-medium">
              → Mobile Landing Page Leaks
            </Link>
            <Link href="/learning-centre/message-match-checklist" className="block py-2 text-accent hover:text-accent-light transition-colors font-medium">
              → Message Match Checklist
            </Link>
            <Link href="/learning-centre/cta-not-working" className="block py-2 text-accent hover:text-accent-light transition-colors font-medium">
              → CTA Not Working
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
