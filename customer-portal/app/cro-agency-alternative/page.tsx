import type { Metadata } from 'next'
import { formatUsd, getActiveFixPack } from '@/app/lib/public-facts'

export const metadata: Metadata = {
  title: 'CRO Agency Alternative: Get Conversion Findings Without the $3,000/Month Retainer | Nebula',
  description:
    'What a CRO agency delivers in 3 months, Nebula delivers in 2 minutes. Free diagnostic, $97 repair sprint, no sales calls, no retainer.',
  alternates: { canonical: 'https://nebulacomponents.com/cro-agency-alternative' },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'CRO Agency Alternative: Get Conversion Findings Without the $3,000/Month Retainer',
  description:
    'What a CRO agency delivers in 3 months, Nebula delivers in 2 minutes. Free diagnostic, $97 repair sprint, no sales calls, no retainer.',
  url: 'https://nebulacomponents.com/cro-agency-alternative',
  mainEntity: {
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is a cheaper alternative to a CRO agency?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'A CRO agency costs $2,000-$10,000 per month and takes 4-6 weeks before delivering a first recommendation. Nebula delivers a diagnostic in under 2 minutes, free. A $97 Repair Sprint fixes one prioritized finding in 48 hours.',
        },
      },
      {
        '@type': 'Question',
        name: 'When should I hire a CRO agency instead of using a tool like Nebula?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'CRO agencies make sense at scale: high traffic, multiple pages, ongoing testing programs, and internal teams needing strategic direction. For early-stage paid traffic on a single landing page, a free diagnostic and per-fix pricing is a better fit.',
        },
      },
    ],
  },
}

const NINE_SIGNALS = [
  {
    name: 'Message match',
    description:
      'Does your headline match the ad that sent the visitor? Misaligned messaging is the top reason paid traffic bounces within 3 seconds.',
  },
  {
    name: 'CTA clarity',
    description:
      'Is there one clear next step above the fold? Competing CTAs or vague button text reduce click-through.',
  },
  {
    name: 'Social proof',
    description:
      'Are there credible, specific testimonials or trust signals visible without scrolling? Generic reviews do not convert.',
  },
  {
    name: 'Load speed',
    description:
      'Does the page load in under 3 seconds on mobile? Every additional second of load time reduces conversions.',
  },
  {
    name: 'Above-fold clarity',
    description:
      'Can a visitor understand what you offer and why it matters within the first viewport? Ambiguity kills intent.',
  },
  {
    name: 'Mobile CTA',
    description:
      'Is the primary CTA tappable and prominent on a phone screen? Most paid traffic now arrives on mobile.',
  },
  {
    name: 'Ad signal alignment',
    description:
      'Do the visual and copy signals from your ad carry through to the landing page? Discontinuity triggers distrust.',
  },
  {
    name: 'SEO foundations',
    description:
      'Are title tags, meta descriptions, and structured data in place? These also affect Quality Score on paid channels.',
  },
  {
    name: 'AI readiness',
    description:
      'Is the page structured for AI-assisted discovery? Schema markup and clear answer surfaces affect how AI tools cite and surface your page.',
  },
]

