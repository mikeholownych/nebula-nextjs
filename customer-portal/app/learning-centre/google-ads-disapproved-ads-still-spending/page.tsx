import type { Metadata } from 'next'
import Link from 'next/link'
import { createArticleSchema } from '../../lib/schema'
import ArticleFaq from '../ArticleFaq'

export const metadata: Metadata = {
  title: 'Google Ads Disapproved But Still Spending: What To Do | Nebula Components',
  description: 'Google Ads can disapprove ads while still charging for impressions. Here is how to identify and stop this from happening.',
  alternates: { canonical: 'https://nebulacomponents.com/learning-centre/google-ads-disapproved-ads-still-spending' },
}

const articleSchema = createArticleSchema({
  headline: 'Fix Landing Page Policy Issues to Stop Google Ads Disapproval',
  description: 'Google Ads can disapprove ads while still charging for impressions. Here is how to identify and stop this from happening.',
  url: 'https://nebulacomponents.com/learning-centre/google-ads-disapproved-ads-still-spending',
  publishedDate: '2026-01-01',
  modifiedDate: '2026-07-27',
})

export default function LearningCentrePage() {
  return (
    <main id="main-content" className="min-h-screen bg-bg pt-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      <div className="mx-auto max-w-3xl px-6 py-14">
        <Link href="/learning-centre" className="text-sm font-semibold text-accent hover:text-fg transition-colors">
          ← Learning Centre
        </Link>

        <div className="mt-8 rounded-md border border-border bg-bg-panel p-8 md:p-10">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-accent">
            Google Ads Leaks · Disapproved But Still Spending
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-fg md:text-5xl">
            Fix Landing Page Policy Issues to Stop Google Ads Disapproval
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-fg-muted">
            When Google Ads disapproves your ad, most advertisers check the ad copy. But the landing page itself can trigger policy violations that not only block the ad-but continue costing you money while the ad runs in a disabled state.
          </p>
            <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Link
                href="/audit?utm_source=learning-centre-google-ads-disapproved-ads-still-spending&utm_medium=hero-cta"
                className="inline-flex min-h-[44px] items-center justify-center rounded bg-accent px-6 py-3 text-sm font-semibold text-bg transition-opacity hover:opacity-85"
              >
                Get your free audit →
              </Link>
              <Link
                href="/repair-sprint"
                className="inline-flex min-h-[44px] items-center justify-center rounded border border-border px-5 py-3 text-sm font-medium text-fg-muted transition-colors hover:border-fg-muted hover:text-fg"
              >
                Explore $97 Repair Sprint
              </Link>
            </div>
        </div>

        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">Hidden landing page violations</h2>
          <p className="leading-relaxed text-fg-muted">
            Google&apos;s landing page policies go beyond what appears on screen. Common hidden triggers include:
          </p>
          <ul className="mt-4 space-y-2 text-fg-muted">
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <span><strong className="font-semibold">Redirects:</strong> Destination URLs that redirect through multiple hops-especially if they mask the final destination-violate transparency policies. A clean path from ad click to final page is required.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <span><strong className="font-semibold">Bridge pages:</strong> Pages that exist solely to funnel traffic to another site with little or no original content. Affiliate links are fine; pages with no substantive added value are not.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <span><strong className="font-semibold">Arbitrage:</strong> Landing pages overloaded with ads where the sole purpose appears to be generating ad revenue rather than providing genuine user value.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <span><strong className="font-semibold">Malware or unwanted software:</strong> Even if your site is clean, third-party scripts, expired SSL certificates, or compromised plugins can trigger immediate disapproval.</span>
            </li>
          </ul>
          <p className="mt-4 leading-relaxed text-fg-muted">
            The issue is that these violations are often invisible to the advertiser. The page loads. It looks fine. But Google&apos;s automated crawlers detect the underlying policy breach.
          </p>
        </section>

        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">Why the ad can keep spending after disapproval</h2>
          <p className="leading-relaxed text-fg-muted">
            The specific mechanic advertisers miss: disapproval and delivery are not always the same
            switch. A few paths let spend continue after a violation is detected:
          </p>
          <ul className="mt-4 space-y-2 text-fg-muted">
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <span><strong className="font-semibold">Delayed re-crawl:</strong> Google&apos;s policy crawler does not re-check a live landing page on every impression. A page that passed review, then broke (expired cert, a redirect added later, a plugin update), can keep serving and accruing cost until the next crawl catches the change.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <span><strong className="font-semibold">Ad group vs. ad-level scope:</strong> A violation flagged on one ad in a group does not always immediately pause sibling ads pointing to the same broken page - they can keep spending until each is individually reviewed.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <span><strong className="font-semibold">&quot;Limited&quot; vs. &quot;Disapproved&quot; status:</strong> A &quot;Limited&quot; policy status still serves in some geos or contexts while under review - it is easy to read this as fully paused when it is not.</span>
            </li>
          </ul>
          <p className="mt-4 leading-relaxed text-fg-muted">
            Check the Recommendations and Policy Manager sections of the account directly rather than
            assuming a disapproved label always means zero delivery - the gap between the two is
            where budget quietly leaks.
          </p>
        </section>

        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">Account-level fallout</h2>
          <p className="leading-relaxed text-fg-muted">
            A single landing page violation can cascade beyond the ad itself:
          </p>
          <ul className="mt-4 space-y-2 text-fg-muted">
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <span><strong className="font-semibold">Ad disapprovals compound:</strong> Multiple ads pointing to the same violating page all get flagged simultaneously.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <span><strong className="font-semibold">Account standing degrades:</strong> Repeated landing page violations lower your account&apos;s policy compliance score, leading to stricter scrutiny on future ads.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <span><strong className="font-semibold">Budget drain during review:</strong> Some disapproved ads continue accruing costs while under review or appeal-especially if the violation is borderline and being manually evaluated.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              <span><strong className="font-semibold">Recovery takes time:</strong> Fixing the page doesn&apos;t instantly restore the ad. Each disapproved ad must be resubmitted for review, adding days to campaign timelines.</span>
            </li>
          </ul>
          <p className="mt-4 leading-relaxed text-fg-muted">
            Preventing the violation before it triggers review is reliably effective - and far less disruptive than recovering after suspension.
          </p>
        </section>

        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">Checklist for the page</h2>
          <p className="leading-relaxed text-fg-muted">
            Before launching or troubleshooting a disapproved ad, run through these landing page checks:
          </p>
          <ul className="mt-4 space-y-2 text-fg-muted">
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              Does the destination URL load without redirecting through intermediate domains?
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              Is the page content original and substantial-not just links to somewhere else?
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              Are affiliate links clearly disclosed and surrounded by genuine added value?
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              Is SSL valid with no mixed-content warnings or expired certificates?
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              Do all third-party scripts load from reputable sources?
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              Is the page free from excessive advertising blocks above the fold?
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              Does the page load acceptably on mobile devices?
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
              Is there clear contact information and a privacy policy visible?
            </li>
          </ul>
        </section>

        <section className="mt-6 rounded-2xl border border-accent/40 bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">Find the violation before Google does</h2>
          <p className="mb-6 leading-relaxed text-fg-muted">
            The free Nebula audit identifies likely page-side leaks, including policy-relevant issues
            like redirects and expired certificates. The $97 One-Leak Repair Sprint supplies
            a tailored change for one high-confidence page-level finding. You or your developer implements it,
            and the 30-day re-audit verifies the page condition. It does not promise conversion lift or account reinstatement.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link href="/audit?utm_source=learning-centre&utm_medium=organic-content" className="inline-flex rounded bg-accent px-6 py-3 font-semibold text-bg hover:opacity-85 hover:bg-accent transition-colors">
              Run the free audit
            </Link>
            <Link href="/learning-centre/google-ads-clicks-no-sales" className="inline-flex rounded border border-accent px-6 py-3 font-semibold text-accent hover:bg-accent-dim transition-colors">
              Check clicks no sales
            </Link>
          </div>
        </section>

        <ArticleFaq
          faqItems={[
            {
              question: 'Why is my disapproved ad still spending money?',
              answer:
                'Disapproval and delivery are not always the same switch. Google may not re-crawl a live page on every impression, so a page that passed review and then broke can keep serving until the next crawl. A limited policy status can also keep serving in some contexts while under review.',
            },
            {
              question: 'What landing page issues trigger a Google Ads disapproval?',
              answer:
                'Common hidden triggers include redirects that mask the final destination, bridge pages with little original content, pages overloaded with ads, and malware or unwanted software from third-party scripts or expired certificates. These are often invisible to the advertiser because the page still loads and looks fine.',
            },
            {
              question: 'How do I check whether my page is the cause of the disapproval?',
              answer:
                'Run through the landing page checklist: confirm the destination URL loads without intermediate redirects, the content is original and substantial, affiliate links are disclosed, SSL is valid with no mixed content, third-party scripts come from reputable sources, and contact and privacy information is visible.',
            },
            {
              question: 'Does fixing the page instantly restore my ad?',
              answer:
                'No. Fixing the page does not automatically restore delivery. Each disapproved ad must be resubmitted for review, which can add days to the timeline. Preventing the violation before it triggers review is more reliable and less disruptive than recovering after the fact.',
            },
          ]}
        />

        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <h2 className="mb-4 text-2xl font-bold text-fg">Related leak checks</h2>
          <div className="space-y-1">
            <Link href="/learning-centre/google-ads-clicks-no-sales" className="block border-b border-border py-2.5 text-fg-muted transition-colors last:border-0 hover:text-accent">
              Google Ads Clicks But No Sales: Check The Page Before Budget
            </Link>
            <Link href="/learning-centre/google-ads-quality-score-low" className="block border-b border-border py-2.5 text-fg-muted transition-colors last:border-0 hover:text-accent">
              Google Ads Quality Score Low? Fix The Page Before The Account
            </Link>
            <Link href="/learning-centre/landing-page-not-converting" className="block border-b border-border py-2.5 text-fg-muted transition-colors last:border-0 hover:text-accent">
              Landing Page Not Converting? Diagnose These 5 Leaks First
            </Link>
            <Link href="/learning-centre/high-cpc-low-conversion" className="block border-b border-border py-2.5 text-fg-muted transition-colors last:border-0 hover:text-accent">
              High CPC, Low Conversion: Stop Optimizing The Wrong Layer
            </Link>
            <Link href="/learning-centre/traffic-but-no-form-fills" className="block border-b border-border py-2.5 text-fg-muted transition-colors last:border-0 hover:text-accent">
              Traffic But No Form Fills: The Form Is Usually Not The First Leak
            </Link>
          </div>
        </section>
      </div>
    </main>
  )
}
