import type { Metadata } from 'next'
import Link from 'next/link'
import { createArticleSchema } from '../../lib/schema'
import ArticleFaq from '../ArticleFaq'

export const metadata: Metadata = {
  title: 'TikTok Ads Getting Views But No Sales: Fix The Landing Page | Nebula Components',
  description: "TikTok ads driving views but zero sales? The creative isn't the problem - your landing page may be blocking the conversion. Here's the structural disconnect to fix.",
  alternates: { canonical: 'https://nebulacomponents.com/learning-centre/tiktok-ads-not-converting' },
}

const articleSchema = createArticleSchema({
  headline: 'Fix TikTok Landing Page Disconnects to Transform Views Into Sales',
  description: "TikTok ads driving views but zero sales? The creative isn't the problem - your landing page may be blocking the conversion. Here's the structural disconnect to fix.",
  url: 'https://nebulacomponents.com/learning-centre/tiktok-ads-not-converting',
  publishedDate: '2026-07-21',
  modifiedDate: '2026-07-21',
})

export default function TiktokAdsNotConvertingPage() {
  return (
    <main id="main-content" className="min-h-screen bg-bg pt-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <div className="mx-auto max-w-3xl px-6 py-14">
        <Link href="/learning-centre" className="text-sm font-semibold text-accent hover:text-fg transition-colors">
          ← Learning Centre
        </Link>

        {/* Hero card */}
        <div className="mt-8 rounded-md border border-border bg-bg-panel p-8 md:p-10">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-accent">
            TikTok Ads Leaks · tiktok ad to landing page mismatch
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-fg md:text-5xl">
            Fix TikTok Landing Page Disconnects to Transform Views Into Sales
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-fg-muted">
            Your TikTok ad stopped the scroll. The hook worked. The click happened. Then the page loaded - and the sale didn't. That gap between ad click and conversion isn't a targeting problem or a creative problem. It's a landing page problem, and it has a specific anatomy you can diagnose and fix.
          </p>
            <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Link
                href="/audit?utm_source=learning-centre-tiktok-ads-not-converting&utm_medium=hero-cta"
                className="inline-flex min-h-[44px] items-center justify-center rounded bg-accent px-6 py-3 text-sm font-semibold text-bg transition-opacity hover:opacity-85"
              >
                Get your free audit →
              </Link>
              <Link
                href="/repair-sprint"
                className="inline-flex min-h-[44px] items-center justify-center rounded border border-border px-5 py-3 text-sm font-medium text-fg-muted transition-colors hover:border-fg-muted hover:text-fg"
              >
                Explore $97 Repair Sprint
              </Link>
            </div>
        </div>

        {/* Section 1 */}
        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">The Emotional State Mismatch</h2>
          <p className="leading-relaxed text-fg-muted">
            TikTok creative is engineered to spike emotional engagement - fast cuts, pattern-interrupts, social proof in the form of UGC and reactions, raw authenticity. When that ad works, the user who clicks is in a heightened state: curious, excited, maybe impulsive. They are primed to buy.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            Then they land on a page that looks like it was designed in 2019 by a corporate marketing team. Polished stock photography. A tagline that sounds like an investor pitch. A hero section that talks about the company instead of the customer's problem. That thermal shock kills the sale before the user reads a single line of copy.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            The diagnostic question here is: does your landing page feel like a natural extension of the ad, or a jarring gear-change? The visual register, the language register, and the emotional temperature all need to match. A raw UGC ad landing on a glossy brand page is a mismatch the user feels immediately, even if they can't name it.
          </p>
        </section>

        {/* Section 2 */}
        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">Mobile Speed Is the First Filter</h2>
          <p className="leading-relaxed text-fg-muted">
            TikTok is 100% mobile. Your TikTok traffic lands on a phone, on a cellular connection, often in the middle of a session. If your page doesn't render meaningfully in under 2.5 seconds, a significant portion of those clicks bounce before the page is usable - and you'll never know they were there.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            Run your landing page URL through Google PageSpeed Insights on mobile. If your LCP (Largest Contentful Paint) is above 3 seconds, that's a conversion leak disguised as a targeting problem. Common causes: uncompressed hero images, unused JavaScript blocking render, third-party scripts loading synchronously, and fonts that delay text display.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            The fix is not to build a separate TikTok landing page. The fix is to make your landing page fast enough to not punish mobile users - which is the entire TikTok audience.
          </p>
        </section>

        {/* Section 3 */}
        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">Social Proof That Actually Works for TikTok Traffic</h2>
          <p className="leading-relaxed text-fg-muted">
            TikTok users have calibrated BS detectors for polished testimonials. A headshot photo with a 5-star rating and three sentences in a grid layout reads as staged - because it usually is. TikTok traffic responds to social proof that looks and feels like the platform they just came from.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            What converts for this traffic source:
          </p>
          <ul className="mt-3 space-y-2 text-fg-muted">
            <li className="flex gap-2"><span className="text-accent font-bold shrink-0">-</span><span>Short video testimonials embedded directly on the page (not linked, embedded)</span></li>
            <li className="flex gap-2"><span className="text-accent font-bold shrink-0">-</span><span>Screenshots of real DMs, texts, or comments - unpolished, unformatted</span></li>
            <li className="flex gap-2"><span className="text-accent font-bold shrink-0">-</span><span>Specific numbers with context: "83 orders in 6 days" beats "great results"</span></li>
            <li className="flex gap-2"><span className="text-accent font-bold shrink-0">-</span><span>Proof that mirrors the exact claim made in the ad that brought them there</span></li>
          </ul>
          <p className="mt-4 leading-relaxed text-fg-muted">
            If the ad promised a specific outcome, the first piece of social proof on your page should validate that specific outcome - not a generic brand story.
          </p>
        </section>

        {/* Section 4 */}
        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">The Trust Gap for Unknown Brands</h2>
          <p className="leading-relaxed text-fg-muted">
            TikTok advertising is one of the few channels where genuinely unknown brands can interrupt a scrolling session and earn attention. But that means your landing page is often the first time a user encounters your brand at any depth. They have no prior brand equity to draw on.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            The trust gap is real and the page has to close it fast. Diagnose yours by checking:
          </p>
          <ul className="mt-3 space-y-2 text-fg-muted">
            <li className="flex gap-2"><span className="text-accent font-bold shrink-0">-</span><span>Is there a money-back guarantee or risk reversal visible above the fold?</span></li>
            <li className="flex gap-2"><span className="text-accent font-bold shrink-0">-</span><span>Does the page show who is behind the brand - a real person, not just a logo?</span></li>
            <li className="flex gap-2"><span className="text-accent font-bold shrink-0">-</span><span>Are there any third-party trust signals: press mentions, platform badges, payment logos?</span></li>
            <li className="flex gap-2"><span className="text-accent font-bold shrink-0">-</span><span>Does the checkout or CTA feel secure, or does it look like a rushed Shopify default?</span></li>
          </ul>
          <p className="mt-4 leading-relaxed text-fg-muted">
            For TikTok traffic specifically, the risk reversal is often the single highest-leverage addition you can make to a page. A genuine, clearly-worded guarantee eliminates the primary objection for impulse-adjacent buyers who don't have existing trust in your brand.
          </p>
        </section>

        <ArticleFaq
          faqItems={[
            {
              question: 'Why do my TikTok ads get views but no sales?',
              answer: 'The gap is usually on the landing page, not in the creative or targeting. TikTok creative spikes emotional engagement, and when the click lands on a page that feels like a jarring gear-change, the sale dies before the visitor reads a line of copy.',
            },
            {
              question: 'How fast does my landing page need to be for TikTok traffic?',
              answer: 'TikTok is effectively 100% mobile, so your page should render meaningfully in under 2.5 seconds. Check your LCP in Google PageSpeed Insights on mobile. An LCP above 3 seconds is a conversion leak disguised as a targeting problem.',
            },
            {
              question: 'What kind of social proof works for TikTok traffic?',
              answer: 'TikTok users are calibrated to distrust polished testimonials. Short embedded video testimonials, screenshots of real DMs or comments, and specific numbers with context all outperform staged headshot grids. The first proof should validate the exact claim your ad made.',
            },
            {
              question: 'How do I close the trust gap for an unknown brand?',
              answer: 'Show a money-back guarantee or risk reversal above the fold, reveal the real person behind the brand, and add third-party trust signals. For TikTok traffic, a clearly-worded guarantee is often the single highest-leverage addition because it removes the primary objection for impulse-adjacent buyers.',
            },
          ]}
        />

        {/* CTA section */}
        <section className="mt-6 rounded-2xl border border-accent/40 bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">Find the leak on your page</h2>
          <p className="mb-6 leading-relaxed text-fg-muted">
            Run the free Nebula audit to see exactly where your page breaks the chain from click to conversion.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/audit?utm_source=learning-centre&utm_medium=organic-content" className="inline-flex rounded bg-accent px-6 py-3 font-semibold text-bg hover:opacity-85 hover:bg-accent transition-colors">
              Run the free audit
            </Link>
            <Link href="/learning-centre" className="inline-flex rounded border border-accent px-6 py-3 font-semibold text-accent hover:bg-accent-dim transition-colors">
              Browse all leaks
            </Link>
          </div>
        </section>

        {/* Related links */}
        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">Related leak checks</h2>
          <div className="space-y-1">
            <Link href="/learning-centre/mobile-landing-page-leaks" className="block py-2 text-accent hover:text-fg transition-colors font-medium">
              → Mobile Landing Page Leaks
            </Link>
            <Link href="/learning-centre/message-match-checklist" className="block py-2 text-accent hover:text-fg transition-colors font-medium">
              → Message Match Checklist
            </Link>
            <Link href="/learning-centre/proof-before-cta" className="block py-2 text-accent hover:text-fg transition-colors font-medium">
              → Proof Before CTA: The Simple Fix Most Landing Pages Miss
            </Link>
            <Link href="/learning-centre/landing-page-not-converting" className="block py-2 text-accent hover:text-fg transition-colors font-medium">
              → Landing Page Not Converting
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
