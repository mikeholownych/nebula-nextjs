import type { Metadata } from 'next'
import { formatUsd, getActiveFixPack } from '@/app/lib/public-facts'

export const metadata: Metadata = {
  title: 'No-Retainer CRO Tools: Conversion Optimization Without the Agency Contract | Nebula',
  description:
    'CRO tools that charge per audit or per fix instead of locking you into monthly retainers. Nebula charges $97 per repair and $0 for the diagnostic.',
  alternates: { canonical: 'https://nebulacomponents.com/no-retainer-cro-tools' },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'No-Retainer CRO Tools: Conversion Optimization Without the Agency Contract',
  description:
    'CRO tools that charge per audit or per fix instead of locking you into monthly retainers. Nebula charges $97 per repair and $0 for the diagnostic.',
  url: 'https://nebulacomponents.com/no-retainer-cro-tools',
  mainEntity: {
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Do CRO tools require a monthly retainer?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Most CRO tools charge $500-$2,000 per month in retainer fees before they touch your page. Nebula charges $0 for the diagnostic and $97 per fix. No monthly commitment, no agency relationship, no retainer.',
        },
      },
      {
        '@type': 'Question',
        name: 'What is per-fix CRO pricing?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Per-fix pricing means you pay only when a specific conversion issue is diagnosed and repaired. Nebula charges $0 for the audit and $97 per Repair Sprint, delivered in 48 hours.',
        },
      },
    ],
  },
}

