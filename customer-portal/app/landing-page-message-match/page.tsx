import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Landing Page Message Match: Ad-to-Page Alignment and Quality Score | Nebula',
  description:
    'Message match failures waste correctly targeted clicks. Ad targets a keyword, landing page headline ignores it. Ad promises a free tool, page leads with pricing. Ad addresses one ICP, page speaks to a different audience. This guide covers each mismatch pattern with the signal and the fix.',
  alternates: {
    canonical: 'https://nebulacomponents.com/landing-page-message-match',
  },
  openGraph: {
    title: 'Landing Page Message Match: Ad-to-Page Alignment and Quality Score | Nebula',
    description:
      'Message match failures waste correctly targeted clicks. Ad targets a keyword, landing page headline ignores it. Ad promises a free tool, page leads with pricing. Ad addresses one ICP, page speaks to a different audience.',
    url: 'https://nebulacomponents.com/landing-page-message-match',
    siteName: 'Nebula Components',
    type: 'article',
  },
}

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Landing Page Message Match: Ad-to-Page Alignment and Quality Score',
  description:
    'Diagnostic guide for landing page message match failures — keyword mismatch, offer mismatch, audience mismatch, tone mismatch, visual mismatch, and CTA commitment mismatch between ad and page.',
  author: { '@type': 'Organization', name: 'Nebula Components' },
  publisher: { '@type': 'Organization', name: 'Nebula Components' },
  mainEntityOfPage: 'https://nebulacomponents.com/landing-page-message-match',
}

const faqItems = [
  {
    q: 'What is message match on a landing page?',
    a: "Message match is the degree of continuity between the ad copy and the landing page headline. A visitor who clicked an ad for 'free landing page audit' and arrives at a page that says 'Conversion optimization platform' has to re-evaluate whether they're in the right place. That re-evaluation costs time and conversions. Strong message match means the page headline immediately confirms the ad promise.",
  },
  {
    q: 'Does message match affect Quality Score?',
    a: 'Yes. Google Ads Quality Score includes a landing page experience component that evaluates relevance between the keyword, ad, and landing page content. A high message match — ad keyword appears in the landing page H1, title tag, and meta description — improves Quality Score, which reduces CPC and improves ad placement.',
  },
  {
    q: 'How closely should the landing page headline match the ad?',
    a: "The core promise should match within 3 words. If the ad says 'free landing page audit', the H1 should contain 'landing page audit'. The exact phrasing can vary, but the central value claim — what the visitor gets — must be immediately recognizable from the ad they clicked.",
  },
  {
    q: 'What is the difference between keyword match and message match?',
    a: 'Keyword match is an ad targeting setting. Message match is a landing page design principle. You can have perfect keyword targeting (ad shown to exactly the right searcher) and terrible message match (page headline ignores the keyword entirely). They are independent variables. Message match failures waste correctly targeted clicks.',
  },
  {
    q: 'How do I audit my own message match?',
    a: "Read your ad copy, then immediately look at your landing page H1. Ask: does this H1 confirm the promise I made in the ad? Then check: does the page CTA match the CTA in the ad? Finally: is the audience the ad addressed the same audience the page headline speaks to? Three mismatches = three separate conversion failures.",
  },
]

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
      name: 'Landing Page Message Match',
      item: 'https://nebulacomponents.com/landing-page-message-match',
    },
  ],
}

