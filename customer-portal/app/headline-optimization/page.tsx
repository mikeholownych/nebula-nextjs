import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Landing Page Headline Optimization: Fix H1s That Lose Cold Traffic in 3 Seconds | Nebula',
  description:
    'Most landing page headlines describe the product instead of the outcome. Six repeatable failures - product name as H1, category jargon, no ICP signal, ad mismatch, over-length, vague benefit - each with a bounded fix.',
  alternates: {
    canonical: 'https://nebulacomponents.com/headline-optimization',
  },
  openGraph: {
    title: 'Landing Page Headline Optimization: Fix H1s That Lose Cold Traffic in 3 Seconds | Nebula',
    description:
      'Most landing page headlines describe the product instead of the outcome. Six repeatable failures with bounded fixes.',
    url: 'https://nebulacomponents.com/headline-optimization',
    siteName: 'Nebula Components',
    type: 'article',
  },
}

const faqItems = [
  {
    q: 'What makes a high-converting landing page headline?',
    a: "A high-converting headline states the specific outcome the buyer wants, not a description of the product. It answers 'what's in it for me?' in under 8 words. The best headlines name the problem being solved or the result being delivered.",
  },
  {
    q: 'How do I test if my headline is weak?',
    a: "Cover your logo and product name. Read only the headline. Would a cold visitor know what they get, who it's for, and why it matters? If the answer is no to any of these, the headline is weak. Free brief audit scores your headline across 9 conversion signals.",
  },
  {
    q: 'What is the money angle for a headline?',
    a: "The money angle connects the headline directly to financial loss or gain - 'Stop burning ad budget on a page that can't convert.' It works best for cold paid-traffic visitors because it matches the pain they're actively feeling.",
  },
  {
    q: 'How long should a landing page headline be?',
    a: '6–12 words is the sweet spot. Longer than 12 words loses punch. Under 6 words often lacks specificity. The goal is one clear result, stated as concisely as possible.',
  },
]

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Landing Page Headline Optimization: Fix H1s That Lose Cold Traffic in 3 Seconds',
  description:
    'Diagnostic guide covering the six most common landing page headline failures - product name as H1, category jargon, missing ICP signal, ad-to-page mismatch, over-length, and vague benefit - with a bounded fix for each.',
  author: { '@type': 'Organization', name: 'Nebula Components' },
  publisher: { '@type': 'Organization', name: 'Nebula Components' },
  mainEntityOfPage: 'https://nebulacomponents.com/headline-optimization',
}

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqItems.map(({ q, a }) => ({
    '@type': 'Question',
    name: q,
    acceptedAnswer: { '@type': 'Answer', text: a },
  })),
}

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://nebulacomponents.com' },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Headline Optimization',
      item: 'https://nebulacomponents.com/headline-optimization',
    },
  ],
}

