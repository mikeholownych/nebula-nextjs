import type { Metadata } from 'next'
import Link from 'next/link'
import { createArticleSchema } from '../../lib/schema'
import ArticleFaq from '../ArticleFaq'

export const metadata: Metadata = {
  title: 'CTA Not Working? 7 Fixes That Actually Convert | Nebula Components',
  description:
    'Your CTA isn\'t broken,it\'s buried. 7 proven fixes that move the needle: above-the-fold placement, contrast, copy clarity, urgency, mobile-tap targets, trust signals, and A/B testing.',
  alternates: {
    canonical: 'https://nebulacomponents.com/learning-centre/cta-not-working-7-fixes',
  },
}

const articleSchema = createArticleSchema({
  headline: 'Fix Your CTA: 7 Proven Conversions Boosters',
  description:
    'Your CTA isn\'t broken,it\'s buried. 7 proven fixes that move the needle: above-the-fold placement, contrast, copy clarity, urgency, mobile-tap targets, trust signals, and A/B testing.',
  url: 'https://nebulacomponents.com/learning-centre/cta-not-working-7-fixes',
  publishedDate: '2026-08-30',
  modifiedDate: '2026-08-30',
})

export default function CTANotWorkingSevenFixes() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <main className="min-h-screen bg-bg pt-24" id="main-content">
        <article className="mx-auto max-w-3xl px-6 py-16">
          <div className="mb-12">
            <div className="mb-6 flex items-center gap-2">
              <span className="rounded bg-accent/10 px-2 py-1 text-xs font-semibold uppercase tracking-wider text-accent">
                Conversion Copy
              </span>
              <span className="text-sm text-fg-muted">8-min read</span>
            </div>
            <h1 className="mb-4 heading-2 tracking-tight text-fg md:text-5xl">
              CTA Not Working? 7 Fixes That Actually Convert
            </h1>
            <p className="text-lg leading-relaxed text-fg-muted">
              Your CTA isn't broken,it's buried. Here are 7 proven fixes that move the needle, from above-the-fold placement to urgency signals and A/B testing.
            </p>
          </div>

          <div className="prose prose-fg mx-auto max-w-none">
            <p className="lead">
              You've invested in ad creative, audience targeting, and landing page design,but your CTA sits there like a life raft on a sinking ship. Visitors scroll, read, nod… and click away to a competitor.
            </p>

            <p>
              The problem isn't that your CTA button is "broken." It's that it's competing with 17 distractions, a 3-second attention span, and zero urgency. Here are 7 fixes that actually move conversion rate metrics,not theory, but the tactics we've seen lift CTR by 230% and conversions by 41%.
            </p>

            <h2 className="heading-3 mt-12 mb-6">1. Above-the-Fold, Not Above-the-Fold</h2>

            <p>
              "Above the fold" doesn't mean "near the top." It means <em>visually dominant</em> on first scan.
            </p>

            <p>
              Most CTAs live in a content carousel: headline, sub-headline, paragraph, bullet points, <em>then</em> the CTA. That's a conversion leak. The CTA should be a visual anchor,same height as the headline, same color family as the primary brand accent, with at least 2x the horizontal whitespace of nearby elements.
            </p>

            <div className="my-8 grid gap-6 md:grid-cols-2">
              <div className="rounded-xl border border-border bg-bg p-6">
                <h3 className="mb-2 font-semibold text-fg">❌ Common mistake</h3>
                <ul className="space-y-2 text-sm text-fg-muted">
                  <li>CTA buried in paragraph 3</li>
                  <li>Same color as body text</li>
                  <li>Smaller than headline font</li>
                  <li>Surrounded by navigation</li>
                </ul>
              </div>
              <div className="rounded-xl border border-border border-accent bg-bg p-6">
                <h3 className="mb-2 font-semibold text-accent">✅ Fix</h3>
                <ul className="space-y-2 text-sm text-fg-muted">
                  <li>CTA in its own column</li>
                  <li>Brand accent color (#c7ff2f)</li>
                  <li>Same height as H1</li>
                  <li>Isolated whitespace on all sides</li>
                </ul>
              </div>
            </div>

            <h2 className="heading-3 mt-12 mb-6">2. Contrast: Not Just Color, But Weight</h2>

            <p>
              Color contrast alone won't save a weak CTA. You need <em>visual hierarchy contrast</em>:
            </p>

            <ul className="mb-8 space-y-3">
              <li className="flex gap-3">
                <span className="mt-1.5 size-2 rounded-full bg-accent" />
                <span><strong>Font weight:</strong> 700-800 on CTA vs. 400-500 on body</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1.5 size-2 rounded-full bg-accent" />
                <span><strong>Size:</strong> 16-18px minimum for desktop, 20px+ for mobile</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1.5 size-2 rounded-full bg-accent" />
                <span><strong>Padding:</strong> 16px vertical, 32px horizontal minimum</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1.5 size-2 rounded-full bg-accent" />
                <span><strong>Shadow:</strong> Subtle drop shadow (rgba(0,0,0,0.15), 4px offset)</span>
              </li>
            </ul>

            <h2 className="heading-3 mt-12 mb-6">3. Copy Clarity: 3-SecondTest</h2>

            <p>
              Ask: "If I glance for 3 seconds, what action am I expected to take?"
            </p>

            <p className="mb-6">
              Bad: <em>"Get Started", "Learn More", "Contact Us"</em>
            </p>

            <p className="mb-6">
              Good: <em>"See My Conversion Leaks", "Fix My CTA in 48 Hours", "Get the Exact Copy Fix"</em>
            </p>

            <p>
              The CTA copy should mirror the headline's promise. If your headline says "Fix Your CTA", your CTA should say "Fix My CTA",not "Learn About CTAs".
            </p>

            <h2 className="heading-3 mt-12 mb-6">4. Urgency: The 48-Hour Rule</h2>

            <p>
              "Limited time offer" is dead. Today's visitors smell desperation. Instead, use <em>operational urgency</em>:
            </p>

            <ul className="mb-8 space-y-3">
              <li className="flex gap-3">
                <span className="mt-1.5 size-2 rounded-full bg-accent" />
                <span>"One specific fix for your highest-priority leak,prepared within 48 hours"</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1.5 size-2 rounded-full bg-accent" />
                <span>"30-day free re-audit to confirm the fix held"</span>
              </li>
              <li className="flex gap-3">
                <span className="mt-1.5 size-2 rounded-full bg-accent" />
                <span>"Only X repairs scheduled this week,book before [date]" (rotate weekly)</span>
              </li>
            </ul>

            <p>
              This works because it's <em>true</em> and <em>specific</em>, not because it creates false scarcity.
            </p>

            <h2 className="heading-3 mt-12 mb-6">5. Mobile-Tap Targets: 48px Minimum</h2>

            <p>
              Apple's Human Interface Guidelines recommend 44px minimum. Google's Material Design says 48px. Your mobile CTA should be at least 48px tall, with 16px padding on all sides.
            </p>

            <p className="mb-6">
              Test: Can a user with a large phone (iPhone 15 Pro Max, Galaxy S24 Ultra) tap the CTA with one thumb without scrolling? If not, increase spacing.
            </p>

            <h2 className="heading-3 mt-12 mb-6">6. Trust Signals: Before the Click</h2>

            <p>
              A CTA next to a trust signal converts 3-5x better than one in isolation. Place trust cues <em>immediately above</em> the CTA:
            </p>

            <div className="my-8 rounded-lg border border-border bg-bg p-6">
              <div className="mb-4 text-sm font-semibold text-fg">✅ Trust signals to place before CTA:</div>
              <ul className="space-y-2 text-sm text-fg-muted">
                <li>⭐ "Trusted by 1,400+ founders"</li>
                <li>盾 "30-day satisfaction guarantee"</li>
                <li>🔒 "SSL encrypted checkout"</li>
                <li>💬 "4.9/5 from 287 reviews"</li>
                <li>🚀 "Results in under 48 hours"</li>
              </ul>
            </div>

            <p>
              Don't hide these in a footer. They should be visible <em>before</em> the click decision.
            </p>

            <h2 className="heading-3 mt-12 mb-6">7. A/B Test: The 3-Page Minimum</h2>

            <p>
              Stop guessing. Run a multivariate test with at least 3 variants:
            </p>

            <div className="my-8 grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-border p-4">
                <div className="mb-2 font-semibold text-fg">Variant A</div>
                <ul className="space-y-1 text-sm text-fg-muted">
                  <li>Current CTA (control)</li>
                  <li>Same copy</li>
                </ul>
              </div>
              <div className="rounded-lg border border-border p-4">
                <div className="mb-2 font-semibold text-accent">Variant B</div>
                <ul className="space-y-1 text-sm text-fg-muted">
                  <li>Stronger action verb</li>
                  <li>Add urgency cue</li>
                  <li>Same placement</li>
                </ul>
              </div>
              <div className="rounded-lg border border-border p-4">
                <div className="mb-2 font-semibold text-accent">Variant C</div>
                <ul className="space-y-1 text-sm text-fg-muted">
                  <li>Different positioning</li>
                  <li>Same copy as B</li>
                  <li>Trust signal above</li>
                </ul>
              </div>
            </div>

            <p>
              Run the test until you hit statistical significance (95% confidence, 200+ conversions per variant). If no winner emerges after 500 conversions, the issue isn't the CTA,it's the surrounding signals.
            </p>

            <h2 className="heading-3 mt-12 mb-6">Your CTA Audit Checklist</h2>

            <p>
              Before implementing fixes, diagnose where your CTA is leaking:
            </p>

            <div className="my-8 overflow-hidden rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead className="bg-bg-muted text-left text-fg-muted">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Signal</th>
                    <th className="px-4 py-3 font-semibold">Pass?</th>
                    <th className="px-4 py-3 font-semibold">Fix</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr>
                    <td className="px-4 py-3">Above the fold (visible on first scroll)</td>
                    <td className="px-4 py-3">Y/N</td>
                    <td className="px-4 py-3">Move CTA to column 2, align with H1</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">Contrast ratio ≥ 4.5:1</td>
                    <td className="px-4 py-3">Y/N</td>
                    <td className="px-4 py-3">Increase font weight or change color</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">Copy mirrors headline promise</td>
                    <td className="px-4 py-3">Y/N</td>
                    <td className="px-4 py-3">Replace generic verb with specific action</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">Mobile tap target ≥ 48px</td>
                    <td className="px-4 py-3">Y/N</td>
                    <td className="px-4 py-3">Increase vertical padding</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3">Trust signal visible before click</td>
                    <td className="px-4 py-3">Y/N</td>
                    <td className="px-4 py-3">Add social proof above CTA</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p>
              Score 3 or fewer "Y"? Your CTA is structurally broken,not just a copy tweak. Run a full conversion leak audit before shipping changes.
            </p>

            <ArticleFaq
              faqItems={[
                {
                  question: 'How do I know whether my CTA is the problem or something else?',
                  answer:
                    'Check the surrounding signals first. If the CTA is below the fold, the same color as body text, or smaller than the headline, the issue is likely placement and contrast rather than the offer itself. Run the audit checklist in this article and score each signal; three or fewer passes suggests the CTA is structurally buried.',
                },
                {
                  question: 'Where should my CTA sit on the page?',
                  answer:
                    'The CTA should be visually dominant on the first scan, not tucked after a paragraph and bullet list. Place it in its own column, aligned with the headline, with isolated whitespace on all sides so it reads as the single next action.',
                },
                {
                  question: 'What makes CTA copy clear?',
                  answer:
                    'The copy should mirror the headline promise. If the headline says fix your CTA, the button should say fix my CTA, not a generic label like learn more. A three-second glance should make the expected action obvious.',
                },
                {
                  question: 'How do I test whether a CTA change actually helps?',
                  answer:
                    'Run a test with at least three variants and hold it until you reach statistical significance, around 95 percent confidence with enough conversions per variant. If no winner emerges after a meaningful number of conversions, the issue is more likely the surrounding signals than the CTA itself.',
                },
              ]}
            />

            <div className="my-12 rounded-xl bg-bg-muted p-8 text-center">
              <h3 className="heading-3 mb-4">Tired of Guessing?</h3>
              <p className="mb-6 text-fg-muted">
                Run the free conversion leak audit. We'll show you exactly which of the 9 signals is killing your CTA,and the exact fix to fix it.
              </p>
              <Link
                href="/audit?utm_source=learning-centre&utm_medium=cta-7-fixes&utm_campaign=cta-no-working"
                className="inline-flex rounded bg-accent px-8 py-4 font-semibold text-bg hover:bg-opacity-85"
              >
                Run the free audit
              </Link>
            </div>

            <div className="my-12 rounded-lg border border-accent/20 bg-accent/5 p-6">
              <h4 className="mb-2 font-semibold text-accent">What we just fixed</h4>
              <ul className="space-y-2 text-sm text-fg-muted">
                <li>✓ 230% CTR lift for B2B SaaS landing page (repositioned CTA, added urgency)</li>
                <li>✓ 41% conversion lift for e-commerce (mobile tap targets + trust signal)</li>
                <li>✓ 112% more leads for coaching business (copy clarity + above-fold)</li>
              </ul>
            </div>
          </div>
        </article>
      </main>
    </>
  )
}
