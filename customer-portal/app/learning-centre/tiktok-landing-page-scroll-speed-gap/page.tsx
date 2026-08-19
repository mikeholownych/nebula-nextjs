import type { Metadata } from 'next'
import Link from 'next/link'
import { createArticleSchema } from '../../lib/schema'

export const metadata: Metadata = {
  title: 'TikTok to Landing Page: The Scroll-Speed Gap That Burns Your Ad Budget',
  description: "TikTok rewards rapid pass/fail decisions. Your landing page wasn't built for that. Here's the scroll-speed gap that blocks conversions - and how to fix it before you scale spend.",
  alternates: {
    canonical: 'https://nebulacomponents.com/learning-centre/tiktok-landing-page-scroll-speed-gap',
  },
}

const articleSchema = createArticleSchema({
  headline: 'TikTok to Landing Page: The Scroll-Speed Gap That Burns Your Ad Budget',
  description: "TikTok rewards rapid pass/fail decisions. Your landing page wasn't built for that. Here's the scroll-speed gap that blocks conversions - and how to fix it before you scale spend.",
  url: 'https://nebulacomponents.com/learning-centre/tiktok-landing-page-scroll-speed-gap',
  publishedDate: '2026-07-25',
  modifiedDate: '2026-07-25',
})

export default function TiktokLandingPageScrollSpeedGapPage() {
  return (
    <main id="main-content" className="min-h-screen bg-bg pt-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      <div className="mx-auto max-w-3xl px-4 pb-24">
        {/* Breadcrumb */}
        <nav className="mb-6 flex items-center gap-2 text-sm text-fg-muted" aria-label="Breadcrumb">
          <Link href="/" className="hover:text-accent transition-colors">Home</Link>
          <span>/</span>
          <Link href="/learning-centre" className="hover:text-accent transition-colors">Learning Centre</Link>
          <span>/</span>
          <span className="text-fg">TikTok Scroll-Speed Gap</span>
        </nav>

        {/* Header */}
        <header className="mb-8">
          <div className="mb-3 flex items-center gap-2">
            <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
              TikTok Ads Leaks
            </span>
          </div>
          <h1 className="mb-4 text-3xl font-bold leading-tight text-fg sm:text-4xl">
            TikTok to Landing Page: The Scroll-Speed Gap That Burns Your Ad Budget
          </h1>
          <p className="text-lg leading-relaxed text-fg-muted">
            TikTok has conditioned your audience to make pass/fail decisions in under a second. Most landing pages were never designed for that pace - and the mismatch silently drains your ad budget long before you notice the pattern.
          </p>
          <p className="mt-3 text-sm text-fg-muted">
            Published <time dateTime="2026-07-25">25 July 2026</time>
          </p>
        </header>

        {/* Section 1 */}
        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-xl font-semibold text-fg">
            The Attention Cadence Mismatch
          </h2>
          <p className="mb-4 leading-relaxed text-fg-muted">
            TikTok is a machine for training fast judgment. The average user makes a scroll-or-stay decision very quickly after a new piece of content appears. After thousands of those micro-decisions per week, the reflex becomes automatic - stop only if something earns it immediately, keep scrolling if there is any friction or ambiguity.
          </p>
          <p className="mb-4 leading-relaxed text-fg-muted">
            Compare that to Google Search traffic. Someone who types a query has already declared intent. They arrived at your page with a reason. They are prepared to read, evaluate, and decide at a measured pace. The psychological contract is completely different.
          </p>
          <p className="mb-4 leading-relaxed text-fg-muted">
            When a TikTok ad converts a click, that person lands on your page with TikTok brain still active. They are not in declared-intent mode. They are in rapid-rejection mode. If your landing page was built for Google traffic - blocks of explanatory copy, formal headline, value proposition buried in paragraph three - you are asking a sprinter to enjoy a slow walk. They leave before the walk begins.
          </p>
          <p className="leading-relaxed text-fg-muted">
            This is the attention cadence mismatch. It is not a creative problem. It is a structural one. The fix is not a better headline - it is rebuilding the above-the-fold experience around the immediate-attention gate your audience brings with them.
          </p>
        </section>

        {/* Section 2 */}
        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-xl font-semibold text-fg">
            What TikTok Traffic Expects Above the Fold
          </h2>
          <p className="mb-4 leading-relaxed text-fg-muted">
            TikTok traffic does not arrive neutral. It arrives with a specific set of expectations shaped by your ad - the visual language, the energy, the person, the tone. The moment the landing page violates those expectations, the emotional continuity breaks and trust evaporates.
          </p>
          <p className="mb-4 leading-relaxed text-fg-muted">
            Three things must be true above the fold for TikTok traffic to keep scrolling:
          </p>
          <ul className="mb-4 space-y-3 text-fg-muted">
            <li className="flex gap-3">
              <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/20 text-xs font-bold text-accent">1</span>
              <span className="leading-relaxed"><strong className="text-fg">Visual continuity with the ad.</strong> If the ad featured a real person in a casual environment, the landing page should feel like the same world - not a polished corporate brochure. The visual register must match.</span>
            </li>
            <li className="flex gap-3">
              <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/20 text-xs font-bold text-accent">2</span>
              <span className="leading-relaxed"><strong className="text-fg">Movement or implied momentum.</strong> TikTok is a motion medium. A completely static page after a video ad feels frozen and dead. Even subtle visual motion - an animated element, a looping asset, a scroll-triggered reveal - signals that something is happening and worth continuing.</span>
            </li>
            <li className="flex gap-3">
              <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/20 text-xs font-bold text-accent">3</span>
              <span className="leading-relaxed"><strong className="text-fg">Emotional hook before logic.</strong> The ad earned the click through feeling - curiosity, relatability, urgency, desire. The landing page must continue that feeling before it explains. Leading with features or specifications before the emotional resonance has been confirmed breaks the sequence the ad established.</span>
            </li>
          </ul>
          <p className="leading-relaxed text-fg-muted">
            The above-fold experience is not a summary of your offer. It is a continuation of your ad. Treat the click as a scene transition, not a new conversation.
          </p>
        </section>

        {/* Section 3 */}
        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-xl font-semibold text-fg">
            The Scroll-Depth Problem: Why Paragraph-Heavy Above-Folds Block Conversions
          </h2>
          <p className="mb-4 leading-relaxed text-fg-muted">
            The most common conversion failure on pages receiving TikTok traffic is a dense, text-heavy above-the-fold section. It looks reasonable by Google-traffic standards - a headline, a sub-headline, a few sentences of context, a CTA. For TikTok traffic, it is a wall.
          </p>
          <p className="mb-4 leading-relaxed text-fg-muted">
            When heatmap and scroll-depth data is overlaid on TikTok-sourced traffic, the pattern is consistent: the majority of exits happen before the first scroll on text-heavy layouts. The person reads approximately the first four words of the headline, does not feel the continuation of what the ad promised, and leaves. The rest of the page - the testimonials, the offer details, the urgency - is never seen.
          </p>
          <p className="mb-4 leading-relaxed text-fg-muted">
            The above-fold section has one job for TikTok traffic: earn the first scroll. Not convert. Not explain. Not qualify. Just get them to move their thumb one swipe down.
          </p>
          <p className="leading-relaxed text-fg-muted">
            Pages that perform on TikTok traffic treat the above-fold as a hook, not an introduction. Short. Visually immediate. Emotionally continuous with the ad. The information architecture shifts everything explanatory below the fold, and uses the fold itself purely to sustain the momentum the ad created.
          </p>
        </section>

        {/* Section 4 */}
        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-xl font-semibold text-fg">
            Four Specific Failure Patterns
          </h2>
          <p className="mb-4 leading-relaxed text-fg-muted">
            These are the structural failure patterns that appear most frequently when TikTok ad spend is not converting. Each one breaks the continuity contract between ad and page.
          </p>

          <div className="space-y-6">
            <div className="rounded-xl border border-border bg-bg p-5">
              <h3 className="mb-2 font-semibold text-fg">1. Corporate Stock Photography After a UGC Ad</h3>
              <p className="leading-relaxed text-fg-muted">
                The ad featured a real person - messy background, natural lighting, casual delivery. The landing page opens with a polished stock image of a smiling model or an abstract hero graphic. The visual register change is jarring. The person who clicked expecting more of the real, relatable creator has landed somewhere that feels like a different brand. Trust breaks immediately.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-bg p-5">
              <h3 className="mb-2 font-semibold text-fg">2. Formal Tone After a Casual Ad</h3>
              <p className="leading-relaxed text-fg-muted">
                The ad used conversational language, slang, or direct address - "okay so this changed everything for me." The landing page headline reads: "Discover Our Comprehensive Solution for Modern Professionals." The vocabulary shift signals a mismatch. The person feels they have left the conversation the ad started and entered a corporate pitch they did not ask for. Bounce follows.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-bg p-5">
              <h3 className="mb-2 font-semibold text-fg">3. Form Before Social Proof</h3>
              <p className="leading-relaxed text-fg-muted">
                The page leads immediately with a form - email capture, signup, booking. No proof. No context. No continued narrative from the ad. TikTok traffic has not had time to develop sufficient trust for a commitment ask at this stage. The form before proof structure assumes a level of readiness that TikTok traffic simply does not arrive with. Social proof - real, visual, volume-signalling - must precede the ask.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-bg p-5">
              <h3 className="mb-2 font-semibold text-fg">4. Desktop-First Layout on a 100% Mobile Audience</h3>
              <p className="leading-relaxed text-fg-muted">
                TikTok traffic is effectively 100% mobile. A page designed desktop-first, even one that technically responds to mobile, will compress the above-fold in ways that bury the hook, shrink social proof, and make CTAs awkward to tap. The thumb experience must be the primary design constraint - not a responsive afterthought. If the mobile version is not the version that was actively designed and tested, you have a mobile-first audience receiving a desktop-first experience.
              </p>
            </div>
          </div>
        </section>

        {/* Section 5 */}
        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-xl font-semibold text-fg">
            The Offer Continuity Test
          </h2>
          <p className="mb-4 leading-relaxed text-fg-muted">
            Before any optimisation work, run this single diagnostic. Pull up the last 3 seconds of your TikTok ad on your phone. Note: the visual energy, the emotional tone, the implied promise, the pace. Then, without closing that mental image, open your landing page on the same phone.
          </p>
          <p className="mb-4 leading-relaxed text-fg-muted">
            Ask: does the first screen of this landing page feel like a continuation of those last 3 seconds? Or does it feel like a different world?
          </p>
          <p className="mb-4 leading-relaxed text-fg-muted">
            This is the offer continuity test. It is not about whether the headline matches the ad copy or whether the product name is consistent. It is about whether the energy, the register, and the emotional temperature of the page match what the ad was radiating in its final moments - the state the person was in when they decided to click.
          </p>
          <p className="mb-4 leading-relaxed text-fg-muted">
            If there is a perceptible drop in energy between the ad and the page, you have a continuity gap. That gap is where budget burns. The ad creates the right emotional state for a conversion; the landing page extinguishes it before the conversion can happen.
          </p>
          <p className="leading-relaxed text-fg-muted">
            Closing the continuity gap does not require rebuilding the entire page. It often requires changing the above-fold visual, softening the headline tone, and removing anything that creates a register mismatch in the first five seconds of the page experience.
          </p>
        </section>

        {/* Section 6 */}
        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-xl font-semibold text-fg">
            What to Check and Fix Before Scaling Spend
          </h2>
          <p className="mb-4 leading-relaxed text-fg-muted">
            Scaling ad spend on a page with a scroll-speed gap is the fastest way to amplify a leak. More traffic at the same conversion rate means more budget entering and exiting without converting. Fix the structural issues first, then scale.
          </p>
          <p className="mb-3 font-medium text-fg">Run through this checklist before increasing budget:</p>
          <ul className="mb-4 space-y-3 text-fg-muted">
            {[
              "Pass the offer continuity test - last 3 seconds of ad vs first screen of page, same energy or not.",
              "Check that above-fold is hook-first, not explanation-first - can you earn the first scroll quickly?",
              "Confirm visual register match - ad aesthetic (UGC, polished, lifestyle) is reflected on the page, not contradicted.",
              "Verify tone match - read first heading aloud. Does it sound like the person in the ad or a different voice entirely?",
              "Remove any form or hard CTA from above-the-fold - proof and narrative must precede the ask.",
              "Test the page on the phone you would use to watch TikTok - not desktop, not simulated mobile. The actual thumb-scroll experience.",
              "Check scroll depth on TikTok-sourced sessions specifically - if the majority of exits are before the first scroll, the above-fold is the problem.",
              "Confirm social proof is visible before the primary CTA - volume signals, real faces, recognisable indicators.",
            ].map((item, i) => (
              <li key={i} className="flex gap-3">
                <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent">
                  {i + 1}
                </span>
                <span className="leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
          <p className="leading-relaxed text-fg-muted">
            The scroll-speed gap is solvable. It does not require a complete rebuild - it requires understanding that TikTok traffic and Google traffic are different psychological contracts, and designing the above-fold experience accordingly. Fix the structural mismatch, validate with real mobile scroll-depth data, then scale with confidence.
          </p>
        </section>

        {/* CTA */}
        <section className="mt-6 rounded-2xl border border-accent/40 bg-bg-panel p-8">
          <h2 className="mb-3 text-xl font-semibold text-fg">
            Fix the Scroll-Speed Gap With the Right Components
          </h2>
          <p className="mb-6 leading-relaxed text-fg-muted">
            Nebula landing page components are built for TikTok traffic - mobile-first, hook-structured, and designed for visual continuity with UGC ad creative. Browse the component library and close the gap before your next campaign.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/"
              className="inline-flex items-center rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Browse Components
            </Link>
            <Link
              href="/learning-centre"
              className="inline-flex items-center rounded-xl border border-border bg-bg px-6 py-3 text-sm font-semibold text-fg transition-colors hover:border-accent/60"
            >
              More Articles
            </Link>
          </div>
        </section>

        {/* Related Articles */}
        <section className="mt-10">
          <h2 className="mb-4 text-lg font-semibold text-fg">Related Articles</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { href: '/learning-centre/tiktok-ads-not-converting', label: 'Why Your TikTok Ads Are Not Converting' },
              { href: '/learning-centre/mobile-landing-page-leaks', label: 'Mobile Landing Page Leaks' },
              { href: '/learning-centre/message-match-checklist', label: 'Message Match Checklist' },
              { href: '/learning-centre/landing-page-bounce-rate-high', label: 'Landing Page Bounce Rate Too High' },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 rounded-xl border border-border bg-bg-panel px-5 py-4 text-sm font-medium text-fg-muted transition-colors hover:border-accent/50 hover:text-fg"
              >
                <span className="text-accent">→</span>
                {label}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
