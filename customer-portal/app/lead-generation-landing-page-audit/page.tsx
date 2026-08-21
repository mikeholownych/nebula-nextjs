import RelatedContent from '@/components/RelatedContent'
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Lead Gen Landing Page Audit: Fix Form & CTA Leaks | Nebula',
  description:
    'Lead gen pages fail when cold-traffic forms ask too many questions, the submit button says "Submit", there is no proof adjacent to the form, and the visitor has no idea what happens after they click. This guide covers each failure with observable evidence and a bounded fix.',
  alternates: {
    canonical: 'https://nebulacomponents.com/lead-generation-landing-page-audit',
  },
  openGraph: {
    title: 'Lead Gen Landing Page Audit: Fix Form & CTA Leaks | Nebula',
    description:
      'Lead gen pages fail when cold-traffic forms ask too many questions, the submit button says "Submit", there is no proof adjacent to the form, and the visitor has no idea what happens after they click.',
    url: 'https://nebulacomponents.com/lead-generation-landing-page-audit',
    siteName: 'Nebula Components',
    type: 'article',
  },
}

const articleSchema = {
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: 'Lead Generation Landing Page Audit: Form Field Count, CTA Labels & Post-Submit Clarity',
  description:
    'Diagnostic guide for lead generation landing pages receiving paid traffic - form field overload, generic submit labels, missing proof adjacent to the form, mobile form placement, privacy micro-copy, and post-submit clarity.',
  author: { '@type': 'Organization', name: 'Nebula Components' },
  publisher: { '@type': 'Organization', name: 'Nebula Components' },
  mainEntityOfPage: 'https://nebulacomponents.com/lead-generation-landing-page-audit',
}

const breadcrumbSchema = {
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://nebulacomponents.com' },
    {
      '@type': 'ListItem',
      position: 2,
      name: 'Lead Generation Landing Page Audit',
      item: 'https://nebulacomponents.com/lead-generation-landing-page-audit',
    },
  ],
}