const HEADLINE_FAILURES = [
  {
    signal: 'Headline (H1)',
    label: "Product name as H1 - 'Blue Widget Pro' states what it is, not what it does",
    detail:
      "Using the product name as the primary headline is the most common H1 mistake on B2B SaaS and direct-response pages. The product name carries zero meaning for a cold visitor who has never heard of it. 'Blue Widget Pro' tells them nothing about who it is for, what problem it solves, or what changes after they sign up. The product name belongs in the title tag and brand mark - not in the highest-weight copy on the page.",
    fix: "Replace the product name with the buyer's outcome or situation. One test: remove the product name from the H1 and ask whether a cold visitor would now understand what they get. If the answer is yes, the new headline is better. The product name can live in the logo, the nav, and the title tag.",
  },
  {
    signal: 'Specificity',
    label: "Category description instead of outcome - 'All-in-one platform' vs 'Track all your team's tasks in one place'",
    detail:
      "'All-in-one platform', 'Collaborative workspace', 'The modern solution for teams' - these describe a product category, not a result. A cold visitor evaluating your page already knows what category they are looking at. What they don't know is whether your product solves their specific problem. Category headlines fail because they force the visitor to do the translation work: 'OK, it's a platform - but what does it actually do for me?' Most don't bother.",
    fix: "State what the visitor achieves, not what the product category is. 'Track all your team's tasks in one place' is specific. 'All-in-one platform' is not. The test: can you swap your headline onto a competitor's page without changing anything? If yes, the headline is too generic.",
  },
  {
    signal: 'ICP Clarity',
    label: "No ICP signal - headline doesn't confirm who the product is for",
    detail:
      "Cold paid traffic arrives from targeted ads. The ad said 'for engineering teams' or 'for freelance designers' - then the landing page H1 says 'The workspace for everyone.' The visitor who was just told the product is for them now sees a page that is for everyone. That mismatch triggers doubt. A headline without an ICP signal cannot confirm that the visitor belongs on the page, and cold traffic that isn't confirmed in the first viewport exits at twice the rate of traffic that is.",
    fix: "Name the ICP in the headline or the first sentence below it. 'The project tracker for software engineering teams' has ICP clarity. 'The project tracker' does not. If your product genuinely serves multiple ICPs, use a dynamic headline matched to the ad audience, or pick the primary ICP and build a dedicated landing page for secondary audiences.",
  },
  {
    signal: 'Message Match',
    label: "Headline/ad mismatch - page H1 doesn't echo the ad that brought the visitor",
    detail:
      "Message match is the degree to which a visitor's mental state arriving from an ad is confirmed by the landing page they land on. An ad that reads 'Stop losing deals to slow proposals' creates a specific expectation. A landing page that opens with 'Beautiful Proposal Software' fails that expectation immediately. The visitor was promised relief from a problem; the page opens with a product category. The resulting mismatch is the single highest-leverage conversion variable for paid traffic campaigns - higher than page design, higher than social proof.",
    fix: "The H1 should echo the core phrase from the ad - not copy it verbatim, but confirm the same outcome or problem. If the ad says 'Stop losing deals', the landing page H1 should reference lost deals. Run a message match check: read the ad headline, then read the landing page H1. Do they feel like they're continuing the same conversation?",
  },
  {
    signal: 'Length',
    label: 'Too long - H1 over 90 chars gets cut at fold on mobile; message truncated',
    detail:
      "A headline over 90 characters rendered at normal mobile font sizes (28–32px) wraps to 4–5 lines on a 375px screen. On many templates this pushes the subheading and CTA below the fold. The visitor sees a wall of headline text, no clear next action, and exits. The problem compounds when the headline is a compound sentence that could be split: 'The only project management tool that integrates with Slack, Jira, and GitHub so your engineering team never has to switch tabs again' is 112 characters and four clauses - it should be a headline and a subhead, not one H1.",
    fix: "Target 6–12 words (roughly 40–70 characters). Move supporting clauses to the subheading below the H1. Test the result on a 375px-wide mobile viewport: the headline should complete within two lines and leave room for a CTA above the fold.",
  },
  {
    signal: 'Benefit Specificity',
    label: "Vague benefit - 'Grow faster', 'Save time', 'Work smarter' - unmeasurable and identical to every competitor",
    detail:
      "'Grow faster', 'Save time', 'Work smarter', 'Boost productivity', 'Scale your business' - these phrases appear on thousands of landing pages and say nothing that differentiates any product from any other. They survive in headlines because they feel safe and aspirational. But for a cold visitor evaluating a specific purchase, unmeasurable benefits provide no decision criteria. 'Save time' on what? By how much? Compared to what? A vague benefit headline forces the visitor to trust the product without giving them any evidence-based reason to do so.",
    fix: "Replace the vague benefit with a specific, observable outcome. 'Save time' becomes 'Close the monthly report in 20 minutes instead of 3 hours.' 'Grow faster' becomes 'Add 2 new clients a week without hiring.' The specificity signals that the product has a real mechanism - and it gives the visitor something to evaluate.",
  },
]

