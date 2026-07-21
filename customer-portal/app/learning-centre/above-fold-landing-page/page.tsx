import type { Metadata } from 'next'
import Link from 'next/link'
import { createArticleSchema } from '../../lib/schema'

export const metadata: Metadata = {
  title: 'Above The Fold Landing Page: What Paid Traffic Decides Before Scrolling | Nebula Components',
  description:
    'Most paid social traffic never scrolls past the first screen. If your above-fold section does not close the case before they scroll, it never gets closed.',
  alternates: {
    canonical: 'https://nebulacomponents.shop/learning-centre/above-fold-landing-page',
  },
}

const articleSchema = createArticleSchema({
  headline: 'Above The Fold: What Paid Traffic Decides Before Scrolling',
  description:
    'Most paid social traffic never scrolls past the first screen. If your above-fold section does not close the case before they scroll, it never gets closed.',
  url: 'https://nebulacomponents.shop/learning-centre/above-fold-landing-page',
  publishedDate: '2026-07-21',
  modifiedDate: '2026-07-21',
})

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What should be above the fold on a landing page?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Five elements: a headline that names the outcome and the audience, a subheadline that explains the mechanism, at least one specific proof signal, a primary CTA visible without scrolling, and a risk-reducer (guarantee, "no credit card required", or similar). If any of these are missing or below the fold, the above-fold section is not doing conversion work.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I know what is above the fold on mobile?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Open your landing page in Chrome DevTools, set the device to iPhone 12 Pro (390x844), and screenshot what is visible without scrolling. Do not use a browser emulator as a substitute for a real device test — emulators do not replicate browser chrome height, font rendering, or thumb reach. Repeat at 375px (iPhone SE) for older Android coverage.',
      },
    },
    {
      '@type': 'Question',
      name: 'Does above-the-fold content affect conversion rate?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes, directly. For cold paid traffic with no prior brand relationship, the above-fold section is the first and often only content they evaluate before deciding to stay or leave. If the headline does not confirm the ad promise, if no proof is visible, or if the CTA requires scrolling to find, a significant portion of paid traffic exits before seeing the rest of the page.',
      },
    },
    {
      '@type': 'Question',
      name: 'Should I put the CTA above the fold?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'For cold paid traffic: yes. The CTA should be visible without scrolling. It does not have to be the dominant element — the headline and proof carry more weight — but the CTA needs to be findable in the first viewport. For warm traffic (email list, retargeting), the CTA below the fold is acceptable because those visitors are more likely to scroll. Segment your traffic type before deciding.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is the most common above-fold mistake on paid traffic landing pages?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Using the company name or tagline as the H1. "Welcome to Acme Inc." and "Transforming the Future of Work" both fail the same test: a cold visitor cannot tell from either headline whether they are in the right place. The H1 is the most-read element on the page. It should state the specific outcome you deliver and who you deliver it to, in the same language the ad used to bring the visitor there.',
      },
    },
  ],
}

