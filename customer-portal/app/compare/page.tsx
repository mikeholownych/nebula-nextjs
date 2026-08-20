import { Metadata } from 'next'
import { comparisons } from './comparisons'

export const metadata: Metadata = {
  title: 'Nebula Components vs Landing Page Tools - Comparisons',
  description:
    'Honest, evidence-led comparisons of Nebula Components against landing page builders, CRO agencies, and synthetic testing tools: WhyIQ, Landing Doctors, Unbounce, Instapage, PageSpeed Insights, Leadpages.',
  openGraph: {
    title: 'Nebula Components vs Landing Page Tools - Comparisons',
    description:
      'Evidence-led landing page audit vs builders, agencies, and testing tools. Honest boundaries and observable checks.',
    url: 'https://nebulacomponents.com/compare',
  },
  alternates: {
    canonical: 'https://nebulacomponents.com/compare',
  },
}

export default function ComparePage() {
  return (
    <main className="min-h-screen bg-bg text-fg pt-24" id="main-content">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="heading-1 mb-3">Nebula Components vs the tools founders actually use</h1>
        <p className="text-fg-muted text-lg mb-10">
          Landing page builders create pages. Performance meters measure speed. Nebula audits
          conversion readiness against observable checks. These pages state the boundary
          honestly - and where the other tool wins, it says so.
        </p>

        <section className="space-y-6">
          {comparisons.map((comparison) => (
            <a
              key={comparison.slug}
              href={`/compare/${comparison.slug}`}
              className="block bg-bg-elevated border border-border rounded-lg p-6 hover:border-accent-dark transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold text-accent/80">
                  vs {comparison.toolName}
                </h2>
                <span className="text-xs text-fg-dim border border-border rounded-full px-3 py-1">
                  {comparison.category}
                </span>
              </div>
              <p className="text-fg-muted text-sm leading-relaxed">{comparison.shortDescription}</p>
            </a>
          ))}
        </section>

        <section className="mt-12 bg-bg-elevated border border-border rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-2">Stop comparing. Start diagnosing.</h2>
          <p className="text-fg-muted mb-6 max-w-xl mx-auto">
            The free audit scores the page you already have against observable component checks -
            no signup, no site access, no rebuild.
          </p>
          <a
            href="/audit?utm_source=content&utm_medium=organic-content"
            className="inline-block rounded-lg bg-accent px-8 py-3 text-sm font-semibold text-bg hover:opacity-85 hover:bg-accent transition-colors"
          >
            Free Audit
          </a>
        </section>
      </div>
    </main>
  )
}