export default function HeadlineOptimizationPage() {
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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <main id="main-content" className="min-h-screen bg-bg pt-24 pb-16">
        <article className="mx-auto max-w-4xl px-6">

          {/* Header */}
          <header className="mb-12">
            <p className="text-xs font-semibold uppercase tracking-wider text-accent mb-2">
              Headline Conversion
            </p>
            <h1 className="text-3xl font-extrabold tracking-tight text-fg md:text-5xl">
              Landing Page Headline Optimization
            </h1>
            <p className="mt-4 text-lg text-fg-muted leading-relaxed max-w-2xl">
              Your headline has 3 seconds to tell a cold visitor they&apos;re in the right place. If it describes your product instead of their outcome - or doesn&apos;t match the ad that brought them - 40–60% of visitors leave before scrolling. This is the highest-leverage fix on any landing page, and it fails in six specific, repeatable ways.
            </p>
          </header>

          {/* Six failure patterns */}
          <section className="mb-14">
            <h2 className="text-2xl font-bold tracking-tight text-fg mb-6">
              Six headline failures that drive visitors away
            </h2>
            <div className="space-y-4">
              {HEADLINE_FAILURES.map((f, i) => (
                <div key={i} className="rounded-xl border border-border bg-bg-muted/20 p-6">
                  <div className="flex items-start gap-3 mb-3">
                    <span className="shrink-0 font-mono text-xs text-fg-dim mt-0.5">{String(i + 1).padStart(2, '0')}</span>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-accent mb-0.5">{f.signal}</p>
                      <h3 className="text-base font-semibold text-fg">{f.label}</h3>
                    </div>
                  </div>
                  <p className="text-sm text-fg-muted leading-6 mb-3 pl-7">{f.detail}</p>
                  <div className="pl-7 border-l-2 border-accent/30 ml-7">
                    <p className="text-xs font-semibold text-accent uppercase tracking-wider mb-1">Fix</p>
                    <p className="text-sm text-fg-muted leading-6">{f.fix}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Pass/Fail signal grid */}
          <section className="mb-14">
            <h2 className="text-2xl font-bold tracking-tight text-fg mb-4">
              What the audit checks on your headline
            </h2>
            <p className="text-sm text-fg-muted leading-6 mb-6 max-w-2xl">
              Nebula checks six headline signals on every page audit. Each returns pass or fail with the raw H1 text observed from your page - so you can verify the finding against what your visitors actually see.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { signal: 'Outcome vs. Product', pass: 'H1 states a buyer outcome or solved problem', fail: 'H1 is a product name or category label' },
                { signal: 'Specificity', pass: "H1 names a concrete, observable result", fail: "H1 uses category jargon ('all-in-one', 'modern', 'collaborative')" },
                { signal: 'ICP Clarity', pass: 'H1 or immediate subhead names who the product is for', fail: 'No audience signal - headline targets everyone' },
                { signal: 'Message Match', pass: 'H1 echoes the core phrase from the ad that brought the visitor', fail: "H1 ignores the ad's promise - visitor sees a mismatch" },
                { signal: 'Length', pass: 'H1 is 6–12 words; completes in 2 lines on mobile', fail: 'H1 exceeds 90 characters - truncated below fold on mobile' },
                { signal: 'Benefit Specificity', pass: 'Benefit is measurable and specific to this product', fail: "Vague benefit ('Grow faster', 'Save time') shared by all competitors" },
              ].map((s) => (
                <div key={s.signal} className="rounded-xl border border-border bg-bg-muted/20 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-accent mb-2">{s.signal}</p>
                  <p className="text-xs text-fg-muted leading-5 mb-1">
                    <span className="text-accent">Pass: </span>{s.pass}
                  </p>
                  <p className="text-xs text-fg-muted leading-5">
                    <span className="text-signal-fail">Fail: </span>{s.fail}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* CTA */}
          <section className="mb-14 rounded-2xl border border-border bg-bg-muted/30 p-8 text-center">
            <h2 className="text-2xl font-bold text-fg mb-3">See exactly how your headline scores</h2>
            <p className="text-sm text-fg-muted max-w-xl mx-auto mb-6">
              Paste your URL. Nebula reads your actual H1, checks it against message match, ICP clarity, and benefit specificity signals - and returns a score with the raw text your visitors see. Free, no signup, under 2 minutes.
            </p>
            <Link
              href="/audit?utm_source=content&utm_medium=organic-content"
              className="inline-block rounded-xl bg-accent px-8 py-4 font-semibold text-bg hover:opacity-85 hover:bg-accent transition-colors text-base"
            >
              Run Free Headline Audit &rarr;
            </Link>
            <p className="text-xs text-fg-dim mt-4">Free audit live · results in under 2 minutes</p>
          </section>

          {/* FAQ */}
          <section className="mb-14">
            <h2 className="text-2xl font-bold tracking-tight text-fg mb-6">Common questions</h2>
            <div className="space-y-4">
              {faqItems.map(({ q, a }, i) => (
                <div key={i} className="rounded-xl border border-border bg-bg-muted/20 p-5">
                  <h3 className="text-sm font-semibold text-fg mb-2">{q}</h3>
                  <p className="text-sm text-fg-muted leading-6">{a}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Related */}
          <footer className="border-t border-border pt-8 flex flex-wrap gap-4 text-sm text-fg-muted">
            <span className="font-semibold text-fg">Related:</span>
            <Link href="/landing-page-cta-audit" className="hover:text-accent transition-colors">Landing Page CTA Audit</Link>
            <Link href="/landing-page-message-match" className="hover:text-accent transition-colors">Message Match Guide</Link>
            <Link href="/ads-getting-clicks-but-no-sales" className="hover:text-accent transition-colors">Ads Getting Clicks But No Sales</Link>
            <Link href="/why-is-my-landing-page-not-converting" className="hover:text-accent transition-colors">Why Your Page Isn&apos;t Converting</Link>
            <Link href="/pricing" className="hover:text-accent transition-colors">Repair Sprint Pricing</Link>
          </footer>

          <RelatedContent
            heading="Related resources"
            items={[
              { href: '/cta-optimization', label: 'CTA optimization', type: 'guide' },
            { href: '/landing-page-message-match', label: 'Message match audit', type: 'audit-type' },
            { href: '/audit', label: 'Get your free audit', type: 'cta' }
            ]}
          />

        </article>
      </main>
    </>
  )
}
