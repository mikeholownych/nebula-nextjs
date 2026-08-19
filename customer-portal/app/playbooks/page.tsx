import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Playbooks - Founder Systems | Nebula Components',
  description: 'Founder-productivity and AI-ops systems from Nebula Components - separate from the Learning Centre, which covers landing page conversion diagnosis.',
  alternates: { canonical: 'https://nebulacomponents.com/playbooks' },
}

const PLAYBOOKS = [
  {
    slug: 'founder-second-brain',
    title: 'Founder Second Brain',
    description: 'Capture and reuse your best thinking - a system for turning founder expertise into compounding content and decision frameworks.',
  },
  {
    slug: 'linkedin-skill-engine',
    title: 'LinkedIn Skill Engine',
    description: 'Build authority with your own experience - convert real skills into LinkedIn content that reads as authority because it is.',
  },
  {
    slug: 'specialist-ai-agent-library',
    title: 'Specialist AI Agent Library',
    description: 'Deploy purpose-built agents for growth - one specialist per role instead of one generalist AI for every task.',
  },
]

export default function PlaybooksIndex() {
  return (
    <main id="main-content" className="min-h-screen bg-bg pt-24">
      <section className="border-b border-border px-6 py-16">
        <div className="mx-auto max-w-4xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-accent">
            Nebula Playbooks
          </p>
          <h1 className="heading-1 tracking-tight text-fg md:text-5xl">
            Founder systems, not conversion diagnosis
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-fg-muted">
            These playbooks cover founder productivity and AI-ops systems - a separate track from
            the <Link href="/learning-centre" className="text-accent hover:underline">Learning Centre</Link>,
            which diagnoses landing page conversion leaks.
          </p>
        </div>
      </section>

      <section className="px-6 py-14">
        <div className="mx-auto grid max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PLAYBOOKS.map((p) => (
            <Link
              key={p.slug}
              href={`/playbooks/${p.slug}`}
              className="flex flex-col gap-2 rounded-xl border border-border bg-bg-panel p-5 transition-colors hover:border-accent/40"
            >
              <h2 className="text-sm font-bold leading-snug text-fg">{p.title}</h2>
              <p className="mt-auto text-xs leading-relaxed text-fg-muted">{p.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  )
}
