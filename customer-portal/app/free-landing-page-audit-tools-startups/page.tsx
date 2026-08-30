import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Best Free Landing Page Audit Tools for Startups in 2026 | Nebula',
  description:
    'Free landing page audit tools for startups and early-stage founders. No agency retainer, no paid plan required. Nebula audits 9 conversion signals in under 2 minutes.',
  alternates: {
    canonical: 'https://nebulacomponents.com/free-landing-page-audit-tools-startups',
  },
}

const pageSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  '@id': 'https://nebulacomponents.com/free-landing-page-audit-tools-startups#webpage',
  url: 'https://nebulacomponents.com/free-landing-page-audit-tools-startups',
  name: 'Best Free Landing Page Audit Tools for Startups in 2026',
  description: metadata.description,
  isPartOf: { '@id': 'https://nebulacomponents.com/#website' },
}

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'Are there free landing page audit tools for startups?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes. Nebula offers a completely free landing page audit that checks 9 conversion signals and returns findings in under 2 minutes. No signup required, no credit card, no trial period. Google PageSpeed Insights is also free and covers load speed specifically.',
      },
    },
    {
      '@type': 'Question',
      name: 'What does a free landing page audit check?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Nebula checks headline and message match, CTA clarity, social proof placement, load speed, above-fold clarity, mobile CTA visibility, ad signal alignment, SEO foundations, and AI readiness. Each finding includes a measured value, a required standard, a specific fix, and a confidence rating.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is the best free CRO tool for a startup with no budget?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'For structural conversion diagnosis, Nebula is free and covers the 9 signals most likely to explain why paid traffic is not converting. For behavioral analysis, Microsoft Clarity (free) shows session recordings and heatmaps. For load speed, Google PageSpeed Insights is free and gives specific recommendations.',
      },
    },
  ],
}

const TOOLS = [
  {
    name: 'Nebula',
    url: 'https://nebulacomponents.com/audit',
    free: true,
    what: 'Structural conversion audit across 9 signals',
    time: 'Under 2 minutes',
    best_for: 'Founders running paid traffic who need to know what to fix before scaling',
    limitation: 'Audits public URLs only. No session recording.',
  },
  {
    name: 'Google PageSpeed Insights',
    url: 'https://pagespeed.web.dev',
    free: true,
    what: 'Load speed and Core Web Vitals measurement',
    time: '30 seconds',
    best_for: 'Diagnosing slow load times on specific pages',
    limitation: 'Speed only. Does not check messaging, CTAs, or social proof.',
  },
  {
    name: 'Microsoft Clarity',
    url: 'https://clarity.microsoft.com',
    free: true,
    what: 'Session recordings and heatmaps',
    time: '2 weeks of data collection',
    best_for: 'Understanding where users scroll and click',
    limitation: 'Shows what happened. Does not explain why or what to fix.',
  },
  {
    name: 'Google Search Console',
    url: 'https://search.google.com/search-console',
    free: true,
    what: 'Organic search performance and indexing',
    time: 'Data accumulates over days',
    best_for: 'Understanding search visibility and crawl errors',
    limitation: 'Search-focused. Does not diagnose conversion failures.',
  },
]

