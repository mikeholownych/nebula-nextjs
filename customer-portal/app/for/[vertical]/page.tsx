import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getVertical, getAllVerticalSlugs } from './data'

// ── Static params for programmatic pages ──────────────────────────────────
export function generateStaticParams() {
  return getAllVerticalSlugs().map(slug => ({ vertical: slug }))
}

// ── Metadata ───────────────────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ vertical: string }>
}): Promise<Metadata> {
  const { vertical: slug } = await params
  const v = getVertical(slug)
  if (!v) return {}

  const title = `Landing Page Audit for ${v.name}, Find What's Killing Conversion | Nebula`
  const description = `${v.pain.slice(0, 140)} Nebula scores your ${v.name.toLowerCase()} page across 9 conversion signals and shows you exactly what to fix.`

  return {
    title,
    description,
    alternates: { canonical: `https://nebulacomponents.com/for/${slug}` },
    openGraph: {
      title,
      description,
      url: `https://nebulacomponents.com/for/${slug}`,
      siteName: 'Nebula Components',
      type: 'website',
    },
  }
}

// ── Page ───────────────────────────────────────────────────────────────────
export default async function VerticalPage({
  params,
}: {
  params: Promise<{ vertical: string }>
}) {
  const { vertical: slug } = await params
  const v = getVertical(slug)
  if (!v) notFound()

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: `Nebula Landing Page Audit, ${v.name}`,
    applicationCategory: 'BusinessApplication',
    description: `Evidence-backed landing page audit for ${v.name} pages. Identifies conversion leaks across 9 signals.`,
    url: `https://nebulacomponents.com/for/${slug}`,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', availability: 'https://schema.org/InStock' },
    provider: { '@type': 'Organization', name: 'Nebula Components', url: 'https://nebulacomponents.com' },
  }

  return (
    <main id="main-content" className="min-h-screen bg-bg pt-24 pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="max-w-3xl mx-auto px-6">

        {/* Header */}
        <div className="mb-12">
          <p className="text-xs font-semibold uppercase tracking-[.2em] text-accent mb-4">
            Landing page audit for {v.name}
          </p>
          <h1 className="text-4xl font-extrabold text-fg mb-4 leading-tight">
            {v.headline}
          </h1>
          <p className="text-xl text-fg-muted leading-relaxed">
            {v.subheadline}
          </p>
        </div>

        {/* ICP callout */}
        <div className="bg-surface border border-border rounded-xl p-5 mb-10">
          <p className="text-xs font-semibold uppercase tracking-widest text-fg-muted mb-2">Who this is for</p>
          <p className="text-fg-muted leading-relaxed">{v.icp}</p>
        </div>

        {/* The problem */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-fg mb-4">The problem</h2>
          <p className="text-fg-muted leading-relaxed text-lg">{v.pain}</p>
        </section>

        {/* Top leaks */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-fg mb-6">
            The two most common leaks on {v.name.toLowerCase()} pages
          </h2>
          <div className="flex flex-col gap-5">
            <div className="bg-surface border border-border rounded-xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-[#ef4444] flex-shrink-0" />
                <span className="text-xs font-semibold uppercase tracking-widest text-[#ef4444]">
                  Highest-impact leak
                </span>
              </div>
              <p className="text-fg leading-relaxed">{v.top_leak}</p>
            </div>
            <div className="bg-surface border border-border rounded-xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-[#f59e0b] flex-shrink-0" />
                <span className="text-xs font-semibold uppercase tracking-widest text-[#f59e0b]">
                  Second most common leak
                </span>
              </div>
              <p className="text-fg leading-relaxed">{v.second_leak}</p>
            </div>
          </div>
        </section>

        {/* Benchmark */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-fg mb-4">What the data says</h2>
          <div className="bg-surface border border-border rounded-xl p-6">
            <p className="text-fg-muted leading-relaxed">{v.benchmark}</p>
            <p className="text-sm text-fg-muted mt-4 border-t border-border pt-4">
              Source: Nebula audit dataset, real pages scored across 9 conversion signals. No invented benchmarks.
            </p>
          </div>
        </section>

        {/* How the audit works */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-fg mb-6">How a Nebula audit works for {v.name.toLowerCase()} pages</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { step: '01', title: 'Enter your URL', desc: 'Paste your landing page URL. The audit runs against the live page, no install, no tracking code.' },
              { step: '02', title: 'Get your score', desc: 'Nebula scores your page across 9 conversion signals. Each signal is evidence-backed, not an opinion.' },
              { step: '03', title: 'See what to fix', desc: 'Findings are ranked by impact. The top leak is named specifically, not "improve your CTA" but the exact structural problem.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="bg-surface border border-border rounded-xl p-5">
                <div className="text-2xl font-extrabold text-accent mb-2" style={{ fontFamily: 'IBM Plex Mono, Courier New, monospace' }}>{step}</div>
                <div className="text-sm font-semibold text-fg mb-2">{title}</div>
                <div className="text-sm text-fg-muted leading-relaxed">{desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="bg-[#0e1a0e] border border-[#1e3a1e] rounded-2xl p-8 text-center mb-12">
          <h2 className="text-2xl font-bold text-fg mb-3">{v.cta_copy}</h2>
          <p className="text-fg-muted mb-6 max-w-md mx-auto text-sm leading-relaxed">
            Free. No signup required. See your score and top leak immediately. Email capture only if you want the full report.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href={`/score`}
              className="rounded-lg bg-accent px-6 py-3 text-sm font-bold text-bg transition-opacity hover:opacity-90"
            >
              See my score instantly
            </Link>
            <Link
              href="/audit"
              className="rounded-lg border border-[#1e3a1e] px-6 py-3 text-sm font-semibold text-fg-muted transition-colors hover:text-fg hover:border-fg-muted"
            >
              Full free audit
            </Link>
          </div>
          <p className="text-xs text-fg-muted mt-4">
            $97 to fix the top leak. 48 hours. No calls required.
          </p>
        </section>

        {/* Related */}
        <section>
          <h2 className="text-lg font-bold text-fg mb-4">Related reading</h2>
          <ul className="flex flex-col gap-2">
            {v.related_links.map(([href, label]) => (
              <li key={href}>
                <Link href={href} className="text-sm text-accent hover:underline">
                  {label} →
                </Link>
              </li>
            ))}
            <li>
              <Link href="/teardowns" className="text-sm text-accent hover:underline">
                Public teardowns, real pages scored →
              </Link>
            </li>
            <li>
              <Link href="/proof" className="text-sm text-accent hover:underline">
                Real audit data, what we found in 139 pages →
              </Link>
            </li>
          </ul>
        </section>

      </div>
    </main>
  )
}