const MESSAGE_FAILURES = [
  {
    signal: 'Headline (H1)',
    label: "Keyword mismatch — ad targets one term, page headline addresses another",
    detail:
      "An ad targeting 'landing page audit tool' brings a visitor to a page whose H1 reads 'Conversion optimization platform'. These are not the same thing to the visitor. They clicked expecting a tool for auditing landing pages and arrived at a platform for optimizing conversion — a category that could mean anything. The visitor must re-evaluate whether this page addresses their search intent before proceeding. This re-evaluation creates an exit opportunity that did not exist in the ad. The click was correctly targeted. The page wasted it.",
    fix: "The H1 must contain the core promise from the ad within the first 6 words. If the ad says 'landing page audit', the H1 should say 'landing page audit'. The phrasing can vary — 'Free landing page audit', 'landing page audit' — but the central keyword must be present and prominent. Check that the H1 matches the title tag, which should also contain the ad's core keyword.",
  },
  {
    signal: 'Offer',
    label: "Offer mismatch — ad promises free tool, page leads with pricing",
    detail:
      "An ad that promises 'Free audit in 2 minutes' creates an explicit expectation: the visitor will get a free audit in 2 minutes. Arriving at a page that leads with a pricing section breaks that expectation at the highest-stakes moment — first impression. The visitor's immediate interpretation is not neutral confusion; it is that they were misled. Pages that run 'free' messaging in ads and then present the free option as a secondary action below pricing are generating the highest-damage trust failure available: the visitor feels deceived before they've read a single body sentence.",
    fix: "The page must lead with exactly what the ad promised. If the ad says 'free audit', the hero must make the free audit the primary, unmissable action — not a small link below a pricing grid. Match the specific offer language from the ad in the H1 and CTA. If you want to present pricing on the page, place it below the free offer — never above it on a page running free-offer ad creative.",
  },
  {
    signal: 'Audience',
    label: 'Audience mismatch — ad targets one ICP, headline addresses another',
    detail:
      "An ad targeting ecommerce founders that brings visitors to a page whose headline reads 'Built for marketing teams' has failed to confirm the ICP on arrival. The ecommerce founder reads 'marketing teams' and cannot place themselves in that description. They are a founder, not a marketing team. The page might be exactly right for them — but it has not told them so. Cold traffic expects immediate ICP confirmation: 'You are in the right place. This is for someone like you.' A headline that addresses the wrong audience category generates an exit even when the product is correct.",
    fix: "The H1 should explicitly name the audience the ad targeted. If the ad targeted ecommerce founders, the H1 should reference ecommerce founders, store owners, or DTC brands — not the generic 'marketing teams' framing. ICP confirmation is the H1's primary job for paid traffic. The visitor already expressed intent through the click; the page's job is to confirm their decision, not make them re-evaluate it.",
  },
  {
    signal: 'Tone',
    label: "Tone mismatch — urgent ad copy, corporate brand language on page",
    detail:
      "An ad with copy like 'Your page is leaking conversions right now' is urgent, specific, and problem-aware. It speaks directly to a visitor who has identified a problem. The page it sends them to opens with 'Empowering businesses to grow' — brand-register language that could apply to any company in any industry. The tonal discontinuity is disorienting: the visitor arrived primed for a direct, problem-specific solution and encountered generic aspiration. The emotional register of the page must match the emotional register of the ad.",
    fix: "Read your ad copy aloud, then read your H1 aloud. They should feel like they are from the same conversation. If the ad is urgent and problem-specific, the H1 should be urgent and problem-specific. If the ad uses the visitor's industry terminology, the H1 should use the same terminology. Brand-register language on the page that runs direct-response ads is the most common tone mismatch observed.",
  },
  {
    signal: 'Visual Context',
    label: 'Visual mismatch — ad uses product screenshots, page opens with abstract illustration',
    detail:
      "An ad that features product screenshots builds a visual expectation: the product looks like this, it is specific, it is real. A page that opens with an abstract geometric illustration breaks that expectation immediately. The visitor formed a mental model of the product from the ad creative — a specific interface, a specific output, a specific result — and the page has replaced it with an image that communicates nothing specific. Visual mismatch is most damaging when the ad's strength was product specificity; abstract illustrations undercut that signal directly.",
    fix: "Match the visual register of the landing page to the visual register of the ad creative. If the ad features product screenshots, the page hero should feature the same product, at the same level of specificity. If the ad features a before/after comparison, the page should lead with the same comparison. The visitor's visual context carries from the ad to the page — preserve it rather than replacing it.",
  },
  {
    signal: 'CTA',
    label: "CTA commitment mismatch — ad says 'Get free analysis', page says 'Book a demo'",
    detail:
      "An ad CTA of 'Get free analysis' creates a specific commitment expectation: I will receive an analysis, it will be free, and it will not require a sales conversation. Arriving at a page whose primary CTA is 'Book a demo' changes the commitment level without warning. The visitor expected an immediate, free, self-serve output. They are being offered a scheduled sales call. These are not equivalent commitments. The CTA mismatch forces the visitor to re-evaluate their decision at the highest-friction moment — the conversion point.",
    fix: "The page's primary CTA must match the commitment level the ad created. If the ad promised a free, immediate output, the page CTA must deliver a free, immediate output — not a sales meeting. If the ad was running for a free tool and the page only offers a demo, either change the ad to reflect the actual offer or add the self-serve path the ad promised. CTA commitment mismatch is a trust failure, not just a copy inconsistency.",
  },
]

