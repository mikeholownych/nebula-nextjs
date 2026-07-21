import type { Metadata } from 'next'
import Link from 'next/link'

import { createArticleSchema } from '../../lib/schema'

export const metadata: Metadata = {
  title: 'LinkedIn Skill Engine: Build Authority With Your Own Experience | Nebula Components',
  description: 'How to extract your real professional skills and frameworks into LinkedIn content that builds authority without manufactured noise.',
  alternates: { canonical: 'https://nebulacomponents.shop/learning-centre/linkedin-skill-engine' },
}

const articleSchema = createArticleSchema({
  headline: 'LinkedIn Skill Engine: Build Authority With Your Own Experience',
  description: 'How to extract your real professional skills and frameworks into LinkedIn content that builds authority without manufactured noise.',
  url: 'https://nebulacomponents.shop/learning-centre/linkedin-skill-engine',
  publishedDate: '2025-07-15',
  modifiedDate: '2026-07-19',
})

export default function LinkedInSkillEnginePage() {
  return (
    <main id="main-content" role="main" className="min-h-screen bg-bg pt-[72px]">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />

      <nav aria-label="Breadcrumb" className="mx-auto max-w-4xl px-6 pt-6">
        <ol className="flex items-center gap-2 text-sm text-fg-muted">
          <li><Link href="/" className="hover:text-fg">Home</Link></li>
          <li aria-hidden="true">/</li>
          <li><Link href="/learning-centre" className="hover:text-fg">Learning Centre</Link></li>
          <li aria-hidden="true">/</li>
          <li className="text-fg" aria-current="page">LinkedIn Skill Engine</li>
        </ol>
      </nav>

      <article className="mx-auto max-w-4xl px-6 py-12">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-accent">Content Systems</p>
        <h1 className="text-4xl font-bold tracking-tight text-fg md:text-5xl">
          LinkedIn Skill Engine: Post From What You Actually Know
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-fg-muted">
          Most B2B LinkedIn content fails because it is manufactured: rephrased advice, hollow hooks, ideas borrowed from other creators. The LinkedIn Skill Engine inverts this — it starts from what you have actually done and converts it into posts that read as authority because they are authority.
        </p>

        <section className="mt-12">
          <h2 className="mb-4 text-2xl font-bold text-fg">Why Generic LinkedIn Content Fails</h2>
          <p className="text-fg-muted leading-relaxed">
            Buyers on LinkedIn are trained to ignore content that sounds the same as everything else. The reason most professional content sounds the same is that most creators are starting from a blank page and filling it with what they think they should say. The audience can tell. Specificity is the signal. Specific numbers, specific client situations, specific mistakes — these are what stop the scroll and build the kind of trust that converts at a later date.
          </p>
        </section>

        <section className="mt-10">
          <h2 className="mb-4 text-2xl font-bold text-fg">How the Skill Engine Works</h2>
          <ol className="space-y-4">
            {[
              { step: '1', title: 'Skill inventory', desc: 'Map every repeatable skill you use with clients — not job titles, but actual techniques, frameworks, and diagnostic approaches.' },
              { step: '2', title: 'Evidence extraction', desc: 'For each skill, pull 2–3 real cases where applying it produced a measurable outcome. Outcome + starting condition + fix applied.' },
              { step: '3', title: 'Post templates by intent', desc: 'Each evidence unit gets mapped to a post format: diagnostic post, outcome post, objection post, or how-to post.' },
              { step: '4', title: 'Cadence without depletion', desc: 'One evidence unit generates 4–6 posts. A founder with 10 documented skills has 40–60 posts before needing any new material.' },
            ].map(({ step, title, desc }) => (
              <li key={step} className="flex items-start gap-4 rounded-xl border border-border bg-bg-muted/30 p-4">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-xs font-bold text-bg">{step}</span>
                <div>
                  <p className="font-semibold text-fg">{title}</p>
                  <p className="mt-1 text-sm text-fg-muted">{desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-10">
          <h2 className="mb-4 text-2xl font-bold text-fg">Post Types the Engine Produces</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { type: 'Diagnostic post', example: '"Most founders think X is the problem. It is almost always Y. Here is how to tell the difference."' },
              { type: 'Outcome post', example: '"Client was spending $8k/mo on ads with no leads. We changed one thing. Here is what it was."' },
              { type: 'Objection post', example: '"Common pushback I hear: [objection]. Here is what actually happens when you test it."' },
              { type: 'How-to post', example: '"The 3-step process I use every time a landing page is not converting paid traffic."' },
            ].map(({ type, example }) => (
              <div key={type} className="rounded-xl border border-border bg-bg-muted/30 p-4">
                <p className="font-semibold text-fg">{type}</p>
                <p className="mt-2 text-sm text-fg-muted italic">{example}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="mb-4 text-2xl font-bold text-fg">What This Has to Do With Conversion</h2>
          <p className="text-fg-muted leading-relaxed">
            LinkedIn authority content works as a top-of-funnel trust signal. When someone who has seen your posts finally lands on your landing page, they are already pre-sold on your credibility. This reduces the work the landing page has to do and raises conversion rates on paid traffic. The funnel is: post → trust → audit → purchase. The skill engine feeds the first stage.
          </p>
        </section>

        <section className="mt-16 rounded-xl border border-accent/30 bg-accent/5 p-8 text-center">
          <h2 className="text-2xl font-bold text-fg">Fix the Landing Page First</h2>
          <p className="mt-4 max-w-xl mx-auto text-fg-muted">
            Before optimising your LinkedIn presence, ensure the page your traffic lands on is ready to convert. Run the free audit.
          </p>
          <Link
            href="/audit"
            className="mt-6 inline-block rounded-xl bg-accent px-8 py-4 font-semibold text-bg hover:bg-accent-light transition-colors"
          >
            Run Free Audit →
          </Link>
        </section>

        <div className="mt-8">
          <Link href="/learning-centre" className="text-sm text-fg-muted hover:text-fg">← Learning Centre</Link>
        </div>
      </article>


    </main>
  )
}
