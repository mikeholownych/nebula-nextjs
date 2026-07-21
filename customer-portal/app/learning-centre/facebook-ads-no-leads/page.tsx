import type { Metadata } from 'next'
import Link from 'next/link'
import { createArticleSchema } from '../../lib/schema'

export const metadata: Metadata = {
  title: 'Facebook Ads Getting Clicks But No Leads: The Page Broke The Chain | Nebula',
  description: 'High CTR, zero conversions? The ad isn\'t the problem — your landing page broke the chain. Learn how Meta\'s context switch kills cold traffic and how to fix it.',
  alternates: { canonical: 'https://nebulacomponents.shop/learning-centre/facebook-ads-no-leads' },
}

const articleSchema = createArticleSchema({
  headline: 'Facebook Ads Getting Clicks But No Leads: The Page Broke The Chain',
  description: 'High CTR, zero conversions? The ad isn\'t the problem — your landing page broke the chain. Learn how Meta\'s context switch kills cold traffic and how to fix it.',
  url: 'https://nebulacomponents.shop/learning-centre/facebook-ads-no-leads',
  publishedDate: '2026-07-21',
  modifiedDate: '2026-07-21',
})

export default function FacebookAdsNoLeadsPage() {
  return (
    <main id="main-content" className="min-h-screen bg-bg pt-[72px]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      <div className="mx-auto max-w-3xl px-6 py-14">
        <Link href="/learning-centre" className="text-sm font-semibold text-accent hover:text-accent-light transition-colors">
          ← Learning Centre
        </Link>

        <div className="mt-8 rounded-2xl border border-border bg-bg-panel p-8 md:p-10">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-accent">Meta Ads Leaks · Facebook Ads</p>
          <h1 className="text-3xl font-bold tracking-tight text-fg md:text-5xl">
            Facebook Ads Getting Clicks But No Leads: The Page Broke The Chain
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-fg-muted">
            If your Meta ads are generating clicks but the leads never materialise, the ad almost certainly isn't the problem. The landing page is where the chain breaks — and it breaks in a predictable set of ways.
          </p>
        </div>

        {/* Section 1 */}
        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">The Facebook-to-Landing-Page Transition Shock</h2>
          <p className="mb-4 leading-relaxed text-fg-muted">
            Facebook and Instagram are passive scroll environments. People are not there to evaluate products. They're looking at photos of people they know, watching short videos, or following a news thread. When your ad interrupts that experience, you've created a pattern-break — and if it's compelling enough, they click.
          </p>
          <p className="mb-4 leading-relaxed text-fg-muted">
            That click is a sudden context switch from entertainment to evaluation. The visitor goes from a warm, familiar social feed to a completely unfamiliar landing page. They're now in a different mental mode. They're asking: what is this, can I trust it, is this worth my time? You have approximately three seconds to answer those questions before they hit the back button and return to the scroll.
          </p>
          <p className="leading-relaxed text-fg-muted">
            Most landing pages fail this test not because they're badly designed in isolation, but because they don't account for the emotional state the visitor arrived in. The page must catch that state and sustain it — not reset it. The gap between where the ad left the visitor and where the page picks them up is where most Meta ad spend goes to die.
          </p>
        </section>

        {/* Section 2 */}
        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">The Message Match Problem on Meta</h2>
          <p className="mb-4 leading-relaxed text-fg-muted">
            Meta ads work by pattern-breaking the feed. A strong ad creates a specific tone, makes a specific promise, and shows a specific visual style. The visitor clicked because something in that combination resonated. When they arrive on the landing page, they're looking — consciously or not — for confirmation that they're in the right place.
          </p>
          <p className="mb-4 leading-relaxed text-fg-muted">
            Message match is the degree of continuity between the ad and the landing page. It's not just about repeating the same headline — it's about maintaining the same tone, visual energy, and implied promise. A warm, conversational video ad that lands on a cold, corporate-looking page creates immediate dissonance. The visitor's subconscious registers a mismatch and the trust that the ad had built evaporates.
          </p>
          <p className="leading-relaxed text-fg-muted">
            The practical fix is to design your landing page and your ad as a single unit. Use the same imagery style. Echo the ad's headline in the page's H1. If the ad is casual and direct, the page must be casual and direct. If the ad showed a specific outcome ('Stop losing leads to your landing page'), the page should lead with that same outcome — not a generic brand statement. Continuity is trust.
          </p>
        </section>

        {/* Section 3 */}
        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">The Trust Gap: Meta Traffic Is Cold</h2>
          <p className="mb-4 leading-relaxed text-fg-muted">
            There's a fundamental difference between Google search traffic and Meta traffic that most advertisers underestimate. Google visitors have declared intent — they typed a query that tells you exactly what they're looking for. Meta visitors have done no such thing. They were living their lives and your ad interrupted them. They have no prior relationship with your brand and no expressed need.
          </p>
          <p className="mb-4 leading-relaxed text-fg-muted">
            This means Meta landing pages need more proof than most pages, not less. Visitors from Facebook and Instagram require more convincing than a warm lead or a high-intent search visitor. If your landing page was built for warm traffic — light on testimonials, assumes some brand familiarity, leads with features rather than outcomes — it will consistently underperform on cold Meta traffic.
          </p>
          <p className="mb-4 leading-relaxed text-fg-muted">
            The minimum proof floor for a Meta landing page is: at least one or two testimonials visible above the fold, a real face or person in the first screen (anonymised corporate stock photography actively reduces trust), and recognisable logos or credentials if your market responds to authority signals. These elements don't need to be elaborate — a name, a photo, and a specific result is enough — but they need to be present before the visitor reaches any form or CTA.
          </p>
          <p className="leading-relaxed text-fg-muted">
            The goal is to compress the trust-building timeline. In a normal sales process, trust develops over multiple touchpoints. On a landing page, you have one shot. Front-load the evidence.
          </p>
        </section>

        {/* Section 4 */}
        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">Lead Forms vs Landing Pages: Choosing the Right Friction</h2>
          <p className="mb-4 leading-relaxed text-fg-muted">
            Meta's native Lead Ads — where the form lives inside Facebook rather than on a separate landing page — are worth understanding before assuming your landing page is always the right tool. Lead Forms reduce friction by pre-filling the visitor's data from their Facebook profile. They convert at higher volume. The trade-off is quality: leads who fill in a form without leaving Facebook often have lower intent and lower qualification rates.
          </p>
          <p className="mb-4 leading-relaxed text-fg-muted">
            A dedicated landing page adds friction — the visitor has to click through, wait for a page to load, and read before they decide to act. That friction filters for intent. Visitors who convert through a landing page are typically warmer and more serious than those who hit a pre-filled Lead Form. They've demonstrated a willingness to invest attention.
          </p>
          <p className="leading-relaxed text-fg-muted">
            Neither approach is universally correct. The question is what your follow-up process can handle. If you have a high-volume, low-touch nurture sequence (email automation, SMS follow-up), Lead Forms may serve you better on volume. If your follow-up involves human outreach — sales calls, personalised demos — a landing page that qualifies through friction will give you better conversations. Match the friction level to the quality of lead your process requires.
          </p>
        </section>

        {/* Section 5 */}
        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">Diagnosing the Leak: Is the Ad Working or Is the Page Failing?</h2>
          <p className="mb-4 leading-relaxed text-fg-muted">
            Before you change your landing page, confirm that it is actually the leak. Meta's ad analytics give you the data to make this call precisely, and acting on the wrong diagnosis is expensive.
          </p>
          <p className="mb-4 leading-relaxed text-fg-muted">
            The diagnostic split is straightforward. Click-through rate (CTR) measures whether the ad is compelling enough to interrupt the scroll. Conversion rate (CVR) measures whether the landing page converts the interest the ad created. These are separate problems with separate fixes.
          </p>
          <ul className="space-y-3 text-fg-muted">
            <li className="flex gap-3 leading-relaxed"><span className="mt-1 text-accent font-bold">→</span><span><span className="font-semibold text-fg">CTR above 1%, CVR below 1%:</span> The ad is working. People are interested enough to click. The landing page is the leak — it's failing to maintain the state the ad created.</span></li>
            <li className="flex gap-3 leading-relaxed"><span className="mt-1 text-accent font-bold">→</span><span><span className="font-semibold text-fg">CTR below 0.5%:</span> The ad creative needs attention before the landing page. Low CTR means the interruption isn't compelling enough — wrong audience, weak hook, or poor creative.</span></li>
            <li className="flex gap-3 leading-relaxed"><span className="mt-1 text-accent font-bold">→</span><span><span className="font-semibold text-fg">High bounce rate (above 70%) within 3 seconds:</span> Message mismatch. Visitors are landing and immediately registering that they're in the wrong place.</span></li>
          </ul>
          <p className="mt-4 leading-relaxed text-fg-muted">
            Fix the correct layer first. Improving a landing page won't help if the ad isn't generating clicks. Improving the ad won't help if the landing page destroys the trust the ad built.
          </p>
        </section>

        {/* Section 6 */}
        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">Quick Fixes for Meta Landing Pages</h2>
          <p className="mb-4 leading-relaxed text-fg-muted">
            Once you've confirmed the page is the leak, these are the highest-impact changes to implement first — roughly ordered by effort-to-impact ratio.
          </p>
          <ul className="space-y-3 text-fg-muted">
            <li className="flex gap-3 leading-relaxed"><span className="mt-1 text-accent font-bold">→</span><span><span className="font-semibold text-fg">Match the hero image style to the ad creative.</span> If the ad showed a real person in a casual setting, the landing page should open with the same visual register — not a polished studio product shot.</span></li>
            <li className="flex gap-3 leading-relaxed"><span className="mt-1 text-accent font-bold">→</span><span><span className="font-semibold text-fg">Repeat the exact ad headline on the page.</span> Don't make the visitor re-orient. The first thing they read should echo the reason they clicked.</span></li>
            <li className="flex gap-3 leading-relaxed"><span className="mt-1 text-accent font-bold">→</span><span><span className="font-semibold text-fg">Add proof before the form.</span> A minimum of one testimonial with a name, photo, and specific result should appear above or immediately adjacent to the form. Generic five-star ratings without context don't count.</span></li>
            <li className="flex gap-3 leading-relaxed"><span className="mt-1 text-accent font-bold">→</span><span><span className="font-semibold text-fg">Reduce form fields.</span> Every additional field reduces conversion rate. For cold Meta traffic, ask for the minimum: name and email. Qualify further via follow-up, not the form itself.</span></li>
            <li className="flex gap-3 leading-relaxed"><span className="mt-1 text-accent font-bold">→</span><span><span className="font-semibold text-fg">Rewrite the button copy.</span> 'Submit' or 'Sign up' say nothing. 'Get my free report', 'See my conversion score', 'Send me the guide' — outcome-specific copy converts consistently better on cold traffic.</span></li>
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
            <Link href="/learning-centre/message-match-checklist" className="block py-2 text-accent hover:text-accent-light transition-colors font-medium">
              → Message match checklist: ad to page alignment
            </Link>
            <Link href="/learning-centre/no-testimonials-on-landing-page" className="block py-2 text-accent hover:text-accent-light transition-colors font-medium">
              → No testimonials on your landing page: what it's costing you
            </Link>
            <Link href="/learning-centre/traffic-but-no-form-fills" className="block py-2 text-accent hover:text-accent-light transition-colors font-medium">
              → Traffic but no form fills: where the drop-off happens
            </Link>
            <Link href="/learning-centre/retargeting-ads-not-converting" className="block py-2 text-accent hover:text-accent-light transition-colors font-medium">
              → Retargeting ads not converting: why warm traffic still bounces
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