export default function MessageMatchPage() {
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
              Message Match Audit
            </p>
            <h1 className="text-3xl font-extrabold tracking-tight text-fg md:text-5xl">
              Landing Page Message Match
            </h1>
            <p className="mt-4 text-lg text-fg-muted leading-relaxed max-w-2xl">
              Message match failures waste correctly targeted clicks. The ad brought the right visitor — the page failed to keep them. Keyword mismatch. Offer mismatch. Wrong ICP in the headline. Urgent ad creative landing on corporate brand language. Each mismatch is observable, measurable, and fixable.
            </p>
          </header>

          {/* Six failure patterns */}
          <section className="mb-14">
            <h2 className="text-2xl font-bold tracking-tight text-fg mb-6">
              Six message match failure patterns
            </h2>
            <div className="space-y-4">
              {MESSAGE_FAILURES.map((f, i) => (
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

          {/* Pass/fail signal grid */}
          <section className="mb-14">
            <h2 className="text-2xl font-bold tracking-tight text-fg mb-4">
              What the audit checks for message match
            </h2>
            <p className="text-sm text-fg-muted leading-6 mb-6 max-w-2xl">
              Nebula evaluates message match from your page's H1, title tag, and CTA against the signals that indicate continuity with paid ad traffic. Each check returns the raw value from your actual page.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { signal: 'Keyword Match', pass: 'H1 contains the core keyword from ad targeting', fail: 'H1 addresses a different topic than the ad keyword' },
                { signal: 'Offer Match', pass: 'Page leads with the offer stated in the ad', fail: "Ad promises free tool — page leads with pricing" },
                { signal: 'Audience Match', pass: 'H1 explicitly names the ICP the ad targeted', fail: 'H1 addresses a different audience category than the ad' },
                { signal: 'Tone Match', pass: 'Page tone matches the register of the ad creative', fail: 'Direct-response ad lands on generic brand language' },
                { signal: 'Visual Match', pass: 'Page hero visuals match the ad creative type', fail: 'Ad uses product screenshots — page opens with abstract illustration' },
                { signal: 'CTA Match', pass: 'Page CTA commitment level matches the ad CTA', fail: "Ad says 'Get free analysis' — page says 'Book a demo'" },
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
            <h2 className="text-2xl font-bold text-fg mb-3">Audit your message match</h2>
            <p className="text-sm text-fg-muted max-w-xl mx-auto mb-6">
              Paste your URL. Nebula checks keyword continuity, ICP clarity, offer alignment, and CTA consistency against your actual page — not a template. Free, no signup, under 2 minutes.
            </p>
            <Link
              href="/audit"
              className="inline-block rounded-xl bg-accent px-8 py-4 font-semibold text-bg hover:bg-accent-light transition-colors text-base"
            >
              Run Free Message Match Audit &rarr;
            </Link>
            <p className="mt-3 text-xs text-fg-muted">No credit card required — results in under 2 minutes</p>
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
            <span className="font-semibold text-fg">Related audits:</span>
            <Link href="/saas-landing-page-audit" className="hover:text-accent transition-colors">SaaS Landing Page Audit</Link>
            <Link href="/ecommerce-landing-page-audit" className="hover:text-accent transition-colors">Ecommerce Audit</Link>
            <Link href="/lead-generation-landing-page-audit" className="hover:text-accent transition-colors">Lead Gen Audit</Link>
            <Link href="/why-is-my-landing-page-not-converting" className="hover:text-accent transition-colors">Landing Page Diagnostics</Link>
            <Link href="/ads-getting-clicks-but-no-sales" className="hover:text-accent transition-colors">Clicks But No Sales</Link>
            <Link href="/pricing" className="hover:text-accent transition-colors">Repair Sprint Pricing</Link>
          </footer>

        </article>
      </main>
    </>
  )
}
