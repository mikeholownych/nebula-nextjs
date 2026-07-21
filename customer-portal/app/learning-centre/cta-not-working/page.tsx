import type { Metadata } from 'next'
import Link from 'next/link'
import { createArticleSchema } from '../../lib/schema'

export const metadata: Metadata = {
  title: 'CTA Not Working? Fix Commitment, Clarity, And Timing | Nebula',
  description: 'Your CTA fails when it asks for more than the page has earned. Learn the 4 CTA failure modes, the commitment ladder, and the copy formula that converts.',
  alternates: { canonical: 'https://nebulacomponents.shop/learning-centre/cta-not-working' },
}

const articleSchema = createArticleSchema({
  headline: 'CTA Not Working? Fix Commitment, Clarity, And Timing',
  description: 'Your CTA fails when it asks for more than the page has earned. Learn the 4 CTA failure modes, the commitment ladder, and the copy formula that converts.',
  url: 'https://nebulacomponents.shop/learning-centre/cta-not-working',
  publishedDate: '2026-07-21',
  modifiedDate: '2026-07-21',
})

export default function CtaNotWorkingPage() {
  return (
    <main id="main-content" className="min-h-screen bg-bg pt-[72px]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <div className="mx-auto max-w-3xl px-6 py-14">
        <Link href="/learning-centre" className="text-sm font-semibold text-accent hover:text-accent-light transition-colors">
          ← Learning Centre
        </Link>

        <div className="mt-8 rounded-2xl border border-border bg-bg-panel p-8 md:p-10">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-accent">Conversion Copy · CTA Optimisation</p>
          <h1 className="text-3xl font-bold tracking-tight text-fg md:text-5xl">
            CTA Not Working? Fix Commitment, Clarity, And Timing
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-fg-muted">
            A broken CTA is almost never a button-colour problem. It's a commitment mismatch — your page asked for more trust than it had built. Here's how to diagnose the exact failure mode and fix it.
          </p>
        </div>

        {/* Section 1 */}
        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">Why CTAs Fail: The Commitment Mismatch</h2>
          <p className="mb-4 leading-relaxed text-fg-muted">
            Every CTA is a request. You're asking a stranger — someone who arrived at your page seconds ago — to hand over their email, their time, or their money. Whether they comply depends almost entirely on one thing: whether the page has built enough trust to justify what you're asking.
          </p>
          <p className="mb-4 leading-relaxed text-fg-muted">
            Most landing pages get this wrong in the same direction. They ask for a demo call before showing a single proof point. They ask for a $297 purchase before the visitor has read one testimonial. They display a 'Buy Now' button at the top of the page, before the visitor knows what the product even does. The button itself is fine. The sequence is broken.
          </p>
          <p className="leading-relaxed text-fg-muted">
            Commitment mismatch is the root cause behind most CTA failures. Before you change button colours or A/B test copy, you need to audit whether your page has actually earned the ask you're making.
          </p>
        </section>

        {/* Section 2 */}
        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">The 4 CTA Failure Modes</h2>
          <p className="mb-4 leading-relaxed text-fg-muted">
            When a CTA underperforms, it's almost always one of four things. Identify which failure mode you're dealing with before making any changes.
          </p>
          <ul className="space-y-4 text-fg-muted">
            <li className="leading-relaxed">
              <span className="font-semibold text-fg">1. Wrong timing.</span> The CTA appears before the page has delivered proof. Visitors land, see a 'Book a call' button in the first screen, and leave — not because they don't want your offer, but because they haven't been given a reason to say yes yet. Proof must precede the ask.
            </li>
            <li className="leading-relaxed">
              <span className="font-semibold text-fg">2. Wrong copy.</span> 'Submit', 'Click here', 'Start' — these words communicate nothing about what happens next. They create friction because the visitor has to guess the outcome. Outcome-specific copy like 'Get my free leak report' removes the guesswork and converts significantly better.
            </li>
            <li className="leading-relaxed">
              <span className="font-semibold text-fg">3. Wrong commitment level.</span> Asking a cold visitor to book a 45-minute demo call is a high-commitment ask. They don't know you. A free report, a quick audit, a 15-minute call — these are easier first steps that match the trust level of a first visit.
            </li>
            <li className="leading-relaxed">
              <span className="font-semibold text-fg">4. Wrong visual contrast.</span> A button that disappears into the page — same colour as surrounding elements, too small on mobile, no visual weight — won't get clicked even by motivated visitors. The primary CTA needs to be the most visually prominent interactive element on the page.
            </li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">The Commitment Ladder: Match Your Ask to Traffic Temperature</h2>
          <p className="mb-4 leading-relaxed text-fg-muted">
            Not all visitors are equal. Someone clicking a retargeting ad who's visited your site three times is in a very different state than someone who found you from a cold Meta ad. Your CTA should reflect where that visitor sits on the commitment ladder — not where you'd like them to be.
          </p>
          <p className="mb-4 leading-relaxed text-fg-muted">
            <span className="font-semibold text-fg">Cold traffic</span> (first visit, paid social, cold outreach): The appropriate ask is low-friction and value-first. Name + email in exchange for a specific deliverable — a report, an audit, a score, a checklist. The visitor needs a reason to hand over anything, so the offer has to be concrete and the effort minimal.
          </p>
          <p className="mb-4 leading-relaxed text-fg-muted">
            <span className="font-semibold text-fg">Warm traffic</span> (retargeting, email list, returning visitor): They've seen your brand before. A 15-minute discovery call or a low-price entry product is now appropriate. They have baseline trust. You can ask for more time or a small financial commitment.
          </p>
          <p className="leading-relaxed text-fg-muted">
            <span className="font-semibold text-fg">Hot traffic</span> (referral, high-intent search, existing lead): These visitors are comparison-shopping or ready to buy. A 'Buy now' or 'Start today' CTA with clear pricing and risk reversal (money-back guarantee, free trial) is appropriate. Don't make them fill in another lead form — get out of their way.
          </p>
        </section>

        {/* Section 4 */}
        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">CTA Copy Formula: Action + Outcome + Risk Reducer</h2>
          <p className="mb-4 leading-relaxed text-fg-muted">
            The single highest-leverage CTA improvement is almost always the copy. Generic verbs ('Submit', 'Go', 'Start') say nothing about what happens next. The formula that consistently outperforms is: <span className="font-semibold text-fg">[Action verb] + [specific outcome] + [risk reducer]</span>.
          </p>
          <p className="mb-4 leading-relaxed text-fg-muted">
            The action verb tells the visitor what to do. The specific outcome tells them what they get. The risk reducer removes the hesitation. Combined, the CTA becomes a micro-promise rather than a command.
          </p>
          <ul className="space-y-3 text-fg-muted">
            <li className="leading-relaxed"><span className="font-semibold text-fg">'Submit'</span> → <span className="text-accent font-semibold">'Get my free leak report'</span></li>
            <li className="leading-relaxed"><span className="font-semibold text-fg">'Start'</span> → <span className="text-accent font-semibold">'See my conversion score — free'</span></li>
            <li className="leading-relaxed"><span className="font-semibold text-fg">'Buy now'</span> → <span className="text-accent font-semibold">'Fix my page in 7 days — $97'</span></li>
            <li className="leading-relaxed"><span className="font-semibold text-fg">'Book a call'</span> → <span className="text-accent font-semibold">'Book a 15-min audit call — no pitch'</span></li>
          </ul>
          <p className="mt-4 leading-relaxed text-fg-muted">
            Notice that the better versions are specific. They name the deliverable, the timeframe, or the price. Specificity reduces friction because it removes guesswork about what happens after the click.
          </p>
        </section>

        {/* Section 5 */}
        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">The One CTA Rule</h2>
          <p className="mb-4 leading-relaxed text-fg-muted">
            Every competing link, secondary CTA, or navigation item on a landing page pulls attention away from your primary action. Research on attention and decision-making is consistent: more choices reduce the probability of any choice being made. On a landing page, this effect is compounding.
          </p>
          <p className="mb-4 leading-relaxed text-fg-muted">
            A rough working rule: each additional clickable element on a conversion-focused page dilutes the primary CTA by approximately 10%. A page with a primary CTA, a secondary CTA, a 'Learn more' link, a navigation bar, and a footer menu has significantly fragmented the visitor's attention before they've even decided whether they want what you're offering.
          </p>
          <p className="leading-relaxed text-fg-muted">
            Strip the page to one action. Remove navigation. Remove secondary buttons. Remove 'learn more' links. If you need to keep a secondary option for warm visitors (like 'See how it works'), make it visually subordinate — a text link or ghost button, never the same weight as the primary CTA. One page, one goal.
          </p>
        </section>

        {/* Section 6 */}
        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">Quick Wins Checklist</h2>
          <p className="mb-4 leading-relaxed text-fg-muted">
            If you need to prioritise, start with the items that have the highest conversion impact with the lowest implementation effort.
          </p>
          <ul className="space-y-3 text-fg-muted">
            <li className="flex gap-3 leading-relaxed"><span className="mt-1 text-accent font-bold">→</span><span><span className="font-semibold text-fg">Visual contrast.</span> Your primary CTA button must stand out against the page background. If you have to look for it, visitors won't find it.</span></li>
            <li className="flex gap-3 leading-relaxed"><span className="mt-1 text-accent font-bold">→</span><span><span className="font-semibold text-fg">Outcome copy.</span> Replace generic verbs with specific deliverables. What does the visitor get when they click?</span></li>
            <li className="flex gap-3 leading-relaxed"><span className="mt-1 text-accent font-bold">→</span><span><span className="font-semibold text-fg">Proof above the CTA.</span> At least one testimonial, result, or trust signal should appear before the primary CTA. Don't ask before you've demonstrated.</span></li>
            <li className="flex gap-3 leading-relaxed"><span className="mt-1 text-accent font-bold">→</span><span><span className="font-semibold text-fg">Single CTA per page.</span> Remove competing links and secondary actions. One page, one goal.</span></li>
            <li className="flex gap-3 leading-relaxed"><span className="mt-1 text-accent font-bold">→</span><span><span className="font-semibold text-fg">Mobile tap target.</span> The button must be at minimum 44×44px on mobile — Apple's HIG standard. Small buttons kill mobile conversion rates.</span></li>
            <li className="flex gap-3 leading-relaxed"><span className="mt-1 text-accent font-bold">→</span><span><span className="font-semibold text-fg">Risk reducer in copy or beneath button.</span> A line like 'No credit card required' or 'Free — takes 2 minutes' immediately below the button reduces hesitation at the moment of decision.</span></li>
          </ul>
        </section>

        {/* CTA Section */}
        <section className="mt-6 rounded-2xl border border-accent/40 bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">Find the leak on your page</h2>
          <p className="mb-6 leading-relaxed text-fg-muted">
            Run the free Nebula audit to see exactly where your page breaks the chain from click to conversion.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/audit" className="inline-flex rounded-xl bg-accent px-6 py-3 font-semibold text-bg hover:bg-accent-light transition-colors">
              Run the free audit
            </Link>
            <Link href="/learning-centre/paid-traffic-leak-map" className="inline-flex rounded-xl border border-accent px-6 py-3 font-semibold text-accent hover:bg-accent-dim transition-colors">
              Open leak map
            </Link>
          </div>
        </section>

        {/* Related Links */}
        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">Related leak checks</h2>
          <div className="space-y-1">
            <Link href="/learning-centre/proof-before-cta" className="block py-2 text-accent hover:text-accent-light transition-colors font-medium">
              → Why proof must come before your CTA
            </Link>
            <Link href="/learning-centre/landing-page-not-converting" className="block py-2 text-accent hover:text-accent-light transition-colors font-medium">
              → Landing page not converting: full diagnosis
            </Link>
            <Link href="/learning-centre/traffic-but-no-form-fills" className="block py-2 text-accent hover:text-accent-light transition-colors font-medium">
              → Traffic but no form fills: where the drop-off happens
            </Link>
            <Link href="/learning-centre/message-match-checklist" className="block py-2 text-accent hover:text-accent-light transition-colors font-medium">
              → Message match checklist: ad to page alignment
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
