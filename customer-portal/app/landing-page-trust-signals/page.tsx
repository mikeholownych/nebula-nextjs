import RelatedContent from '@/components/RelatedContent'
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Landing Page Trust Signals: Social Proof, Credibility Markers & Risk Reduction | Nebula',
  description:
    'Trust signal failures cost conversions on pages that are otherwise well-structured. Proof below the fold. Generic testimonials with no specificity. Missing proof entirely on pages running paid traffic. This guide covers each failure with the observable signal and the fix.',
  alternates: {
    canonical: 'https://nebulacomponents.com/landing-page-trust-signals',
  },
  openGraph: {
    title: 'Landing Page Trust Signals: Social Proof, Credibility Markers & Risk Reduction | Nebula',
    description:
      'Trust signal failures cost conversions on pages that are otherwise well-structured. Proof below the fold. Generic testimonials with no specificity. Missing proof entirely on pages running paid traffic.',
    url: 'https://nebulacomponents.com/landing-page-trust-signals',
    siteName: 'Nebula Components',
    type: 'article',
  },
}

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Landing Page Trust Signals: Social Proof, Credibility Markers & Risk Reduction',
  description:
    'Diagnostic guide for landing page trust signal failures - proof placement, testimonial specificity, missing proof, review count, proof type mismatch, and fabricated trust badges.',
  author: { '@type': 'Organization', name: 'Nebula Components' },
  publisher: { '@type': 'Organization', name: 'Nebula Components' },
  mainEntityOfPage: 'https://nebulacomponents.com/landing-page-trust-signals',
}

const faqItems = [
  {
    q: 'What is the most effective type of social proof for a landing page?',
    a: "Named quotes with specific, verifiable outcomes outperform all other formats for cold paid traffic. 'Increased trial-to-paid conversion by 34% in 6 weeks - Sarah M., Head of Growth, Acme' is more persuasive than 10 anonymous 5-star ratings because it provides a real person, a real outcome, and a falsifiable claim.",
  },
  {
    q: 'Where exactly should social proof be placed on a landing page?',
    a: 'Directly adjacent to the primary CTA - above it, beside it, or immediately below it. Proof at the bottom of the page, after the fold, reaches only the visitors who were already convinced. Cold traffic needs the proof before the ask.',
  },
  {
    q: 'How many trust signals do I need above the fold?',
    a: 'The audit passes a page with 2 or more observable trust signals above the fold. More than that is fine; fewer than 2 creates a high-perceived-risk purchase environment for cold traffic.',
  },
  {
    q: 'Do security badges improve conversion?',
    a: "Verified security badges (actual SSL certificate, actual BBB accreditation) provide modest lift for purchase pages. Generic 'Secure Checkout' badges created in Canva provide no measurable lift and can reduce trust among visitors who recognize them as unverifiable design elements.",
  },
  {
    q: "What is 'proof type mismatch'?",
    a: "Using the wrong type of social proof for your buyer's evaluation process. Consumer products benefit from aggregate star ratings and review counts. B2B products benefit from named company logos and specific outcome case studies. Coaching and consulting benefit from named testimonials with before/after context. Using aggregate star ratings on an enterprise software page signals that you don't understand how your buyer evaluates purchases.",
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
      name: 'Landing Page Trust Signals',
      item: 'https://nebulacomponents.com/landing-page-trust-signals',
    },
  ],
}

