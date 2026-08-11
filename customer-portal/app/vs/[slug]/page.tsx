import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { COMPARISONS } from './data'

export function generateStaticParams() {
  return Object.keys(COMPARISONS).map((slug) => ({ slug }))
}

export function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  return params.then(({ slug }) => {
    const c = COMPARISONS[slug]
    if (!c) return {}
    return {
      title: `${c.competitorName} Alternative: Nebula vs. ${c.competitorName} - Free Landing Page Audit`,
      description: c.bluf || c.intent,
      alternates: {
        canonical: `https://nebulacomponents.com/vs/${c.slug}`,
      },
      openGraph: {
        title: `${c.competitorName} Alternative: Nebula vs. ${c.competitorName}`,
        description: c.bluf || c.intent,
        url: `https://nebulacomponents.com/vs/${c.slug}`,
      },
    }
  })
}

export default async function ComparisonPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const c = COMPARISONS[slug]
  if (!c) notFound()

  const nebulaWinCount = c.rows.filter((r) => r.nebulaWins).length

  return (
    <main id="main-content" className="min-h-screen bg-bg pt-24 pb-24">
      <article className="mx-auto max-w-4xl px-6 py-12">

        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-8">
          <ol className="flex items-center gap-2 text-sm text-fg-muted">
            <li><Link href="/" className="hover:text-fg">Home</Link></li>
            <li aria-hidden="true">/</li>
            <li><Link href="/vs" className="hover:text-fg">Comparisons</Link></li>
            <li aria-hidden="true">/</li>
            <li className="text-fg" aria-current="page">{c.competitorName}</li>
          </ol>
        </nav>

        {/* Header */}
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-accent">
          Tool Comparison · {c.checkedAt}
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-fg md:text-5xl">
          {c.competitorName} vs. Nebula
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-fg-muted">{c.intent}</p>

        {/* Bottom Line Up Front - placed high so AI engines and skimming
            readers can pull the answer as a snippet (Breaking B2B playbook) */}
        <section
          aria-label="Bottom line"
          className="mt-8 rounded-2xl border border-accent/20 bg-accent/5 p-6"
        >
          <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Bottom line up front</h2>
          <p className="mt-3 text-lg leading-8 text-fg">{c.bluf}</p>
        </section>

        {/* Win count */}
        <div className="mt-8 inline-flex items-center gap-3 rounded-xl border border-accent/20 bg-accent/5 px-5 py-3">
          <span className="text-2xl font-bold text-accent">{nebulaWinCount}/{c.rows.length}</span>
          <span className="text-sm text-fg-muted">signals where Nebula is the better fit for conversion auditing</span>
        </div>

        {/* Comparison table */}
        <section className="mt-12 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="py-3 pr-6 text-left text-xs font-semibold uppercase tracking-widest text-fg-muted">Feature</th>
                <th className="py-3 pr-6 text-left text-xs font-semibold uppercase tracking-widest text-accent">Nebula</th>
                <th className="py-3 text-left text-xs font-semibold uppercase tracking-widest text-fg-muted">{c.competitorName}</th>
              </tr>
            </thead>
            <tbody>
              {c.rows.map((row) => (
                <tr key={row.feature} className="border-b border-border/50">
                  <td className="py-4 pr-6 font-medium text-fg">{row.feature}</td>
                  <td className={`py-4 pr-6 ${row.nebulaWins ? 'text-fg' : 'text-fg-muted'}`}>
                    {row.nebulaWins && (
                      <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-accent align-middle" />
                    )}
                    {row.nebula}
                  </td>
                  <td className="py-4 text-fg-muted">{row.competitor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Verdict */}
        <section className="mt-12 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-xl font-bold text-fg">Bottom line</h2>
          <p className="text-fg-muted leading-relaxed">{c.verdict}</p>
        </section>

        {/* FAQs - real questions prospects ask; also emitted as FAQPage
            JSON-LD so AI engines can cite structured answers */}
        <section className="mt-12" aria-label="Frequently asked questions">
          <h2 className="mb-6 text-2xl font-bold text-fg">Frequently asked questions</h2>
          <div className="divide-y divide-border rounded-2xl border border-border bg-bg-panel">
            {c.faqs.map((faq) => (
              <details key={faq.q} className="group px-6 py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left font-semibold text-fg">
                  {faq.q}
                  <span aria-hidden="true" className="shrink-0 text-accent transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-fg-muted leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* FAQPage JSON-LD for AI citation */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: c.faqs.map((faq) => ({
                '@type': 'Question',
                name: faq.q,
                acceptedAnswer: { '@type': 'Answer', text: faq.a },
              })),
            }),
          }}
        />

        {/* Disclosure */}
        <div className="mt-6 rounded-xl border border-signal-fail/20 bg-signal-fail/5 px-5 py-4 text-sm text-fg-muted">
          <strong className="text-fg">Note: </strong>
          Competitor information is based on publicly available pricing and feature pages checked in {c.checkedAt}.
          Prices and features change - verify at{' '}
          <a href={c.competitorUrl} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
            {c.competitorUrl.replace('https://', '')}
          </a>{' '}
          before deciding.
        </div>

        {/* CTA */}
        <section className="mt-14 rounded-2xl border border-accent/20 bg-accent/5 p-8 text-center">
          <h2 className="text-2xl font-bold text-fg">See what Nebula finds on your page</h2>
          <p className="mt-3 text-fg-muted">
            Free, no signup. Results in under 2 minutes.
          </p>
          <Link
            href="/audit?utm_source=competitor-page&utm_medium=organic-content"
            className="mt-6 inline-block rounded-xl bg-accent px-8 py-4 font-semibold text-bg hover:bg-accent-light focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg transition-colors"
          >
            Find the Leak →
          </Link>
          <p className="mt-3 text-xs text-fg-muted">
            Under 2 minutes · no signup · no sales call
          </p>
        </section>

      </article>
    </main>
  )
}
