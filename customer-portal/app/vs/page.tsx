import type { Metadata } from 'next'
import Link from 'next/link'
import { COMPARISONS } from './[slug]/data'

export const metadata: Metadata = {
  title: 'Nebula vs. Other Landing Page Audit Tools | Nebula',
  description: 'Side-by-side comparisons of Nebula against PageSpeed Insights, HubSpot Website Grader, Nibbler, and Google Lighthouse — what each checks, what it costs, and who it is for.',
  alternates: {
    canonical: 'https://nebulacomponents.shop/vs',
  },
}

export default function VsIndexPage() {
  const comparisons = Object.values(COMPARISONS)

  return (
    <main id="main-content" className="min-h-screen bg-bg pt-24 pb-24">
      <div className="mx-auto max-w-4xl px-6 py-12">
        <nav aria-label="Breadcrumb" className="mb-8">
          <ol className="flex items-center gap-2 text-sm text-fg-muted">
            <li><Link href="/" className="hover:text-fg">Home</Link></li>
            <li aria-hidden="true">/</li>
            <li className="text-fg" aria-current="page">Comparisons</li>
          </ol>
        </nav>

        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-accent">Tool Comparisons</p>
        <h1 className="text-4xl font-bold tracking-tight text-fg md:text-5xl">
          Nebula vs. Other Audit Tools
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-fg-muted">
          Every audit tool below checks something different. These pages show exactly what each one checks, what it costs,
          and where Nebula fits — so you can pick the right tool for your problem.
        </p>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {comparisons.map((c) => (
            <Link
              key={c.slug}
              href={`/vs/${c.slug}`}
              className="group rounded-2xl border border-border bg-bg-panel p-6 transition-colors hover:border-accent"
            >
              <p className="text-xs font-semibold uppercase tracking-widest text-fg-muted">vs.</p>
              <h2 className="mt-2 text-xl font-bold text-fg group-hover:text-accent transition-colors">
                {c.competitorName}
              </h2>
              <p className="mt-3 text-sm text-fg-muted leading-relaxed">{c.intent}</p>
              <p className="mt-4 text-xs text-accent">See comparison →</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  )
}
