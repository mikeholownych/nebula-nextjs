import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Public Audit Teardowns | Nebula',
  description:
    'Nebula runs its evidence-backed audit on well-known public pages and publishes the raw findings. Not customers - demonstrations of what the engine produces.',
  alternates: {
    canonical: 'https://nebulacomponents.com/teardowns',
  },
}

const TEARDOWNS = [
  {
    slug: 'carrd',
    name: 'Carrd',
    url: 'carrd.co',
    score: 4.2,
    grade: 'D',
    topFinding: 'H1 is <h1 className="heading-1 tracking-tight text-fg md:text-5xl">Discover Conversion Leaks from Real SaaS Landing Page Audits</h1> - the brand name only. Zero value prop. Missing og:title, og:description, and all JSON-LD schema.',
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
    topFinding: 'Meta description is 35 chars. Industry average is 140-155. Google auto-generates the SERP snippet - Kit has ceded their first impression in search entirely.',
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
    topFinding: 'H1: "Launch faster. Convert more." - identical positioning to Leadpages, Instapage, and Swipe Pages. The company that invented the landing page builder has a commodity headline.',
    findingCount: 4,
    auditedAt: 'July 30, 2026',
  },
  {
    slug: 'webflow',
    name: 'Webflow',
    url: 'webflow.com',
    score: 5.8,
    grade: 'C',
    topFinding: 'Two H1 tags simultaneously in the DOM via A/B test. Google indexes both variants - ranking signal is split between two competing headlines.',
    findingCount: 4,
    auditedAt: 'July 30, 2026',
  },
  {
    slug: 'framer',
    name: 'Framer',
    url: 'framer.com',
    score: 5.6,
    grade: 'C',
    topFinding: 'Primary CTA reads "Start without AI" on an AI-first product page. Leads with an opt-out of the core differentiator. H1 missing from static HTML - JS-render dependency.',
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
    topFinding: 'Missing H1 entirely. 1.2MB HTML payload - 10× the heuristic ceiling.',
    findingCount: 5,
    auditedAt: 'July 29, 2026',
  },
  {
    slug: 'postmint',
    name: 'Postmint',
    url: 'postmint.de',
    score: 6.8,
    grade: 'B',
    topFinding: 'Founder published a full launch autopsy (118 visitors, 0 signups) - both self-diagnosed bugs are fixed. One real defect remains: the JSON-LD @context key is a leaked Blade/PHP template literal, not "@context".',
    findingCount: 2,
    auditedAt: 'July 31, 2026',
  },
  {
    slug: 'knallhart',
    name: 'knallhart.dev',
    url: 'knallhart.dev',
    score: 5.8,
    grade: 'C',
    topFinding: 'Zero social-sharing metadata (0 og: tags, 0 twitter: cards) on a product whose founder\'s entire distribution is X posts and forum threads - every shared link renders as a bare URL.',
    findingCount: 3,
    auditedAt: 'July 31, 2026',
  },
  {
    slug: 'hubspot',
    name: 'HubSpot',
    url: 'hubspot.com',
    score: 7.0,
    grade: 'B',
    topFinding: 'H1 and title share zero keywords - and the title ends in "- Homepage" (a template placeholder). The static H1 search engines index ("grow scale close retain grow") differs from the headline human visitors see.',
    findingCount: 5,
    auditedAt: 'August 4, 2026',
  },
  {
    slug: 'mailchimp',
    name: 'Mailchimp',
    url: 'mailchimp.com',
    score: 7.2,
    grade: 'B',
    topFinding: 'Six H1s on one page, each telling a different story about what the product is. Plus a first-visit personalization modal that covers the hero before a new visitor reads a single word.',
    findingCount: 5,
    auditedAt: 'August 4, 2026',
  },
  {
    slug: 'cloudwise',
    name: 'CloudWise',
    url: 'cloudcostwise.io',
    score: 7.1,
    grade: 'B',
    topFinding: 'Founder-reported: approximately $2,700 in ad spend, around 6 trial signups, and 0 paid conversions. Current snapshot: strong page fundamentals, but ad-tracking evidence is not visible in static source.',
    findingCount: 3,
    auditedAt: 'August 3, 2026',
  },
  {
    slug: 'postdew',
    name: 'PostDew',
    url: 'postdew.com',
    score: 4.8,
    grade: 'D',
    topFinding: 'Founder-reported: 0 paying customers, 0 signups from approximately 10 LinkedIn cold DMs, and 0 signups from a flagged Show HN post. Current snapshot: no static H1, CTA, or trust markers.',
    findingCount: 5,
    auditedAt: 'August 3, 2026',
  },
  {
    slug: 'smartwatermark',
    name: 'SmartWatermark',
    url: 'smartwatermark.app',
    score: 7.5,
    grade: 'B',
    topFinding: 'Founder-reported: 84 landing-page visitors, 24 app visitors, 0 sales, and 79% bounce. Current snapshot: strong headline, CTA, SEO, and proof signals; runtime tracking remains unverified.',
    findingCount: 2,
    auditedAt: 'August 3, 2026',
  },
  {
    slug: 'folioverse',
    name: 'Folioverse',
    url: 'www.folioverse.app',
    score: 5.6,
    grade: 'C',
    topFinding: 'Founder-reported: €100 in Google Ads spend, 91 clicks, 0 signups, and 10-second average paid-visitor sessions. Current snapshot: no static H1 or CTA candidate, with ad tracking unverified.',
    findingCount: 5,
    auditedAt: 'August 3, 2026',
  },
  {
    slug: 'asana',
    name: 'Asana',
    url: 'asana.com',
    score: 6.9,
    grade: 'B',
    topFinding: 'Strong above-fold with clear CTA but social proof is generic, no named customer outcomes above the fold.',
    findingCount: 4,
    auditedAt: 'August 2026',
  },
  {
    slug: 'canva',
    name: 'Canva',
    url: 'canva.com',
    score: 5.7,
    grade: 'C',
    topFinding: 'Headline is feature-first, not outcome-first. No conversion tracking artifact found in static HTML.',
    findingCount: 5,
    auditedAt: 'August 2026',
  },
  {
    slug: 'figma',
    name: 'Figma',
    url: 'figma.com',
    score: 7.0,
    grade: 'B',
    topFinding: 'Above-fold is strong but meta description truncates at 160 chars, topic relevance signal is cut off.',
    findingCount: 4,
    auditedAt: 'August 2026',
  },
  {
    slug: 'intercom',
    name: 'Intercom',
    url: 'intercom.com',
    score: 6.9,
    grade: 'B',
    topFinding: 'CTA is action-oriented but positioned below a long feature list, most mobile visitors never reach it.',
    findingCount: 4,
    auditedAt: 'August 2026',
  },
  {
    slug: 'monday',
    name: 'Monday.com',
    url: 'monday.com',
    score: 6.9,
    grade: 'B',
    topFinding: 'Social proof is present but proof markers are vague counts, not specific named outcomes.',
    findingCount: 5,
    auditedAt: 'August 2026',
  },
  {
    slug: 'shopify',
    name: 'Shopify',
    url: 'shopify.com',
    score: 7.1,
    grade: 'B',
    topFinding: 'Strong SEO foundations and load speed but headline is brand-focused, not buyer-outcome focused.',
    findingCount: 4,
    auditedAt: 'August 2026',
  },
  {
    slug: 'slack',
    name: 'Slack',
    url: 'slack.com',
    score: 6.6,
    grade: 'B',
    topFinding: 'Message match is weak on paid traffic, the headline does not reflect typical ad copy promises.',
    findingCount: 5,
    auditedAt: 'August 2026',
  },
  {
    slug: 'squarespace',
    name: 'Squarespace',
    url: 'squarespace.com',
    score: 7.2,
    grade: 'B',
    topFinding: 'Above-fold is clean but no analytics tracking artifact detected, paid traffic attribution is unverified.',
    findingCount: 4,
    auditedAt: 'August 2026',
  },
  {
    slug: 'typeform',
    name: 'Typeform',
    url: 'typeform.com',
    score: 6.2,
    grade: 'C',
    topFinding: 'Headline communicates the product category, not the buyer outcome. No price or effort signal above fold.',
    findingCount: 5,
    auditedAt: 'August 2026',
  },
  {
    slug: 'zapier',
    name: 'Zapier',
    url: 'zapier.com',
    score: 7.4,
    grade: 'B',
    topFinding: 'Strong overall but Open Graph tags incomplete, social sharing previews are degraded.',
    findingCount: 3,
    auditedAt: 'August 2026',
  },
  {
    slug: 'linear',
    name: 'Linear',
    url: 'linear.app',
    score: 7.30,
    grade: 'B',
    topFinding: 'H1 source contains two line-break collapses: "productdevelopmentsystem" and "teamsand" fused into single words, same defect class as Shopify, Asana, and Squarespace. Invisible in the browser, indexed by search engines as garbled text.',
    findingCount: 3,
    auditedAt: 'August 2026',
  },
  {
    slug: 'loom',
    name: 'Loom',
    url: 'loom.com',
    score: 7.20,
    grade: 'B',
    topFinding: 'Title tag, "Free screen recorder for Mac and PC | Loom", positions Loom as a screen recorder while the page pitches team communication and async video. Category mismatch between the SERP promise and the page\'s actual positioning.',
    findingCount: 3,
    auditedAt: 'August 2026',
  },
  {
    slug: 'miro',
    name: 'Miro',
    url: 'miro.com',
    score: 7.30,
    grade: 'B',
    topFinding: 'H1 is "The collaboration layer your AI tools are missing.", a positioning claim framed as absence. "Missing" implies Miro is invisible by default, an unusual negative framing for a primary conversion headline.',
    findingCount: 3,
    auditedAt: 'August 2026',
  },
  {
    slug: 'clickup',
    name: 'ClickUp',
    url: 'clickup.com',
    score: 5.80,
    grade: 'C',
    topFinding: 'H1 is "Software to replace all software.", no product category, no audience signal, no outcome. The claim is so broad it carries zero conversion signal for anyone searching for a specific tool.',
    findingCount: 4,
    auditedAt: 'August 2026',
  },
  {
    slug: 'airtable',
    name: 'Airtable',
    url: 'airtable.com',
    score: 7.20,
    grade: 'B',
    topFinding: 'Title appends "| Airtable" after already opening with "Airtable:", brand name appears twice in 65 characters. Title reads "Airtable: Build Enterprise-ready AI Workflows, Apps & Agents | Airtable". 65 chars also truncates in most SERPs at ~60.',
    findingCount: 3,
    auditedAt: 'August 2026',
  },
  {
    slug: 'pipedrive',
    name: 'Pipedrive',
    url: 'pipedrive.com',
    score: 7.40,
    grade: 'B',
    topFinding: 'One of the cleaner above-folds in this batch: H1, proof claim ("Trusted by over 100,000 companies"), CTA, and friction-removal copy all in the hero. Primary weakness: email capture field in the hero duplicates the button CTA with no visual hierarchy differentiation.',
    findingCount: 3,
    auditedAt: 'August 2026',
  },
  {
    slug: 'mixpanel',
    name: 'Mixpanel',
    url: 'mixpanel.com',
    score: 6.40,
    grade: 'C',
    topFinding: 'H1 is "Build faster, with direction", no product category, no audience named. Above-fold also carries the tagline "Mixpanel is for teams that move. Make your move.", a second vague statement that also fails to name what the product does.',
    findingCount: 4,
    auditedAt: 'August 2026',
  },
  {
    slug: 'amplitude',
    name: 'Amplitude',
    url: 'amplitude.com',
    score: 6.20,
    grade: 'C',
    topFinding: 'Title is "Amplitude | A new era for product teams", 38 characters, generic "new era" framing, no product category keyword. The hero opens with a 17-logo trust strip before the value proposition, asking cold visitors to anchor to customer names before understanding the product.',
    findingCount: 4,
    auditedAt: 'August 2026',
  },
  {
    slug: 'drift',
    name: 'Drift',
    url: 'drift.com',
    score: 5.40,
    grade: 'C',
    topFinding: 'drift.com now serves a Salesloft/1mind product page with the notice: "We\'ve transitioned from Drift to 1mind." Visitors searching for "Drift" land on a different product\'s pitch with no redirect explanation or legacy-brand acknowledgment above the fold.',
    findingCount: 4,
    auditedAt: 'August 2026',
  },
]

