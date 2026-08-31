import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Check, X } from 'lucide-react'
import HeroSection from './components/HeroSection'
import MobileStickyAuditCTA from './components/MobileStickyAuditCTA'
import { TEARDOWNS } from './teardowns/[slug]/data'
import { HOMEPAGE_DESCRIPTION, HOMEPAGE_SEO_TITLE } from './lib/homepageContent'
import { SignalIcon } from '@/components/SignalIcons'
import { homeFAQSchema } from './lib/faq-schemas'
import { NebulaMark } from '@/components/NebulaMark'

const webPageSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  '@id': 'https://nebulacomponents.com/#webpage',
  url: 'https://nebulacomponents.com/',
  name: 'Nebula Components: Free Landing Page Audit',
  isPartOf: { '@id': 'https://nebulacomponents.com/#website' },
  about: { '@id': 'https://nebulacomponents.com/#organization' },
  description: 'Free landing page audit that scores 9 conversion signals in under 2 minutes. Built for founders spending on ads who are not seeing conversions.',
  breadcrumb: {
    '@type': 'BreadcrumbList',
    itemListElement: [{ '@type': 'ListItem', position: 1, name: 'Home', item: 'https://nebulacomponents.com/' }],
  },
}

export const metadata: Metadata = {
  title: HOMEPAGE_SEO_TITLE,
  description: HOMEPAGE_DESCRIPTION,
  alternates: { canonical: 'https://nebulacomponents.com/' },
  openGraph: {
    title: HOMEPAGE_SEO_TITLE,
    description: HOMEPAGE_DESCRIPTION,
    url: 'https://nebulacomponents.com',
    siteName: 'Nebula Components',
    locale: 'en_US',
    type: 'website',
  },
}

const SIGNALS = [
  { key: 'message_match', number: '01', label: 'Message match', job: 'Does the page keep the promise your ad made?', pass: 'Ad promise and page headline name the same outcome', sample: 'FAIL' },
  { key: 'cta', number: '02', label: 'CTA clarity', job: 'Is there one obvious next action?', pass: 'Primary CTA uses action and outcome copy', sample: 'PASS' },
  { key: 'above_fold', number: '03', label: 'Above-fold clarity', job: 'Can a stranger understand the offer before scrolling?', pass: 'Headline, CTA, and proof appear in the first viewport', sample: 'FAIL' },
  { key: 'social_proof', number: '04', label: 'Trust signals', job: 'Does proof appear where the decision happens?', pass: 'Named proof sits near the primary CTA', sample: 'FAIL' },
  { key: 'load_time', number: '05', label: 'Load speed', job: 'Does the page arrive before attention disappears?', pass: 'Core Web Vitals meet the published thresholds', sample: 'PASS' },
  { key: 'mobile', number: '06', label: 'Mobile viewport', job: 'Can paid mobile traffic act without hunting?', pass: 'Primary CTA is visible and usable at 375px', sample: 'PASS' },
  { key: 'ad_signals', number: '07', label: 'Ad tracking', job: 'Can the page record what happens after the click?', pass: 'Recognized measurement artifacts are present', sample: 'PASS' },
  { key: 'seo_foundations', number: '08', label: 'SEO foundations', job: 'Can search engines read the page hierarchy?', pass: 'Title, description, and one descriptive H1 are present', sample: 'PASS' },
  { key: 'ai_readiness', number: '09', label: 'AI readiness', job: 'Can answer engines identify and cite the offer?', pass: 'Structured data, social metadata, and clean hierarchy are present', sample: 'PASS' },
] as const

const BENCHMARKS = [
  {
    stat: '62%',
    label: 'Headline mismatch',
    detail: 'The page says something different from the ad. The visitor has to reconstruct the promise before deciding.',
  },
  {
    stat: '39%',
    label: 'No proof near the CTA',
    detail: 'The page asks for trust before it earns it. Proof hidden in a footer arrives after the decision.',
  },
  {
    stat: '40%',
    label: 'Mobile CTA buried',
    detail: 'Paid traffic lands on a small screen. If the action is not visible, the next thumb movement is often back.',
  },
]

const FAQ_ITEMS = [
  {
    q: 'How long does the free landing page audit take?',
    a: 'Under 2 minutes. Paste your URL and get a scored 9-signal diagnosis with findings ranked by priority.',
  },
  {
    q: "What's included in the $97 One-Leak Repair Sprint?",
    a: 'One landing page and one high-confidence audit finding. Nebula sends a tailored repair sprint after successful payment: exact copy, a code snippet, or a configuration change. No site access is required. You implement it yourself or hand it to your developer. Includes one same-scope re-audit within 30 days.',
  },
  {
    q: 'Why do landing pages fail to convert paid traffic?',
    a: 'Most landing page failures follow diagnosable patterns: the ad promise does not match the page headline, no social proof appears above the fold, the CTA is hidden on mobile, the page loads too slowly, the primary action competes with secondary links, or the page lacks signals for AI and search discoverability.',
  },
  {
    q: 'Do you need access to my website to run the audit?',
    a: 'No. We audit the public page. Just paste your URL. No login, dashboard access, or code repository is needed for the free audit.',
  },
]

