import type { Metadata } from 'next'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import RelatedContent from '@/components/RelatedContent'
import DownloadForm from './DownloadForm'

export const metadata: Metadata = {
  title: 'Top 10 Landing Page Mistakes Checklist - Nebula Components',
  description: 'Free downloadable checklist: The 10 landing page mistakes costing founders thousands in wasted ad spend. One-page scan. Specific fixes included.',
  alternates: { canonical: 'https://nebulacomponents.com/landing-page-mistakes' },
}

const MISTAKES = [
  { num: 1, mistake: "H1 Doesn't Match Ad Copy", why: 'Forces visitors to re-qualify. +12% bounce.' },
  { num: 2, mistake: 'CTA Says "Submit"', why: "Too generic. Visitors unsure what happens next." },
  { num: 3, mistake: 'Meta Description Missing', why: 'Google shows random text. -5% CTR.' },
  { num: 4, mistake: 'Form Asks Too Much Upfront', why: 'Friction spike. Abandonment +20%.' },
  { num: 5, mistake: 'No Social Proof Above Fold', why: 'Trust gap. Skeptics bounce immediately.' },
  { num: 6, mistake: 'Weak Reason to Believe', why: 'Claims without proof. Founder doubt.' },
  { num: 7, mistake: "Mobile CTA Below Fold", why: "Mobile users can't find action. +30% mobile bounce." },
  { num: 8, mistake: 'Copy Uses "We" Not "You"', why: 'Visitor-agnostic. Low engagement.' },
  { num: 9, mistake: 'No Urgency Signaling', why: 'Visitor says "maybe later" = never.' },
  { num: 10, mistake: 'Trust Signals Absent', why: 'No testimonials, logos, guarantees. Low conviction.' },
]

export default function MistakesChecklistPage() {
  return (
    <main className="min-h-screen bg-bg px-6 py-12">
      <div className="mx-auto max-w-3xl">

        {/* Hero */}
        <section className="mb-16 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-accent mb-2">
            Free Resource
          </p>
          <h1 className="heading-1 text-fg md:text-5xl">Fix Common Landing Page Mistakes to Boost Ad Conversion Rates</h1>
          <p className="text-lg text-fg-muted max-w-[65ch] mx-auto mb-2 leading-relaxed">
            The exact mistakes costing founders thousands in wasted ad spend.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Link
              href="/audit?utm_source=lp-mistakes-hero&utm_medium=hero-cta"
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
          <p className="text-base text-fg-muted max-w-[65ch] mx-auto leading-relaxed">
            One-page checklist. Specific fixes for each. No fluff.
          </p>
        </section>

        <section aria-labelledby="common-leaks" className="mb-16 rounded border border-accent/20 bg-accent/5 p-6">
          <h2 id="common-leaks" className="mb-3 text-2xl font-extrabold text-fg">The most common landing page conversion leaks</h2>
          <p className="mb-4 leading-relaxed text-fg-muted">The recurring leaks are not mysterious: the page promise does not match the ad, the first viewport does not explain the offer, the primary CTA is hard to find, or the page gives a stranger no nearby reason to trust it.</p>
          <ul className="grid gap-2 text-sm leading-relaxed text-fg-muted md:grid-cols-2">
            <li><strong className="text-fg">Message match:</strong> the ad and H1 promise different things.</li>
            <li><strong className="text-fg">First viewport:</strong> the offer, audience, or next action is unclear.</li>
            <li><strong className="text-fg">CTA clarity:</strong> the button names an action but not the outcome.</li>
            <li><strong className="text-fg">Trust proximity:</strong> proof is absent or too far from the action.</li>
            <li><strong className="text-fg">Mobile access:</strong> overflow, small targets, or a covered CTA blocks action.</li>
            <li><strong className="text-fg">Page speed:</strong> the offer arrives after the visitor has left.</li>
          </ul>
          <p className="mt-4 text-sm text-fg-muted">Use this as a screen, not a conversion promise. <Link href="/audit" className="font-semibold text-accent hover:underline">Run the free audit</Link> to see which conditions are observable on your page.</p>
        </section>

        {/* What You Get */}
        <section className="mb-16">
          <h2 className="text-2xl font-extrabold text-fg mb-8">{"What's Inside The Checklist"}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {MISTAKES.map((item) => (
              <Card key={item.num} variant="bordered" className="p-4">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent flex items-center justify-center text-bg font-bold text-sm">
                    {item.num}
                  </div>
                  <div>
                    <p className="font-semibold text-fg text-sm">{item.mistake}</p>
                    <p className="text-xs text-fg-muted mt-1">{item.why}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Download Form - client component for form interactivity */}
        <section className="mb-16 bg-bg-muted rounded border border-accent/20 p-8">
          <div className="max-w-md mx-auto">
            <h2 className="text-2xl font-extrabold text-fg mb-2">Get The Checklist</h2>
            <p className="text-fg-muted mb-6">
              One-page PDF. Download instantly. Check your site in 5 minutes.
            </p>
            <DownloadForm />
          </div>
        </section>

        {/* Next Step CTA */}
        <section className="text-center py-8 border-t border-border">
          <h2 className="text-2xl font-extrabold text-fg mb-2">Want a Full Diagnosis?</h2>
          <p className="text-fg-muted mb-6 max-w-[65ch] mx-auto leading-relaxed">
            Run a free audit to see exactly which of these 10 mistakes your landing page has.
          </p>
          <Link
            href="/audit?utm_source=magnet&utm_medium=content&utm_campaign=mistakes_to_audit"
            className="inline-block rounded bg-accent px-6 py-3 font-semibold text-bg transition-colors hover:bg-accent-light"
          >
            Start Free Audit →
          </Link>
        </section>

        <RelatedContent
          heading="Related resources"
          items={[
            { href: '/why-is-my-landing-page-not-converting', label: "Why pages don't convert", type: 'guide' },
            { href: '/landing-page-cta-audit', label: 'CTA audit', type: 'audit-type' },
            { href: '/landing-page-message-match', label: 'Message match audit', type: 'audit-type' },
            { href: '/landing-page-trust-signals', label: 'Trust signals that convert', type: 'guide' },
            { href: '/audit', label: 'Get your free audit', type: 'cta' },
          ]}
        />
      </div>
    </main>
  )
}
