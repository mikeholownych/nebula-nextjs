import type { Metadata } from 'next'
import Link from 'next/link'
import { createArticleSchema } from '../../lib/schema'

export const metadata: Metadata = {
  title: 'Ghost Variant: When A/B Test Winners Are False Positives',
  description:
    'A ghost variant is when your control quietly breaks mid-test - a missing pixel, a truncated H1, a 404ing social proof block - and the "winning" variant wins by default. Here is how to detect it before you ship.',
  alternates: {
    canonical: 'https://nebulacomponents.com/learning-centre/ghost-variant-ab-test',
  },
}

const articleSchema = createArticleSchema({
  headline: 'The Ghost Variant: When Your A/B Test Winner Is a False Positive',
  description:
    'A ghost variant is when your control quietly breaks mid-test - a missing pixel, a truncated H1, a 404ing social proof block - and the "winning" variant wins by default. Here is how to detect it before you ship.',
  url: 'https://nebulacomponents.com/learning-centre/ghost-variant-ab-test',
  publishedDate: '2026-07-25',
  modifiedDate: '2026-07-25',
})

export default function GhostVariantAbTestPage() {
  return (
    <main id="main-content" className="min-h-screen bg-bg pt-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      <div className="mx-auto max-w-3xl px-6 py-14">
        <Link
          href="/learning-centre"
          className="text-sm font-semibold text-accent hover:text-fg transition-colors"
        >
          ← Learning Centre
        </Link>

        {/* Opening panel */}
        <div className="mt-8 rounded-md border border-border bg-bg-panel p-8 md:p-10">
          <span className="inline-block rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-accent">
            Landing Page Leaks
          </span>
          <h1 className="mt-4 text-3xl font-bold leading-tight text-fg md:text-4xl">
            The Ghost Variant: When Your A/B Test Winner Is a False Positive
          </h1>
          <p className="mt-4 text-lg text-fg-muted leading-relaxed">
            Your test platform declared a winner. Variant B beat the control by 14%. You ship it.
            What you never checked: variant A - your control - stopped rendering its social proof
            section on mobile three days into the test. The pixel misfired on Safari. The H1
            truncated. Variant B didn't win. The control lost. That distinction matters, because
            now variant B is your new control, and you have no idea what you're actually
            measuring.
          </p>
        </div>

        {/* Section 1: What a ghost variant is */}
        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <h2 className="text-xl font-bold text-fg">
            What a Ghost Variant Is: The False Positive Win
          </h2>
          <p className="mt-4 text-fg-muted leading-relaxed">
            A ghost variant is a control that has silently degraded during the test window. It is
            not visibly broken - nobody files a bug report, no monitoring alert fires - but one or
            more elements have failed in a way that suppresses conversions specifically for that
            variant. The challenger variant, running clean, appears to win. The test platform
            reports a statistically significant uplift. You ship.
          </p>
          <p className="mt-4 text-fg-muted leading-relaxed">
            The term comes from the fact that the control looks fine at a glance. Open it in
            Chrome on a desktop. Everything renders. But on mobile Safari, the trust badge image
            returns a 404. On a slow 4G connection, the conversion tracking script loads after
            the user has already bounced. The ghost is invisible unless you specifically go
            looking for it.
          </p>
          <p className="mt-4 text-fg-muted leading-relaxed">
            This is not a rare edge case. Any test running longer than a week across multiple
            traffic sources is exposed to it. CMS deployments happen. CDN configs get updated.
            Dependencies change. The control you started the test with is not necessarily the
            control that finished it.
          </p>
        </section>

        {/* Section 2: How this happens */}
        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <h2 className="text-xl font-bold text-fg">
            How This Happens: Four Named Failure Modes
          </h2>
          <p className="mt-4 text-fg-muted leading-relaxed">
            <strong className="text-fg">CDN cache poisoning during the test window.</strong> You
            update a component, purge the cache, the CDN rehydrates from origin - but only for
            one variant. The other variant's cached version is stale. Now the control is serving
            a three-week-old JavaScript bundle that conflicts with a library you updated. The
            symptom is a silent JS error that prevents your form submit handler from firing.
          </p>
          <p className="mt-4 text-fg-muted leading-relaxed">
            <strong className="text-fg">CMS content edits mid-test.</strong> Someone updates the
            hero headline for a campaign. They edit the page, not the variant. The test platform
            is A/B testing URLs, not snapshots. The control's H1 now reads differently than it
            did on day one. Your test is no longer measuring what you thought it was measuring.
            If the new headline is weaker, the control's conversion rate drops - not because your
            hypothesis was wrong, but because a content editor made a change nobody logged.
          </p>
          <p className="mt-4 text-fg-muted leading-relaxed">
            <strong className="text-fg">Script loading order on mobile.</strong> Your A/B test
            platform injects a snippet that loads asynchronously. On desktop, the rest of the
            page loads fast enough that the snippet resolves before user interaction. On mobile,
            on a congested network, the page is interactive before the snippet fires. The
            platform's conversion event never registers for those sessions. Your control's mobile
            conversion rate looks low. It's not - it's just not being counted.
          </p>
          <p className="mt-4 text-fg-muted leading-relaxed">
            <strong className="text-fg">HTTPS migration leftovers.</strong> You migrated to HTTPS
            six months ago. Most assets updated. One didn't: a social proof widget that pulls
            logos from a third-party CDN over HTTP. Modern browsers block mixed content.
            Desktop Chrome blocked it quietly at migration time; nobody noticed because the
            widget has a CSS fallback. But on the control variant, that blank space where five
            customer logos used to appear is costing you conversions - and has been since you
            started the test.
          </p>
        </section>

        {/* Section 3: Why standard analytics won't catch it */}
        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <h2 className="text-xl font-bold text-fg">
            Why Standard Analytics Won't Catch It
          </h2>
          <p className="mt-4 text-fg-muted leading-relaxed">
            Your A/B testing platform - whether it's Optimizely, VWO, Google Optimize, or a
            homegrown split-test setup - measures one thing: did a session assigned to variant X
            result in a conversion event? It does not audit the page state at the moment of that
            session. It does not check whether the H1 rendered, whether the trust badge loaded,
            or whether the form submit handler was reachable. It counts events.
          </p>
          <p className="mt-4 text-fg-muted leading-relaxed">
            Google Analytics and Mixpanel are the same. They record what happened in a session,
            not why the page was in the state it was in when that session occurred. A session
            where the social proof section 404ed looks identical in your analytics dashboard to
            a session where it loaded perfectly. Both show a bounce. Neither tells you the cause.
          </p>
          <p className="mt-4 text-fg-muted leading-relaxed">
            Synthetic monitoring tools like Pingdom or UptimeRobot check availability - is the
            URL returning a 200? They do not check whether specific elements within the page
            rendered correctly. Your page returns a 200. The tracking pixel inside it silently
            failed. Pingdom reports green. Your control is a ghost.
          </p>
          <p className="mt-4 text-fg-muted leading-relaxed">
            The only tool that catches this is one that renders the page - both variants,
            across multiple viewport sizes and network conditions - and checks element-level
            health signals: payload size, H1 presence, image load status, meta tag completeness,
            and script execution order. That is not a monitoring product. That is a page audit.
          </p>
        </section>

        {/* Section 4: Compounding damage */}
        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <h2 className="text-xl font-bold text-fg">
            The Compounding Damage: Baseline Rot
          </h2>
          <p className="mt-4 text-fg-muted leading-relaxed">
            Shipping a false positive winner is bad. What happens next is worse. The variant you
            shipped - variant B, the accidental winner - is now your new control. Your next test
            will measure against it. If it also has a silent defect, your next winner will be
            even more degraded relative to your actual best possible page. You are not
            optimising upward. You are optimising sideways on a declining baseline.
          </p>
          <p className="mt-4 text-fg-muted leading-relaxed">
            Over six to twelve months of continuous testing, this compounds. Teams running
            high-velocity A/B programs often report that their conversion rate has been flat
            for two years despite shipping dozens of winners. Ghost variants are frequently
            the cause. The testing cadence is healthy. The baseline hygiene is not.
          </p>
          <p className="mt-4 text-fg-muted leading-relaxed">
            There is also a team-level cost. Engineers and designers spend weeks building
            variants, writing copy, setting up tracking. When the result is a ghost positive,
            that work produces no real signal. You cannot learn from a test where the control
            was broken. The experimental infrastructure is sound; the page underneath it is not.
          </p>
        </section>

        {/* Section 5: How to detect it */}
        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <h2 className="text-xl font-bold text-fg">
            How to Detect a Ghost Variant Before You Declare a Winner
          </h2>
          <p className="mt-4 text-fg-muted leading-relaxed">
            The protocol is simple and should be non-negotiable before any test call: audit
            both variants, not just the winner.
          </p>
          <p className="mt-4 text-fg-muted leading-relaxed">
            <strong className="text-fg">Check for payload differences between variants.</strong>{' '}
            If variant A's HTML payload is 40kb and variant B's is 38kb, and you did not
            deliberately remove content, something is missing from one of them. A payload
            diff between variants is often the first signal that a rendering failure has
            occurred silently.
          </p>
          <p className="mt-4 text-fg-muted leading-relaxed">
            <strong className="text-fg">Render both variants on mobile Safari and Chrome.</strong>{' '}
            Take a full-page screenshot. Eyeball the visual diff. Trust badge missing? Form
            button outside the viewport? H1 truncated with an ellipsis? These are things no
            analytics tool will surface, but a two-minute visual audit will catch immediately.
          </p>
          <p className="mt-4 text-fg-muted leading-relaxed">
            <strong className="text-fg">Verify tracking pixel parity.</strong> Open both variant
            URLs in a network inspector. Count the pixel fires. If the control fires three
            pixels and the challenger fires four - or vice versa - your conversion data is not
            measuring the same thing. You cannot declare a winner from asymmetric tracking.
          </p>
          <p className="mt-4 text-fg-muted leading-relaxed">
            <strong className="text-fg">Audit metadata and Open Graph tags.</strong> A CDN cache
            flush can wipe a page's meta description or og:image. If a significant portion of
            your traffic comes from social shares or email, missing metadata changes the
            click-through population before they even reach the variant. The test is already
            compromised before visitors even reach the variant.
          </p>
          <p className="mt-4 text-fg-muted leading-relaxed">
            <strong className="text-fg">Check H1 uniqueness and render fidelity.</strong> An H1
            that truncates on mobile - because a CSS update removed{' '}
            <code className="rounded bg-bg px-1 py-0.5 text-sm font-mono text-fg">
              overflow-wrap: break-word
            </code>{' '}
            - is still technically present in the DOM. Your SEO tools report it as present.
            But visually, users see a broken headline that ends mid-sentence. That is a
            rendering failure, not a content failure. Auditing the DOM alone does not catch it.
          </p>
        </section>

        {/* Section 6: What to do if you have one */}
        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <h2 className="text-xl font-bold text-fg">
            What to Do If You Think You Have a Ghost Variant
          </h2>
          <p className="mt-4 text-fg-muted leading-relaxed">
            Do not ship the winner. Stop the test.
          </p>
          <p className="mt-4 text-fg-muted leading-relaxed">
            Audit the control - the original variant A - against a known-clean version of the
            page. If you have a Git history or a CMS version history, pull up the page state
            from the day the test started and compare it to the current control. Look for
            payload differences, element-level changes, and tracking discrepancies.
          </p>
          <p className="mt-4 text-fg-muted leading-relaxed">
            If you find a defect, fix it. Then restart the test from a clean baseline - both
            variants freshly deployed, both audited before traffic is split. Do not attempt to
            statistically adjust for the ghost period. The contaminated data cannot be salvaged;
            it will only introduce noise into your analysis. Cut it and start clean.
          </p>
          <p className="mt-4 text-fg-muted leading-relaxed">
            If you cannot find a specific defect but the numbers looked suspiciously clean -
            very fast statistical significance, conversion lift concentrated on one device
            category, or a sudden uplift spike mid-test - treat it as a ghost until proven
            otherwise. A healthy skepticism about easy wins is not pessimism; it is the correct
            Bayesian prior when you know how frequently pages degrade silently.
          </p>
          <p className="mt-4 text-fg-muted leading-relaxed">
            Going forward, make pre-declaration audits a blocking step in your testing process.
            The test platform cannot do this for you. It has to be an explicit check, run on
            both URLs, before any result is called.
          </p>
        </section>

        {/* CTA section */}
        <section className="mt-6 rounded-2xl border border-accent/40 bg-bg-panel p-8">
          <h2 className="text-xl font-bold text-fg">
            Audit Both Variants Before You Declare a Winner
          </h2>
          <p className="mt-4 text-fg-muted leading-relaxed">
            Before you declare a winner, audit both variants. The Nebula audit catches rendering
            failures, payload bloat, and metadata mismatches in under two minutes: giving you the
            element-level health signals your test platform was never designed to surface.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/audit?utm_source=learning-centre&utm_medium=organic-content"
              className="inline-flex items-center justify-center rounded bg-accent px-6 py-3 text-sm font-semibold text-white transition-colors hover:opacity-85 hover:bg-accent"
            >
              Run Your Free Audit →
            </Link>
            <Link
              href="/learning-centre/mobile-landing-page-leaks"
              className="inline-flex items-center justify-center rounded-xl border border-border px-6 py-3 text-sm font-semibold text-fg transition-colors hover:border-accent hover:text-accent"
            >
              Mobile Landing Page Leaks
            </Link>
          </div>
        </section>

        {/* Related links section */}
        <section className="mt-6 rounded-md border border-border bg-bg-panel p-8">
          <h2 className="text-xl font-bold text-fg">Related Articles</h2>
          <ul className="mt-4 space-y-3">
            <li>
              <Link
                href="/learning-centre/landing-page-not-converting"
                className="text-sm font-semibold text-accent hover:text-fg transition-colors"
              >
                Why Your Landing Page Isn't Converting →
              </Link>
              <p className="mt-1 text-sm text-fg-muted">
                The structural and technical reasons conversion rates stall - beyond copy and
                design.
              </p>
            </li>
            <li>
              <Link
                href="/learning-centre/landing-page-load-time-slow"
                className="text-sm font-semibold text-accent hover:text-fg transition-colors"
              >
                Landing Page Load Time Is Slow →
              </Link>
              <p className="mt-1 text-sm text-fg-muted">
                How payload bloat and render-blocking assets suppress conversions before a user
                reads a single word.
              </p>
            </li>
            <li>
              <Link
                href="/learning-centre/mobile-landing-page-leaks"
                className="text-sm font-semibold text-accent hover:text-fg transition-colors"
              >
                Mobile Landing Page Leaks →
              </Link>
              <p className="mt-1 text-sm text-fg-muted">
                The silent rendering failures that only appear on mobile - and the specific
                elements most likely to break.
              </p>
            </li>
            <li>
              <Link
                href="/learning-centre/traffic-but-no-form-fills"
                className="text-sm font-semibold text-accent hover:text-fg transition-colors"
              >
                Traffic But No Form Fills →
              </Link>
              <p className="mt-1 text-sm text-fg-muted">
                When sessions are high and submissions are zero, the problem is almost always
                technical - not persuasive.
              </p>
            </li>
          </ul>
        </section>
      </div>
    </main>
  )
}
