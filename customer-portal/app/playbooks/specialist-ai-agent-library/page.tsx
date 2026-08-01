import type { Metadata } from 'next'
import Link from 'next/link'

import { createArticleSchema } from '../../lib/schema'

export const metadata: Metadata = {
  title: 'Specialist AI Agent Library: Deploy Purpose-Built Agents for Growth | Nebula Components',
  description: 'How to build and deploy a library of specialist AI agents that handle defined tasks in your growth and operations stack.',
  alternates: { canonical: 'https://nebulacomponents.shop/playbooks/specialist-ai-agent-library' },
}

const articleSchema = createArticleSchema({
  headline: 'Specialist AI Agent Library: Deploy Purpose-Built Agents for Growth',
  description: 'How to build and deploy a library of specialist AI agents that handle defined tasks in your growth and operations stack.',
  url: 'https://nebulacomponents.shop/playbooks/specialist-ai-agent-library',
  publishedDate: '2025-07-15',
  modifiedDate: '2026-07-19',
})

const DOMAIN_MAP = [
  {
    eyebrow: 'Research',
    title: 'Signal Detector → Competitor Scout → Market Mapper',
    description: 'Feeds lead scoring and positioning.',
  },
  {
    eyebrow: 'LeadGen',
    title: 'Prospect Finder → Account Scorer → Outreach Sequencer',
    description: 'Turns social/buying signals into ranked pipeline.',
  },
  {
    eyebrow: 'Sales',
    title: 'Follow-Up Drafter → Objection Handler → Pipeline Reviewer',
    description: 'Moves warm leads without generic follow-up.',
  },
  {
    eyebrow: 'Marketing',
    title: 'Campaign Builder → Ad Copywriter → Funnel Analyst',
    description: 'Turns proof and audits into campaigns.',
  },
  {
    eyebrow: 'Content',
    title: 'SEO Writer → Repurposer → Editorial Editor',
    description: 'Turns operator knowledge into distribution assets.',
  },
  {
    eyebrow: 'Support',
    title: 'Reply Triager → Response Drafter → Escalation Handler',
    description: 'Protects speed and quality on inbound replies.',
  },
  {
    eyebrow: 'Operations',
    title: 'SOP Builder → Status Reporter → Risk Analyst',
    description: 'Keeps handoffs, health checks, and delivery reliable.',
  },
]

const AGENT_CARD_ELEMENTS = [
  { label: 'Role', description: 'One named function. No generalist scope.' },
  { label: 'Mission', description: "One sentence defining the output this agent owns." },
  { label: 'Trigger', description: 'The event that activates the agent.' },
  { label: 'Tools', description: 'The exact systems/data sources the agent can use.' },
  { label: 'Prompt library', description: "Reusable prompts for the agent's core tasks." },
  { label: 'Workflow logic', description: 'Upstream inputs and downstream handoff target.' },
  { label: 'Review gate', description: 'Human approval, score, or quality check before shipping.' },
]

const ANTI_PATTERNS = [
  'one generalist AI for every task',
  'prompt library not stored',
  'missing trigger condition',
  'output with no handoff',
  'automation without review',
  'no performance tracking',
]

export default function SpecialistAiAgentLibraryPage() {
  return (
    <main id="main-content" className="min-h-screen bg-bg pt-24">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />

      <nav aria-label="Breadcrumb" className="mx-auto max-w-3xl px-6 pt-6">
        <ol className="flex items-center gap-2 text-sm text-fg-muted">
          <li><Link href="/" className="hover:text-fg">Home</Link></li>
          <li aria-hidden="true">/</li>
          <li><Link href="/playbooks" className="hover:text-fg">Playbooks</Link></li>
          <li aria-hidden="true">/</li>
          <li className="text-fg" aria-current="page">Specialist AI Agent Library</li>
        </ol>
      </nav>

      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="rounded-2xl border border-border bg-bg-panel p-8 md:p-10">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-accent">
            Founder Systems · extracted from NipPro AI
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-fg md:text-5xl">
            Specialist AI Agent Library
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-fg-muted">
            Stop asking one AI to do 50 jobs. Deploy focused specialists with role, trigger, prompt, handoff, and review gates.
          </p>
        </div>

        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">The stolen pattern</h2>
          <p className="leading-relaxed text-fg-muted">
            <strong className="text-fg">One specialist per role.</strong> Each agent gets a narrow mission, a trigger, a tool boundary, reusable prompts, handoff logic, and review gate. No one-agent-does-everything sludge.
          </p>
        </section>

        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">7-element agent card</h2>
          <ul className="space-y-2 text-fg-muted">
            {AGENT_CARD_ELEMENTS.map((item) => (
              <li key={item.label} className="flex items-start gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                <span>
                  <strong className="text-fg">{item.label}:</strong> {item.description}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <h2 className="mb-4 mt-10 text-2xl font-bold text-fg">Nebula domain map</h2>
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DOMAIN_MAP.map((item) => (
            <article key={item.eyebrow} className="rounded-2xl border border-border bg-bg-panel p-6">
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.1em] text-accent">{item.eyebrow}</p>
              <h3 className="mb-2 text-lg font-semibold text-fg">{item.title}</h3>
              <p className="text-sm leading-relaxed text-fg-muted">{item.description}</p>
            </article>
          ))}
        </section>

        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">Anti-patterns to avoid</h2>
          <ul className="space-y-2 text-fg-muted">
            {ANTI_PATTERNS.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                {item}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-6 rounded-2xl border border-border bg-bg-panel p-6">
          <h2 className="mb-3 text-lg font-semibold text-fg">Related playbooks</h2>
          <ul className="space-y-2 text-sm">
            <li><Link href="/playbooks/founder-second-brain" className="text-accent hover:underline">Founder Second Brain: Capture and Reuse Your Best Thinking</Link></li>
            <li><Link href="/playbooks/linkedin-skill-engine" className="text-accent hover:underline">LinkedIn Skill Engine: Build Authority With Your Own Experience</Link></li>
          </ul>
        </section>

        <section className="mt-6 rounded-2xl border border-accent/40 bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">Want this installed instead of documented?</h2>
            <p className="mb-6 leading-relaxed text-fg-muted">
              The free Nebula audit identifies likely page-side leaks. The $97 One-Leak Repair Sprint
              selects one high-confidence page-level repair, confirms the scope with you, implements it,
              and verifies the live change. It does not promise conversion lift.
            </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/audit" className="inline-flex rounded-xl bg-accent px-6 py-3 font-semibold text-bg hover:bg-accent-light transition-colors">
              Run the free audit
            </Link>
            <Link href="/checkout" className="inline-flex rounded-xl border border-accent px-6 py-3 font-semibold text-accent hover:bg-accent-dim transition-colors">
              Review the $97 One-Leak Repair Sprint
            </Link>
          </div>
        </section>

        <div className="mt-8">
          <Link href="/playbooks" className="text-sm text-fg-muted hover:text-fg">← Playbooks</Link>
        </div>
      </div>
    </main>
  )
}
