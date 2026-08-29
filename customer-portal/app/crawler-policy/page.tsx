import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Crawler Policy: NebulaSEOBot | Nebula Components',
  description: 'NebulaSEOBot is the Nebula Components CRO diagnostic crawler. This page describes what it crawls, how to identify it, and how to opt out.',
  robots: { index: true, follow: true },
}

export default function CrawlerPolicyPage() {
  return (
    <main className="max-w-2xl mx-auto px-6 py-16 text-fg font-sans">
      <p className="text-sm font-mono text-fg-muted uppercase tracking-widest mb-4">Crawler Policy</p>
      <h1 className="text-3xl font-semibold mb-2">NebulaSEOBot</h1>
      <p className="text-fg-muted mb-12">Last updated: August 2026</p>

      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-3">What it is</h2>
        <p className="text-fg-secondary leading-relaxed">
          NebulaSEOBot is the diagnostic crawler operated by{' '}
          <a href="https://nebulacomponents.com" className="text-accent hover:underline">Nebula Components</a>.
          It fetches web pages to perform CRO (conversion rate optimization) diagnostics, checking
          page structure, headline quality, CTA placement, load performance, and AI-readiness signals.
          It does not index content for search, build training datasets, or aggregate content for
          redistribution.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-3">User-Agent string</h2>
        <pre className="bg-surface-muted border border-border rounded-md px-4 py-3 text-sm font-mono text-fg overflow-x-auto">
          NebulaSEOBot/1.0 (+https://nebulacomponents.com/crawler-policy)
        </pre>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-3">What it crawls</h2>
        <ul className="space-y-2 text-fg-secondary">
          <li className="flex gap-2"><span className="text-accent mt-1">&middot;</span><span>URLs explicitly submitted by a site owner for diagnostic purposes</span></li>
          <li className="flex gap-2"><span className="text-accent mt-1">&middot;</span><span>URLs discovered via a site&apos;s published sitemap, when a site owner initiates a site-wide audit</span></li>
          <li className="flex gap-2"><span className="text-accent mt-1">&middot;</span><span>
            <code className="font-mono text-sm bg-surface-muted px-1 py-0.5 rounded">nebulacomponents.com</code> itself, for internal SEO monitoring
          </span></li>
        </ul>
        <p className="text-fg-secondary mt-4">
          It does <strong className="text-fg">not</strong> crawl sites speculatively, harvest emails, follow
          pagination endlessly, or scrape content for redistribution.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-3">Rate limits</h2>
        <ul className="space-y-2 text-fg-secondary">
          <li className="flex gap-2"><span className="text-accent mt-1">&middot;</span><span>Maximum 1 request per 2 seconds per domain</span></li>
          <li className="flex gap-2"><span className="text-accent mt-1">&middot;</span><span>Respects <code className="font-mono text-sm bg-surface-muted px-1 py-0.5 rounded">Crawl-delay</code> directives in robots.txt</span></li>
          <li className="flex gap-2"><span className="text-accent mt-1">&middot;</span><span>Respects <code className="font-mono text-sm bg-surface-muted px-1 py-0.5 rounded">Retry-After</code> headers on 429 responses</span></li>
          <li className="flex gap-2"><span className="text-accent mt-1">&middot;</span><span>One concurrent connection per domain at a time</span></li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-3">How to opt out</h2>
        <p className="text-fg-secondary mb-4">
          Add the following to your <code className="font-mono text-sm bg-surface-muted px-1 py-0.5 rounded">robots.txt</code>:
        </p>
        <pre className="bg-surface-muted border border-border rounded-md px-4 py-3 text-sm font-mono text-fg">
{`User-agent: NebulaSEOBot
Disallow: /`}
        </pre>
        <p className="text-fg-secondary mt-4">
          NebulaSEOBot checks and respects robots.txt before fetching any page. Opt-outs take
          effect within one hour of being published.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-3">Verification</h2>
        <p className="text-fg-secondary">
          NebulaSEOBot operates from a dedicated IP address with a matching reverse DNS record
          resolving to <code className="font-mono text-sm bg-surface-muted px-1 py-0.5 rounded">bot.nebulacomponents.com</code>.
          You can verify a request is genuine by performing a reverse DNS lookup on the source IP.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-lg font-semibold mb-3">Contact</h2>
        <p className="text-fg-secondary">
          To report a problem, request removal, or ask about a specific crawl:{' '}
          <a href="mailto:mike@nebulacomponents.com" className="text-accent hover:underline">
            mike@nebulacomponents.com
          </a>
        </p>
      </section>
    </main>
  )
}
