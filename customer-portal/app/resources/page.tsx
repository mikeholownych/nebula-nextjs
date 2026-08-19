import type { Metadata } from 'next'
import Link from 'next/link'
import { citableLicenseFacts, citableReleaseFacts } from './citable/content'

export const metadata: Metadata = {
  title: 'Resources - Tools & Open Source | Nebula Components',
  description:
    'Open-source tools and resources from Nebula Components - including Citable, the search and AI discoverability governance CLI for SEO, AEO, and GEO audits.',
  alternates: { canonical: 'https://nebulacomponents.com/resources' },
}

const resourceSchema = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  '@id': 'https://nebulacomponents.com/resources',
  name: 'Resources - Nebula Components',
  description:
    'Open-source tools built from real conversion and discoverability problems on real sites.',
  url: 'https://nebulacomponents.com/resources',
  publisher: { '@id': 'https://nebulacomponents.com/#organization' },
  hasPart: [
    {
      '@type': 'SoftwareApplication',
      '@id': 'https://nebulacomponents.com/resources/citable',
      name: 'Citable',
      applicationCategory: 'DeveloperApplication',
      operatingSystem: 'Node.js',
      url: 'https://nebulacomponents.com/resources/citable',
      downloadUrl: 'https://www.npmjs.com/package/@nebulacomponents/citable',
      softwareVersion: citableReleaseFacts.version,
      license: citableLicenseFacts.url,
      description:
        `Citable is the open evidence layer beneath Nebula for defensible SEO, AEO, and GEO audits. ${citableReleaseFacts.detectorCount} detectors across ${citableReleaseFacts.namespaceCount} namespaces. Evidence packages on every run.`,
      author: { '@id': 'https://nebulacomponents.com/#organization' },
    },
  ],
}

export default function ResourcesPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(resourceSchema) }}
      />
      <main id="main-content" className="min-h-screen bg-bg pt-24">
        <div className="mx-auto max-w-5xl px-6 py-14">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-accent">
            Nebula Components
          </p>
          <h1 className="heading-1 tracking-tight text-fg md:text-6xl">Resources</h1>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-fg-muted">
            Open-source tools built from real problems on real sites. Each one addresses a specific, reproducible failure mode we encountered while diagnosing and fixing landing pages.
          </p>

          <div className="mt-12 grid gap-5 sm:grid-cols-2">
            <Link
              href="/resources/citable"
              className="flex flex-col gap-2.5 rounded-md border border-border bg-bg-panel p-7 transition-colors hover:border-accent/30"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.1em] text-accent">Open Source CLI</p>
              <h2 className="text-xl font-semibold tracking-tight text-fg">Citable</h2>
              <p className="flex-1 text-sm leading-relaxed text-fg-muted">
                The open evidence layer beneath Nebula for defensible SEO, AEO, and GEO audits.{' '}
                {citableReleaseFacts.detectorCount} detectors across{' '}
                {citableReleaseFacts.namespaceCount} namespaces - technical retrieval, entity
                identity, claim governance, agent-readiness, and more. Evidence packages on every
                run. {citableLicenseFacts.label}.
              </p>
              <div className="mt-1 flex items-center justify-between">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-accent/30 px-3 py-1 text-xs text-accent">v{citableReleaseFacts.version}</span>
                  <span className="rounded-full border border-border px-3 py-1 text-xs text-fg-muted">{citableLicenseFacts.label}</span>
                  <span className="rounded-full border border-border px-3 py-1 text-xs text-fg-muted">npm</span>
                  <span className="rounded-full border border-border px-3 py-1 text-xs text-fg-muted">Node.js</span>
                </div>
                <span className="text-lg text-accent">→</span>
              </div>
            </Link>
          </div>

          <section className="mt-16 border-t border-border pt-12">
            <h2 className="mb-4 text-2xl font-bold tracking-tight text-fg">Why we build in the open</h2>
            <p className="mb-4 max-w-2xl leading-relaxed text-fg-muted">
              Every tool here started as an internal need. Citable was built because we needed a
              reproducible, evidence-backed way to audit whether a site was actually retrievable by
              search engines and AI systems - not just whether it looked correct. Generic SEO dashboards
              gave opinions. We needed deterministic observations with evidence packages.
            </p>
            <p className="mb-4 max-w-2xl leading-relaxed text-fg-muted">
              Open-sourcing these tools means the diagnostics are transparent and the findings are
              reproducible. If a Citable audit says your <code className="rounded bg-bg-elevated px-1.5 py-0.5 text-fg">robots.txt</code> blocks AI retrieval,
              anyone can verify that independently. That&apos;s the operating premise: evidence over opinion,
              at every layer.
            </p>
            <p className="mb-4 max-w-2xl leading-relaxed text-fg-muted">
              Citable is the open verification layer; Nebula is the commercial application built on
              top of it. Citable defines what can be supported. Nebula turns supported observations
              into conversion diagnostics, repairs, and follow-up decisions.
            </p>
            <p>
              <Link href="/resources/citable" className="font-semibold text-accent hover:text-fg transition-colors">
                Read the full Citable documentation →
              </Link>
            </p>
          </section>
        </div>
      </main>
    </>
  )
}