const TEARDOWN_PROOFS = ['knallhart', 'postmint', 'basecamp']

export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(homeFAQSchema) }} />

      <main id="main-content" className="min-h-screen bg-bg">
        <HeroSection />
        <MobileStickyAuditCTA />

        <section className="border-b border-border bg-[#0b0c0b] px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
          <div className="mx-auto max-w-[1296px]">
            <div className="grid gap-8 lg:grid-cols-[0.7fr_1.3fr] lg:items-end">
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.14em] text-accent">The recurring failures</p>
                <h2 className="mt-5 max-w-xl text-[clamp(2.7rem,5vw,5.7rem)] font-extrabold leading-[0.93] tracking-[-0.055em] text-fg">
                  Different pages.<br />Same leaks.
                </h2>
              </div>
              <p className="max-w-2xl text-lg leading-8 text-fg-muted lg:justify-self-end lg:text-xl lg:leading-9">
                The pattern is not subtle. Across 293 completed audits, three failures keep appearing between the paid click and the first decision.
              </p>
            </div>

            <div className="mt-14 border-t border-border-strong">
              {BENCHMARKS.map((item, index) => (
                <div key={item.stat} className="grid gap-4 border-b border-border py-7 sm:grid-cols-[140px_230px_1fr] sm:items-baseline lg:py-9">
                  <span className="font-mono text-5xl font-bold tracking-[-0.05em] text-accent sm:text-6xl">{item.stat}</span>
                  <h3 className="text-xl font-bold text-fg">{item.label}</h3>
                  <p className="max-w-2xl text-base leading-7 text-fg-muted">{item.detail}</p>
                  <span className="sr-only">Benchmark {index + 1}</span>
                </div>
              ))}
            </div>
            <p className="mt-5 font-mono text-[11px] text-fg-dim">
              Source: 293 completed Nebula audits, Q3 2026.{' '}
              <Link href="/research/landing-page-performance-q3-2026" className="underline underline-offset-4 hover:text-fg">
                Read the methodology
              </Link>
            </p>
          </div>
        </section>

        <section className="border-b border-border px-5 py-20 sm:px-8 lg:px-12 lg:py-32">
          <div className="mx-auto grid max-w-[1296px] gap-12 lg:grid-cols-[0.78fr_1.22fr] lg:gap-24">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <p className="font-mono text-xs uppercase tracking-[0.14em] text-accent">The deliverable</p>
              <h2 className="mt-5 text-[clamp(2.7rem,4.8vw,5.2rem)] font-extrabold leading-[0.94] tracking-[-0.05em] text-fg">
                Not advice.<br />A case file.
              </h2>
              <p className="mt-7 max-w-lg text-lg leading-8 text-fg-muted">
                Every check ends in a pass or fail. Every failure carries the page value Nebula observed, the rule it tested, and the repair to make next.
              </p>
            </div>

            <div className="border border-border-strong bg-[#0b0c0b]">
              <div className="flex items-center justify-between border-b border-border px-5 py-4 font-mono text-[10px] uppercase tracking-[0.12em] text-fg-muted">
                <span>Sample output</span>
                <span>Not a live result</span>
              </div>
              <div className="divide-y divide-border">
                {SIGNALS.map((signal) => (
                  <div key={signal.key} className="grid grid-cols-[34px_1fr_auto] items-center gap-4 px-5 py-4 sm:grid-cols-[50px_1fr_130px] sm:px-7">
                    <span className="font-mono text-xs text-fg-dim">{signal.number}</span>
                    <span className="text-sm font-semibold text-fg sm:text-base">{signal.label}</span>
                    <span className={`font-mono text-xs font-bold ${signal.sample === 'FAIL' ? 'text-signal-fail' : 'text-accent'}`}>
                      {signal.sample}
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t border-border bg-bg-panel px-5 py-5 sm:px-7">
                <p className="font-mono text-xs text-fg-muted">3 failed conditions. Highest priority: message match.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-border bg-[#0b0c0b] px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
          <div className="mx-auto max-w-[1296px]">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <h2 className="max-w-3xl text-[clamp(2.7rem,5vw,5.7rem)] font-extrabold leading-[0.93] tracking-[-0.055em] text-fg">
                Nine ways a page loses the click.
              </h2>
              <p className="max-w-sm text-base leading-7 text-fg-muted">
                Each signal has a published pass standard. Your page meets it, or it does not.
              </p>
            </div>

            <div className="mt-14 grid border-l border-t border-border sm:grid-cols-2 lg:grid-cols-3">
              {SIGNALS.map((signal) => (
                <div key={signal.key} className="group min-h-[280px] border-b border-r border-border p-6 transition-colors hover:bg-bg-panel sm:p-8">
                  <div className="flex items-center justify-between">
                    <SignalIcon signalKey={signal.key} className="h-6 w-6 text-accent" />
                    <span className="font-mono text-xs text-fg-dim">{signal.number} / 09</span>
                  </div>
                  <h3 className="mt-10 text-xl font-bold text-fg">{signal.label}</h3>
                  <p className="mt-3 text-base leading-7 text-fg-muted">{signal.job}</p>
                  <p className="mt-8 border-t border-border pt-4 font-mono text-[11px] leading-5 text-fg-dim">
                    Pass: {signal.pass}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-border bg-accent px-5 py-8 text-bg sm:px-8 lg:px-12">
          <div className="mx-auto flex max-w-[1296px] flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <NebulaMark size={28} className="mt-1 text-bg" neutralColor="rgba(8,9,9,0.35)" />
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight">Inspect the engine, not our marketing.</h2>
                <p className="mt-1 max-w-2xl text-sm font-medium text-bg/75">
                  Citable is the open-source verification layer behind 123 deterministic checks across 18 namespaces.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <code className="border border-bg/25 bg-bg/10 px-4 py-3 text-xs">npm install -g @nebulacomponents/citable</code>
              <Link href="/resources/citable" className="inline-flex min-h-11 items-center justify-center gap-2 rounded border border-bg bg-bg px-5 text-sm font-bold text-accent">
                View the source <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        <section className="border-b border-border px-5 py-20 sm:px-8 lg:px-12 lg:py-32">
          <div className="mx-auto max-w-[1296px]">
            <div className="grid gap-8 lg:grid-cols-[1fr_0.65fr] lg:items-end">
              <h2 className="max-w-4xl text-[clamp(2.7rem,5vw,5.7rem)] font-extrabold leading-[0.93] tracking-[-0.055em] text-fg">
                Named pages. Named failures. Real evidence.
              </h2>
              <p className="text-base leading-7 text-fg-muted lg:text-lg lg:leading-8">
                Public pages. Public HTML. The same engine and evidence standard your page receives.
              </p>
            </div>

            <div className="mt-14 border-t border-border-strong">
              {TEARDOWN_PROOFS.map((slug, index) => {
                const teardown = TEARDOWNS[slug]
                if (!teardown) return null
                const finding = teardown.findings[0]

                return (
                  <Link
                    key={slug}
                    href={`/teardowns/${slug}`}
                    className="group grid gap-6 border-b border-border py-8 transition-colors hover:bg-bg-panel/40 sm:px-4 lg:grid-cols-[70px_180px_1fr_auto] lg:items-center lg:py-10"
                  >
                    <span className="font-mono text-xs text-fg-dim">0{index + 1}</span>
                    <div>
                      <p className="text-xl font-bold text-fg">{teardown.domain}</p>
                      <p className="mt-1 font-mono text-xs text-signal-fail">{teardown.findings.length} documented findings</p>
                    </div>
                    <div className="max-w-2xl">
                      <p className="font-semibold text-fg">{finding?.label}</p>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-fg-muted">{finding?.evidence}</p>
                    </div>
                    <span className="inline-flex items-center gap-2 text-sm font-bold text-accent">
                      Open case <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>

        <section className="border-b border-border bg-[#0b0c0b] px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
          <div className="mx-auto grid max-w-[1296px] gap-12 lg:grid-cols-[1fr_0.9fr] lg:items-start lg:gap-24">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.14em] text-accent">After the audit</p>
              <h2 className="mt-5 text-[clamp(2.7rem,5vw,5.7rem)] font-extrabold leading-[0.93] tracking-[-0.055em] text-fg">
                One leak.<br />One repair.<br />Then prove it changed.
              </h2>
              <p className="mt-8 max-w-xl text-lg leading-8 text-fg-muted">
                The $97 One-Leak Repair Sprint turns the highest-priority finding into exact copy, code, or configuration. You implement it. We run the same check again within 30 days.
              </p>
            </div>

            <div className="border border-accent/40 bg-accent/[0.04] p-7 sm:p-9">
              <div className="flex items-end justify-between border-b border-border pb-7">
                <div>
                  <p className="font-mono text-xs uppercase tracking-[0.12em] text-fg-muted">Fixed scope</p>
                  <p className="mt-3 text-5xl font-extrabold tracking-[-0.05em] text-fg">$97</p>
                </div>
                <span className="font-mono text-xs text-accent">One time</span>
              </div>
              <ul className="divide-y divide-border">
                {[
                  'One page and one high-confidence finding',
                  'Exact replacement text, snippet, or configuration',
                  'Prepared within 48 hours of payment',
                  'One same-scope re-audit within 30 days',
                  'No CMS, hosting, or repository access needed',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 py-4 text-sm text-fg-muted">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <Link href="/repair-sprint?utm_source=homepage&utm_medium=internal" className="mt-7 flex min-h-14 items-center justify-between rounded bg-accent px-5 font-bold text-bg hover:opacity-90">
                See the repair contract <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        <section className="border-b border-border px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
          <div className="mx-auto max-w-[1296px]">
            <h2 className="max-w-4xl text-[clamp(2.7rem,5vw,5.7rem)] font-extrabold leading-[0.93] tracking-[-0.055em] text-fg">
              What the audit can prove.<br />What it cannot.
            </h2>

            <div className="mt-14 grid border border-border-strong lg:grid-cols-2">
              <div className="p-7 sm:p-10 lg:border-r lg:border-border">
                <p className="font-mono text-xs uppercase tracking-[0.14em] text-accent">Observable</p>
                <ul className="mt-8 space-y-5">
                  {[
                    'The promise written in your headline',
                    'The primary action visible in the first viewport',
                    'The proof placed near that action',
                    'Mobile usability and published performance thresholds',
                    'Tracking, search, and machine-readable page signals',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-4 text-base text-fg-muted">
                      <Check className="mt-1 h-4 w-4 shrink-0 text-accent" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="border-t border-border p-7 sm:p-10 lg:border-t-0">
                <p className="font-mono text-xs uppercase tracking-[0.14em] text-fg-muted">Not claimed</p>
                <ul className="mt-8 space-y-5">
                  {[
                    'A promised conversion lift or revenue result',
                    'The quality of your traffic or strength of your offer',
                    'What happens after the form or checkout',
                    'Statistical proof without controlled traffic and time',
                    'A sales call disguised as a free audit',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-4 text-base text-fg-muted">
                      <X className="mt-1 h-4 w-4 shrink-0 text-signal-fail" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <p className="mt-7 max-w-3xl text-sm leading-7 text-fg-muted">
              We run this audit on ourselves first. When we have a real client outcome with dates, proof, and a way for you to verify it, it will appear here. Until then, the evidence stops where observation stops.
            </p>
          </div>
        </section>

        <section aria-labelledby="direct-answers" className="border-b border-border bg-[#0b0c0b] px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
          <div className="mx-auto grid max-w-[1296px] gap-12 lg:grid-cols-[0.65fr_1.35fr] lg:gap-24">
            <h2 id="direct-answers" className="text-[clamp(2.7rem,4vw,4.8rem)] font-extrabold leading-[0.94] tracking-[-0.05em] text-fg">
              Direct answers.<br />No sales fog.
            </h2>
            <div className="border-t border-border-strong">
              {FAQ_ITEMS.map((item, index) => (
                <div key={item.q} className="grid gap-4 border-b border-border py-7 sm:grid-cols-[36px_1fr]">
                  <span className="font-mono text-xs text-accent">0{index + 1}</span>
                  <div>
                    <h3 className="text-xl font-bold text-fg">{item.q}</h3>
                    <p className="mt-3 max-w-2xl text-base leading-7 text-fg-muted">{item.a}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden px-5 py-24 sm:px-8 lg:px-12 lg:py-36">
          <div className="absolute inset-y-0 left-[7.5%] w-px bg-border/50" aria-hidden="true" />
          <div className="absolute inset-y-0 right-[7.5%] w-px bg-border/50" aria-hidden="true" />
          <div className="relative mx-auto max-w-[1296px] text-center">
            <p className="font-mono text-xs uppercase tracking-[0.14em] text-accent">Stop changing the ad first</p>
            <h2 className="mx-auto mt-6 max-w-5xl text-[clamp(3rem,7vw,7.5rem)] font-extrabold leading-[0.88] tracking-[-0.065em] text-fg">
              Check the page<br />before the next click.
            </h2>
            <p className="mx-auto mt-8 max-w-xl text-lg leading-8 text-fg-muted">
              Free. No signup. Nine observable conditions ranked by priority.
            </p>
            <Link href="/audit?utm_source=homepage&utm_medium=internal" className="mx-auto mt-9 inline-flex min-h-16 items-center gap-8 rounded bg-accent px-7 font-bold text-bg hover:opacity-90">
              Run free audit <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </section>
      </main>
    </>
  )
}