const TRUST_FAILURES = [
  {
    signal: 'Social Proof Placement',
    label: 'Reviews and testimonials below the fold - cold traffic never reaches them',
    detail:
      "The majority of cold paid traffic - visitors arriving from an ad for the first time - makes a go/no-go decision within the first viewport. Proof that requires scrolling to find is proof that most first-time visitors never see. The current Leak Index records a Social Proof finding on 42.7% of completed audits. The visitors most in need of trust reduction - cold traffic with no prior brand exposure - are exactly the visitors who won't scroll to find it.",
    fix: 'Move at least two trust signals into the hero section, visible without scrolling on both desktop and 375px mobile. This means placing them above or directly adjacent to the primary CTA. Proof that reaches only visitors who have already decided to convert is not doing conversion work.',
  },
  {
    signal: 'Testimonial Quality',
    label: "Generic testimonials with no outcome or attribution",
    detail:
      "'Great product! Highly recommend.' provides no verifiable information. The visitor cannot confirm the reviewer is real, cannot identify what changed for them, and cannot apply the outcome to their own situation. Generic testimonials read as fabricated - not because they necessarily are, but because they are structurally identical to fabricated ones. A specific testimonial is falsifiable: it names a person, a role, a company, and a measurable outcome. A generic one is not.",
    fix: "Replace generic quotes with outcome-specific testimonials. The format that outperforms others for cold traffic: '[Specific outcome] in [timeframe] - [First name Last initial], [Title], [Company]'. If you have customer results, extract the specific numbers and attribute them. A single specific testimonial does more conversion work than five generic ones.",
  },
  {
    signal: 'Social Proof Presence',
    label: 'No reviews, logos, or case study references on paid traffic pages',
    detail:
      "73 audits found pages running paid traffic with no observable social proof anywhere on the page - not in the hero, not below the fold, not at all. A cold visitor with no prior brand exposure and no social proof has no mechanism to reduce perceived purchase risk except their own judgment. This is the highest-risk trust configuration for paid traffic. Without evidence that other buyers have made this decision and found it worthwhile, the visitor's default is to leave.",
    fix: 'Add a minimum of 2 trust signals to the page before running paid traffic. If you have no testimonials, use aggregate review counts from verified platforms (Google, G2, Capterra). If you have no reviews, use press mentions. If you have no press, use specific customer outcome data without attribution. Something observable beats nothing.',
  },
  {
    signal: 'Review Count',
    label: "Claim without number - 'Customers love us' is not a trust signal",
    detail:
      "'Customers love us' and 'Trusted by businesses worldwide' are marketing copy, not trust signals. A trust signal is verifiable. A review count - '4.8 stars · 1,240 reviews on G2' - is verifiable because the visitor can click through and confirm it. The number transforms the claim from assertion to evidence. Without the number, the claim is indistinguishable from invented copy and provides no measurable trust reduction.",
    fix: "Add the specific count and rating source adjacent to any social proof claim. '4.8 stars · 1,240 reviews' with a link to the review source. The count makes it falsifiable. The source makes it verifiable. Both are required for the claim to function as a trust signal rather than marketing copy.",
  },
  {
    signal: 'Proof Type',
    label: 'Proof type mismatched to buyer evaluation process',
    detail:
      "A B2B SaaS page serving enterprise buyers shows aggregate star ratings in the hero. Enterprise procurement teams do not evaluate software through aggregate consumer ratings - they evaluate it through named case studies, recognizable company logos, and specific outcome data. Showing the wrong proof type communicates that you don't understand how your buyer makes decisions. Consumer products benefit from star counts. B2B products benefit from named outcomes. The wrong format generates distrust rather than reducing it.",
    fix: "Identify how your specific buyer evaluates purchases. Consumer: aggregate ratings and review counts. B2B mid-market: named quotes with specific outcomes. Enterprise: recognizable company logos and case study references. Coaching/consulting: before/after testimonials with specific context. Replace or supplement the current proof with the format that matches your buyer's actual evaluation process.",
  },
  {
    signal: 'Trust Badges',
    label: "Fabricated trust badges recognized as unverifiable design elements",
    detail:
      "Trust badges - SSL icons, 'Secure Checkout' seals, 'Verified Business' marks - provide lift only when they are verifiable. A padlock icon created in Canva with 'Secure' below it is not a trust signal; it is an image that some visitors recognize as unverifiable design. Savvy buyers - the buyers most likely to convert on high-AOV offers - are also the buyers most likely to identify unverifiable badges as decoration. The presence of a fabricated trust badge can actively reduce trust by signaling that the page operator believes visitors can be influenced by unverifiable claims.",
    fix: 'Use only trust badges backed by a verifiable credential that visitors can confirm. Real SSL certificates with a click-through. Actual BBB accreditation. Real G2 or Trustpilot ratings with a linked source. Remove generic design-element badges. One verifiable badge outperforms three unverifiable ones.',
  },
]