export default function TeardownsPage() {
  return (
    <main id="main-content" className="min-h-screen bg-bg pt-24">
      <section className="mx-auto max-w-4xl px-6 py-16">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.2em] text-accent">
          Public Audit Teardowns
        </p>
        <h1 className="heading-1 tracking-tight text-fg md:text-5xl">Discover Conversion Leaks from Real SaaS Landing Page Audits</h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-fg-muted">
          These companies are not Nebula customers. We run the same 9-signal engine on public pages
          and publish the raw findings - not to criticize anyone, but to show exactly what the audit
          produces on pages you can verify yourself.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <Link
            href="/audit?utm_source=teardowns-hero&utm_medium=hero-cta"
            className="inline-flex min-h-[44px] items-center justify-center rounded bg-accent px-6 py-3 text-sm font-semibold text-bg transition-opacity hover:opacity-85"
          >
            Get your free landing page audit →
          </Link>
          <Link
            href="/repair-sprint"
            className="inline-flex min-h-[44px] items-center justify-center rounded border border-border px-5 py-3 text-sm font-medium text-fg-muted transition-colors hover:border-fg-muted hover:text-fg"
          >
            Explore $97 Repair Sprint
          </Link>
        </div>
      </section>

      <section className="border-t border-border px-6 py-12">
        <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2">
          {TEARDOWNS.map((t) => {
            const scoreColor =
              t.score >= 7 ? 'text-green-400' : t.score >= 5 ? 'text-amber-400' : 'text-red-400'
            return (
              <article
                key={t.slug}
                className="rounded-md border border-border bg-bg-panel p-6"
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
                    className="text-sm font-semibold text-accent hover:text-fg"
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
          className="mt-8 inline-block rounded bg-accent px-8 py-4 font-semibold text-bg hover:opacity-85 hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-bg transition-colors"
        >
          Find the Leak →
        </Link>
      </section>
    </main>
  )
}
