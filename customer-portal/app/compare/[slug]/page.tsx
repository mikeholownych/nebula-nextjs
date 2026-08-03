import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { comparisons, getComparison } from '../comparisons'

export const dynamicParams = false

const BASE_URL = 'https://nebulacomponents.com'

export function generateStaticParams() {
  return comparisons.map((c) => ({ slug: c.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const comparison = getComparison(slug)
  if (!comparison) return {}

  const title = `Nebula Components vs ${comparison.toolName} — Landing Page Audit Alternative`
  const description = `${comparison.shortDescription} How Nebula Components compares: evidence-led conversion audits with published pass standards vs ${comparison.toolName}.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/compare/${comparison.slug}`,
      type: 'website',
    },
    alternates: {
      canonical: `${BASE_URL}/compare/${comparison.slug}`,
    },
  }
}

export default async function ComparisonPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const comparison = getComparison(slug)
  if (!comparison) notFound()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `Nebula Components vs ${comparison.toolName}`,
    description: comparison.intro,
    about: [
      { '@type': 'Organization', name: 'Nebula Components', url: BASE_URL },
      { '@type': 'Product', name: comparison.toolName, url: comparison.toolUrl },
    ],
  }

  return (
    <main className="min-h-screen bg-bg text-fg pt-24" id="main-content">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        <p className="text-sm text-accent font-medium mb-2">
          <a href="/compare" className="hover:underline">← All comparisons</a>
        </p>
        <h1 className="text-4xl font-bold mb-3">
          Nebula Components vs {comparison.toolName}
        </h1>
        <p className="text-fg-muted text-lg mb-8">
          {comparison.shortDescription}
        </p>

        <section className="mb-10">
          <p className="text-fg-muted leading-relaxed">{comparison.intro}</p>
        </section>

        {/* What it does well / where it stops / where Nebula fits */}
        <div className="grid md:grid-cols-3 gap-6 mb-10">
          <section className="bg-bg-elevated border border-border rounded-lg p-6">
            <h2 className="text-lg font-bold text-fg mb-3">What {comparison.toolName} does well</h2>
            <ul className="space-y-2 text-sm text-fg-muted">
              {comparison.whatItDoesWell.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-accent">+</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="bg-bg-elevated border border-border rounded-lg p-6">
            <h2 className="text-lg font-bold text-fg mb-3">Where it stops</h2>
            <ul className="space-y-2 text-sm text-fg-muted">
              {comparison.whereItStops.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-danger">−</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="bg-bg-elevated border border-accent/30 rounded-lg p-6">
            <h2 className="text-lg font-bold text-fg mb-3">Where Nebula fits</h2>
            <ul className="space-y-2 text-sm text-fg-muted">
              {comparison.nebulaFit.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-accent">→</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Comparison table */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold mb-4">Side by side</h2>
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-bg-elevated text-left text-fg-muted">
                  <th className="px-4 py-3 font-medium">Dimension</th>
                  <th className="px-4 py-3 font-medium">{comparison.toolName}</th>
                  <th className="px-4 py-3 font-medium text-accent">Nebula Components</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {comparison.table.map((row) => (
                  <tr key={row.dimension}>
                    <td className="px-4 py-3 text-fg-muted whitespace-nowrap align-top">{row.dimension}</td>
                    <td className="px-4 py-3 text-fg-muted align-top">{row.tool}</td>
                    <td className="px-4 py-3 text-fg align-top">{row.nebula}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Use both */}
        <section className="bg-bg-elevated border border-border rounded-lg p-6 mb-10">
          <h2 className="text-lg font-bold text-fg mb-2">The honest take: use both</h2>
          <p className="text-fg-muted leading-relaxed">{comparison.useBoth}</p>
        </section>

        {/* Verdict */}
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-2">Verdict</h2>
          <p className="text-fg-muted leading-relaxed">{comparison.verdict}</p>
        </section>

        {/* CTA */}
        <section className="bg-bg-elevated border border-border rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-2">Run the free audit</h2>
          <p className="text-fg-muted mb-6 max-w-xl mx-auto">
            Score the page you have right now against published component pass standards — no signup, no site access, no rebuild.
          </p>
          <a
            href="/audit"
            className="inline-block rounded-lg bg-accent px-8 py-3 text-sm font-semibold text-bg hover:bg-accent-light transition-colors"
          >
            Free Audit
          </a>
        </section>
      </div>
    </main>
  )
}
