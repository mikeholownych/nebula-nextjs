import type { Metadata } from 'next'
import Link from 'next/link'
import { createArticleSchema } from '../../lib/schema'

export const metadata: Metadata = {
  title: 'TikTok Ads Getting Views But No Sales: Fix The Landing Page | Nebula Components',
  description: "TikTok ads driving views but zero sales? The creative isn't the problem — your landing page is killing the conversion. Here's the exact disconnect to fix.",
  alternates: { canonical: 'https://nebulacomponents.shop/learning-centre/tiktok-ads-not-converting' },
}

const articleSchema = createArticleSchema({
  headline: 'TikTok Ads Getting Views But No Sales: The Landing Page Disconnect',
  description: "TikTok ads driving views but zero sales? The creative isn't the problem — your landing page is killing the conversion. Here's the exact disconnect to fix.",
  url: 'https://nebulacomponents.shop/learning-centre/tiktok-ads-not-converting',
  publishedDate: '2026-07-21',
  modifiedDate: '2026-07-21',
})

export default function TiktokAdsNotConvertingPage() {
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
            TikTok Ads Leaks · tiktok ad to landing page mismatch
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-fg md:text-5xl">
            TikTok Ads Getting Views But No Sales: The Landing Page Disconnect
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-fg-muted">
            Your TikTok ad stopped the scroll. The hook worked. The click happened. Then the page loaded — and the sale didn't. That gap between ad click and conversion isn't a targeting problem or a creative problem. It's a landing page problem, and it has a specific anatomy you can diagnose and fix.
          </p>
        </div>

        {/* Section 1 */}
        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">The Emotional State Mismatch</h2>
          <p className="leading-relaxed text-fg-muted">
            TikTok creative is engineered to spike emotional engagement — fast cuts, pattern-interrupts, social proof in the form of UGC and reactions, raw authenticity. When that ad works, the user who clicks is in a heightened state: curious, excited, maybe impulsive. They are primed to buy.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            Then they land on a page that looks like it was designed in 2019 by a corporate marketing team. Polished stock photography. A tagline that sounds like an investor pitch. A hero section that talks about the company instead of the customer's problem. That thermal shock kills the sale before the user reads a single line of copy.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            The diagnostic question here is: does your landing page feel like a natural extension of the ad, or a jarring gear-change? The visual register, the language register, and the emotional temperature all need to match. A raw UGC ad landing on a glossy brand page is a mismatch the user feels immediately, even if they can't name it.
          </p>
        </section>

        {/* Section 2 */}
        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">Mobile Speed Is the First Filter</h2>
          <p className="leading-relaxed text-fg-muted">
            TikTok is 100% mobile. Your TikTok traffic lands on a phone, on a cellular connection, often in the middle of a session. If your page doesn't render meaningfully in under 2.5 seconds, a significant portion of those clicks bounce before the page is usable — and you'll never know they were there.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            Run your landing page URL through Google PageSpeed Insights on mobile. If your LCP (Largest Contentful Paint) is above 3 seconds, that's a conversion leak disguised as a targeting problem. Common causes: uncompressed hero images, unused JavaScript blocking render, third-party scripts loading synchronously, and fonts that delay text display.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            The fix is not to build a separate TikTok landing page. The fix is to make your landing page fast enough to not punish mobile users — which is the entire TikTok audience.
          </p>
        </section>

        {/* Section 3 */}
        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">Social Proof That Actually Works for TikTok Traffic</h2>
          <p className="leading-relaxed text-fg-muted">
            TikTok users have calibrated BS detectors for polished testimonials. A headshot photo with a 5-star rating and three sentences in a grid layout reads as staged — because it usually is. TikTok traffic responds to social proof that looks and feels like the platform they just came from.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            What converts for this traffic source:
          </p>
          <ul className="mt-3 space-y-2 text-fg-muted">
            <li className="flex gap-2"><span className="text-accent font-bold shrink-0">—</span><span>Short video testimonials embedded directly on the page (not linked, embedded)</span></li>
            <li className="flex gap-2"><span className="text-accent font-bold shrink-0">—</span><span>Screenshots of real DMs, texts, or comments — unpolished, unformatted</span></li>
            <li className="flex gap-2"><span className="text-accent font-bold shrink-0">—</span><span>Specific numbers with context: "83 orders in 6 days" beats "great results"</span></li>
            <li className="flex gap-2"><span className="text-accent font-bold shrink-0">—</span><span>Proof that mirrors the exact claim made in the ad that brought them there</span></li>
          </ul>
          <p className="mt-4 leading-relaxed text-fg-muted">
            If the ad promised a specific outcome, the first piece of social proof on your page should validate that specific outcome — not a generic brand story.
          </p>
        </section>

        {/* Section 4 */}
        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">The Trust Gap for Unknown Brands</h2>
          <p className="leading-relaxed text-fg-muted">
            TikTok advertising is one of the few channels where genuinely unknown brands can interrupt a scrolling session and earn attention. But that means your landing page is often the first time a user encounters your brand at any depth. They have no prior brand equity to draw on.
          </p>
          <p className="mt-4 leading-relaxed text-fg-muted">
            The trust gap is real and the page has to close it fast. Diagnose yours by checking:
          </p>
          <ul className="mt-3 space-y-2 text-fg-muted">
            <li className="flex gap-2"><span className="text-accent font-bold shrink-0">—</span><span>Is there a money-back guarantee or risk reversal visible above the fold?</span></li>
            <li className="flex gap-2"><span className="text-accent font-bold shrink-0">—</span><span>Does the page show who is behind the brand — a real person, not just a logo?</span></li>
            <li className="flex gap-2"><span className="text-accent font-bold shrink-0">—</span><span>Are there any third-party trust signals: press mentions, platform badges, payment logos?</span></li>
            <li className="flex gap-2"><span className="text-accent font-bold shrink-0">—</span><span>Does the checkout or CTA feel secure, or does it look like a rushed Shopify default?</span></li>
          </ul>
          <p className="mt-4 leading-relaxed text-fg-muted">
            For TikTok traffic specifically, the risk reversal is often the single highest-leverage addition you can make to a page. A genuine, clearly-worded guarantee eliminates the primary objection for impulse-adjacent buyers who don't have existing trust in your brand.
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
            <Link href="/learning-centre/mobile-landing-page-leaks" className="block py-2 text-accent hover:text-accent-light transition-colors font-medium">
              → Mobile Landing Page Leaks
            </Link>
            <Link href="/learning-centre/message-match-checklist" className="block py-2 text-accent hover:text-accent-light transition-colors font-medium">
              → Message Match Checklist
            </Link>
            <Link href="/learning-centre/no-testimonials-on-landing-page" className="block py-2 text-accent hover:text-accent-light transition-colors font-medium">
              → No Testimonials on Your Landing Page
            </Link>
            <Link href="/learning-centre/landing-page-not-converting" className="block py-2 text-accent hover:text-accent-light transition-colors font-medium">
              → Landing Page Not Converting
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