export default function AboveFoldLandingPagePage() {
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
              Landing Page Leaks · Above The Fold
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-fg md:text-5xl">
              Above The Fold: What Paid Traffic Decides Before Scrolling
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-relaxed text-fg-muted">
              The fold is not a design concept — it is the boundary between the
              ad spend that worked and the ad spend that was wasted. Most paid
              social traffic never scrolls past the first screen. For cold paid
              traffic, the above-fold section is the entire page. If it does not
              close the case before they scroll, it never gets closed.
            </p>
          </div>

          {/* Section 1 — 5 required elements */}
          <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
            <h2 className="mb-4 text-2xl font-bold text-fg">
              The 5 elements required above the fold
            </h2>
            <p className="leading-relaxed text-fg-muted">
              Cold paid traffic arrives with no prior brand relationship and no
              patience. They need to answer five questions the moment the page
              loads — and the page has to answer them without requiring any
              action from the visitor.
            </p>
            <ol className="mt-5 space-y-5">
              {[
                {
                  label: 'Headline — what it is and who it is for',
                  body: 'Not your brand tagline. Not a clever play on words. A direct statement of the outcome you deliver, for the person you deliver it to. "We help SaaS founders reduce churn" is a headline. "Grow beyond limits" is noise. The headline should use the same noun phrase the ad used — the visitor arrived because of a specific promise, and the headline either confirms they are in the right place or it does not.',
                },
                {
                  label: 'Subheadline — the mechanism',
                  body: 'One sentence that explains how you deliver the outcome. Specificity here does the trust-building work that the headline started. Vague subheadlines ("with the power of AI") undo the credibility the headline created.',
                },
                {
                  label: 'Proof signal — one specific, credible data point',
                  body: 'A number of customers, a recognisable logo, a specific result. Not a 5-star rating with no context — that is decoration, not proof. One specific, attributable proof element above the fold changes the trust calculus for a cold visitor.',
                },
                {
                  label: 'Primary CTA — visible without scrolling',
                  body: 'One action. Label that describes the outcome of clicking, not the mechanics: "Start my free trial" not "Submit." The CTA does not have to dominate the viewport — the headline carries more weight — but it must be findable without scrolling.',
                },
                {
                  label: 'Risk-reducer — something that lowers the cost of action',
                  body: '"No credit card required." "Cancel any time." A money-back guarantee. Something specific that lowers the perceived risk of taking the CTA action. "Risk-free" alone is marketing copy — it does not answer the question of what risk-free means in practice.',
                },
              ].map(({ label, body }, i) => (
                <li key={i} className="flex gap-4">
                  <span className="shrink-0 mt-0.5 text-accent font-bold">{i + 1}.</span>
                  <div>
                    <p className="font-semibold text-fg">{label}</p>
                    <p className="mt-1 leading-relaxed text-fg-muted">{body}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="mt-5 leading-relaxed text-fg-muted">
              If any of these five are missing or positioned below the fold, you
              have a structural conversion leak that no amount of targeting
              optimisation will fix.
            </p>
          </section>

          {/* Section 2 — Common failures */}
          <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
            <h2 className="mb-4 text-2xl font-bold text-fg">
              The most common above-fold failures
            </h2>
            <p className="leading-relaxed text-fg-muted">
              These are the patterns that consistently show up as conversion
              leaks on paid traffic landing pages. They are not subtle design
              errors — they are structural choices that make the above-fold
              section do no selling work at all.
            </p>
            <ul className="mt-5 space-y-4 text-fg-muted">
              {[
                {
                  label: 'Company name or tagline as H1',
                  body: '"Welcome to Acme Inc." and "Transforming the Future of Work" both fail the same test: a cold visitor cannot tell from either whether they are in the right place. The H1 is the most-read element on the page. Wasting it on a brand name or a vague aspiration is a first-impression failure.',
                },
                {
                  label: 'Generic hero image',
                  body: 'A stock photo of a smiling team, an abstract gradient, or a product screenshot with no context consumes above-fold real estate without communicating anything. The image should reinforce the headline claim, not decorate it.',
                },
                {
                  label: 'CTA below the fold',
                  body: 'On mobile at 390px, a CTA positioned 1,200px down the page might as well not exist for cold traffic. If the visitor has to scroll to find out what to do next, a portion of them will not scroll — they will use the back button.',
                },
                {
                  label: 'No proof in the first viewport',
                  body: 'A page that asks for action before it gives evidence is asking for trust it has not earned. Even a single, specific social proof element above the fold changes the trust calculus. Generic badges and star ratings without context do not count.',
                },
                {
                  label: 'Competing visual weights',
                  body: 'Multiple large elements at the same size, multiple CTAs, or a complex navigation bar all split attention and reduce the probability that the primary CTA is what the visitor\'s eye lands on. Simplifying the above-fold section — removing elements rather than adding them — is consistently the highest-leverage intervention for pages with visual hierarchy problems.',
                },
              ].map(({ label, body }) => (
                <li key={label} className="border-b border-border pb-4 last:border-0 last:pb-0">
                  <p className="font-semibold text-fg">{label}</p>
                  <p className="mt-1 leading-relaxed">{body}</p>
                </li>
              ))}
            </ul>
          </section>

          {/* Section 3 — fold varies by device */}
          <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
            <h2 className="mb-4 text-2xl font-bold text-fg">
              The fold is different on every device — test both
            </h2>
            <p className="leading-relaxed text-fg-muted">
              &ldquo;Above the fold&rdquo; is not a fixed pixel height. On a
              375px iPhone with browser chrome, the visible viewport is roughly
              580px tall. On a 1024px laptop with a 72px navigation bar, it is
              approximately 950px. What appears above the fold in your desktop
              design tool may be deep below the fold on the phone your traffic
              is using.
            </p>
            <p className="mt-4 leading-relaxed text-fg-muted">
              The diagnostic protocol:
            </p>
            <ul className="mt-4 space-y-3 text-fg-muted">
              {[
                'Open your landing page in Chrome DevTools. Set device to iPhone 12 Pro (390×844). Screenshot what is visible without scrolling. Do all 5 required elements appear?',
                'Repeat at 375px (iPhone SE / older Android). If layout breaks or key elements disappear, that is a specific technical fix, not a copy problem.',
                'Check 1024px for tablet/small laptop. CTA buttons tend to disappear at tablet breakpoints due to layout reflows.',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-4 leading-relaxed text-fg-muted">
              If your paid traffic is primarily mobile — check your analytics;
              most paid social is — optimise for 375–390px first. Desktop
              performance is secondary to the device your visitors are actually
              using.
            </p>
          </section>

          {/* Section 4 — visual hierarchy */}
          <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
            <h2 className="mb-4 text-2xl font-bold text-fg">
              Visual hierarchy: the reading order is the sales sequence
            </h2>
            <p className="leading-relaxed text-fg-muted">
              The eye does not read a landing page — it scans it. Size,
              contrast, and position determine reading order. That reading order
              determines whether the above-fold section makes its argument in
              the right sequence.
            </p>
            <p className="mt-4 leading-relaxed text-fg-muted">
              Audit your visual hierarchy with this test: if a visitor reads
              only the three largest elements on your above-fold section, do
              they understand what you do, who it is for, and what to do next?
              If those three elements are your logo, a decorative image, and a
              generic tagline — your hierarchy is selling nothing.
            </p>
            <p className="mt-4 leading-relaxed text-fg-muted">
              The correct hierarchy for cold paid traffic is: headline &rarr;
              proof signal or subheadline &rarr; CTA. Everything else should be
              visually subordinate. When multiple elements compete at the same
              visual weight, the visitor&apos;s eye lands nowhere in particular
              — which means it is less likely to land on the CTA.
            </p>
          </section>

          {/* Section 5 — speed + fold */}
          <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
            <h2 className="mb-4 text-2xl font-bold text-fg">
              Speed and the fold: slow pages lose visitors before they see the
              first screen
            </h2>
            <p className="leading-relaxed text-fg-muted">
              Above-fold optimisation only matters if the page loads fast enough
              for the above-fold section to be seen. A 2020 Deloitte/Google
              study of 37 retail, travel, and lead-generation brands found that
              a 0.1-second improvement in mobile load time increased retail
              conversions by 8.4% and travel conversions by 10.1%. The
              study&apos;s full methodology is available at{' '}
              <a
                href="https://www.thinkwithgoogle.com/_qs/documents/9757/Milliseconds_Make_Millions_report_hQYAbZJ.pdf"
                className="text-accent hover:text-accent-light underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Think with Google: Milliseconds Make Millions
              </a>
              .
            </p>
            <p className="mt-4 leading-relaxed text-fg-muted">
              According to the{' '}
              <a
                href="https://almanac.httparchive.org/en/2024/performance"
                className="text-accent hover:text-accent-light underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                2024 Web Almanac
              </a>{' '}
              (HTTP Archive, Nov 2024), only 38% of mobile home pages passed
              all Core Web Vitals in 2024. That means more than six in ten
              mobile landing pages are failing Google&apos;s real-world
              performance thresholds — before the above-fold content is ever
              evaluated.
            </p>
            <p className="mt-4 leading-relaxed text-fg-muted">
              If your LCP is above 2.5 seconds on mobile, fix load time before
              optimising above-fold layout. A visitor who abandons during load
              never sees your headline.
            </p>
          </section>

          {/* Mid-article CTA */}
          <div className="my-6 rounded-2xl border border-accent/40 bg-bg-panel p-6">
            <p className="text-sm font-semibold text-accent mb-1">
              Not sure what is visible above the fold on your page?
            </p>
            <p className="text-fg-muted text-sm mb-4">
              The free Nebula audit checks all 7 conversion signals — including
              mobile layout (signal 3) — and returns a prioritised fix list.
            </p>
            <Link
              href="/audit"
              className="inline-flex rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-bg hover:bg-accent-light transition-colors"
            >
              Run the free audit
            </Link>
          </div>

          {/* FAQ */}
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
              every finding — rewritten copy, rebuilt sections, deployed within
              48 hours.
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
                { href: '/learning-centre/landing-page-not-converting', label: 'Landing Page Not Converting? Diagnose These 5 Leaks First' },
                { href: '/learning-centre/mobile-landing-page-leaks', label: 'Mobile Landing Page Leaks That Kill Paid Traffic' },
                { href: '/learning-centre/message-match-checklist', label: 'Message Match Checklist For Paid Traffic' },
                { href: '/learning-centre/cta-not-working', label: 'CTA Not Working: 4 Failure Patterns' },
                { href: '/learning-centre/landing-page-load-time-slow', label: 'Landing Page Load Time Slow: Signal 4 Diagnosis' },
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
