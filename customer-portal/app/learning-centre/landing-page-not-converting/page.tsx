import type { Metadata } from 'next'
import Link from 'next/link'
import { createArticleSchema } from '../../lib/schema'

export const metadata: Metadata = {
  title: 'Landing Page Not Converting Paid Traffic: 5 Diagnosable Leaks | Nebula Components',
  description:
    'A landing page that does not convert paid traffic has at least one of five diagnosable leak patterns. Diagnose the right one before you change anything.',
  alternates: {
    canonical:
      'https://nebulacomponents.shop/learning-centre/landing-page-not-converting',
  },
}

const articleSchema = createArticleSchema({
  headline: 'Landing Page Not Converting? Diagnose These 5 Leaks First',
  description:
    'A landing page that does not convert paid traffic has at least one of five diagnosable leak patterns. Diagnose the right one before you change anything.',
  url: 'https://nebulacomponents.shop/learning-centre/landing-page-not-converting',
  publishedDate: '2026-07-16',
  modifiedDate: '2026-07-21',
})

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What is the most common reason a landing page does not convert?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "A broken promise between the ad and the page headline. When the ad says '50% off running shoes' and the page headline says 'Shop Our Collection,' the visitor has no confirmation they are in the right place and leaves. This is what the message-match signal in Nebula's 7-signal audit framework measures.",
      },
    },
    {
      '@type': 'Question',
      name: 'How do I know if my landing page conversion rate is actually low?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "WordStream's 2026 Google Ads Benchmarks report — analysing over 13,000 search advertising campaigns from April 2025 to March 2026 — found an all-industries average conversion rate of 8.18%, ranging from 2.64% in Finance and Insurance to 16.22% in Animals and Pets. These are search-campaign averages, not single-page rates, but they give a realistic floor for your vertical. If you are consistently below your vertical's lower bound with meaningful traffic (500+ sessions), that strongly indicates at least one of the five leak patterns is active.",
      },
    },
    {
      '@type': 'Question',
      name: 'Should I A/B test my landing page before diagnosing the problem?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. A/B testing is a measurement tool, not a diagnostic tool. Testing two versions of a page with a broken promise doubles your spend on the wrong problem. Diagnose the leak first — identify which of the five patterns is active — then test the fix against the control.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is message match and why does it matter?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Message match is the degree to which your landing page headline repeats or reinforces the specific promise in the ad that brought the visitor there. A visitor who clicked 'Free 30-day trial for SaaS teams' expects to see those words, or close equivalents, immediately on the page. When they do not, they assume they clicked the wrong link and leave. High message match reduces the first decision a visitor has to make: am I in the right place?",
      },
    },
    {
      '@type': 'Question',
      name: 'How long does it take to fix a non-converting landing page?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: "Depends on which leak is active. A message-match fix (rewriting the headline and hero copy) takes 2-4 hours with a clear brief. A proof restructure (repositioning testimonials, adding specificity) takes a day. A full CTA and form-friction overhaul is 1-2 days. Nebula's $97 Fix Pack implements all identified fixes from the audit within 48 hours.",
      },
    },
  ],
}

