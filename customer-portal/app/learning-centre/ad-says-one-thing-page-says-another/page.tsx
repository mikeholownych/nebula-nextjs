import type { Metadata } from 'next'
import Link from 'next/link'
import { createArticleSchema } from '../../lib/schema'

export const metadata: Metadata = {
  title: 'Your Ad Says One Thing and Your Page Says Something Else: The Invisible Conversion Killer',
  description: "Message match failure can make paid clicks feel disconnected from the landing page. Inspect the handoff and test a focused H1 correction before redesigning.",
  alternates: {
    canonical: 'https://nebulacomponents.com/learning-centre/ad-says-one-thing-page-says-another',
  },
}

const articleSchema = createArticleSchema({
  headline: 'Fix Ad and Landing Page Mismatch to Stop Wasting Paid Traffic',
  description: "Message match failure can make paid clicks feel disconnected from the landing page. Inspect the handoff and test a focused H1 correction before redesigning.",
  url: 'https://nebulacomponents.com/learning-centre/ad-says-one-thing-page-says-another',
  publishedDate: '2026-07-25',
  modifiedDate: '2026-07-25',
})

export default function AdSaysOneThingPageSaysAnotherPage() {
  return (
    <main id="main-content" className="min-h-screen bg-bg pt-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      <div className="mx-auto max-w-3xl px-4 pb-24">

        {/* Header */}
        <div className="mb-8">
          <Link
            href="/learning-centre"
            className="text-sm text-accent hover:underline"
          >
            ← Learning Centre
          </Link>
          <div className="mt-4 inline-block rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
            Message Match
          </div>
          <h1 className="mt-4 text-3xl font-bold leading-tight text-fg sm:text-4xl">
            Fix Ad and Landing Page Mismatch to Stop Wasting Paid Traffic
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-fg-muted">
            Your ad clicks are coming in. Your page looks polished. But conversions are flat. In most cases the culprit is not your offer, your design, or your targeting - it is a silent break in the thread between what your ad promises and what your page delivers.
          </p>
            <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Link
                href="/audit?utm_source=learning-centre-ad-says-one-thing-page-says-another&utm_medium=hero-cta"
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
          <h2 className="mb-4 text-xl font-semibold text-fg">What Message Match Actually Is</h2>
          <p className="mb-4 leading-relaxed text-fg-muted">
            Message match is not keyword repetition. It is not simply making sure the word in your ad headline appears somewhere on your landing page. That misunderstanding leads marketers to optimise the wrong thing - sprinkling copy triggers across the page while the visitor still feels a jarring discontinuity the moment they arrive.
          </p>
          <p className="mb-4 leading-relaxed text-fg-muted">
            Real message match is <strong className="text-fg">emotional and contextual continuity</strong>. When a visitor clicks your ad, they carry a mental model with them: a specific expectation of tone, an emotional state shaped by the ad, and an implicit promise about what they are about to see. Message match means your page receives that visitor where they are - not where you wish they were.
          </p>
          <p className="mb-4 leading-relaxed text-fg-muted">
            Think of it as handing off a baton in a relay race. The ad accelerates the runner. The page needs to catch that momentum without breaking stride. A mismatch does not just slow the visitor down - it stops them completely, because the cognitive cost of reorienting is higher than the reward of continuing.
          </p>
        </section>

        {/* Section 2 */}
        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-xl font-semibold text-fg">The Three Ways Ads and Pages Diverge</h2>
          <p className="mb-4 leading-relaxed text-fg-muted">
            Message match failures are not random. They cluster into three predictable patterns, each with a distinct mechanism and a distinct fix.
          </p>

          <h3 className="mb-2 text-base font-semibold text-fg">1. Tone Mismatch</h3>
          <p className="mb-4 leading-relaxed text-fg-muted">
            Your ad is urgent, casual, and conversational. "Stop wasting budget on ads that do not convert - fix it today." The visitor arrives on a page that opens with: "Welcome to our comprehensive suite of conversion optimisation solutions." The emotional register has shifted from a friend giving direct advice to a vendor presenting credentials. The visitor feels the seam. Urgency collapses into formality and the momentum you bought with your ad spend evaporates.
          </p>

          <h3 className="mb-2 text-base font-semibold text-fg">2. Offer Mismatch</h3>
          <p className="mb-4 leading-relaxed text-fg-muted">
            Your ad promotes a free landing page audit. The visitor arrives on your homepage, which leads with your agency services, your case studies, and a contact form. The audit is buried three scrolls down. The visitor expected to land on the audit - instead they landed on your brand story. The specific promise of the ad and the dominant offer of the page are different things, and the visitor has to do mental work to reconcile them. Most will not bother.
          </p>

          <h3 className="mb-2 text-base font-semibold text-fg">3. Audience Mismatch</h3>
          <p className="mb-4 leading-relaxed text-fg-muted">
            Your ad targets e-commerce founders struggling with cart abandonment. Your page speaks to "businesses of all sizes looking to improve their digital presence." The ad narrowed the conversation to a specific person with a specific problem. The page widened it back out to everyone. The e-commerce founder no longer feels spoken to - they feel like one of many, and the page has signalled that it was not actually built for them.
          </p>
        </section>

        {/* Section 3 */}
        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-xl font-semibold text-fg">Why You Built This Mismatch Without Noticing</h2>
          <p className="mb-4 leading-relaxed text-fg-muted">
            Message match failures almost never happen through carelessness. They happen through process. Ads and landing pages are written at different stages of a campaign, often by different people, almost always in different emotional states - and no one ever sits down to read them back-to-back as the visitor will.
          </p>
          <p className="mb-4 leading-relaxed text-fg-muted">
            The ad copywriter is in performance mode: tight character limits, direct response instincts, a single audience segment in mind. The landing page copywriter - or the founder writing the page six months earlier - is in brand mode: positioning the company, covering all use cases, building trust across a broad audience. Both were doing their job correctly. The mismatch emerged from the gap between two legitimate but disconnected creative processes.
          </p>
          <p className="mb-4 leading-relaxed text-fg-muted">
            There is also a review problem. Ads are reviewed in the ad platform. Pages are reviewed in a CMS or design tool. Nobody reviews them together, in sequence, as a visitor experience. The gap is invisible precisely because the two assets live in different workflows, different tools, and different mental contexts for everyone building them.
          </p>
        </section>

        {/* Section 4 */}
        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-xl font-semibold text-fg">The Continuity Test</h2>
          <p className="mb-4 leading-relaxed text-fg-muted">
            You do not need a heat map tool or a split-testing platform to inspect message match. You need the ad, the destination page, and a willingness to read your own work as a stranger.
          </p>
          <p className="mb-4 leading-relaxed text-fg-muted">
            Here is the test: Read your ad. Let the promise and the tone land. Now cover the page. Before you look at it, write down - or say out loud - exactly what you expect to see. What headline? What offer? What emotion? What visual register? Then uncover the page and look at what you actually see.
          </p>
          <p className="mb-4 leading-relaxed text-fg-muted">
            Name the gap specifically. Not "it feels off" - that is not useful. Name it precisely: "The ad was urgent, the page headline is passive." "The ad promised a free audit, the page opens with a pricing section." "The ad spoke to freelancers, the page says enterprise clients." The more precisely you name the gap, the faster and cheaper the fix becomes.
          </p>
          <p className="mb-4 leading-relaxed text-fg-muted">
            Run this test on every ad-to-page pair in your account before you run any other conversion optimisation. It will surface more addressable friction in less time than any other diagnostic method.
          </p>
        </section>

        {/* Section 5 */}
        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-xl font-semibold text-fg">Platform-Specific Message Match Failures</h2>
          <p className="mb-4 leading-relaxed text-fg-muted">
            Each ad platform creates a distinct visitor state, and each has its own characteristic way of breaking message match when the page does not account for that state.
          </p>

          <h3 className="mb-2 text-base font-semibold text-fg">Google Search</h3>
          <p className="mb-4 leading-relaxed text-fg-muted">
            The visitor is in active intent mode. They typed a specific query; they have a specific question or need in mind. The failure mode here is <em>query intent vs page intent</em>: the ad matched the query, but the page is not oriented around answering it - it is oriented around presenting the product. The visitor searched for an answer and landed on a brochure.
          </p>

          <h3 className="mb-2 text-base font-semibold text-fg">Meta (Facebook and Instagram)</h3>
          <p className="mb-4 leading-relaxed text-fg-muted">
            The visitor was interrupted. They were scrolling passively, and your ad pulled them out of that state with an emotional hook - a pain point, a surprising claim, a relatable frustration. The failure mode is landing them on a rational evaluation page when they arrived in an emotional state. The page needs to continue the emotional conversation before it pivots to logic.
          </p>

          <h3 className="mb-2 text-base font-semibold text-fg">LinkedIn</h3>
          <p className="mb-4 leading-relaxed text-fg-muted">
            The visitor arrived from a professional context. LinkedIn ads that perform well speak in a peer register - direct, specific, credibility-forward. The failure mode is landing them on a page full of marketing speak: "world-class solutions," "transformative results," "industry-leading platform." The professional register of the ad promised a peer conversation. The page delivered a sales pitch.
          </p>

          <h3 className="mb-2 text-base font-semibold text-fg">TikTok</h3>
          <p className="mb-4 leading-relaxed text-fg-muted">
            The visitor arrived from the most native-feeling ad format available. TikTok ads that convert feel like content - fast, direct, personality-driven, visually energetic. The failure mode is the hardest to fix: landing them on a static corporate page that feels like it belongs to a different decade. The energy collapse is so severe that the visitor may not even register the offer before leaving.
          </p>
        </section>

        {/* Section 6 */}
        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-xl font-semibold text-fg">The First Fix to Test: Restore the Handoff in the H1</h2>
          <p className="mb-4 leading-relaxed text-fg-muted">
            You do not need to rebuild the page. You do not need a new design, a new layout, or a new offer. A practical first edit is to <strong className="text-fg">rewrite the H1 to echo the specific promise of the ad.</strong>
          </p>
          <p className="mb-4 leading-relaxed text-fg-muted">
            Not a generic version of the promise. The specific one. If the ad said "Stop losing sales to a page that does not convert," the H1 should not say "Convert more visitors." It should say something like: "Your page is losing sales. Here is why - and the fix." The emotional register, the specificity, and the implied audience should all carry through from the ad into the first thing the visitor reads on the page.
          </p>
          <p className="mb-4 leading-relaxed text-fg-muted">
            The H1 is the handoff point. It is where the baton changes hands. If that moment is smooth - if the visitor reads the H1 and thinks "yes, I am in the right place" - then the rest of the page has a chance to convert them. If the H1 breaks the thread, nothing else on the page will save the conversion.
          </p>
          <p className="mb-4 leading-relaxed text-fg-muted">
            After fixing the H1, apply the continuity test again. After that edit, check whether the remaining friction - usually in the subheadline or the primary CTA - is now easier to identify and fix because the continuity from the ad is established. Work sequentially from the top of the page, fixing the gaps the test reveals, until reading the ad and then reading the page feels like a single continuous experience.
          </p>
        </section>

        {/* CTA */}
        <section className="mt-6 rounded-2xl border border-accent/40 bg-bg-panel p-8">
          <h2 className="mb-4 text-xl font-semibold text-fg">Check the Match on Your Pages</h2>
          <p className="mb-4 leading-relaxed text-fg-muted">
            Message match can often be inspected without new traffic or a redesign. Run the continuity test on your highest-traffic ad-to-page pairs this week. If you want a systematic checklist for reviewing each element, the resources below will help.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/learning-centre/message-match-checklist"
              className="inline-block rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent/90 transition-colors"
            >
              Message Match Checklist →
            </Link>
            <Link
              href="/learning-centre/headline-cta-mismatch"
              className="inline-block rounded-lg border border-border bg-bg px-5 py-2.5 text-sm font-medium text-fg hover:bg-bg-panel transition-colors"
            >
              Headline and CTA Mismatch
            </Link>
          </div>
        </section>

        {/* Related Articles */}
        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-xl font-semibold text-fg">Related Articles</h2>
          <ul className="space-y-3">
            <li>
              <Link
                href="/learning-centre/message-match-checklist"
                className="text-accent hover:underline"
              >
                Message Match Checklist
              </Link>
              <p className="mt-0.5 text-sm text-fg-muted">A complete audit checklist for reviewing every element of message match across your ad-to-page pairs.</p>
            </li>
            <li>
              <Link
                href="/learning-centre/headline-cta-mismatch"
                className="text-accent hover:underline"
              >
                Headline and CTA Mismatch
              </Link>
              <p className="mt-0.5 text-sm text-fg-muted">When your headline promises one thing and your CTA asks for another, conversions stall. Here is how to align them.</p>
            </li>
            <li>
              <Link
                href="/learning-centre/facebook-ads-no-leads"
                className="text-accent hover:underline"
              >
                Facebook Ads Getting Clicks But No Leads
              </Link>
              <p className="mt-0.5 text-sm text-fg-muted">Why Meta campaigns with strong CTR still fail to convert - and the post-click experience problems that cause it.</p>
            </li>
            <li>
              <Link
                href="/learning-centre/landing-page-not-converting"
                className="text-accent hover:underline"
              >
                Landing Page Not Converting
              </Link>
              <p className="mt-0.5 text-sm text-fg-muted">A diagnostic framework for landing pages that receive traffic but produce no leads or sales.</p>
            </li>
          </ul>
        </section>

      </div>
    </main>
  )
}