export default function NoRetainerCroToolsPage() {
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
            CRO Tools Without the<br />
            <span className="text-accent-light">Monthly Retainer</span>
          </h1>
          <p className="text-lg text-fg-muted max-w-[600px] mx-auto mb-8">
            Most conversion rate optimization tools require a monthly contract before they do anything.
            Nebula charges $0 for the diagnostic and {fixPackPrice} per fix. No retainer. No commitment.
          </p>

          {/* Answer Capsule */}
          <div
            data-answer-capsule
            className="border-l-2 border-accent bg-bg-panel py-4 px-5 rounded-r-lg text-left mb-8"
          >
            <strong className="text-fg">Quick Answer:</strong>{' '}
            <span className="text-fg-muted">
              Most CRO tools charge $500--$2,000 per month in retainer fees before they touch your page.
              Nebula charges $0 for the diagnostic and $97 per fix. No monthly commitment, no agency
              relationship, no retainer.
            </span>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            {['No retainer', 'Free diagnostic', 'Pay per fix', '48-hour turnaround'].map((pill) => (
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

        {/* Section 1: What a retainer model costs you */}
        <h2 className="text-2xl font-bold text-fg mt-4 mb-4">
          What a Retainer Model Actually Costs You
        </h2>
        <p className="mb-4">
          A typical CRO retainer runs $500 to $2,000 per month. Some agencies charge $5,000 or more.
          Before they run a single test or fix a single element, you have paid the first month.
        </p>
        <p className="mb-4">
          Here is what you get for that money: a kick-off call, a discovery phase, and a
          recommendations document. The actual implementation often costs extra. The results, if
          any, take 60 to 90 days to measure because A/B tests require statistical significance.
        </p>
        <p className="mb-4">
          The math on this is brutal for early-stage paid traffic. If you are spending $3,000 per
          month on ads and converting at 1%, a $1,500 retainer adds 50% to your acquisition cost
          before you see a single improvement.
        </p>
        <div className="bg-danger-dim border border-danger/30 rounded-xl p-6 mb-8">
          <div className="text-xs font-bold tracking-widest uppercase text-danger mb-2">
            The retainer trap
          </div>
          <p className="mb-0">
            Retainer contracts lock you in whether or not results materialize. Month two starts
            regardless of whether month one produced any measurable change. You are paying for
            access to expertise, not for verified outcomes.
          </p>
        </div>

        {/* Section 2: What per-fix pricing looks like */}
        <h2 className="text-2xl font-bold text-fg mt-12 mb-4">
          What Per-Fix Pricing Looks Like
        </h2>
        <p className="mb-4">
          The Nebula model inverts this entirely. The diagnostic is free. You paste your URL, Nebula
          checks 9 structural conversion signals, and you receive a prioritized findings report
          without signing anything or paying anything.
        </p>
        <p className="mb-4">
          If you want one of those findings fixed, you purchase a Repair Sprint for {fixPackPrice}.
          Nebula delivers a tailored implementation pack within 48 hours. You or your developer
          implements it. No ongoing relationship. No second invoice unless you choose to buy another sprint.
        </p>
        <div className="bg-accent-dim border border-accent/30 rounded-xl p-6 mb-8">
          <div className="text-xs font-bold tracking-widest uppercase text-accent mb-2">
            Nebula pricing model
          </div>
          <ul className="space-y-2 mb-0">
            <li><strong className="text-fg">Audit:</strong> <span className="text-fg-muted">$0. No signup required.</span></li>
            <li><strong className="text-fg">Repair Sprint:</strong> <span className="text-fg-muted">{fixPackPrice}. One prioritized finding. 48-hour delivery.</span></li>
            <li><strong className="text-fg">Monthly commitment:</strong> <span className="text-fg-muted">None.</span></li>
            <li><strong className="text-fg">Sales call required:</strong> <span className="text-fg-muted">No.</span></li>
          </ul>
        </div>

        {/* Section 3: Comparison table */}
        <h2 className="text-2xl font-bold text-fg mt-12 mb-4 text-center">
          Retainer Model vs Per-Fix Model
        </h2>
        <div className="overflow-x-auto mb-8">
          <table className="w-full border-collapse border border-border rounded-xl overflow-hidden">
            <thead>
              <tr>
                <th className="bg-bg-panel text-fg-muted text-xs font-bold uppercase tracking-wide text-left p-4 border-b border-border w-1/4"></th>
                <th className="bg-bg-panel text-danger text-xs font-bold uppercase tracking-wide text-left p-4 border-b border-border">Retainer Model</th>
                <th className="bg-bg-panel text-accent text-xs font-bold uppercase tracking-wide text-left p-4 border-b border-border">Per-Fix Model (Nebula)</th>
              </tr>
            </thead>
            <tbody>
              {[
                {
                  label: 'Cost',
                  retainer: '$500--$5,000/month minimum',
                  perfix: '$0 diagnostic + $97 per repair sprint',
                },
                {
                  label: 'Commitment',
                  retainer: '3--6 month contract common',
                  perfix: 'None. Buy one sprint, stop any time.',
                },
                {
                  label: 'Time to first finding',
                  retainer: '2--4 weeks (discovery + kick-off)',
                  perfix: 'Under 2 minutes (automated audit)',
                },
                {
                  label: 'Time to first fix',
                  retainer: '4--8 weeks',
                  perfix: '48 hours after purchase',
                },
                {
                  label: 'What you get',
                  retainer: 'Monthly reports + strategy sessions',
                  perfix: 'Prioritized findings + implementation pack',
                },
                {
                  label: 'Results guarantee',
                  retainer: 'None (conversion depends on many variables)',
                  perfix: 'None (same reason, but you pay per result, not per month)',
                },
              ].map((row, idx) => (
                <tr key={idx} className="border-b border-border last:border-b-0">
                  <td className="p-4 text-fg font-semibold">{row.label}</td>
                  <td className="p-4 bg-bg-panel text-danger">{row.retainer}</td>
                  <td className="p-4 bg-bg text-accent">{row.perfix}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Section 4: When retainers make sense vs when they don't */}
        <h2 className="text-2xl font-bold text-fg mt-12 mb-4">
          When a Retainer Makes Sense (and When It Doesn't)
        </h2>
        <p className="mb-4">
          Retainers are not universally bad. They make sense when:
        </p>
        <ul className="list-disc list-inside mb-6 space-y-2 text-fg-muted">
          <li>You have high traffic volume (100,000+ monthly visitors) and need ongoing A/B testing at scale.</li>
          <li>You have an internal team that needs strategic direction from senior practitioners.</li>
          <li>You are running a large ecommerce operation where even a 0.1% lift is worth $50k+ in revenue.</li>
          <li>You need ongoing custom analytics instrumentation across multiple landing pages.</li>
        </ul>
        <p className="mb-4">
          Retainers do not make sense when:
        </p>
        <ul className="list-disc list-inside mb-6 space-y-2 text-fg-muted">
          <li>You are spending under $10,000 per month on ads and need to improve a single landing page.</li>
          <li>You have not yet identified which specific signals are failing on your page.</li>
          <li>You need a fast answer (not a 4-week discovery process).</li>
          <li>Your budget does not absorb a monthly fee before seeing any improvement.</li>
        </ul>
        <div className="bg-bg-panel border border-border rounded-xl p-7 mb-8">
          <p className="mb-0 text-fg-muted">
            <strong className="text-fg">Honest framing:</strong> Nebula is not the right tool if you
            need strategic direction across 12 landing pages with ongoing testing and analytics
            support. Nebula is the right tool if you need to know exactly what is wrong with a
            specific page right now, without paying before the diagnosis.
          </p>
        </div>

        {/* CTA Section */}
        <div className="bg-bg-panel shadow-glow border border-border rounded-2xl py-12 px-10 text-center">
          <h3 className="text-2xl font-bold text-fg mb-3">
            Get a free diagnostic. No retainer required.
          </h3>
          <p className="text-fg-muted max-w-[500px] mx-auto mb-6">
            Paste your URL. Nebula checks 9 structural conversion signals and returns a prioritized
            findings report. Free. No signup. No sales call.
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
            $0 for the diagnostic. {fixPackPrice} per Repair Sprint. No monthly commitment.
          </p>
        </div>
      </main>
    </div>
  )
}
