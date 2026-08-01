import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Public Audit Teardowns | Nebula',
  description:
    'Nebula runs its 9-signal audit on well-known public pages and publishes the raw findings. Not customers — demonstrations of what the engine produces.',
  alternates: {
    canonical: 'https://nebulacomponents.shop/teardowns',
  },
}

const TEARDOWNS = [
  {
    slug: 'carrd',
    name: 'Carrd',
    url: 'carrd.co',
    score: 4.2,
    grade: 'D',
    topFinding: 'H1 is <h1>Carrd</h1> — the brand name only. Zero value prop. Missing og:title, og:description, and all JSON-LD schema.',
    findingCount: 5,
    auditedAt: 'July 30, 2026',
  },
  {
    slug: 'hotjar',
    name: 'Hotjar',
    url: 'hotjar.com',
    score: 4.5,
    grade: 'D',
    topFinding: 'H1 announces an acquisition: "Hotjar has evolved into something more powerful." First-time visitors must decode what Hotjar does before seeing why to convert.',
    findingCount: 4,
    auditedAt: 'July 30, 2026',
  },
  {
    slug: 'kit',
    name: 'Kit',
    url: 'kit.com',
    score: 4.8,
    grade: 'D',
    topFinding: 'Meta description is 35 chars. Industry average is 140-155. Google auto-generates the SERP snippet — Kit has ceded their first impression in search entirely.',
    findingCount: 4,
    auditedAt: 'July 30, 2026',
  },
  {
    slug: 'beehiiv',
    name: 'Beehiiv',
    url: 'beehiiv.com',
    score: 5.1,
    grade: 'C',
    topFinding: '4 competing CTAs above fold before the hero. H1 is a product list with no verb, no outcome. 262KB homepage HTML with canonical mismatch.',
    findingCount: 5,
    auditedAt: 'July 30, 2026',
  },
  {
    slug: 'unbounce',
    name: 'Unbounce',
    url: 'unbounce.com',
    score: 5.2,
    grade: 'C',
    topFinding: 'H1: "Launch faster. Convert more." — identical positioning to Leadpages, Instapage, and Swipe Pages. The company that invented the landing page builder has a commodity headline.',
    findingCount: 4,
    auditedAt: 'July 30, 2026',
  },
  {
    slug: 'webflow',
    name: 'Webflow',
    url: 'webflow.com',
    score: 5.8,
    grade: 'C',
    topFinding: 'Two H1 tags simultaneously in the DOM via A/B test. Google indexes both variants — ranking signal is split between two competing headlines.',
    findingCount: 4,
    auditedAt: 'July 30, 2026',
  },
  {
    slug: 'framer',
    name: 'Framer',
    url: 'framer.com',
    score: 5.6,
    grade: 'C',
    topFinding: 'Primary CTA reads "Start without AI" on an AI-first product page. Leads with an opt-out of the core differentiator. H1 missing from static HTML — JS-render dependency.',
    findingCount: 4,
    auditedAt: 'July 30, 2026',
  },
  {
    slug: 'basecamp',
    name: 'Basecamp',
    url: 'basecamp.com',
    score: 5.4,
    grade: 'C',
    topFinding: '<title> is 8 chars. Meta desc truncates at 155. No named proof above fold.',
    findingCount: 5,
    auditedAt: 'July 29, 2026',
  },
  {
    slug: 'notion',
    name: 'Notion',
    url: 'notion.so',
    score: 6.1,
    grade: 'C',
    topFinding: '417KB HTML payload (3.4× heuristic max). H1/title keyword misalignment.',
    findingCount: 4,
    auditedAt: 'July 29, 2026',
  },
  {
    slug: 'calendly',
    name: 'Calendly',
    url: 'calendly.com',
    score: 5.8,
    grade: 'C',
    topFinding: 'Missing H1 entirely. 1.2MB HTML payload — 10× the heuristic ceiling.',
    findingCount: 5,
    auditedAt: 'July 29, 2026',
  },
  {
    slug: 'postmint',
    name: 'Postmint',
    url: 'postmint.de',
    score: 6.8,
    grade: 'B',
    topFinding: 'Founder published a full launch autopsy (118 visitors, 0 signups) — both self-diagnosed bugs are fixed. One real defect remains: the JSON-LD @context key is a leaked Blade/PHP template literal, not "@context".',
    findingCount: 2,
    auditedAt: 'July 31, 2026',
  },
  {
    slug: 'knallhart',
    name: 'knallhart.dev',
    url: 'knallhart.dev',
    score: 5.8,
    grade: 'C',
    topFinding: 'Zero social-sharing metadata (0 og: tags, 0 twitter: cards) on a product whose founder\'s entire distribution is X posts and forum threads — every shared link renders as a bare URL.',
    findingCount: 3,
    auditedAt: 'July 31, 2026',
  },
]

export default function TeardownsPage() {
  return (
    <main id="main-content" className="min-h-screen bg-bg pt-24">
      <section className="mx-auto max-w-4xl px-6 py-16">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-accent">
          Public Audit Teardowns
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-fg md:text-5xl">
          Real audits on well-known pages
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-fg-muted">
          These companies are not Nebula customers. We run the same 9-signal engine on public pages
          and publish the raw findings — not to criticize anyone, but to show exactly what the audit
          produces on pages you can verify yourself.
        </p>
      </section>

      <section className="border-t border-border px-6 py-12">
        <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
          {TEARDOWNS.map((t) => {
            const scoreColor =
              t.score >= 7 ? 'text-green-400' : t.score >= 5 ? 'text-amber-400' : 'text-red-400'
            return (
              <article
                key={t.slug}
                className="rounded-2xl border border-border bg-bg-panel p-6"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-widest text-fg-muted">
                      {t.url}
                    </p>
                    <h2 className="mt-1 text-2xl font-bold text-fg">{t.name}</h2>
                  </div>
                  <div className="text-right">
                    <p className={`text-3xl font-bold ${scoreColor}`}>
                      {t.score}
                      <span className="text-lg text-fg-muted">/10</span>
                    </p>
                    <p className={`text-sm font-semibold ${scoreColor}`}>Grade {t.grade}</p>
                  </div>
                </div>

                <p className="mt-4 text-sm text-fg-muted">{t.findingCount} findings</p>
                <p className="mt-2 text-sm text-fg-muted leading-relaxed">{t.topFinding}</p>

                <div className="mt-5 flex items-center justify-between">
                  <p className="text-xs text-fg-muted">Audited {t.auditedAt}</p>
                  <Link
                    href={`/teardowns/${t.slug}`}
                    className="text-sm font-semibold text-accent hover:text-accent-light"
                  >
                    Read teardown →
                  </Link>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-16 text-center">
        <h2 className="text-2xl font-bold text-fg">See what it finds on your page</h2>
        <p className="mt-4 text-fg-muted">Free, no signup. Same engine as every teardown above.</p>
        <Link
          href="/audit?from=%2Fteardowns"
          className="mt-8 inline-block rounded-xl bg-accent px-8 py-4 font-semibold text-bg hover:bg-accent-light focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg transition-colors"
        >
          Find the Leak →
        </Link>
      </section>
    </main>
  )
}
