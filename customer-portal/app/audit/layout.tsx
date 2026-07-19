import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Free Landing Page Audit — Find Your Conversion Leaks | Nebula Components',
  description:
    'Submit your landing page URL for a free conversion audit. We check message-match, trust signals, mobile layout, form friction, load time, and compliance in minutes.',
  alternates: {
    canonical: 'https://nebulacomponents.shop/audit',
  },
}

export default function AuditLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      {/* Server-rendered supporting content — visible to crawlers, supplements client-rendered UI */}
      <section className="mx-auto max-w-2xl px-4 pb-16 pt-8 text-sm text-fg-muted">
        <h2 className="mb-3 text-base font-semibold text-fg">What the audit checks</h2>
        <p className="mb-3">
          The Nebula landing page audit runs automated checks across six conversion-critical dimensions:
          headline message-match, trust signal placement, mobile layout integrity, form friction score,
          page load time impact, and compliance signals. Each check is evidence-backed — based on
          patterns observed across real ad campaigns, not generic best-practice checklists.
        </p>
        <p className="mb-3">
          Most founders spending on Google or Meta ads assume low conversion rates are an ad problem.
          In the majority of cases the bottleneck is on the landing page: a headline that does not
          match the ad copy, a form that appears before any trust has been established, or a mobile
          layout where the primary CTA is obscured on the first scroll.
        </p>
        <p>
          The audit takes under two minutes. No account required. Enter your landing page URL, receive
          a scored report identifying the highest-impact leaks, and decide whether to fix them yourself
          or use the Nebula Fix Pack for same-day implementation.
        </p>
        <h2 className="mb-3 mt-6 text-base font-semibold text-fg">How it works</h2>
        <ol className="list-decimal space-y-1 pl-5">
          <li>Enter your landing page URL in the field above</li>
          <li>The audit engine fetches and scores your page across all six dimensions</li>
          <li>You receive a structured report with specific, actionable findings</li>
          <li>Each finding includes a severity rating and a recommended fix</li>
        </ol>
      </section>
    </>
  )
}