export default function CroAgencyAlternativePage() {
  const fixPack = getActiveFixPack()
  const fixPackPrice = fixPack ? formatUsd(fixPack.priceCents) : '$97'

  return (
    <div className="min-h-screen bg-bg text-fg font-sans">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <section className="bg-bg border-b border-border py-20 px-6">
        <div className="max-w-[720px] mx-auto text-center">
          <h1 className="text-[clamp(2rem,5vw,3.2rem)] font-black leading-tight text-fg mb-5">
            What a CRO Agency Delivers in 3 Months,<br />
            <span className="text-accent-light">Nebula Delivers in 2 Minutes.</span>
          </h1>
          <p className="text-lg text-fg-muted max-w-[600px] mx-auto mb-8">
            CRO agencies charge $2,000 to $10,000 per month and take 4 to 6 weeks to deliver a first
            recommendation. Nebula delivers a diagnostic in under 2 minutes, free.
          </p>

          {/* Answer Capsule */}
          <div
            data-answer-capsule
            className="border-l-2 border-accent bg-bg-panel py-4 px-5 rounded-r-lg text-left mb-8"
          >
            <strong className="text-fg">Quick Answer:</strong>{' '}
            <span className="text-fg-muted">
              A CRO agency costs $2,000--$10,000 per month and takes 4--6 weeks before delivering a
              first recommendation. Nebula delivers a diagnostic in under 2 minutes, free. A $97
              Repair Sprint fixes one prioritized finding in 48 hours.
            </span>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            {['No sales call', 'Free diagnostic', '$97 per fix', 'No retainer'].map((pill) => (
              <span
                key={pill}
                className="bg-bg-panel text-fg-muted border border-border px-4 py-1.5 rounded-full text-sm"
              >
                {pill}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-[780px] mx-auto px-6 py-12 pb-20">

        {/* Section 1: What CRO agencies deliver and charge */}
        <h2 className="text-2xl font-bold text-fg mt-4 mb-4">
          What CRO Agencies Actually Deliver (and What They Charge)
        </h2>
        <p className="mb-4">
          A CRO agency engagement typically starts with a kick-off call and a discovery phase. You
          fill out a brief. They review your analytics, your ad data, and your current page. Two to
          four weeks later, you receive a recommendations document.
        </p>
        <p className="mb-4">
          Implementation is usually separate. You either implement the changes yourself or pay the
          agency extra to do it. A/B tests require statistical significance, which means 4 to 8
          weeks of traffic before you can measure the impact of any single change.
        </p>
        <p className="mb-4">
          The cost for all of this: $2,000 to $10,000 per month at mid-tier agencies. Enterprise CRO
          retainers run $15,000 to $30,000 per month. Before you see a single result, you have
          invested $4,000 to $20,000 minimum.
        </p>
        <div className="bg-danger-dim border border-danger/30 rounded-xl p-6 mb-8">
          <div className="text-xs font-bold tracking-widest uppercase text-danger mb-2">
            What agencies don't say upfront
          </div>
          <p className="mb-0">
            Most agency contracts include a disclaimer that results are not guaranteed. Conversion
            rate depends on product-market fit, ad targeting, audience intent, and dozens of other
            variables outside the agency's control. You are paying for their time and process, not
            for outcomes.
          </p>
        </div>

        {/* Section 2: Nebula vs agency */}
        <h2 className="text-2xl font-bold text-fg mt-12 mb-4">
          What Nebula Delivers vs a CRO Agency
        </h2>
        <p className="mb-4">
          Nebula does not replace an agency for complex, multi-page optimization programs. But for a
          founder spending $2,000 to $10,000 per month on ads with a single landing page that isn't
          converting, the comparison looks like this:
        </p>
        <div className="overflow-x-auto mb-8">
          <table className="w-full border-collapse border border-border rounded-xl overflow-hidden">
            <thead>
              <tr>
                <th className="bg-bg-panel text-fg-muted text-xs font-bold uppercase tracking-wide text-left p-4 border-b border-border w-1/4"></th>
                <th className="bg-bg-panel text-danger text-xs font-bold uppercase tracking-wide text-left p-4 border-b border-border">CRO Agency</th>
                <th className="bg-bg-panel text-accent text-xs font-bold uppercase tracking-wide text-left p-4 border-b border-border">Nebula</th>
              </tr>
            </thead>
            <tbody>
              {[
                { label: 'First finding', agency: '2--4 weeks', nebula: 'Under 2 minutes' },
                { label: 'First fix available', agency: '4--8 weeks', nebula: '48 hours' },
                { label: 'Monthly cost', agency: '$2,000--$10,000', nebula: '$0 (or $97 per sprint)' },
                { label: 'Sales process', agency: 'Discovery call + proposal + contract', nebula: 'Self-serve. No call.' },
                { label: 'Signals checked', agency: 'Custom (varies by agency)', nebula: '9 structural signals, automated' },
                { label: 'Minimum commitment', agency: '3--6 months typical', nebula: 'None' },
              ].map((row, idx) => (
                <tr key={idx} className="border-b border-border last:border-b-0">
                  <td className="p-4 text-fg font-semibold">{row.label}</td>
                  <td className="p-4 bg-bg-panel text-danger">{row.agency}</td>
                  <td className="p-4 bg-bg text-accent">{row.nebula}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Section 3: When you need an agency vs when you don't */}
        <h2 className="text-2xl font-bold text-fg mt-12 mb-4">
          When You Need an Agency (and When You Don't)
        </h2>
        <p className="mb-4">
          This is honest positioning, not marketing copy.
        </p>
        <p className="mb-4 font-semibold text-fg">An agency makes sense when:</p>
        <ul className="list-disc list-inside mb-6 space-y-2 text-fg-muted">
          <li>You have 50,000 or more monthly visitors and need ongoing multivariate testing.</li>
          <li>You have an internal marketing team that needs senior strategic direction.</li>
          <li>You are managing 10 or more landing pages simultaneously with distinct audiences.</li>
          <li>Your business justifies paying $3,000 per month because a 0.5% conversion lift is worth $50k in revenue.</li>
        </ul>
        <p className="mb-4 font-semibold text-fg">An agency does not make sense when:</p>
        <ul className="list-disc list-inside mb-6 space-y-2 text-fg-muted">
          <li>You are running early-stage paid traffic on one or two landing pages.</li>
          <li>You don't yet know which specific signals are failing on your page.</li>
          <li>You cannot absorb $2,000 to $4,000 in retainer fees before seeing any improvement.</li>
          <li>You need a diagnosis in days, not weeks.</li>
        </ul>
        <div className="bg-bg-panel border border-border rounded-xl p-7 mb-8">
          <p className="mb-0 text-fg-muted">
            <strong className="text-fg">The right order:</strong> Run a free diagnostic first.
            Understand exactly what is failing on your page. Fix the highest-priority signal. Then
            decide if you need ongoing strategic support, or if the per-fix model is serving you.
          </p>
        </div>

        {/* Section 4: The 9 signals */}
        <h2 className="text-2xl font-bold text-fg mt-12 mb-4">
          The 9 Signals Nebula Checks
        </h2>
        <p className="mb-6">
          Every Nebula audit checks these 9 structural conversion signals automatically, without
          requiring access to your analytics, your ad account, or your CMS.
        </p>
        <div className="space-y-4 mb-8">
          {NINE_SIGNALS.map((signal, idx) => (
            <div key={idx} className="bg-bg-panel border border-border rounded-xl p-5">
              <div className="flex items-start gap-3">
                <span className="text-accent font-bold text-sm mt-0.5 shrink-0">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <div>
                  <strong className="text-fg block mb-1">{signal.name}</strong>
                  <p className="text-fg-muted text-sm mb-0">{signal.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="bg-bg-panel shadow-glow border border-border rounded-2xl py-12 px-10 text-center">
          <h3 className="text-2xl font-bold text-fg mb-3">
            Run a free diagnostic. No agency required.
          </h3>
          <p className="text-fg-muted max-w-[500px] mx-auto mb-6">
            Nebula checks 9 structural conversion signals on your landing page. Free. Under 2
            minutes. No sales call, no retainer, no discovery phase.
          </p>
          <div className="flex flex-wrap justify-center gap-4 mb-4">
            <a
              href="/audit"
              className="inline-flex items-center gap-2 bg-accent hover:bg-accent-light text-bg font-bold py-4 px-9 rounded-lg transition-colors"
            >
              Run free audit
            </a>
            <a
              href="/repair-sprint"
              className="inline-flex items-center gap-2 bg-transparent border border-border hover:border-accent-light text-fg-muted hover:text-fg font-semibold py-4 px-6 rounded-lg transition-colors"
            >
              See Repair Sprint
            </a>
          </div>
          <p className="text-fg-muted text-sm">
            $0 diagnostic. {fixPackPrice} Repair Sprint. No monthly commitment.
          </p>
        </div>
      </main>
    </div>
  )
}
