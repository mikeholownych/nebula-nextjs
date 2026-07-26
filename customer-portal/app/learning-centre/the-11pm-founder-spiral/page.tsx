import type { Metadata } from 'next'
import Link from 'next/link'
import { createArticleSchema } from '../../lib/schema'

export const metadata: Metadata = {
  title: 'The 11pm Founder Spiral | Nebula Learning Centre',
  description: 'It\'s 11:47pm and you\'ve refreshed Ads Manager three times. You\'re not looking for data. You\'re looking for reassurance. Here\'s what\'s actually happening — and what your page is silently doing while you spiral.',
  alternates: {
    canonical: 'https://nebulacomponents.shop/learning-centre/the-11pm-founder-spiral',
  },
}

const articleSchema = createArticleSchema({
  headline: 'The 11pm Founder Spiral',
  description: 'It\'s 11:47pm and you\'ve refreshed Ads Manager three times. You\'re not looking for data. You\'re looking for reassurance. Here\'s what\'s actually happening — and what your page is silently doing while you spiral.',
  url: 'https://nebulacomponents.shop/learning-centre/the-11pm-founder-spiral',
  publishedDate: '2026-07-25',
  modifiedDate: '2026-07-25',
})

export default function The11pmFounderSpiralPage() {
  return (
    <main id="main-content" className="min-h-screen bg-bg pt-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <div className="mx-auto max-w-3xl px-6 py-14">
        <Link
          href="/learning-centre"
          className="text-sm font-semibold text-accent hover:text-accent-light transition-colors"
        >
          ← Learning Centre
        </Link>

        {/* Opening panel */}
        <div className="mt-8 rounded-2xl border border-border bg-bg-panel p-8 md:p-10">
          <span className="inline-block rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent">
            Landing Page Leaks
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-fg md:text-4xl">
            The 11pm Founder Spiral
          </h1>
          <p className="mt-4 text-lg text-fg-muted leading-relaxed">
            It's 11:47pm. You've refreshed Ads Manager three times in the last twenty minutes. The numbers haven't changed. You know they haven't changed. You're not looking for data — you're looking for something that tells you it's going to be okay. That's the spiral. And it's lying to you about where the problem actually is.
          </p>
        </div>

        {/* Section 1: Name the spiral */}
        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="text-xl font-bold text-fg">
            This Is What the Midnight Refresh Loop Actually Is
          </h2>
          <p className="mt-4 text-fg-muted leading-relaxed">
            The loop isn't about curiosity. It isn't analysis. It's a compulsion dressed up as diligence. You open the dashboard because sitting with uncertainty feels worse than doing something — anything — even if that something is just staring at a cost-per-click that hasn't moved since 9pm.
          </p>
          <p className="mt-4 text-fg-muted leading-relaxed">
            What you're actually feeling at 11:47pm is a specific kind of dread: the suspicion that something is broken and you can't see it. Not the campaign. The page. The thing the campaign sends people to. You can feel it in your gut even when the dashboard gives you nothing to point at.
          </p>
          <p className="mt-4 text-fg-muted leading-relaxed">
            The spiral is the mind's way of avoiding that confrontation. If I can just find the metric that explains it, I don't have to sit with the possibility that I've been sending paid traffic into a page that's been quietly bleeding conversions for weeks.
          </p>
        </section>

        {/* Section 2: What the midnight audit misses */}
        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="text-xl font-bold text-fg">
            What the Midnight Audit Always Misses
          </h2>
          <p className="mt-4 text-fg-muted leading-relaxed">
            Impressions. CTR. Frequency. Bid adjustments. Quality score. These are the numbers you're cycling through at midnight, and not one of them will tell you what's actually wrong. They're upstream metrics. They describe how many people arrived at the door — not what happened when they knocked.
          </p>
          <p className="mt-4 text-fg-muted leading-relaxed">
            The ad platform shows you what it can measure: delivery, reach, click volume. It has no visibility into what the landing page does to those clicks after they arrive. Whether your H1 loaded before the person decided to leave. Whether your page weight caused a three-second blank screen on a 4G connection. Whether your trust signals — the ones you added eight months ago — are now pointing to a broken link or a testimonial that renders as a grey box on mobile.
          </p>
          <p className="mt-4 text-fg-muted leading-relaxed">
            You can't solve a landing page problem from inside Ads Manager. But at 11:47pm, Ads Manager is where you are, so that's where you keep looking. The dashboard isn't lying to you. It just doesn't know about the problem you actually have.
          </p>
        </section>

        {/* Section 3: What the page is doing while you sleep */}
        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="text-xl font-bold text-fg">
            What Your Page Is Actually Doing While You Spiral
          </h2>
          <p className="mt-4 text-fg-muted leading-relaxed">
            While you're refreshing the dashboard, the page is doing its own thing — and not the thing you think. There's a 300KB uncompressed JavaScript payload that's blocking render on mobile. There's an H1 that got truncated in the last CMS update because someone edited the hero block and didn't check it on a phone screen. The hero reads "Turn Your Visitors Into Custo—" and stops. No one flagged it because no one was looking.
          </p>
          <p className="mt-4 text-fg-muted leading-relaxed">
            The trust signals have degraded. The logos section still shows five brand names, but two of the review links now 404. The social proof widget that used to load a live count is pulling from a script that hasn't returned a valid response in eleven days. It's not showing an error — it's showing nothing. A blank space where confidence used to be.
          </p>
          <p className="mt-4 text-fg-muted leading-relaxed">
            None of this is catastrophic on its own. Taken together, it's a page that feels slightly broken to every person who lands on it — and they can't articulate why. They just don't fill out the form. They close the tab. They go back to Google. And you sit at your desk at 11:47pm wondering why your cost-per-lead went up.
          </p>
        </section>

        {/* Section 4: Why self-diagnosis at midnight makes it worse */}
        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="text-xl font-bold text-fg">
            Why the 11pm Edit Always Makes It Worse
          </h2>
          <p className="mt-4 text-fg-muted leading-relaxed">
            This is the most expensive part of the spiral: the edit. You get tired of looking at numbers that don't explain anything, so you start changing things. You reduce the ad budget because it feels like you're bleeding. You change the CTA copy from "Get Your Free Audit" to "Start for Free" because maybe that's the problem. You pause two campaigns that were actually performing fine — you just couldn't see it through the noise.
          </p>
          <p className="mt-4 text-fg-muted leading-relaxed">
            The 11pm edit introduces variables you won't be able to isolate tomorrow. When the numbers look different in three days — better or worse — you won't know what caused it. You've corrupted your own data by acting on anxiety instead of evidence. The change felt like control. It wasn't.
          </p>
          <p className="mt-4 text-fg-muted leading-relaxed">
            The worst version of this is the founder who pauses their highest-spend campaign because the CPC spiked on a Tuesday evening, before realising on Thursday that Tuesday evenings always spike and that campaign was producing their cheapest leads by cost-per-acquisition. The pause cost them four days of compound learning on the algorithm. The campaign took two weeks to recover.
          </p>
          <p className="mt-4 text-fg-muted leading-relaxed">
            Anxiety-driven edits at midnight are a tax on your future self. The only antidote is knowing — specifically — what is actually broken, so you can fix that thing and leave everything else alone.
          </p>
        </section>

        {/* Section 5: The one thing different tomorrow */}
        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="text-xl font-bold text-fg">
            The Only Thing That Is Different Tomorrow
          </h2>
          <p className="mt-4 text-fg-muted leading-relaxed">
            If you do one thing tonight — not fix everything, not overhaul the page, not rewrite the campaign — but do one thing: find out exactly what your page is breaking. Not an impression. Not a hunch. The specific, enumerated list of issues that are silently degrading every click you've paid for.
          </p>
          <p className="mt-4 text-fg-muted leading-relaxed">
            Tomorrow you wake up and you know. The H1 is truncated on mobile. The page weight is 300KB over a reasonable threshold. Trust signal two and four are returning errors. That's a Tuesday morning's work — real work, not spiral work. You fix those things and then you look at the ad data and you're actually reading something meaningful, because the signal is cleaner.
          </p>
          <p className="mt-4 text-fg-muted leading-relaxed">
            The spiral doesn't end because you found reassurance. It ends because you replaced the vague dread with a specific list. Specific problems have solutions. Vague dread just compounds.
          </p>
        </section>

        {/* CTA section */}
        <section className="mt-6 rounded-2xl border border-accent/40 bg-bg-panel p-8">
          <h2 className="text-xl font-bold text-fg">
            Run the Free Audit Tonight
          </h2>
          <p className="mt-4 text-fg-muted leading-relaxed">
            Not because it will make you feel better tonight — it probably won't. Because tomorrow you'll know exactly what to fix. No more midnight refreshing a dashboard that can't see your landing page. No more 11pm edits that corrupt your data. Just a list of what's actually broken, so you can do real work in the morning.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/audit"
              className="inline-flex items-center justify-center rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-white hover:bg-accent-light transition-colors"
            >
              Run the Free Audit →
            </Link>
            <Link
              href="/learning-centre/landing-page-not-converting"
              className="inline-flex items-center justify-center rounded-xl border border-border px-6 py-3 text-sm font-semibold text-fg hover:border-accent hover:text-accent transition-colors"
            >
              Why Your Page Isn't Converting
            </Link>
          </div>
        </section>

        {/* Related links section */}
        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="text-xl font-bold text-fg">Related Articles</h2>
          <ul className="mt-4 space-y-3">
            <li>
              <Link
                href="/learning-centre/landing-page-not-converting"
                className="text-accent hover:text-accent-light font-medium transition-colors"
              >
                My Landing Page Gets Traffic But Isn't Converting
              </Link>
              <p className="mt-1 text-sm text-fg-muted">
                The diagnosis framework for when clicks arrive but leads don't — page by page, element by element.
              </p>
            </li>
            <li>
              <Link
                href="/learning-centre/traffic-but-no-form-fills"
                className="text-accent hover:text-accent-light font-medium transition-colors"
              >
                Traffic But No Form Fills
              </Link>
              <p className="mt-1 text-sm text-fg-muted">
                When the funnel is technically working and the page is still silent. What to look at when everything looks fine.
              </p>
            </li>
            <li>
              <Link
                href="/learning-centre/paid-traffic-leak-map"
                className="text-accent hover:text-accent-light font-medium transition-colors"
              >
                The Paid Traffic Leak Map
              </Link>
              <p className="mt-1 text-sm text-fg-muted">
                Every point between ad click and form submission where paid traffic silently escapes — and how to find yours.
              </p>
            </li>
            <li>
              <Link
                href="/learning-centre/before-you-raise-ad-budget"
                className="text-accent hover:text-accent-light font-medium transition-colors"
              >
                Before You Raise Your Ad Budget
              </Link>
              <p className="mt-1 text-sm text-fg-muted">
                The checklist that saves you from scaling a broken page. What to confirm before you increase spend.
              </p>
            </li>
          </ul>
        </section>
      </div>
    </main>
  )
}