export default function LandingPageNotConvertingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <main id="main-content" className="min-h-screen bg-bg pt-[72px]">
        <div className="mx-auto max-w-3xl px-6 py-14">
          <Link
            href="/learning-centre"
            className="text-sm font-semibold text-accent hover:text-accent-light transition-colors"
          >
            Back to Learning Centre
          </Link>

          {/* Hero */}
          <div className="mt-8 rounded-2xl border border-border bg-bg-panel p-8 md:p-10">
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-accent">
              Landing Page Leaks · 7 Conversion Signals
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-fg md:text-5xl">
              Landing Page Not Converting? Diagnose These 5 Leaks First
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-fg-muted">
              A non-converting landing page has at least one of five diagnosable
              leak patterns. Changing button colour will not fix a broken
              promise. This article shows you how to find which leak is active
              before you change anything.
            </p>
          </div>

          {/* Quick diagnosis — AEO extraction target */}
          <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
            <h2 className="mb-4 text-2xl font-bold text-fg">
              Quick diagnosis: which leak is it?
            </h2>
            <p className="leading-relaxed text-fg-muted">
              A non-converting landing page is usually not one problem. It is a
              sequence break: unclear promise, weak proof, CTA friction, mobile
              drag, or unanswered objections. Each leak is diagnosable in under
              ten minutes without touching the page. The five checks below run
              in order — the first one that fails is the first one to fix.
            </p>
            <ul className="mt-5 space-y-3 text-fg-muted">
              {[
                'Can a cold visitor explain your offer in 5 seconds without reading past the headline?',
                'Does the page show specific, dated proof that people like the visitor have succeeded?',
                'Does the CTA name what happens next — not just "Submit" or "Get Started"?',
                'Does the page pass a one-thumb scroll test on a 390px screen without loss of message?',
                'Are the top three objections answered before the final CTA?',
              ].map((q, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  {q}
                </li>
              ))}
            </ul>
            <p className="mt-5 text-sm text-fg-muted">
              WordStream&apos;s{' '}
              <a
                href="https://www.wordstream.com/blog/2026-google-ads-benchmarks"
                className="text-accent hover:text-accent-light underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                2026 Google Ads Benchmarks report
              </a>{' '}
              — analysing over 13,000 search advertising campaigns from April
              2025 to March 2026 — found an all-industries average conversion
              rate of 8.18%, ranging from 2.64% in Finance and Insurance to
              16.22% in Animals and Pets. These are search-campaign averages,
              not single-page rates. If you are consistently below the floor for
              your vertical, at least one of the five leaks below is active.
            </p>
          </section>

          {/* Leak 1 — Message match / Trust */}
          <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
            <h2 className="mb-4 text-2xl font-bold text-fg">
              Leak 1: The ad promise does not match the page headline
            </h2>
            <h3 className="mb-2 text-lg font-semibold text-fg">Symptom</h3>
            <p className="leading-relaxed text-fg-muted">
              Click-through rate on the ad is acceptable, but the page bounce
              rate is above 70% and time-on-page is under 10 seconds. Visitors
              are arriving and immediately leaving.
            </p>
            <h3 className="mb-2 mt-5 text-lg font-semibold text-fg">
              What it looks like
            </h3>
            <p className="leading-relaxed text-fg-muted">
              An ad running on &ldquo;project management software for remote
              teams&rdquo; lands on a page whose headline reads &ldquo;The
              Future of Work, Powered by AI.&rdquo; The visitor clicked because
              they want to manage a remote team. The headline tells them nothing
              about whether they are in the right place. Research by Lindgaard
              et al. published in{' '}
              <em>Behaviour &amp; Information Technology</em> (
              <a
                href="https://doi.org/10.1080/01449290500330448"
                className="text-accent hover:text-accent-light underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                doi:10.1080/01449290500330448
              </a>
              ) found that users form a visual impression of a webpage in
              approximately 50 milliseconds — before they have read a word. The
              headline is the first word they read. If it does not confirm the
              promise, the decision to leave is already forming.
            </p>
            <h3 className="mb-2 mt-5 text-lg font-semibold text-fg">
              Self-check
            </h3>
            <p className="leading-relaxed text-fg-muted">
              Copy your ad headline. Open your landing page. Does the page
              headline contain the same noun phrase — the same specific outcome
              or audience — as the ad? If you have to interpret or infer the
              connection, so does a cold visitor.
            </p>
            <h3 className="mb-2 mt-5 text-lg font-semibold text-fg">Fix</h3>
            <p className="leading-relaxed text-fg-muted">
              Rewrite the hero headline to echo the ad&apos;s specific promise.
              If the ad says &ldquo;50% off running shoes for wide feet,&rdquo;
              the page should say &ldquo;Wide-Fit Running Shoes — 50% Off This
              Week.&rdquo; Not a paraphrase — the same nouns. The visitor
              arrived because of a specific promise; the headline either
              confirms they are in the right place or it does not.
              Message-match is signal 1 of the 7 conversion signals the Nebula
              audit measures, because it determines whether any of the other
              signals get a chance to work.
            </p>
          </section>

          {/* Leak 2 — Proof / Trust */}
          <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
            <h2 className="mb-4 text-2xl font-bold text-fg">
              Leak 2: Proof is generic, anonymous, or absent
            </h2>
            <h3 className="mb-2 text-lg font-semibold text-fg">Symptom</h3>
            <p className="leading-relaxed text-fg-muted">
              Visitors scroll past the hero but abandon before the CTA. Heatmap
              data (if you have it) shows engagement drop-off around the
              testimonial or social-proof section.
            </p>
            <h3 className="mb-2 mt-5 text-lg font-semibold text-fg">
              What it looks like
            </h3>
            <p className="leading-relaxed text-fg-muted">
              &ldquo;This product changed my business.&rdquo; — J.T., Business
              Owner. That quote is indistinguishable from a placeholder. The
              visitor does not know if J.T. is real, if their business resembles
              theirs, or what specifically changed. Proof that cannot be
              verified does not reduce purchase risk — it increases it, because
              it signals that genuine evidence may not exist.
            </p>
            <h3 className="mb-2 mt-5 text-lg font-semibold text-fg">
              Self-check
            </h3>
            <p className="leading-relaxed text-fg-muted">
              Look at each testimonial or proof element on your page. Does it
              include: a full name (or clearly labelled composite), a specific
              outcome with a number or timeframe, and enough context for a
              similar visitor to recognise themselves? If not, it is not doing
              conversion work.
            </p>
            <h3 className="mb-2 mt-5 text-lg font-semibold text-fg">Fix</h3>
            <p className="leading-relaxed text-fg-muted">
              Replace generic quotes with specific ones. &ldquo;We went from
              1.2% to 4.1% conversion rate on our SaaS trial page in three
              weeks&rdquo; is proof. &ldquo;Game-changer&rdquo; is decoration.
              If you do not have specific testimonials yet, use a before/after
              case note with enough detail to be falsifiable. One real proof
              point outperforms five vague ones.
            </p>
          </section>

          {/* Leak 3 — CTA clarity / Form friction */}
          <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
            <h2 className="mb-4 text-2xl font-bold text-fg">
              Leak 3: The CTA does not match where the visitor is in their
              decision
            </h2>
            <h3 className="mb-2 text-lg font-semibold text-fg">Symptom</h3>
            <p className="leading-relaxed text-fg-muted">
              The CTA button exists and is visible, but click rate is low
              relative to scroll depth. Visitors are reading the page and
              stopping at the CTA.
            </p>
            <h3 className="mb-2 mt-5 text-lg font-semibold text-fg">
              What it looks like
            </h3>
            <p className="leading-relaxed text-fg-muted">
              A page selling a high-consideration engagement leads with &ldquo;Book
              Now&rdquo; as the primary CTA, before any explanation of what the
              engagement involves, who it is for, or what the outcome is.
              &ldquo;Book Now&rdquo; is the right CTA for a visitor who has
              already decided — it is the wrong CTA for a visitor who has just
              arrived. Asking for full commitment before establishing value is
              the most common pattern in pages we audit.
            </p>
            <h3 className="mb-2 mt-5 text-lg font-semibold text-fg">
              Self-check
            </h3>
            <p className="leading-relaxed text-fg-muted">
              Read your CTA button text. Does it describe what the visitor gets,
              or what they have to do? &ldquo;Book Now&rdquo; describes what
              they do. &ldquo;See How It Works&rdquo; or &ldquo;Get Your
              Diagnosis&rdquo; describes what they get. For high-consideration
              purchases, the CTA that converts cold traffic is almost always the
              one that offers the next step in the decision process, not the
              final commitment.
            </p>
            <h3 className="mb-2 mt-5 text-lg font-semibold text-fg">Fix</h3>
            <p className="leading-relaxed text-fg-muted">
              Match the CTA to the temperature of the traffic. Cold paid traffic
              landing on a page for the first time is not ready to &ldquo;Buy.&rdquo;
              Offer them the next decision step: a free audit, a demo, a
              specific deliverable. Reserve &ldquo;Buy Now&rdquo; or &ldquo;Book
              Now&rdquo; for pages where visitors have already consumed proof and
              understand the offer. Also check form friction: if the form asks
              for more fields than the next step requires, each extra field is a
              reason to stop.
            </p>
          </section>

          {/* Mid-article CTA */}
          <div className="my-6 rounded-2xl border border-accent/40 bg-bg-panel p-6">
            <p className="text-sm font-semibold text-accent mb-1">
              Not sure which leak is active on your page?
            </p>
            <p className="text-fg-muted text-sm mb-4">
              Run the free Nebula audit. It checks all 7 conversion signals and
              tells you which one is breaking the sequence.
            </p>
            <Link
              href="/audit"
              className="inline-flex rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-bg hover:bg-accent-light transition-colors"
            >
              Run the free audit
            </Link>
          </div>

          {/* Leak 4 — Mobile layout */}
          <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
            <h2 className="mb-4 text-2xl font-bold text-fg">
              Leak 4: The mobile experience breaks the message
            </h2>
            <h3 className="mb-2 text-lg font-semibold text-fg">Symptom</h3>
            <p className="leading-relaxed text-fg-muted">
              Desktop conversion rate runs higher than mobile, despite mobile
              accounting for the majority of paid traffic clicks. The gap is not
              a device-preference issue — it is a layout problem.
            </p>
            <h3 className="mb-2 mt-5 text-lg font-semibold text-fg">
              What it looks like
            </h3>
            <p className="leading-relaxed text-fg-muted">
              On desktop, the hero section shows a headline, a subheadline, a
              proof point, and a CTA button — all above the fold. On mobile at
              390px, the headline wraps to four lines, the subheadline
              disappears, and the CTA button is below the fold before the user
              has scrolled. The visitor sees a wall of text and a button they
              have to hunt for. The message sequence — promise, proof, action —
              is intact on desktop and broken on mobile.
            </p>
            <h3 className="mb-2 mt-5 text-lg font-semibold text-fg">
              Self-check
            </h3>
            <p className="leading-relaxed text-fg-muted">
              Open your landing page on a real phone (not a browser emulator).
              Without scrolling: do you see a clear headline, at least one proof
              signal, and a CTA button? If the button is not visible without
              scrolling, many visitors will not scroll far enough to find it.
            </p>
            <h3 className="mb-2 mt-5 text-lg font-semibold text-fg">Fix</h3>
            <p className="leading-relaxed text-fg-muted">
              Design the above-fold mobile layout as the primary canvas, not a
              scaled-down version of desktop. The headline should be under 10
              words to avoid wrapping to four lines. The CTA must be a
              full-width tap target visible without scrolling. Social proof can
              move below fold on mobile — the headline and CTA cannot. Test on a
              real device, not a browser emulator; emulators do not replicate
              thumb reach, font rendering, or how the browser chrome eats
              viewport height.
            </p>
          </section>

          {/* Leak 5 — Trust / objection coverage */}
          <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
            <h2 className="mb-4 text-2xl font-bold text-fg">
              Leak 5: Objections are not handled before the final ask
            </h2>
            <h3 className="mb-2 text-lg font-semibold text-fg">Symptom</h3>
            <p className="leading-relaxed text-fg-muted">
              Visitors scroll all the way to the bottom CTA and still do not
              convert. Scroll depth is high, time-on-page is reasonable, but the
              final conversion rate is low. The page has their attention — it
              has not resolved their hesitation.
            </p>
            <h3 className="mb-2 mt-5 text-lg font-semibold text-fg">
              What it looks like
            </h3>
            <p className="leading-relaxed text-fg-muted">
              A SaaS trial page shows features, pricing, and a sign-up CTA but
              does not address: how long setup takes, whether a credit card is
              required, what happens when the trial ends, or who to contact if
              something breaks. These are four questions a realistic buyer has
              before they enter their email. If the page does not answer them,
              the visitor leaves to find the answers — and often does not come
              back.
            </p>
            <h3 className="mb-2 mt-5 text-lg font-semibold text-fg">
              Self-check
            </h3>
            <p className="leading-relaxed text-fg-muted">
              List the top three reasons a qualified buyer would not convert on
              your page. Now check whether each reason is addressed — not in
              your FAQ, but on the page, above or adjacent to the final CTA. If
              the answers are buried or absent, the objection is a live
              conversion blocker.
            </p>
            <h3 className="mb-2 mt-5 text-lg font-semibold text-fg">Fix</h3>
            <p className="leading-relaxed text-fg-muted">
              Add a three-item objection block directly above your final CTA.
              Format it as specific answers, not marketing copy. &ldquo;No
              credit card required&rdquo; is an objection answer.
              &ldquo;Risk-free trial&rdquo; is marketing copy — it raises the
              question of what &ldquo;risk-free&rdquo; means and who defined it.
            </p>
          </section>

          {/* Decision tree — canonical 7 signals */}
          <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
            <h2 className="mb-4 text-2xl font-bold text-fg">
              Which leak do you fix first?
            </h2>
            <p className="mb-5 leading-relaxed text-fg-muted">
              The five leaks above are the failure modes a founder experiences;
              the 7 conversion signals are what the Nebula audit measures — each
              signal maps to the leak it surfaces. Fix in signal order. Earlier
              signals act as gates: if signal 1 is broken, fixing signal 6 does
              nothing.
            </p>
            <ol className="space-y-5">
              {[
                {
                  signal: 'Signal 1 — Message-match',
                  test: 'Does the headline echo the ad promise exactly?',
                  ifNo:
                    'Fix this first. Nothing else matters until visitors know they are in the right place.',
                  surfaces: 'Leak 1',
                },
                {
                  signal: 'Signal 2 — Trust',
                  test: 'Is there at least one specific, verifiable proof point above the fold?',
                  ifNo:
                    'Add before optimising the CTA. The CTA can only convert visitors who believe the offer. Unresolved purchase objections are also a trust failure — this signal surfaces both Leak 2 and Leak 5.',
                  surfaces: 'Leaks 2 and 5',
                },
                {
                  signal: 'Signal 3 — Mobile layout',
                  test: 'Is the headline + CTA visible on a real phone without scrolling?',
                  ifNo:
                    'Fix before running mobile traffic. Desktop conversion data does not transfer to a broken mobile layout.',
                  surfaces: 'Leak 4',
                },
                {
                  signal: 'Signal 4 — Load time',
                  test: 'Does the page load in under 3 seconds on a mobile connection?',
                  ifNo: (
                    <>
                      Slow load time bleeds conversions before the page is seen.
                      Not covered by the five-leak model above — covered in
                      depth in{' '}
                      <Link
                        href="/learning-centre/landing-page-load-time-slow"
                        className="text-accent hover:text-accent-light underline"
                      >
                        Landing Page Load Time Slow
                      </Link>
                      .
                    </>
                  ),
                  surfaces: null,
                },
                {
                  signal: 'Signal 5 — CTA clarity',
                  test: 'Does the CTA describe what the visitor gets, not what they have to do?',
                  ifNo: 'Fix now. A mismatched CTA wastes all the attention the page built.',
                  surfaces: 'Leak 3',
                },
                {
                  signal: 'Signal 6 — Form friction',
                  test: 'Does the form ask for only the information required for the next step?',
                  ifNo: 'Remove every field that is not needed. Each additional field reduces completion rate.',
                  surfaces: 'Leak 3',
                },
                {
                  signal: 'Signal 7 — Proof',
                  test: 'Is the strongest proof element above the fold, specific, and attributable?',
                  ifNo: 'Reposition or replace it. Anonymous, unlinked, undated proof reduces trust rather than building it.',
                  surfaces: 'Leak 2',
                },
              ].map(({ signal, test, ifNo, surfaces }, i) => (
                <li
                  key={i}
                  className="border-b border-border pb-5 last:border-0 last:pb-0"
                >
                  <p className="text-sm font-semibold text-accent">{signal}</p>
                  <p className="mt-1 text-fg-muted">
                    <strong className="text-fg">Test:</strong> {test}
                  </p>
                  <p className="mt-1 text-sm text-fg-muted">
                    <strong className="text-fg">If no:</strong> {ifNo}
                  </p>
                  {surfaces && (
                    <p className="mt-1 text-xs text-fg-subtle">
                      Surfaces: {surfaces}
                    </p>
                  )}
                </li>
              ))}
            </ol>
          </section>

          {/* FAQ — rendered on-page; schema above mirrors this content */}
          <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
            <h2 className="mb-6 text-2xl font-bold text-fg">
              Frequently asked questions
            </h2>
            <div className="space-y-6">
              {faqSchema.mainEntity.map((item, i) => (
                <div
                  key={i}
                  className="border-b border-border pb-6 last:border-0 last:pb-0"
                >
                  <h3 className="mb-2 font-semibold text-fg">{item.name}</h3>
                  <p className="leading-relaxed text-fg-muted">
                    {item.acceptedAnswer.text}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Final CTA */}
          <section className="mt-6 rounded-2xl border border-accent/40 bg-bg-panel p-8">
            <h2 className="mb-4 text-2xl font-bold text-fg">
              Find the leak on your page
            </h2>
            <p className="mb-6 leading-relaxed text-fg-muted">
              The free Nebula audit checks all 7 signals and returns a
              prioritised list of what to fix first. The $97 Fix Pack implements
              every finding — rewritten copy, rebuilt sections, deployed to your
              live page within 48 hours.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/audit"
                className="inline-flex rounded-xl bg-accent px-6 py-3 font-semibold text-bg hover:bg-accent-light transition-colors"
              >
                Run the free audit
              </Link>
              <Link
                href="/pricing"
                className="inline-flex rounded-xl border border-accent px-6 py-3 font-semibold text-accent hover:bg-accent-dim transition-colors"
              >
                See the Fix Pack
              </Link>
            </div>
          </section>

          {/* Related */}
          <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
            <h2 className="mb-4 text-2xl font-bold text-fg">
              Related leak checks
            </h2>
            <div className="space-y-1">
              {[
                {
                  href: '/learning-centre/google-ads-clicks-no-sales',
                  label:
                    'Google Ads Clicks But No Sales: Check The Page Before Budget',
                },
                {
                  href: '/learning-centre/facebook-ads-no-leads',
                  label: 'Facebook Ads Getting Clicks But No Leads',
                },
                {
                  href: '/learning-centre/high-cpc-low-conversion',
                  label:
                    'High CPC, Low Conversion: Stop Optimising The Wrong Layer',
                },
                {
                  href: '/learning-centre/landing-page-bounce-rate-high',
                  label:
                    'Landing Page Bounce Rate Too High: Which Signal Is Breaking',
                },
                {
                  href: '/learning-centre/landing-page-load-time-slow',
                  label:
                    'Landing Page Load Time Slow: Signal 4 Diagnosis and Fix',
                },
              ].map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className="block border-b border-border py-2.5 text-fg-muted transition-colors last:border-0 hover:text-accent"
                >
                  {label}
                </Link>
              ))}
            </div>
          </section>
        </div>
      </main>
    </>
  )
}
