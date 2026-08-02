import type { Metadata } from 'next'
import Link from 'next/link'
import BreadcrumbSchema from '@/app/components/BreadcrumbSchema'

export const metadata: Metadata = {
  title: 'Mike Holownych - Founder, Nebula Components',
  description: 'Mike Holownych founded Nebula Components after observing the same seven conversion failure patterns recur across landing page after landing page.',
  alternates: { canonical: 'https://nebulacomponents.shop/about/team' },
}

// Extends the same #founder Person node declared site-wide in
// organizationSchema (see app/lib/schema.ts) with page-specific detail —
// same @id, richer profile, per the schema audit's Finding 7. Google and
// AI crawlers merge same-@id nodes across a page's JSON-LD blocks.
const founderSchema = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  '@id': 'https://nebulacomponents.shop/#founder',
  name: 'Mike Holownych',
  jobTitle: 'Founder',
  url: 'https://nebulacomponents.shop/about/team',
  description:
    'Founder of Nebula Components. Identified the same seven conversion failure patterns recurring across landing page after landing page - the basis for the 9-point diagnostic framework used in every Nebula audit.',
  knowsAbout: [
    'Landing page conversion optimization',
    'Message-match diagnosis',
    'Paid traffic (Google Ads, Meta Ads, LinkedIn Ads)',
    'Core Web Vitals',
  ],
  sameAs: [
    'https://www.linkedin.com/in/mikeholownych',
    'https://github.com/mikeholownych',
  ],
  worksFor: { '@id': 'https://nebulacomponents.shop/#organization' },
}

export default function TeamPage() {
  return (
    <main id="main-content" className="min-h-screen bg-bg text-fg pt-24">
      <BreadcrumbSchema />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(founderSchema) }}
      />
      <div className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="mb-2 text-4xl font-bold">Mike Holownych</h1>
        <p className="mb-6 font-medium text-accent">Founder, Nebula Components</p>

        <p className="mb-4 text-lg leading-relaxed text-fg-muted">
          Before founding Nebula Components, I worked with founders running paid traffic whose
          landing pages weren&apos;t converting. The same seven failure patterns kept showing up,
          page after page - message-match gaps, missing trust signals, mobile layout friction, slow
          load times, unclear CTAs, form friction, and compliance gaps. None of them were creative
          problems or targeting problems. They were structural page problems, and they were
          diagnosable.
        </p>
        <p className="mb-8 text-lg leading-relaxed text-fg-muted">
          That observation became the 9-point diagnostic framework every Nebula audit runs today -
          the same framework behind the free audit and the paid One-Leak Repair Sprint.
        </p>

        <div className="mb-8 flex flex-wrap gap-4 text-sm">
          <a
            href="https://www.linkedin.com/in/mikeholownych"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-border px-4 py-2 font-semibold text-fg-muted transition-colors hover:border-accent hover:text-accent"
          >
            LinkedIn ↗
          </a>
          <a
            href="https://github.com/mikeholownych"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-border px-4 py-2 font-semibold text-fg-muted transition-colors hover:border-accent hover:text-accent"
          >
            GitHub ↗
          </a>
        </div>

        <p className="mb-8 text-fg-muted">
          Nebula Components publishes evidence-backed landing-page conversion guidance and runs
          automated audit scoring across the same 9 conversion signals.
        </p>

        <span className="text-accent">mike{'@'}nebulacomponents.shop</span>

        <div className="mt-10">
          <Link href="/about" className="text-sm text-fg-muted hover:text-fg">← About Nebula Components</Link>
        </div>
      </div>
    </main>
  )
}