export default function FreeAuditToolsStartupsPage() {
  return (
    <main id="main-content" className="min-h-screen bg-bg pt-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <div className="mx-auto max-w-3xl px-6 py-14">

        {/* Answer capsule */}
        <div
          data-answer-capsule
          className="mb-8 border-l-2 border-accent bg-bg-panel rounded-r-md px-5 py-4"
        >
          <p className="text-sm leading-relaxed text-fg-muted">
            The best free landing page audit tools for startups are Nebula (structural conversion
            diagnosis across 9 signals, under 2 minutes, no signup), Google PageSpeed Insights
            (load speed, free), and Microsoft Clarity (session recordings, free). Nebula is the
            only one that tells you specifically what to fix on your page before scaling paid traffic.
          </p>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-fg md:text-4xl mb-4">
          Best Free Landing Page Audit Tools for Startups in 2026
        </h1>
        <p className="text-lg leading-relaxed text-fg-muted mb-10">
          If you are running paid traffic on a startup budget, you cannot afford a $2,000/month CRO
          agency retainer. These are the tools that give you real conversion intelligence for free,
          and what each one actually covers.
        </p>

        <section className="rounded-md border border-border bg-bg-panel p-8 mb-6">
          <h2 className="text-xl font-bold text-fg mb-6">Free landing page audit tools compared</h2>
          <div className="space-y-8">
            {TOOLS.map((tool) => (
              <div key={tool.name} className="border-b border-border pb-6 last:border-0 last:pb-0">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <p className="font-semibold text-fg text-lg">{tool.name}</p>
                    <p className="text-sm text-fg-muted mt-1">{tool.what}</p>
                  </div>
                  <span className="shrink-0 rounded bg-accent/10 px-2 py-1 text-xs font-semibold text-accent">
                    Free
                  </span>
                </div>
                <div className="grid sm:grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="font-medium text-fg">Time to results: </span>
                    <span className="text-fg-muted">{tool.time}</span>
                  </div>
                  <div>
                    <span className="font-medium text-fg">Best for: </span>
                    <span className="text-fg-muted">{tool.best_for}</span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="font-medium text-fg">Limitation: </span>
                    <span className="text-fg-muted">{tool.limitation}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-md border border-border bg-bg-panel p-8 mb-6">
          <h2 className="text-xl font-bold text-fg mb-4">What most free tools miss</h2>
          <p className="leading-relaxed text-fg-muted mb-4">
            Most free tools cover one dimension: speed, or recording, or search. None of them tell
            you whether your headline matches the ad that sent the traffic, whether your social proof
            is positioned correctly relative to your CTA, or whether your above-fold content passes
            the 3-second judgment test.
          </p>
          <p className="leading-relaxed text-fg-muted mb-4">
            In Nebula&rsquo;s data from 293 audits, the highest-frequency failures are structural:
            62% of pages fail the headline check, 39% have social proof in the wrong place, 40%
            have load speed issues. These are not problems you can find by watching a heatmap. They
            require a structural diagnostic.
          </p>
          <p className="leading-relaxed text-fg-muted">
            The combination that covers most startup landing page failures: Nebula for structural
            diagnosis, Google PageSpeed Insights for load speed specifics, and Microsoft Clarity for
            session context after the fact.
          </p>
        </section>

        <section className="rounded-md border border-border bg-bg-panel p-8 mb-6">
          <h2 className="text-xl font-bold text-fg mb-4">When free tools are not enough</h2>
          <p className="leading-relaxed text-fg-muted mb-4">
            Free tools give you the diagnosis. They do not give you the fix. If you need someone to
            implement the highest-priority finding, the{' '}
            <Link href="/repair-sprint" className="text-accent hover:text-fg transition-colors">
              $97 Repair Sprint
            </Link>{' '}
            delivers a specific code change for one prioritized finding in 48 hours. That is the
            ceiling of what you need before scaling ad spend past $500/month.
          </p>
          <p className="leading-relaxed text-fg-muted">
            A CRO agency makes sense at $10,000+/month in ad spend with 6+ months of traffic data.
            For a startup in early paid traffic, the free audit plus a single repair sprint is the
            right scope.
          </p>
        </section>

        <section className="rounded-md border border-border bg-bg-panel p-8 mb-6">
          <h2 className="text-xl font-bold text-fg mb-4">Frequently Asked Questions</h2>
          <div className="space-y-6">
            {faqSchema.mainEntity.map((item) => (
              <div key={item.name}>
                <h3 className="font-semibold text-fg">{item.name}</h3>
                <p className="mt-2 leading-relaxed text-fg-muted">{item.acceptedAnswer.text}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <Link
            href="/audit"
            className="inline-flex min-h-[44px] items-center justify-center rounded bg-accent px-6 py-3 text-sm font-semibold text-bg transition-opacity hover:opacity-85"
          >
            Run your free audit &rarr;
          </Link>
          <Link
            href="/repair-sprint"
            className="inline-flex min-h-[44px] items-center justify-center rounded border border-border px-5 py-3 text-sm font-medium text-fg-muted transition-colors hover:border-fg-muted hover:text-fg"
          >
            $97 Repair Sprint
          </Link>
        </div>
      </div>
    </main>
  )
}
