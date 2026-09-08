import type { Metadata } from 'next'
import Link from 'next/link'
import { createArticleSchema } from '../../lib/schema'
import ArticleFaq from '../ArticleFaq'

export const metadata: Metadata = {
  title: 'The LinkedIn-to-Page Authority Gap | Nebula Learning Centre',
  description:
    'Why high-credential LinkedIn audiences bounce from pages that convert Facebook traffic - and the specific checks you need before scaling LinkedIn spend.',
  alternates: {
    canonical: 'https://nebulacomponents.com/learning-centre/linkedin-authority-gap',
  },
}

const articleSchema = createArticleSchema({
  headline:
    'Bridge the LinkedIn Authority Gap to Boost B2B Landing Pages',
  description:
    'Why high-credential LinkedIn audiences bounce from pages that convert Facebook traffic - and the specific checks you need before scaling LinkedIn spend.',
  url: 'https://nebulacomponents.com/learning-centre/linkedin-authority-gap',
  publishedDate: '2026-07-25',
  modifiedDate: '2026-07-25',
})

export default function LinkedInAuthorityGapPage() {
  return (
    <main id="main-content" className="min-h-screen bg-bg pt-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      <div className="mx-auto max-w-3xl px-4 pb-24">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm text-fg-muted" aria-label="Breadcrumb">
          <Link href="/learning-centre" className="hover:text-fg transition-colors">
            Learning Centre
          </Link>
          <span className="mx-2">/</span>
          <span>LinkedIn Ads Leaks</span>
          <span className="mx-2">/</span>
          <span>LinkedIn Authority Gap</span>
        </nav>

        {/* Header */}
        <header className="mb-8">
          <p className="mb-3 text-sm font-medium uppercase tracking-widest text-accent">
            LinkedIn Ads Leaks
          </p>
          <h1 className="mb-4 text-3xl font-bold leading-tight text-fg md:text-4xl">
            Bridge the LinkedIn Authority Gap to Boost B2B Landing Pages
          </h1>
          <p className="text-lg leading-relaxed text-fg-muted">
            LinkedIn CPCs are 3–5× Facebook. If your landing page was built for impulse-driven
            audiences, you are burning budget on visitors who are actively evaluating you - and
            finding nothing convincing enough to stay.
          </p>
            <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Link
                href="/audit?utm_source=learning-centre-linkedin-authority-gap&utm_medium=hero-cta"
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
        </header>

        {/* Section 1 */}
        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-xl font-semibold text-fg">
            The LinkedIn Visitor Mental Model
          </h2>
          <p className="mb-4 leading-relaxed text-fg-muted">
            A LinkedIn visitor arrives in a fundamentally different cognitive state than a Facebook
            visitor. They are not impulse-browsing. They have seen an ad in a professional context,
            evaluated it against their current work problem, and made an active decision to click.
            That means they arrive as a <em>vendor evaluator</em>, not a passive consumer.
          </p>
          <p className="mb-4 leading-relaxed text-fg-muted">
            The professional credibility filter is on before the page loads. They are asking: Is
            this company credible enough to take seriously? Does this solution look like something
            my peers would consider? Would I be embarrassed to forward this to my CFO? Pages that
            pass the Facebook scroll-stop test often fail this 10-second professional evaluation
            instantly.
          </p>
          <p className="mb-4 leading-relaxed text-fg-muted">
            This is not a traffic quality problem. It is an audience-page alignment problem. The
            LinkedIn audience is often <em>higher quality</em> - but higher quality buyers require
            higher quality proof, and most landing pages were not built to deliver it.
          </p>
        </section>

        {/* Section 2 */}
        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-xl font-semibold text-fg">
            What LinkedIn Traffic Actually Scrutinises
          </h2>
          <p className="mb-4 leading-relaxed text-fg-muted">
            B2B buyers arriving from LinkedIn run a rapid credibility checklist that most pages
            fail silently. Understanding what they are looking for - and in what order - is the
            first step to fixing the gap.
          </p>
          <ul className="mb-4 space-y-3 text-fg-muted">
            <li className="flex gap-3">
              <span className="mt-1 text-accent">→</span>
              <span>
                <strong className="text-fg">Founder and company credentials.</strong> Who built
                this? What gives them the authority to solve this problem? LinkedIn users are
                accustomed to profiles - they instinctively look for signals of domain expertise.
                Anonymous brands with no named team score low.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-1 text-accent">→</span>
              <span>
                <strong className="text-fg">Specific, attributable results.</strong> "We helped
                companies grow" is invisible. "We reduced Acme Corp's cost-per-hire by 34% in 90
                days" is credible. The specificity signals that the claim is real and verifiable.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-1 text-accent">→</span>
              <span>
                <strong className="text-fg">Professional register.</strong> Casual, consumer-grade
                copy reads as amateurish to a senior buyer. This does not mean formal or stiff - it
                means precise, confident, and free of hype language.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-1 text-accent">→</span>
              <span>
                <strong className="text-fg">Peer-group relevance.</strong> Do the logos, case
                studies, and job-title references match this buyer's world? A VP of Engineering
                needs to see engineering leaders, not generic SME testimonials.
              </span>
            </li>
          </ul>
          <p className="leading-relaxed text-fg-muted">
            If any of these four signals are absent or weak, the LinkedIn visitor bounces - not
            because the offer is wrong, but because the page failed the credibility audit they ran
            in the first 15 seconds.
          </p>
        </section>

        {/* Section 3 */}
        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-xl font-semibold text-fg">The CPL Inflation Trap</h2>
          <p className="mb-4 leading-relaxed text-fg-muted">
            LinkedIn CPCs typically run 3–5× higher than Facebook for comparable B2B audiences.
            That premium is justified <em>only</em> if your conversion rate holds up. The
            economics collapse faster than most advertisers realise.
          </p>
          <div className="mb-4 rounded-xl bg-bg p-5">
            <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-fg-muted">
              Illustrative CPL comparison
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-fg-muted">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="pb-2 font-semibold text-fg">Channel</th>
                    <th className="pb-2 font-semibold text-fg">CPC</th>
                    <th className="pb-2 font-semibold text-fg">CVR</th>
                    <th className="pb-2 font-semibold text-fg">CPL</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border/50">
                    <td className="py-2">Facebook</td>
                    <td className="py-2">$4</td>
                    <td className="py-2">2.0%</td>
                    <td className="py-2">$200</td>
                  </tr>
                  <tr>
                    <td className="py-2">LinkedIn (same page)</td>
                    <td className="py-2">$16</td>
                    <td className="py-2">0.5%</td>
                    <td className="py-2">$3,200</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          <p className="mb-4 leading-relaxed text-fg-muted">
            A 4× CPC increase combined with a 4× conversion rate drop produces a 16× CPL
            difference. At that ratio, no amount of lead quality justification closes the economics
            gap. The page is the problem - not the channel, the audience, or the offer.
          </p>
          <p className="leading-relaxed text-fg-muted">
            The common mistake is attributing poor LinkedIn performance to audience intent and
            pulling spend. The correct diagnosis is that the page was never built for a professional
            credibility-first audience.
          </p>
        </section>

        {/* Section 4 */}
        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-xl font-semibold text-fg">The B2B Proof Hierarchy</h2>
          <p className="mb-4 leading-relaxed text-fg-muted">
            Not all social proof is equal to a LinkedIn audience. There is a strict hierarchy of
            credibility signals, and most pages are heavy on the bottom tiers while the top tiers -
            which actually move senior buyers - are absent.
          </p>
          <ol className="mb-4 space-y-3 text-fg-muted">
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">
                1
              </span>
              <span>
                <strong className="text-fg">Named enterprise customers.</strong> "Used by teams at
                Salesforce, HubSpot, and Workday" - with permission and logos - is the highest
                signal. Peer companies create immediate social permission.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">
                2
              </span>
              <span>
                <strong className="text-fg">Specific ROI metrics.</strong> Numbers with attribution
                ("reduced onboarding time by 40%") beat directional claims ("saves time") by a
                large margin with analytical buyers.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">
                3
              </span>
              <span>
                <strong className="text-fg">Analyst recognition.</strong> G2 Leader badges,
                Gartner mentions, Forrester citations - independent third-party validation from
                sources the buyer already trusts.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">
                4
              </span>
              <span>
                <strong className="text-fg">Credentials.</strong> Founder background, team
                expertise, years in the domain. Establishes that the people behind the product know
                what they are doing.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-white">
                5
              </span>
              <span>
                <strong className="text-fg">Logos without context.</strong> A logo strip with no
                accompanying data or quote is weak signal - but still better than nothing.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/40 text-xs font-bold text-fg-muted">
                6
              </span>
              <span>
                <strong className="text-fg">Generic testimonials.</strong> "Great product, highly
                recommend!" from an anonymous user adds almost no credibility with a senior B2B
                buyer.
              </span>
            </li>
          </ol>
          <p className="leading-relaxed text-fg-muted">
            Audit your page against this hierarchy. If your proof stack is bottom-heavy, LinkedIn
            spend will underperform regardless of how good your targeting is.
          </p>
        </section>

        {/* Section 5 */}
        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-xl font-semibold text-fg">The Form Length Paradox</h2>
          <p className="mb-4 leading-relaxed text-fg-muted">
            The conventional wisdom - shorter forms convert better - breaks down for LinkedIn
            audiences when credibility has been established. Senior B2B buyers are accustomed to
            qualification processes. They do not object to a five-field form. They object to being
            asked for commitment before trust has been earned.
          </p>
          <p className="mb-4 leading-relaxed text-fg-muted">
            The variable that matters is not field count - it is sequence. If a visitor reaches the
            form having been convinced of your credibility, specificity of results, and peer-group
            relevance, they will complete a longer form without friction. If they reach the form
            unconvinced, even a single-field email capture will feel like an overstep.
          </p>
          <div className="mb-4 rounded-xl bg-bg p-5">
            <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-fg-muted">
              Page sequence that works for LinkedIn
            </p>
            <ol className="space-y-2 text-sm text-fg-muted">
              <li className="flex gap-3">
                <span className="font-semibold text-fg">1.</span>
                <span>
                  Hero: specific outcome claim with named proof (not a generic value statement)
                </span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-fg">2.</span>
                <span>
                  Credibility block: company logos or case study metrics before any pitch
                </span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-fg">3.</span>
                <span>Problem articulation: demonstrate you understand their specific situation</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-fg">4.</span>
                <span>Solution with mechanism: <em>how</em> you produce the result, not just what it is</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-fg">5.</span>
                <span>Detailed proof: full case study excerpt or named ROI metrics</span>
              </li>
              <li className="flex gap-3">
                <span className="font-semibold text-fg">6.</span>
                <span>Form: now the visitor is ready and motivated to complete it</span>
              </li>
            </ol>
          </div>
          <p className="leading-relaxed text-fg-muted">
            Sequence beats field count. A well-sequenced page with six form fields will outconvert
            a poorly-sequenced page with one field, because the buyer arrives at the form in a
            different psychological state.
          </p>
        </section>

        {/* Section 6 */}
        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-xl font-semibold text-fg">
            Specific Checks Before Scaling LinkedIn Spend
          </h2>
          <p className="mb-4 leading-relaxed text-fg-muted">
            Run this checklist before increasing LinkedIn budget. Each item represents a common
            failure point that hurts LinkedIn conversion rates independently of traffic quality.
          </p>
          <ul className="space-y-4 text-fg-muted">
            <li className="flex gap-3">
              <span className="mt-0.5 text-accent">✓</span>
              <span>
                <strong className="text-fg">Named founder or team visible above the fold.</strong>{' '}
                Anonymous brands do not pass the LinkedIn credibility filter. Add a name, a title,
                and a credential within the first scroll.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 text-accent">✓</span>
              <span>
                <strong className="text-fg">At least one specific metric with attribution.</strong>{' '}
                "X% improvement for [Company type] in [timeframe]" in the hero or within the first
                proof block.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 text-accent">✓</span>
              <span>
                <strong className="text-fg">Job-title match in testimonials.</strong> The titles in
                your social proof should reflect the audience you are targeting. VPs need to see
                VP-level peers.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 text-accent">✓</span>
              <span>
                <strong className="text-fg">Professional register audit.</strong> Read your copy
                aloud as a senior buyer. Remove hype language ("revolutionary," "game-changing"),
                vague superlatives, and consumer-grade phrasing.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 text-accent">✓</span>
              <span>
                <strong className="text-fg">Proof before CTA.</strong> If your primary CTA appears
                before any credibility signal, move it. LinkedIn audiences will not act before they
                are convinced.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 text-accent">✓</span>
              <span>
                <strong className="text-fg">
                  LinkedIn-specific variant, not the Facebook page.
                </strong>{' '}
                If you are sending LinkedIn traffic to the same page as Facebook traffic, you are
                spending LinkedIn CPCs to reach a credibility-first audience with a
                scroll-stop-optimised page. Build a separate variant or dedicated landing page.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 text-accent">✓</span>
              <span>
                <strong className="text-fg">Mobile parity check.</strong> A large share of LinkedIn
                browsing is mobile. Ensure your credibility signals - logos, metrics, named
                testimonials - are prominent and legible at mobile viewport, not buried below the
                fold.
              </span>
            </li>
          </ul>
        </section>

        <ArticleFaq
          faqItems={[
            {
              question: 'What is the LinkedIn authority gap?',
              answer: 'It is the mismatch between a high-credential LinkedIn audience and a page built for impulse-driven traffic. The visitor arrives as a vendor evaluator and runs a credibility audit the page was never built to pass.',
            },
            {
              question: 'What do LinkedIn visitors scrutinise first?',
              answer: 'Founder and company credentials, specific attributable results, professional register, and peer-group relevance. If any of these four signals is weak, the visitor bounces within the first 15 seconds.',
            },
            {
              question: 'Why is my cost per lead so much higher on LinkedIn?',
              answer: 'LinkedIn CPCs run higher than Facebook, and if the page was not built for a credibility-first audience, the conversion rate drops at the same time. The combined effect inflates cost per lead, but the page, not the channel, is usually the problem.',
            },
            {
              question: 'Does a shorter form always convert better?',
              answer: 'Not for LinkedIn audiences. Sequence matters more than field count. A visitor who has been convinced of your credibility will complete a longer form, while an unconvinced visitor will resist even a single field.',
            },
          ]}
        />

        {/* CTA */}
        <section className="mt-6 rounded-2xl border border-accent/40 bg-bg-panel p-8">
          <h2 className="mb-3 text-xl font-semibold text-fg">
            Fix the Authority Gap Before Scaling Spend
          </h2>
          <p className="mb-6 leading-relaxed text-fg-muted">
            If your LinkedIn campaigns are generating clicks but not converting, the page is almost
            certainly failing the professional credibility audit that every senior B2B buyer runs.
            Nebula builds landing pages specifically calibrated for high-credential B2B audiences -
            structured proof hierarchies, professional copy register, and conversion sequences
            designed for evaluator-mode visitors.
          </p>
          <Link
            href="https://nebulacomponents.com"
            className="inline-block rounded bg-accent px-6 py-3 font-semibold text-white transition-opacity hover:opacity-90"
          >
            See Nebula components →
          </Link>
        </section>

        {/* Related articles */}
        <section className="mt-10">
          <h2 className="mb-4 text-lg font-semibold text-fg">Related articles</h2>
          <ul className="space-y-2 text-sm">
            <li>
              <Link
                href="/learning-centre/linkedin-ads-not-converting"
                className="text-accent hover:underline"
              >
                Why Your LinkedIn Ads Are Not Converting
              </Link>
            </li>
            <li>
              <Link
                href="/learning-centre/proof-before-cta"
                className="text-accent hover:underline"
              >
                Proof Before CTA: The Sequence That Closes B2B Buyers
              </Link>
            </li>
            <li>
              <Link
                href="/learning-centre/b2b-saas-landing-page-not-converting"
                className="text-accent hover:underline"
              >
                Why Your B2B SaaS Landing Page Is Not Converting
              </Link>
            </li>
            <li>
              <Link
                href="/learning-centre/proof-before-cta"
                className="text-accent hover:underline"
              >
                Proof Before CTA: The Simple Fix Most Landing Pages Miss
              </Link>
            </li>
          </ul>
        </section>
      </div>
    </main>
  )
}