const faqItems = [
  {
    q: 'How many form fields is too many for a cold-traffic landing page?',
    a: 'Five or fewer for cold traffic. Name, email, and the minimum context needed to deliver what you promised. Company size, phone number, and budget questions belong on a qualification call, not the entry form. Every additional field you add to cold-traffic forms costs completions.',
  },
  {
    q: 'What should the form submit button say?',
    a: "It should state what the visitor receives, not what they're doing. 'Submit' and 'Send' describe the visitor's action. 'Get my free audit', 'Book the call', 'Start my trial' describe the outcome. The outcome framing converts better because it reminds the visitor why they're filling out the form.",
  },
  {
    q: 'Does removing the phone number field actually increase form completions?',
    a: 'Yes, consistently. Phone number is the single highest-friction field on lead gen forms for cold traffic. Unless phone is required for your delivery workflow, remove it from the entry form and collect it on a follow-up step after the initial conversion.',
  },
  {
    q: 'Where should social proof be placed on a lead gen landing page?',
    a: 'Adjacent to the form, not below it. A testimonial or client logo strip positioned directly above or beside the submit button acts at the moment of commitment - when trust is most needed. Proof at the bottom of the page, after the CTA, is too late for the visitors who abandoned without scrolling.',
  },
  {
    q: "What is 'post-submit clarity' and why does it matter?",
    a: "It's the statement of what happens after the visitor clicks submit. 'We'll be in touch' creates anxiety - when? From whom? For what? 'You'll receive your report in 2 minutes by email' eliminates the uncertainty. Visitors who know exactly what to expect immediately after submitting are less likely to abandon the thank-you page or mark the follow-up as spam.",
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

const LEADGEN_FAILURES = [
  {
    signal: 'Form field count',
    label: 'More than 5 fields on a cold-traffic form',
    detail:
      "Cold traffic has no prior relationship with the brand. Each additional required field is an additional qualification gate the visitor must pass before receiving what was promised in the ad. Beyond 5 fields - name, email, and minimal delivery context - completion rate drops with each added input. Phone number, company size, budget, and job title belong on a qualification call, not the entry form.",
    fix: 'Audit every field on the form against one question: is this required to deliver what I promised in the ad? Remove any field that fails. Collect qualification data on a follow-up step after the initial conversion - not as a gatekeeper to it.',
  },
  {
    signal: 'CTA label',
    label: "'Submit' as the form button label",
    detail:
      "'Submit' and 'Send' are system verbs - they describe what the visitor is doing, not what they receive. On a cold-traffic form, the button label is the final moment of decision. A label that reminds the visitor of the outcome ('Get my free audit', 'Book the call', 'Send my report') reaffirms the exchange value at exactly the moment the visitor needs it most.",
    fix: "Replace the generic verb with the outcome statement. Match it to the ad promise. If the ad said 'free audit in 2 minutes', the button should say 'Get my free audit'. The label should be specific enough that a visitor who skimmed the page could infer what they signed up for from the button alone.",
  },
  {
    signal: 'Social proof',
    label: 'No proof adjacent to the form',
    detail:
      "The moment of highest friction on a lead gen page is the instant before the visitor clicks submit. That is when trust is most needed and most absent. Most pages place testimonials and client logos in a section below the form - where only visitors who scroll past the CTA will see them. Cold traffic that bounces without scrolling never receives the trust signal.",
    fix: 'Position one testimonial or logo strip directly above or beside the submit button - inside the form container or immediately adjacent to it. A single named quote with a specific outcome outperforms a logo strip. Job title and company are sufficient attribution.',
  },
  {
    signal: 'Above the fold',
    label: 'The form is below the fold on mobile',
    detail:
      "On mobile, many lead gen pages place the form below a hero section, an explanation of the offer, and a bullet-point feature list. The visitor arrives from an ad on a 375px screen and sees a headline and hero image - no form, no CTA. Visitors who don't scroll don't convert. The form being below the fold on mobile is the most structurally invisible failure on lead gen pages.",
    fix: 'On mobile, place the form - or at minimum the email field and submit button - within the first viewport. The headline states the offer; the form captures it. Supporting content goes below. If the layout cannot support a form above the fold, use a single-field email capture with full form on the next step.',
  },
  {
    signal: 'Privacy micro-copy',
    label: "No 'no spam' assurance adjacent to the email field",
    detail:
      "Cold traffic is skeptical about email capture. The visitor's implicit concern - 'will this result in daily marketing emails?' - goes unaddressed on most lead gen forms. A single line adjacent to the email field ('No spam. Unsubscribe any time.') directly answers the objection at the moment it arises. Its absence is not neutral - it leaves the concern unanswered.",
    fix: "Add a single line of micro-copy directly below the email input. Keep it specific: 'No spam. Unsubscribe any time.' or 'One email with your report. Nothing else.' Do not use generic privacy policy links as a substitute - the visitor is looking for a human assurance, not a legal document.",
  },
  {
    signal: 'Post-submit clarity',
    label: "No statement of what happens after submission",
    detail:
      "'We'll be in touch' creates three unanswered questions: when, from whom, and for what purpose. A visitor who submits a form and receives ambiguous confirmation has no framework for what to do next. They cannot confirm the submission worked. They cannot anticipate the follow-up. Uncertainty after submission increases abandon rate on the thank-you page and increases spam reports on the follow-up email.",
    fix: "Replace the confirmation message with a specific delivery statement: 'You'll receive your audit by email in 2 minutes. Check your inbox - and spam folder if needed.' State the delivery channel, the delivery time, and the content. This is the contract the visitor agreed to - confirm it explicitly.",
  },
]

export default function LeadGenAuditPage() {
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
              Lead Generation Diagnostics
            </p>
            <h1 className="text-3xl font-extrabold tracking-tight text-fg md:text-5xl">
              Lead Generation Landing Page Audit
            </h1>
            <p className="mt-4 text-lg text-fg-muted leading-relaxed max-w-2xl">
              Lead gen pages with paid traffic fail in specific, repeatable ways. Forms that ask too many questions. Submit buttons that say &ldquo;Submit.&rdquo; No trust signal at the moment of commitment. No statement of what happens after the visitor clicks. This guide covers each failure pattern with the signal it trips and a bounded fix.
            </p>
          </header>

          {/* Six failure patterns */}
          <section className="mb-14">
            <h2 className="text-2xl font-bold tracking-tight text-fg mb-6">
              Six lead gen&ndash;specific conversion failures
            </h2>
            <div className="space-y-4">
              {LEADGEN_FAILURES.map((f, i) => (
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

          {/* Signal checklist */}
          <section className="mb-14">
            <h2 className="text-2xl font-bold tracking-tight text-fg mb-4">
              What the audit checks on a lead gen page
            </h2>
            <p className="text-sm text-fg-muted leading-6 mb-6 max-w-2xl">
              Nebula checks the same 9 signals on every URL. For lead gen pages, the signals that fail most often are form field count, CTA label, and proof proximity. The audit returns pass/fail with the raw value from your page - field count, button label, trust markers in source order - so every finding is verifiable.
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { signal: 'Form field count', pass: '5 fields or fewer for cold traffic', fail: '6+ required fields on the entry form' },
                { signal: 'CTA label', pass: "Button states what the visitor receives", fail: "Button says 'Submit' or 'Send'" },
                { signal: 'Social proof', pass: 'Testimonial or logos adjacent to the form', fail: 'Proof below fold or absent' },
                { signal: 'Above the fold', pass: 'Form visible on mobile without scrolling', fail: 'Form below hero section on 375px viewport' },
                { signal: 'Privacy micro-copy', pass: "'No spam' assurance adjacent to email field", fail: 'No privacy reassurance on the form' },
                { signal: 'Post-submit clarity', pass: 'Delivery channel + time stated on confirmation', fail: "Confirmation says 'We'll be in touch'" },
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
            <h2 className="text-2xl font-bold text-fg mb-3">Audit your lead generation page</h2>
            <p className="text-sm text-fg-muted max-w-xl mx-auto mb-6">
              Paste your URL. Nebula checks form field count, CTA label, proof placement, mobile form visibility, and post-submit clarity against your actual page - not a template. Free, no signup, under 2 minutes.
            </p>
            <Link
              href="/audit?utm_source=content&utm_medium=organic-content"
              className="inline-block rounded bg-accent px-8 py-4 font-semibold text-bg hover:opacity-85 hover:bg-accent transition-colors text-base"
            >
              Run Free Lead Gen Audit &rarr;
            </Link>
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
              { href: '/landing-page-cta-audit', label: 'CTA audit', type: 'audit-type' },
            { href: '/landing-page-trust-signals', label: 'Trust signals that convert', type: 'guide' },
            { href: '/landing-page-message-match', label: 'Message match audit', type: 'audit-type' },
            { href: '/audit', label: 'Get your free audit', type: 'cta' }
            ]}
          />

        </article>
      </main>
    </>
  )
}