export default function TrustSignalsPage() {
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
              Trust Signal Audit
            </p>
            <h1 className="text-3xl font-extrabold tracking-tight text-fg md:text-5xl">
              Landing Page Trust Signals
            </h1>
            <p className="mt-4 text-lg text-fg-muted leading-relaxed max-w-2xl">
              Trust signal failures cost conversions on pages that are otherwise well-structured. Proof below the fold that cold traffic never reaches. Generic testimonials structurally identical to fabricated ones. No proof at all on pages running paid traffic. Each failure has a specific, observable form - and a bounded fix.
            </p>
          </header>

          {/* Six failure patterns */}
          <section className="mb-14">
            <h2 className="text-2xl font-bold tracking-tight text-fg mb-6">
              Six trust signal failure patterns
            </h2>
            <div className="space-y-4">
              {TRUST_FAILURES.map((f, i) => (
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
              What the audit checks for trust signals
            </h2>
            <p className="text-sm text-fg-muted leading-6 mb-6 max-w-2xl">
              Nebula evaluates trust signals from the source-order HTML of your page - the order in which elements appear in the document, not the rendered visual position. Each signal returns the raw finding from your actual page.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { signal: 'Proof Placement', pass: '2+ trust signals in hero, above the fold', fail: 'All proof below the fold - cold traffic never reaches it' },
                { signal: 'Testimonial Quality', pass: 'Named, attributed, outcome-specific quotes', fail: "Generic quote: 'Great product! Highly recommend.'" },
                { signal: 'Proof Presence', pass: 'At least 2 observable trust signals on page', fail: 'No reviews, logos, or case study references' },
                { signal: 'Review Count', pass: "Rating with specific count: '4.8 · 1,240 reviews'", fail: "Claim without number: 'Customers love us'" },
                { signal: 'Proof Type', pass: 'Proof format matched to buyer evaluation process', fail: 'Consumer star ratings on an enterprise B2B page' },
                { signal: 'Badge Authenticity', pass: 'Trust badges link to verifiable external credential', fail: 'Generic design-element badges with no backing' },
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
          <section className="mb-14 rounded-md border border-border bg-bg-muted/30 p-8 text-center">
            <h2 className="text-2xl font-bold text-fg mb-3">Audit your trust signals</h2>
            <p className="text-sm text-fg-muted max-w-xl mx-auto mb-6">
              Paste your URL. Nebula checks proof placement, testimonial quality, review count, and badge authenticity against your actual page - not a template. Free, no signup, under 2 minutes.
            </p>
            <Link
              href="/audit?utm_source=content&utm_medium=organic-content"
              className="inline-block rounded bg-accent px-8 py-4 font-semibold text-bg hover:opacity-85 hover:bg-accent transition-colors text-base"
            >
              Run Free Trust Audit &rarr;
            </Link>
            <p className="mt-3 text-xs text-fg-muted">No credit card required - results in under 2 minutes</p>
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


          <RelatedContent
            heading="Related resources"
            items={[
              { href: '/social-proof-landing-page', label: 'Social proof on landing pages', type: 'guide' },
            { href: '/ecommerce-landing-page-audit', label: 'Ecommerce landing page audit', type: 'audit-type' },
            { href: '/landing-page-message-match', label: 'Message match audit', type: 'audit-type' },
            { href: '/audit', label: 'Get your free audit', type: 'cta' }
            ]}
          />

        </article>
      </main>
    </>
  )
}
